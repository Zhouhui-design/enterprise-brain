package com.enterprise.brain.common.exception;

import com.enterprise.brain.common.response.ApiResponse;
import com.enterprise.brain.common.response.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.stream.Collectors;

/**
 * 全局异常处理器
 * 统一处理应用中的各类异常，返回标准化的错误响应
 * 
 * @author Enterprise Brain Team
 * @version 1.0.0
 * @since 2024-01-01
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 处理请求参数验证异常
     * 当@Valid注解验证失败时触发
     * 
     * @param ex 参数验证异常
     * @return 错误响应，包含详细的字段验证错误信息
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleValidationExceptions(MethodArgumentNotValidException ex) {
        log.warn("参数验证失败: {}", ex.getMessage());
        
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> String.format("%s: %s", error.getField(), error.getDefaultMessage()))
                .collect(Collectors.joining("; "));
        
        return ApiResponse.error(ErrorCode.PARAMETER_VALIDATION_FAILED, errorMessage);
    }

    /**
     * 处理绑定异常
     * 当数据绑定过程中发生错误时触发
     * 
     * @param ex 绑定异常
     * @return 错误响应，包含绑定错误详情
     */
    @ExceptionHandler(BindException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBindException(BindException ex) {
        log.warn("数据绑定失败: {}", ex.getMessage());
        
        String errorMessage = ex.getFieldErrors().stream()
                .map(error -> String.format("%s: %s", error.getField(), error.getDefaultMessage()))
                .collect(Collectors.joining("; "));
        
        return ApiResponse.error(ErrorCode.PARAMETER_VALIDATION_FAILED, errorMessage);
    }

    /**
     * 处理约束违反异常
     * 当方法级别的验证失败时触发
     * 
     * @param ex 约束违反异常
     * @return 错误响应，包含约束验证失败信息
     */
    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleConstraintViolationException(ConstraintViolationException ex) {
        log.warn("约束验证失败: {}", ex.getMessage());
        
        String errorMessage = ex.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining("; "));
        
        return ApiResponse.error(ErrorCode.CONSTRAINT_VIOLATION, errorMessage);
    }

    /**
     * 处理业务异常
     * 自定义的业务逻辑异常
     * 
     * @param ex 业务异常
     * @return 错误响应，包含业务错误信息
     */
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBusinessException(BusinessException ex) {
        log.warn("业务异常: {}", ex.getMessage());
        return ApiResponse.error(ex.getErrorCode(), ex.getMessage());
    }

    /**
     * 处理访问拒绝异常
     * 当用户无权限访问资源时触发
     * 
     * @param ex 访问拒绝异常
     * @return 错误响应，提示权限不足
     */
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("访问被拒绝: {}", ex.getMessage());
        return ApiResponse.error(ErrorCode.ACCESS_DENIED, "访问被拒绝，权限不足");
    }

    /**
     * 处理系统异常
     * 未被其他异常处理器捕获的系统异常
     * 
     * @param ex 系统异常
     * @return 错误响应，提示系统内部错误
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleSystemException(Exception ex) {
        log.error("系统异常: ", ex);
        return ApiResponse.error(ErrorCode.SYSTEM_ERROR, "系统内部错误，请稍后重试");
    }
}