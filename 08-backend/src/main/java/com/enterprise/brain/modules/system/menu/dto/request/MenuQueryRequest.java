package com.enterprise.brain.modules.system.menu.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.SuperBuilder;

import java.io.Serializable;

/**
 * 菜单查询请求DTO
 *
 * @author AI Assistant
 * @since 1.0.0
 */
@Data
@SuperBuilder
@Schema(description = "菜单查询请求")
public class MenuQueryRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "菜单名称", example = "系统管理")
    private String name;

    @Schema(description = "菜单类型", example = "directory",
            allowableValues = {"directory", "menu", "button"})
    private String type;

    @Schema(description = "状态", example = "active", allowableValues = {"active", "inactive"})
    private String status;

    @Schema(description = "是否显示", example = "true")
    private Boolean visible;

    @Schema(description = "父菜单ID", example = "0")
    private Long parentId;

    @Schema(description = "权限标识", example = "system:manage")
    private String permission;

    @Schema(description = "是否包含子菜单", example = "true")
    private Boolean includeChildren = true;

    @Schema(description = "菜单类型过滤", example = "[\"directory\", \"menu\"]")
    private String[] includeTypes;
}