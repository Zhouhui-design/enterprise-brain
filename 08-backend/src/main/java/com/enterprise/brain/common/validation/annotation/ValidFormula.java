package com.enterprise.brain.common.validation.annotation;

import com.enterprise.brain.common.validation.validator.FormulaValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * 公式验证注解
 * 用于验证公式表达式的格式和语法
 * 
 * @author Enterprise Brain Team
 * @version 1.0.0
 * @since 2024-01-01
 */
@Documented
@Constraint(validatedBy = FormulaValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidFormula {
    
    /**
     * 错误消息模板
     * 
     * @return 错误消息
     */
    String message() default "公式表达式格式不正确";
    
    /**
     * 验证分组
     * 
     * @return 分组数组
     */
    Class<?>[] groups() default {};
    
    /**
     * 载荷信息
     * 
     * @return 载荷数组
     */
    Class<? extends Payload>[] payload() default {};
    
    /**
     * 是否允许为空
     * 
     * @return true表示允许为空，false表示不允许为空
     */
    boolean allowEmpty() default false;
}