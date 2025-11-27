package com.enterprise.brain.common.exception;

import com.enterprise.brain.common.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 全局异常处理器
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 处理业务异常
     */
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Object> handleBusinessException(BusinessException e, HttpServletRequest request) {
        log.error("业务异常: {} - URI: {}", e.getMessage(), request.getRequestURI(), e);
        return ApiResponse.fail(e.getCode(), e.getMessage());
    }

    /**
     * 处理参数校验异常（@Valid）
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Object> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        log.error("参数校验失败: {}", message, e);
        return ApiResponse.fail("VALIDATION_ERROR", message);
    }

    /**
     * 处理参数绑定异常
     */
    @ExceptionHandler(BindException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Object> handleBindException(BindException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining("; "));
        log.error("参数绑定失败: {}", message, e);
        return ApiResponse.fail("BIND_ERROR", message);
    }

    /**
     * 处理约束违反异常（@Validated）
     */
    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Object> handleConstraintViolationException(ConstraintViolationException e) {
        Set<ConstraintViolation<?>> violations = e.getConstraintViolations();
        String message = violations.stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining("; "));
        log.error("约束违反: {}", message, e);
        return ApiResponse.fail("CONSTRAINT_VIOLATION", message);
    }

    /**
     * 处理非法参数异常
     */
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Object> handleIllegalArgumentException(IllegalArgumentException e) {
        log.error("非法参数: {}", e.getMessage(), e);
        return ApiResponse.fail("ILLEGAL_ARGUMENT", e.getMessage());
    }

    /**
     * 处理空指针异常
     */
    @ExceptionHandler(NullPointerException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Object> handleNullPointerException(NullPointerException e, HttpServletRequest request) {
        log.error("空指针异常 - URI: {}", request.getRequestURI(), e);
        return ApiResponse.fail("NULL_POINTER", "系统内部错误，请联系管理员");
    }

    /**
     * 处理运行时异常
     */
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Object> handleRuntimeException(RuntimeException e, HttpServletRequest request) {
        log.error("运行时异常 - URI: {}", request.getRequestURI(), e);
        return ApiResponse.fail("RUNTIME_ERROR", "系统运行异常: " + e.getMessage());
    }

    /**
     * 处理所有未捕获的异常
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Object> handleException(Exception e, HttpServletRequest request) {
        log.error("未知异常 - URI: {}", request.getRequestURI(), e);
        return ApiResponse.fail("SYSTEM_ERROR", "系统错误，请稍后重试");
    }
}
