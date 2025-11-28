package com.enterprise.brain.modules.finance.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * 报表查询请求DTO
 * 
 * @author Enterprise Brain
 */
@Data
@Schema(description = "报表查询请求DTO")
public class ReportQueryRequest {

    @Schema(description = "报表类型", required = true)
    @NotNull(message = "报表类型不能为空")
    private String reportType;

    @Schema(description = "开始日期")
    private LocalDateTime startDate;

    @Schema(description = "结束日期")
    private LocalDateTime endDate;

    @Schema(description = "会计期间")
    private String accountingPeriod;

    @Schema(description = "部门ID")
    private Long departmentId;

    @Schema(description = "科目代码")
    private String accountCode;
}