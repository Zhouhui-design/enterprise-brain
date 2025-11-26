package com.enterprise.brain.modules.smarttable.dto.request;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * 列配置工具类
 * 提供列配置的解析、验证、转换等工具方法
 * 
 * @author Enterprise Brain Team
 * @version 2.0.0
 * @since 2024-01-01
 */
@Slf4j
public class ColumnConfigUtils {
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * 默认列配置
     */
    public static final Map<String, Object> DEFAULT_COLUMN_CONFIG = Map.of(
        "width", 120,
        "align", "left",
        "editable", true,
        "required", false
    );
    
    /**
     * 数字类型默认配置
     */
    public static final Map<String, Object> NUMBER_DEFAULT_CONFIG = Map.of(
        "width", 120,
        "align", "right",
        "format", "number",
        "decimalPlaces", 2,
        "editable", true,
        "required", false
    );
    
    /**
     * 日期类型默认配置
     */
    public static final Map<String, Object> DATE_DEFAULT_CONFIG = Map.of(
        "width", 150,
        "align", "center",
        "format", "date",
        "dateFormat", "yyyy-MM-dd",
        "editable", true,
        "required", false
    );
    
    /**
     * 布尔类型默认配置
     */
    public static final Map<String, Object> BOOLEAN_DEFAULT_CONFIG = Map.of(
        "width", 100,
        "align", "center",
        "format", "boolean",
        "editable", true,
        "required", false
    );
    
    /**
     * 公式类型默认配置
     */
    public static final Map<String, Object> FORMULA_DEFAULT_CONFIG = Map.of(
        "width", 150,
        "align", "right",
        "format", "formula",
        "editable", false,
        "required", false,
        "readOnly", true
    );
    
    /**
     * 安全的JSON解析方法
     * 将JSON字符串解析为Map对象
     * 
     * @param jsonString JSON字符串
     * @return 解析后的Map对象，解析失败时返回空Map
     */
    public static Map<String, Object> parseJsonSafely(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty()) {
            return new HashMap<>();
        }
        
        try {
            return objectMapper.readValue(jsonString, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            log.warn("JSON解析失败: {}, 原始数据: {}", e.getMessage(), jsonString);
            return new HashMap<>();
        }
    }
    
    /**
     * 安全的JSON序列化方法
     * 将Map对象序列化为JSON字符串
     * 
     * @param map 要序列化的Map对象
     * @return JSON字符串，序列化失败时返回空字符串
     */
    public static String toJsonSafely(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return "{}";
        }
        
