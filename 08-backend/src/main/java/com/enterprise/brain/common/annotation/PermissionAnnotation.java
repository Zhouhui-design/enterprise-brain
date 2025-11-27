package com.enterprise.brain.common.annotation;

import java.lang.annotation.*;

/**
 * 权限校验注解
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface PermissionAnnotation {

    /**
     * 需要的权限码
     */
    String[] value() default {};

    /**
     * 权限码数组
     */
    String[] permissions() default {};

    /**
     * 需要的角色
     */
    String[] roles() default {};

    /**
     * 逻辑类型
     */
    LogicalType logical() default LogicalType.AND;

    /**
     * 逻辑类型枚举
     */
    enum LogicalType {
        /**
         * 与（所有权限都需要）
         */
        AND,

        /**
         * 或（任意一个权限即可）
         */
        OR
    }
}
