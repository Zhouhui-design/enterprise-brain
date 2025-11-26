package com.enterprise.brain.modules.system.menu.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.SuperBuilder;

import java.io.Serializable;
import java.util.List;

/**
 * 菜单批量排序响应DTO
 *
 * @author AI Assistant
 * @since 1.0.0
 */
@Data
@SuperBuilder
@Schema(description = "菜单批量排序响应")
public class MenuBatchSortResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "总数量", example = "5")
    private Integer totalCount;

    @Schema(description = "成功数量", example = "4")
    private Integer successCount;

    @Schema(description = "失败数量", example = "1")
    private Integer failureCount;

    @Schema(description = "排序结果列表")
    private List<SortResult> results;

    /**
     * 排序结果
     */
    @Data
    @SuperBuilder
    @Schema(description = "排序结果")
    public static class SortResult implements Serializable {

        private static final long serialVersionUID = 1L;

        @Schema(description = "菜单ID", example = "1")
        private Long menuId;

        @Schema(description = "是否成功", example = "true")
        private Boolean success;

        @Schema(description = "错误信息", example = "排序失败")
        private String errorMessage;
    }
}