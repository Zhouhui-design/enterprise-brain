package com.enterprise.brain.modules.system.menu.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class UserMenuResponse {
    private Long userId;
    private String userName;
    private List<UserMenuConfigItem> menuConfigs;
}

@Data
class UserMenuConfigItem {
    private Long menuId;
    private String menuName;
    private Boolean isVisible;
    private Integer userSortOrder;
}