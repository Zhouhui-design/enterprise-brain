package com.enterprise.brain.modules.finance.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 总账创建请求DTO
 * 
 * @author Enterprise Brain
 */
@Data
@Schema(description = "总账创建请求DTO")
public class GeneralLedgerCreateRequest {

    @Schema(description = "凭证编号", required = true)
    @NotBlank(message = "凭证编号不能为空")
    private String voucherNumber;

    @Schema(description = "会计科目代码", required = true)
    @NotBlank(message = "会计科目代码不能为空")
    private String accountCode;

    @Schema(description = "会计科目名称", required = true)
    @NotBlank(message = "会计科目名称不能为空")
    private String accountName;

    @Schema(description = "借方金额")
    private BigDecimal debitAmount;

    @Schema(description = "贷方金额")
    private BigDecimal creditAmount;

    @Schema(description = "余额")
    private BigDecimal balance;

    @Schema(description = "摘要")
    private String summary;

    @Schema(description = "业务日期", required = true)
    @NotNull(message = "业务日期不能为空")
    private LocalDateTime businessDate;

    @Schema(description = "凭证类型")
    private String voucherType;

    @Schema(description = "会计期间")
    private String accountingPeriod;
}