package com.enterprise.brain.common.response;

import java.util.HashMap;
import java.util.Map;

/**
 * 系统统一错误码枚举，管理所有错误类型，确保错误码唯一且语义清晰。
 * 错误码规则：
 * - 200：成功
 * - 4xx：客户端错误（如参数错误、权限不足）
 * - 5xx：业务逻辑错误（如资源不存在、重复）
 * - 6xx：数据访问错误（如数据库异常）
 * - 7xx：系统错误（如服务不可用）
 * - 10000+：模块特定错误（如菜单模块11000+）
 */
public enum ErrorCode {

    // ==================== 通用状态 ====================
    SUCCESS(200, "操作成功"),
    UNKNOWN_ERROR(9999, "未知错误"),

    // ==================== 客户端错误（4xx） ====================
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未授权访问"),
    FORBIDDEN(403, "访问被禁止"),
    NOT_FOUND(404, "资源不存在"),

    // ==================== 参数校验错误（4001-4999） ====================
    PARAMETER_VALIDATION_FAILED(4001, "参数校验失败"),
    MISSING_REQUIRED_PARAMETER(4002, "缺少必需参数"),
    INVALID_PARAMETER_FORMAT(4003, "参数格式错误"),

    // ==================== 业务逻辑错误（5001-5999） ====================
    BUSINESS_ERROR(5001, "业务逻辑错误"),
    RESOURCE_ALREADY_EXISTS(5002, "资源已存在"),
    OPERATION_NOT_ALLOWED(5003, "操作不被允许"),

    // ==================== 菜单模块错误（11001-11999） ====================
    MENU_NOT_FOUND(11001, "菜单不存在"),
    MENU_PARENT_INVALID(11002, "父菜单无效或不存在"),
    MENU_NAME_DUPLICATE(11003, "同一父菜单下菜单名称已存在"),
    MENU_DELETE_FAILED(11004, "菜单删除失败"),
    MENU_ITEM_NOT_FOUND(11005, "菜单项不存在"),

    // ==================== 数据访问错误（6001-6999） ====================
    DATA_ACCESS_ERROR(6001, "数据访问错误"),
    DATA_INTEGRITY_VIOLATION(6002, "数据完整性约束违反"),

    // ==================== 系统错误（7001-7999） ====================
    SYSTEM_ERROR(7001, "系统内部错误"),
    SERVICE_UNAVAILABLE(7002, "服务暂时不可用");

    /** 错误码 */
    private final Integer code;

    /** 错误描述 */
    private final String message;

    /** 错误码缓存（优化查询效率，O(1)） */
    private static final Map<Integer, ErrorCode> CODE_CACHE = new HashMap<>();

    // 静态初始化缓存
    static {
        for (ErrorCode errorCode : values()) {
            CODE_CACHE.put(errorCode.getCode(), errorCode);
        }
    }

    ErrorCode(Integer code, String message) {
        this.code = code;
        this.message = message;
    }

    public Integer getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    /**
     * 根据错误码获取枚举实例
     * @param code 错误码
     * @return 对应的ErrorCode枚举，无匹配时返回UNKNOWN_ERROR
     */
    public static ErrorCode getByCode(Integer code) {
        return CODE_CACHE.getOrDefault(code, UNKNOWN_ERROR);
    }
}
