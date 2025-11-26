package com.enterprise.brain.modules.system.menu.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class MenuCreateRequest {
    private String menuName;
    private String menuKey;
    private String menuIcon;
    private String menuPath;
    private String componentPath;
    private Integer menuLevel;
    private Integer sortOrder;
    private Boolean isEnabled;
    private Boolean isShow;
    private String permissionCode;
    private Long parentId;
    private List<MenuItemRequest> menuItems;
}

@Data
class MenuItemRequest {
    private String itemName;
    private String itemKey;
    private String itemIcon;
    private String itemType;
    private String actionUrl;
    private String permissionCode;
    private Integer sortOrder;
}