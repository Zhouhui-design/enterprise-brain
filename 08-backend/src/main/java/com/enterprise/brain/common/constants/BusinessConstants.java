package com.enterprise.brain.common.constants;

/**
 * 业务常量
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
public class BusinessConstants {

    /**
     * 订单状态 - 待支付
     */
    public static final String ORDER_STATUS_PENDING = "PENDING";

    /**
     * 订单状态 - 已支付
     */
    public static final String ORDER_STATUS_PAID = "PAID";

    /**
     * 订单状态 - 已发货
     */
    public static final String ORDER_STATUS_SHIPPED = "SHIPPED";

    /**
     * 订单状态 - 已完成
     */
    public static final String ORDER_STATUS_COMPLETED = "COMPLETED";

    /**
     * 订单状态 - 已取消
     */
    public static final String ORDER_STATUS_CANCELLED = "CANCELLED";

    /**
     * 订单类型 - 销售订单
     */
    public static final String ORDER_TYPE_SALES = "SALES";

    /**
     * 订单类型 - 采购订单
     */
    public static final String ORDER_TYPE_PURCHASE = "PURCHASE";

    /**
     * 库存事务类型 - 入库
     */
    public static final String STOCK_TRANS_TYPE_IN = "IN";

    /**
     * 库存事务类型 - 出库
     */
    public static final String STOCK_TRANS_TYPE_OUT = "OUT";

    /**
     * 库存事务类型 - 调拨
     */
    public static final String STOCK_TRANS_TYPE_TRANSFER = "TRANSFER";

    /**
     * 库存事务类型 - 盘点
     */
    public static final String STOCK_TRANS_TYPE_INVENTORY = "INVENTORY";

    /**
     * 产品状态 - 在售
     */
    public static final String PRODUCT_STATUS_ON_SALE = "ON_SALE";

    /**
     * 产品状态 - 下架
     */
    public static final String PRODUCT_STATUS_OFF_SALE = "OFF_SALE";

    /**
     * 产品状态 - 缺货
     */
    public static final String PRODUCT_STATUS_OUT_OF_STOCK = "OUT_OF_STOCK";

    /**
     * 支付方式 - 现金
     */
    public static final String PAYMENT_METHOD_CASH = "CASH";

    /**
     * 支付方式 - 银行转账
     */
    public static final String PAYMENT_METHOD_BANK_TRANSFER = "BANK_TRANSFER";

    /**
     * 支付方式 - 支付宝
     */
    public static final String PAYMENT_METHOD_ALIPAY = "ALIPAY";

    /**
     * 支付方式 - 微信支付
     */
    public static final String PAYMENT_METHOD_WECHAT = "WECHAT";

    /**
     * 支付状态 - 未支付
     */
    public static final String PAYMENT_STATUS_UNPAID = "UNPAID";

    /**
     * 支付状态 - 已支付
     */
    public static final String PAYMENT_STATUS_PAID = "PAID";

    /**
     * 支付状态 - 已退款
     */
    public static final String PAYMENT_STATUS_REFUNDED = "REFUNDED";

    /**
     * 发票类型 - 增值税普通发票
     */
    public static final String INVOICE_TYPE_VAT_ORDINARY = "VAT_ORDINARY";

    /**
     * 发票类型 - 增值税专用发票
     */
    public static final String INVOICE_TYPE_VAT_SPECIAL = "VAT_SPECIAL";

    /**
     * 客户类型 - 个人
     */
    public static final String CUSTOMER_TYPE_PERSONAL = "PERSONAL";

    /**
     * 客户类型 - 企业
     */
    public static final String CUSTOMER_TYPE_ENTERPRISE = "ENTERPRISE";

    /**
     * 客户级别 - 普通
     */
    public static final String CUSTOMER_LEVEL_NORMAL = "NORMAL";

    /**
     * 客户级别 - VIP
     */
    public static final String CUSTOMER_LEVEL_VIP = "VIP";

    /**
     * 客户级别 - SVIP
     */
    public static final String CUSTOMER_LEVEL_SVIP = "SVIP";

    /**
     * 供应商状态 - 合作中
     */
    public static final String SUPPLIER_STATUS_ACTIVE = "ACTIVE";

    /**
     * 供应商状态 - 暂停合作
     */
    public static final String SUPPLIER_STATUS_SUSPENDED = "SUSPENDED";

    /**
     * 供应商状态 - 终止合作
     */
    public static final String SUPPLIER_STATUS_TERMINATED = "TERMINATED";

    /**
     * 生产任务状态 - 待开始
     */
    public static final String PRODUCTION_STATUS_PENDING = "PENDING";

    /**
     * 生产任务状态 - 生产中
     */
    public static final String PRODUCTION_STATUS_IN_PROGRESS = "IN_PROGRESS";

    /**
     * 生产任务状态 - 已完成
     */
    public static final String PRODUCTION_STATUS_COMPLETED = "COMPLETED";

    /**
     * 生产任务状态 - 已取消
     */
    public static final String PRODUCTION_STATUS_CANCELLED = "CANCELLED";

    /**
     * 质检状态 - 待检
     */
    public static final String QC_STATUS_PENDING = "PENDING";

    /**
     * 质检状态 - 合格
     */
    public static final String QC_STATUS_PASSED = "PASSED";

    /**
     * 质检状态 - 不合格
     */
    public static final String QC_STATUS_FAILED = "FAILED";

    /**
     * 审批状态 - 待审批
     */
    public static final String APPROVAL_STATUS_PENDING = "PENDING";

    /**
     * 审批状态 - 已通过
     */
    public static final String APPROVAL_STATUS_APPROVED = "APPROVED";

    /**
     * 审批状态 - 已拒绝
     */
    public static final String APPROVAL_STATUS_REJECTED = "REJECTED";

    /**
     * 通知类型 - 系统通知
     */
    public static final String NOTIFY_TYPE_SYSTEM = "SYSTEM";

    /**
     * 通知类型 - 业务通知
     */
    public static final String NOTIFY_TYPE_BUSINESS = "BUSINESS";

    /**
     * 通知类型 - 预警通知
     */
    public static final String NOTIFY_TYPE_ALERT = "ALERT";

    /**
     * 数据来源 - 手工录入
     */
    public static final String DATA_SOURCE_MANUAL = "MANUAL";

    /**
     * 数据来源 - 导入
     */
    public static final String DATA_SOURCE_IMPORT = "IMPORT";

    /**
     * 数据来源 - API同步
     */
    public static final String DATA_SOURCE_API = "API";

    /**
     * 数据来源 - 系统生成
     */
    public static final String DATA_SOURCE_SYSTEM = "SYSTEM";

    private BusinessConstants() {
        throw new IllegalStateException("Utility class");
    }
}
