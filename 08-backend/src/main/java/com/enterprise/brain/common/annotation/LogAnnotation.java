package com.enterprise.brain.common.annotation;

import java.lang.annotation.*;

/**
 * 操作日志注解
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface LogAnnotation {

    /**
     * 操作模块
     */
    String module() default "";

    /**
     * 操作类型
     */
    OperationType type() default OperationType.OTHER;

    /**
     * 操作描述
     */
    String description() default "";

    /**
     * 是否记录请求参数
     */
    boolean recordParams() default true;

    /**
     * 是否记录返回结果
     */
    boolean recordResult() default true;

    /**
     * 是否记录异常信息
     */
    boolean recordException() default true;

    /**
     * 操作类型枚举
     */
    enum OperationType {
        /**
         * 查询
         */
        QUERY,

        /**
         * 新增
         */
        INSERT,

        /**
         * 修改
         */
        UPDATE,

        /**
         * 删除
         */
        DELETE,

        /**
         * 导入
         */
        IMPORT,

        /**
         * 导出
         */
        EXPORT,

        /**
         * 登录
         */
        LOGIN,

        /**
         * 登出
         */
        LOGOUT,

        /**
         * 其他
         */
        OTHER
    }
}
