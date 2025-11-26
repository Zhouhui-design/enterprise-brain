package com.enterprise.brain.modules.system.menu.repository;

import com.enterprise.brain.modules.system.menu.entity.DynamicMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DynamicMenuRepository extends JpaRepository<DynamicMenu, Long> {
    
    /**
     * 根据父菜单ID查询子菜单
     * 
     * @param parentId 父菜单ID，为null时查询顶级菜单
     * @return 子菜单列表，按排序顺序升序排列
     */
    List<DynamicMenu> findByParentIdOrderBySortOrderAsc(Long parentId);
    
    /**
     * 查询顶级菜单（父菜单ID为null的菜单）
     * 
     * @return 顶级菜单列表，按排序顺序升序排列
     */
    List<DynamicMenu> findByParentIdIsNullOrderBySortOrderAsc();
    
    /**
     * 根据菜单键查询菜单
     * 
     * @param menuKey 菜单唯一标识键（非null）
     * @return 菜单对象，无匹配时返回null
     */
    DynamicMenu findByMenuKey(String menuKey);
    
    /**
     * 根据菜单ID列表查询菜单
     * 
     * @param menuIds 菜单ID集合（非null且非空）
     * @return 菜单列表，无匹配时返回空列表
     */
    List<DynamicMenu> findByIdIn(List<Long> menuIds);
    
    /**
     * 查询启用状态的菜单
     * 
     * @return 启用的菜单列表，按排序顺序升序排列
     */
    List<DynamicMenu> findByIsEnabledTrueOrderBySortOrderAsc();
    
    /**
     * 查询用户可见的菜单（使用连接查询）
     * 
     * @param userId 用户ID（非null）
     * @return 可见的菜单列表
     */
    @Query("SELECT m FROM DynamicMenu m " +
           "LEFT JOIN UserMenuConfig umc ON m.id = umc.menu.id " +
           "WHERE (m.isShow = true AND m.isEnabled = true) " +
           "AND ((umc.userId = :userId AND umc.isVisible = true) OR umc.userId IS NULL)")
    List<DynamicMenu> findVisibleMenusByUserId(@Param("userId") Long userId);
}
