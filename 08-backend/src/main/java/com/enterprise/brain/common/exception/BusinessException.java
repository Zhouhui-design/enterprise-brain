package com.enterprise.brain.common.exception;

import com.enterprise.brain.common.response.ErrorCode;
import lombok.Getter;

/**
 * 自定义业务异常类，用于封装业务逻辑中的异常信息，关联统一错误码。
 * 区别于系统异常（如NullPointerException），仅用于业务规则违反场景。
 */
@Getter
public class BusinessException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /** 错误码（关联ErrorCode枚举） */
    private final Integer errorCode;

    /** 错误描述信息 */
    private final String errorMessage;

    /**
     * 构造方法：仅传入错误码（使用枚举默认描述）
     * @param errorCode 错误码枚举
     */
    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode.getCode();
        this.errorMessage = errorCode.getMessage();
    }

    /**
     * 构造方法：传入错误码和自定义描述
     * @param errorCode 错误码枚举
     * @param errorMessage 自定义错误描述
     */
    public BusinessException(ErrorCode errorCode, String errorMessage) {
        super(errorMessage);
        this.errorCode = errorCode.getCode();
        this.errorMessage = errorMessage;
    }

    /**
     * 构造方法：传入错误码、自定义描述和根因异常
     * @param errorCode 错误码枚举
     * @param errorMessage 自定义错误描述
     * @param cause 根因异常（用于日志追溯）
     */
    public BusinessException(ErrorCode errorCode, String errorMessage, Throwable cause) {
        super(errorMessage, cause);
        this.errorCode = errorCode.getCode();
        this.errorMessage = errorMessage;
    }

    /**
     * 构造方法：传入错误码和根因异常（使用枚举默认描述）
     * @param errorCode 错误码枚举
     * @param cause 根因异常
     */
    public BusinessException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getMessage(), cause);
        this.errorCode = errorCode.getCode();
        this.errorMessage = errorCode.getMessage();
    }
}
