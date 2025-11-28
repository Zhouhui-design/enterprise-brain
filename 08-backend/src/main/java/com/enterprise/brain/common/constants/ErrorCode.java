package com.enterprise.brain.common.constants;

/**
 * 错误码常量
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
public class ErrorCode {

    // ========== 通用错误码 1xxxx ==========
    public static final String SUCCESS = "10000";
    public static final String SYSTEM_ERROR = "10001";
    public static final String SERVICE_UNAVAILABLE = "10002";
    public static final String REQUEST_TIMEOUT = "10003";
    public static final String REMOTE_SERVICE_ERROR = "10004";

    // ========== 参数错误码 2xxxx ==========
    public static final String PARAMETER_ERROR = "20000";
    public static final String PARAMETER_MISSING = "20001";
    public static final String PARAMETER_INVALID = "20002";
    public static final String PARAMETER_TYPE_ERROR = "20003";
    public static final String PARAMETER_OUT_OF_RANGE = "20004";
    public static final String VALIDATION_ERROR = "20005";
    public static final String BIND_ERROR = "20006";
    public static final String CONSTRAINT_VIOLATION = "20007";
    public static final String ILLEGAL_ARGUMENT = "20008";

    // ========== 认证授权错误码 3xxxx ==========
    public static final String UNAUTHORIZED = "30000";
    public static final String TOKEN_MISSING = "30001";
    public static final String TOKEN_INVALID = "30002";
    public static final String TOKEN_EXPIRED = "30003";
    public static final String ACCESS_DENIED = "30004";
    public static final String PERMISSION_DENIED = "30005";
    public static final String ACCOUNT_DISABLED = "30006";
    public static final String ACCOUNT_LOCKED = "30007";
    public static final String LOGIN_FAILED = "30008";
    public static final String PASSWORD_ERROR = "30009";
    public static final String CAPTCHA_ERROR = "30010";

    // ========== 数据错误码 4xxxx ==========
    public static final String DATA_NOT_FOUND = "40000";
    public static final String DATA_ALREADY_EXISTS = "40001";
    public static final String DATA_CONFLICT = "40002";
    public static final String DATA_INTEGRITY_VIOLATION = "40003";
    public static final String DATABASE_ERROR = "40004";
    public static final String DATA_VERSION_CONFLICT = "40005";

    // ========== 业务错误码 5xxxx ==========
    public static final String BUSINESS_ERROR = "50000";
    public static final String ORDER_NOT_FOUND = "50001";
    public static final String ORDER_STATUS_ERROR = "50002";
    public static final String INSUFFICIENT_STOCK = "50003";
    public static final String PRODUCT_NOT_FOUND = "50004";
    public static final String PRODUCT_OFF_SALE = "50005";
    public static final String CUSTOMER_NOT_FOUND = "50006";
    public static final String SUPPLIER_NOT_FOUND = "50007";
    public static final String PAYMENT_FAILED = "50008";
    public static final String REFUND_FAILED = "50009";
    public static final String INVOICE_ERROR = "50010";
    public static final String PRODUCTION_ERROR = "50011";
    public static final String QUALITY_CHECK_FAILED = "50012";
    public static final String APPROVAL_REJECTED = "50013";
    public static final String WORKFLOW_ERROR = "50014";
    public static final String INVENTORY_ERROR = "50015";
    public static final String PURCHASE_ERROR = "50016";
    public static final String SALES_ERROR = "50017";
    public static final String FINANCE_ERROR = "50018";

    // ========== 文件错误码 6xxxx ==========
    public static final String FILE_ERROR = "60000";
    public static final String FILE_NOT_FOUND = "60001";
    public static final String FILE_UPLOAD_FAILED = "60002";
    public static final String FILE_DOWNLOAD_FAILED = "60003";
    public static final String FILE_SIZE_EXCEEDED = "60004";
    public static final String FILE_TYPE_NOT_ALLOWED = "60005";
    public static final String FILE_PARSE_ERROR = "60006";

    // ========== 网络错误码 7xxxx ==========
    public static final String NETWORK_ERROR = "70000";
    public static final String CONNECTION_TIMEOUT = "70001";
    public static final String READ_TIMEOUT = "70002";
    public static final String WRITE_TIMEOUT = "70003";
    public static final String CONNECTION_REFUSED = "70004";

    // ========== 第三方服务错误码 8xxxx ==========
    public static final String THIRD_PARTY_ERROR = "80000";
    public static final String PAYMENT_SERVICE_ERROR = "80001";
    public static final String SMS_SERVICE_ERROR = "80002";
    public static final String EMAIL_SERVICE_ERROR = "80003";
    public static final String STORAGE_SERVICE_ERROR = "80004";
    public static final String MAP_SERVICE_ERROR = "80005";

    // ========== 缓存错误码 9xxxx ==========
    public static final String CACHE_ERROR = "90000";
    public static final String CACHE_CONNECTION_ERROR = "90001";
    public static final String CACHE_OPERATION_ERROR = "90002";

    private ErrorCode() {
        throw new IllegalStateException("Utility class");
    }
}
