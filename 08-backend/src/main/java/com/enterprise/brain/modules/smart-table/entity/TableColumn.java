package com.enterprise.brain.modules.smart-table.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import javax.validation.constraints.Min;
import javax.validation.constraints.Max;
import java.time.LocalDateTime;

/**
 * 表格列实体类
 * 
 * <p>智能表格中列的核心实体，用于管理列的配置、样式、验证规则等。</p>
 * <p>支持多种数据类型、列宽设置、冻结功能等。</p>
 * 
 * <p>主要功能：</p>
 * <ul>
 *   <li>列基本信息管理：名称、类型、索引位置等</li>
 *   <li>数据类型配置：文本、数字、日期、布尔等类型</li>
 *   <li>样式配置：宽度、对齐、背景色等</li>
 *   <li>验证规则：必填、格式验证等</li>
 *   <li>公式支持：计算列配置</li>
 *   <li>显示控制：隐藏、冻结、排序等</li>
 * </ul>
 * 
 * @author enterprise-brain-team
 * @version 2.0
 * @since 2024-01-01
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "table_column",
       indexes = {
           @Index(name = "idx_column_table_id", columnList = "table_id"),
           @Index(name = "idx_column_index", columnList = "column_index"),
           @Index(name = "idx_column_is_deleted", columnList = "is_deleted"),
           @Index(name = "idx_column_create_time", columnList = "create_time")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_column_table_index", 
                           columnNames = {"table_id", "column_index"})
       })
@EqualsAndHashCode(callSuper = false, exclude = {"table", "formula", "createUser", "updateUser"})
public class TableColumn {
    
    // ==================== 主键字段 ====================
    
    /**
     * 列主键ID
     * 
     * <p>采用数据库自增策略生成主键。</p>
     * <p>用于唯一标识列记录。</p>
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;
    
    // ==================== 关联字段 ====================
    
    /**
     * 所属智能表格
     * 
     * <p>指向所属的智能表格实体。</p>
     * <p>建立多对一关联关系，一个表格包含多个列。</p>
     */
    @NotNull(message = "表格ID不能为空")
    @Column(name = "table_id", nullable = false, columnDefinition = "BIGINT NOT NULL COMMENT '表格ID'")
    private Long tableId;
    
    /**
     * 关联的公式
     * 
     * <p>当列为计算列时，关联的公式实体。</p>
     * <p>用于实现列级别的计算功能。</p>
     */
    @Column(name = "formula_id", columnDefinition = "BIGINT COMMENT '公式ID'")
    private Long formulaId;
    
    // ==================== 基础信息字段 ====================
    
    /**
     * 列名称
     * 
     * <p>列的显示名称，用于用户识别和展示。</p>
     * <p>支持最长100个字符的列名称。</p>
     */
    @NotBlank(message = "列名称不能为空")
    @Size(min = 1, max = 100, message = "列名称长度必须在1-100个字符之间")
    @Column(name = "column_name", nullable = false, length = 100, columnDefinition = "VARCHAR(100) NOT NULL COMMENT '列名称'")
    private String columnName;
    
    /**
     * 列标识符
     * 
     * <p>列的唯一标识符，用于程序内部引用。</p>
     * <p>通常使用字母或字母+数字组合（如：A, B, COL1等）。</p>
     */
    @NotBlank(message = "列标识符不能为空")
    @Size(min = 1, max = 50, message = "列标识符长度必须在1-50个字符之间")
    @Column(name = "column_key", nullable = false, length = 50, columnDefinition = "VARCHAR(50) NOT NULL COMMENT '列标识符'")
    private String columnKey;
    
    /**
     * 列描述
     * 
     * <p>列的详细说明信息，用于描述列用途和内容。</p>
     * <p>支持最长500个字符的详细描述。</p>
     */
    @Size(max = 500, message = "列描述不能超过500个字符")
    @Column(name = "column_description", length = 500, columnDefinition = "TEXT COMMENT '列描述'")
    private String columnDescription;
    
    // ==================== 位置和顺序字段 ====================
    
    /**
     * 列索引位置
     * 
     * <p>列在表格中的显示位置，从0开始计数。</p>
     * <p>用于列排序和显示控制。</p>
     */
    @Min(value = 0, message = "列索引不能小于0")
    @NotNull(message = "列索引不能为空")
    @Column(name = "column_index", nullable = false, columnDefinition = "INT NOT NULL COMMENT '列索引位置'")
    private Integer columnIndex;
    
    /**
     * 列宽度（像素）
     * 
     * <p>列的显示宽度，单位为像素。</p>
     * <p>默认值为100像素，最小值20像素，最大值1000像素。</p>
     */
    @Min(value = 20, message = "列宽度不能小于20像素")
    @Max(value = 1000, message = "列宽度不能超过1000像素")
    @Builder.Default
    @Column(name = "column_width", nullable = false, columnDefinition = "INT DEFAULT 100 COMMENT '列宽度（像素）'")
    private Integer columnWidth = 100;
    
    // ==================== 数据类型字段 ====================
    
    /**
     * 列数据类型
     * 
     * <p>标识列存储的数据类型：</p>
     * <ul>
     *   <li>TEXT: 文本类型</li>
     *   <li>NUMBER: 数字类型</li>
     *   <li>DATE: 日期类型</li>
     *   <li>BOOLEAN: 布尔类型</li>
     *   <li>URL: 链接类型</li>
     *   <li>EMAIL: 邮箱类型</li>
     *   <li>CURRENCY: 货币类型</li>
     *   <li>PERCENTAGE: 百分比类型</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "column_type", nullable = false, length = 20, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'TEXT' COMMENT '列数据类型'")
    private ColumnType columnType = ColumnType.TEXT;
    
    /**
     * 默认值
     * 
     * <p>列的默认值，新增行时自动应用。</p>
     * <p>支持最长500个字符的默认值。</p>
     */
    @Size(max = 500, message = "默认值不能超过500个字符")
    @Column(name = "default_value", length = 500, columnDefinition = "VARCHAR(500) COMMENT '默认值'")
    private String defaultValue;
    
    // ==================== 计算相关字段 ====================
    
    /**
     * 是否为公式列
     * 
     * <p>标识该列是否为计算列：</p>
     * <ul>
     *   <li>true: 公式列，值由公式计算得出</li>
     *   <li>false: 普通列，值为用户直接输入</li>
     * </ul>
     */
    @Builder.Default
    @Column(name = "is_formula_column", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0 COMMENT '是否为公式列'")
    private Boolean isFormulaColumn = false;
    
    /**
     * 公式表达式
     * 
     * <p>公式列的计算表达式。</p>
     * <p>仅当isFormulaColumn为true时有值。</p>
     */
    @Size(max = 1000, message = "公式表达式不能超过1000个字符")
    @Column(name = "formula_expression", length = 1000, columnDefinition = "TEXT COMMENT '公式表达式'")
    private String formulaExpression;
    
    // ==================== 验证规则字段 ====================
    
    /**
     * 是否必填
     * 
     * <p>控制该列是否为必填列：</p>
     * <ul>
     *   <li>true: 必填，不允许空值</li>
     *   <li>false: 可选，允许空值</li>
     * </ul>
     */
    @Builder.Default
    @Column(name = "is_required", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0 COMMENT '是否必填'")
    private Boolean isRequired = false;
    
    /**
     * 验证规则
     * 
     * <p>列的验证规则配置：</p>
     * <ul>
     *   <li>NONE: 无验证</li>
     *   <li>TEXT_FORMAT: 文本格式验证</li>
     *   <li>NUMBER_RANGE: 数字范围验证</li>
     *   <li>DATE_RANGE: 日期范围验证</li>
     *   <li>CUSTOM: 自定义验证</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "validation_rule", nullable = false, length = 20, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'NONE' COMMENT '验证规则'")
    private ValidationRule validationRule = ValidationRule.NONE;
    
    /**
     * 验证参数
     * 
     * <p>验证规则的参数配置，JSON格式。</p>
     * <p>如数字范围、正则表达式等。</p>
     */
    @Column(name = "validation_params", columnDefinition = "JSON COMMENT '验证参数'")
    private String validationParams;
    
    // ==================== 显示控制字段 ====================
    
    /**
     * 是否显示
     * 
     * <p>控制列是否在界面中显示：</p>
     * <ul>
     *   <li>true: 显示</li>
     *   <li>false: 隐藏</li>
     * </ul>
     * <p>默认值为true。</p>
     */
    @Builder.Default
    @Column(name = "is_visible", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1 COMMENT '是否显示'")
    private Boolean isVisible = true;
    
    /**
     * 是否可编辑
     * 
     * <p>控制列是否允许编辑：</p>
     * <ul>
     *   <li>true: 可编辑</li>
     *   <li>false: 只读</li>
     * </ul>
     * <p>默认值为true。</p>
     */
    @Builder.Default
    @Column(name = "is_editable", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1 COMMENT '是否可编辑'")
    private Boolean isEditable = true;
    
    /**
     * 是否可排序
     * 
     * <p>控制列是否支持排序功能：</p>
     * <ul>
     *   <li>true: 支持排序</li>
     *   <li>false: 不支持排序</li>
     * </ul>
     * <p>默认值为true。</p>
     */
    @Builder.Default
    @Column(name = "is_sortable", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1 COMMENT '是否可排序'")
    private Boolean isSortable = true;
    
    /**
     * 是否冻结列
     * 
     * <p>控制列是否冻结在左侧：</p>
     * <ul>
     *   <li>true: 冻结列，滚动时固定显示</li>
     *   <li>false: 普通列，随表格滚动</li>
     * </ul>
     * <p>默认值为false。</p>
     */
    @Builder.Default
    @Column(name = "is_frozen", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0 COMMENT '是否冻结列'")
    private Boolean isFrozen = false;
    
    // ==================== 样式配置字段 ====================
    
    /**
     * 文本对齐方式
     * 
     * <p>列内容的对齐方式：</p>
     * <ul>
     *   <li>LEFT: 左对齐</li>
     *   <li>CENTER: 居中对齐</li>
     *   <li>RIGHT: 右对齐</li>
     *   <li>JUSTIFY: 两端对齐</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "text_align", nullable = false, length = 10, columnDefinition = "VARCHAR(10) NOT NULL DEFAULT 'LEFT' COMMENT '文本对齐方式'")
    private TextAlign textAlign = TextAlign.LEFT;
    
    /**
     * 背景颜色
     * 
     * <p>列的背景颜色，十六进制格式。</p>
     * <p>如：#FFFFFF, #FF0000等。</p>
     */
    @Size(max = 7, message = "背景颜色格式不正确")
    @Column(name = "background_color", length = 7, columnDefinition = "VARCHAR(7) COMMENT '背景颜色'")
    private String backgroundColor;
    
    /**
     * 字体颜色
     * 
     * <p>列的字体颜色，十六进制格式。</p>
     * <p>如：#000000, #333333等。</p>
     */
    @Size(max = 7, message = "字体颜色格式不正确")
    @Column(name = "font_color", length = 7, columnDefinition = "VARCHAR(7) COMMENT '字体颜色'")
    private String fontColor;
    
    // ==================== 扩展配置字段 ====================
    
    /**
     * 列配置
     * 
     * <p>JSON格式的列扩展配置。</p>
     * <p>用于存储自定义属性和高级配置。</p>
     */
    @Column(name = "column_config", columnDefinition = "JSON COMMENT '列配置'")
    private String columnConfig;
    
    /**
     * 列标签
     * 
     * <p>用于分类和搜索的标签信息。</p>
     * <p>多个标签用逗号分隔。</p>
     */
    @Size(max = 200, message = "标签总长度不能超过200个字符")
    @Column(name = "tags", length = 200, columnDefinition = "VARCHAR(200) COMMENT '标签'")
    private String tags;
    
    /**
     * 排序权重
     * 
     * <p>用于排序和优先级控制。</p>
     * <p>数值越大优先级越高。</p>
     */
    @Builder.Default
    @Column(name = "sort_weight", nullable = false, columnDefinition = "INT DEFAULT 0 COMMENT '排序权重'")
    private Integer sortWeight = 0;
    
    // ==================== 审计字段 ====================
    
    /**
     * 创建时间
     * 
     * <p>记录列创建的时间戳。</p>
     * <p>创建时自动设置为当前时间。</p>
     */
    @Builder.Default
    @Column(name = "create_time", nullable = false, updatable = false, columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'")
    private LocalDateTime createTime = LocalDateTime.now();
    
    /**
     * 更新时间
     * 
     * <p>记录列最后更新的时间戳。</p>
     * <p>每次更新时自动设置为当前时间。</p>
     */
    @Column(name = "update_time", columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'")
    private LocalDateTime updateTime;
    
    /**
     * 创建者ID
     * 
     * <p>记录创建列的用户ID。</p>
     * <p>用于操作审计和权限控制。</p>
     */
    @Column(name = "creator_id", columnDefinition = "BIGINT COMMENT '创建者ID'")
    private Long creatorId;
    
    /**
     * 乐观锁版本号
     * 
     * <p>用于乐观锁控制，防止并发更新冲突。</p>
     * <p>每次更新时自动递增。</p>
     */
    @Version
    @Builder.Default
    @Column(name = "version", nullable = false, columnDefinition = "BIGINT DEFAULT 0 COMMENT '乐观锁版本号'")
    private Long version = 0L;
    
    /**
     * 删除标记
     * 
     * <p>逻辑删除标记，实现软删除功能：</p>
     * <ul>
     *   <li>true: 已删除，逻辑上不可用</li>
     *   <li>false: 未删除，正常状态</li>
     * </ul>
     * <p>默认值为false，删除时设置为true。</p>
     */
    @Builder.Default
    @Column(name = "is_deleted", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0 COMMENT '删除标记'")
    private Boolean isDeleted = false;
    
    // ==================== 关联字段 ====================
    
    /**
     * 关联的智能表格
     * 
     * <p>延迟加载关联的智能表格实体。</p>
     * <p>用于获取表格详细信息。</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", foreignKey = @ForeignKey(name = "fk_column_table"), insertable = false, updatable = false)
    private SmartTable table;
    
    /**
     * 关联的表格公式
     * 
     * <p>延迟加载关联的公式实体。</p>
     * <p>用于获取公式详细信息。</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formula_id", foreignKey = @ForeignKey(name = "fk_column_formula"), insertable = false, updatable = false)
    private TableFormula formula;
    
    // ==================== 枚举定义 ====================
    
    /**
     * 列数据类型枚举
     */
    public enum ColumnType {
        TEXT("文本"),
        NUMBER("数字"),
        DATE("日期"),
        BOOLEAN("布尔"),
        URL("链接"),
        EMAIL("邮箱"),
        CURRENCY("货币"),
        PERCENTAGE("百分比"),
        SELECT("选择"),
        MULTI_SELECT("多选"),
        RATING("评分"),
        FILE("文件"),
        IMAGE("图片");
        
        private final String description;
        
        ColumnType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 验证规则枚举
     */
    public enum ValidationRule {
        NONE("无验证"),
        TEXT_FORMAT("文本格式"),
        NUMBER_RANGE("数字范围"),
        DATE_RANGE("日期范围"),
        REGEX("正则表达式"),
        CUSTOM("自定义");
        
        private final String description;
        
        ValidationRule(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 文本对齐方式枚举
     */
    public enum TextAlign {
        LEFT("左对齐"),
        CENTER("居中对齐"),
        RIGHT("右对齐"),
        JUSTIFY("两端对齐");
        
        private final String description;
        
        TextAlign(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // ==================== 业务方法 ====================
    
    /**
     * 检查列是否激活
     * 
     * <p>判断列是否处于可用状态。</p>
     * 
     * @return true表示列激活，false表示列未激活
     */
    public boolean isActive() {
        return Boolean.TRUE.equals(isVisible) && 
               Boolean.TRUE.equals(isEditable) && 
               Boolean.FALSE.equals(isDeleted);
    }
    
    /**
     * 检查是否为必填列
     * 
     * @return true表示必填，false表示可选
     */
    public boolean isRequiredColumn() {
        return Boolean.TRUE.equals(isRequired);
    }
    
    /**
     * 检查是否为公式列
     * 
     * @return true表示是公式列，false表示普通列
     */
    public boolean isFormulaColumn() {
        return Boolean.TRUE.equals(isFormulaColumn);
    }
    
    /**
     * 检查是否冻结列
     * 
     * @return true表示冻结列，false表示普通列
     */
    public boolean isFrozenColumn() {
        return Boolean.TRUE.equals(isFrozen);
    }
    
    /**
     * 设置为公式列
     * 
     * @param formulaFlag 是否为公式列
     * @param expression 公式表达式
     */
    public void setAsFormulaColumn(boolean formulaFlag, String expression) {
        this.isFormulaColumn = formulaFlag;
        this.formulaExpression = formulaFlag ? expression : null;
        if (formulaFlag) {
            this.isEditable = false; // 公式列默认不可编辑
        }
    }
    
    /**
     * 获取列类型描述
     * 
     * @return 列类型的中文描述
     */
    public String getColumnTypeDescription() {
        return columnType != null ? columnType.getDescription() : "未知";
    }
    
    /**
     * 获取验证规则描述
     * 
     * @return 验证规则的中文描述
     */
    public String getValidationRuleDescription() {
        return validationRule != null ? validationRule.getDescription() : "未知";
    }
    
    /**
     * 获取对齐方式描述
     * 
     * @return 对齐方式的中文描述
     */
    public String getTextAlignDescription() {
        return textAlign != null ? textAlign.getDescription() : "未知";
    }
    
    // ==================== JPA生命周期回调 ====================
    
    /**
     * 保存前回调
     * 
     * <p>在实体保存前执行，用于设置默认值和业务校验。</p>
     */
    @PrePersist
    protected void onCreate() {
        if (createTime == null) {
            createTime = LocalDateTime.now();
        }
        if (isVisible == null) {
            isVisible = true;
        }
        if (isEditable == null) {
            isEditable = true;
        }
        if (isSortable == null) {
            isSortable = true;
        }
        if (isFrozen == null) {
            isFrozen = false;
        }
        if (isRequired == null) {
            isRequired = false;
        }
        if (isFormulaColumn == null) {
            isFormulaColumn = false;
        }
        if (columnWidth == null) {
            columnWidth = 100;
        }
        if (sortWeight == null) {
            sortWeight = 0;
        }
        if (version == null) {
            version = 0L;
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
        if (columnType == null) {
            columnType = ColumnType.TEXT;
        }
        if (textAlign == null) {
            textAlign = TextAlign.LEFT;
        }
        if (validationRule == null) {
            validationRule = ValidationRule.NONE;
        }
    }
    
    /**
     * 更新前回调
     * 
     * <p>在实体更新前执行，用于更新时间戳和业务校验。</p>
     */
    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}