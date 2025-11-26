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
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

/**
 * 智能表格实体类
 * 
 * <p>智能表格系统的核心实体，用于管理电子表格的基本信息、配置和权限。</p>
 * <p>支持多用户协作、公式计算、权限控制等高级功能。</p>
 * 
 * <p>主要功能：</p>
 * <ul>
 *   <li>表格基本信息管理：名称、描述、创建者等</li>
 *   <li>表格配置管理：行列数、权限设置、共享配置</li>
 *   <li>权限控制：读写权限、协作权限、公开级别</li>
 *   <li>状态管理：启用状态、删除状态、版本控制</li>
 *   <li>元数据管理：标签、分类、模板信息</li>
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
@Table(name = "smart_table",
       indexes = {
           @Index(name = "idx_smart_table_create_user", columnList = "create_user_id"),
           @Index(name = "idx_smart_table_name", columnList = "table_name"),
           @Index(name = "idx_smart_table_status", columnList = "is_enabled", "is_deleted"),
           @Index(name = "idx_smart_table_create_time", columnList = "create_time")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_table_name_user", 
                           columnNames = {"create_user_id", "table_name"})
       })
@EqualsAndHashCode(callSuper = false, exclude = {"createUser", "updateUser", "columns", "rows"})
public class SmartTable {
    
    // ==================== 主键字段 ====================
    
    /**
     * 表格主键ID
     * 
     * <p>采用数据库自增策略生成主键。</p>
     * <p>用于唯一标识表格记录。</p>
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;
    
    // ==================== 基础信息字段 ====================
    
    /**
     * 表格名称
     * 
     * <p>表格的显示名称，用于用户识别和展示。</p>
     * <p>在同一用户下必须保持唯一性。</p>
     */
    @NotBlank(message = "表格名称不能为空")
    @Size(min = 1, max = 100, message = "表格名称长度必须在1-100个字符之间")
    @Column(name = "table_name", nullable = false, length = 100, columnDefinition = "VARCHAR(100) NOT NULL COMMENT '表格名称'")
    private String name;
    
    /**
     * 表格描述
     * 
     * <p>表格的详细说明信息，用于描述表格用途和内容。</p>
     * <p>支持最大500个字符的详细描述。</p>
     */
    @Size(max = 500, message = "表格描述不能超过500个字符")
    @Column(name = "description", length = 500, columnDefinition = "TEXT COMMENT '表格描述'")
    private String description;
    
    // ==================== 权限管理字段 ====================
    
    /**
     * 表格所有者ID
     * 
     * <p>创建表格的用户ID，拥有完整的读写和管理权限。</p>
     * <p>用于权限控制和所有者识别。</p>
     */
    @NotNull(message = "创建者ID不能为空")
    @Column(name = "create_user_id", nullable = false, columnDefinition = "BIGINT NOT NULL COMMENT '创建者ID'")
    private Long createUserId;
    
    /**
     * 表格访问级别
     * 
     * <p>定义表格的访问权限级别：</p>
     * <ul>
     *   <li>PRIVATE: 私有，仅所有者可访问</li>
     *   <li>TEAM: 团队，指定团队成员可访问</li>
     *   <li>PUBLIC: 公开，所有用户可访问（只读）</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "access_level", nullable = false, length = 20, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'PRIVATE' COMMENT '访问级别'")
    private AccessLevel accessLevel = AccessLevel.PRIVATE;
    
    /**
     * 表格权限配置
     * 
     * <p>JSON格式的权限配置信息，包含用户和角色的访问权限。</p>
     * <p>用于细粒度的权限控制。</p>
     */
    @Column(name = "permission_config", columnDefinition = "JSON COMMENT '权限配置'")
    private String permissionConfig;
    
    // ==================== 配置信息字段 ====================
    
    /**
     * 表格行数
     * 
     * <p>表格的总行数，用于表格大小控制和性能优化。</p>
     * <p>默认值为100行，最大值1000行。</p>
     */
    @Min(value = 1, message = "行数不能小于1")
    @Max(value = 10000, message = "行数不能超过10000")
    @Builder.Default
    @Column(name = "row_count", nullable = false, columnDefinition = "INT DEFAULT 100 COMMENT '行数'")
    private Integer rowCount = 100;
    
    /**
     * 表格列数
     * 
     * <p>表格的总列数，用于表格大小控制。</p>
     * <p>默认值为50列，最大值200列。</p>
     */
    @Min(value = 1, message = "列数不能小于1")
    @Max(value = 500, message = "列数不能超过500")
    @Builder.Default
    @Column(name = "column_count", nullable = false, columnDefinition = "INT DEFAULT 50 COMMENT '列数'")
    private Integer columnCount = 50;
    
    /**
     * 表格配置
     * 
     * <p>JSON格式的表格配置信息，包含样式、布局、功能设置等。</p>
     * <p>支持灵活的表格自定义配置。</p>
     */
    @Column(name = "table_config", columnDefinition = "JSON COMMENT '表格配置'")
    private String tableConfig;
    
    // ==================== 统计信息字段 ====================
    
    /**
     * 访问次数
     * 
     * <p>记录表格被访问的总次数，用于使用统计和热门度分析。</p>
     * <p>每次访问后自动递增。</p>
     */
    @Builder.Default
    @Column(name = "view_count", nullable = false, columnDefinition = "BIGINT DEFAULT 0 COMMENT '访问次数'")
    private Long viewCount = 0L;
    
    /**
     * 最后访问时间
     * 
     * <p>记录表格最后一次被访问的时间戳。</p>
     * <p>用于活跃度分析和缓存策略。</p>
     */
    @Column(name = "last_access_time", columnDefinition = "DATETIME COMMENT '最后访问时间'")
    private Date lastAccessTime;
    
    /**
     * 编辑次数
     * 
     * <p>记录表格被编辑的总次数，用于变更统计。</p>
     * <p>每次保存后自动递增。</p>
     */
    @Builder.Default
    @Column(name = "edit_count", nullable = false, columnDefinition = "INT DEFAULT 0 COMMENT '编辑次数'")
    private Integer editCount = 0;
    
    // ==================== 状态管理字段 ====================
    
    /**
     * 表格启用状态
     * 
     * <p>控制表格是否可用：</p>
     * <ul>
     *   <li>true: 表格启用，用户可以正常访问和编辑</li>
     *   <li>false: 表格禁用，用户无法访问</li>
     * </ul>
     * <p>默认值为true。</p>
     */
    @Builder.Default
    @Column(name = "is_enabled", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1 COMMENT '是否启用'")
    private Boolean isEnabled = true;
    
    /**
     * 是否为模板
     * 
     * <p>标识是否为模板表格：</p>
     * <ul>
     *   <li>true: 模板表格，可供其他用户基于创建新表格</li>
     *   <li>false: 普通表格，仅个人使用</li>
     * </ul>
     * <p>默认值为false。</p>
     */
    @Builder.Default
    @Column(name = "is_template", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0 COMMENT '是否为模板'")
    private Boolean isTemplate = false;
    
    /**
     * 表格版本号
     * 
     * <p>用于乐观锁控制，防止并发编辑冲突。</p>
     * <p>每次保存操作时自动递增。</p>
     */
    @Version
    @Builder.Default
    @Column(name = "version", nullable = false, columnDefinition = "BIGINT DEFAULT 0 COMMENT '版本号'")
    private Long version = 0L;
    
    // ==================== 扩展信息字段 ====================
    
    /**
     * 表格标签
     * 
     * <p>用于分类和搜索的标签信息，多个标签用逗号分隔。</p>
     * <p>支持最大200个字符的标签总长度。</p>
     */
    @Size(max = 200, message = "标签总长度不能超过200个字符")
    @Column(name = "tags", length = 200, columnDefinition = "VARCHAR(200) COMMENT '标签'")
    private String tags;
    
    /**
     * 表格分类
     * 
     * <p>表格的业务分类，用于分类管理。</p>
     * <p>如：财务报表、项目管理、数据分析等。</p>
     */
    @Size(max = 50, message = "分类名称不能超过50个字符")
    @Column(name = "category", length = 50, columnDefinition = "VARCHAR(50) COMMENT '分类'")
    private String category;
    
    /**
     * 表格备注
     * 
     * <p>额外的备注信息，用于记录特殊说明或管理员备注。</p>
     * <p>支持最大1000个字符的备注内容。</p>
     */
    @Size(max = 1000, message = "备注不能超过1000个字符")
    @Column(name = "remarks", columnDefinition = "TEXT COMMENT '备注'")
    private String remarks;
    
    // ==================== 审计字段 ====================
    
    /**
     * 创建时间
     * 
     * <p>记录表格创建的时间戳。</p>
     * <p>创建时自动设置为当前时间。</p>
     */
    @Builder.Default
    @Column(name = "create_time", nullable = false, updatable = false, columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'")
    private LocalDateTime createTime = LocalDateTime.now();
    
    /**
     * 更新时间
     * 
     * <p>记录表格最后更新的时间戳。</p>
     * <p>每次更新时自动设置为当前时间。</p>
     */
    @Column(name = "update_time", columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'")
    private LocalDateTime updateTime;
    
    /**
     * 创建者信息
     * 
     * <p>关联创建表格的用户信息，延迟加载。</p>
     * <p>包含用户基本信息但不直接参与查询。</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "create_user_id", foreignKey = @ForeignKey(name = "fk_table_create_user"), insertable = false, updatable = false)
    private User createUser;
    
    /**
     * 最后修改者信息
     * 
     * <p>关联最后修改表格的用户信息，延迟加载。</p>
     * <p>用于操作审计和变更追踪。</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "update_user_id", foreignKey = @ForeignKey(name = "fk_table_update_user"), insertable = false, updatable = false)
    private User updateUser;
    
    // ==================== 逻辑删除字段 ====================
    
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
    @Column(name = "is_deleted", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0 COMMENT '是否删除'")
    private Boolean isDeleted = false;
    
    /**
     * 删除时间
     * 
     * <p>记录软删除的时间戳。</p>
     * <p>配合isDeleted字段使用，支持数据恢复。</p>
     */
    @Column(name = "delete_time", columnDefinition = "DATETIME COMMENT '删除时间'")
    private LocalDateTime deleteTime;
    
    /**
     * 删除者ID
     * 
     * <p>记录执行删除操作的用户ID。</p>
     * <p>用于删除操作的审计追踪。</p>
     */
    @Column(name = "delete_user_id", columnDefinition = "BIGINT COMMENT '删除者ID'")
    private Long deleteUserId;
    
    // ==================== 关联字段 ====================
    
    /**
     * 表格列集合
     * 
     * <p>关联的表格列信息集合，一对多关系。</p>
     * <p>级联删除，删除表格时同时删除相关列。</p>
     */
    @OneToMany(mappedBy = "table", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<TableColumn> columns;
    
    /**
     * 表格行集合
     * 
     * <p>关联的表格行信息集合，一对多关系。</p>
     * <p>级联删除，删除表格时同时删除相关行。</p>
     */
    @OneToMany(mappedBy = "table", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<TableRow> rows;
    
    // ==================== 枚举定义 ====================
    
    /**
     * 访问级别枚举
     */
    public enum AccessLevel {
        /**
         * 私有级别
         */
        PRIVATE("私有"),
        
        /**
         * 团队级别
         */
        TEAM("团队"),
        
        /**
         * 公开级别
         */
        PUBLIC("公开");
        
        private final String description;
        
        AccessLevel(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // ==================== 业务方法 ====================
    
    /**
     * 检查表格是否激活
     * 
     * <p>判断表格是否处于可用状态。</p>
     * 
     * @return true表示表格激活，false表示未激活
     */
    public boolean isActive() {
        return Boolean.TRUE.equals(isEnabled) && Boolean.FALSE.equals(isDeleted);
    }
    
    /**
     * 检查是否为模板表格
     * 
     * @return true表示是模板，false表示不是模板
     */
    public boolean isTemplateTable() {
        return Boolean.TRUE.equals(isTemplate);
    }
    
    /**
     * 检查用户是否为所有者
     * 
     * @param userId 用户ID
     * @return true表示是所有者，false表示不是所有者
     */
    public boolean isOwner(Long userId) {
        return createUserId != null && createUserId.equals(userId);
    }
    
    /**
     * 增加访问次数
     * 
     * <p>增加表格的访问计数。</p>
     */
    public void incrementViewCount() {
        this.viewCount = this.viewCount != null ? this.viewCount + 1 : 1L;
        this.lastAccessTime = new Date();
    }
    
    /**
     * 增加编辑次数
     * 
     * <p>增加表格的编辑计数。</p>
     */
    public void incrementEditCount() {
        this.editCount = this.editCount != null ? this.editCount + 1 : 1;
    }
    
    /**
     * 激活表格
     * 
     * <p>启用表格，使其可以被用户访问。</p>
     */
    public void activate() {
        this.isEnabled = true;
    }
    
    /**
     * 禁用表格
     * 
     * <p>禁用表格，使其暂时无法被用户访问。</p>
     */
    public void deactivate() {
        this.isEnabled = false;
    }
    
    /**
     * 软删除表格
     * 
     * @param deleteUserId 删除者ID
     */
    public void softDelete(Long deleteUserId) {
        this.isDeleted = true;
        this.deleteTime = LocalDateTime.now();
        this.deleteUserId = deleteUserId;
    }
    
    /**
     * 恢复表格
     * 
     * <p>从软删除状态恢复表格。</p>
     */
    public void restore() {
        this.isDeleted = false;
        this.deleteTime = null;
        this.deleteUserId = null;
    }
    
    /**
     * 更新基本信息
     * 
     * @param name 表格名称
     * @param description 表格描述
     */
    public void updateBasicInfo(String name, String description) {
        this.name = name;
        this.description = description;
        this.updateTime = LocalDateTime.now();
    }
    
    /**
     * 更新配置信息
     * 
     * @param accessLevel 访问级别
     * @param permissionConfig 权限配置
     */
    public void updateAccessConfig(AccessLevel accessLevel, String permissionConfig) {
        this.accessLevel = accessLevel;
        this.permissionConfig = permissionConfig;
        this.updateTime = LocalDateTime.now();
    }
    
    /**
     * 获取表格大小信息
     * 
     * @return 表格大小描述字符串
     */
    public String getTableSize() {
        return String.format("%d行 × %d列", 
                rowCount != null ? rowCount : 0, 
                columnCount != null ? columnCount : 0);
    }
    
    /**
     * 获取访问级别描述
     * 
     * @return 访问级别的中文描述
     */
    public String getAccessLevelDescription() {
        return accessLevel != null ? accessLevel.getDescription() : "未知";
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
        if (isDeleted == null) {
            isDeleted = false;
        }
        if (isTemplate == null) {
            isTemplate = false;
        }
        if (viewCount == null) {
            viewCount = 0L;
        }
        if (editCount == null) {
            editCount = 0;
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
