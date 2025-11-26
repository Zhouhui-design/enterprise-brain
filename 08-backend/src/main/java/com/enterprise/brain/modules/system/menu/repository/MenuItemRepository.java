package com.enterprise.brain.modules.system.menu.repository;

import com.enterprise.brain.modules.system.menu.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

/**
 * 菜单项数据访问层接口
 * 
 * <p>提供菜单项的数据访问操作，支持复杂查询、批量操作、性能优化等企业级功能。</p>
 * <p>基于Spring Data JPA实现，支持动态查询、分页、排序等高级功能。</p>
 * 
 * @author enterprise-brain-team
 * @version 2.0
 * @since 2024-01-01
 */
@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long>, JpaSpecificationExecutor<MenuItem> {
    
    // ==================== 基础查询方法 ====================
    
    /**
     * 根据菜单ID查询菜单项（按排序升序）
     * 
     * <p>查询指定菜单下的所有菜单项，并按照排序字段升序排列。</p>
     * 
     * @param menuId 菜单ID（非null）
     * @return 菜单项列表，按排序字段升序排列，无结果时返回空列表
     */
    List<MenuItem> findByMenuIdOrderBySortOrderAsc(Long menuId);
    
    /**
     * 根据菜单ID查询启用状态的菜单项（按排序升序）
     * 
     * <p>查询指定菜单下所有启用状态的菜单项，并按照排序字段升序排列。</p>
     * 
     * @param menuId 菜单ID（非null）
     * @return 启用状态的菜单项列表，按排序字段升序排列，无结果时返回空列表
     */
    List<MenuItem> findByMenuIdAndIsEnabledTrueOrderBySortOrderAsc(Long menuId);
    
    /**
     * 根据菜单项键查询菜单项
     * 
     * <p>通过菜单项的唯一标识键查询菜单项信息。</p>
     * 
     * @param itemKey 菜单项键（非null）
     * @return 菜单项对象，无匹配时返回null
     */
    MenuItem findByItemKey(String itemKey);
    
    /**
     * 根据菜单项键查询菜单项（返回Optional）
     * 
     * <p>通过菜单项的唯一标识键查询菜单项信息，返回Optional类型避免空指针。</p>
     * 
     * @param itemKey 菜单项键（非null）
     * @return 包含菜单项的Optional，无匹配时返回Optional.empty()
     */
    Optional<MenuItem> findOptionalByItemKey(String itemKey);
    
    /**
     * 根据菜单ID和菜单项键查询
     * 
     * <p>在指定菜单下查询特定键值的菜单项，确保在菜单范围内的唯一性。</p>
     * 
     * @param menuId 菜单ID（非null）
     * @param itemKey 菜单项键（非null）
     * @return 菜单项对象，无匹配时返回null
     */
    MenuItem findByMenuIdAndItemKey(Long menuId, String itemKey);
    
    // ==================== 批量查询方法 ====================
    
    /**
     * 根据多个菜单ID批量查询菜单项
     * 
     * <p>批量查询多个菜单下的所有菜单项，按菜单ID和排序字段排序。</p>
     * 
     * @param menuIds 菜单ID集合（非null且非空）
     * @return 菜单项列表，按菜单ID和排序字段排序
     */
    @Query("SELECT mi FROM MenuItem mi WHERE mi.menuId IN :menuIds ORDER BY mi.menuId, mi.sortOrder")
    List<MenuItem> findByMenuIdInOrderByMenuIdAscSortOrderAsc(@Param("menuIds") Collection<Long> menuIds);
    
    /**
     * 根据多个菜单项键批量查询
     * 
     * <p>通过菜单项键列表批量查询菜单项信息。</p>
     * 
     * @param itemKeys 菜单项键集合（非null且非空）
     * @return 菜单项列表，无匹配时返回空列表
     */
    List<MenuItem> findByItemKeyIn(Collection<String> itemKeys);
    
    /**
     * 查询指定菜单下指定状态的菜单项
     * 
     * <p>根据启用状态筛选菜单项，支持批量查询。</p>
     * 
     * @param menuId 菜单ID（非null）
     * @param enabled 启用状态，true表示启用，false表示禁用
     * @return 符合条件的菜单项列表
     */
    List<MenuItem> findByMenuIdAndIsEnabledOrderBySortOrderAsc(Long menuId, Boolean enabled);
    
    // ==================== 统计和计数方法 ====================
    
    /**
     * 统计指定菜单下的菜单项数量
     * 
     * @param menuId 菜单ID（非null）
     * @return 菜单项数量
     */
    long countByMenuId(Long menuId);
    
    /**
     * 统计指定菜单下启用状态的菜单项数量
     * 
     * @param menuId 菜单ID（非null）
     * @return 启用状态的菜单项数量
     */
    long countByMenuIdAndIsEnabledTrue(Long menuId);
    
    /**
     * 检查菜单项键是否存在
     * 
     * @param itemKey 菜单项键（非null）
     * @return true表示存在，false表示不存在
     */
    boolean existsByItemKey(String itemKey);
    
    /**
     * 检查指定菜单下是否存在菜单项键
     * 
     * @param menuId 菜单ID（非null）
     * @param itemKey 菜单项键（非null）
     * @return true表示存在，false表示不存在
     */
    boolean existsByMenuIdAndItemKey(Long menuId, String itemKey);
    
    // ==================== 分页查询方法 ====================
    
    /**
     * 分页查询指定菜单下的菜单项
     * 
     * @param menuId 菜单ID（非null）
     * @param pageable 分页参数（非null）
     * @return 分页结果
     */
    Page<MenuItem> findByMenuId(Long menuId, Pageable pageable);
    
    /**
     * 分页查询指定菜单下启用状态的菜单项
     * 
     * @param menuId 菜单ID（非null）
     * @param enabled 启用状态
     * @param pageable 分页参数（非null）
     * @return 分页结果
     */
    Page<MenuItem> findByMenuIdAndIsEnabled(Long menuId, Boolean enabled, Pageable pageable);
    
    /**
     * 切片查询指定菜单下的菜单项
     * 
     * @param menuId 菜单ID（非null）
     * @param pageable 分页参数（非null）
     * @return 切片结果
     */
    Slice<MenuItem> findSliceByMenuIdOrderBySortOrderAsc(Long menuId, Pageable pageable);
    
    // ==================== 复杂查询方法 ====================
    
    /**
     * 查询指定排序范围内的菜单项
     * 
     * @param menuId 菜单ID（非null）
     * @param startSort 开始排序值
     * @param endSort 结束排序值
     * @return 排序范围内的菜单项列表
     */
    @Query("SELECT mi FROM MenuItem mi WHERE mi.menuId = :menuId AND mi.sortOrder BETWEEN :startSort AND :endSort ORDER BY mi.sortOrder")
    List<MenuItem> findByMenuIdAndSortOrderBetween(@Param("menuId") Long menuId, 
                                                   @Param("startSort") Integer startSort, 
                                                   @Param("endSort") Integer endSort);
    
    /**
     * 查询指定菜单下排序值大于指定值的所有菜单项
     * 
     * @param menuId 菜单ID（非null）
     * @param sortOrder 排序值
     * @return 排序值大于指定值的菜单项列表
     */
    List<MenuItem> findByMenuIdAndSortOrderGreaterThanOrderBySortOrderAsc(Long menuId, Integer sortOrder);
    
    /**
     * 根据菜单名称模糊查询菜单项
     * 
     * @param menuId 菜单ID（非null）
     * @param namePattern 菜单项名称模式，支持通配符
     * @return 匹配的菜单项列表
     */
    @Query("SELECT mi FROM MenuItem mi WHERE mi.menuId = :menuId AND LOWER(mi.name) LIKE LOWER(CONCAT('%', :namePattern, '%')) ORDER BY mi.sortOrder")
    List<MenuItem> findByMenuIdAndNameContainingIgnoreCase(@Param("menuId") Long menuId, 
                                                          @Param("namePattern") String namePattern);
    
    /**
     * 查询指定类型的菜单项
     * 
     * @param menuId 菜单ID（非null）
     * @param itemType 菜单项类型
     * @return 指定类型的菜单项列表
     */
    List<MenuItem> findByMenuIdAndItemTypeOrderBySortOrderAsc(Long menuId, String itemType);
    
    // ==================== 批量操作方法 ====================
    
    /**
     * 根据菜单ID删除所有菜单项
     * 
     * @param menuId 菜单ID（非null）
     * @return 删除的记录数
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM MenuItem mi WHERE mi.menuId = :menuId")
    int deleteAllByMenuId(@Param("menuId") Long menuId);
    
    /**
     * 批量更新菜单项的启用状态
     * 
     * @param menuId 菜单ID（非null）
     * @param enabled 新的启用状态
     * @return 更新的记录数
     */
    @Modifying
    @Transactional
    @Query("UPDATE MenuItem mi SET mi.isEnabled = :enabled WHERE mi.menuId = :menuId")
    int updateEnabledByMenuId(@Param("menuId") Long menuId, @Param("enabled") Boolean enabled);
    
    /**
     * 批量更新菜单项排序值
     * 
     * @param menuId 菜单ID（非null）
     * @param startSort 起始排序值
     * @param offset 排序偏移量
     * @return 更新的记录数
     */
    @Modifying
    @Transactional
    @Query("UPDATE MenuItem mi SET mi.sortOrder = mi.sortOrder + :offset WHERE mi.menuId = :menuId AND mi.sortOrder >= :startSort")
    int updateSortOrderBatch(@Param("menuId") Long menuId, @Param("startSort") Integer startSort, @Param("offset") Integer offset);
    
    // ==================== 性能优化查询 ====================
    
    /**
     * 获取指定菜单下菜单项的最大排序值
     * 
     * @param menuId 菜单ID（非null）
     * @return 最大排序值，无菜单项时返回0
     */
    @Query("SELECT COALESCE(MAX(mi.sortOrder), 0) FROM MenuItem mi WHERE mi.menuId = :menuId")
    Integer findMaxSortOrderByMenuId(@Param("menuId") Long menuId);
    
    /**
     * 获取指定菜单下菜单项的最小排序值
     * 
     * @param menuId 菜单ID（非null）
     * @return 最小排序值，无菜单项时返回0
     */
    @Query("SELECT COALESCE(MIN(mi.sortOrder), 0) FROM MenuItem mi WHERE mi.menuId = :menuId")
    Integer findMinSortOrderByMenuId(@Param("menuId") Long menuId);
    
    /**
     * 查询指定菜单下排序值最小的菜单项
     * 
     * @param menuId 菜单ID（非null）
     * @return 排序值最小的菜单项列表（通常只有一个）
     */
    @Query("SELECT mi FROM MenuItem mi WHERE mi.menuId = :menuId ORDER BY mi.sortOrder ASC")
    List<MenuItem> findTopByMenuIdOrderBySortOrderAsc(@Param("menuId") Long menuId);
    
    /**
     * 查询指定菜单下排序值最大的菜单项
     * 
     * @param menuId 菜单ID（非null）
     * @return 排序值最大的菜单项列表（通常只有一个）
     */
    @Query("SELECT mi FROM MenuItem mi WHERE mi.menuId = :menuId ORDER BY mi.sortOrder DESC")
    List<MenuItem> findTopByMenuIdOrderBySortOrderDesc(@Param("menuId") Long menuId);
    
    // ==================== 关联查询方法 ====================
    
    /**
     * 查询包含特定权限标识的菜单项
     * 
     * @param permissionCode 权限标识代码（非null）
     * @return 包含指定权限的菜单项列表
     */
    @Query("SELECT mi FROM MenuItem mi WHERE mi.permissionCode = :permissionCode ORDER BY mi.sortOrder")
    List<MenuItem> findByPermissionCode(@Param("permissionCode") String permissionCode);
    
    /**
     * 查询需要权限验证的菜单项
     * 
     * @param menuId 菜单ID（非null）
     * @return 需要权限验证的菜单项列表
     */
    @Query("SELECT mi FROM MenuItem mi WHERE mi.menuId = :menuId AND mi.requireAuth = true ORDER BY mi.sortOrder")
    List<MenuItem> findByMenuIdAndRequireAuthTrue(@Param("menuId") Long menuId);
    
    // ==================== 系统管理查询 ====================
    
    /**
     * 查询所有禁用的菜单项
     * 
     * @return 所有禁用的菜单项列表
     */
    List<MenuItem> findByIsEnabledFalseOrderByMenuIdAscSortOrderAsc();
    
    /**
     * 查询创建时间在指定范围内的菜单项
     * 
     * @param startTime 开始时间（非null）
     * @param endTime 结束时间（非null）
     * @return 指定时间范围内的菜单项列表
     */
    @Query("SELECT mi FROM MenuItem mi WHERE mi.createdAt BETWEEN :startTime AND :endTime ORDER BY mi.createdAt DESC")
    List<MenuItem> findByCreatedAtBetween(@Param("startTime") java.time.LocalDateTime startTime, 
                                         @Param("endTime") java.time.LocalDateTime endTime);
}
