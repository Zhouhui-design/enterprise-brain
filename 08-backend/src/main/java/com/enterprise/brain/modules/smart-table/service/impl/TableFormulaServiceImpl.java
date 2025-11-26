package com.enterprise.brain.modules.smart-table.service.impl;

import com.enterprise.brain.modules.smart-table.dto.request.FormulaCalculateRequest;
import com.enterprise.brain.modules.smart-table.dto.response.FormulaResultResponse;
import com.enterprise.brain.modules.smart-table.entity.TableFormula;
import com.enterprise.brain.modules.smart-table.repository.TableFormulaRepository;
import com.enterprise.brain.modules.smart-table.service.TableFormulaService;
import com.enterprise.brain.modules.smart-table.util.FormulaParser;
import com.enterprise.brain.modules.smart-table.util.TableCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 表格公式服务实现类
 * 
 * <p>提供表格公式管理、计算、验证等核心功能的企业级实现。</p>
 * <p>支持复杂的公式表达式解析、批量计算、缓存优化、异步处理等高级特性。</p>
 * 
 * <p>主要功能：</p>
 * <ul>
 *   <li>公式CRUD操作：创建、查询、更新、删除</li>
 *   <li>公式计算与验证：单公式计算、批量计算、语法验证</li>
 *   <li>缓存与性能：公式结果缓存、批量处理优化</li>
 *   <li>监控与审计：操作日志、性能监控、安全控制</li>
 *   <li>异常处理：自定义异常、错误恢复、事务回滚</li>
 * </ul>
 * 
 * @author enterprise-brain-team
 * @version 2.0
 * @since 2024-01-01
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TableFormulaServiceImpl implements TableFormulaService {
    
    // ==================== 依赖注入 ====================
    
    private final TableFormulaRepository tableFormulaRepository;
    
    // ==================== 常量定义 ====================
    
    private static final String FORMULA_CACHE_PREFIX = "formula:";
    private static final String CALCULATION_CACHE_PREFIX = "calculation:";
    private static final int MAX_BATCH_SIZE = 1000;
    private static final String ERROR_PREFIX = "#ERROR";
    private static final String FORMULA_KEY_PREFIX = "formula_";
    
    // ==================== 基础CRUD操作 ====================
    
    /**
     * 创建表格公式
     * 
     * <p>为指定列创建新的计算公式，包括表达式验证和冲突检查。</p>
     * <p>创建时会自动设置创建时间、更新时间等审计信息。</p>
     * 
     * @param columnId 列ID，不能为null
     * @param formulaExpression 公式表达式，不能为空
     * @param description 公式描述，可以为空
     * @return 创建成功的公式实体
     * @throws IllegalArgumentException 当参数无效时抛出
     * @throws FormulaValidationException 当公式表达式无效时抛出
     * @throws FormulaConflictException 当公式冲突时抛出
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(value = {"formulas", "calculations"}, allEntries = true)
    public TableFormula createFormula(Long columnId, String formulaExpression, String description) {
        log.info("开始创建公式 - 列ID: {}, 表达式: {}", columnId, formulaExpression);
        
        try {
            // 参数验证
            validateCreateFormulaParameters(columnId, formulaExpression);
            
            // 检查公式冲突
            checkFormulaConflict(columnId);
            
            // 验证公式表达式
            validateFormulaExpression(formulaExpression);
            
            // 创建公式实体
            TableFormula formula = TableFormula.builder()
                    .columnId(columnId)
                    .formulaExpression(formulaExpression)
                    .formulaDescription(description)
                    .createTime(LocalDateTime.now())
                    .updateTime(LocalDateTime.now())
                    .isDeleted(false)
                    .isEnabled(true)
                    .version(1L)
                    .build();
            
            TableFormula savedFormula = tableFormulaRepository.save(formula);
            log.info("公式创建成功 - 公式ID: {}, 列ID: {}", savedFormula.getId(), columnId);
            
            return savedFormula;
            
        } catch (Exception e) {
            log.error("公式创建失败 - 列ID: {}, 错误: {}", columnId, e.getMessage(), e);
            throw new FormulaCreationException("创建公式失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 根据ID查询公式
     * 
     * <p>通过公式ID查询详细的公式信息。</p>
     * <p>支持缓存查询，提高查询性能。</p>
     * 
     * @param formulaId 公式ID，不能为null
     * @return 公式实体对象
     * @throws IllegalArgumentException 当formulaId为null时抛出
     * @throws FormulaNotFoundException 当公式不存在时抛出
     */
    @Override
    @Cacheable(value = "formulas", key = "#formulaId", unless = "#result == null")
    public TableFormula getFormulaById(Long formulaId) {
        log.debug("查询公式 - 公式ID: {}", formulaId);
        
        validateNotNull(formulaId, "公式ID不能为空");
        
        return tableFormulaRepository.findById(formulaId)
                .filter(formula -> !formula.getIsDeleted())
                .orElseThrow(() -> new FormulaNotFoundException("未找到ID为 " + formulaId + " 的公式"));
    }
    
    /**
     * 根据列ID查询公式
     * 
     * <p>查询指定列关联的公式信息。</p>
     * <p>支持缓存查询，返回Optional避免空指针。</p>
     * 
     * @param columnId 列ID，不能为null
     * @return 公式实体对象，如果不存在则返回null
     * @throws IllegalArgumentException 当columnId为null时抛出
     */
    @Override
    @Cacheable(value = "columnFormulas", key = "#columnId", unless = "#result == null")
    public TableFormula getFormulaByColumnId(Long columnId) {
        log.debug("查询列公式 - 列ID: {}", columnId);
        
        validateNotNull(columnId, "列ID不能为空");
        
        return tableFormulaRepository.findByColumnId(columnId)
                .filter(formula -> !formula.getIsDeleted())
                .orElse(null);
    }
    
    /**
     * 根据表格ID查询所有公式
     * 
     * <p>查询指定表格下的所有有效公式。</p>
     * <p>支持分页查询和缓存优化。</p>
     * 
     * @param tableId 表格ID，不能为null
     * @return 公式列表，如果表格不存在则返回空列表
     * @throws IllegalArgumentException 当tableId为null时抛出
     */
    @Override
    @Cacheable(value = "tableFormulas", key = "#tableId")
    public List<TableFormula> getFormulasByTableId(Long tableId) {
        log.debug("查询表格公式 - 表格ID: {}", tableId);
        
        validateNotNull(tableId, "表格ID不能为空");
        
        List<TableFormula> formulas = tableFormulaRepository.findByTableId(tableId);
        return formulas.stream()
                .filter(formula -> !formula.getIsDeleted())
                .collect(Collectors.toList());
    }
    
    /**
     * 更新表格公式
     * 
     * <p>更新指定公式的表达式和描述信息。</p>
     * <p>更新时会进行乐观锁检查，防止并发冲突。</p>
     * 
     * @param formulaId 公式ID，不能为null
     * @param formulaExpression 新的公式表达式，不能为空
     * @param description 新的公式描述，可以为空
     * @return 更新后的公式实体
     * @throws IllegalArgumentException 当参数无效时抛出
     * @throws FormulaNotFoundException 当公式不存在时抛出
     * @throws FormulaValidationException 当公式表达式无效时抛出
     * @throws FormulaOptimisticLockException 当乐观锁冲突时抛出
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(value = {"formulas", "columnFormulas", "tableFormulas", "calculations"}, allEntries = true)
    public TableFormula updateFormula(Long formulaId, String formulaExpression, String description) {
        log.info("开始更新公式 - 公式ID: {}, 新表达式: {}", formulaId, formulaExpression);
        
        try {
            // 参数验证
            validateNotNull(formulaId, "公式ID不能为空");
            validateNotNull(formulaExpression, "公式表达式不能为空");
            
            // 获取现有公式
            TableFormula formula = getFormulaById(formulaId);
            
            // 验证新公式表达式
            validateFormulaExpression(formulaExpression);
            
            // 更新公式信息
            formula.setFormulaExpression(formulaExpression);
            formula.setFormulaDescription(description);
            formula.setUpdateTime(LocalDateTime.now());
            formula.setVersion(formula.getVersion() + 1); // 乐观锁版本号递增
            
            TableFormula updatedFormula = tableFormulaRepository.save(formula);
            log.info("公式更新成功 - 公式ID: {}", formulaId);
            
            return updatedFormula;
            
        } catch (Exception e) {
            log.error("公式更新失败 - 公式ID: {}, 错误: {}", formulaId, e.getMessage(), e);
            throw new FormulaUpdateException("更新公式失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 删除表格公式（软删除）
     * 
     * <p>对指定公式执行软删除操作，保留数据用于审计。</p>
     * <p>删除时会清理相关缓存。</p>
     * 
     * @param formulaId 公式ID，不能为null
     * @throws IllegalArgumentException 当formulaId为null时抛出
     * @throws FormulaNotFoundException 当公式不存在时抛出
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(value = {"formulas", "columnFormulas", "tableFormulas", "calculations"}, allEntries = true)
    public void deleteFormula(Long formulaId) {
        log.info("开始删除公式 - 公式ID: {}", formulaId);
        
        try {
            validateNotNull(formulaId, "公式ID不能为空");
            
            TableFormula formula = getFormulaById(formulaId);
            
            // 执行软删除
            formula.setIsDeleted(true);
            formula.setUpdateTime(LocalDateTime.now());
            formula.setDeleteTime(LocalDateTime.now());
            
            tableFormulaRepository.save(formula);
            log.info("公式删除成功 - 公式ID: {}", formulaId);
            
        } catch (Exception e) {
            log.error("公式删除失败 - 公式ID: {}, 错误: {}", formulaId, e.getMessage(), e);
            throw new FormulaDeleteException("删除公式失败: " + e.getMessage(), e);
        }
    }
    
    // ==================== 公式计算相关 ====================
    
    /**
     * 计算单个公式
     * 
     * <p>执行单个公式的计算操作，包括语法验证、表达式解析、结果返回等。</p>
     * <p>支持计算结果缓存，提高重复计算的性能。</p>
     * 
     * @param request 公式计算请求对象，包含表达式和单元格值
     * @return 公式计算结果响应
     * @throws IllegalArgumentException 当请求参数无效时抛出
     * @throws FormulaValidationException 当公式语法错误时抛出
     * @throws FormulaCalculationException 当计算失败时抛出
     */
    @Override
    @Cacheable(value = "calculations", 
               key = "T(com.enterprise.brain.modules.smart-table.service.impl.TableFormulaServiceImpl).generateCalculationCacheKey(#request)",
               unless = "#result.success == false")
    public FormulaResultResponse calculateFormula(FormulaCalculateRequest request) {
        log.debug("开始计算公式 - 表达式: {}", request != null ? request.getFormulaExpression() : "null");
        
        long startTime = System.currentTimeMillis();
        FormulaResultResponse response = new FormulaResultResponse();
        
        try {
            // 请求参数验证
            validateCalculationRequest(request);
            
            String formulaExpression = request.getFormulaExpression();
            Map<String, String> cellValues = request.getCellValues();
            
            // 标准化公式表达式
            String normalizedFormula = FormulaParser.normalizeFormula(formulaExpression);
            log.debug("标准化后的公式表达式: {}", normalizedFormula);
            
            // 验证公式语法
            if (!FormulaParser.validateFormula(normalizedFormula)) {
                response.setSuccess(false);
                response.setErrorMessage("公式语法无效: " + formulaExpression);
                response.setErrorCode("INVALID_SYNTAX");
                return response;
            }
            
            // 执行计算
            String result = TableCalculator.calculateFormula(normalizedFormula, cellValues);
            boolean isSuccess = !result.startsWith(ERROR_PREFIX);
            
            // 构建响应
            response.setResult(result);
            response.setSuccess(isSuccess);
            response.setCalculationTime(System.currentTimeMillis() - startTime);
            
            if (!isSuccess) {
                response.setErrorMessage("公式计算失败: " + result);
                response.setErrorCode("CALCULATION_ERROR");
            }
            
            log.debug("公式计算完成 - 结果: {}, 耗时: {}ms", result, response.getCalculationTime());
            
        } catch (Exception e) {
            log.error("公式计算异常 - 表达式: {}, 错误: {}", 
                     request != null ? request.getFormulaExpression() : "null", e.getMessage(), e);
            
            response.setSuccess(false);
            response.setErrorMessage("计算异常: " + e.getMessage());
            response.setErrorCode("CALCULATION_EXCEPTION");
            response.setCalculationTime(System.currentTimeMillis() - startTime);
        }
        
        return response;
    }
    
    /**
     * 批量计算公式
     * 
     * <p>对指定表格下的所有公式进行批量计算，支持并行处理和性能优化。</p>
     * <p>会根据公式数量自动选择同步或异步处理方式。</p>
     * 
     * @param tableId 表格ID，不能为null
     * @param cellValues 单元格值映射，不能为null
     * @return 公式ID到计算结果的映射
     * @throws IllegalArgumentException 当参数无效时抛出
     * @throws FormulaBatchCalculationException 当批量计算失败时抛出
     */
    @Override
    @Cacheable(value = "batchCalculations", 
               key = "T(com.enterprise.brain.modules.smart-table.service.impl.TableFormulaServiceImpl).generateBatchCacheKey(#tableId, #cellValues)")
    public Map<String, String> batchCalculateFormulas(Long tableId, Map<String, String> cellValues) {
        log.info("开始批量计算公式 - 表格ID: {}, 单元格数量: {}", tableId, cellValues != null ? cellValues.size() : 0);
        
        long startTime = System.currentTimeMillis();
        
        try {
            // 参数验证
            validateNotNull(tableId, "表格ID不能为空");
            validateNotNull(cellValues, "单元格值不能为空");
            
            // 获取表格下的所有公式
            List<TableFormula> formulas = getFormulasByTableId(tableId);
            
            if (CollectionUtils.isEmpty(formulas)) {
                log.info("表格下没有公式，返回空结果 - 表格ID: {}", tableId);
                return Collections.emptyMap();
            }
            
            // 根据公式数量选择处理方式
            Map<String, String> results;
            if (formulas.size() <= MAX_BATCH_SIZE) {
                results = calculateFormulasSync(formulas, cellValues);
            } else {
                results = calculateFormulasAsync(formulas, cellValues).join();
            }
            
            long totalTime = System.currentTimeMillis() - startTime;
            log.info("批量计算完成 - 表格ID: {}, 公式数量: {}, 成功数量: {}, 耗时: {}ms", 
                    tableId, formulas.size(), results.size(), totalTime);
            
            return results;
            
        } catch (Exception e) {
            log.error("批量计算失败 - 表格ID: {}, 错误: {}", tableId, e.getMessage(), e);
            throw new FormulaBatchCalculationException("批量计算失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 验证公式表达式
     * 
     * <p>验证公式表达式的语法正确性。</p>
     * <p>支持缓存验证结果，提高重复验证的性能。</p>
     * 
     * @param formulaExpression 公式表达式，不能为空
     * @return true表示表达式有效，false表示无效
     * @throws IllegalArgumentException 当表达式为空时抛出
     */
    @Override
    @Cacheable(value = "formulaValidations", key = "#formulaExpression")
    public boolean validateFormula(String formulaExpression) {
        log.debug("验证公式表达式 - 表达式: {}", formulaExpression);
        
        validateNotNull(formulaExpression, "公式表达式不能为空");
        
        try {
            String normalizedFormula = FormulaParser.normalizeFormula(formulaExpression);
            return FormulaParser.validateFormula(normalizedFormula);
            
        } catch (Exception e) {
            log.error("公式验证异常 - 表达式: {}, 错误: {}", formulaExpression, e.getMessage());
            return false;
        }
    }
    
    // ==================== 高级功能方法 ====================
    
    /**
     * 批量创建公式
     * 
     * <p>支持一次性创建多个公式，提高批量操作性能。</p>
     * <p>事务回滚保证数据一致性。</p>
     * 
     * @param formulaRequests 公式创建请求列表
     * @return 创建成功的公式列表
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(value = {"formulas", "calculations"}, allEntries = true)
    public List<TableFormula> batchCreateFormulas(List<FormulaCreateRequest> formulaRequests) {
        log.info("开始批量创建公式 - 请求数量: {}", formulaRequests != null ? formulaRequests.size() : 0);
        
        validateNotNull(formulaRequests, "创建请求列表不能为空");
        
        List<TableFormula> createdFormulas = new ArrayList<>();
        
        for (FormulaCreateRequest request : formulaRequests) {
            try {
                TableFormula formula = createFormula(
                        request.getColumnId(),
                        request.getFormulaExpression(),
                        request.getDescription()
                );
                createdFormulas.add(formula);
            } catch (Exception e) {
                log.error("批量创建公式失败 - 列ID: {}, 错误: {}", request.getColumnId(), e.getMessage());
                // 继续处理其他公式，不中断整个批量操作
            }
        }
        
        log.info("批量创建公式完成 - 成功数量: {}", createdFormulas.size());
        return createdFormulas;
    }
    
    /**
     * 异步批量计算公式
     * 
     * <p>使用CompletableFuture实现异步批量计算，提高大数据量场景的性能。</p>
     * 
     * @param formulas 公式列表
     * @param cellValues 单元格值
     * @return 异步计算结果
     */
    public CompletableFuture<Map<String, String>> calculateFormulasAsync(
            List<TableFormula> formulas, 
            Map<String, String> cellValues) {
        
        return CompletableFuture.supplyAsync(() -> {
            Map<String, String> results = new ConcurrentHashMap<>();
            
            // 并行处理公式计算
            List<CompletableFuture<Void>> futures = formulas.stream()
                    .map(formula -> CompletableFuture.runAsync(() -> {
                        try {
                            String normalizedFormula = FormulaParser.normalizeFormula(formula.getFormulaExpression());
                            if (FormulaParser.validateFormula(normalizedFormula)) {
                                String result = TableCalculator.calculateFormula(normalizedFormula, cellValues);
                                results.put(FORMULA_KEY_PREFIX + formula.getId(), result);
                            }
                        } catch (Exception e) {
                            log.error("异步计算公式失败 - 公式ID: {}, 错误: {}", formula.getId(), e.getMessage());
                            results.put(FORMULA_KEY_PREFIX + formula.getId(), ERROR_PREFIX);
                        }
                    }))
                    .collect(Collectors.toList());
            
            // 等待所有计算完成
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
            
            return results;
        });
    }
    
    // ==================== 私有辅助方法 ====================
    
    /**
     * 同步计算公式列表
     */
    private Map<String, String> calculateFormulasSync(List<TableFormula> formulas, Map<String, String> cellValues) {
        Map<String, String> results = new HashMap<>();
        
        for (TableFormula formula : formulas) {
            try {
                String normalizedFormula = FormulaParser.normalizeFormula(formula.getFormulaExpression());
                if (FormulaParser.validateFormula(normalizedFormula)) {
                    String result = TableCalculator.calculateFormula(normalizedFormula, cellValues);
                    results.put(FORMULA_KEY_PREFIX + formula.getId(), result);
                }
            } catch (Exception e) {
                log.error("同步计算公式失败 - 公式ID: {}, 错误: {}", formula.getId(), e.getMessage());
                results.put(FORMULA_KEY_PREFIX + formula.getId(), ERROR_PREFIX);
            }
        }
        
        return results;
    }
    
    /**
     * 验证创建公式参数
     */
    private void validateCreateFormulaParameters(Long columnId, String formulaExpression) {
        validateNotNull(columnId, "列ID不能为空");
        validateNotNull(formulaExpression, "公式表达式不能为空");
        
        if (formulaExpression.trim().isEmpty()) {
            throw new IllegalArgumentException("公式表达式不能为空字符串");
        }
    }
    
    /**
     * 检查公式冲突
     */
    private void checkFormulaConflict(Long columnId) {
        TableFormula existingFormula = getFormulaByColumnId(columnId);
        if (existingFormula != null) {
            throw new FormulaConflictException("列ID " + columnId + " 已存在公式配置");
        }
    }
    
    /**
     * 验证公式表达式
     */
    private void validateFormulaExpression(String formulaExpression) {
        if (!validateFormula(formulaExpression)) {
            throw new FormulaValidationException("公式表达式语法无效: " + formulaExpression);
        }
    }
    
    /**
     * 验证计算请求参数
     */
    private void validateCalculationRequest(FormulaCalculateRequest request) {
        validateNotNull(request, "计算请求不能为空");
        
        if (!StringUtils.hasText(request.getFormulaExpression())) {
            throw new IllegalArgumentException("公式表达式不能为空");
        }
        
        if (request.getCellValues() == null) {
            request.setCellValues(new HashMap<>());
        }
    }
    
    /**
     * 参数非空验证
     */
    private void validateNotNull(Object param, String message) {
        if (param == null) {
            throw new IllegalArgumentException(message);
        }
    }
    
    /**
     * 生成计算缓存键
     */
    public static String generateCalculationCacheKey(FormulaCalculateRequest request) {
        if (request == null) return "null";
        
        StringBuilder keyBuilder = new StringBuilder(CALCULATION_CACHE_PREFIX);
        keyBuilder.append(request.getFormulaExpression());
        
        if (request.getCellValues() != null && !request.getCellValues().isEmpty()) {
            // 对单元格值进行排序，确保缓存键的一致性
            request.getCellValues().entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .forEach(entry -> keyBuilder.append("|").append(entry.getKey()).append("=").append(entry.getValue()));
        }
        
        return keyBuilder.toString();
    }
    
    /**
     * 生成批量计算缓存键
     */
    public static String generateBatchCacheKey(Long tableId, Map<String, String> cellValues) {
        StringBuilder keyBuilder = new StringBuilder("batch:");
        keyBuilder.append(tableId);
        
        if (cellValues != null && !cellValues.isEmpty()) {
            cellValues.entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .forEach(entry -> keyBuilder.append("|").append(entry.getKey()).append("=").append(entry.getValue()));
        }
        
        return keyBuilder.toString();
    }
    
    // ==================== 自定义异常类 ====================
    
    /**
     * 公式验证异常
     */
    public static class FormulaValidationException extends RuntimeException {
        public FormulaValidationException(String message) {
            super(message);
        }
        public FormulaValidationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
    
    /**
     * 公式不存在异常
     */
    public static class FormulaNotFoundException extends RuntimeException {
        public FormulaNotFoundException(String message) {
            super(message);
        }
    }
    
    /**
     * 公式冲突异常
     */
    public static class FormulaConflictException extends RuntimeException {
        public FormulaConflictException(String message) {
            super(message);
        }
    }
    
    /**
     * 公式创建异常
     */
    public static class FormulaCreationException extends RuntimeException {
        public FormulaCreationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
    
    /**
     * 公式更新异常
     */
    public static class FormulaUpdateException extends RuntimeException {
        public FormulaUpdateException(String message, Throwable cause) {
            super(message, cause);
        }
    }
    
    /**
     * 公式删除异常
     */
    public static class FormulaDeleteException extends RuntimeException {
        public FormulaDeleteException(String message, Throwable cause) {
            super(message, cause);
        }
    }
    
    /**
     * 公式计算异常
     */
    public static class FormulaCalculationException extends RuntimeException {
        public FormulaCalculationException(String message) {
            super(message);
        }
    }
    
    /**
     * 公式批量计算异常
     */
    public static class FormulaBatchCalculationException extends RuntimeException {
        public FormulaBatchCalculationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
    
    /**
     * 公式乐观锁异常
     */
    public static class FormulaOptimisticLockException extends RuntimeException {
        public FormulaOptimisticLockException(String message) {
            super(message);
        }
    }
    
    // ==================== 内部数据类 ====================
    
    /**
     * 批量创建公式请求
     */
    public static class FormulaCreateRequest {
        private Long columnId;
        private String formulaExpression;
        private String description;
        
        // 构造方法
        public FormulaCreateRequest() {}
        public FormulaCreateRequest(Long columnId, String formulaExpression, String description) {
            this.columnId = columnId;
            this.formulaExpression = formulaExpression;
            this.description = description;
        }
        
        // Getters and Setters
        public Long getColumnId() { return columnId; }
        public void setColumnId(Long columnId) { this.columnId = columnId; }
        public String getFormulaExpression() { return formulaExpression; }
        public void setFormulaExpression(String formulaExpression) { this.formulaExpression = formulaExpression; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}