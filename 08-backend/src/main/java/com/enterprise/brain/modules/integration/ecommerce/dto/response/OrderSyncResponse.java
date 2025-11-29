package com.enterprise.brain.modules.integration.ecommerce.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 订单同步响应DTO
 * 
 * @author Enterprise Brain Team
 * @version 1.0
 */
@Data
public class OrderSyncResponse {

    /**
     * 同步任务ID
     */
    private String taskId;

    /**
     * 同步状态
     */
    private String status;

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
     * 总订单数
     */
    private Integer totalOrders;

    /**
     * 成功订单数
     */
    private Integer successOrders;

    /**
     * 失败订单数
     */
    private Integer failedOrders;

    /**
     * 跳过订单数
     */
    private Integer skippedOrders;

    /**
     * 冲突订单数
     */
    private Integer conflictOrders;

    /**
     * 订单列表
     */
    private List<OrderInfo> orderList;

    /**
     * 错误信息列表
     */
    private List<OrderError> errorList;

    /**
     * 同步统计
     */
    private OrderStatistics statistics;

    /**
     * 扩展信息
     */
    private Map<String, Object> extraInfo;

    /**
     * 订单信息类
     */
    @Data
    public static class OrderInfo {
        private String platformOrderId;
        private String orderNumber;
        private String status;
        private String message;
        private LocalDateTime syncTime;
        private BigDecimal orderAmount;
        private String buyerInfo;
        private Map<String, Object> orderData;
    }

    /**
     * 订单错误类
     */
    @Data
    public static class OrderError {
        private String platformOrderId;
        private String orderNumber;
        private String errorCode;
        private String errorMessage;
        private String errorDetail;
        private Integer retryCount;
        private LocalDateTime errorTime;
        private Map<String, Object> errorContext;
    }

    /**
     * 订单统计类
     */
    @Data
    public static class OrderStatistics {
        private Map<String, Integer> statusCount;
        private Map<String, BigDecimal> statusAmount;
        private Map<String, Integer> paymentStatusCount;
        private Map<String, Integer> shippingStatusCount;
        private List<String> topErrorMessages;
        private Map<String, Object> performanceMetrics;
    }

    /**
     * 检查是否成功
     */
    public boolean isSuccess() {
        return "SUCCESS".equals(status) || "PARTIAL_SUCCESS".equals(status);
    }

    /**
     * 检查是否失败
     */
    public boolean isFailed() {
        return "FAILED".equals(status) || "TIMEOUT".equals(status);
    }

    /**
     * 检查是否有错误
     */
    public boolean hasErrors() {
        return (errorList != null && !errorList.isEmpty()) || 
               (failedOrders != null && failedOrders > 0);
    }

    /**
     * 获取成功率
     */
    public Double getSuccessRate() {
        if (totalOrders != null && totalOrders > 0) {
            int success = successOrders != null ? successOrders : 0;
            return (double) success / totalOrders * 100;
        }
        return 0.0;
    }

    /**
     * 添加错误信息
     */
    public void addError(String platformOrderId, String orderNumber, 
            String errorCode, String errorMessage) {
        if (errorList == null) {
            errorList = new java.util.ArrayList<>();
        }
        
        OrderError error = new OrderError();
        error.setPlatformOrderId(platformOrderId);
        error.setOrderNumber(orderNumber);
        error.setErrorCode(errorCode);
        error.setErrorMessage(errorMessage);
        error.setErrorTime(LocalDateTime.now());
        error.setRetryCount(0);
        
        errorList.add(error);
        
        // 更新失败计数
        this.failedOrders = (this.failedOrders != null ? this.failedOrders : 0) + 1;
    }

    /**
     * 添加订单信息
     */
    public void addOrder(String platformOrderId, String orderNumber, 
            String status, String message, BigDecimal orderAmount) {
        if (orderList == null) {
            orderList = new java.util.ArrayList<>();
        }
        
        OrderInfo orderInfo = new OrderInfo();
        orderInfo.setPlatformOrderId(platformOrderId);
        orderInfo.setOrderNumber(orderNumber);
        orderInfo.setStatus(status);
        orderInfo.setMessage(message);
        orderInfo.setSyncTime(LocalDateTime.now());
        orderInfo.setOrderAmount(orderAmount);
        
        orderList.add(orderInfo);
        
        // 更新总计数
        this.totalOrders = (this.totalOrders != null ? this.totalOrders : 0) + 1;
        
        // 更新状态计数
        if ("SUCCESS".equals(status)) {
            this.successOrders = (this.successOrders != null ? this.successOrders : 0) + 1;
        } else if ("FAILED".equals(status)) {
            this.failedOrders = (this.failedOrders != null ? this.failedOrders : 0) + 1;
        } else if ("SKIPPED".equals(status)) {
            this.skippedOrders = (this.skippedOrders != null ? this.skippedOrders : 0) + 1;
        } else if ("CONFLICT".equals(status)) {
            this.conflictOrders = (this.conflictOrders != null ? this.conflictOrders : 0) + 1;
        }
    }

    /**
     * 构建成功响应
     */
    public static OrderSyncResponse buildSuccessResponse(String taskId, int totalOrders) {
        OrderSyncResponse response = new OrderSyncResponse();
        response.setTaskId(taskId);
        response.setStatus("SUCCESS");
        response.setTotalOrders(totalOrders);
        response.setSuccessOrders(totalOrders);
        response.setFailedOrders(0);
        response.setSkippedOrders(0);
        response.setConflictOrders(0);
        return response;
    }

    /**
     * 构建失败响应
     */
    public static OrderSyncResponse buildFailResponse(String taskId, String errorCode, String errorMessage) {
        OrderSyncResponse response = new OrderSyncResponse();
        response.setTaskId(taskId);
        response.setStatus("FAILED");
        response.setTotalOrders(0);
        response.setSuccessOrders(0);
        response.setFailedOrders(0);
        response.setSkippedOrders(0);
        response.setConflictOrders(0);
        
        response.addError(null, null, errorCode, errorMessage);
        return response;
    }

    /**
     * 构建部分成功响应
     */
    public static OrderSyncResponse buildPartialSuccessResponse(String taskId, 
            int totalOrders, int successOrders, List<OrderError> errors) {
        OrderSyncResponse response = new OrderSyncResponse();
        response.setTaskId(taskId);
        response.setStatus("PARTIAL_SUCCESS");
        response.setTotalOrders(totalOrders);
        response.setSuccessOrders(successOrders);
        response.setFailedOrders(errors != null ? errors.size() : 0);
        response.setSkippedOrders(0);
        response.setConflictOrders(0);
        response.setErrorList(errors);
        return response;
    }
}