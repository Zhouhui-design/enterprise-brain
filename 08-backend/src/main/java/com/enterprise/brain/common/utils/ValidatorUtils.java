package com.enterprise.brain.common.utils;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * 参数校验工具类
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
public class ValidatorUtils {

    private static final Validator VALIDATOR;

    static {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        VALIDATOR = factory.getValidator();
    }

    /**
     * 校验对象
     *
     * @param object 待校验对象
     * @param groups 校验组
     * @return 校验结果
     */
    public static <T> Set<ConstraintViolation<T>> validate(T object, Class<?>... groups) {
        return VALIDATOR.validate(object, groups);
    }

    /**
     * 校验对象，有异常则抛出
     *
     * @param object 待校验对象
     * @param groups 校验组
     */
    public static <T> void validateWithException(T object, Class<?>... groups) {
        Set<ConstraintViolation<T>> violations = validate(object, groups);
        if (!violations.isEmpty()) {
            String message = violations.stream()
                    .map(ConstraintViolation::getMessage)
                    .collect(Collectors.joining("; "));
            throw new IllegalArgumentException(message);
        }
    }

    /**
     * 校验对象，返回校验结果消息
     *
     * @param object 待校验对象
     * @param groups 校验组
     * @return 校验结果消息，无错误返回null
     */
    public static <T> String validateWithMessage(T object, Class<?>... groups) {
        Set<ConstraintViolation<T>> violations = validate(object, groups);
        if (violations.isEmpty()) {
            return null;
        }
        return violations.stream()
                .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                .collect(Collectors.joining("; "));
    }

    /**
     * 校验对象的某个属性
     *
     * @param object       待校验对象
     * @param propertyName 属性名称
     * @param groups       校验组
     * @return 校验结果
     */
    public static <T> Set<ConstraintViolation<T>> validateProperty(T object, String propertyName, Class<?>... groups) {
        return VALIDATOR.validateProperty(object, propertyName, groups);
    }

    /**
     * 校验属性值
     *
     * @param beanType     Bean类型
     * @param propertyName 属性名称
     * @param value        属性值
     * @param groups       校验组
     * @return 校验结果
     */
    public static <T> Set<ConstraintViolation<T>> validateValue(Class<T> beanType, String propertyName, Object value, Class<?>... groups) {
        return VALIDATOR.validateValue(beanType, propertyName, value, groups);
    }

    /**
     * 判断对象是否通过校验
     *
     * @param object 待校验对象
     * @param groups 校验组
     * @return 是否通过校验
     */
    public static <T> boolean isValid(T object, Class<?>... groups) {
        return validate(object, groups).isEmpty();
    }

    /**
     * 校验手机号
     */
    public static boolean isValidPhone(String phone) {
        return StringUtils.isValidPhone(phone);
    }

    /**
     * 校验邮箱
     */
    public static boolean isValidEmail(String email) {
        return StringUtils.isValidEmail(email);
    }

    /**
     * 校验身份证号
     */
    public static boolean isValidIdCard(String idCard) {
        return StringUtils.isValidIdCard(idCard);
    }

    /**
     * 校验是否为数字
     */
    public static boolean isNumeric(String str) {
        return StringUtils.isNumeric(str);
    }

    /**
     * 校验是否为整数
     */
    public static boolean isInteger(String str) {
        return StringUtils.isInteger(str);
    }

    /**
     * 校验字符串长度
     *
     * @param str       字符串
     * @param minLength 最小长度
     * @param maxLength 最大长度
     * @return 是否符合长度要求
     */
    public static boolean isValidLength(String str, int minLength, int maxLength) {
        if (str == null) {
            return false;
        }
        int length = str.length();
        return length >= minLength && length <= maxLength;
    }

    /**
     * 校验是否在指定范围内
     *
     * @param value 值
     * @param min   最小值
     * @param max   最大值
     * @return 是否在范围内
     */
    public static boolean isInRange(Number value, Number min, Number max) {
        if (value == null) {
            return false;
        }
        double val = value.doubleValue();
        return val >= min.doubleValue() && val <= max.doubleValue();
    }

    /**
     * 获取Validator实例
     */
    public static Validator getValidator() {
        return VALIDATOR;
    }

    private ValidatorUtils() {
        throw new IllegalStateException("Utility class");
    }
}
