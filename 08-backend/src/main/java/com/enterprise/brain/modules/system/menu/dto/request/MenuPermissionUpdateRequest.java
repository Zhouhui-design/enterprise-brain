package com.enterprise.brain.modules.system.menu.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.SuperBuilder;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.List;
import java.util.Set;

/**
 * 菜单权限更新请求DTO
 *
 * @author AI Assistant
 * @since 1.0.0
 */
@Data
@SuperBuilder
@Schema(description = "菜单权限更新请求")
public class MenuPermissionUpdateRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "角色ID不能为空")
    @Schema(description = "角色ID", example = "1", required = true)
    private Long roleId;

    @NotEmpty(message = "菜单权限列表不能为空")
    @Schema(description = "菜单权限列表", required = true)
    private Set<Long> menuIds;
}