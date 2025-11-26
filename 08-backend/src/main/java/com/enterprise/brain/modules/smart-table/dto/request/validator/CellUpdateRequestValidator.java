package com.enterprise.brain.modules.smart-table.dto.request.validator;

import com.enterprise.brain.modules.smart-table.dto.request.CellUpdateRequest;
import com.enterprise.brain.modules.smart-table.enums.CalculationType;
import com.enterprise.brain.modules.smart-table.enums.CellDataType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.regex.Pattern;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 单元格更新请求验证器
 * 
 * <p>提供对CellUpdateRequest的全面验证功能，包括基础数据验证、业务规则检查、
 * 安全性验证和性能优化建议。支持缓存验证结果以提高重复验证的性能。</p>
 * 
 * <p>主要功能：</p>
 * <ul>
 *   <li>基础参数验证（必填项、格式、长度等）</li>
 *   <li>数据类型一致性检查</li>
 *   <li>计算公式语法验证</li>
 *   <li>安全性检查（XSS、SQL注入等）</li>
 *   <li>性能优化建议</li>
 *   <li>批量验证支持</li>
 * </ul>
 *
 * @author AI Assistant
 * @version 1.0.0
 * @since 2024-01-01
 */
@Slf4j
@Component
public class CellUpdateRequestValidator {

    // 预编译的正则表达式模式，提高性能
    private static final Pattern CELL_REFERENCE_PATTERN = Pattern.compile("^[A-Za-z]+[0-9]+$");
    private static final Pattern RANGE_REFERENCE_PATTERN = Pattern.compile("^[A-Za-z]+[0-9]+:[A-Za-z]+[0-9]+$");
    private static final Pattern FUNCTION_PATTERN = Pattern.compile("^[A-Za-z_]+\\(.*\\)$");
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile("(?i)(union|select|insert|update|delete|drop|create|alter|exec|script)");
    private static final Pattern XSS_PATTERN = Pattern.compile("(?i)(<script|javascript:|vbscript:|onload=|onerror=)");

    // 验证结果缓存
    private final Map<String, ValidationResult> validationCache = new ConcurrentHashMap<>();
    
    // 缓存大小限制
    private static final int MAX_CACHE_SIZE = 1000;

    /**
     * 验证结果类
     */
    public static class ValidationResult {
        private final boolean valid;
        private final List<String> errors;
        private final List<String> warnings;
        private final List<String> suggestions;

        public ValidationResult(boolean valid, List<String> errors, List<String> warnings, List<String> suggestions) {
            this.valid = valid;
            this.errors = new ArrayList<>(errors);
            this.warnings = new ArrayList<>(warnings);
            this.suggestions = new ArrayList<>(suggestions);
        }

        public boolean isValid() { return valid; }
        public List<String> getErrors() { return new ArrayList<>(errors); }
        public List<String> getWarnings() { return new ArrayList<>(warnings); }
        public List<String> getSuggestions() { return new ArrayList<>(suggestions); }

        public static ValidationResult success() {
            return new ValidationResult(true, Collections.emptyList(), Collections.emptyList(), Collections.emptyList());
        }

        public static ValidationResult error(String message) {
            return new ValidationResult(false, Arrays.asList(message), Collections.emptyList(), Collections.emptyList());
        }

        public static ValidationResult errors(List<String> messages) {
            return new ValidationResult(false, messages, Collections.emptyList(), Collections.emptyList());
        }
    }

    /**
     * 验证单个单元格更新请求
     * 
     * @param request 要验证的请求
     * @return 验证结果
     */
    public ValidationResult validate(CellUpdateRequest request) {
        if (request == null) {
            return ValidationResult.error("请求对象不能为空");
        }

        // 生成缓存键
        String cacheKey = generateCacheKey(request);
        
        // 检查缓存
        ValidationResult cachedResult = validationCache.get(cacheKey);
        if (cachedResult != null) {
            log.debug("使用缓存的验证结果: {}", cacheKey);
            return cachedResult;
        }

        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        try {
            // 基础验证
            validateBasicFields(request, errors);
            
            // 数据类型验证
            validateDataType(request, errors, warnings);
            
            // 计算公式验证
            validateFormula(request, errors, warnings);
            
            // 安全性验证
            validateSecurity(request, errors, warnings);
            
            // 性能优化建议
            providePerformanceSuggestions(request, suggestions);

        } catch (Exception e) {
            log.error("验证过程中发生异常", e);
            errors.add("验证过程异常: " + e.getMessage());
        }

        ValidationResult result = new ValidationResult(errors.isEmpty(), errors, warnings, suggestions);
        
        // 缓存结果
        cacheValidationResult(cacheKey, result);
        
        return result;
    }

