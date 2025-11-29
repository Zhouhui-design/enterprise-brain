package com.enterprise.brain.modules.integration.ecommerce.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 店铺管理响应DTO
 * 
 * @author Enterprise Brain Team
 * @version 1.0
 */
@Data
public class ShopManageResponse {

    /**
     * 操作类型
     */
    private String operationType;

    /**
     * 操作状态
     */
    private String status;

    /**
     * 店铺信息
     */
    private ShopInfo shopInfo;

    /**
     * 操作消息
     */
    private String message;

    /**
     * 操作时间
     */
    private LocalDateTime operationTime;

    /**
     * 扩展信息
     */
    private Map<String, Object> extraInfo;

    /**
     * 店铺信息类
     */
    @Data
    public static class ShopInfo {
        private Long id;
        private String platform;
        private String platformShopId;
        private String shopName;
        private String shopDescription;
        private String shopLogo;
        private String shopUrl;
        private String status;
        private String authStatus;
        private String shopLevel;
        private String mainCategory;
        private LocalDateTime authExpireAt;
        private Boolean autoSyncEnabled;
        private Integer syncIntervalMinutes;
    }

    /**
     * 操作类型枚举
     */
    public static class OperationType {
        public static final String CREATE = "CREATE";
        public static final String UPDATE = "UPDATE";
        public static final String DELETE = "DELETE";
        public static final String AUTHORIZE = "AUTHORIZE";
        public static final String DEAUTHORIZE = "DEAUTHORIZE";
        public static final String ENABLE = "ENABLE";
        public static final String DISABLE = "DISABLE";
        public static final String SYNC_CONFIG = "SYNC_CONFIG";
        public static final String REFRESH_TOKEN = "REFRESH_TOKEN";
    }

    /**
     * 操作状态枚举
     */
    public static class Status {
        public static final String SUCCESS = "SUCCESS";
        public static final String FAILED = "FAILED";
        public static final String PENDING = "PENDING";
        public static final String CANCELLED = "CANCELLED";
    }

    /**
     * 检查是否成功
     */
    public boolean isSuccess() {
        return Status.SUCCESS.equals(status);
    }

    /**
     * 检查是否失败
     */
    public boolean isFailed() {
        return Status.FAILED.equals(status);
    }

    /**
     * 构建成功响应
     */
    public static ShopManageResponse buildSuccessResponse(String operationType, ShopInfo shopInfo) {
        ShopManageResponse response = new ShopManageResponse();
        response.setOperationType(operationType);
        response.setStatus(Status.SUCCESS);
        response.setShopInfo(shopInfo);
        response.setMessage("操作成功");
        response.setOperationTime(LocalDateTime.now());
        return response;
    }

    /**
     * 构建失败响应
     */
    public static ShopManageResponse buildFailResponse(String operationType, String errorMessage) {
        ShopManageResponse response = new ShopManageResponse();
        response.setOperationType(operationType);
        response.setStatus(Status.FAILED);
        response.setMessage(errorMessage);
        response.setOperationTime(LocalDateTime.now());
        return response;
    }

    /**
     * 构建待处理响应
     */
    public static ShopManageResponse buildPendingResponse(String operationType, String message) {
        ShopManageResponse response = new ShopManageResponse();
        response.setOperationType(operationType);
        response.setStatus(Status.PENDING);
        response.setMessage(message);
        response.setOperationTime(LocalDateTime.now());
        return response;
    }
}