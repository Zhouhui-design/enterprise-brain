package com.enterprise.brain.modules.smart-table.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 计算类型枚举
 * 
 * <p>定义智能表格中支持的计算公式类型，包括基础数学运算和特殊计算功能。</p>
 * 
 * <p>支持的计算类型：</p>
 * <ul>
 *   <li>SUM - 求和，对指定范围内的数值进行累加</li>
 *   <li>AVERAGE - 平均值，计算指定范围内数值的平均数</li>
 *   <li>COUNT - 计数，统计指定范围内非空单元格的数量</li>
 *   <li>MAX - 最大值，获取指定范围内的最大数值</li>
 *   <li>MIN - 最小值，获取指定范围内的最小数值</li>
 *   <li>CUSTOM - 自定义，支持复杂的用户自定义公式</li>
 *   <li>CONCATENATE - 文本连接，将多个文本值合并</li>
 *   <li>VLOOKUP - 垂直查找，在表格中查找指定值</li>
 * </ul>
 *
 * @author AI Assistant
 * @version 1.0.0
 * @since 2024-01-01
 */
@Getter
@AllArgsConstructor
public enum CalculationType {

    /**
     * 求和
     */
    SUM("SUM", "求和", "=SUM(range)"),
    
    /**
     * 平均值
     */
    AVERAGE("AVERAGE", "平均值", "=AVERAGE(range)"),
    
    /**
     * 计数
     */
    COUNT("COUNT", "计数", "=COUNT(range)"),
    
    /**
     * 最大值
     */
    MAX("MAX", "最大值", "=MAX(range)"),
    
    /**
     * 最小值
     */
    MIN("MIN", "最小值", "=MIN(range)"),
    
    /**
     * 自定义公式
     */
    CUSTOM("CUSTOM", "自定义", "自定义表达式"),
    
    /**
     * 文本连接
     */
    CONCATENATE("CONCATENATE", "文本连接", "=CONCATENATE(text1,text2,...)"),
    
    /**
     * 垂直查找
     */
    VLOOKUP("VLOOKUP", "垂直查找", "=VLOOKUP(lookup_value,table,col_index,range_lookup)"),
    
    /**
     * 条件求和
     */
    SUMIF("SUMIF", "条件求和", "=SUMIF(range,criteria,sum_range)"),
    
    /**
     * 条件计数
     */
    COUNTIF("COUNTIF", "条件计数", "=COUNTIF(range,criteria)"),
    
    /**
     * 百分比
     */
    PERCENTAGE("PERCENTAGE", "百分比", "=(part/total)*100"),
    
    /**
     * 增长率
     */
    GROWTH("GROWTH", "增长率", "=(new-old)/old*100");

    private final String code;
    private final String description;
    private final String example;

