package com.enterprise.brain.modules.system.menu.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import javax.persistence.*;
import javax.validation.constraints.*;
import java.util.Objects;
import java.util.Set;

/**
 * 菜单项实体类
 * 
 * <p>构成动态菜单的具体项目，支持多种类型的菜单项包括按钮、链接、分隔符等。</p>
 * <p>提供丰富的配置选项，包括图标、权限控制、排序、可见性等功能。</p>
 * 
 * <p>主要功能：</p>
 * <ul>
 *   <li>多类型菜单项支持（按钮、链接、分隔符、外链等）</li>
 *   <li>权限控制和访问管理</li>
 *   <li>图标和样式配置</li>
 *   <li>排序和层级管理</li>
 *   <li>状态控制和启用管理</li>
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
@Table(name = "system_menu_item",
       indexes = {
           @Index(name = "idx_menu_item_menu_id", columnList = "menu_id"),
           @Index(name = "idx_menu_item_item_key", columnList = "item_key"),
           @Index(name = "idx_menu_item_item_type", columnList = "item_type"),
           @Index(name = "idx_menu_item_sort_order", columnList = "sort_order"),
           @Index(name = "idx_menu_item_permission", columnList = "permission_code"),
           @Index(name = "idx_menu_item_enabled", columnList = "is_enabled")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_menu_item_key", columnNames = {"item_key"})
       })
@EqualsAndHashCode(exclude = {"menu", "subItems", "createBy", "updateBy", "deleteBy"})
@ToString(exclude = {"menu", "subItems", "createBy", "updateBy", "deleteBy"})
public class MenuItem {
    
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
    
    // ==================== 基础信息字段 ====================
    
    /**
     * 菜单项名称
     * 
     * <p>菜单项的显示名称，支持多语言。</p>
     * <p>在前端界面中显示给用户的文本。</p>
     */
    @NotBlank(message = "菜单项名称不能为空")
    @Size(min = 1, max = 100, message = "菜单项名称长度必须在1-100个字符之间")
    @Column(name = "item_name", nullable = false, length = 100, columnDefinition = "VARCHAR(100) NOT NULL COMMENT '菜单项名称'")
    private String itemName;
    
    /**
     * 菜单项键值
     * 
     * <p>菜单项的唯一标识符，用于程序内部引用和权限控制。</p>
     * <p>在整个系统中必须保持唯一性。</p>
     */
    @NotBlank(message = "菜单项键值不能为空")
    @Size(min = 1, max = 100, message = "菜单项键值长度必须在1-100个字符之间")
    @Pattern(regexp = "^[a-zA-Z][a-zA-Z0-9_]*$", message = "菜单项键值只能包含字母、数字和下划线，且必须以字母开头")
    @Column(name = "item_key", nullable = false, unique = true, length = 100, columnDefinition = "VARCHAR(100) NOT NULL UNIQUE COMMENT '菜单项键值'")
    private String itemKey;
    
    /**
     * 菜单项图标
     * 
     * <p>菜单项显示的图标，支持多种格式：</p>
     * <ul>
     *   <li>图标字体类名：如 "fas fa-home"</li>
     *   <li>SVG图标路径：如 "/icons/home.svg"</li>
     *   <li>图片URL：如 "/images/home.png"</li>
     * </ul>
     */
    @Size(max = 200, message = "菜单项图标路径不能超过200个字符")
    @Column(name = "item_icon", length = 200, columnDefinition = "VARCHAR(200) COMMENT '菜单项图标'")
    private String itemIcon;
    
    /**
     * 菜单项类型
     * 
     * <p>定义菜单项的行为和显示方式：</p>
     * <ul>
     *   <li>BUTTON: 按钮类型，点击触发动作</li>
     *   <li>LINK: 链接类型，跳转到指定页面</li>
     *   <li>DIVIDER: 分隔符类型，用于菜单分组</li>
     *   <li>EXTERNAL_LINK: 外部链接类型</li>
     *   <li>DROPDOWN: 下拉菜单类型</li>
     *   <li>ACTION: 动作类型，执行JavaScript代码</li>
     * </ul>
     */
    @NotNull(message = "菜单项类型不能为空")
    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 20, columnDefinition = "VARCHAR(20) NOT NULL COMMENT '菜单项类型'")
    private ItemType itemType;
    
    // ==================== 功能配置字段 ====================
    
    /**
     * 动作URL
     * 
     * <p>菜单项点击后的跳转地址或动作标识。</p>
     * <p>支持多种格式：</p>
     * <ul>
     *   <li>内部路由：如 "/user/profile"</li>
     *   <li>外部URL：如 "https://example.com"</li>
     *   <li>JavaScript方法：如 "showUserDialog()"</li>
     * </ul>
     */
    @Size(max = 500, message = "动作URL不能超过500个字符")
    @Column(name = "action_url", length = 500, columnDefinition = "VARCHAR(500) COMMENT '动作URL'")
    private String actionUrl;
    
    /**
     * 权限代码
     * 
     * <p>控制菜单项访问权限的标识符。</p>
     * <p>与系统权限管理模块集成，支持细粒度权限控制。</p>
     */
    @Size(max = 100, message = "权限代码不能超过100个字符")
    @Column(name = "permission_code", length = 100, columnDefinition = "VARCHAR(100) COMMENT '权限代码'")
    private String permissionCode;
    
    /**
     * 是否需要权限验证
     * 
     * <p>控制菜单项是否需要进行权限验证。</p>
     * <ul>
     *   <li>true: 需要验证用户权限</li>
     *   <li>false: 所有用户都可以访问</li>
     * </ul>
     */
    @Builder.Default
    @Column(name = "require_auth", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1 COMMENT '是否需要权限验证'")
    private Boolean requireAuth = true;
    
    // ==================== 显示和排序字段 ====================
    
    /**
     * 排序顺序
     * 
     * <p>控制菜单项在菜单中的显示顺序。</p>
     * <p>数值越小排序越靠前，支持负数插队。</p>
     * <p>默认值为0，新菜单项显示在最后。</p>
     */
    @Min(value = Integer.MIN_VALUE, message = "排序值不能小于最小值")
    @Max(value = Integer.MAX_VALUE, message = "排序值不能大于最大值")
    @Builder.Default
    @Column(name = "sort_order", nullable = false, columnDefinition = "INT DEFAULT 0 COMMENT '排序顺序'")
    private Integer sortOrder = 0;
    
    /**
     * 是否启用
     * 
     * <p>控制菜单项的启用状态：</p>
     * <ul>
     *   <li>true: 菜单项启用，用户可见</li>
     *   <li>false: 菜单项禁用，用户不可见</li>
     * </ul>
     * <p>默认值为true。</p>
     */
    @Builder.Default
    @Column(name = "is_enabled", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1 COMMENT '是否启用'")
    private Boolean isEnabled = true;
    
    /**
     * 是否在新窗口打开
     * 
     * <p>控制链接类型的菜单项是否在新窗口中打开。</p>
     * <p>主要用于外部链接。</p>
     */
    @Builder.Default
    @Column(name = "open_new_window", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0 COMMENT '是否在新窗口打开'")
    private Boolean openNewWindow = false;
    
    /**
     * 菜单项描述
     * 
     * <p>菜单项的详细描述或提示信息。</p>
     * <p>可以用于工具提示或帮助文档。</p>
     */
    @Size(max = 500, message = "菜单项描述不能超过500个字符")
    @Column(name = "item_description", length = 500, columnDefinition = "VARCHAR(500) COMMENT '菜单项描述'")
    private String itemDescription;
    
    /**
     * CSS样式类
     * 
     * <p>自定义CSS样式类，用于菜单项的样式定制。</p>
     * <p>支持多个样式类，用空格分隔。</p>
     */
    @Size(max = 200, message = "CSS样式类不能超过200个字符")
    @Column(name = "css_class", length = 200, columnDefinition = "VARCHAR(200) COMMENT 'CSS样式类'")
    private String cssClass;
    
    // ==================== 关联关系字段 ====================
    
    /**
     * 所属菜单
     * 
     * <p>关联的父级菜单对象。</p>
     * <p>建立多对一关联关系，一个菜单包含多个菜单项。</p>
     */
    @NotNull(message = "所属菜单不能为空")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_id", nullable = false, foreignKey = @ForeignKey(name = "fk_menu_item_menu"))
    private DynamicMenu menu;
    
    /**
     * 子菜单项集合
     * 
     * <p>支持下拉菜单类型的子菜单项。</p>
     * <p>建立一对多关联关系，一个菜单项可以包含多个子项。</p>
     */
    @OneToMany(mappedBy = "parentItem", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    private Set<MenuItem> subItems;
    
    /**
     * 父菜单项
     * 
     * <p>用于层级菜单结构的父级菜单项。</p>
     * <p>建立自关联关系，支持无限层级。</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_item_id", foreignKey = @ForeignKey(name = "fk_menu_item_parent"))
    private MenuItem parentItem;
    
    /**
     * 层级深度
     * 
     * <p>记录菜单项在层级结构中的深度。</p>
     * <ul>
     *   <li>0: 顶级菜单项</li>
     *   <li>1: 二级菜单项</li>
     *   <li>2: 三级菜单项</li>
     * </ul>
     */
    @Min(value = 0, message = "层级深度不能为负数")
    @Max(value = 10, message = "层级深度不能超过10层")
    @Builder.Default
    @Column(name = "level_depth", nullable = false, columnDefinition = "INT DEFAULT 0 COMMENT '层级深度'")
    private Integer levelDepth = 0;
    
    // ==================== 统计和分析字段 ====================
    
    /**
     * 访问次数
     * 
     * <p>记录菜单项被点击访问的总次数。</p>
     * <p>用于用户行为分析和菜单热度统计。</p>
     */
    @Min(value = 0, message = "访问次数不能为负数")
    @Builder.Default
    @Column(name = "visit_count", nullable = false, columnDefinition = "BIGINT DEFAULT 0 COMMENT '访问次数'")
    private Long visitCount = 0L;
    
    /**
     * 最后访问时间
     * 
     * <p>记录菜单项最后一次被访问的时间。</p>
     * <p>用于活跃度分析和缓存策略。</p>
     */
    @Column(name = "last_visit_time", columnDefinition = "DATETIME COMMENT '最后访问时间'")
    private java.time.LocalDateTime lastVisitTime;
    
    // ==================== 审计字段 ====================
    
    /**
     * 创建时间
     * 
     * <p>记录菜单项的创建时间。</p>
     * <p>创建时自动设置为当前时间。</p>
     */
    @Builder.Default
    @Column(name = "create_time", nullable = false, updatable = false, columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'")
    private java.time.LocalDateTime createTime = java.time.LocalDateTime.now();
    
    /**
     * 更新时间
     * 
     * <p>记录菜单项的最后更新时间。</p>
     * <p>每次更新时自动设置为当前时间。</p>
     */
    @Column(name = "update_time", columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'")
    private java.time.LocalDateTime updateTime;
    
    /**
     * 创建者ID
     * 
     * <p>记录创建该菜单项的用户ID。</p>
     * <p>用于操作审计和权限控制。</p>
     */
    @Column(name = "create_by", columnDefinition = "BIGINT COMMENT '创建者ID'")
    private Long createBy;
    
    /**
     * 更新者ID
     * 
     * <p>记录最后更新该菜单项的用户ID。</p>
     * <p>用于操作审计和权限控制。</p>
     */
    @Column(name = "update_by", columnDefinition = "BIGINT COMMENT '更新者ID'")
    private Long updateBy;
    
    /**
     * 删除者ID
     * 
     * <p>记录删除该菜单项的用户ID。</p>
     * <p>用于软删除审计。</p>
     */
    @Column(name = "delete_by", columnDefinition = "BIGINT COMMENT '删除者ID'")
    private Long deleteBy;
    
    /**
     * 删除时间
     * 
     * <p>记录软删除的时间戳。</p>
     * <p>配合删除状态字段使用。</p>
     */
    @Column(name = "delete_time", columnDefinition = "DATETIME COMMENT '删除时间'")
    private java.time.LocalDateTime deleteTime;
    
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
     * 菜单项类型枚举
     */
    public enum ItemType {
        /**
         * 按钮类型 - 点击触发动作
         */
        BUTTON("按钮类型"),
        
        /**
         * 链接类型 - 跳转到指定页面
         */
        LINK("链接类型"),
        
        /**
         * 分隔符类型 - 用于菜单分组
         */
        DIVIDER("分隔符类型"),
        
        /**
         * 外部链接类型 - 打开外部网站
         */
        EXTERNAL_LINK("外部链接类型"),
        
        /**
         * 下拉菜单类型 - 包含子菜单
         */
        DROPDOWN("下拉菜单类型"),
        
        /**
         * 动作类型 - 执行JavaScript代码
         */
        ACTION("动作类型");
        
        private final String description;
        
        ItemType(String description) {
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
            createTime = java.time.LocalDateTime.now();
        }
        if (itemType == null) {
            itemType = ItemType.BUTTON;
        }
        if (isEnabled == null) {
            isEnabled = true;
        }
        if (sortOrder == null) {
            sortOrder = 0;
        }
        if (visitCount == null) {
            visitCount = 0L;
        }
        if (requireAuth == null) {
            requireAuth = true;
        }
        if (openNewWindow == null) {
            openNewWindow = false;
        }
        if (levelDepth == null) {
            levelDepth = 0;
        }
    }
    
    /**
     * 更新前回调
     * 
     * <p>在实体更新前执行，用于更新时间戳和业务校验。</p>
     */
    @PreUpdate
    protected void onUpdate() {
        updateTime = java.time.LocalDateTime.now();
    }
    
    // ==================== 业务方法 ====================
    
    /**
     * 增加访问次数
     * 
     * <p>每次用户点击菜单项时调用，自动增加访问次数并更新最后访问时间。</p>
     */
    public void incrementVisitCount() {
        this.visitCount++;
        this.lastVisitTime = java.time.LocalDateTime.now();
    }
    
    /**
     * 设置启用状态
     * 
     * <p>控制菜单项的启用/禁用状态。</p>
     * 
     * @param enabled 是否启用
     */
    public void setEnabled(boolean enabled) {
        this.isEnabled = enabled;
    }
    
    /**
     * 更新排序顺序
     * 
     * <p>设置菜单项的排序顺序。</p>
     * 
     * @param sortOrder 排序顺序
     */
    public void updateSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
    
    /**
     * 添加子菜单项
     * 
     * <p>向下拉菜单中添加子菜单项。</p>
     * 
     * @param subItem 子菜单项
     */
    public void addSubItem(MenuItem subItem) {
        if (subItems == null) {
            subItems = new java.util.HashSet<>();
        }
        subItem.setParentItem(this);
        subItem.setLevelDepth(this.levelDepth + 1);
        subItems.add(subItem);
    }
    
    /**
     * 移除子菜单项
     * 
     * <p>从下拉菜单中移除指定的子菜单项。</p>
     * 
     * @param subItem 子菜单项
     */
    public void removeSubItem(MenuItem subItem) {
        if (subItems != null) {
            subItems.remove(subItem);
            subItem.setParentItem(null);
            subItem.setLevelDepth(0);
        }
    }
    
    /**
     * 检查是否为链接类型
     * 
     * <p>判断菜单项是否为可点击的链接类型。</p>
     * 
     * @return true表示是链接类型，false表示不是
     */
    public boolean isLinkType() {
        return ItemType.LINK.equals(itemType) || ItemType.EXTERNAL_LINK.equals(itemType);
    }
    
    /**
     * 检查是否为分隔符
     * 
     * <p>判断菜单项是否为分隔符类型。</p>
     * 
     * @return true表示是分隔符，false表示不是
     */
    public boolean isDivider() {
        return ItemType.DIVIDER.equals(itemType);
    }
    
    /**
     * 检查是否支持下拉
     * 
     * <p>判断菜单项是否支持下拉菜单功能。</p>
     * 
     * @return true表示支持下拉，false表示不支持
     */
    public boolean isDropdown() {
        return ItemType.DROPDOWN.equals(itemType);
    }
    
    /**
     * 检查是否需要权限验证
     * 
     * <p>判断菜单项是否需要进行权限验证。</p>
     * 
     * @return true表示需要验证，false表示不需要
     */
    public boolean requiresAuthentication() {
        return Boolean.TRUE.equals(requireAuth) && permissionCode != null && !permissionCode.trim().isEmpty();
    }
    
    /**
     * 获取完整的动作URL
     * 
     * <p>根据菜单项类型返回处理后的URL。</p>
     * 
     * @return 处理后的URL
     */
    public String getFullActionUrl() {
        if (ItemType.EXTERNAL_LINK.equals(itemType) && actionUrl != null) {
            return actionUrl.startsWith("http") ? actionUrl : "http://" + actionUrl;
        }
        return actionUrl;
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
     * 获取父菜单项ID
     * 
     * <p>安全地获取父菜单项的ID。</p>
     * 
     * @return 父菜单项ID，如果父项为空则返回null
     */
    public Long getParentItemId() {
        return parentItem != null ? parentItem.getId() : null;
    }
    
    /**
     * 复制菜单项
     * 
     * <p>创建当前菜单项的副本，用于批量操作。</p>
     * 
     * @return 菜单项副本
     */
    public MenuItem copy() {
        return MenuItem.builder()
                .itemName(this.itemName + "_copy")
                .itemKey(this.itemKey + "_copy_" + System.currentTimeMillis())
                .itemIcon(this.itemIcon)
                .itemType(this.itemType)
                .actionUrl(this.actionUrl)
                .permissionCode(this.permissionCode)
                .requireAuth(this.requireAuth)
                .sortOrder(this.sortOrder + 1)
                .isEnabled(this.isEnabled)
                .openNewWindow(this.openNewWindow)
                .itemDescription(this.itemDescription)
                .cssClass(this.cssClass)
                .menu(this.menu)
                .levelDepth(this.levelDepth)
                .build();
    }
    
    // ==================== 重写方法 ====================
    
    /**
     * 重写equals方法
     * 
     * <p>基于itemKey判断菜单项是否相等。</p>
     * 
     * @param other 比较对象
     * @return true表示相等，false表示不相等
     */
    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (other == null || getClass() != other.getClass()) return false;
        
        MenuItem that = (MenuItem) other;
        return Objects.equals(itemKey, that.itemKey);
    }
    
    /**
     * 重写hashCode方法
     * 
     * <p>基于itemKey生成哈希码。</p>
     * 
     * @return 哈希码
     */
    @Override
    public int hashCode() {
        return Objects.hash(itemKey);
    }
}