package com.enterprise.brain.modules.integration.ecommerce.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 通用同步响应DTO
 * 
 * @author Enterprise Brain Team
 * @version 1.0
 */
@Data
public class SyncResponse {

    /**
     * 同步任务ID
     */
    private String taskId;

    /**
     * 同步状态
     */
    private String status;

    /**
     * 同步类型
     */
    private String syncType;

    /**
     * 同步方向
     */
    private String syncDirection;

    /**
     * 开始时间
     */
    private LocalDateTime startTime;

    /**
     * 结束时间
     */
    private LocalDateTime endTime;

    /**
     * 耗时（毫秒）
     */
    private Long duration;

    /**
     * 总数量
     */
    private Integer totalCount;

    /**
     * 成功数量
     */
    private Integer successCount;

    /**
     * 失败数量
     */
    private Integer failCount;

    /**
     * 跳过数量
     */
    private Integer skipCount;

    /**
     * 冲突数量
     */
    private Integer conflictCount;

    /**
     * 成功率
     */
    private Double successRate;

    /**
     * 错误信息列表
     */
    private List<ErrorInfo> errors;

    /**
     * 同步结果列表
     */
    private List<SyncResult> results;

    /**
     * 统计信息
     */
    private SyncStatistics statistics;

    /**
     * 下次同步建议时间
     */
    private LocalDateTime nextSyncSuggestion;

    /**
     * 扩展信息
     */
    private Map<String, Object> extraInfo;

    /**
     * 同步状态枚举
     */
    public static class Status {
        public static final String PENDING = "PENDING";       // 待处理
        public static final String RUNNING = "RUNNING";       // 运行中
        public static final String SUCCESS = "SUCCESS";       // 成功
        public static final String FAILED = "FAILED";         // 失败
        public static final String PARTIAL_SUCCESS = "PARTIAL_SUCCESS"; // 部分成功
        public static final String CANCELLED = "CANCELLED";     // 已取消
        public static final String TIMEOUT = "TIMEOUT";         // 超时
    }

    /**
     * 错误信息类
     */
    @Data
    public static class ErrorInfo {
        private String errorCode;
        private String errorMessage;
        private String errorDetail;
        private String targetId;
        private String targetType;
        private Integer retryCount;
        private LocalDateTime errorTime;
        private Map<String, Object> errorContext;
    }

    /**
     * 同步结果类
     */
    @Data
    public static class SyncResult {
        private String targetId;
        private String targetType;
        private String status;
        private String message;
        private LocalDateTime syncTime;
        private Map<String, Object> resultData;
        private Map<String, Object> extraData;
    }

    /**
     * 统计信息类
     */
    @Data
    public static class SyncStatistics {
        private Map<String, Integer> statusCount;
        private Map<String, Integer> typeCount;
        private Map<String, Double> timeDistribution;
        private List<String> topErrors;
        private Map<String, Object> performanceMetrics;
    }

    /**
     * 检查是否成功
     */
    public boolean isSuccess() {
        return Status.SUCCESS.equals(status) || Status.PARTIAL_SUCCESS.equals(status);
    }

    /**
     * 检查是否失败
     */
    public boolean isFailed() {
        return Status.FAILED.equals(status) || Status.TIMEOUT.equals(status);
    }

    /**
     * 检查是否运行中
     */
    public boolean isRunning() {
        return Status.RUNNING.equals(status);
    }

    /**
     * 检查是否完成
     */
    public boolean isCompleted() {
        return !Status.PENDING.equals(status) && !Status.RUNNING.equals(status);
    }

    /**
     * 检查是否有错误
     */
    public boolean hasErrors() {
        return (errors != null && !errors.isEmpty()) || 
               (failCount != null && failCount > 0);
    }

    /**
     * 计算成功率
     */
    public void calculateSuccessRate() {
        if (totalCount != null && totalCount > 0) {
            int success = successCount != null ? successCount : 0;
            this.successRate = (double) success / totalCount * 100;
        }
    }

