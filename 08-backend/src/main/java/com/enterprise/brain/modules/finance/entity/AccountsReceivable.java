package com.enterprise.brain.modules.finance.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 应收账款实体类
 * 
 * @author Enterprise Brain
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("finance_accounts_receivable")
@Schema(description = "应收账款实体类")
public class AccountsReceivable {

    @Schema(description = "主键ID")
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @Schema(description = "客户ID")
    @TableField("customer_id")
    private Long customerId;

    @Schema(description = "客户名称")
    @TableField("customer_name")
    private String customerName;

    @Schema(description = "销售订单编号")
    @TableField("sales_order_number")
    private String salesOrderNumber;

    @Schema(description = "应收金额")
    @TableField("receivable_amount")
    private BigDecimal receivableAmount;

    @Schema(description = "已收金额")
    @TableField("received_amount")
    private BigDecimal receivedAmount;

    @Schema(description = "未收金额")
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

    @Schema(description = "收款条件")
    @TableField("collection_terms")
    private String collectionTerms;

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