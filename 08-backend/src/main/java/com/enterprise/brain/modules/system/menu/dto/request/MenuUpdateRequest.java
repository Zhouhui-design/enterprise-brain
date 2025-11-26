package com.enterprise.brain.modules.system.menu.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.SuperBuilder;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.Serializable;

/**
 * 菜单更新请求DTO
 *
 * @author AI Assistant
 * @since 1.0.0
 */
@Data
@SuperBuilder
@Schema(description = "菜单更新请求")
public class MenuUpdateRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "菜单ID不能为空")
    @Min(value = 1, message = "菜单ID必须大于0")
    @Schema(description = "菜单ID", example = "1", required = true)
    private Long id;

    @Schema(description = "父菜单ID", example = "0")
    private Long parentId;

    @Size(max = 50, message = "菜单名称长度不能超过50个字符")
    @Schema(description = "菜单名称", example = "系统管理")
    private String name;

    @Schema(description = "菜单类型", example = "directory",
            allowableValues = {"directory", "menu", "button"})
    private String type;

    @Schema(description = "排序", example = "1")
    private Integer sort;

    @Schema(description = "路由路径", example = "/system")
    private String path;

    @Schema(description = "组件路径", example = "system/index")
    private String component;

    @Schema(description = "菜单图标", example = "system")
    private String icon;

    @Schema(description = "权限标识", example = "system:manage")
    private String permission;

    @Schema(description = "是否显示", example = "true")
    private Boolean visible;

    @Schema(description = "是否外链", example = "false")
    private Boolean external;

    @Schema(description = "是否缓存", example = "false")
    private Boolean keepAlive;

    @Schema(description = "状态", example = "active", allowableValues = {"active", "inactive"})
    private String status;

    @Size(max = 500, message = "备注长度不能超过500个字符")
    @Schema(description = "备注", example = "系统管理菜单")
    private String remark;
}