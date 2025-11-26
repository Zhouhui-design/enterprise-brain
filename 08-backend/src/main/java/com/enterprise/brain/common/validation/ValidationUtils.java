package com.enterprise.brain.common.validation;

import com.enterprise.brain.common.exception.BusinessException;
import com.enterprise.brain.common.response.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;

import java.util.Collection;
import java.util.Objects;
import java.util.function.Supplier;

/**
 * 验证工具类
 * 提供常用的参数验证方法，简化业务代码中的验证逻辑
 * 
 * @author Enterprise Brain Team
 * @version 1.0.0
 * @since 2024-01-01
 */
@Slf4j
public class ValidationUtils {
    
    private ValidationUtils() {
        // 私有构造函数，防止实例化
    }
    
    /**
     * 验证对象不为空
     * 
     * @param object 要验证的对象
     * @param fieldName 字段名称，用于错误消息
     * @throws BusinessException 验证失败时抛出
     */
    public static void notNull(Object object, String fieldName) {
        if (object == null) {
            String message = String.format("%s不能为空", fieldName);
            log.warn("验证失败: {}", message);
            throw new BusinessException(ErrorCode.PARAMETER_VALIDATION_FAILED, message);
        }
    }
    
    /**
     * 验证字符串不为空且长度符合要求
     * 
     * @param text 要验证的字符串
     * @param fieldName 字段名称
     * @param minLength 最小长度
     * @param maxLength 最大长度
     * @throws BusinessException 验证失败时抛出
     */
    public static void notBlank(String text, String fieldName, int minLength, int maxLength) {
        if (!StringUtils.hasText(text)) {
            String message = String.format("%s不能为空", fieldName);
            log.warn("验证失败: {}", message);
            throw new BusinessException(ErrorCode.PARAMETER_VALIDATION_FAILED, message);
        }
        
        if (text.length() < minLength || text.length() > maxLength) {
            String message = String.format("%s长度必须在%d-%d字符之间", fieldName, minLength, maxLength);
            log.warn("验证失败: {}", message);
            throw new BusinessException(ErrorCode.PARAMETER_VALIDATION_FAILED, message);
        }
    }
    
    /**
     * 验证数值范围
     * 
     * @param number 要验证的数值
     * @param fieldName 字段名称
     * @param min 最小值
     * @param max 最大值
     * @throws BusinessException 验证失败时抛出
     */
    public static void inRange(Number number, String fieldName, double min, double max) {
        notNull(number, fieldName);
        
        if (number.doubleValue() < min || number.doubleValue() > max) {
            String message = String.format("%s必须在%s-%s之间", fieldName, min, max);
            log.warn("验证失败: {}", message);
            throw new BusinessException(ErrorCode.PARAMETER_OUT_OF_RANGE, message);
        }
    }
    
    /**
     * 验证集合不为空
     * 
     * @param collection 要验证的集合
     * @param fieldName 字段名称
     * @throws BusinessException 验证失败时抛出
     */
    public static void notEmpty(Collection<?> collection, String fieldName) {
        notNull(collection, fieldName);
        
        if (collection.isEmpty()) {
            String message = String.format("%s不能为空集合", fieldName);
            log.warn("验证失败: {}", message);
            throw new BusinessException(ErrorCode.PARAMETER_VALIDATION_FAILED, message);
        }
    }
    
    /**
     * 验证数组不为空
     * 
     * @param array 要验证的数组
     * @param fieldName 字段名称
     * @throws BusinessException 验证失败时抛出
     */
    public static void notEmpty(Object[] array, String fieldName) {
        notNull(array, fieldName);
        
        if (array.length == 0) {
            String message = String.format("%s不能为空数组", fieldName);
            log.warn("验证失败: {}", message);
            throw new BusinessException(ErrorCode.PARAMETER_VALIDATION_FAILED, message);
        }
    }
    
    /**
     * 验证邮箱格式
     * 
     * @param email 要验证的邮箱
     * @param fieldName 字段名称
     * @throws BusinessException 验证失败时抛出
     */
    public static void validEmail(String email, String fieldName) {
        notBlank(email, fieldName, 1, 100);
        
        String emailRegex = "^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$";
        if (!email.matches(emailRegex)) {
            String message = String.format("%s格式不正确", fieldName);
            log.warn("验证失败: {}", message);
            throw new BusinessException(ErrorCode.INVALID_PARAMETER_FORMAT, message);
        }
    }
    
    /**
     * 验证手机号格式
     * 
     * @param phone 要验证的手机号
     * @param fieldName 字段名称
     * @throws BusinessException 验证失败时抛出
     */
    public static void validPhone(String phone, String fieldName) {
        notBlank(phone, fieldName, 1, 20);
        
        String phoneRegex = "^1[3-9]\\d{9}$";
        if (!phone.matches(phoneRegex)) {
            String message = String.format("%s格式不正确", fieldName);
            log.warn("验证失败: {}", message);
            throw new BusinessException(ErrorCode.INVALID_PARAMETER_FORMAT, message);
        }
    }
    
