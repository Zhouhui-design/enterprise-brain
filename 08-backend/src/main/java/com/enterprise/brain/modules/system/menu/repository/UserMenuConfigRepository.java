package com.enterprise.brain.modules.system.menu.repository;

import com.enterprise.brain.modules.system.menu.entity.UserMenuConfig;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface UserMenuConfigRepository extends JpaRepository<UserMenuConfig, Long> {
    
    /**
     * 根据用户ID查询菜单配置，按用户排序顺序升序排列
     * 
     * @param userId 用户ID（非null）
     * @return 菜单配置列表，无结果时返回空列表
     */
    List<UserMenuConfig> findByUserIdOrderByUserSortOrderAsc(Long userId);
    
    /**
     * 根据用户ID和菜单ID查询配置
     * 
     * @param userId 用户ID（非null）
     * @param menuId 菜单ID（非null）
     * @return 菜单配置Optional对象
     */
    Optional<UserMenuConfig> findByUserIdAndMenuId(Long userId, Long menuId);
    
    /**
     * 查询用户可见的菜单配置，按用户排序顺序升序排列
     * 
     * @param userId 用户ID（非null）
     * @return 可见的菜单配置列表，无结果时返回空列表
     */
    List<UserMenuConfig> findByUserIdAndIsVisibleTrueOrderByUserSortOrderAsc(Long userId);
    
    /**
     * 根据菜单ID删除所有用户配置
     * 
     * @param menuId 菜单ID（非null）
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM UserMenuConfig umc WHERE umc.menuId = :menuId")
    void deleteAllByMenuId(@Param("menuId") Long menuId);
    
    /**
     * 根据用户ID删除所有配置
     * 
     * @param userId 用户ID（非null）
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM UserMenuConfig umc WHERE umc.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
