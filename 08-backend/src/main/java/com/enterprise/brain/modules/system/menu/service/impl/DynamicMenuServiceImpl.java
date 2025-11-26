package com.enterprise.brain.modules.system.menu.service.impl;

import com.enterprise.brain.common.exception.BusinessException;
import com.enterprise.brain.common.response.ApiResponse;
import com.enterprise.brain.common.response.ErrorCode;
import com.enterprise.brain.modules.system.menu.dto.MenuCreateRequest;
import com.enterprise.brain.modules.system.menu.dto.MenuTreeQuery;
import com.enterprise.brain.modules.system.menu.dto.MenuVisibilityRequest;
import com.enterprise.brain.modules.system.menu.entity.DynamicMenu;
import com.enterprise.brain.modules.system.menu.entity.MenuItem;
import com.enterprise.brain.modules.system.menu.entity.UserMenuConfig;
import com.enterprise.brain.modules.system.menu.repository.DynamicMenuRepository;
import com.enterprise.brain.modules.system.menu.repository.MenuItemRepository;
import com.enterprise.brain.modules.system.menu.repository.UserMenuConfigRepository;
import com.enterprise.brain.modules.system.menu.response.BatchOperationResult;
import com.enterprise.brain.modules.system.menu.response.MenuTreeResponse;
import com.enterprise.brain.modules.system.menu.response.UserMenuConfigResponse;
import com.enterprise.brain.modules.system.menu.service.DynamicMenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DynamicMenuServiceImpl implements DynamicMenuService {

    private final DynamicMenuRepository dynamicMenuRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserMenuConfigRepository userMenuConfigRepository;

    // ==================== 菜单查询 ====================
    @Override
    public ApiResponse<MenuTreeResponse> getMenuById(Long menuId) {
        // 参数校验
        Assert.notNull(menuId, "菜单ID不能为空");

        // 查询菜单
        DynamicMenu menu = dynamicMenuRepository.findById(menuId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MENU_NOT_FOUND));

        // 转换为树形响应
        return ApiResponse.success(buildMenuTree(menu));
    }

    @Override
    public ApiResponse<List<MenuTreeResponse>> getFullMenuTree() {
        // 无参调用带参方法，默认查询所有启用菜单
        return getFullMenuTree(new MenuTreeQuery());
    }

    @Override
    public ApiResponse<List<MenuTreeResponse>> getFullMenuTree(MenuTreeQuery query) {
        // 校验查询参数
        query = query == null ? new MenuTreeQuery() : query;

        // 查询顶级菜单（父菜单为null）
        List<DynamicMenu> rootMenus = dynamicMenuRepository.findByParentIdIsNullOrderBySortOrderAsc();
        if (CollectionUtils.isEmpty(rootMenus)) {
            return ApiResponse.success(new ArrayList<>());
        }

        // 构建树形结构
        List<MenuTreeResponse> treeResponses = rootMenus.stream()
                .map(this::buildMenuTree)
                .collect(Collectors.toList());

        return ApiResponse.success(treeResponses);
    }

    // ==================== 菜单创建/更新 ====================
    @Override
    @Transactional(rollbackFor = Exception.class)
    public ApiResponse<MenuTreeResponse> createMenu(MenuCreateRequest request) {
        // 参数校验
        validateMenuRequest(request);

        // 检查父菜单是否存在
        Long parentId = request.getParentId();
        if (parentId != null) {
            dynamicMenuRepository.findById(parentId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.MENU_PARENT_INVALID));
        }

        // 检查菜单名称是否重复（同一父菜单下）
        checkMenuNameDuplicate(request.getName(), parentId, null);

        // 保存菜单基础信息
        DynamicMenu menu = convertToMenuEntity(request);
        menu.setCreateTime(LocalDateTime.now());
        menu.setUpdateTime(LocalDateTime.now());
        menu.setIsEnabled(true); // 默认启用
        DynamicMenu savedMenu = dynamicMenuRepository.save(menu);

        // 保存菜单项（提取公共方法）
        saveMenuItems(savedMenu, request.getMenuItems());

        // 返回树形结果
        return ApiResponse.success(buildMenuTree(savedMenu));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ApiResponse<MenuTreeResponse> updateMenu(Long menuId, MenuCreateRequest request) {
        // 参数校验
        Assert.notNull(menuId, "菜单ID不能为空");
        validateMenuRequest(request);

        // 查询原有菜单
        DynamicMenu existingMenu = dynamicMenuRepository.findById(menuId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MENU_NOT_FOUND));

        // 检查父菜单是否存在（排除自身）
        Long parentId = request.getParentId();
        if (parentId != null && !parentId.equals(existingMenu.getParentId())) {
            dynamicMenuRepository.findById(parentId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.MENU_PARENT_INVALID));
            // 禁止设置自身为父菜单
            if (parentId.equals(menuId)) {
                throw new BusinessException(ErrorCode.MENU_PARENT_INVALID, "不能将自身设置为父菜单");
            }
        }

        // 检查菜单名称是否重复（排除当前菜单）
        checkMenuNameDuplicate(request.getName(), parentId, menuId);

        // 更新菜单基础信息
        updateMenuEntity(existingMenu, request);
        existingMenu.setUpdateTime(LocalDateTime.now());
        DynamicMenu updatedMenu = dynamicMenuRepository.save(existingMenu);

        // 先删除原有菜单项，再保存新的（避免重复）
        menuItemRepository.deleteAllByMenuId(menuId);
        saveMenuItems(updatedMenu, request.getMenuItems());

        // 返回树形结果
        return ApiResponse.success(buildMenuTree(updatedMenu));
    }

    // ==================== 菜单删除 ====================
    @Override
    @Transactional(rollbackFor = Exception.class)
    public ApiResponse<Void> deleteMenu(Long menuId) {
        // 参数校验
        Assert.notNull(menuId, "菜单ID不能为空");

        // 查询菜单
        DynamicMenu menu = dynamicMenuRepository.findById(menuId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MENU_NOT_FOUND));

        // 检查是否有子菜单
        List<DynamicMenu> children = dynamicMenuRepository.findByParentIdOrderBySortOrderAsc(menuId);
        if (!CollectionUtils.isEmpty(children)) {
            throw new BusinessException(ErrorCode.MENU_DELETE_FAILED, "存在子菜单，无法删除");
        }

        // 级联删除：菜单项 + 用户菜单配置
        menuItemRepository.deleteAllByMenuId(menuId);
        userMenuConfigRepository.deleteAllByMenuId(menuId);

        // 删除菜单
        dynamicMenuRepository.delete(menu);

        return ApiResponse.success();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ApiResponse<BatchOperationResult> batchDeleteMenus(List<Long> menuIds, Boolean cascade) {
        // 参数校验
        if (CollectionUtils.isEmpty(menuIds)) {
            throw new BusinessException(ErrorCode.PARAMETER_VALIDATION_FAILED, "菜单ID列表不能为空");
        }
        cascade = cascade == null ? false : cascade;

        BatchOperationResult result = new BatchOperationResult();
        int successCount = 0;
        List<String> failReasons = new ArrayList<>();

        for (Long menuId : menuIds) {
            try {
                // 若不级联，检查子菜单；若级联，直接删除（包含子菜单）
                if (!cascade) {
                    List<DynamicMenu> children = dynamicMenuRepository.findByParentIdOrderBySortOrderAsc(menuId);
                    if (!CollectionUtils.isEmpty(children)) {
                        failReasons.add("菜单ID=" + menuId + "：存在子菜单，未删除");
                        continue;
                    }
                }

                // 执行删除（复用单个删除逻辑）
                deleteMenu(menuId);
                successCount++;
            } catch (BusinessException e) {
                failReasons.add("菜单ID=" + menuId + "：" + e.getErrorMessage());
            } catch (Exception e) {
                failReasons.add("菜单ID=" + menuId + "：未知错误");
            }
        }

        // 组装结果
        result.setTotalCount(menuIds.size());
        result.setSuccessCount(successCount);
        result.setFailCount(menuIds.size() - successCount);
        result.setFailReasons(failReasons);

        return ApiResponse.success(result);
    }

    // ==================== 用户菜单配置 ====================
    @Override
    public ApiResponse<UserMenuConfigResponse> getUserMenuConfig(Long userId) {
        // 参数校验
        Assert.notNull(userId, "用户ID不能为空");

        // 查询用户菜单配置
        List<UserMenuConfig> configs = userMenuConfigRepository.findByUserIdOrderByUserSortOrderAsc(userId);
        if (CollectionUtils.isEmpty(configs)) {
            return ApiResponse.success(new UserMenuConfigResponse());
        }

        // 转换为响应对象（此处根据实际DTO结构调整，示例）
        UserMenuConfigResponse response = new UserMenuConfigResponse();
        response.setUserId(userId);
        response.setMenuConfigs(configs.stream()
                .map(config -> {
                    // 转换逻辑，如：
                    UserMenuConfigResponse.MenuConfigDTO dto = new UserMenuConfigResponse.MenuConfigDTO();
                    dto.setMenuId(config.getMenuId());
                    dto.setIsVisible(config.getIsVisible());
                    dto.setUserSortOrder(config.getUserSortOrder());
                    return dto;
                })
                .collect(Collectors.toList()));

        return ApiResponse.success(response);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ApiResponse<Void> batchUpdateUserMenuVisibility(Long userId, List<MenuVisibilityRequest> requests) {
        // 参数校验
        Assert.notNull(userId, "用户ID不能为空");
        if (CollectionUtils.isEmpty(requests)) {
            throw new BusinessException(ErrorCode.PARAMETER_VALIDATION_FAILED, "菜单可见性配置列表不能为空");
        }

        List<UserMenuConfig> configs = new ArrayList<>();
        for (MenuVisibilityRequest request : requests) {
            // 校验请求参数
            Assert.notNull(request.getMenuId(), "菜单ID不能为空");
            Assert.notNull(request.getIsVisible(), "可见性状态不能为空");

            // 检查菜单是否存在
            dynamicMenuRepository.findById(request.getMenuId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.MENU_NOT_FOUND, "菜单ID=" + request.getMenuId()));

            // 查询或创建配置
            UserMenuConfig config = userMenuConfigRepository.findByUserIdAndMenuId(userId, request.getMenuId())
                    .orElse(new UserMenuConfig());

            // 更新配置
            config.setUserId(userId);
            config.setMenuId(request.getMenuId());
            config.setIsVisible(request.getIsVisible());
            config.setUserSortOrder(request.getUserSortOrder() != null ? request.getUserSortOrder() : 0);
            config.setUpdateTime(LocalDateTime.now());

            configs.add(config);
        }

        // 批量保存（优化性能，避免循环调用save）
        userMenuConfigRepository.saveAll(configs);

        return ApiResponse.success();
    }

    // ==================== 菜单排序 ====================
    @Override
    @Transactional(rollbackFor = Exception.class)
    public ApiResponse<Void> autoSortMenus(Long parentId) {
        // 查询指定父菜单下的所有子菜单
        List<DynamicMenu> menus = dynamicMenuRepository.findByParentIdOrderBySortOrderAsc(parentId);
        if (CollectionUtils.isEmpty(menus)) {
            return ApiResponse.success();
        }

        // 自动排序（按名称拼音/创建时间，此处示例按创建时间升序）
        List<DynamicMenu> sortedMenus = menus.stream()
                .sorted((m1, m2) -> {
                    if (m1.getCreateTime() == null) return 1;
                    if (m2.getCreateTime() == null) return -1;
                    return m1.getCreateTime().compareTo(m2.getCreateTime());
                })
                .collect(Collectors.toList());

        // 更新排序号（从1开始递增）
        for (int i = 0; i < sortedMenus.size(); i++) {
            DynamicMenu menu = sortedMenus.get(i);
            menu.setSortOrder(i + 1);
            menu.setUpdateTime(LocalDateTime.now());
        }

        // 批量保存
        dynamicMenuRepository.saveAll(sortedMenus);

        return ApiResponse.success();
    }

    // ==================== 私有辅助方法 ====================
    /**
     * 构建菜单树形响应（递归）
     */
    private MenuTreeResponse buildMenuTree(DynamicMenu menu) {
        // 转换菜单基础信息
        MenuTreeResponse response = new MenuTreeResponse();
        response.setId(menu.getId());
        response.setName(menu.getName());
        response.setPath(menu.getPath());
        response.setComponent(menu.getComponent());
        response.setIcon(menu.getIcon());
        response.setSortOrder(menu.getSortOrder());
        response.setParentId(menu.getParentId());
        response.setIsEnabled(menu.getIsEnabled());

        // 查询子菜单并递归构建
        List<DynamicMenu> children = dynamicMenuRepository.findByParentIdOrderBySortOrderAsc(menu.getId());
        if (!CollectionUtils.isEmpty(children)) {
            response.setChildren(children.stream()
                    .map(this::buildMenuTree)
                    .collect(Collectors.toList()));
        }

        // 查询菜单项
        List<MenuItem> items = menuItemRepository.findByMenuIdOrderBySortOrderAsc(menu.getId());
        if (!CollectionUtils.isEmpty(items)) {
            response.setMenuItems(items.stream()
                    .map(item -> {
                        // 转换菜单项响应（示例）
                        MenuTreeResponse.MenuItemDTO dto = new MenuTreeResponse.MenuItemDTO();
                        dto.setId(item.getId());
                        dto.setName(item.getName());
                        dto.setItemKey(item.getItemKey());
                        dto.setSortOrder(item.getSortOrder());
                        dto.setIsEnabled(item.getIsEnabled());
                        return dto;
                    })
                    .collect(Collectors.toList()));
        }

        return response;
    }

    /**
     * 校验菜单创建/更新请求参数
     */
    private void validateMenuRequest(MenuCreateRequest request) {
        Assert.notNull(request, "菜单请求参数不能为空");
        Assert.hasText(request.getName(), "菜单名称不能为空");
        Assert.hasText(request.getPath(), "菜单路径不能为空");
        Assert.notNull(request.getSortOrder(), "排序号不能为空");
    }

    /**
     * 检查菜单名称是否重复（同一父菜单下）
     * @param name 菜单名称
     * @param parentId 父菜单ID
     * @param excludeId 排除的菜单ID（更新时使用）
     */
    private void checkMenuNameDuplicate(String name, Long parentId, Long excludeId) {
        // 构造查询条件（根据实际Repository方法调整，示例）
        List<DynamicMenu> existingMenus = dynamicMenuRepository.findByNameAndParentId(name, parentId);
        if (!CollectionUtils.isEmpty(existingMenus)) {
            // 若更新，排除自身
            if (excludeId != null) {
                existingMenus = existingMenus.stream()
                        .filter(menu -> !menu.getId().equals(excludeId))
                        .collect(Collectors.toList());
            }
            if (!CollectionUtils.isEmpty(existingMenus)) {
                throw new BusinessException(ErrorCode.MENU_NAME_DUPLICATE);
            }
        }
    }

    /**
     * 转换MenuCreateRequest为DynamicMenu实体
     */
    private DynamicMenu convertToMenuEntity(MenuCreateRequest request) {
        DynamicMenu menu = new DynamicMenu();
        menu.setName(request.getName());
        menu.setPath(request.getPath());
        menu.setComponent(request.getComponent());
        menu.setIcon(request.getIcon());
        menu.setSortOrder(request.getSortOrder());
        menu.setParentId(request.getParentId());
        menu.setRemark(request.getRemark());
        return menu;
    }

    /**
     * 更新DynamicMenu实体（从MenuCreateRequest）
     */
    private void updateMenuEntity(DynamicMenu existingMenu, MenuCreateRequest request) {
        existingMenu.setName(request.getName());
        existingMenu.setPath(request.getPath());
        existingMenu.setComponent(request.getComponent());
        existingMenu.setIcon(request.getIcon());
        existingMenu.setSortOrder(request.getSortOrder());
        existingMenu.setParentId(request.getParentId());
        existingMenu.setRemark(request.getRemark());
        existingMenu.setIsEnabled(request.getIsEnabled() != null ? request.getIsEnabled() : existingMenu.getIsEnabled());
    }

    /**
     * 保存菜单项（提取公共方法，避免代码重复）
     */
    private void saveMenuItems(DynamicMenu menu, List<MenuCreateRequest.MenuItemRequest> itemRequests) {
        if (CollectionUtils.isEmpty(itemRequests)) {
            return;
        }

        List<MenuItem> items = itemRequests.stream()
                .map(request -> {
                    // 校验菜单项参数
                    Assert.hasText(request.getName(), "菜单项名称不能为空");
                    Assert.hasText(request.getItemKey(), "菜单项键不能为空");

                    MenuItem item = new MenuItem();
                    item.setMenuId(menu.getId());
                    item.setName(request.getName());
                    item.setItemKey(request.getItemKey());
                    item.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
                    item.setIsEnabled(request.getIsEnabled() != null ? request.getIsEnabled() : true);
                    item.setPermissionCode(request.getPermissionCode());
                    item.setCreateTime(LocalDateTime.now());
                    item.setUpdateTime(LocalDateTime.now());
                    return item;
                })
                .collect(Collectors.toList());

        // 批量保存
        menuItemRepository.saveAll(items);
    }
}
