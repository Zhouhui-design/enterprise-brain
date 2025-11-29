package com.enterprise.brain.modules.integration.ecommerce.entity;

import com.enterprise.brain.common.base.BaseEntity;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 电商平台订单实体类
 * 用于管理来自各电商平台的订单信息
 * 
 * @author Enterprise Brain Team
 * @version 1.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "ecommerce_order", indexes = {
    @Index(name = "idx_shop_id", columnList = "shopId"),
    @Index(name = "idx_platform_order_id", columnList = "platform,platformOrderId"),
    @Index(name = "idx_user_id", columnList = "userId"),
    @Index(name = "idx_order_status", columnList = "orderStatus"),
    @Index(name = "idx_payment_status", columnList = "paymentStatus"),
    @Index(name = "idx_order_date", columnList = "orderDate"),
    @Index(name = "idx_created_at", columnList = "createdAt")
})
public class EcommerceOrder extends BaseEntity {

    /**
     * 主键ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 关联的店铺ID
     */
    @NotNull(message = "店铺ID不能为空")
    @Column(name = "shop_id", nullable = false)
    private Long shopId;

    /**
     * 用户ID
     */
    @NotNull(message = "用户ID不能为空")
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * 电商平台类型
     */
    @NotNull(message = "电商平台不能为空")
    @Enumerated(EnumType.STRING)
    @Column(name = "platform", nullable = false, length = 20)
    private EcommerceShop.Platform platform;

    /**
     * 平台订单ID
     */
    @NotBlank(message = "平台订单ID不能为空")
    @Column(name = "platform_order_id", nullable = false, length = 100)
    private String platformOrderId;

    /**
     * 子订单ID（拆单时使用）
     */
    @Column(name = "sub_order_id", length = 100)
    private String subOrderId;

    /**
     * 订单编号
     */
    @NotBlank(message = "订单编号不能为空")
    @Column(name = "order_number", nullable = false, length = 100)
    private String orderNumber;

    /**
     * 父订单编号（合单时使用）
     */
    @Column(name = "parent_order_number", length = 100)
    private String parentOrderNumber;

