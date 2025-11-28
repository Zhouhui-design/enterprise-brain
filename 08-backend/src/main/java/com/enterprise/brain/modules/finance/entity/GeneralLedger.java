package com.enterprise.brain.modules.finance.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 总账实体类
 * 
 * @author Enterprise Brain
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("finance_general_ledger")
@Schema(description = "总账实体类")
public class GeneralLedger {

    @Schema(description = "主键ID")
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @Schema(description = "凭证编号")
    @TableField("voucher_number")
    private String voucherNumber;

    @Schema(description = "会计科目代码")
    @TableField("account_code")
    private String accountCode;

    @Schema(description = "会计科目名称")
    @TableField("account_name")
    private String accountName;

    @Schema(description = "借方金额")
    @TableField("debit_amount")
    private BigDecimal debitAmount;

    @Schema(description = "贷方金额")
    @TableField("credit_amount")
    private BigDecimal creditAmount;

    @Schema(description = "余额")
    @TableField("balance")
    private BigDecimal balance;

    @Schema(description = "摘要")
    @TableField("summary")
    private String summary;

    @Schema(description = "业务日期")
    @TableField("business_date")
    private LocalDateTime businessDate;

    @Schema(description = "记账日期")
    @TableField("posting_date")
    private LocalDateTime postingDate;

    @Schema(description = "凭证类型")
    @TableField("voucher_type")
    private String voucherType;

    @Schema(description = "会计期间")
    @TableField("accounting_period")
    private String accountingPeriod;

    @Schema(description = "创建时间")
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @Schema(description = "更新时间")
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @Schema(description = "删除标识(0:未删除, 1:已删除)")
    @TableField("deleted")
    @TableLogic
    private Integer deleted;
}