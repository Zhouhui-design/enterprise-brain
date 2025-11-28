package com.enterprise.brain.common.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 错误响应对象
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 错误码
     */
    private String code;

    /**
     * 错误消息
     */
    private String message;

    /**
     * 请求路径
     */
    private String path;

    /**
     * 时间戳
     */
    private Long timestamp;

    /**
     * 详细错误信息
     */
    private Object details;

    /**
     * 构造方法
     */
    public ErrorResponse(String code, String message) {
        this.code = code;
        this.message = message;
        this.timestamp = System.currentTimeMillis();
    }

    /**
     * 构造方法
     */
    public ErrorResponse(String code, String message, String path) {
        this.code = code;
        this.message = message;
        this.path = path;
        this.timestamp = System.currentTimeMillis();
    }

    /**
     * 构造方法
     */
    public static ErrorResponse of(String code, String message) {
        return new ErrorResponse(code, message);
    }

    /**
     * 构造方法
     */
    public static ErrorResponse of(String code, String message, String path) {
        return new ErrorResponse(code, message, path);
    }

    /**
     * 构造方法
     */
    public static ErrorResponse of(String code, String message, String path, Object details) {
        ErrorResponse response = new ErrorResponse(code, message, path);
        response.setDetails(details);
        return response;
    }
}
