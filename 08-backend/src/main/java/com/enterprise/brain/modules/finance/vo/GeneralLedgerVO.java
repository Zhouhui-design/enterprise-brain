package com.enterprise.brain.modules.finance.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 总账VO
 * 
 * @author Enterprise Brain
 */
@Data
@Schema(description = "总账VO")
public class GeneralLedgerVO {

    @Schema(description = "主键ID")
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

    @Schema(description = "记账日期")
    private LocalDateTime postingDate;

    @Schema(description = "凭证类型")
    private String voucherType;

    @Schema(description = "会计期间")
    private String accountingPeriod;

    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
}