    /**
     * 批量验证多个请求
     * 
     * @param requests 要验证的请求列表
     * @return 批量验证结果
     */
    public Map<String, ValidationResult> validateBatch(List<CellUpdateRequest> requests) {
        Map<String, ValidationResult> results = new HashMap<>();
        
        if (requests == null || requests.isEmpty()) {
            results.put("batch", ValidationResult.error("批量请求列表不能为空"));
            return results;
        }

        // 检查批次一致性
        String batchId = requests.get(0).getBatchId();
        boolean consistentBatch = requests.stream()
                .allMatch(req -> Objects.equals(batchId, req.getBatchId()));

        if (!consistentBatch) {
            results.put("batch", ValidationResult.warning("批次ID不一致，可能影响批量操作的一致性"));
        }

        // 验证每个请求
        for (int i = 0; i < requests.size(); i++) {
            String key = "item_" + i;
            ValidationResult result = validate(requests.get(i));
            results.put(key, result);
        }

        // 检查重复的单元格位置
        Set<String> cellPositions = new HashSet<>();
        List<String> duplicatePositions = new ArrayList<>();
        
        for (int i = 0; i < requests.size(); i++) {
            CellUpdateRequest req = requests.get(i);
            String position = req.getFullCellIdentifier();
            
            if (!cellPositions.add(position)) {
                duplicatePositions.add(position);
            }
        }

        if (!duplicatePositions.isEmpty()) {
            results.put("batch", ValidationResult.warning("发现重复的单元格位置: " + String.join(", ", duplicatePositions)));
        }

        return results;
    }

    /**
     * 验证基础字段
     */
    private void validateBasicFields(CellUpdateRequest request, List<String> errors) {
        // 表格ID验证
        if (request.getTableId() == null || request.getTableId() <= 0) {
            errors.add("表格ID必须大于0");
        }

        // 行ID验证
        if (request.getRowId() == null || request.getRowId() <= 0) {
            errors.add("行ID必须大于0");
        }

        // 列ID验证
        if (request.getColumnId() == null || request.getColumnId() <= 0) {
            errors.add("列ID必须大于0");
        }

        // 单元格值验证
        if (request.isEmptyUpdate()) {
            errors.add("没有提供有效的更新内容");
        }

        // 值长度验证
        if (StringUtils.hasText(request.getCellValue()) && 
            request.getCellValue().length() > CellUpdateRequest.MAX_CELL_VALUE_LENGTH) {
            errors.add("单元格值长度不能超过" + CellUpdateRequest.MAX_CELL_VALUE_LENGTH + "个字符");
        }
    }

    /**
     * 验证数据类型
     */
    private void validateDataType(CellUpdateRequest request, List<String> errors, List<String> warnings) {
        CellDataType dataType = request.getDataType();
        
        if (dataType == null) {
            errors.add("数据类型不能为空");
            return;
        }

        String cellValue = request.getCellValue();
        
        // 根据数据类型验证值
        if (!dataType.validateValue(cellValue)) {
            errors.add("单元格值不符合" + dataType.getDescription() + "类型的要求");
        }

        // 特殊类型的额外检查
        switch (dataType) {
            case NUMBER:
                validateNumericValue(cellValue, errors, warnings);
                break;
            case DATE:
                validateDateValue(cellValue, errors, warnings);
                break;
            case BOOLEAN:
                validateBooleanValue(cellValue, errors);
                break;
            case EMAIL:
                validateEmailValue(cellValue, errors);
                break;
            case URL:
                validateUrlValue(cellValue, errors);
                break;
            case CURRENCY:
                validateCurrencyValue(cellValue, errors, warnings);
                break;
        }

        // 检查数据类型一致性
        if (Boolean.TRUE.equals(request.getIsCalculated()) && !CellDataType.FORMULA.equals(dataType)) {
            warnings.add("计算单元格建议使用FORMULA数据类型");
        }
    }

