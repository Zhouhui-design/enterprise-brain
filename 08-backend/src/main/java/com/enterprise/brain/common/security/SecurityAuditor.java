package com.enterprise.brain.common.security;

import com.enterprise.brain.common.utils.JsonUtils;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 安全审计器
 * 记录系统操作日志、安全事件、异常访问等
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Slf4j
@Aspect
@Component
public class SecurityAuditor {

    /**
     * 审计日志切面 - 所有Controller方法
     */
    @Pointcut("execution(* com.enterprise.brain..controller..*.*(..))")
    public void controllerAudit() {
    }

    /**
     * 安全相关操作切面
     */
    @Pointcut("@annotation(com.enterprise.brain.common.annotation.LogAnnotation)")
    public void securityOperation() {
    }

    /**
     * 环绕通知 - 记录操作日志
     */
    @Around("controllerAudit()")
    public Object auditAround(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        // 获取请求信息
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = attributes != null ? attributes.getRequest() : null;
        
        // 构建审计日志
        AuditLog auditLog = buildAuditLog(joinPoint, request);
        auditLog.setStartTime(LocalDateTime.now());
        
        Object result = null;
        try {
            // 执行目标方法
            result = joinPoint.proceed();
            auditLog.setSuccess(true);
            auditLog.setResultData(result);
            
            return result;
        } catch (Exception e) {
            auditLog.setSuccess(false);
            auditLog.setErrorMessage(e.getMessage());
            auditLog.setException(e.getClass().getName());
            
            // 记录异常审计
            logSecurityException(auditLog, e);
            throw e;
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            auditLog.setDuration(duration);
            auditLog.setEndTime(LocalDateTime.now());
            
            // 记录审计日志
            logAudit(auditLog);
        }
    }

    /**
     * 前置通知 - 记录方法开始
     */
    @Before("securityOperation()")
    public void beforeSecurityOperation(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        
        log.info("安全操作开始 - 类: {}, 方法: {}", className, methodName);
    }

    /**
     * 后置通知 - 记录方法成功
     */
    @AfterReturning(pointcut = "securityOperation()", returning = "result")
    public void afterSecurityOperation(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        
        log.info("安全操作成功 - 类: {}, 方法: {}, 结果: {}", className, methodName, result);
    }

    /**
     * 异常通知 - 记录方法异常
     */
    @AfterThrowing(pointcut = "securityOperation()", throwing = "exception")
    public void afterSecurityOperationThrowing(JoinPoint joinPoint, Exception exception) {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        
        log.error("安全操作失败 - 类: {}, 方法: {}, 异常: {}", className, methodName, exception.getMessage(), exception);
        
        // 记录安全异常事件
        logSecurityEvent("SECURITY_OPERATION_FAILED", className + "." + methodName, exception.getMessage());
    }

    /**
     * 构建审计日志
     */
    private AuditLog buildAuditLog(ProceedingJoinPoint joinPoint, HttpServletRequest request) {
        AuditLog auditLog = new AuditLog();
        
        // 方法信息
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        auditLog.setClassName(joinPoint.getTarget().getClass().getName());
        auditLog.setMethodName(signature.getName());
        
        // 请求信息
        if (request != null) {
            auditLog.setRequestUrl(request.getRequestURI());
            auditLog.setRequestMethod(request.getMethod());
            auditLog.setRemoteAddr(getRemoteAddr(request));
            auditLog.setUserAgent(request.getHeader("User-Agent"));
        }
        
        // 参数信息
        Object[] args = joinPoint.getArgs();
        if (args != null && args.length > 0) {
            try {
                auditLog.setRequestParams(JsonUtils.toJson(args));
            } catch (Exception e) {
                auditLog.setRequestParams("参数序列化失败");
            }
        }
        
        // 用户信息（从Security Context获取）
        auditLog.setUserId(getCurrentUserId());
        auditLog.setUsername(getCurrentUsername());
        
        return auditLog;
    }