        try {
            return objectMapper.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            log.warn("JSON序列化失败: {}, 数据: {}", e.getMessage(), map);
            return "{}";
        }
    }
    
    /**
     * 根据列类型获取默认配置
     * 
     * @param columnType 列类型
     * @return 对应的默认配置
     */
    public static Map<String, Object> getDefaultConfigByType(String columnType) {
        ColumnConfigRequest.ColumnType type = ColumnConfigRequest.ColumnType.fromCode(columnType);
        
        switch (type) {
            case NUMBER:
                return new HashMap<>(NUMBER_DEFAULT_CONFIG);
            case DATE:
                return new HashMap<>(DATE_DEFAULT_CONFIG);
            case BOOLEAN:
                return new HashMap<>(BOOLEAN_DEFAULT_CONFIG);
            case FORMULA:
                return new HashMap<>(FORMULA_DEFAULT_CONFIG);
            case TEXT:
            default:
                return new HashMap<>(DEFAULT_COLUMN_CONFIG);
        }
    }
    
    /**
     * 合并配置
     * 将默认配置与用户配置合并，用户配置优先级更高
     * 
     * @param userType 用户指定的列类型
     * @param userConfig 用户指定的配置
     * @return 合并后的配置
     */
    public static Map<String, Object> mergeConfig(String userType, Map<String, Object> userConfig) {
        Map<String, Object> defaultConfig = getDefaultConfigByType(userType);
        Map<String, Object> mergedConfig = new HashMap<>(defaultConfig);
        
        if (userConfig != null && !userConfig.isEmpty()) {
            mergedConfig.putAll(userConfig);
        }
        
        // 验证配置的有效性
        return validateAndSanitizeConfig(mergedConfig);
    }
    
    /**
     * 验证和清理配置
     * 确保配置值的合法性和安全性
     * 
     * @param config 要验证的配置
     * @return 验证后的配置
     */
    public static Map<String, Object> validateAndSanitizeConfig(Map<String, Object> config) {
        if (config == null) {
            return new HashMap<>(DEFAULT_COLUMN_CONFIG);
        }
        
        Map<String, Object> sanitizedConfig = new HashMap<>();
        
        // 验证并设置宽度
        Object width = config.get("width");
        if (width instanceof Number) {
            int widthValue = ((Number) width).intValue();
            sanitizedConfig.put("width", Math.max(50, Math.min(1000, widthValue))); // 限制在50-1000像素之间
        } else {
            sanitizedConfig.put("width", DEFAULT_COLUMN_CONFIG.get("width"));
        }
        
        // 验证并设置对齐方式
        Object align = config.get("align");
        if (align instanceof String) {
            String alignValue = ((String) align).toLowerCase();
            if (alignValue.matches("^(left|center|right)$")) {
                sanitizedConfig.put("align", alignValue);
            } else {
                sanitizedConfig.put("align", DEFAULT_COLUMN_CONFIG.get("align"));
            }
        } else {
            sanitizedConfig.put("align", DEFAULT_COLUMN_CONFIG.get("align"));
        }
        
        // 验证并设置是否可编辑
        Object editable = config.get("editable");
        if (editable instanceof Boolean) {
            sanitizedConfig.put("editable", editable);
        } else {
            sanitizedConfig.put("editable", DEFAULT_COLUMN_CONFIG.get("editable"));
        }
        
        // 验证并设置是否必填
        Object required = config.get("required");
        if (required instanceof Boolean) {
            sanitizedConfig.put("required", required);
        } else {
            sanitizedConfig.put("required", DEFAULT_COLUMN_CONFIG.get("required"));
        }
        
        // 验证并设置小数位数（仅对数字类型有效）
        Object decimalPlaces = config.get("decimalPlaces");
        if (decimalPlaces instanceof Number) {
            int decimalValue = ((Number) decimalPlaces).intValue();
            sanitizedConfig.put("decimalPlaces", Math.max(0, Math.min(10, decimalValue))); // 限制在0-10之间
        }
        
        // 验证并设置格式
        Object format = config.get("format");
        if (format instanceof String) {
            String formatValue = ((String) format).toLowerCase();
            if (formatValue.matches("^(number|currency|percentage|date|boolean|formula|text)$")) {
                sanitizedConfig.put("format", formatValue);
            }
        }
        
        // 验证并设置默认值
        Object defaultValue = config.get("defaultValue");
        if (defaultValue != null) {
            String defaultValueStr = String.valueOf(defaultValue).trim();
            if (!defaultValueStr.isEmpty()) {
                sanitizedConfig.put("defaultValue", sanitizeDefaultValue(defaultValueStr));
            }
        }
        
        return sanitizedConfig;
    }
    
    /**
     * 清理默认值
     * 移除潜在的恶意代码和特殊字符
     * 
     * @param defaultValue 原始默认值
     * @return 清理后的默认值
     */
    private static String sanitizeDefaultValue(String defaultValue) {
        if (defaultValue == null) {
            return "";
        }
        
        // 移除HTML标签和JavaScript代码
        String sanitized = defaultValue.replaceAll("<[^>]*>", "")
                                           .replaceAll("javascript:", "")
                                           .replaceAll("vbscript:", "")
                                           .replaceAll("on\\w+\\s*=", "");
        
        // 限制长度
        return sanitized.length() > 200 ? sanitized.substring(0, 200) : sanitized;
    }
    
    /**
     * 验证公式表达式的安全性
     * 检查公式是否包含危险的函数调用
     * 
     * @param formulaExpression 公式表达式
     * @return 验证结果，true表示安全
     */
    public static boolean isFormulaExpressionSafe(String formulaExpression) {
        if (formulaExpression == null || formulaExpression.trim().isEmpty()) {
            return true; // 空表达式视为安全
        }
        
        // 允许的函数列表
        String[] allowedFunctions = {
            "SUM", "AVERAGE", "COUNT", "MAX", "MIN", "IF", "AND", "OR", "NOT",
            "ROUND", "CEILING", "FLOOR", "ABS", "SQRT", "POWER", "MOD",
            "CONCATENATE", "LEFT", "RIGHT", "MID", "LEN", "FIND", "REPLACE",
            "DATE", "YEAR", "MONTH", "DAY", "TODAY", "NOW", "VLOOKUP", "HLOOKUP",
            "INDEX", "MATCH", "PI", "E", "RAND", "RANDBETWEEN"
        };
        
        // 危险模式列表
        String[] dangerousPatterns = {
            "eval", "exec", "script", "function", "alert", "confirm",
            "document\\.", "window\\.", "location\\.", "navigator\\."
        };
        
        String upperFormula = formulaExpression.toUpperCase();
        
        // 检查危险模式
        for (String pattern : dangerousPatterns) {
            if (upperFormula.matches(".*" + pattern.toUpperCase() + ".*")) {
                log.warn("公式表达式包含危险模式: {}", formulaExpression);
                return false;
            }
        }
        
        // 检查只使用允许的函数
        // 这里简化处理，实际应该使用更复杂的正则表达式或解析器
        if (upperFormula.matches(".*[A-Z_][A-Z0-9_]*\\(.*")) {
            // 提取函数名
            String[] functions = upperFormula.split("[^A-Z0-9_]+");
            for (String func : functions) {
                if (!func.isEmpty() && !isAllowedFunction(func, allowedFunctions)) {
                    log.warn("公式表达式包含不允许的函数: {}", func);
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * 检查函数是否在允许列表中
     * 
     * @param functionName 函数名
     * @param allowedFunctions 允许的函数列表
     * @return true表示允许
     */
    private static boolean isAllowedFunction(String functionName, String[] allowedFunctions) {
        for (String allowed : allowedFunctions) {
            if (allowed.equals(functionName)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 创建配置的JSON字符串
     * 
     * @param width 宽度
     * @param align 对齐方式
     * @param editable 是否可编辑
     * @param required 是否必填
     * @return JSON格式的配置字符串
     */
    public static String createConfigJson(int width, String align, boolean editable, boolean required) {
        Map<String, Object> config = Map.of(
            "width", width,
            "align", align,
            "editable", editable,
            "required", required
        );
        return toJsonSafely(config);
    }
    
    /**
     * 获取配置的指定属性值
     * 
     * @param config 配置Map
     * @param key 属性键
     * @param defaultValue 默认值
     * @return 属性值
     */
    @SuppressWarnings("unchecked")
    public static <T> T getConfigValue(Map<String, Object> config, String key, T defaultValue) {
        if (config == null || !config.containsKey(key)) {
            return defaultValue;
        }
        
        Object value = config.get(key);
        try {
            return (T) value;
        } catch (ClassCastException e) {
            log.warn("配置值类型转换失败: key={}, value={}, expectedType={}", 
                    key, value, defaultValue.getClass().getSimpleName());
            return defaultValue;
        }
    }
}