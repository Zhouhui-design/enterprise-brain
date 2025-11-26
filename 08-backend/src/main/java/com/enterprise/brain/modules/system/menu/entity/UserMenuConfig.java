package com.enterprise.brain.modules.system.menu.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import javax.persistence.*;
import javax.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Objects;

/**
 * 用户菜单配置实体类
 * 
 * <p>用于存储用户与菜单的个性化配置信息，包括菜单可见性、排序偏好等。</p>
 * <p>支持用户自定义菜单显示顺序和隐藏不需要的菜单项。</p>
 * 
 * <p>主要功能：</p>
 * <ul>
 *   <li>用户菜单可见性配置</li>
 *   <li>用户自定义菜单排序</li>
 *   <li>菜单使用频率统计</li>
 *   <li>个人偏好设置存储</li>
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
@Table(name = "system_user_menu_config", 
       indexes = {
           @Index(name = "idx_user_menu_config_user_id", columnList = "user_id"),
           @Index(name = "idx_user_menu_config_menu_id", columnList = "menu_id"),
           @Index(name = "idx_user_menu_config_create_time", columnList = "create_time")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_user_menu_config", 
                           columnNames = {"user_id", "menu_id"})
       })
@EqualsAndHashCode(exclude = {"menu", "createBy", "updateBy", "deleteBy"})
@ToString(exclude = {"menu", "createBy", "updateBy", "deleteBy"})
public class UserMenuConfig {
    
    // ==================== 主键字段 ====================
    
    /**
     * 主键ID
     * 
     * <p>采用数据库自增策略生成主键。</p>
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;
    
    // ==================== 业务字段 ====================
    
    /**
     * 用户ID
     * 
     * <p>关联的用户标识，不能为空。</p>
     * <p>与系统用户表建立关联关系。</p>
     */
    @NotNull(message = "用户ID不能为空")
    @Column(name = "user_id", nullable = false, columnDefinition = "BIGINT COMMENT '用户ID'")
    private Long userId;
    
    /**
     * 关联的动态菜单
     * 
     * <p>用户配置的具体菜单对象。</p>
     * <p>建立多对一关联关系，多个用户可以配置同一个菜单。</p>
     */
    @NotNull(message = "菜单不能为空")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_menu_config_menu"))
    private DynamicMenu menu;
    
    /**
     * 菜单是否可见
     * 
     * <p>控制菜单是否对用户显示。</p>
     * <ul>
     *   <li>true: 菜单对用户可见</li>
     *   <li>false: 菜单对用户隐藏</li>
     * </ul>
     * <p>默认值为true，即菜单默认可见。</p>
     */
    @Builder.Default
    @Column(name = "is_visible", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1 COMMENT '是否可见：1-可见，0-隐藏'")
    private Boolean isVisible = true;
    
    /**
     * 用户自定义排序顺序
     * 
     * <p>用户自定义的菜单显示顺序，数值越小排序越靠前。</p>
     * <p>支持负数排序，用于插队操作。</p>
     * <p>默认值为100，确保新增菜单项显示在最后。</p>
     */
    @Min(value = Integer.MIN_VALUE, message = "排序值不能小于最小值")
    @Max(value = Integer.MAX_VALUE, message = "排序值不能大于最大值")
    @Builder.Default
    @Column(name = "user_sort_order", nullable = false, columnDefinition = "INT DEFAULT 100 COMMENT '用户自定义排序顺序'")
    private Integer userSortOrder = 100;
    
    /**
     * 菜单使用频率
     * 
     * <p>记录用户点击该菜单的次数，用于智能推荐和排序优化。</p>
     * <p>默认值为0，每次点击时自动递增。</p>
     */
    @Min(value = 0, message = "使用频率不能为负数")
    @Builder.Default
    @Column(name = "usage_count", nullable = false, columnDefinition = "INT DEFAULT 0 COMMENT '菜单使用频率'")
    private Integer usageCount = 0;
    
    /**
     * 最后访问时间
     * 
     * <p>记录用户最后一次访问该菜单的时间。</p>
     * <p>用于访问热度和用户行为分析。</p>
     */
    @Column(name = "last_access_time", columnDefinition = "DATETIME COMMENT '最后访问时间'")
    private LocalDateTime lastAccessTime;
    
    /**
     * 是否置顶
     * 
     * <p>控制菜单是否在用户界面中置顶显示。</p>
     * <p>置顶的菜单会优先显示在菜单列表顶部。</p>
     */
    @Builder.Default
    @Column(name = "is_pinned", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0 COMMENT '是否置顶：1-置顶，0-普通'")
    private Boolean isPinned = false;
    
    /**
     * 用户备注信息
     * 
     * <p>用户对菜单的个性化备注或说明信息。</p>
     * <p>支持最大500个字符的文本内容。</p>
     */
    @Size(max = 500, message = "备注信息不能超过500个字符")
    @Column(name = "user_remark", length = 500, columnDefinition = "VARCHAR(500) COMMENT '用户备注信息'")
    private String userRemark;
    
    /**
     * 配置状态
     * 
     * <p>用户菜单配置的状态：</p>
     * <ul>
     *   <li>ACTIVE: 活跃状态，正常使用</li>
     *   <li>INACTIVE: 非活跃状态，暂时禁用</li>
     *   <li>DELETED: 已删除状态，标记删除</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "config_status", nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'ACTIVE' COMMENT '配置状态'")
    private ConfigStatus configStatus = ConfigStatus.ACTIVE;
    
    // ==================== 审计字段 ====================
    
    /**
     * 创建时间
     * 
     * <p>记录用户菜单配置的创建时间。</p>
     * <p>创建时自动设置为当前时间。</p>
     */
    @Builder.Default
    @Column(name = "create_time", nullable = false, updatable = false, columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'")
    private LocalDateTime createTime = LocalDateTime.now();
    
    /**
     * 更新时间
     * 
     * <p>记录用户菜单配置的最后更新时间。</p>
     * <p>每次更新时自动设置为当前时间。</p>
     */
    @Column(name = "update_time", columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'")
    private LocalDateTime updateTime;
    
    /**
     * 创建者ID
     * 
     * <p>记录创建该配置的用户ID。</p>
     * <p>用于操作审计和权限控制。</p>
     */
    @Column(name = "create_by", columnDefinition = "BIGINT COMMENT '创建者ID'")
    private Long createBy;
    
    /**
     * 更新者ID
     * 
     * <p>记录最后更新该配置的用户ID。</p>
     * <p>用于操作审计和权限控制。</p>
     */
    @Column(name = "update_by", columnDefinition = "BIGINT COMMENT '更新者ID'")
    private Long updateBy;
    
    /**
     * 删除者ID
     * 
     * <p>记录删除该配置的用户ID。</p>
     * <p>用于软删除审计。</p>
     */
    @Column(name = "delete_by", columnDefinition = "BIGINT COMMENT '删除者ID'")
    private Long deleteBy;
    
    /**
     * 删除时间
     * 
     * <p>记录软删除的时间戳。</p>
     * <p>配合configStatus=DELETED使用。</p>
     */
    @Column(name = "delete_time", columnDefinition = "DATETIME COMMENT '删除时间'")
    private LocalDateTime deleteTime;
    
    /**
     * 版本号
     * 
     * <p>用于乐观锁控制，防止并发更新冲突。</p>
     * <p>每次更新时自动递增。</p>
     */
    @Version
    @Column(name = "version", nullable = false, columnDefinition = "BIGINT DEFAULT 0 COMMENT '版本号'")
    private Long version;
    
    // ==================== 枚举定义 ====================
    
    /**
     * 配置状态枚举
     */
    public enum ConfigStatus {
        /**
         * 活跃状态 - 正常使用
         */
        ACTIVE("活跃状态"),
        
        /**
         * 非活跃状态 - 暂时禁用
         */
        INACTIVE("非活跃状态"),
        
        /**
         * 已删除状态 - 标记删除
         */
        DELETED("已删除状态");
        
        private final String description;
        
        ConfigStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
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
        if (configStatus == null) {
            configStatus = ConfigStatus.ACTIVE;
        }
        if (isVisible == null) {
            isVisible = true;
        }
        if (userSortOrder == null) {
            userSortOrder = 100;
        }
        if (usageCount == null) {
            usageCount = 0;
        }
        if (isPinned == null) {
            isPinned = false;
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
    
    // ==================== 业务方法 ====================
    
    /**
     * 增加使用次数
     * 
     * <p>每次用户访问菜单时调用，自动增加使用频率并更新最后访问时间。</p>
     */
    public void incrementUsage() {
        this.usageCount++;
        this.lastAccessTime = LocalDateTime.now();
    }
    
    /**
     * 设置置顶状态
     * 
     * <p>控制菜单是否置顶显示。</p>
     * 
     * @param pinned 是否置顶
     */
    public void setPinned(boolean pinned) {
        this.isPinned = pinned;
    }
    
    /**
     * 设置可见性
     * 
     * <p>控制菜单是否对用户显示。</p>
     * 
     * @param visible 是否可见
     */
    public void setVisible(boolean visible) {
        this.isVisible = visible;
    }
    
    /**
     * 更新排序顺序
     * 
     * <p>设置用户自定义的菜单排序。</p>
     * 
     * @param sortOrder 排序顺序
     */
    public void updateSortOrder(Integer sortOrder) {
        this.userSortOrder = sortOrder;
    }
    
    /**
     * 软删除
     * 
     * <p>标记删除状态，保留数据用于审计。</p>
     * 
     * @param deleteBy 删除者ID
     */
    public void softDelete(Long deleteBy) {
        this.configStatus = ConfigStatus.DELETED;
        this.deleteBy = deleteBy;
        this.deleteTime = LocalDateTime.now();
    }
    
    /**
     * 检查是否活跃
     * 
     * <p>判断配置是否处于活跃状态。</p>
     * 
     * @return true表示活跃，false表示非活跃
     */
    public boolean isActive() {
        return ConfigStatus.ACTIVE.equals(this.configStatus);
    }
    
    /**
     * 检查是否已删除
     * 
     * <p>判断配置是否已被删除。</p>
     * 
     * @return true表示已删除，false表示未删除
     */
    public boolean isDeleted() {
        return ConfigStatus.DELETED.equals(this.configStatus);
    }
    
    /**
     * 获取菜单ID
     * 
     * <p>安全地获取关联菜单的ID，避免空指针异常。</p>
     * 
     * @return 菜单ID，如果菜单为空则返回null
     */
    public Long getMenuId() {
        return menu != null ? menu.getId() : null;
    }
    
    /**
     * 获取菜单名称
     * 
     * <p>安全地获取关联菜单的名称。</p>
     * 
     * @return 菜单名称，如果菜单为空则返回null
     */
    public String getMenuName() {
        return menu != null ? menu.getName() : null;
    }
    
    /**
     * 复制配置信息
     * 
     * <p>创建当前配置的副本，用于批量操作。</p>
     * 
     * @return 配置副本
     */
    public UserMenuConfig copy() {
        return UserMenuConfig.builder()
                .userId(this.userId)
                .menu(this.menu)
                .isVisible(this.isVisible)
                .userSortOrder(this.userSortOrder)
                .usageCount(0) // 重置使用次数
                .isPinned(this.isPinned)
                .userRemark(this.userRemark)
                .configStatus(ConfigStatus.ACTIVE)
                .build();
    }
    
    // ==================== 重写方法 ====================
    
    /**
     * 重写equals方法
     * 
     * <p>基于userId和menuId判断配置是否相等。</p>
     * 
     * @param other 比较对象
     * @return true表示相等，false表示不相等
     */
    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (other == null || getClass() != other.getClass()) return false;
        
        UserMenuConfig that = (UserMenuConfig) other;
        return Objects.equals(userId, that.userId) &&
               Objects.equals(getMenuId(), that.getMenuId());
    }
    
    /**
     * 重写hashCode方法
     * 
     * <p>基于userId和menuId生成哈希码。</p>
     * 
     * @return 哈希码
     */
    @Override
    public int hashCode() {
        return Objects.hash(userId, getMenuId());
    }
}