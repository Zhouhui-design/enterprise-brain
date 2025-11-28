package com.enterprise.brain.modules.finance.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 应付账款实体类
 * 
 * @author Enterprise Brain
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("finance_accounts_payable")
@Schema(description = "应付账款实体类")
public class AccountsPayable {

    @Schema(description = "主键ID")
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @Schema(description = "供应商ID")
    @TableField("supplier_id")
    private Long supplierId;

    @Schema(description = "供应商名称")
    @TableField("supplier_name")
    private String supplierName;

    @Schema(description = "采购订单编号")
    @TableField("purchase_order_number")
    private String purchaseOrderNumber;

    @Schema(description = "应付金额")
    @TableField("payable_amount")
    private BigDecimal payableAmount;

    @Schema(description = "已付金额")
    @TableField("paid_amount")
    private BigDecimal paidAmount;

    @Schema(description = "未付金额")
    @TableField("outstanding_amount")
    private BigDecimal outstandingAmount;

    @Schema(description = "发票编号")
    @TableField("invoice_number")
    private String invoiceNumber;

    @Schema(description = "发票日期")
    @TableField("invoice_date")
    private LocalDateTime invoiceDate;

    @Schema(description = "到期日期")
    @TableField("due_date")
    private LocalDateTime dueDate;

    @Schema(description = "付款条件")
    @TableField("payment_terms")
    private String paymentTerms;

    @Schema(description = "状态")
    @TableField("status")
    private String status;

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