    /**
     * 验证计算公式
     */
    private void validateFormula(CellUpdateRequest request, List<String> errors, List<String> warnings) {
        if (!Boolean.TRUE.equals(request.getIsCalculated())) {
            return; // 不是计算单元格，跳过公式验证
        }

        String formula = request.getCellValue();
        
        if (!StringUtils.hasText(formula)) {
            errors.add("计算单元格的公式不能为空");
            return;
        }

        // 检查公式长度
        if (formula.length() > CellUpdateRequest.MAX_FORMULA_LENGTH) {
            errors.add("公式长度不能超过" + CellUpdateRequest.MAX_FORMULA_LENGTH + "个字符");
        }

        // 验证公式语法
        if (!isValidFormulaSyntax(formula)) {
            errors.add("公式语法无效: " + formula);
        }

        // 验证依赖项
        validateDependencies(request, errors, warnings);

        // 检查计算类型
        CalculationType calcType = request.getCalculationType();
        if (calcType == null) {
            warnings.add("计算单元格建议指定计算类型以提高性能");
        } else {
            validateCalculationType(formula, calcType, errors, warnings);
        }

        // 检查循环引用
        checkCircularReference(request, warnings);
    }

    /**
     * 安全性验证
     */
    private void validateSecurity(CellUpdateRequest request, List<String> errors, List<String> warnings) {
        String cellValue = request.getCellValue();
        
        if (!StringUtils.hasText(cellValue)) {
            return;
        }

        // SQL注入检查
        if (SQL_INJECTION_PATTERN.matcher(cellValue).find()) {
            errors.add("单元格值可能包含SQL注入风险");
        }

        // XSS检查
        if (XSS_PATTERN.matcher(cellValue).find()) {
            errors.add("单元格值可能包含XSS攻击风险");
        }

        // 恶意脚本检查
        if (cellValue.toLowerCase().contains("<script") || 
            cellValue.toLowerCase().contains("javascript:")) {
            errors.add("单元格值不允许包含脚本代码");
        }

        // 大量数据检查
        if (cellValue.length() > 5000) {
            warnings.add("单元格值较大，可能影响性能");
        }
    }

    /**
     * 提供性能优化建议
     */
    private void providePerformanceSuggestions(CellUpdateRequest request, List<String> suggestions) {
        // 计算单元格优化建议
        if (Boolean.TRUE.equals(request.getIsCalculated())) {
            if (request.getCalculationType() == null) {
                suggestions.add("指定计算类型可以提高计算性能");
            }
            
            if (request.getDependencies() == null || request.getDependencies().isEmpty()) {
                suggestions.add("为计算单元格指定依赖项可以优化重新计算性能");
            }
        }

        // 批量操作建议
        if (request.getBatchId() == null) {
            suggestions.add("使用批量操作可以提高更新效率");
        }

        // 格式化建议
        if (request.getFormatPattern() == null && 
            (CellDataType.NUMBER.equals(request.getDataType()) || 
             CellDataType.CURRENCY.equals(request.getDataType()))) {
            suggestions.add("为数值类型指定格式化模式可以提高显示效果");
        }
    }

    // 辅助验证方法

    private void validateNumericValue(String value, List<String> errors, List<String> warnings) {
        try {
            Double.parseDouble(value.replaceAll("[¥$€£,\\s]", ""));
        } catch (NumberFormatException e) {
            errors.add("数值格式无效");
        }
    }

    private void validateDateValue(String value, List<String> errors, List<String> warnings) {
        // 简单的日期格式验证，实际项目中应使用更严格的验证
        if (!value.matches("^\\d{4}-\\d{2}-\\d{2}.*$") &&
            !value.matches("^\\d{4}/\\d{2}/\\d{2}.*$") &&
            !value.matches("^\\d{2}-\\d{2}-\\d{4}.*$")) {
            warnings.add("日期格式可能不规范，建议使用yyyy-MM-dd格式");
        }
    }

    private void validateBooleanValue(String value, List<String> errors) {
        String lowerValue = value.trim().toLowerCase();
        if (!lowerValue.equals("true") && !lowerValue.equals("false") &&
            !lowerValue.equals("yes") && !lowerValue.equals("no") &&
            !lowerValue.equals("1") && !lowerValue.equals("0")) {
            errors.add("布尔值格式无效，应为true/false、yes/no或1/0");
        }
    }

