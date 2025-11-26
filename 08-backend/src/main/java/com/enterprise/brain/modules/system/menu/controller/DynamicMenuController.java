package com.enterprise.brain.modules.system.menu.controller;

import com.enterprise.brain.modules.system.menu.dto.request.*;
import com.enterprise.brain.modules.system.menu.dto.response.*;
import com.enterprise.brain.modules.system.menu.service.DynamicMenuService;
import com.enterprise.brain.modules.system.annotation.AuditLogAnnotation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/system/menu")
public class DynamicMenuController {
    
    @Autowired
    private DynamicMenuService dynamicMenuService;
    
    // 菜单CRUD接口 - 需要管理员权限
    @AuditLogAnnotation(operation = "创建菜单")
    @PreAuthorize("hasAuthority('SYSTEM:MENU:CREATE')")
    @PostMapping("/create")
    public Long createMenu(@RequestBody MenuCreateRequest request) {
        return dynamicMenuService.createMenu(request);
    }
    
    @AuditLogAnnotation(operation = "更新菜单")
    @PreAuthorize("hasAuthority('SYSTEM:MENU:UPDATE')")
    @PutMapping("/{menuId}")
    public void updateMenu(@PathVariable Long menuId, @RequestBody MenuCreateRequest request) {
        dynamicMenuService.updateMenu(menuId, request);
    }
    
    @AuditLogAnnotation(operation = "删除菜单")
    @PreAuthorize("hasAuthority('SYSTEM:MENU:DELETE')")
    @DeleteMapping("/{menuId}")
    public void deleteMenu(@PathVariable Long menuId) {
        dynamicMenuService.deleteMenu(menuId);
    }
    
    // 查询单个菜单 - 需要查看权限
    @PreAuthorize("hasAuthority('SYSTEM:MENU:VIEW')")
    @GetMapping("/{menuId}")
    public MenuTreeResponse getMenuById(@PathVariable Long menuId) {
        return dynamicMenuService.getMenuById(menuId);
    }
    
    // 菜单树接口 - 不同的权限级别
    @PreAuthorize("hasAuthority('SYSTEM:MENU:VIEW')")
    @GetMapping("/tree/full")
    public List<MenuTreeResponse> getFullMenuTree() {
        return dynamicMenuService.getFullMenuTree();
    }
    
    // 获取用户菜单树 - 登录用户即可访问
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/tree/user")
    public List<MenuTreeResponse> getUserMenuTree() {
        // 从Security上下文获取当前用户ID
        Long currentUserId = getCurrentUserId(); // 假设有这样的工具方法
        return dynamicMenuService.getUserMenuTree(currentUserId);
    }
    
    // 菜单排序接口 - 需要排序权限
    @AuditLogAnnotation(operation = "排序菜单")
    @PreAuthorize("hasAuthority('SYSTEM:MENU:SORT')")
    @PostMapping("/sort")
    public void sortMenus(@RequestBody MenuSortRequest request) {
        dynamicMenuService.sortMenus(request);
    }
    
    // 用户菜单配置接口 - 用户配置自己的菜单
    @AuditLogAnnotation(operation = "更新菜单可见性")
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/visibility/update")
    public void updateMenuVisibility(@RequestBody MenuVisibilityRequest request) {
        // 验证用户只能修改自己的菜单配置
        Long currentUserId = getCurrentUserId();
        if (!currentUserId.equals(request.getUserId())) {
            throw new SecurityException("Cannot modify other user's menu configuration");
        }
        dynamicMenuService.updateMenuVisibility(request);
    }
    
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/user/config")
    public UserMenuResponse getUserMenuConfig() {
        Long currentUserId = getCurrentUserId();
        return dynamicMenuService.getUserMenuConfig(currentUserId);
    }
    
    @AuditLogAnnotation(operation = "批量更新菜单可见性")
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/visibility/batch-update")
    public void batchUpdateUserMenuVisibility(@RequestBody List<MenuVisibilityRequest> requests) {
        Long currentUserId = getCurrentUserId();
        dynamicMenuService.batchUpdateUserMenuVisibility(currentUserId, requests);
    }
    
    // 辅助方法：获取当前用户ID
    private Long getCurrentUserId() {
        // 这里需要根据实际的安全框架实现获取当前用户ID的逻辑
        // 例如Spring Security可以通过SecurityContext获取
        return 1L; // 临时返回默认值
    }
}