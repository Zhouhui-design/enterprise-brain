package com.enterprise.brain.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

/**
 * 统一API响应格式
 * 提供标准化的响应结构，包含状态码、消息、数据和时间戳
 * 
 * @author Enterprise Brain Team
 * @version 1.0.0
 * @since 2024-01-01
 * 
 * @param <T> 响应数据的泛型类型
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    
    /**
     * 响应状态码
     * 200 表示成功，其他值表示失败
     */
    private Integer code;
    
    /**
     * 响应消息
     * 成功时返回成功消息，失败时返回错误信息
     */
    private String message;
    
    /**
     * 响应数据
     * 成功时返回业务数据，失败时为null
     */
    private T data;
    
    /**
     * 响应时间戳
     * 记录响应生成的时间
     */
    private LocalDateTime timestamp;
    
    /**
     * 创建成功响应
     * 
     * @param <T> 数据类型
     * @return 成功响应，无数据
     */
    public static <T> ApiResponse<T> success() {
        return new ApiResponse<>(
                ErrorCode.SUCCESS.getCode(),
                ErrorCode.SUCCESS.getMessage(),
                null,
                LocalDateTime.now()
        );
    }
    
    /**
     * 创建成功响应，带数据
     * 
     * @param data 响应数据
     * @param <T> 数据类型
     * @return 成功响应，包含数据
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(
                ErrorCode.SUCCESS.getCode(),
                ErrorCode.SUCCESS.getMessage(),
                data,
                LocalDateTime.now()
        );
    }
    
    /**
     * 创建成功响应，带自定义消息和数据
     * 
     * @param message 自定义成功消息
     * @param data 响应数据
     * @param <T> 数据类型
     * @return 成功响应，包含自定义消息和数据
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(
                ErrorCode.SUCCESS.getCode(),
                message,
                data,
                LocalDateTime.now()
        );
    }
    
    /**
     * 创建错误响应
     * 
     * @param errorCode 错误代码
     * @return 错误响应
     */
    public static <T> ApiResponse<T> error(ErrorCode errorCode) {
        return new ApiResponse<>(
                errorCode.getCode(),
                errorCode.getMessage(),
                null,
                LocalDateTime.now()
        );
    }
    
    /**
     * 创建错误响应，带自定义消息
     * 
     * @param errorCode 错误代码
     * @param message 自定义错误消息
     * @return 错误响应
     */
    public static <T> ApiResponse<T> error(ErrorCode errorCode, String message) {
        return new ApiResponse<>(
                errorCode.getCode(),
                message,
                null,
                LocalDateTime.now()
        );
    }
    
    /**
     * 创建错误响应，带错误代码和消息
     * 
     * @param code 错误代码
     * @param message 错误消息
     * @return 错误响应
     */
    public static <T> ApiResponse<T> error(Integer code, String message) {
        return new ApiResponse<>(
                code,
                message,
                null,
                LocalDateTime.now()
        );
    }
    
    /**
     * 检查响应是否成功
     * 
     * @return true表示成功，false表示失败
     */
    public boolean isSuccess() {
        return ErrorCode.SUCCESS.getCode().equals(this.code);
    }
}