    private void validateEmailValue(String value, List<String> errors) {
        String emailPattern = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        if (!value.matches(emailPattern)) {
            errors.add("邮箱格式无效");
        }
    }

    private void validateUrlValue(String value, List<String> errors) {
        String urlPattern = "^https?://[A-Za-z0-9.-]+\\.[A-Za-z]{2,}.*$";
        String normalizedValue = value;
        if (!normalizedValue.startsWith("http://") && !normalizedValue.startsWith("https://")) {
            normalizedValue = "https://" + normalizedValue;
        }
        if (!normalizedValue.matches(urlPattern)) {
            errors.add("URL格式无效");
        }
    }

    private void validateCurrencyValue(String value, List<String> errors, List<String> warnings) {
        try {
            String cleanValue = value.replaceAll("[¥$€£,\\s]", "");
            Double.parseDouble(cleanValue);
        } catch (NumberFormatException e) {
            errors.add("货币格式无效");
        }
    }

    private boolean isValidFormulaSyntax(String formula) {
        String trimmed = formula.trim();
        
        // 检查是否以等号开头
        if (!trimmed.startsWith("=")) {
            return false;
        }

        String formulaBody = trimmed.substring(1).trim();

        // 检查基本语法
        if (formulaBody.isEmpty()) {
            return false;
        }

        // 检查括号匹配
        int bracketCount = 0;
        for (char c : formulaBody.toCharArray()) {
            if (c == '(') bracketCount++;
            if (c == ')') bracketCount--;
            if (bracketCount < 0) return false;
        }

        return bracketCount == 0;
    }

    private void validateDependencies(CellUpdateRequest request, List<String> errors, List<String> warnings) {
        List<String> dependencies = request.getDependencies();
        
        if (dependencies == null || dependencies.isEmpty()) {
            warnings.add("计算单元格建议指定依赖项以便跟踪影响范围");
            return;
        }

        for (String dep : dependencies) {
            if (dep != null && !dep.trim().isEmpty()) {
                // 验证单元格引用格式
                if (!CELL_REFERENCE_PATTERN.matcher(dep).matches() && 
                    !RANGE_REFERENCE_PATTERN.matcher(dep).matches()) {
                    errors.add("依赖项格式无效: " + dep);
                }
            }
        }
    }

    private void validateCalculationType(String formula, CalculationType calcType, 
                                       List<String> errors, List<String> warnings) {
        // 检查计算类型与公式内容的一致性
        String formulaBody = formula.substring(1).toUpperCase();
        
        if (calcType == CalculationType.SUM && !formulaBody.contains("SUM")) {
            warnings.add("计算类型为SUM但公式中未找到SUM函数");
        }
        
        if (calcType == CalculationType.AVERAGE && !formulaBody.contains("AVERAGE")) {
            warnings.add("计算类型为AVERAGE但公式中未找到AVERAGE函数");
        }
    }

    private void checkCircularReference(CellUpdateRequest request, List<String> warnings) {
        // 简单的循环引用检查，实际项目中需要更复杂的算法
        String currentCell = request.getFullCellIdentifier();
        
        if (request.getDependencies() != null) {
            for (String dep : request.getDependencies()) {
                if (currentCell.contains(dep)) {
                    warnings.add("可能存在循环引用风险: " + dep);
                    break;
                }
            }
        }
    }

    /**
     * 生成缓存键
     */
    private String generateCacheKey(CellUpdateRequest request) {
        return String.format("%d_%d_%d_%s_%s_%b", 
            request.getTableId(), request.getRowId(), request.getColumnId(),
            request.getDataType(), request.getCellValue(), request.getIsCalculated());
    }

    /**
     * 缓存验证结果
     */
    private void cacheValidationResult(String cacheKey, ValidationResult result) {
        // 限制缓存大小，避免内存溢出
        if (validationCache.size() >= MAX_CACHE_SIZE) {
            // 清理一半的缓存
            validationCache.clear();
        }
        validationCache.put(cacheKey, result);
    }

    /**
     * 清空验证缓存
     */
    public void clearCache() {
        validationCache.clear();
        log.info("验证缓存已清空");
    }

    /**
     * 获取缓存统计信息
     */
    public Map<String, Object> getCacheStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("size", validationCache.size());
        stats.put("maxSize", MAX_CACHE_SIZE);
        stats.put("usage", (double) validationCache.size() / MAX_CACHE_SIZE);
        return stats;
    }
}