package com.enterprise.brain.modules.system.menu.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class MenuTreeResponse {
    private Long id;
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
    private List<MenuTreeResponse> children;
    private List<MenuItemResponse> menuItems;
}

@Data
class MenuItemResponse {
    private Long id;
    private String itemName;
    private String itemKey;
    private String itemIcon;
    private String itemType;
    private String actionUrl;
    private String permissionCode;
    private Integer sortOrder;
}