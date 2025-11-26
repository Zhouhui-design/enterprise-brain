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
import java.time.LocalDateTime;

/**
 * 表格公式实体类
 * 
 * <p>智能表格中公式的核心实体，用于管理公式的定义、配置和执行状态。</p>
 * <p>支持多种公式类型、依赖关系、参数配置等。</p>
 * 
 * <p>主要功能：</p>
 * <ul>
 *   <li>公式定义管理：表达式、描述、类型等</li>
 *   <li>依赖关系管理：公式间的依赖和引用关系</li>
 *   <li>参数配置：输入参数、输出参数配置</li>
 *   <li>执行控制：执行顺序、缓存策略等</li>
 *   <li>权限控制：公式的访问和使用权限</li>
 *   <li>版本管理：公式的版本控制和历史记录</li>
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
@Table(name = "table_formula",
       indexes = {
           @Index(name = "idx_formula_table_id", columnList = "table_id"),
           @Index(name = "idx_formula_column_id", columnList = "column_id"),
           @Index(name = "idx_formula_type", columnList = "formula_type"),
           @Index(name = "idx_formula_is_deleted", columnList = "is_deleted"),
           @Index(name = "idx_formula_create_time", columnList = "create_time")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_formula_table_column", 
                           columnNames = {"table_id", "column_id"})
       })
@EqualsAndHashCode(callSuper = false, exclude = {"table", "column", "createUser", "updateUser"})
public class TableFormula {
    
    // ==================== 主键字段 ====================
    
    /**
     * 公式主键ID
     * 
     * <p>采用数据库自增策略生成主键。</p>
     * <p>用于唯一标识公式记录。</p>
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
     * <p>建立多对一关联关系，一个表格包含多个公式。</p>
     */
    @NotNull(message = "表格ID不能为空")
    @Column(name = "table_id", nullable = false, columnDefinition = "BIGINT NOT NULL COMMENT '表格ID'")
    private Long tableId;
    
    /**
     * 关联的表格列
     * 
     * <p>指向应用公式的表格列实体。</p>
     * <p>用于建立公式与列的关联关系。</p>
     */
    @Column(name = "column_id", columnDefinition = "BIGINT COMMENT '列ID'")
    private Long columnId;
    
    /**
     * 关联的单元格
     * 
     * <p>当公式应用于特定单元格时的单元格ID。</p>
     * <p>支持单元格级别的公式应用。</p>
     */
    @Size(max = 64, message = "单元格ID长度不能超过64个字符")
    @Column(name = "cell_id", length = 64, columnDefinition = "VARCHAR(64) COMMENT '单元格ID'")
    private String cellId;
    
    // ==================== 基础信息字段 ====================
    
    /**
     * 公式名称
     * 
     * <p>公式的显示名称，用于用户识别和展示。</p>
     * <p>支持最长100个字符的公式名称。</p>
     */
    @NotBlank(message = "公式名称不能为空")
    @Size(min = 1, max = 100, message = "公式名称长度必须在1-100个字符之间")
    @Column(name = "formula_name", nullable = false, length = 100, columnDefinition = "VARCHAR(100) NOT NULL COMMENT '公式名称'")
    private String formulaName;
    
    /**
     * 公式表达式
     * 
     * <p>公式的核心表达式，支持各种数学和逻辑运算。</p>
     * <p>支持最大2000个字符的复杂表达式。</p>
     */
    @NotBlank(message = "公式表达式不能为空")
    @Size(min = 1, max = 2000, message = "公式表达式长度必须在1-2000个字符之间")
    @Column(name = "formula_expression", nullable = false, columnDefinition = "TEXT NOT NULL COMMENT '公式表达式'")
    private String formulaExpression;
    
    /**
     * 公式描述
     * 
     * <p>公式的详细说明信息，用于描述公式用途和计算逻辑。</p>
     * <p>支持最长1000个字符的详细描述。</p>
     */
    @Size(max = 1000, message = "公式描述不能超过1000个字符")
    @Column(name = "formula_description", length = 1000, columnDefinition = "TEXT COMMENT '公式描述'")
    private String formulaDescription;
    
    // ==================== 公式类型字段 ====================
    
    /**
     * 公式类型
     * 
     * <p>标识公式的类型：</p>
     * <ul>
     *   <li>BASIC: 基础运算公式</li>
     *   <li>AGGREGATE: 聚合函数公式</li>
     *   <li>LOGICAL: 逻辑判断公式</li>
     *   <li>TEXT: 文本处理公式</li>
     *   <li>DATE: 日期时间公式</li>
     *   <li>LOOKUP: 查找引用公式</li>
     *   <li>CUSTOM: 自定义函数公式</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "formula_type", nullable = false, length = 20, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'BASIC' COMMENT '公式类型'")
    private FormulaType formulaType = FormulaType.BASIC;
    
    /**
     * 公式类别
     * 
     * <p>公式的业务分类，用于分类管理。</p>
     * <p>如：财务计算、统计分析、数据处理等。</p>
     */
    @Size(max = 50, message = "公式类别不能超过50个字符")
    @Column(name = "formula_category", length = 50, columnDefinition = "VARCHAR(50) COMMENT '公式类别'")
    private String formulaCategory;
    
    // ==================== 执行配置字段 ====================
    
    /**
     * 执行优先级
     * 
     * <p>公式执行的优先级，数值越小优先级越高。</p>
     * <p>用于处理公式间的依赖关系。</p>
     * <p>默认值为0，范围0-100。</p>
     */
    @Min(value = 0, message = "执行优先级不能小于0")
    @Max(value = 100, message = "执行优先级不能超过100")
    @Builder.Default
    @Column(name = "execution_priority", nullable = false, columnDefinition = "INT DEFAULT 0 COMMENT '执行优先级'")
    private Integer executionPriority = 0;
    
    /**
     * 是否自动执行
     * 
     * <p>控制公式是否在数据变化时自动执行：</p>
     * <ul>
     *   <li>true: 自动执行</li>
     *   <li>false: 手动执行</li>
     * </ul>
     * <p>默认值为true。</p>
     */
    @Builder.Default
    @Column(name = "auto_execute", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1 COMMENT '是否自动执行'")
    private Boolean autoExecute = true;
    
    /**
     * 执行时机
     * 
     * <p>定义公式的执行时机：</p>
     * <ul>
     *   <li>ON_CHANGE: 数据变化时执行</li>
     *   <li>ON_SAVE: 保存时执行</li>
     *   <li>ON_DEMAND: 按需执行</li>
     *   <li>SCHEDULED: 定时执行</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "execution_trigger", nullable = false, length = 20, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'ON_CHANGE' COMMENT '执行时机'")
    private ExecutionTrigger executionTrigger = ExecutionTrigger.ON_CHANGE;
    
    /**
     * 是否启用缓存
     * 
     * <p>控制公式计算结果是否缓存：</p>
     * <ul>
     *   <li>true: 启用缓存，提高性能</li>
     *   <li>false: 不缓存，每次重新计算</li>
     * </ul>
     * <p>默认值为true。</p>
     */
    @Builder.Default
    @Column(name = "cache_enabled", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1 COMMENT '是否启用缓存'")
    private Boolean cacheEnabled = true;
    
    /**
     * 缓存过期时间（秒）
     * 
     * <p>公式计算结果的缓存过期时间。</p>
     * <p>单位为秒，0表示永不过期，默认值为300秒（5分钟）。</p>
     */
    @Min(value = 0, message = "缓存过期时间不能为负数")
    @Builder.Default
    @Column(name = "cache_ttl", nullable = false, columnDefinition = "INT DEFAULT 300 COMMENT '缓存过期时间（秒）'")
    private Integer cacheTtl = 300;
    
    // ==================== 依赖关系字段 ====================
    
    /**
     * 依赖单元格列表
     * 
     * <p>公式依赖的单元格引用列表，逗号分隔。</p>
     * <p>用于构建公式依赖图和执行顺序。</p>
     */
    @Size(max = 2000, message = "依赖单元格列表不能超过2000个字符")
    @Column(name = "dependent_cells", length = 2000, columnDefinition = "TEXT COMMENT '依赖单元格列表'")
    private String dependentCells;
    
    /**
     * 依赖公式列表
     * 
     * <p>公式依赖的其他公式ID列表，逗号分隔。</p>
     * <p>用于处理公式间的复杂依赖关系。</p>
     */
    @Size(max = 1000, message = "依赖公式列表不能超过1000个字符")
    @Column(name = "dependent_formulas", length = 1000, columnDefinition = "VARCHAR(1000) COMMENT '依赖公式列表'")
    private String dependentFormulas;
    
    /**
     * 影响单元格列表
     * 
     * <p>受此公式影响的单元格列表，逗号分隔。</p>
     * <p>用于增量计算和依赖追踪。</p>
     */
    @Size(max = 2000, message = "影响单元格列表不能超过2000个字符")
    @Column(name = "affected_cells", length = 2000, columnDefinition = "TEXT COMMENT '影响单元格列表'")
    private String affectedCells;
    
    // ==================== 参数配置字段 ====================
    
    /**
     * 输入参数配置
     * 
     * <p>公式输入参数的配置信息，JSON格式。</p>
     * <p>包含参数名称、类型、默认值、验证规则等。</p>
     */
    @Column(name = "input_parameters", columnDefinition = "JSON COMMENT '输入参数配置'")
    private String inputParameters;
    
    /**
     * 输出参数配置
     * 
     * <p>公式输出参数的配置信息，JSON格式。</p>
     * <p>包含输出类型、格式、单位等。</p>
     */
    @Column(name = "output_parameters", columnDefinition = "JSON COMMENT '输出参数配置'")
    private String outputParameters;
    
    /**
     * 参数验证规则
     * 
     * <p>参数验证的规则配置，JSON格式。</p>
     * <p>包含必填检查、类型验证、范围验证等。</p>
     */
    @Column(name = "parameter_validation", columnDefinition = "JSON COMMENT '参数验证规则'")
    private String parameterValidation;
    
    // ==================== 状态管理字段 ====================
    
    /**
     * 公式状态
     * 
     * <p>标识公式的当前状态：</p>
     * <ul>
     *   <li>ACTIVE: 激活状态，正常使用</li>
     *   <li>INACTIVE: 非激活状态，暂停使用</li>
     *   <li>ERROR: 错误状态，公式有错误</li>
     *   <li>DEPRECATED: 弃用状态，不推荐使用</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "formula_status", nullable = false, length = 20, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '公式状态'")
    private FormulaStatus formulaStatus = FormulaStatus.ACTIVE;
    
    /**
     * 是否启用
     * 
     * <p>控制公式是否启用：</p>
     * <ul>
     *   <li>true: 启用，正常执行</li>
     *   <li>false: 禁用，不执行</li>
     * </ul>
     * <p>默认值为true。</p>
     */
    @Builder.Default
    @Column(name = "is_enabled", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1 COMMENT '是否启用'")
    private Boolean isEnabled = true;
    
    /**
     * 是否为系统公式
     * 
     * <p>标识是否为系统内置公式：</p>
     * <ul>
     *   <li>true: 系统公式，用户不可修改</li>
     *   <li>false: 用户公式，可自由编辑</li>
     * </ul>
     * <p>默认值为false。</p>
     */
    @Builder.Default
    @Column(name = "is_system_formula", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0 COMMENT '是否为系统公式'")
    private Boolean isSystemFormula = false;
    
    // ==================== 统计信息字段 ====================
    
    /**
     * 执行次数
     * 
     * <p>记录公式被执行的总次数。</p>
     * <p>用于使用统计和性能分析。</p>
     */
    @Builder.Default
    @Column(name = "execution_count", nullable = false, columnDefinition = "BIGINT DEFAULT 0 COMMENT '执行次数'")
    private Long executionCount = 0L;
    
    /**
     * 平均执行时间（毫秒）
     * 
     * <p>公式执行的平均耗时，单位毫秒。</p>
     * <p>用于性能分析和优化。</p>
     */
    @Builder.Default
    @Column(name = "avg_execution_time", nullable = false, columnDefinition = "DECIMAL(10,3) DEFAULT 0 COMMENT '平均执行时间（毫秒）'")
    private java.math.BigDecimal avgExecutionTime = java.math.BigDecimal.ZERO;
    
    /**
     * 最后执行时间
     * 
     * <p>记录公式最后一次执行的时间戳。</p>
     * <p>用于执行状态追踪。</p>
     */
    @Column(name = "last_execution_time", columnDefinition = "DATETIME COMMENT '最后执行时间'")
    private LocalDateTime lastExecutionTime;
    
    /**
     * 错误次数
     * 
     * <p>记录公式执行失败的次数。</p>
     * <p>用于错误监控和稳定性分析。</p>
     */
    @Builder.Default
    @Column(name = "error_count", nullable = false, columnDefinition = "INT DEFAULT 0 COMMENT '错误次数'")
    private Integer errorCount = 0;
    
    // ==================== 版本管理字段 ====================
    
    /**
     * 公式版本
     * 
     * <p>公式的版本号，用于版本控制。</p>
     * <p>格式：主版本.次版本.修订版本（如：1.0.0）。</p>
     */
    @Size(max = 20, message = "版本号不能超过20个字符")
    @Column(name = "formula_version", length = 20, columnDefinition = "VARCHAR(20) COMMENT '公式版本'")
    private String formulaVersion;
    
    /**
     * 上一个版本号
     * 
     * <p>记录上一个版本号，用于版本回滚。</p>
     */
    @Size(max = 20, message = "上一版本号不能超过20个字符")
    @Column(name = "previous_version", length = 20, columnDefinition = "VARCHAR(20) COMMENT '上一个版本号'")
    private String previousVersion;
    
    /**
     * 版本变更说明
     * 
     * <p>版本变更的详细说明。</p>
     * <p>支持最长1000个字符的变更说明。</p>
     */
    @Size(max = 1000, message = "版本变更说明不能超过1000个字符")
    @Column(name = "version_notes", length = 1000, columnDefinition = "TEXT COMMENT '版本变更说明'")
    private String versionNotes;
    
    // ==================== 权限控制字段 ====================
    
    /**
     * 创建者权限级别
     * 
     * <p>公式创建者的权限级别：</p>
     * <ul>
     *   <li>OWNER: 所有者权限，完全控制</li>
     *   <li>EDITOR: 编辑权限，可修改公式</li>
     *   <li>VIEWER: 查看权限，只能查看</li>
     *   <li>PUBLIC: 公开权限，所有人可访问</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "creator_permission", nullable = false, length = 20, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'OWNER' COMMENT '创建者权限级别'")
    private PermissionLevel creatorPermission = PermissionLevel.OWNER;
    
    /**
     * 权限配置
     * 
     * <p>公式权限的详细配置，JSON格式。</p>
     * <p>包含用户和角色的访问权限配置。</p>
     */
    @Column(name = "permission_config", columnDefinition = "JSON COMMENT '权限配置'")
    private String permissionConfig;
    
    // ==================== 扩展配置字段 ====================
    
    /**
     * 公式标签
     * 
     * <p>用于分类和搜索的标签信息。</p>
     * <p>多个标签用逗号分隔。</p>
     * <p>支持最长200个字符的标签总长度。</p>
     */
    @Size(max = 200, message = "标签总长度不能超过200个字符")
    @Column(name = "tags", length = 200, columnDefinition = "VARCHAR(200) COMMENT '标签'")
    private String tags;
    
    /**
     * 扩展配置
     * 
     * <p>JSON格式的扩展属性，用于存储自定义配置。</p>
     * <p>支持灵活的自定义扩展。</p>
     */
    @Column(name = "extended_config", columnDefinition = "JSON COMMENT '扩展配置'")
    private String extendedConfig;
    
    // ==================== 审计字段 ====================
    
    /**
     * 创建时间
     * 
     * <p>记录公式创建的时间戳。</p>
     * <p>创建时自动设置为当前时间。</p>
     */
    @Builder.Default
    @Column(name = "create_time", nullable = false, updatable = false, columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'")
    private LocalDateTime createTime = LocalDateTime.now();
    
    /**
     * 更新时间
     * 
     * <p>记录公式最后更新的时间戳。</p>
     * <p>每次更新时自动设置为当前时间。</p>
     */
    @Column(name = "update_time", columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'")
    private LocalDateTime updateTime;
    
    /**
     * 创建者ID
     * 
     * <p>记录创建公式的用户ID。</p>
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
    @JoinColumn(name = "table_id", foreignKey = @ForeignKey(name = "fk_formula_table"), insertable = false, updatable = false)
    private SmartTable table;
    
    /**
     * 关联的表格列
     * 
     * <p>延迟加载关联的表格列实体。</p>
     * <p>用于获取列详细信息。</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id", foreignKey = @ForeignKey(name = "fk_formula_column"), insertable = false, updatable = false)
    private TableColumn column;
    
    // ==================== 枚举定义 ====================
    
    /**
     * 公式类型枚举
     */
    public enum FormulaType {
        BASIC("基础运算"),
        AGGREGATE("聚合函数"),
        LOGICAL("逻辑判断"),
        TEXT("文本处理"),
        DATE("日期时间"),
        LOOKUP("查找引用"),
        STATISTICAL("统计分析"),
        FINANCIAL("财务计算"),
        CUSTOM("自定义函数");
        
        private final String description;
        
        FormulaType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 执行时机枚举
     */
    public enum ExecutionTrigger {
        ON_CHANGE("数据变化时"),
        ON_SAVE("保存时"),
        ON_DEMAND("按需执行"),
        SCHEDULED("定时执行");
        
        private final String description;
        
        ExecutionTrigger(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 公式状态枚举
     */
    public enum FormulaStatus {
        ACTIVE("激活"),
        INACTIVE("非激活"),
        ERROR("错误"),
        DEPRECATED("弃用");
        
        private final String description;
        
        FormulaStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 权限级别枚举
     */
    public enum PermissionLevel {
        OWNER("所有者"),
        EDITOR("编辑者"),
        VIEWER("查看者"),
        PUBLIC("公开");
        
        private final String description;
        
        PermissionLevel(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // ==================== 业务方法 ====================
    
    /**
     * 检查公式是否激活
     * 
     * <p>判断公式是否处于可用状态。</p>
     * 
     * @return true表示公式激活，false表示公式未激活
     */
    public boolean isActive() {
        return Boolean.TRUE.equals(isEnabled) && 
               FormulaStatus.ACTIVE.equals(formulaStatus) && 
               Boolean.FALSE.equals(isDeleted);
    }
    
    /**
     * 检查是否为系统公式
     * 
     * @return true表示是系统公式，false表示是用户公式
     */
    public boolean isSystemFormula() {
        return Boolean.TRUE.equals(isSystemFormula);
    }
    
    /**
     * 检查是否启用自动执行
     * 
     * @return true表示启用自动执行，false表示禁用自动执行
     */
    public boolean isAutoExecute() {
        return Boolean.TRUE.equals(autoExecute);
    }
    
    /**
     * 检查是否启用缓存
     * 
     * @return true表示启用缓存，false表示不启用缓存
     */
    public boolean isCacheEnabled() {
        return Boolean.TRUE.equals(cacheEnabled);
    }
    
    /**
     * 增加执行次数
     * 
     * <p>每次公式执行后调用此方法更新统计信息。</p>
     * 
     * @param executionTime 本次执行耗时（毫秒）
     */
    public void incrementExecutionCount(Long executionTime) {
        this.executionCount = this.executionCount != null ? this.executionCount + 1 : 1L;
        this.lastExecutionTime = LocalDateTime.now();
        
        // 更新平均执行时间
        if (executionTime != null && executionTime > 0) {
            java.math.BigDecimal newTime = new java.math.BigDecimal(executionTime);
            if (this.avgExecutionTime == null) {
                this.avgExecutionTime = newTime;
            } else {
                this.avgExecutionTime = this.avgExecutionTime.multiply(new java.math.BigDecimal(executionCount - 1))
                                                        .add(newTime)
                                                        .divide(new java.math.BigDecimal(executionCount), 3, java.math.BigDecimal.ROUND_HALF_UP);
            }
        }
    }
    
    /**
     * 增加错误次数
     * 
     * <p>每次公式执行失败后调用此方法。</p>
     */
    public void incrementErrorCount() {
        this.errorCount = this.errorCount != null ? this.errorCount + 1 : 1;
    }
    
    /**
     * 激活公式
     * 
     * <p>启用公式，使其可以正常执行。</p>
     */
    public void activate() {
        this.isEnabled = true;
        this.formulaStatus = FormulaStatus.ACTIVE;
    }
    
    /**
     * 禁用公式
     * 
     * <p>禁用公式，暂时停止执行。</p>
     */
    public void deactivate() {
        this.isEnabled = false;
        this.formulaStatus = FormulaStatus.INACTIVE;
    }
    
    /**
     * 标记为错误状态
     * 
     * @param errorReason 错误原因
     */
    public void markAsError(String errorReason) {
        this.formulaStatus = FormulaStatus.ERROR;
        this.incrementErrorCount();
        // 可以在这里记录错误日志
    }
    
    /**
     * 获取公式类型描述
     * 
     * @return 公式类型的中文描述
     */
    public String getFormulaTypeDescription() {
        return formulaType != null ? formulaType.getDescription() : "未知";
    }
    
    /**
     * 获取公式状态描述
     * 
     * @return 公式状态的中文描述
     */
    public String getFormulaStatusDescription() {
        return formulaStatus != null ? formulaStatus.getDescription() : "未知";
    }
    
    /**
     * 获取执行时机描述
     * 
     * @return 执行时机的中文描述
     */
    public String getExecutionTriggerDescription() {
        return executionTrigger != null ? executionTrigger.getDescription() : "未知";
    }
    
    /**
     * 获取权限级别描述
     * 
     * @return 权限级别的中文描述
     */
    public String getPermissionLevelDescription() {
        return creatorPermission != null ? creatorPermission.getDescription() : "未知";
    }
    
    /**
     * 更新版本信息
     * 
     * @param newVersion 新版本号
     * @param changeNotes 变更说明
     */
    public void updateVersion(String newVersion, String changeNotes) {
        this.previousVersion = this.formulaVersion;
        this.formulaVersion = newVersion;
        this.versionNotes = changeNotes;
        this.updateTime = LocalDateTime.now();
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
        if (isEnabled == null) {
            isEnabled = true;
        }
        if (isSystemFormula == null) {
            isSystemFormula = false;
        }
        if (autoExecute == null) {
            autoExecute = true;
        }
        if (cacheEnabled == null) {
            cacheEnabled = true;
        }
        if (executionPriority == null) {
            executionPriority = 0;
        }
        if (cacheTtl == null) {
            cacheTtl = 300;
        }
        if (executionCount == null) {
            executionCount = 0L;
        }
        if (errorCount == null) {
            errorCount = 0;
        }
        if (avgExecutionTime == null) {
            avgExecutionTime = java.math.BigDecimal.ZERO;
        }
        if (version == null) {
            version = 0L;
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
        if (formulaType == null) {
            formulaType = FormulaType.BASIC;
        }
        if (formulaStatus == null) {
            formulaStatus = FormulaStatus.ACTIVE;
        }
        if (executionTrigger == null) {
            executionTrigger = ExecutionTrigger.ON_CHANGE;
        }
        if (creatorPermission == null) {
            creatorPermission = PermissionLevel.OWNER;
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