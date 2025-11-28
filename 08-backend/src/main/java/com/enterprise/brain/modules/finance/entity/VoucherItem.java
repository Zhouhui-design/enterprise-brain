package com.enterprise.brain.modules.finance.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 凭证明细实体类
 * 
 * @author Enterprise Brain
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("finance_voucher_item")
@Schema(description = "凭证明细实体类")
public class VoucherItem {

    @Schema(description = "主键ID")
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @Schema(description = "凭证ID")
    @TableField("voucher_id")
    private Long voucherId;

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

    @Schema(description = "摘要")
    @TableField("summary")
    private String summary;

    @Schema(description = "辅助核算项")
    @TableField("auxiliary_items")
    private String auxiliaryItems;

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