    /**
     * 记录审计日志
     */
    private void logAudit(AuditLog auditLog) {
        try {
            if (auditLog.isSuccess()) {
                log.info("审计日志 - 成功 | 用户: {} | 方法: {} | URL: {} | 耗时: {}ms",
                        auditLog.getUsername(),
                        auditLog.getMethodName(),
                        auditLog.getRequestUrl(),
                        auditLog.getDuration());
            } else {
                log.warn("审计日志 - 失败 | 用户: {} | 方法: {} | URL: {} | 异常: {} | 耗时: {}ms",
                        auditLog.getUsername(),
                        auditLog.getMethodName(),
                        auditLog.getRequestUrl(),
                        auditLog.getException(),
                        auditLog.getDuration());
            }
            
            // TODO: 将审计日志持久化到数据库
            // auditLogRepository.save(auditLog);
            
        } catch (Exception e) {
            log.error("记录审计日志失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 记录安全事件
     */
    public void logSecurityEvent(String eventType, String eventData, String description) {
        SecurityEvent event = new SecurityEvent();
        event.setEventType(eventType);
        event.setEventData(eventData);
        event.setDescription(description);
        event.setOccurTime(LocalDateTime.now());
        event.setUserId(getCurrentUserId());
        event.setUsername(getCurrentUsername());
        event.setIpAddress(getCurrentIpAddress());
        
        log.warn("安全事件 - 类型: {} | 用户: {} | IP: {} | 描述: {}",
                eventType, event.getUsername(), event.getIpAddress(), description);
        
        // TODO: 将安全事件持久化到数据库
        // securityEventRepository.save(event);
    }

    /**
     * 记录安全异常
     */
    private void logSecurityException(AuditLog auditLog, Exception exception) {
        logSecurityEvent(
                "SECURITY_EXCEPTION",
                auditLog.getMethodName(),
                exception.getMessage()
        );
    }

    /**
     * 记录登录事件
     */
    public void logLoginEvent(String username, boolean success, String ip, String reason) {
        String eventType = success ? "LOGIN_SUCCESS" : "LOGIN_FAILED";
        String description = success ? "登录成功" : "登录失败: " + reason;
        
        log.info("登录事件 - 用户: {} | IP: {} | 结果: {}", username, ip, description);
        
        logSecurityEvent(eventType, username, description);
    }

    /**
     * 记录登出事件
     */
    public void logLogoutEvent(String username, String ip) {
        log.info("登出事件 - 用户: {} | IP: {}", username, ip);
        logSecurityEvent("LOGOUT", username, "用户登出");
    }

    /**
     * 记录权限拒绝事件
     */
    public void logAccessDenied(String username, String resource, String ip) {
        log.warn("权限拒绝 - 用户: {} | 资源: {} | IP: {}", username, resource, ip);
        logSecurityEvent("ACCESS_DENIED", resource, "权限不足");
    }

    /**
     * 记录数据访问事件
     */
    public void logDataAccess(String dataType, String operation, String dataId) {
        log.info("数据访问 - 类型: {} | 操作: {} | ID: {}", dataType, operation, dataId);
        logSecurityEvent("DATA_ACCESS", dataType + ":" + dataId, operation);
    }

    /**
     * 获取当前用户ID
     */
    private Long getCurrentUserId() {
        // TODO: 从Security Context获取
        return 1L;
    }

    /**
     * 获取当前用户名
     */
    private String getCurrentUsername() {
        // TODO: 从Security Context获取
        return "admin";
    }

    /**
     * 获取当前IP地址
     */
    private String getCurrentIpAddress() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            return getRemoteAddr(attributes.getRequest());
        }
        return "unknown";
    }

    /**
     * 获取真实IP地址
     */
    private String getRemoteAddr(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }

    /**
     * 审计日志实体
     */
    private static class AuditLog {
        private String className;
        private String methodName;
        private String requestUrl;
        private String requestMethod;
        private String requestParams;
        private String remoteAddr;
        private String userAgent;
        private Long userId;
        private String username;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Long duration;
        private boolean success;
        private Object resultData;
        private String errorMessage;
        private String exception;

        // Getters and Setters
        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }
        public String getMethodName() { return methodName; }
        public void setMethodName(String methodName) { this.methodName = methodName; }
        public String getRequestUrl() { return requestUrl; }
        public void setRequestUrl(String requestUrl) { this.requestUrl = requestUrl; }
        public String getRequestMethod() { return requestMethod; }
        public void setRequestMethod(String requestMethod) { this.requestMethod = requestMethod; }
        public String getRequestParams() { return requestParams; }
        public void setRequestParams(String requestParams) { this.requestParams = requestParams; }
        public String getRemoteAddr() { return remoteAddr; }
        public void setRemoteAddr(String remoteAddr) { this.remoteAddr = remoteAddr; }
        public String getUserAgent() { return userAgent; }
        public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public LocalDateTime getStartTime() { return startTime; }
        public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
        public LocalDateTime getEndTime() { return endTime; }
        public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
        public Long getDuration() { return duration; }
        public void setDuration(Long duration) { this.duration = duration; }
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public Object getResultData() { return resultData; }
        public void setResultData(Object resultData) { this.resultData = resultData; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
        public String getException() { return exception; }
        public void setException(String exception) { this.exception = exception; }
    }

    /**
     * 安全事件实体
     */
    private static class SecurityEvent {
        private String eventType;
        private String eventData;
        private String description;
        private LocalDateTime occurTime;
        private Long userId;
        private String username;
        private String ipAddress;

        // Getters and Setters
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getEventData() { return eventData; }
        public void setEventData(String eventData) { this.eventData = eventData; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public LocalDateTime getOccurTime() { return occurTime; }
        public void setOccurTime(LocalDateTime occurTime) { this.occurTime = occurTime; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getIpAddress() { return ipAddress; }
        public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    }
}
