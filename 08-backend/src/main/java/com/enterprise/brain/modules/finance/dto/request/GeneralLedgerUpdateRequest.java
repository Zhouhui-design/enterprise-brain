package com.enterprise.brain.modules.finance.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 总账更新请求DTO
 * 
 * @author Enterprise Brain
 */
@Data
@Schema(description = "总账更新请求DTO")
public class GeneralLedgerUpdateRequest {

    @Schema(description = "主键ID", required = true)
    @NotNull(message = "ID不能为空")
    private Long id;

    @Schema(description = "凭证编号")
    private String voucherNumber;

    @Schema(description = "会计科目代码")
    private String accountCode;

    @Schema(description = "会计科目名称")
    private String accountName;

    @Schema(description = "借方金额")
    private BigDecimal debitAmount;

    @Schema(description = "贷方金额")
    private BigDecimal creditAmount;

    @Schema(description = "余额")
    private BigDecimal balance;

    @Schema(description = "摘要")
    private String summary;

    @Schema(description = "业务日期")
    private LocalDateTime businessDate;

    @Schema(description = "凭证类型")
    private String voucherType;

    @Schema(description = "会计期间")
    private String accountingPeriod;
}