package com.enterprise.brain.modules.smart-table.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 单元格数据类型枚举
 * 
 * <p>定义智能表格中单元格支持的数据类型，包括基础类型和特殊类型。</p>
 * 
 * <p>支持的类型：</p>
 * <ul>
 *   <li>TEXT - 文本类型，支持任意字符</li>
 *   <li>NUMBER - 数值类型，支持整数和小数</li>
 *   <li>DATE - 日期类型，支持多种日期格式</li>
 *   <li>BOOLEAN - 布尔类型，true/false值</li>
 *   <li>FORMULA - 公式类型，支持计算表达式</li>
 *   <li>URL - 链接类型，自动识别超链接</li>
 *   <li>EMAIL - 邮箱类型，支持邮箱验证</li>
 *   <li>CURRENCY - 货币类型，支持金额计算和格式化</li>
 * </ul>
 *
 * @author AI Assistant
 * @version 1.0.0
 * @since 2024-01-01
 */
@Getter
@AllArgsConstructor
public enum CellDataType {

    /**
     * 文本类型
     */
    TEXT("TEXT", "文本", "String"),

    /**
     * 数值类型
     */
    NUMBER("NUMBER", "数字", "Number"),

    /**
     * 日期类型
     */
    DATE("DATE", "日期", "Date"),

    /**
     * 布尔类型
     */
    BOOLEAN("BOOLEAN", "布尔", "Boolean"),

    /**
     * 公式类型
     */
    FORMULA("FORMULA", "公式", "Formula"),

    /**
     * 链接类型
     */
    URL("URL", "链接", "URL"),

    /**
     * 邮箱类型
     */
    EMAIL("EMAIL", "邮箱", "Email"),

    /**
     * 货币类型
     */
    CURRENCY("CURRENCY", "货币", "Currency");

    private final String code;
    private final String description;
    private final String javaType;

    /**
     * 根据代码获取枚举值
     * 
     * @param code 枚举代码
     * @return 对应的枚举值，如果不存在则返回TEXT
     */
    @JsonCreator
    public static CellDataType fromCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            return TEXT;
        }
        
        String trimmedCode = code.trim().toUpperCase();
        
        for (CellDataType type : values()) {
            if (type.getCode().equals(trimmedCode) || 
                type.name().equals(trimmedCode) ||
                type.getDescription().equals(trimmedCode)) {
                return type;
            }
        }
        
        return TEXT;
    }

    /**
     * 获取枚举的JSON序列化值
     * 
     * @return 枚举代码
     */
    @JsonValue
    public String getValue() {
        return this.code;
    }

    /**
     * 检查是否为数值类型
     * 
     * @return true表示是数值相关类型
     */
    public boolean isNumericType() {
        return this == NUMBER || this == CURRENCY;
    }

    /**
     * 检查是否为文本类型
     * 
     * @return true表示是文本相关类型
     */
    public boolean isTextType() {
        return this == TEXT || this == URL || this == EMAIL;
    }

    /**
     * 检查是否为日期类型
     * 
     * @return true表示是日期类型
     */
    public boolean isDateType() {
        return this == DATE;
    }

    /**
     * 检查是否为计算类型
     * 
     * @return true表示是计算相关类型
     */
    public boolean isCalculatedType() {
        return this == FORMULA;
    }

    /**
     * 检查是否需要特殊验证
     * 
     * @return true表示需要特殊验证
     */
    public boolean requiresSpecialValidation() {
        return this == URL || this == EMAIL || this == CURRENCY;
    }

    /**
     * 获取默认格式化模式
     * 
     * @return 默认格式化字符串
     */
    public String getDefaultFormat() {
        switch (this) {
            case NUMBER:
                return "#,##0.00";
            case CURRENCY:
                return "¥#,##0.00";
            case DATE:
                return "yyyy-MM-dd HH:mm:ss";
            case BOOLEAN:
                return "true/false";
            case EMAIL:
            case URL:
                return "auto";
            default:
                return "";
        }
    }

    /**
     * 获取类型的正则验证表达式
     * 
     * @return 验证表达式，如果不需要特殊验证则返回null
     */
    public String getValidationPattern() {
        switch (this) {
            case EMAIL:
                return "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
            case URL:
                return "^https?://[A-Za-z0-9.-]+\\.[A-Za-z]{2,}.*$";
            case BOOLEAN:
                return "^(true|false|yes|no|1|0)$";
            default:
                return null;
        }
    }

    /**
     * 验证值是否符合该数据类型
     * 
     * @param value 要验证的值
     * @return true表示值符合类型要求
     */
    public boolean validateValue(String value) {
        if (value == null || value.trim().isEmpty()) {
            return true; // 空值允许，由必填验证控制
        }

        switch (this) {
            case NUMBER:
                try {
                    Double.parseDouble(value.trim());
                    return true;
                } catch (NumberFormatException e) {
                    return false;
                }
            case CURRENCY:
                try {
                    String cleanValue = value.replaceAll("[¥$€£,\\s]", "");
                    Double.parseDouble(cleanValue);
                    return true;
                } catch (NumberFormatException e) {
                    return false;
                }
            case BOOLEAN:
                String lowerValue = value.trim().toLowerCase();
                return lowerValue.equals("true") || lowerValue.equals("false") ||
                       lowerValue.equals("yes") || lowerValue.equals("no") ||
                       lowerValue.equals("1") || lowerValue.equals("0");
            case DATE:
                // 简单的日期格式验证，实际项目中应使用更严格的验证
                return value.matches("^\\d{4}-\\d{2}-\\d{2}.*$") ||
                       value.matches("^\\d{4}/\\d{2}/\\d{2}.*$") ||
                       value.matches("^\\d{2}-\\d{2}-\\d{4}.*$");
            case EMAIL:
                return value.matches(getValidationPattern());
            case URL:
                return value.matches(getValidationPattern());
            default:
                return true; // TEXT类型或其他类型默认通过
        }
    }

    /**
     * 转换值为标准格式
     * 
     * @param value 原始值
     * @return 转换后的标准值
     */
    public String normalizeValue(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        switch (this) {
            case BOOLEAN:
                String lowerValue = trimmed.toLowerCase();
                if (lowerValue.equals("yes") || lowerValue.equals("1")) {
                    return "true";
                } else if (lowerValue.equals("no") || lowerValue.equals("0")) {
                    return "false";
                }
                return lowerValue;
            case CURRENCY:
                return trimmed.replaceAll("[¥$€£,\\s]", "");
            case EMAIL:
                return trimmed.toLowerCase();
            case URL:
                if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
                    return "https://" + trimmed;
                }
                return trimmed;
            default:
                return trimmed;
        }
    }

    @Override
    public String toString() {
        return this.description + "(" + this.code + ")";
    }
}