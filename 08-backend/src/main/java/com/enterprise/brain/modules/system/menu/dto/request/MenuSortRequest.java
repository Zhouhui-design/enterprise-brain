package com.enterprise.brain.modules.system.menu.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class MenuSortRequest {
    private Long parentId;
    private List<MenuSortItem> menuItems;
}

@Data
class MenuSortItem {
    private Long menuId;
    private Integer sortOrder;
}