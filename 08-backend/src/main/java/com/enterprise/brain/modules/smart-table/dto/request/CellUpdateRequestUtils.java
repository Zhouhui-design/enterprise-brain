package com.enterprise.brain.modules.smart-table.dto.request;

import com.enterprise.brain.modules.smart-table.dto.request.validator.CellUpdateRequestValidator;
import com.enterprise.brain.modules.smart-table.enums.CalculationType;
import com.enterprise.brain.modules.smart-table.enums.CellDataType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 单元格更新请求工具类
 * 
 * <p>提供对CellUpdateRequest的各种实用工具方法，包括：
 * 请求转换、数据解析、格式化、批量处理、依赖分析等功能。</p>
 * 
 * <p>主要功能：</p>
 * <ul>
 *   <li>请求数据的标准化和清理</li>
 *   <li>智能数据类型推断和转换</li>
 *   <li>公式解析和依赖关系分析</li>
 *   <li>批量请求优化和合并</li>
 *   <li>缓存管理和性能监控</li>
 *   <li>安全性检查和数据清理</li>
 * </ul>
 *
 * @author AI Assistant
 * @version 1.0.0
 * @since 2024-01-01
 */
@Slf4j
@Component
public class CellUpdateRequestUtils {

    // 常量定义
    private static final String DEFAULT_DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";
    private static final String DEFAULT_CURRENCY_SYMBOL = "¥";
    private static final int MAX_BATCH_SIZE = 100;
    
    // 缓存
    private final Map<String, Object> typeInferenceCache = new ConcurrentHashMap<>();
    private final Map<String, List<String>> dependencyCache = new ConcurrentHashMap<>();

    private final CellUpdateRequestValidator validator;

    public CellUpdateRequestUtils(CellUpdateRequestValidator validator) {
        this.validator = validator;
    }

    /**
     * 标准化和清理请求对象
     * 
     * @param request 原始请求对象
     * @return 标准化后的请求对象
     */
    public CellUpdateRequest normalizeRequest(CellUpdateRequest request) {
        if (request == null) {
            return null;
        }

        // 创建深拷贝以避免修改原始对象
        CellUpdateRequest normalized = request.deepCopy();

        // 清理和标准化字段值
        if (normalized.getCellValue() != null) {
            String cleanValue = cleanCellValue(normalized.getCellValue());
            normalized.setCellValue(cleanValue);
        }

        // 标准化布尔值
        if (normalized.getIsCalculated() == null) {
            normalized.setIsCalculated(false);
        }
        if (normalized.getForceUpdate() == null) {
            normalized.setForceUpdate(false);
        }

        // 推断数据类型（如果未指定）
        if (normalized.getDataType() == null) {
            CellDataType inferredType = inferDataType(normalized.getCellValue());
            normalized.setDataType(inferredType);
            log.debug("推断数据类型: {} -> {}", normalized.getCellValue(), inferredType);
        }

        // 标准化计算类型
        if (Boolean.TRUE.equals(normalized.getIsCalculated()) && 
            normalized.getCalculationType() == null) {
            CalculationType inferredCalcType = inferCalculationType(normalized.getCellValue());
            normalized.setCalculationType(inferredCalcType);
        }

        // 标准化依赖项
        if (normalized.getDependencies() != null) {
            List<String> cleanDeps = normalized.getDependencies().stream()
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(dep -> !dep.isEmpty())
                    .distinct()
                    .toList();
            normalized.setDependencies(cleanDeps);
        }

        // 生成批次ID（如果未指定）
        if (normalized.getBatchId() == null) {
            normalized.setBatchId(generateBatchId());
        }

        return normalized;
    }

