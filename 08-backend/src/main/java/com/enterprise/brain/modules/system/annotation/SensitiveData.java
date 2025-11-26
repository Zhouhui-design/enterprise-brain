package com.enterprise.brain.modules.system.annotation;

import java.lang.annotation.*;

@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface SensitiveData {
    String type() default "DEFAULT";
}
