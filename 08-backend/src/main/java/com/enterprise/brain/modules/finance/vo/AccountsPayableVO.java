package com.enterprise.brain.modules.finance.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 应付账款VO
 * 
 * @author Enterprise Brain
 */
@Data
@Schema(description = "应付账款VO")
public class AccountsPayableVO {

    @Schema(description = "主键ID")
    private Long id;

    @Schema(description = "供应商ID")
    private Long supplierId;

    @Schema(description = "供应商名称")
    private String supplierName;

    @Schema(description = "采购订单编号")
    private String purchaseOrderNumber;

    @Schema(description = "应付金额")
    private BigDecimal payableAmount;

    @Schema(description = "已付金额")
    private BigDecimal paidAmount;

    @Schema(description = "未付金额")
    private BigDecimal outstandingAmount;

    @Schema(description = "发票编号")
    private String invoiceNumber;

    @Schema(description = "发票日期")
    private LocalDateTime invoiceDate;

    @Schema(description = "到期日期")
    private LocalDateTime dueDate;

    @Schema(description = "付款条件")
    private String paymentTerms;

    @Schema(description = "状态")
    private String status;

    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
}