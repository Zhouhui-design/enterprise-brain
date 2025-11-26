package com.enterprise.brain.modules.smart-table.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.math.BigDecimal;

/**
 * 表格单元格实体类
 * 
 * <p>智能表格中单元格的核心实体，用于管理单元格的数据内容、格式、计算状态等。</p>
 * <p>支持多种数据类型、样式配置、验证规则等功能。</p>
 * 
 * <p>主要功能：</p>
 * <ul>
 *   <li>数据内容管理：支持文本、数字、日期、链接等多种数据类型</li>
 *   <li>样式和格式：字体、颜色、对齐、边框等样式配置</li>
 *   <li>计算状态：记录单元格的计算状态和结果</li>
 *   <li>数据验证：内置验证规则和自定义验证</li>
 *   <li>权限控制：单元格级别的读写权限控制</li>
 *   <li>批操作支持：批量导入、导出、更新等操作</li>
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
@Table(name = "table_cell",
       indexes = {
           @Index(name = "idx_cell_table_id", columnList = "table_id"),
           @Index(name = "idx_cell_row_id", columnList = "row_id"),
           @Index(name = "idx_cell_column_id", columnList = "column_id"),
           @Index(name = "idx_cell_cell_key", columnList = "cell_key"),
           @Index(name = "idx_cell_is_calculated", columnList = "is_calculated"),
           @Index(name = "idx_cell_create_time", columnList = "create_time")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_cell_table_row_col", 
                           columnNames = {"table_id", "row_id", "column_id"})
       })
@EqualsAndHashCode(callSuper = false, exclude = {"table", "row", "column", "createUser", "updateUser"})
public class TableCell {
    
    // ==================== 主键字段 ====================
    
    /**
     * 单元格主键ID
     * 
     * <p>采用数据库自增策略生成主键。</p>
     * <p>用于唯一标识单元格记录。</p>
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
     * <p>建立多对一关联关系，一个表格包含多个单元格。</p>
     */
    @NotNull(message = "表格ID不能为空")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "table_id", foreignKey = @ForeignKey(name = "fk_cell_table"), insertable = false, updatable = false)
    private SmartTable table;
    
    /**
     * 所属表格行
     * 
     * <p>指向所属的表格行实体。</p>
     * <p>建立多对一关联关系，一行包含多个单元格。</p>
     */
    @NotNull(message = "行ID不能为空")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "row_id", foreignKey = @ForeignKey(name = "fk_cell_row"), insertable = false, updatable = false)
    private TableRow row;
    
    /**
     * 所属表格列
     * 
     * <p>指向所属的表格列实体。</p>
     * <p>建立多对一关联关系，一列包含多个单元格。</p>
     */
    @NotNull(message = "列ID不能为空")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "column_id", foreignKey = @ForeignKey(name = "fk_cell_column"), insertable = false, updatable = false)
    private TableColumn column;
    
    // ==================== 单元格标识字段 ====================
    
    /**
     * 单元格标识符
     * 
     * <p>表格中的单元格标识符，格式为"列字母+行数字"（如：A1, B2等）。</p>
     * <p>用于单元格引用和导航。</p>
     */
    @NotBlank(message = "单元格标识符不能为空")
    @Pattern(regexp = "^[A-Z]{1,3}[0-9]{1,4}$", message = "单元格标识符格式不正确，应为列字母+行数字")
    @Size(min = 2, max = 7, message = "单元格标识符长度必须在2-7个字符之间")
    @Column(name = "cell_key", nullable = false, length = 7, columnDefinition = "VARCHAR(7) NOT NULL COMMENT '单元格标识符'")
    private String cellKey;
    
    /**
     * 单元格显示名称
     * 
     * <p>单元格的显示名称，用于界面展示。</p>
     * <p>支持最长50个字符的显示名称。</p>
     */
    @Size(max = 50, message = "显示名称不能超过50个字符")
    @Column(name = "display_name", length = 50, columnDefinition = "VARCHAR(50) COMMENT '显示名称'")
    private String displayName;
    
    // ==================== 数据内容字段 ====================
    
    /**
     * 单元格值
     * 
     * <p>单元格存储的数据内容。</p>
     * <p>支持最大5000个字符的文本内容。</p>
     */
    @Size(max = 5000, message = "单元格值不能超过5000个字符")
    @Column(name = "cell_value", columnDefinition = "TEXT COMMENT '单元格值'")
    private String cellValue;
    
    /**
     * 数据类型
     * 
     * <p>标识单元格存储的数据类型：</p>
     * <ul>
     *   <li>TEXT: 文本类型</li>
     *   <li>NUMBER: 数字类型</li>
     *   <li>DATE: 日期类型</li>
     *   <li>BOOLEAN: 布尔类型</li>
     *   <li>URL: 链接类型</li>
     *   <li>EMAIL: 邮箱类型</li>
     *   <li>FORMULA: 公式类型</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "data_type", nullable = false, length = 20, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'TEXT' COMMENT '数据类型'")
    private DataType dataType = DataType.TEXT;
    
    /**
     * 数字值
     * 
     * <p>当数据类型为NUMBER时的精确数值。</p>
     * <p>支持19位精度，6位小数的金融级精度。</p>
     */
    @Column(name = "numeric_value", precision = 19, scale = 6, columnDefinition = "DECIMAL(19,6) COMMENT '数字值'")
    private java.math.BigDecimal numericValue;
    
    /**
     * 日期值
     * 
     * <p>当数据类型为DATE时的日期值。</p>
     * <p>支持精确到秒的时间精度。</p>
     */
    @Column(name = "date_value", columnDefinition = "DATETIME COMMENT '日期值'")
    private Date dateValue;
    
    /**
     * 布尔值
     * 
     * <p>当数据类型为BOOLEAN时的布尔值。</p>
     * <p>默认值为false。</p>
     */
    @Builder.Default
    @Column(name = "boolean_value", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0 COMMENT '布尔值'")
    private Boolean booleanValue = false;
    
    /**
     * 链接URL
     * 
     * <p>当数据类型为URL时的链接地址。</p>
     * <p>支持最长2000个字符的URL地址。</p>
     */
    @Size(max = 2000, message = "链接URL不能超过2000个字符")
    @Column(name = "url_value", length = 2000, columnDefinition = "VARCHAR(2000) COMMENT '链接URL'")
    private String urlValue;
    
    /**
     * 邮箱地址
     * 
     * <p>当数据类型为EMAIL时的邮箱地址。</p>
     * <p>支持标准的邮箱格式。</p>
     */
    @Size(max = 255, message = "邮箱地址不能超过255个字符")
    @Column(name = "email_value", length = 255, columnDefinition = "VARCHAR(255) COMMENT '邮箱地址'")
    private String emailValue;
    
    // ==================== 样式配置字段 ====================
    
    /**
     * 字体样式
     * 
     * <p>单元格的字体样式配置：</p>
     * <ul>
     *   <li>font-family: 字体家族</li>
     *   <li>font-size: 字体大小</li>
     *   <li>font-weight: 字体粗细</li>
     *   <li>color: 字体颜色</li>
     * </ul>
     */
    @Column(name = "font_style", columnDefinition = "JSON COMMENT '字体样式'")
    private String fontStyle;
    
    /**
     * 背景样式
     * 
     * <p>单元格的背景样式配置：</p>
     * <ul>
     *   <li>background-color: 背景颜色</li>
     *   <li>background-image: 背景图片</li>
     *   <li>border-style: 边框样式</li>
     *   <li>border-color: 边框颜色</li>
     * </ul>
     */
    @Column(name = "background_style", columnDefinition = "JSON COMMENT '背景样式'")
    private String backgroundStyle;
    
    /**
     * 文本对齐方式
     * 
     * <p>单元格内容的对齐方式：</p>
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
     * 垂直对齐方式
     * 
     * <p>单元格内容的垂直对齐方式：</p>
     * <ul>
     *   <li>TOP: 顶部对齐</li>
     *   <li>MIDDLE: 垂直居中</li>
     *   <li>BOTTOM: 底部对齐</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "vertical_align", nullable = false, length = 10, columnDefinition = "VARCHAR(10) NOT NULL DEFAULT 'MIDDLE' COMMENT '垂直对齐方式'")
    private VerticalAlign verticalAlign = VerticalAlign.MIDDLE;
    
    /**
     * 边框样式
     * 
     * <p>单元格的边框样式配置：</p>
     * <ul>
     *   <li>NONE: 无边框</li>
     *   <li>SOLID: 实线边框</li>
     *   <li>DASHED: 虚线边框</li>
     *   <li>DOTTED: 点线边框</li>
     *   <li>DOUBLE: 双线边框</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "border_style", nullable = false, length = 10, columnDefinition = "VARCHAR(10) NOT NULL DEFAULT 'SOLID' COMMENT '边框样式'")
    private BorderStyle borderStyle = BorderStyle.SOLID;
    
    // ==================== 计算相关字段 ====================
    
    /**
     * 是否为公式单元格
     * 
     * <p>标识该单元格是否包含公式计算。</p>
     * <ul>
     *   <li>true: 公式单元格，值由公式计算得出</li>
     *   <li>false: 普通单元格，值为用户直接输入</li>
     * </ul>
     */
    @Builder.Default
    @Column(name = "is_formula_cell", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0 COMMENT '是否为公式单元格'")
    private Boolean isFormulaCell = false;
    
    /**
     * 计算公式
     * 
     * <p>该单元格的公式表达式。</p>
     * <p>仅当isFormulaCell为true时有值。</p>
     */
    @Size(max = 1000, message = "公式表达式不能超过1000个字符")
    @Column(name = "formula_expression", length = 1000, columnDefinition = "TEXT COMMENT '计算公式'")
    private String formulaExpression;
    
    /**
     * 计算结果
     * 
     * <p>公式计算的结果值。</p>
     * <p>当计算成功时包含结果，否则为空。</p>
     */
    @Size(max = 1000, message = "计算结果不能超过1000个字符")
    @Column(name = "calculation_result", length = 1000, columnDefinition = "TEXT COMMENT '计算结果'")
    private String calculationResult;
    
    /**
     * 计算状态
     * 
     * <p>标识公式计算的状态：</p>
     * <ul>
     *   <li>UNCALCULATED: 未计算</li>
     *   <li>CALCULATING: 计算中</li>
     *   <li>SUCCESS: 计算成功</li>
     *   <li>FAILED: 计算失败</li>
     *   <li>ERROR: 计算错误</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "calculation_status", nullable = false, length = 20, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'UNCALCULATED' COMMENT '计算状态'")
    private CalculationStatus calculationStatus = CalculationStatus.UNCALCULATED;
    
    /**
     * 计算时间戳
     * 
     * <p>记录公式计算的执行时间。</p>
     * <p>用于计算过程追踪和性能分析。</p>
     */
    @Column(name = "calculation_time", columnDefinition = "DATETIME COMMENT '计算时间'")
    private Date calculationTime;
    
    /**
     * 计算耗时（毫秒）
     * 
     * <p>记录公式计算所需的毫秒数。</p>
     * <p>用于性能分析和优化。</p>
     */
    @Column(name = "calculation_duration", nullable = false, columnDefinition = "BIGINT DEFAULT 0 COMMENT '计算耗时（毫秒）'")
    private Long calculationDuration = 0L;
    
    // ==================== 验证相关字段 ====================
    
    /**
     * 内置验证规则
     * 
     * <p>单元格的验证规则配置：</p>
     * <ul>
     *   <li>REQUIRED: 必填验证</li>
     *   <li>OPTIONAL: 可选验证</li>
     *   <li>CUSTOM: 自定义验证</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "validation_rule", nullable = false, length = 20, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'NONE' COMMENT '验证规则'")
    private ValidationRule validationRule = ValidationRule.NONE;
    
    /**
     * 自定义验证正则
     * 
     * <p>用户自定义的验证正则表达式。</p>
     * <p>仅当validationRule为CUSTOM时生效。</p>
     */
    @Size(max = 500, message = "验证正则不能超过500个字符")
    @Column(name = "custom_validation_regex", length = 500, columnDefinition = "VARCHAR(500) COMMENT '自定义验证正则'")
    private String customValidationRegex;
    
    /**
     * 验证错误信息
     * 
     * <p>当验证失败时的错误提示信息。</p>
     * <p>支持最长200个字符的错误描述。</p>
     */
    @Size(max = 200, message = "验证错误信息不能超过200个字符")
    @Column(name = "validation_error", length = 200, columnDefinition = "VARCHAR(200) COMMENT '验证错误信息'")
    private String validationError;
    
    /**
     * 最后验证时间
     * 
     * <p>记录单元格内容最后一次验证的时间。</p>
     * <p>用于验证状态追踪和缓存更新。</p>
     */
    @Column(name = "last_validation_time", columnDefinition = "DATETIME COMMENT '最后验证时间'")
    private Date lastValidationTime;
    
    // ==================== 状态管理字段 ====================
    
    /**
     * 单元格状态
     * 
     * <p>标识单元格的当前状态：</p>
     * <ul>
     *   <li>NORMAL: 正常状态</li>
     *   <li>EDITING: 编辑状态</li>
     *   <li>ERROR: 错误状态</li>
     *   <li>LOCKED: 锁定状态</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "cell_status", nullable = false, length = 20, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'NORMAL' COMMENT '单元格状态'")
    private CellStatus cellStatus = CellStatus.NORMAL;
    
    /**
     * 是否只读
     * 
     * <p>控制单元格是否允许编辑：</p>
     * <ul>
     *   <li>true: 只读，禁止编辑</li>
     *   <li>false: 可编辑</li>
     * </ul>
     * <p>默认值为false。</p>
     */
    @Builder.Default
    @Column(name = "is_readonly", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0 COMMENT '是否只读'")
    private Boolean isReadonly = false;
    
    /**
     * 是否隐藏
     * 
     * <p>控制单元格是否在界面中显示：</p>
     * <ul>
     *   <li>true: 隐藏，不显示</li>
     *   <li>false: 显示</li>
     * </ul>
     * <p>默认值为false。</p>
     */
    @Builder.Default
    @Column(name = "is_hidden", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0 COMMENT '是否隐藏'")
    private Boolean isHidden = false;
    
    // ==================== 扩展属性字段 ====================
    
    /**
     * 单元格备注
     * 
     * <p>单元格的额外备注信息。</p>
     * <p>支持最长1000个字符的备注内容。</p>
     */
    @Size(max = 1000, message = "备注不能超过1000个字符")
    @Column(name = "remarks", columnDefinition = "TEXT COMMENT '备注'")
    private String remarks;
    
    /**
     * 单元格标签
     * 
     * <p>用于分类和搜索的标签信息。</p>
     * <p>多个标签用逗号分隔。</p>
     * <p>支持最长200个字符的标签总长度。</p>
     */
    @Size(max = 200, message = "标签总长度不能超过200个字符")
    @Column(name = "tags", length = 200, columnDefinition = "VARCHAR(200) COMMENT '标签'")
    private String tags;
    
    /**
     * 单元格排序权重
     * 
     * <p>用于排序和优先级控制。</p>
     * <p>数值越大优先级越高。</p>
     */
    @Builder.Default
    @Column(name = "sort_weight", nullable = false, columnDefinition = "INT DEFAULT 0 COMMENT '排序权重'")
    private Integer sortWeight = 0;
    
    /**
     * 扩展属性
     * 
     * <p>JSON格式的扩展属性，用于存储自定义配置。</p>
     * <p>支持灵活的自定义扩展。</p>
     */
    @Column(name = "extended_properties", columnDefinition = "JSON COMMENT '扩展属性'")
    private String extendedProperties;
    
    // ==================== 审计字段 ====================
    
    /**
     * 创建时间
     * 
     * <p>记录单元格创建的时间戳。</p>
     * <p>创建时自动设置为当前时间。</p>
     */
    @Builder.Default
    @Column(name = "create_time", nullable = false, updatable = false, columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'")
    private LocalDateTime createTime = LocalDateTime.now();
    
    /**
     * 更新时间
     * 
     * <p>记录单元格最后更新的时间戳。</p>
     * <p>每次更新时自动设置为当前时间。</p>
     */
    @Column(name = "update_time", columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'")
    private LocalDateTime updateTime;
    
    /**
     * 最后修改者ID
     * 
     * <p>记录最后修改单元格的用户ID。</p>
     * <p>用于操作审计和权限控制。</p>
     */
    @Column(name = "last_modifier_id", columnDefinition = "BIGINT COMMENT '最后修改者ID'")
    private Long lastModifierId;
    
    /**
     * 创建者ID
     * 
     * <p>记录创建单元格的用户ID。</p>
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
    
    // ==================== 枚举定义 ====================
    
    /**
     * 数据类型枚举
     */
    public enum DataType {
        TEXT("文本"),
        NUMBER("数字"),
        DATE("日期"),
        BOOLEAN("布尔"),
        URL("链接"),
        EMAIL("邮箱"),
        FORMULA("公式");
        
        private final String description;
        
        DataType(String description) {
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
    
    /**
     * 垂直对齐方式枚举
     */
    public enum VerticalAlign {
        TOP("顶部对齐"),
        MIDDLE("垂直居中"),
        BOTTOM("底部对齐");
        
        private final String description;
        
        VerticalAlign(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 边框样式枚举
     */
    public enum BorderStyle {
        NONE("无边框"),
        SOLID("实线"),
        DASHED("虚线"),
        DOTTED("点线"),
        DOUBLE("双线");
        
        private final String description;
        
        BorderStyle(String description) {
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
        REQUIRED("必填"),
        OPTIONAL("可选"),
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
     * 计算状态枚举
     */
    public enum CalculationStatus {
        UNCALCULATED("未计算"),
        CALCULATING("计算中"),
        SUCCESS("计算成功"),
        FAILED("计算失败"),
        ERROR("计算错误");
        
        private final String description;
        
        CalculationStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 单元格状态枚举
     */
    public enum CellStatus {
        NORMAL("正常"),
        EDITING("编辑中"),
        ERROR("错误状态"),
        LOCKED("锁定状态");
        
        private final String description;
        
        CellStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // ==================== 业务方法 ====================
    
    /**
     * 检查单元格是否激活
     * 
     * <p>判断单元格是否处于正常可编辑状态。</p>
     * 
     * @return true表示单元格激活，false表示单元格未激活
     */
    public boolean isActive() {
        return CellStatus.NORMAL.equals(cellStatus) && 
               !Boolean.TRUE.equals(isReadonly) && 
               !Boolean.TRUE.equals(isHidden) && 
               !Boolean.TRUE.equals(isDeleted);
    }
    
    /**
     * 检查是否为只读状态
     * 
     * @return true表示只读，false表示可编辑
     */
    public boolean isReadonly() {
        return Boolean.TRUE.equals(isReadonly);
    }
    
    /**
     * 设置为只读状态
     * 
     * @param readonlyFlag 是否只读
     */
    public void setReadonly(boolean readonlyFlag) {
        this.isReadonly = readonlyFlag;
        if (readonlyFlag && !CellStatus.LOCKED.equals(cellStatus)) {
            this.cellStatus = CellStatus.LOCKED;
        } else if (!readonlyFlag && CellStatus.LOCKED.equals(cellStatus)) {
            this.cellStatus = CellStatus.NORMAL;
        }
    }
    
    /**
     * 检查是否为隐藏状态
     * 
     * @return true表示隐藏，false表示显示
     */
    public boolean isHidden() {
        return Boolean.TRUE.equals(isHidden);
    }
    
    /**
     * 设置为隐藏状态
     * 
     * @param hiddenFlag 是否隐藏
     */
    public void setHidden(boolean hiddenFlag) {
        this.isHidden = hiddenFlag;
    }
    
    /**
     * 检查是否为公式单元格
     * 
     * @return true表示是公式单元格，false表示普通单元格
     */
    public boolean isFormulaCell() {
        return Boolean.TRUE.equals(isFormulaCell);
    }
    
    /**
     * 设置为公式单元格
     * 
     * @param formulaFlag 是否为公式单元格
     */
    public void setFormulaCell(boolean formulaFlag) {
        this.isFormulaCell = formulaFlag;
        this.dataType = formulaFlag ? DataType.FORMULA : DataType.TEXT;
    }
    
    /**
     * 获取显示值
     * 
     * <p>根据数据类型返回对应的显示值。</p>
     * 
     * @return 格式化后的显示值
     */
    public String getDisplayValue() {
        switch (dataType) {
            case TEXT:
            return cellValue != null ? cellValue : "";
            case NUMBER:
                return numericValue != null ? numericValue.toPlainString() : "";
            case DATE:
                return dateValue != null ? dateValue.toString() : "";
            case BOOLEAN:
                return booleanValue != null ? booleanValue.toString() : "";
            case URL:
                return urlValue != null ? urlValue : "";
            case EMAIL:
                return emailValue != null ? emailValue : "";
            case FORMULA:
                return calculationResult != null ? calculationResult : "";
            default:
                return cellValue != null ? cellValue : "";
        }
    }
    
    /**
     * 设置单元格值
     * 
     * <p>根据数据类型设置对应的值。</p>
     * 
     * @param value 要设置的值
     */
    public void setCellValue(Object value) {
        if (value == null) {
            clearValue();
            return;
        }
        
        this.cellValue = value.toString();
        
        if (value instanceof Number) {
            this.numericValue = new java.math.BigDecimal(value.toString());
            this.dataType = DataType.NUMBER;
            this.booleanValue = null;
            this.dateValue = null;
            this.urlValue = null;
            this.emailValue = null;
        } else if (value instanceof Boolean) {
            this.booleanValue = (Boolean) value;
            this.numericValue = null;
            this.dateValue = null;
            this.urlValue = null;
            this.emailValue = null;
        } else if (value instanceof Date) {
            this.dateValue = (Date) value;
            this.numericValue = null;
            this.booleanValue = null;
            this.urlValue = null;
            this.emailValue = null;
        } else if (value instanceof String) {
            // 根据数据类型判断设置对应值
            if (DataType.URL.equals(dataType)) {
                this.urlValue = (String) value;
                this.cellValue = (String) value;
                this.numericValue = null;
                this.booleanValue = null;
                this.dateValue = null;
                this.emailValue = null;
            } else if (DataType.EMAIL.equals(dataType)) {
                this.emailValue = (String) value;
                this.cellValue = (String) value;
                this.numericValue = null;
                this.booleanValue = null;
                this.dateValue = null;
                this.urlValue = null;
            } else {
                this.cellValue = (String) value;
                this.numericValue = null;
                this.booleanValue = null;
                this.dateValue = null;
                this.emailValue = null;
                this.urlValue = null;
            }
        }
    }
    
    /**
     * 清空单元格值
     * 
     * <p>将所有值字段清空。</p>
     */
    public void clearValue() {
        this.cellValue = null;
        this.numericValue = null;
        this.dateValue = null;
        this.booleanValue = null;
        this.urlValue = null;
        this.emailValue = null;
    }
    
    /**
     * 执行数据验证
     * 
     * <p>根据配置的验证规则验证单元格数据。</p>
     * 
     * @return true表示验证通过，false表示验证失败
     */
    public boolean validateData() {
        if (ValidationRule.NONE.equals(validationRule)) {
            return true;
        }
        
        if (ValidationRule.REQUIRED.equals(validationRule) && 
            (cellValue == null || cellValue.trim().isEmpty())) {
            return false;
        }
        
        if (ValidationRule.CUSTOM.equals(validationRule) && 
            customValidationRegex != null && 
            !customValidationRegex.trim().isEmpty() && 
            !cellValue.matches(customValidationRegex)) {
            return false;
        }
        
        if (DataType.EMAIL.equals(dataType) && 
            cellValue != null && 
            !cellValue.matches("^[\\w.-]+@[\\w.-]+\\.\\w]+$")) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 标记计算完成
     * 
     * @param result 计算结果
     * @param duration 计算耗时
     */
    public void markCalculationCompleted(String result, long duration) {
        this.calculationStatus = CalculationStatus.SUCCESS;
        this.calculationResult = result;
        this.calculationTime = new Date();
        this.calculationDuration = duration;
    }
    
    /**
     * 标记计算失败
     * 
     * @param errorMessage 错误信息
     * @param duration 计算耗时
     */
    public void markCalculationFailed(String errorMessage, long duration) {
        this.calculationStatus = CalculationStatus.FAILED;
        this.calculationResult = null;
        this.calculationTime = new Date();
        this.calculationDuration = duration;
    }
    
    /**
     * 获取计算状态描述
     * 
     * @return 计算状态的中文描述
     */
    public String getCalculationStatusDescription() {
        return calculationStatus != null ? calculationStatus.getDescription() : "未知";
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
        if (cellStatus == null) {
            cellStatus = CellStatus.NORMAL;
        }
        if (isReadonly == null) {
            isReadonly = false;
        }
        if (isHidden == null) {
            isHidden = false;
        }
        if (isFormulaCell == null) {
            isFormulaCell = false;
        }
        if (dataType == null) {
            dataType = DataType.TEXT;
        }
        if (calculationStatus == null) {
            calculationStatus = CalculationStatus.UNCALCULATED;
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
        if (version == null) {
            version = 0L;
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