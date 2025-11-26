package com.enterprise.brain.modules.system.menu.dto.request;

import lombok.Data;

@Data
public class MenuVisibilityRequest {
    private Long userId;
    private Long menuId;
    private Boolean isVisible;
    private Integer userSortOrder;
}