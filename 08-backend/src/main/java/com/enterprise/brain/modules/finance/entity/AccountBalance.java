package com.enterprise.brain.modules.finance.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 账户余额实体类
 * 
 * @author Enterprise Brain
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("finance_account_balance")
@Schema(description = "账户余额实体类")
public class AccountBalance {

    @Schema(description = "主键ID")
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @Schema(description = "账户代码")
    @TableField("account_code")
    private String accountCode;

    @Schema(description = "账户名称")
    @TableField("account_name")
    private String accountName;

    @Schema(description = "期初余额")
    @TableField("opening_balance")
    private BigDecimal openingBalance;

    @Schema(description = "借方累计")
    @TableField("debit_total")
    private BigDecimal debitTotal;

    @Schema(description = "贷方累计")
    @TableField("credit_total")
    private BigDecimal creditTotal;

    @Schema(description = "期末余额")
    @TableField("closing_balance")
    private BigDecimal closingBalance;

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