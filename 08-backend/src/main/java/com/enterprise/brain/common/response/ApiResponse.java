package com.enterprise.brain.common.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 统一响应结果
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 响应码
     */
    private String code;

    /**
     * 响应消息
     */
    private String message;

    /**
     * 响应数据
     */
    private T data;

    /**
     * 时间戳
     */
    private Long timestamp;

    /**
     * 成功标识
     */
    private Boolean success;

    /**
     * 成功响应
     */
    public static <T> ApiResponse<T> success() {
        return success(null);
    }

    /**
     * 成功响应（带数据）
     */
    public static <T> ApiResponse<T> success(T data) {
        return success("操作成功", data);
    }

    /**
     * 成功响应（带消息和数据）
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode("200");
        response.setMessage(message);
        response.setData(data);
        response.setTimestamp(System.currentTimeMillis());
        response.setSuccess(true);
        return response;
    }

    /**
     * 失败响应
     */
    public static <T> ApiResponse<T> fail(String message) {
        return fail("500", message);
    }

    /**
     * 失败响应（带错误码）
     */
    public static <T> ApiResponse<T> fail(String code, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(code);
        response.setMessage(message);
        response.setData(null);
        response.setTimestamp(System.currentTimeMillis());
        response.setSuccess(false);
        return response;
    }

    /**
     * 自定义响应
     */
    public static <T> ApiResponse<T> custom(String code, String message, T data, Boolean success) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(code);
        response.setMessage(message);
        response.setData(data);
        response.setTimestamp(System.currentTimeMillis());
        response.setSuccess(success);
        return response;
    }
}
