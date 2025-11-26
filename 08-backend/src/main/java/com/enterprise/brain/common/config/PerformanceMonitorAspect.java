package com.enterprise.brain.common.config;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * 性能监控切面
 * 监控方法执行时间，记录性能指标
 * 
 * @author Enterprise Brain Team
 * @version 2.0.0
 * @since 2024-01-01
 */
@Slf4j
@Aspect
@Component
public class PerformanceMonitorAspect {
    
    @Autowired
    private MeterRegistry meterRegistry;
    
    /**
     * 监控Controller方法的执行时间
     * 
     * @param joinPoint 切入点
     * @return 方法执行结果
     * @throws Throwable 执行异常
     */
    @Around("execution(* com.enterprise.brain.modules.smarttable.controller.*.*(..))")
    public Object monitorControllerPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        return monitorPerformance(joinPoint, "controller");
    }
    
    /**
     * 监控Service方法的执行时间
     * 
     * @param joinPoint 切入点
     * @return 方法执行结果
     * @throws Throwable 执行异常
     */
    @Around("execution(* com.enterprise.brain.modules.smarttable.service.*.*(..))")
    public Object monitorServicePerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        return monitorPerformance(joinPoint, "service");
    }
    
    /**
     * 通用的性能监控方法
     * 
     * @param joinPoint 切入点
     * @param layer 层次（controller/service）
     * @return 方法执行结果
     * @throws Throwable 执行异常
     */
    private Object monitorPerformance(ProceedingJoinPoint joinPoint, String layer) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String metricName = String.format("%s.%s.%s", layer, className, methodName);
        
        Timer.Sample sample = Timer.start(meterRegistry);
        long startTime = System.currentTimeMillis();
        
        try {
            Object result = joinPoint.proceed();
            
            // 记录执行时间
            long executionTime = System.currentTimeMillis() - startTime;
            
            // 记录到Micrometer
            Timer timer = Timer.builder("method.execution.time")
                .tag("layer", layer)
                .tag("class", className)
                .tag("method", methodName)
                .description("Method execution time in milliseconds")
                .register(meterRegistry);
            sample.stop(timer);
            
            // 记录日志（只记录慢方法）
            if (executionTime > 1000) { // 超过1秒的方法
                log.warn("Slow method detected: {}.{} executed in {} ms", 
                        className, methodName, executionTime);
            } else {
                log.debug("Method executed: {}.{} in {} ms", 
                        className, methodName, executionTime);
            }
            
            return result;
            
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            log.error("Method execution failed: {}.{} in {} ms, error: {}", 
                    className, methodName, executionTime, e.getMessage());
            
            // 记录错误指标
            meterRegistry.counter("method.execution.error",
                "layer", layer,
                "class", className,
                "method", methodName,
                "exception", e.getClass().getSimpleName()
            ).increment();
            
            throw e;
        }
    }
}