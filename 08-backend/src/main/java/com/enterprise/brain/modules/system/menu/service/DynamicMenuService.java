package com.enterprise.brain.modules.system.menu.service;

import com.enterprise.brain.common.response.ApiResponse;
import com.enterprise.brain.modules.system.menu.dto.MenuCreateRequest;
import com.enterprise.brain.modules.system.menu.dto.MenuTreeQuery;
import com.enterprise.brain.modules.system.menu.dto.MenuTreeResponse;
import com.enterprise.brain.modules.system.menu.dto.MenuVisibilityRequest;
import com.enterprise.brain.modules.system.menu.response.BatchOperationResult;
import com.enterprise.brain.modules.system.menu.response.UserMenuConfigResponse;

import java.util.List;

public interface DynamicMenuService {
    // 菜单查询
    ApiResponse<MenuTreeResponse> getMenuById(Long menuId);
    ApiResponse<List<MenuTreeResponse>> getFullMenuTree(); // 无参重载
    ApiResponse<List<MenuTreeResponse>> getFullMenuTree(MenuTreeQuery query); // 带参方法

    // 菜单创建/更新/删除
    ApiResponse<MenuTreeResponse> createMenu(MenuCreateRequest request);
    ApiResponse<MenuTreeResponse> updateMenu(Long menuId, MenuCreateRequest request); // 统一参数类型
    ApiResponse<Void> deleteMenu(Long menuId);
    ApiResponse<BatchOperationResult> batchDeleteMenus(List<Long> menuIds, Boolean cascade);

    // 用户菜单配置
    ApiResponse<UserMenuConfigResponse> getUserMenuConfig(Long userId);
    ApiResponse<Void> batchUpdateUserMenuVisibility(Long userId, List<MenuVisibilityRequest> requests);

    // 菜单排序
    ApiResponse<Void> autoSortMenus(Long parentId);
}