    /**
     * 根据代码获取枚举值
     * 
     * @param code 枚举代码
     * @return 对应的枚举值，如果不存在则返回SUM
     */
    @JsonCreator
    public static CalculationType fromCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            return SUM;
        }
        
        String trimmedCode = code.trim().toUpperCase();
        
        for (CalculationType type : values()) {
            if (type.getCode().equals(trimmedCode) || 
                type.name().equals(trimmedCode) ||
                type.getDescription().equals(trimmedCode)) {
                return type;
            }
        }
        
        return SUM;
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
     * 检查是否为聚合计算类型
     * 
     * @return true表示是聚合计算（如SUM、COUNT等）
     */
    public boolean isAggregateType() {
        return this == SUM || this == AVERAGE || this == COUNT || 
               this == MAX || this == MIN || this == SUMIF || this == COUNTIF;
    }

    /**
     * 检查是否为查找类型
     * 
     * @return true表示是查找计算
     */
    public boolean isLookupType() {
        return this == VLOOKUP;
    }

    /**
     * 检查是否为条件计算类型
     * 
     * @return true表示需要条件参数
     */
    public boolean isConditionalType() {
        return this == SUMIF || this == COUNTIF;
    }

    /**
     * 检查是否为自定义类型
     * 
     * @return true表示是自定义计算
     */
    public boolean isCustomType() {
        return this == CUSTOM;
    }

    /**
     * 获取计算所需的最小参数数量
     * 
     * @return 最小参数数量
     */
    public int getMinParameters() {
        switch (this) {
            case SUM:
            case AVERAGE:
            case COUNT:
            case MAX:
            case MIN:
            case PERCENTAGE:
            case GROWTH:
                return 2;
            case SUMIF:
            case COUNTIF:
                return 2;
            case VLOOKUP:
                return 3;
            case CONCATENATE:
                return 2;
            case CUSTOM:
                return 1; // 自定义至少需要一个表达式
            default:
                return 1;
        }
    }

    /**
     * 获取计算结果的数据类型
     * 
     * @return 计算结果的数据类型
     */
    public CellDataType getResultDataType() {
        switch (this) {
            case SUM:
            case AVERAGE:
            case MAX:
            case MIN:
            case SUMIF:
            case PERCENTAGE:
            case GROWTH:
                return CellDataType.NUMBER;
            case COUNT:
            case COUNTIF:
                return CellDataType.NUMBER;
            case CONCATENATE:
                return CellDataType.TEXT;
            case VLOOKUP:
                return CellDataType.TEXT; // 可能返回其他类型，取决于查找结果
            case CUSTOM:
                return CellDataType.FORMULA; // 自定义公式，结果类型不确定
            default:
                return CellDataType.TEXT;
        }
    }

    /**
     * 验证公式参数是否有效
     * 
     * @param parameters 参数数组
     * @return true表示参数有效
     */
    public boolean validateParameters(String[] parameters) {
        if (parameters == null || parameters.length < getMinParameters()) {
            return false;
        }

        switch (this) {
            case SUMIF:
            case COUNTIF:
                // 条件计算需要两个参数：范围和条件
                return parameters.length >= 2;
            case VLOOKUP:
                // VLOOKUP需要4个参数：查找值、表格、列索引、精确匹配
                return parameters.length >= 4;
            case CONCATENATE:
                // CONCATENATE至少需要两个文本参数
                return parameters.length >= 2;
            default:
                return true;
        }
    }

    /**
     * 生成默认的计算表达式
     * 
     * @param parameters 计算参数
     * @return 计算表达式字符串
     */
    public String generateFormula(String... parameters) {
        if (!validateParameters(parameters)) {
            throw new IllegalArgumentException("参数数量或格式不正确");
        }

        switch (this) {
            case SUM:
                return String.format("=%s(%s)", code, String.join(",", parameters));
            case AVERAGE:
                return String.format("=%s(%s)", code, String.join(",", parameters));
            case COUNT:
                return String.format("=%s(%s)", code, String.join(",", parameters));
            case MAX:
                return String.format("=%s(%s)", code, String.join(",", parameters));
            case MIN:
                return String.format("=%s(%s)", code, String.join(",", parameters));
            case SUMIF:
                return String.format("=%s(%s,%s%s)", code, 
                    parameters[0], parameters[1], 
                    parameters.length > 2 ? "," + parameters[2] : "");
            case COUNTIF:
                return String.format("=%s(%s,%s)", code, parameters[0], parameters[1]);
            case VLOOKUP:
                return String.format("=%s(%s,%s,%s,%s)", code, 
                    parameters[0], parameters[1], parameters[2], parameters[3]);
            case CONCATENATE:
                return String.format("=%s(%s)", code, String.join(",", parameters));
            case PERCENTAGE:
                return String.format("=(%s/%s)*100", parameters[0], parameters[1]);
            case GROWTH:
                return String.format("=(%s-%s)/%s*100", parameters[0], parameters[1], parameters[1]);
            case CUSTOM:
                return "=" + parameters[0]; // 直接使用自定义表达式
            default:
                return "=" + String.join("", parameters);
        }
    }

    /**
     * 检查公式是否依赖多个单元格
     * 
     * @return true表示可能依赖多个单元格
     */
    public boolean hasMultipleDependencies() {
        return isAggregateType() || isConditionalType() || this == VLOOKUP;
    }

    @Override
    public String toString() {
        return this.description + "(" + this.code + ")";
    }
}