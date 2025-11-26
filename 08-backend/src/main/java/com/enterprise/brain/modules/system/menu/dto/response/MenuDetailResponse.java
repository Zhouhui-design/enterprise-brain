package com.enterprise.brain.modules.system.menu.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.io.Serializable;

/**
 * 菜单详情响应DTO
 *
 * @author AI Assistant
 * @since 1.0.0
 */
@Data
@SuperBuilder
@Schema(description = "菜单详情响应")
public class MenuDetailResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "菜单ID", example = "1")
    private Long id;

    @Schema(description = "父菜单ID", example = "0")
    private Long parentId;

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

    @Schema(description = "状态", example = "active")
    private String status;

    @Schema(description = "备注", example = "系统管理菜单")
    private String remark;

    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @Schema(description = "更新时间")
    private LocalDateTime updateTime;

    @Schema(description = "创建人")
    private String creator;

    @Schema(description = "更新人")
    private String updater;
}