package com.enterprise.brain.modules.finance.vo;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;

/**
 * 应收账款VO
 * 
 * @author enterprise
 * @date 2024-01-01
 */
@Data
public class AccountsReceivableVO {

    /**
     * ID
     */
    private Long id;

    /**
     * 客户ID
     */
    private Long customerId;

    /**
     * 客户名称
     */
    private String customerName;

    /**
     * 客户编号
     */
    private String customerCode;

    /**
     * 合同编号
     */
    private String contractNumber;

    /**
     * 订单编号
     */
    private String orderNumber;

    /**
     * 发票编号
     */
    private String invoiceNumber;

    /**
     * 发票日期
     */
    private Date invoiceDate;

    /**
     * 到期日期
     */
    private Date dueDate;

    /**
     * 应收账款金额
     */
    private BigDecimal amount;

    /**
     * 已回款金额
     */
    private BigDecimal paidAmount;

    /**
     * 未回款金额
     */
    private BigDecimal outstandingAmount;

    /**
     * 账龄天数
     */
    private Integer agingDays;

    /**
     * 账龄阶段
     */
    private String agingPeriod;

    /**
     * 状态
     */
    private String status;

    /**
     * 负责人
     */
    private String responsiblePerson;

    /**
     * 联系电话
     */
    private String contactPhone;

    /**
     * 备注
     */
    private String remark;

    /**
     * 创建时间
     */
    private Date createdAt;

    /**
     * 更新时间
     */
    private Date updatedAt;
}