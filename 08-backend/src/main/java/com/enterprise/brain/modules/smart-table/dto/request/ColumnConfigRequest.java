package com.enterprise.brain.modules.smarttable.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.JsonGetter;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.io.Serializable;
import java.util.Map;

/**
 * 列配置请求DTO
 * 用于接收智能表格列的创建和更新请求参数
 * 包含列的基本属性、配置信息和验证规则
 * 
 * @author Enterprise Brain Team
 * @version 2.0.0
 * @since 2024-01-01
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = {"columnName", "columnType", "columnIndex"})
@ToString(of = {"columnName", "columnType", "columnIndex", "isFormulaColumn"})
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "列配置请求参数")
public class ColumnConfigRequest implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 列名称
     * 必填项，用于标识列的显示名称
     * 长度限制：1-50个字符
     * 支持中英文、数字、下划线
     */
    @NotBlank(message = "列名称不能为空")
    @Size(min = 1, max = 50, message = "列名称长度必须在1-50字符之间")
    @Pattern(regexp = "^[\\u4e00-\\u9fa5a-zA-Z0-9_\\-\\s]+$", message = "列名称只能包含中文、英文字母、数字、下划线、连字符和空格")
    @Schema(description = "列名称", example = "销售额", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("columnName")
    private String columnName;
    
    /**
     * 列数据类型
     * 必填项，支持的数据类型由ColumnType枚举定义
     * 包括：TEXT(文本), NUMBER(数字), DATE(日期), BOOLEAN(布尔值), FORMULA(公式)
     */
    @NotBlank(message = "列类型不能为空")
    @Schema(
        description = "列数据类型", 
        example = ColumnType.NUMBER, 
        requiredMode = Schema.RequiredMode.REQUIRED,
        allowableValues = {"TEXT", "NUMBER", "DATE", "BOOLEAN", "FORMULA"}
    )
    @JsonProperty("columnType")
    private String columnType;
    
    /**
     * 列索引位置
     * 用于确定列在表格中的显示顺序，从0开始
     * 范围：0-999
     */
    @NotNull(message = "列索引不能为空")
    @Min(value = 0, message = "列索引不能小于0")
    @Max(value = 999, message = "列索引不能大于999")
    @Schema(description = "列索引位置", example = "1", minimum = "0", maximum = "999")
    @JsonProperty("columnIndex")
    private Integer columnIndex;
    
    /**
     * 是否为公式列
     * 标识该列是否使用公式计算
     * 默认值为false
     */
    @Schema(description = "是否为公式列", example = "false")
    @JsonProperty("isFormulaColumn")
    private Boolean isFormulaColumn;
    
    /**
     * 公式表达式
     * 当isFormulaColumn为true时必填
     * 支持Excel风格的公式语法
     * 长度限制：最大1000字符
     * 
     * 示例：
     * - "=SUM(A1:A10)" - 求和
     * - "=A1*B1" - 乘法运算
     * - "=IF(A1>0, A1, 0)" - 条件判断
     * - "=VLOOKUP(A1, B1:C10, 2, FALSE)" - 查找函数
     */
    @Pattern(regexp = "^=.*", message = "公式表达式必须以=开头")
    @Size(max = 1000, message = "公式表达式不能超过1000字符")
    @Schema(
        description = "公式表达式，当isFormulaColumn为true时必填", 
        example = "=SUM(A1:A10)"
    )
    @JsonProperty("formulaExpression")
    private String formulaExpression;
    
    /**
     * 列配置信息
     * JSON格式的字符串，包含列的详细配置信息
     * 支持以下配置项：
     * - width: 列宽度（像素）
     * - align: 对齐方式（left/center/right）
     * - format: 数字格式（如currency, percentage）
     * - decimalPlaces: 小数位数（数字类型专用）
     * - dateFormat: 日期格式（日期类型专用）
     * - editable: 是否可编辑
     * - required: 是否必填
     * - defaultValue: 默认值
     * 
     * 示例：{"width": 120, "align": "center", "format": "currency", "decimalPlaces": 2}
     */
    @Size(max = 2000, message = "列配置不能超过2000字符")
    @Schema(
        description = "列配置信息(JSON格式)", 
        example = "{\"width\": 120, \"align\": \"center\", \"format\": \"currency\", \"decimalPlaces\": 2}"
    )
    @JsonProperty("columnConfig")
    private String columnConfig;
    
    /**
     * 列类型枚举
     * 定义支持的列数据类型
     */
    public enum ColumnType {
        /**
         * 文本类型
         */
        TEXT("text", "文本"),
        
        /**
         * 数字类型
         */
        NUMBER("number", "数字"),
        
        /**
         * 日期类型
         */
        DATE("date", "日期"),
        
        /**
         * 布尔类型
         */
        BOOLEAN("boolean", "布尔值"),
        
        /**
         * 公式类型
         */
        FORMULA("formula", "公式");
        
        private final String code;
        private final String description;
        
        ColumnType(String code, String description) {
            this.code = code;
            this.description = description;
        }
        
        public String getCode() {
            return code;
        }
        
        public String getDescription() {
            return description;
        }
        
        /**
         * 根据代码获取列类型
         * 
         * @param code 类型代码
         * @return 对应的列类型，如果不存在则返回TEXT
         */
        public static ColumnType fromCode(String code) {
            for (ColumnType type : values()) {
                if (type.code.equalsIgnoreCase(code)) {
                    return type;
                }
            }
            return TEXT; // 默认返回文本类型
        }
    }
    
    // ==================== 业务逻辑方法 ====================
    
    /**
     * 获取列类型的枚举值
     * 
     * @return 列类型枚举
     */
    public ColumnType getColumnTypeEnum() {
        return ColumnType.fromCode(this.columnType);
    }
    
    /**
     * 检查是否为公式列
     * 
     * @return true表示是公式列
     */
    public boolean isFormulaColumnComputed() {
        return Boolean.TRUE.equals(isFormulaColumn) || 
               ColumnType.FORMULA.equals(getColumnTypeEnum());
    }
    
    /**
     * 获取解析后的列配置
     * 
     * @return 解析后的配置Map，如果解析失败返回空Map
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getParsedColumnConfig() {
        if (columnConfig == null || columnConfig.trim().isEmpty()) {
            return Map.of();
        }
        
        try {
            // 这里应该使用合适的JSON解析库，如Jackson或Gson
            // 为了简化示例，这里返回空Map
            // 实际实现中应该使用: objectMapper.readValue(columnConfig, Map.class)
            return Map.of();
        } catch (Exception e) {
            // 记录解析错误
            return Map.of();
        }
    }
    
    /**
     * 验证配置的完整性
     * 
     * @return 验证结果，包含错误信息
     */
    public ValidationResult validate() {
        ValidationResult result = new ValidationResult();
        
        // 验证公式列必须有公式表达式
        if (isFormulaColumnComputed() && (formulaExpression == null || formulaExpression.trim().isEmpty())) {
            result.addError("公式列必须提供公式表达式");
        }
        
        // 验证非公式列不能有公式表达式
        if (!isFormulaColumnComputed() && formulaExpression != null && !formulaExpression.trim().isEmpty()) {
            result.addError("非公式列不能提供公式表达式");
        }
        
        // 验证列配置格式
        if (columnConfig != null && !columnConfig.trim().isEmpty()) {
            if (!isValidJson(columnConfig)) {
                result.addError("列配置格式不正确，必须是有效的JSON格式");
            }
        }
        
        // 验证列索引唯一性（这里只能做基本检查）
        if (columnIndex != null && columnIndex < 0) {
            result.addError("列索引不能为负数");
        }
        
        return result;
    }
    
    /**
     * 检查字符串是否为有效JSON格式
     * 
     * @param jsonString 要检查的字符串
     * @return true表示是有效JSON
     */
    private boolean isValidJson(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty()) {
            return false;
        }
        
        try {
            // 简单的JSON格式检查
            jsonString = jsonString.trim();
            return (jsonString.startsWith("{") && jsonString.endsWith("}")) ||
                   (jsonString.startsWith("[") && jsonString.endsWith("]"));
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 验证结果类
     */
    public static class ValidationResult {
        private final java.util.List<String> errors = new java.util.ArrayList<>();
        
        public void addError(String error) {
            errors.add(error);
        }
        
        public java.util.List<String> getErrors() {
            return new java.util.ArrayList<>(errors);
        }
        
        public boolean hasErrors() {
            return !errors.isEmpty();
        }
        
        public String getErrorMessage() {
            return String.join("; ", errors);
        }
    }
    
    // ==================== 便捷的Builder方法 ====================
    
    /**
     * 创建文本类型列的请求
     * 
     * @param columnName 列名称
     * @param columnIndex 列索引
     * @return 列配置请求构建器
     */
    public static ColumnConfigRequestBuilder textColumn(String columnName, Integer columnIndex) {
        return ColumnConfigRequest.builder()
                .columnName(columnName)
                .columnType(ColumnType.TEXT.getCode())
                .columnIndex(columnIndex)
                .isFormulaColumn(false);
    }
    
    /**
     * 创建数字类型列的请求
     * 
     * @param columnName 列名称
     * @param columnIndex 列索引
     * @return 列配置请求构建器
     */
    public static ColumnConfigRequestBuilder numberColumn(String columnName, Integer columnIndex) {
        return ColumnConfigRequest.builder()
                .columnName(columnName)
                .columnType(ColumnType.NUMBER.getCode())
                .columnIndex(columnIndex)
                .isFormulaColumn(false);
    }
    
    /**
     * 创建公式类型列的请求
     * 
     * @param columnName 列名称
     * @param columnIndex 列索引
     * @param formulaExpression 公式表达式
     * @return 列配置请求构建器
     */
    public static ColumnConfigRequestBuilder formulaColumn(String columnName, Integer columnIndex, String formulaExpression) {
        return ColumnConfigRequest.builder()
                .columnName(columnName)
                .columnType(ColumnType.FORMULA.getCode())
                .columnIndex(columnIndex)
                .isFormulaColumn(true)
                .formulaExpression(formulaExpression);
    }
    
    // ==================== 重写的方法 ====================
    
    @Override
    public String toString() {
        return "ColumnConfigRequest{" +
                "columnName='" + columnName + '\'' +
                ", columnType='" + columnType + '\'' +
                ", columnIndex=" + columnIndex +
                ", isFormulaColumn=" + isFormulaColumn +
                (formulaExpression != null ? ", formulaExpression='" + formulaExpression + '\'' : "") +
                (columnConfig != null ? ", columnConfig='" + columnConfig + '\'' : "") +
                '}';
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        
        ColumnConfigRequest that = (ColumnConfigRequest) o;
        
        if (!java.util.Objects.equals(columnName, that.columnName)) return false;
        if (!java.util.Objects.equals(columnType, that.columnType)) return false;
        return java.util.Objects.equals(columnIndex, that.columnIndex);
    }
    
    @Override
    public int hashCode() {
        return java.util.Objects.hash(columnName, columnType, columnIndex);
    }
}