    /**
     * 添加错误信息
     */
    public void addError(String errorCode, String errorMessage, String targetId, String targetType) {
        if (errors == null) {
            errors = new java.util.ArrayList<>();
        }
        
        ErrorInfo errorInfo = new ErrorInfo();
        errorInfo.setErrorCode(errorCode);
        errorInfo.setErrorMessage(errorMessage);
        errorInfo.setTargetId(targetId);
        errorInfo.setTargetType(targetType);
        errorInfo.setErrorTime(LocalDateTime.now());
        errorInfo.setRetryCount(0);
        
        errors.add(errorInfo);
        
        // 更新失败计数
        this.failCount = (this.failCount != null ? this.failCount : 0) + 1;
    }

    /**
     * 添加同步结果
     */
    public void addResult(String targetId, String targetType, String resultStatus, String message) {
        if (results == null) {
            results = new java.util.ArrayList<>();
        }
        
        SyncResult result = new SyncResult();
        result.setTargetId(targetId);
        result.setTargetType(targetType);
        result.setStatus(resultStatus);
        result.setMessage(message);
        result.setSyncTime(LocalDateTime.now());
        
        results.add(result);
    }

    /**
     * 更新计数统计
     */
    public void updateCountStatistics() {
        if (results == null || results.isEmpty()) {
            return;
        }
        
        int success = 0, failed = 0, skipped = 0, conflicted = 0;
        
        for (SyncResult result : results) {
            String resultStatus = result.getStatus();
            if ("SUCCESS".equals(resultStatus)) {
                success++;
            } else if ("FAILED".equals(resultStatus)) {
                failed++;
            } else if ("SKIPPED".equals(resultStatus)) {
                skipped++;
            } else if ("CONFLICT".equals(resultStatus)) {
                conflicted++;
            }
        }
        
        this.totalCount = results.size();
        this.successCount = success;
        this.failCount = failed;
        this.skipCount = skipped;
        this.conflictCount = conflicted;
        
        calculateSuccessRate();
    }

    /**
     * 构建成功响应
     */
    public static SyncResponse buildSuccessResponse(String taskId, String syncType, int totalCount) {
        SyncResponse response = new SyncResponse();
        response.setTaskId(taskId);
        response.setStatus(Status.SUCCESS);
        response.setSyncType(syncType);
        response.setTotalCount(totalCount);
        response.setSuccessCount(totalCount);
        response.setFailCount(0);
        response.setSkipCount(0);
        response.setConflictCount(0);
        response.setSuccessRate(100.0);
        return response;
    }

    /**
     * 构建失败响应
     */
    public static SyncResponse buildFailResponse(String taskId, String syncType, String errorCode, String errorMessage) {
        SyncResponse response = new SyncResponse();
        response.setTaskId(taskId);
        response.setStatus(Status.FAILED);
        response.setSyncType(syncType);
        response.setTotalCount(0);
        response.setSuccessCount(0);
        response.setFailCount(0);
        response.setSkipCount(0);
        response.setConflictCount(0);
        response.setSuccessRate(0.0);
        
        response.addError(errorCode, errorMessage, null, null);
        return response;
    }

    /**
     * 构建部分成功响应
     */
    public static SyncResponse buildPartialSuccessResponse(String taskId, String syncType, 
            int totalCount, int successCount, List<ErrorInfo> errors) {
        SyncResponse response = new SyncResponse();
        response.setTaskId(taskId);
        response.setStatus(Status.PARTIAL_SUCCESS);
        response.setSyncType(syncType);
        response.setTotalCount(totalCount);
        response.setSuccessCount(successCount);
        response.setFailCount(errors != null ? errors.size() : 0);
        response.setSkipCount(0);
        response.setConflictCount(0);
        response.setErrors(errors);
        
        response.calculateSuccessRate();
        return response;
    }

    /**
     * 构建运行中响应
     */
    public static SyncResponse buildRunningResponse(String taskId, String syncType, LocalDateTime startTime) {
        SyncResponse response = new SyncResponse();
        response.setTaskId(taskId);
        response.setStatus(Status.RUNNING);
        response.setSyncType(syncType);
        response.setStartTime(startTime);
        return response;
    }
}