package com.enterprise.brain.modules.integration.ecommerce.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 产品同步响应DTO
 * 
 * @author Enterprise Brain Team
 * @version 1.0
 */
@Data
public class ProductSyncResponse {

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
     * 总产品数
     */
    private Integer totalProducts;

    /**
     * 成功产品数
     */
    private Integer successProducts;

    /**
     * 失败产品数
     */
    private Integer failedProducts;

    /**
     * 跳过产品数
     */
    private Integer skippedProducts;

    /**
     * 冲突产品数
     */
    private Integer conflictProducts;

    /**
     * 产品列表
     */
    private List<ProductInfo> productList;

    /**
     * 错误信息列表
     */
    private List<ProductError> errorList;

    /**
     * 同步统计
     */
    private ProductStatistics statistics;

    /**
     * 扩展信息
     */
    private Map<String, Object> extraInfo;

    /**
     * 产品信息类
     */
    @Data
    public static class ProductInfo {
        private Long productId;
        private String platformProductId;
        private String platformProductCode;
        private String title;
        private String status;
        private String message;
        private LocalDateTime syncTime;
        private Double price;
        private Integer stock;
        private Map<String, Object> productData;
    }

    /**
     * 产品错误类
     */
    @Data
    public static class ProductError {
        private Long productId;
        private String platformProductId;
        private String platformProductCode;
        private String title;
        private String errorCode;
        private String errorMessage;
        private String errorDetail;
        private Integer retryCount;
        private LocalDateTime errorTime;
        private Map<String, Object> errorContext;
    }

    /**
     * 产品统计类
     */
    @Data
    public static class ProductStatistics {
        private Map<String, Integer> statusCount;
        private Map<String, Integer> categoryCount;
        private Map<String, Double> priceRange;
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
               (failedProducts != null && failedProducts > 0);
    }

    /**
     * 获取成功率
     */
    public Double getSuccessRate() {
        if (totalProducts != null && totalProducts > 0) {
            int success = successProducts != null ? successProducts : 0;
            return (double) success / totalProducts * 100;
        }
        return 0.0;
    }

    /**
     * 添加错误信息
     */
    public void addError(Long productId, String platformProductId, 
            String platformProductCode, String title, 
            String errorCode, String errorMessage) {
        if (errorList == null) {
            errorList = new java.util.ArrayList<>();
        }
        
        ProductError error = new ProductError();
        error.setProductId(productId);
        error.setPlatformProductId(platformProductId);
        error.setPlatformProductCode(platformProductCode);
        error.setTitle(title);
        error.setErrorCode(errorCode);
        error.setErrorMessage(errorMessage);
        error.setErrorTime(LocalDateTime.now());
        error.setRetryCount(0);
        
        errorList.add(error);
        
        // 更新失败计数
        this.failedProducts = (this.failedProducts != null ? this.failedProducts : 0) + 1;
    }

    /**
     * 添加产品信息
     */
    public void addProduct(Long productId, String platformProductId, 
            String platformProductCode, String title, 
            String resultStatus, String message, 
            Double price, Integer stock) {
        if (productList == null) {
            productList = new java.util.ArrayList<>();
        }
        
        ProductInfo productInfo = new ProductInfo();
        productInfo.setProductId(productId);
        productInfo.setPlatformProductId(platformProductId);
        productInfo.setPlatformProductCode(platformProductCode);
        productInfo.setTitle(title);
        productInfo.setStatus(resultStatus);
        productInfo.setMessage(message);
        productInfo.setSyncTime(LocalDateTime.now());
        productInfo.setPrice(price);
        productInfo.setStock(stock);
        
        productList.add(productInfo);
        
        // 更新总计数
        this.totalProducts = (this.totalProducts != null ? this.totalProducts : 0) + 1;
        
        // 更新状态计数
        if ("SUCCESS".equals(resultStatus)) {
            this.successProducts = (this.successProducts != null ? this.successProducts : 0) + 1;
        } else if ("FAILED".equals(resultStatus)) {
            this.failedProducts = (this.failedProducts != null ? this.failedProducts : 0) + 1;
        } else if ("SKIPPED".equals(resultStatus)) {
            this.skippedProducts = (this.skippedProducts != null ? this.skippedProducts : 0) + 1;
        } else if ("CONFLICT".equals(resultStatus)) {
            this.conflictProducts = (this.conflictProducts != null ? this.conflictProducts : 0) + 1;
        }
    }

    /**
     * 构建成功响应
     */
    public static ProductSyncResponse buildSuccessResponse(String taskId, 
            String syncType, int totalProducts) {
        ProductSyncResponse response = new ProductSyncResponse();
        response.setTaskId(taskId);
        response.setStatus("SUCCESS");
        response.setSyncType(syncType);
        response.setTotalProducts(totalProducts);
        response.setSuccessProducts(totalProducts);
        response.setFailedProducts(0);
        response.setSkippedProducts(0);
        response.setConflictProducts(0);
        return response;
    }

    /**
     * 构建失败响应
     */
    public static ProductSyncResponse buildFailResponse(String taskId, 
            String syncType, String errorCode, String errorMessage) {
        ProductSyncResponse response = new ProductSyncResponse();
        response.setTaskId(taskId);
        response.setStatus("FAILED");
        response.setSyncType(syncType);
        response.setTotalProducts(0);
        response.setSuccessProducts(0);
        response.setFailedProducts(0);
        response.setSkippedProducts(0);
        response.setConflictProducts(0);
        
        response.addError(null, null, null, null, errorCode, errorMessage);
        return response;
    }

    /**
     * 构建部分成功响应
     */
    public static ProductSyncResponse buildPartialSuccessResponse(String taskId, 
            String syncType, int totalProducts, int successProducts, 
            List<ProductError> errors) {
        ProductSyncResponse response = new ProductSyncResponse();
        response.setTaskId(taskId);
        response.setStatus("PARTIAL_SUCCESS");
        response.setSyncType(syncType);
        response.setTotalProducts(totalProducts);
        response.setSuccessProducts(successProducts);
        response.setFailedProducts(errors != null ? errors.size() : 0);
        response.setSkippedProducts(0);
        response.setConflictProducts(0);
        response.setErrorList(errors);
        return response;
    }
}