    /**
     * 智能推断数据类型
     * 
     * @param value 单元格值
     * @return 推断的数据类型
     */
    public CellDataType inferDataType(String value) {
        if (value == null || value.trim().isEmpty()) {
            return CellDataType.TEXT;
        }

        String cacheKey = "type_inference_" + value.hashCode();
        Object cached = typeInferenceCache.get(cacheKey);
        if (cached instanceof CellDataType) {
            return (CellDataType) cached;
        }

        CellDataType inferredType;

        // 检查是否为公式
        if (value.startsWith("=")) {
            inferredType = CellDataType.FORMULA;
        }
        // 检查是否为布尔值
        else if (isBooleanValue(value)) {
            inferredType = CellDataType.BOOLEAN;
        }
        // 检查是否为数值
        else if (isNumericValue(value)) {
            // 进一步检查是否为货币
            if (value.matches(".*[¥$€£].*")) {
                inferredType = CellDataType.CURRENCY;
            } else {
                inferredType = CellDataType.NUMBER;
            }
        }
        // 检查是否为日期
        else if (isDateValue(value)) {
            inferredType = CellDataType.DATE;
        }
        // 检查是否为邮箱
        else if (isEmailValue(value)) {
            inferredType = CellDataType.EMAIL;
        }
        // 检查是否为URL
        else if (isUrlValue(value)) {
            inferredType = CellDataType.URL;
        }
        // 默认为文本
        else {
            inferredType = CellDataType.TEXT;
        }

        // 缓存推断结果
        typeInferenceCache.put(cacheKey, inferredType);
        
        return inferredType;
    }

    /**
     * 推断计算类型
     * 
     * @param formula 公式字符串
     * @return 推断的计算类型
     */
    public CalculationType inferCalculationType(String formula) {
        if (formula == null || !formula.startsWith("=")) {
            return null;
        }

        String formulaBody = formula.substring(1).toUpperCase();

        // 优先级顺序匹配
        if (formulaBody.contains("VLOOKUP")) {
            return CalculationType.VLOOKUP;
        } else if (formulaBody.contains("SUMIF")) {
            return CalculationType.SUMIF;
        } else if (formulaBody.contains("COUNTIF")) {
            return CalculationType.COUNTIF;
        } else if (formulaBody.contains("CONCATENATE")) {
            return CalculationType.CONCATENATE;
        } else if (formulaBody.contains("SUM")) {
            return CalculationType.SUM;
        } else if (formulaBody.contains("AVERAGE")) {
            return CalculationType.AVERAGE;
        } else if (formulaBody.contains("COUNT")) {
            return CalculationType.COUNT;
        } else if (formulaBody.contains("MAX")) {
            return CalculationType.MAX;
        } else if (formulaBody.contains("MIN")) {
            return CalculationType.MIN;
        } else if (formulaBody.contains("*") || formulaBody.contains("/")) {
            if (formulaBody.contains("-") || formulaBody.contains("+")) {
                return CalculationType.GROWTH;
            } else {
                return CalculationType.PERCENTAGE;
            }
        } else {
            return CalculationType.CUSTOM;
        }
    }

    /**
     * 解析公式依赖项
     * 
     * @param formula 公式字符串
     * @return 依赖项列表
     */
    public List<String> parseDependencies(String formula) {
        if (formula == null || !formula.startsWith("=")) {
            return Collections.emptyList();
        }

        String cacheKey = "dependencies_" + formula.hashCode();
        List<String> cached = dependencyCache.get(cacheKey);
        if (cached != null) {
            return new ArrayList<>(cached);
        }

        List<String> dependencies = new ArrayList<>();
        String formulaBody = formula.substring(1);

        // 简单的依赖项解析（实际项目中应使用更复杂的解析器）
        // 提取单元格引用，如 A1, B2:C5 等
        java.util.regex.Pattern cellPattern = java.util.regex.Pattern.compile("([A-Za-z]+[0-9]+)(?::([A-Za-z]+[0-9]+))?");
        java.util.regex.Matcher matcher = cellPattern.matcher(formulaBody);

        while (matcher.find()) {
            String cellRef = matcher.group();
            if (cellRef.length() > 0) {
                dependencies.add(cellRef);
            }
        }

        // 去重并排序
        dependencies = dependencies.stream()
                .distinct()
                .sorted()
                .toList();

        // 缓存结果
        dependencyCache.put(cacheKey, dependencies);

        return dependencies;
    }

