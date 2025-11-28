package com.enterprise.brain.modules.finance.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 凭证查询请求DTO
 * 
 * @author Enterprise Brain
 */
@Data
@Schema(description = "凭证查询请求DTO")
public class VoucherQueryRequest {

    @Schema(description = "凭证编号")
    private String voucherNumber;

    @Schema(description = "凭证类型")
    private String voucherType;

    @Schema(description = "开始日期")
    private LocalDateTime startDate;

    @Schema(description = "结束日期")
    private LocalDateTime endDate;

    @Schema(description = "会计期间")
    private String accountingPeriod;
}