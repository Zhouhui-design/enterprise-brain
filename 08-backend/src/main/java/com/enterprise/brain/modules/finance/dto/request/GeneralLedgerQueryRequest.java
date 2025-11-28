package com.enterprise.brain.modules.finance.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 总账查询请求DTO
 * 
 * @author Enterprise Brain
 */
@Data
@Schema(description = "总账查询请求DTO")
public class GeneralLedgerQueryRequest {

    @Schema(description = "凭证编号")
    private String voucherNumber;

    @Schema(description = "会计科目代码")
    private String accountCode;

    @Schema(description = "会计科目名称")
    private String accountName;

    @Schema(description = "凭证类型")
    private String voucherType;

    @Schema(description = "会计期间")
    private String accountingPeriod;
}