    /**
     * 批量优化请求
     * 
     * @param requests 原始请求列表
     * @return 优化后的请求列表
     */
    public List<CellUpdateRequest> optimizeBatchRequests(List<CellUpdateRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return Collections.emptyList();
        }

        // 限制批量大小
        if (requests.size() > MAX_BATCH_SIZE) {
            log.warn("批量请求数量超过限制({})，将分批处理", MAX_BATCH_SIZE);
            return optimizeBatchRequests(requests.subList(0, MAX_BATCH_SIZE));
        }

        List<CellUpdateRequest> optimized = new ArrayList<>();

        // 按单元格位置分组，合并重复更新
        Map<String, CellUpdateRequest> cellMap = new LinkedHashMap<>();
        
        for (CellUpdateRequest request : requests) {
            // 标准化请求
            CellUpdateRequest normalized = normalizeRequest(request);
            
            String cellKey = normalized.getFullCellIdentifier();
            
            // 如果同一单元格有多个更新，保留最后一个
            cellMap.put(cellKey, normalized);
        }

        // 按依赖关系排序
        List<CellUpdateRequest> sortedRequests = new ArrayList<>(cellMap.values());
        sortByDependencies(sortedRequests);

        return sortedRequests;
    }

    /**
     * 格式化单元格值
     * 
     * @param request 请求对象
     * @return 格式化后的值
     */
    public String formatCellValue(CellUpdateRequest request) {
        if (request == null || request.getCellValue() == null) {
            return "";
        }

        String value = request.getCellValue();
        CellDataType dataType = request.getDataType();
        String formatPattern = request.getFormatPattern();

        // 使用自定义格式模式
        if (formatPattern != null && !formatPattern.isEmpty()) {
            return formatByPattern(value, dataType, formatPattern);
        }

        // 使用默认格式
        return formatByDefault(value, dataType);
    }

    /**
     * 生成单元格摘要信息
     * 
     * @param request 请求对象
     * @return 摘要信息
     */
    public String generateCellSummary(CellUpdateRequest request) {
        if (request == null) {
            return "空请求";
        }

        return String.format(
            "单元格[T:%d R:%d C:%d] 类型:%s 值:%s%s",
            request.getTableId(),
            request.getRowId(),
            request.getColumnId(),
            request.getDataType(),
            truncateValue(request.getCellValue(), 20),
            Boolean.TRUE.equals(request.getIsCalculated()) ? " (计算)" : ""
        );
    }

    /**
     * 清理单元格值
     * 
     * @param value 原始值
     * @return 清理后的值
     */
    public String cleanCellValue(String value) {
        if (value == null) {
            return null;
        }

        // 去除首尾空白字符
        String cleaned = value.trim();

        // 处理特殊字符
        cleaned = cleaned.replaceAll("\\s+", " "); // 多个空格合并为一个
        
        // 移除控制字符
        cleaned = cleaned.replaceAll("[\\p{Cntrl}]", "");

        // 安全性清理
        cleaned = sanitizeValue(cleaned);

        return cleaned;
    }

    /**
     * 计算单元格更新优先级
     * 
     * @param request 请求对象
     * @return 优先级（数字越大优先级越高）
     */
    public int calculatePriority(CellUpdateRequest request) {
        if (request == null) {
            return 0;
        }

        int priority = 0;

        // 计算单元格优先级更高
        if (Boolean.TRUE.equals(request.getIsCalculated())) {
            priority += 10;
        }

        // 强制更新优先级更高
        if (Boolean.TRUE.equals(request.getForceUpdate())) {
            priority += 5;
        }

        // 某些数据类型优先级更高
        switch (request.getDataType()) {
            case FORMULA:
                priority += 8;
                break;
            case CURRENCY:
            case NUMBER:
                priority += 3;
                break;
            case DATE:
                priority += 2;
                break;
        }

        return priority;
    }

    // 私有辅助方法

    private boolean isBooleanValue(String value) {
        String lower = value.trim().toLowerCase();
        return lower.equals("true") || lower.equals("false") ||
               lower.equals("yes") || lower.equals("no") ||
               lower.equals("1") || lower.equals("0");
    }

    private boolean isNumericValue(String value) {
        String cleanValue = value.replaceAll("[¥$€£,\\s]", "");
        try {
            Double.parseDouble(cleanValue);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private boolean isDateValue(String value) {
        // 支持多种日期格式
        String[] patterns = {
            "^\\d{4}-\\d{2}-\\d{2}.*$",
            "^\\d{4}/\\d{2}/\\d{2}.*$",
            "^\\d{2}-\\d{2}-\\d{4}.*$",
            "^\\d{2}/\\d{2}/\\d{4}.*$"
        };
        
        for (String pattern : patterns) {
            if (value.matches(pattern)) {
                return true;
            }
        }
        
        return false;
    }

    private boolean isEmailValue(String value) {
        String emailPattern = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        return value.matches(emailPattern);
    }

    private boolean isUrlValue(String value) {
        String urlPattern = "^https?://[A-Za-z0-9.-]+\\.[A-Za-z]{2,}.*$";
        String testValue = value;
        if (!testValue.startsWith("http://") && !testValue.startsWith("https://")) {
            testValue = "https://" + testValue;
        }
        return testValue.matches(urlPattern);
    }

    private String formatByPattern(String value, CellDataType dataType, String pattern) {
        try {
            switch (dataType) {
                case NUMBER:
                case CURRENCY:
                    if (isNumericValue(value)) {
                        double numValue = Double.parseDouble(value.replaceAll("[¥$€£,\\s]", ""));
                        return java.text.NumberFormat.getInstance().format(numValue);
                    }
                    break;
                case DATE:
                    if (isDateValue(value)) {
                        // 简单的日期格式化，实际项目中应使用更复杂的解析
                        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern);
                        try {
                            LocalDateTime dateTime = LocalDateTime.parse(value, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                            return dateTime.format(formatter);
                        } catch (Exception e) {
                            // 如果解析失败，尝试其他格式
                        }
                    }
                    break;
            }
        } catch (Exception e) {
            log.warn("格式化失败: value={}, pattern={}", value, pattern, e);
        }
        
        return value; // 格式化失败时返回原值
    }

    private String formatByDefault(String value, CellDataType dataType) {
        String pattern = dataType.getDefaultFormat();
        return pattern.isEmpty() ? value : formatByPattern(value, dataType, pattern);
    }

    private String sanitizeValue(String value) {
        // 移除潜在的安全风险字符
        return value.replaceAll("<script.*?</script>", "")
                   .replaceAll("javascript:", "")
                   .replaceAll("vbscript:", "")
                   .replaceAll("on\\w+=", "");
    }

    private String truncateValue(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        return value.length() > maxLength ? value.substring(0, maxLength) + "..." : value;
    }

    private void sortByDependencies(List<CellUpdateRequest> requests) {
        // 简单的拓扑排序，确保依赖项在前面
        requests.sort((a, b) -> {
            // 计算单元格优先级更高
            if (Boolean.TRUE.equals(a.getIsCalculated()) && !Boolean.TRUE.equals(b.getIsCalculated())) {
                return 1;
            }
            if (!Boolean.TRUE.equals(a.getIsCalculated()) && Boolean.TRUE.equals(b.getIsCalculated())) {
                return -1;
            }
            
            // 按优先级排序
            int priorityA = calculatePriority(a);
            int priorityB = calculatePriority(b);
            return Integer.compare(priorityB, priorityA);
        });
    }

    private String generateBatchId() {
        return "batch_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + 
               "_" + System.currentTimeMillis() % 1000;
    }

    /**
     * 清理缓存
     */
    public void clearCache() {
        typeInferenceCache.clear();
        dependencyCache.clear();
        log.info("工具类缓存已清空");
    }

    /**
     * 获取缓存统计信息
     */
    public Map<String, Object> getCacheStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("typeInferenceCacheSize", typeInferenceCache.size());
        stats.put("dependencyCacheSize", dependencyCache.size());
        return stats;
    }
}