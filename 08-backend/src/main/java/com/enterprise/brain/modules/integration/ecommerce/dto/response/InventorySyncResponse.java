package com.enterprise.brain.modules.integration.ecommerce.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 库存同步响应DTO
 * 
 * @author Enterprise Brain Team
 * @version 1.0
 */
@Data
public class InventorySyncResponse {

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
     * 总SKU数
     */
    private Integer totalSkus;

    /**
     * 成功SKU数
     */
    private Integer successSkus;

    /**
     * 失败SKU数
     */
    private Integer failedSkus;

    /**
     * 跳过SKU数
     */
    private Integer skippedSkus;

    /**
     * 冲突SKU数
     */
    private Integer conflictSkus;

    /**
     * 库存列表
     */
    private List<InventoryInfo> inventoryList;

    /**
     * 错误信息列表
     */
    private List<InventoryError> errorList;

    /**
     * 同步统计
     */
    private InventoryStatistics statistics;

    /**
     * 扩展信息
     */
    private Map<String, Object> extraInfo;

    /**
     * 库存信息类
     */
    @Data
    public static class InventoryInfo {
        private Long productId;
        private String skuId;
        private String platformSkuId;
        private String platformSkuCode;
        private String status;
        private String message;
        private LocalDateTime syncTime;
        private Integer currentQuantity;
        private Integer availableQuantity;
        private Integer platformQuantity;
        private Integer platformAvailableQuantity;
        private Map<String, Object> inventoryData;
    }

    /**
     * 库存错误类
     */
    @Data
    public static class InventoryError {
        private Long productId;
        private String skuId;
        private String platformSkuId;
        private String platformSkuCode;
        private String errorCode;
        private String errorMessage;
        private String errorDetail;
        private Integer retryCount;
        private LocalDateTime errorTime;
        private Map<String, Object> errorContext;
    }

    /**
     * 库存统计类
     */
    @Data
    public static class InventoryStatistics {
        private Map<String, Integer> statusCount;
        private Map<String, Integer> categoryCount;
        private Map<String, Integer> warehouseCount;
        private Map<String, Integer> stockRange;
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
               (failedSkus != null && failedSkus > 0);
    }

    /**
     * 获取成功率
     */
    public Double getSuccessRate() {
        if (totalSkus != null && totalSkus > 0) {
            int success = successSkus != null ? successSkus : 0;
            return (double) success / totalSkus * 100;
        }
        return 0.0;
    }

    /**
     * 添加错误信息
     */
    public void addError(Long productId, String skuId, 
            String platformSkuId, String platformSkuCode,
            String errorCode, String errorMessage) {
        if (errorList == null) {
            errorList = new java.util.ArrayList<>();
        }
        
        InventoryError error = new InventoryError();
        error.setProductId(productId);
        error.setSkuId(skuId);
        error.setPlatformSkuId(platformSkuId);
        error.setPlatformSkuCode(platformSkuCode);
        error.setErrorCode(errorCode);
        error.setErrorMessage(errorMessage);
        error.setErrorTime(LocalDateTime.now());
        error.setRetryCount(0);
        
        errorList.add(error);
        
        // 更新失败计数
        this.failedSkus = (this.failedSkus != null ? this.failedSkus : 0) + 1;
    }

    /**
     * 添加库存信息
     */
    public void addInventory(Long productId, String skuId, 
            String platformSkuId, String platformSkuCode,
            String resultStatus, String message,
            Integer currentQuantity, Integer availableQuantity,
            Integer platformQuantity, Integer platformAvailableQuantity) {
        if (inventoryList == null) {
            inventoryList = new java.util.ArrayList<>();
        }
        
        InventoryInfo inventoryInfo = new InventoryInfo();
        inventoryInfo.setProductId(productId);
        inventoryInfo.setSkuId(skuId);
        inventoryInfo.setPlatformSkuId(platformSkuId);
        inventoryInfo.setPlatformSkuCode(platformSkuCode);
        inventoryInfo.setStatus(resultStatus);
        inventoryInfo.setMessage(message);
        inventoryInfo.setSyncTime(LocalDateTime.now());
        inventoryInfo.setCurrentQuantity(currentQuantity);
        inventoryInfo.setAvailableQuantity(availableQuantity);
        inventoryInfo.setPlatformQuantity(platformQuantity);
        inventoryInfo.setPlatformAvailableQuantity(platformAvailableQuantity);
        
        inventoryList.add(inventoryInfo);
        
        // 更新总计数
        this.totalSkus = (this.totalSkus != null ? this.totalSkus : 0) + 1;
        
        // 更新状态计数
        if ("SUCCESS".equals(resultStatus)) {
            this.successSkus = (this.successSkus != null ? this.successSkus : 0) + 1;
        } else if ("FAILED".equals(resultStatus)) {
            this.failedSkus = (this.failedSkus != null ? this.failedSkus : 0) + 1;
        } else if ("SKIPPED".equals(resultStatus)) {
            this.skippedSkus = (this.skippedSkus != null ? this.skippedSkus : 0) + 1;
        } else if ("CONFLICT".equals(resultStatus)) {
            this.conflictSkus = (this.conflictSkus != null ? this.conflictSkus : 0) + 1;
        }
    }

    /**
     * 构建成功响应
     */
    public static InventorySyncResponse buildSuccessResponse(String taskId, 
            String syncType, int totalSkus) {
        InventorySyncResponse response = new InventorySyncResponse();
        response.setTaskId(taskId);
        response.setStatus("SUCCESS");
        response.setSyncType(syncType);
        response.setTotalSkus(totalSkus);
        response.setSuccessSkus(totalSkus);
        response.setFailedSkus(0);
        response.setSkippedSkus(0);
        response.setConflictSkus(0);
        return response;
    }

    /**
     * 构建失败响应
     */
    public static InventorySyncResponse buildFailResponse(String taskId, 
            String syncType, String errorCode, String errorMessage) {
        InventorySyncResponse response = new InventorySyncResponse();
        response.setTaskId(taskId);
        response.setStatus("FAILED");
        response.setSyncType(syncType);
        response.setTotalSkus(0);
        response.setSuccessSkus(0);
        response.setFailedSkus(0);
        response.setSkippedSkus(0);
        response.setConflictSkus(0);
        
        response.addError(null, null, null, null, errorCode, errorMessage);
        return response;
    }

    /**
     * 构建部分成功响应
     */
    public static InventorySyncResponse buildPartialSuccessResponse(String taskId, 
            String syncType, int totalSkus, int successSkus, 
            List<InventoryError> errors) {
        InventorySyncResponse response = new InventorySyncResponse();
        response.setTaskId(taskId);
        response.setStatus("PARTIAL_SUCCESS");
        response.setSyncType(syncType);
        response.setTotalSkus(totalSkus);
        response.setSuccessSkus(successSkus);
        response.setFailedSkus(errors != null ? errors.size() : 0);
        response.setSkippedSkus(0);
        response.setConflictSkus(0);
        response.setErrorList(errors);
        return response;
    }
}