    /**
     * 验证ID格式（正整数）
     * 
     * @param id 要验证的ID
     * @param fieldName 字段名称
     * @throws BusinessException 验证失败时抛出
     */
    public static void validId(Long id, String fieldName) {
        notNull(id, fieldName);
        
        if (id <= 0) {
            String message = String.format("%s必须是正整数", fieldName);
            log.warn("验证失败: {}", message);
            throw new BusinessException(ErrorCode.PARAMETER_OUT_OF_RANGE, message);
        }
    }
    
    /**
     * 验证条件是否为真
     * 
     * @param condition 要验证的条件
     * @param errorMessage 错误消息
     * @throws BusinessException 验证失败时抛出
     */
    public static void isTrue(boolean condition, String errorMessage) {
        if (!condition) {
            log.warn("验证失败: {}", errorMessage);
            throw new BusinessException(ErrorCode.BUSINESS_ERROR, errorMessage);
        }
    }
    
    /**
     * 验证条件是否为假
     * 
     * @param condition 要验证的条件
     * @param errorMessage 错误消息
     * @throws BusinessException 验证失败时抛出
     */
    public static void isFalse(boolean condition, String errorMessage) {
        if (condition) {
            log.warn("验证失败: {}", errorMessage);
            throw new BusinessException(ErrorCode.BUSINESS_ERROR, errorMessage);
        }
    }
    
    /**
     * 验证两个对象是否相等
     * 
     * @param expected 期望值
     * @param actual 实际值
     * @param fieldName 字段名称
     * @throws BusinessException 验证失败时抛出
     */
    public static void equals(Object expected, Object actual, String fieldName) {
        if (!Objects.equals(expected, actual)) {
            String message = String.format("%s值不匹配，期望：%s，实际：%s", fieldName, expected, actual);
            log.warn("验证失败: {}", message);
            throw new BusinessException(ErrorCode.BUSINESS_ERROR, message);
        }
    }
    
    /**
     * 验证自定义条件
     * 
     * @param condition 验证条件
     * @param errorMessageSupplier 错误消息提供者
     * @throws BusinessException 验证失败时抛出
     */
    public static void validate(boolean condition, Supplier<String> errorMessageSupplier) {
        if (!condition) {
            String errorMessage = errorMessageSupplier.get();
            log.warn("验证失败: {}", errorMessage);
            throw new BusinessException(ErrorCode.BUSINESS_ERROR, errorMessage);
        }
    }
    
    /**
     * 验证字符串匹配正则表达式
     * 
     * @param text 要验证的字符串
     * @param regex 正则表达式
     * @param fieldName 字段名称
     * @throws BusinessException 验证失败时抛出
     */
    public static void matches(String text, String regex, String fieldName) {
        notBlank(text, fieldName, 1, Integer.MAX_VALUE);
        
        if (!text.matches(regex)) {
            String message = String.format("%s格式不符合要求", fieldName);
            log.warn("验证失败: {}", message);
            throw new BusinessException(ErrorCode.INVALID_PARAMETER_FORMAT, message);
        }
    }
    
    /**
     * 验证枚举值是否在允许范围内
     * 
     * @param value 要验证的值
     * @param allowedValues 允许的值列表
     * @param fieldName 字段名称
     * @param <T> 枚举类型
     * @throws BusinessException 验证失败时抛出
     */
    public static <T> void inEnum(T value, T[] allowedValues, String fieldName) {
        notNull(value, fieldName);
        notNull(allowedValues, "allowedValues");
        
        for (T allowedValue : allowedValues) {
            if (Objects.equals(value, allowedValue)) {
                return;
            }
        }
        
        String message = String.format("%s值不在允许范围内", fieldName);
        log.warn("验证失败: {}", message);
        throw new BusinessException(ErrorCode.PARAMETER_OUT_OF_RANGE, message);
    }
    
    /**
     * 验证URL格式
     * 
     * @param url 要验证的URL
     * @param fieldName 字段名称
     * @throws BusinessException 验证失败时抛出
     */
    public static void validUrl(String url, String fieldName) {
        notBlank(url, fieldName, 1, 500);
        
        String urlRegex = "^(https?|ftp)://[^\\s/$.?#].[^\\s]*$";
        if (!url.matches(urlRegex)) {
            String message = String.format("%s格式不正确", fieldName);
            log.warn("验证失败: {}", message);
            throw new BusinessException(ErrorCode.INVALID_PARAMETER_FORMAT, message);
        }
    }
    
    /**
     * 验证日期格式（yyyy-MM-dd）
     * 
     * @param date 要验证的日期字符串
     * @param fieldName 字段名称
     * @throws BusinessException 验证失败时抛出
     */
    public static void validDate(String date, String fieldName) {
        notBlank(date, fieldName, 1, 20);
        
        String dateRegex = "^\\d{4}-\\d{2}-\\d{2}$";
        if (!date.matches(dateRegex)) {
            String message = String.format("%s格式不正确，应为yyyy-MM-dd格式", fieldName);
            log.warn("验证失败: {}", message);
            throw new BusinessException(ErrorCode.INVALID_PARAMETER_FORMAT, message);
        }
    }
}