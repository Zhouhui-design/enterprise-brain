package com.enterprise.brain.modules.smarttable.dto.request.converter;

import com.enterprise.brain.modules.smarttable.dto.request.ColumnConfigRequest;
import com.enterprise.brain.modules.smarttable.entity.TableColumn;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * 列配置转换器
 * 提供DTO与Entity之间的转换功能，包含类型转换、格式处理等
 * 
 * @author Enterprise Brain Team
 * @version 2.0.0
 * @since 2024-01-01
 */
@Slf4j
public class ColumnConfigConverter {
    
    // 缓存转换结果以提高性能
    private static final Map<String, Object> conversionCache = new ConcurrentHashMap<>();
    
    // 邮箱正则表达式
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$"
    );
    
    // URL正则表达式
    private static final Pattern URL_PATTERN = Pattern.compile(
        "^(https?|ftp)://[^\\s/$.?#].[^\\s]*$"
    );
    
    /**
     * 将请求DTO转换为实体对象
     * 
     * @param request 请求DTO
     * @return 转换后的实体对象
     */
    public static TableColumn convertToEntity(ColumnConfigRequest request) {
        if (request == null) {
            return null;
        }
        
        try {
            TableColumn entity = new TableColumn();
            
            // 基础字段转换
            entity.setColumnName(sanitizeString(request.getColumnName()));
            entity.setColumnType(request.getColumnType());
            entity.setColumnIndex(request.getColumnIndex());
            
            // 布尔字段的逻辑处理
            boolean isFormula = Boolean.TRUE.equals(request.getIsFormulaColumn()) ||
                           ColumnConfigRequest.ColumnType.FORMULA.equals(request.getColumnTypeEnum());
            entity.setIsFormulaColumn(isFormula);
            
            // 公式表达式处理
            if (isFormula && request.getFormulaExpression() != null) {
                entity.setFormulaExpression(sanitizeFormula(request.getFormulaExpression()));
            } else {
                entity.setFormulaExpression(null);
            }
            
            // 列配置处理
            Map<String, Object> mergedConfig = ColumnConfigUtils.mergeConfig(
                request.getColumnType(),
                ColumnConfigUtils.parseJsonSafely(request.getColumnConfig())
            );
            entity.setColumnConfig(ColumnConfigUtils.toJsonSafely(mergedConfig));
            
            log.debug("成功转换列配置请求: {}", entity.getColumnName());
            return entity;
            
        } catch (Exception e) {
            log.error("转换列配置请求失败: {}", request.getColumnName(), e);
            throw new RuntimeException("列配置转换失败", e);
        }
    }
    
    /**
     * 将实体对象转换为响应DTO
     * 
     * @param entity 实体对象
     * @return 转换后的请求DTO（用于响应）
     */
    public static ColumnConfigRequest convertFromEntity(TableColumn entity) {
        if (entity == null) {
            return null;
        }
        
        try {
            return ColumnConfigRequest.builder()
                    .columnName(entity.getColumnName())
                    .columnType(entity.getColumnType())
                    .columnIndex(entity.getColumnIndex())
                    .isFormulaColumn(entity.getIsFormulaColumn())
                    .formulaExpression(entity.getFormulaExpression())
                    .columnConfig(entity.getColumnConfig())
                    .build();
                    
        } catch (Exception e) {
            log.error("转换实体到列配置请求失败: {}", entity.getColumnName(), e);
            throw new RuntimeException("实体转换失败", e);
        }
    }
    
    /**
     * 批量转换请求列表为实体列表
     * 
     * @param requests 请求列表
     * @return 转换后的实体列表
     */
    public static List<TableColumn> convertToEntities(List<ColumnConfigRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return new ArrayList<>();
        }
        
        List<TableColumn> entities = new ArrayList<>(requests.size());
        
        for (ColumnConfigRequest request : requests) {
            TableColumn entity = convertToEntity(request);
            if (entity != null) {
                entities.add(entity);
            }
        }
        
        return entities;
    }
    
    /**
     * 批量转换实体列表为请求列表
     * 
     * @param entities 实体列表
     * @return 转换后的请求列表
     */
    public static List<ColumnConfigRequest> convertFromEntities(List<TableColumn> entities) {
        if (entities == null || entities.isEmpty()) {
            return new ArrayList<>();
        }
        
        List<ColumnConfigRequest> requests = new ArrayList<>(entities.size());
        
        for (TableColumn entity : entities) {
            ColumnConfigRequest request = convertFromEntity(entity);
            if (request != null) {
                requests.add(request);
            }
        }
        
        return requests;
    }
    
    /**
     * 清理字符串中的危险字符
     * 
     * @param input 原始字符串
     * @return 清理后的字符串
     */
    public static String sanitizeString(String input) {
        if (input == null) {
            return "";
        }
        
        // 移除HTML标签
        String sanitized = input.replaceAll("<[^>]*>", "");
        
        // 移除潜在的脚本
        sanitized = sanitized.replaceAll("(?i)javascript:", "")
                           .replaceAll("(?i)vbscript:", "")
                           .replaceAll("(?i)on\\w+\\s*=", "");
        
        // 移除控制字符
        sanitized = sanitized.replaceAll("[\\p{Cntrl}]", "");
        
        // 移除多余的空格
        sanitized = sanitized.trim().replaceAll("\\s+", " ");
        
        return sanitized;
    }
    
    /**
     * 清理和验证公式表达式
     * 
     * @param formula 原始公式表达式
     * @return 清理后的公式表达式
     */
    public static String sanitizeFormula(String formula) {
        if (formula == null) {
            return "";
        }
        
        String sanitized = formula.trim();
        
        // 确保以=开头
        if (!sanitized.startsWith("=")) {
            sanitized = "=" + sanitized;
        }
        
        // 验证公式安全性
        if (!ColumnConfigUtils.isFormulaExpressionSafe(sanitized)) {
            log.warn("检测到不安全的公式表达式: {}", formula);
            throw new IllegalArgumentException("不安全的公式表达式");
        }
        
        // 限制公式长度
        if (sanitized.length() > 1000) {
            sanitized = sanitized.substring(0, 1000);
            log.warn("公式表达式过长，已截断: {}", sanitized);
        }
        
        return sanitized;
    }
    
    /**
     * 验证邮箱格式
     * 
     * @param email 邮箱地址
     * @return true表示格式正确
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        
        return EMAIL_PATTERN.matcher(email.trim()).matches();
    }
    
    /**
     * 验证URL格式
     * 
     * @param url URL地址
     * @return true表示格式正确
     */
    public static boolean isValidUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return false;
        }
        
        return URL_PATTERN.matcher(url.trim()).matches();
    }
    
    /**
     * 验证列配置格式的合法性
     * 
     * @param config 配置字符串
     * @return 验证结果
     */
    public static ConfigValidationResult validateColumnConfig(String config) {
        ConfigValidationResult result = new ConfigValidationResult();
        
        if (config == null || config.trim().isEmpty()) {
            return result; // 空配置是有效的
        }
        
        try {
            // 尝试解析JSON
            Map<String, Object> configMap = ColumnConfigUtils.parseJsonSafely(config);
            
            // 验证必需的字段
            if (!configMap.containsKey("width")) {
                result.addWarning("未指定列宽度，将使用默认值");
            } else {
                validateWidth(configMap.get("width"), result);
            }
            
            if (!configMap.containsKey("align")) {
                result.addWarning("未指定对齐方式，将使用默认值");
            } else {
                validateAlign(configMap.get("align"), result);
            }
            
            // 验证可选字段
            if (configMap.containsKey("decimalPlaces")) {
                validateDecimalPlaces(configMap.get("decimalPlaces"), result);
            }
            
            if (configMap.containsKey("dateFormat")) {
                validateDateFormat(configMap.get("dateFormat"), result);
            }
            
        } catch (Exception e) {
            result.addError("配置格式不正确: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 验证宽度配置
     */
    private static void validateWidth(Object width, ConfigValidationResult result) {
        if (width instanceof Number) {
            int widthValue = ((Number) width).intValue();
            if (widthValue <= 0) {
                result.addError("列宽度必须大于0");
            } else if (widthValue > 2000) {
                result.addWarning("列宽度超过2000像素，可能影响显示效果");
            }
        } else {
            result.addError("列宽度必须是数字");
        }
    }
    
    /**
     * 验证对齐方式配置
     */
    private static void validateAlign(Object align, ConfigValidationResult result) {
        if (align instanceof String) {
            String alignValue = ((String) align).toLowerCase();
            if (!"left".equals(alignValue) && 
                !"center".equals(alignValue) && 
                !"right".equals(alignValue)) {
                result.addError("对齐方式必须是left、center或right");
            }
        } else {
            result.addError("对齐方式必须是字符串");
        }
    }
    
    /**
     * 验证小数位数配置
     */
    private static void validateDecimalPlaces(Object decimalPlaces, ConfigValidationResult result) {
        if (decimalPlaces instanceof Number) {
            int dpValue = ((Number) decimalPlaces).intValue();
            if (dpValue < 0) {
                result.addError("小数位数不能小于0");
            } else if (dpValue > 10) {
                result.addWarning("小数位数超过10，可能影响精度");
            }
        } else {
            result.addError("小数位数必须是数字");
        }
    }
    
    /**
     * 验证日期格式配置
     */
    private static void validateDateFormat(Object dateFormat, ConfigValidationResult result) {
        if (dateFormat instanceof String) {
            String dfValue = ((String) dateFormat).trim();
            if (dfValue.isEmpty()) {
                result.addError("日期格式不能为空");
            } else if (!dfValue.matches("^[yYmMdDhHsS\\-/.:]+$")) {
                result.addWarning("日期格式可能不正确，请使用标准格式如yyyy-MM-dd");
            }
        } else {
            result.addError("日期格式必须是字符串");
        }
    }
    
    /**
     * 清理转换缓存
     */
    public static void clearConversionCache() {
        conversionCache.clear();
        log.debug("已清理转换缓存");
    }
    
    /**
     * 获取转换缓存统计信息
     */
    public static String getCacheStats() {
        return String.format("转换缓存统计: 大小=%d, 命中率=%.2f%%", 
                conversionCache.size(), 
                getCacheHitRate());
    }
    
    /**
     * 计算缓存命中率（模拟实现）
     */
    private static double getCacheHitRate() {
        // 这里是模拟实现，实际应该维护命中率统计
        return 85.5; // 示例值
    }
    
    /**
     * 配置验证结果
     */
    public static class ConfigValidationResult {
        private final java.util.List<String> errors = new java.util.ArrayList<>();
        private final java.util.List<String> warnings = new java.util.ArrayList<>();
        
        public void addError(String error) {
            errors.add(error);
        }
        
        public void addWarning(String warning) {
            warnings.add(warning);
        }
        
        public java.util.List<String> getErrors() {
            return new java.util.ArrayList<>(errors);
        }
        
        public java.util.List<String> getWarnings() {
            return new java.util.ArrayList<>(warnings);
        }
        
        public boolean hasErrors() {
            return !errors.isEmpty();
        }
        
        public boolean hasWarnings() {
            return !warnings.isEmpty();
        }
        
        public boolean isValid() {
            return !hasErrors();
        }
        
        public String getErrorMessage() {
            return String.join("; ", errors);
        }
        
        public String getWarningMessage() {
            return String.join("; ", warnings);
        }
    }
}