    /**
     * 订单状态
     */
    @NotNull(message = "订单状态不能为空")
    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false, length = 20)
    private OrderStatus orderStatus;

    /**
     * 付款状态
     */
    @NotNull(message = "付款状态不能为空")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private PaymentStatus paymentStatus;

    /**
     * 发货状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "shipping_status", length = 20)
    private ShippingStatus shippingStatus;

    /**
     * 退货状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "refund_status", length = 20)
    private RefundStatus refundStatus;

    /**
     * 订单类型
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", length = 20)
    private OrderType orderType;

    /**
     * 订单来源
     */
    @Column(name = "order_source", length = 50)
    private String orderSource;

    /**
     * 买家信息
     */
    @Embedded
    private BuyerInfo buyerInfo;

    /**
     * 收货地址信息
     */
    @Embedded
    private ShippingAddress shippingAddress;

    /**
     * 发货地址信息
     */
    @Embedded
    private SenderAddress senderAddress;

    /**
     * 订单金额信息
     */
    @Embedded
    private OrderAmount orderAmount;

    /**
     * 订单商品信息 - JSON格式存储详细信息
     */
    @Column(name = "order_items", columnDefinition = "TEXT")
    private String orderItems;

    /**
     * 物流信息
     */
    @Embedded
    private LogisticsInfo logisticsInfo;

    /**
     * 支付信息
     */
    @Embedded
    private PaymentInfo paymentInfo;

    /**
     * 发票信息
     */
    @Embedded
    private InvoiceInfo invoiceInfo;

    /**
     * 优惠信息
     */
    @Embedded
    private DiscountInfo discountInfo;

    /**
     * 订单备注
     */
    @Column(name = "order_notes", length = 1000)
    private String orderNotes;

    /**
     * 买家留言
     */
    @Column(name = "buyer_message", length = 1000)
    private String buyerMessage;

    /**
     * 卖家备注
     */
    @Column(name = "seller_memo", length = 1000)
    private String sellerMemo;

    /**
     * 平台扩展信息 - JSON格式存储
     */
    @Column(name = "platform_extra", columnDefinition = "TEXT")
    private String platformExtra;

    /**
     * 订单创建时间（平台时间）
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "order_date")
    private LocalDateTime orderDate;

    /**
     * 付款时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "payment_time")
    private LocalDateTime paymentTime;

    /**
     * 发货时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "shipping_time")
    private LocalDateTime shippingTime;

    /**
     * 收货时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "receive_time")
    private LocalDateTime receiveTime;

    /**
     * 完成时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "finish_time")
    private LocalDateTime finishTime;

    /**
     * 最后同步时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    /**
     * 订单状态枚举
     */
    public enum OrderStatus {
        WAIT_BUYER_PAY("等待买家付款"),
        WAIT_SELLER_SEND_GOODS("等待卖家发货"),
        WAIT_BUYER_CONFIRM_GOODS("等待买家确认收货"),
        TRADE_BUYER_SIGNED("买家已签收"),
        TRADE_FINISHED("交易成功"),
        TRADE_CLOSED("交易关闭"),
        TRADE_CLOSED_BY_TAOBAO("交易被淘宝关闭"),
        ALL_WAIT_PAY("所有等待付款"),
        ALL_WAIT_SEND_GOODS("所有等待发货"),
        ALL_WAIT_CONFIRM_GOODS("所有等待确认收货"),
        ALL_FINISHED("所有交易成功"),
        ALL_CLOSED("所有交易关闭");

        private final String description;

        OrderStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 付款状态枚举
     */
    public enum PaymentStatus {
        UNPAID("未付款"),
        PAID("已付款"),
        REFUNDING("退款中"),
        REFUNDED("已退款"),
        PARTIAL_REFUND("部分退款");

        private final String description;

        PaymentStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 发货状态枚举
     */
    public enum ShippingStatus {
        UNSHIPPED("未发货"),
        SHIPPED("已发货"),
        DELIVERING("配送中"),
        DELIVERED("已送达"),
        SHIPPING_FAILED("发货失败");

        private final String description;

        ShippingStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 退货状态枚举
     */
    public enum RefundStatus {
        NO_REFUND("无退款"),
        REFUNDING("退款中"),
        REFUNDED("已退款"),
        REFUND_FAILED("退款失败"),
        PARTIAL_REFUND("部分退款");

        private final String description;

        RefundStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 订单类型枚举
     */
    public enum OrderType {
        NORMAL("普通订单"),
        PRESALE("预售订单"),
        GROUP("团购订单"),
        SECKILL("秒杀订单"),
        GIFT("赠品订单"),
        SAMPLE("样品订单");

        private final String description;

        OrderType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 买家信息嵌入类
     */
    @Embeddable
    @Data
    public static class BuyerInfo {
        @Column(name = "buyer_nick", length = 100)
        private String buyerNick;

        @Column(name = "buyer_id", length = 100)
        private String buyerId;

        @Column(name = "buyer_email", length = 200)
        private String buyerEmail;

        @Column(name = "buyer_phone", length = 50)
        private String buyerPhone;

        @Column(name = "buyer_level", length = 50)
        private String buyerLevel;
    }

    /**
     * 收货地址信息嵌入类
     */
    @Embeddable
    @Data
    public static class ShippingAddress {
        @Column(name = "receiver_name", length = 100)
        private String receiverName;

        @Column(name = "receiver_phone", length = 50)
        private String receiverPhone;

        @Column(name = "receiver_mobile", length = 50)
        private String receiverMobile;

        @Column(name = "receiver_state", length = 50)
        private String receiverState;

        @Column(name = "receiver_city", length = 50)
        private String receiverCity;

        @Column(name = "receiver_district", length = 50)
        private String receiverDistrict;

        @Column(name = "receiver_address", length = 500)
        private String receiverAddress;

        @Column(name = "receiver_zip", length = 20)
        private String receiverZip;
    }

    /**
     * 发货地址信息嵌入类
     */
    @Embeddable
    @Data
    public static class SenderAddress {
        @Column(name = "sender_name", length = 100)
        private String senderName;

        @Column(name = "sender_phone", length = 50)
        private String senderPhone;

        @Column(name = "sender_mobile", length = 50)
        private String senderMobile;

        @Column(name = "sender_state", length = 50)
        private String senderState;

        @Column(name = "sender_city", length = 50)
        private String senderCity;

        @Column(name = "sender_district", length = 50)
        private String senderDistrict;

        @Column(name = "sender_address", length = 500)
        private String senderAddress;

        @Column(name = "sender_zip", length = 20)
        private String senderZip;
    }

    /**
     * 订单金额信息嵌入类
     */
    @Embeddable
    @Data
    public static class OrderAmount {
        @Column(name = "total_amount", precision = 10, scale = 2)
        private BigDecimal totalAmount;

        @Column(name = "payment", precision = 10, scale = 2)
        private BigDecimal payment;

        @Column(name = "post_fee", precision = 10, scale = 2)
        private BigDecimal postFee;

        @Column(name = "discount_fee", precision = 10, scale = 2)
        private BigDecimal discountFee;

        @Column(name = "adjust_fee", precision = 10, scale = 2)
        private BigDecimal adjustFee;

        @Column(name = "cod_fee", precision = 10, scale = 2)
        private BigDecimal codFee;

        @Column(name = "goods_amount", precision = 10, scale = 2)
        private BigDecimal goodsAmount;

        @Column(name = "tax_fee", precision = 10, scale = 2)
        private BigDecimal taxFee;

        @Column(name = "service_fee", precision = 10, scale = 2)
        private BigDecimal serviceFee;
    }

    /**
     * 物流信息嵌入类
     */
    @Embeddable
    @Data
    public static class LogisticsInfo {
        @Column(name = "shipping_type", length = 50)
        private String shippingType;

        @Column(name = "company_code", length = 50)
        private String companyCode;

        @Column(name = "company_name", length = 200)
        private String companyName;

        @Column(name = "out_sid", length = 100)
        private String outSid;

        @Column(name = "tid", length = 100)
        private String tid;

        @Column(name = "freight_payer", length = 20)
        private String freightPayer;

        @Column(name = "seller_confirm", length = 10)
        private String sellerConfirm;
    }

    /**
     * 支付信息嵌入类
     */
    @Embeddable
    @Data
    public static class PaymentInfo {
        @Column(name = "payment_type", length = 50)
        private String paymentType;

        @Column(name = "pay_time")
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime payTime;

        @Column(name = "pay_account", length = 100)
        private String payAccount;

        @Column(name = "pay_bank", length = 200)
        private String payBank;

        @Column(name = "installment", length = 10)
        private String installment;

        @Column(name = "installment_type", length = 50)
        private String installmentType;
    }

    /**
     * 发票信息嵌入类
     */
    @Embeddable
    @Data
    public static class InvoiceInfo {
        @Column(name = "invoice_type", length = 20)
        private String invoiceType;

        @Column(name = "invoice_title", length = 200)
        private String invoiceTitle;

        @Column(name = "invoice_content", length = 500)
        private String invoiceContent;

        @Column(name = "invoice_amount", precision = 10, scale = 2)
        private BigDecimal invoiceAmount;

        @Column(name = "invoice_tax_number", length = 50)
        private String invoiceTaxNumber;

        @Column(name = "invoice_bank_name", length = 200)
        private String invoiceBankName;

        @Column(name = "invoice_bank_account", length = 100)
        private String invoiceBankAccount;
    }

    /**
     * 优惠信息嵌入类
     */
    @Embeddable
    @Data
    public static class DiscountInfo {
        @Column(name = "coupon_amount", precision = 10, scale = 2)
        private BigDecimal couponAmount;

        @Column(name = "coupon_id", length = 100)
        private String couponId;

        @Column(name = "coupon_name", length = 200)
        private String couponName;

        @Column(name = "promotion_amount", precision = 10, scale = 2)
        private BigDecimal promotionAmount;

        @Column(name = "promotion_id", length = 100)
        private String promotionId;

        @Column(name = "promotion_name", length = 200)
        private String promotionName;
    }

    /**
     * 检查订单是否已完成
     */
    public boolean isFinished() {
        return OrderStatus.TRADE_FINISHED.equals(orderStatus) ||
               OrderStatus.TRADE_CLOSED.equals(orderStatus) ||
               OrderStatus.TRADE_CLOSED_BY_TAOBAO.equals(orderStatus);
    }

    /**
     * 检查订单是否需要发货
     */
    public boolean needShip() {
        return OrderStatus.WAIT_SELLER_SEND_GOODS.equals(orderStatus) &&
               PaymentStatus.PAID.equals(paymentStatus);
    }

    /**
     * 检查订单是否已付款
     */
    public boolean isPaid() {
        return PaymentStatus.PAID.equals(paymentStatus);
    }

    /**
     * 检查订单是否有退款
     */
    public boolean hasRefund() {
        return !RefundStatus.NO_REFUND.equals(refundStatus);
    }
}