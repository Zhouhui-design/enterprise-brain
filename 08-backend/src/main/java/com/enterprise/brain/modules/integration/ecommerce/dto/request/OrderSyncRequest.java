package com.enterprise.brain.modules.integration.ecommerce.dto.request;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 订单同步请求DTO
 * 
 * @author Enterprise Brain Team
 * @version 1.0
 */
@Data
public class OrderSyncRequest {

    /**
     * 店铺ID
     */
    @NotNull(message = "店铺ID不能为空")
    private Long shopId;

    /**
     * 同步类型
     */
    @NotNull(message = "同步类型不能为空")
    private String syncType;

    /**
     * 订单ID列表
     */
    private List<String> orderIds;

    /**
     * 同步时间范围
     */
    private SyncTimeRange timeRange;

    /**
     * 订单状态过滤
     */
    private List<String> orderStatus;

    /**
     * 付款状态过滤
     */
    private List<String> paymentStatus;

    /**
     * 同步配置
     */
    private SyncConfig syncConfig;

    /**
     * 分页参数
     */
    private PageParam pageParam;

    /**
     * 扩展参数
     */
    private Map<String, Object> extraParams;

    /**
     * 同步类型枚举
     */
    public static class SyncType {
        public static final String FULL = "FULL";           // 全量同步
        public static final String INCREMENTAL = "INCREMENTAL"; // 增量同步
        public static final String MANUAL = "MANUAL";         // 手动同步
        public static final String SCHEDULED = "SCHEDULED";     // 定时同步
        public static final String REALTIME = "REALTIME";       // 实时同步
    }

    /**
     * 同步时间范围类
     */
    @Data
    public static class SyncTimeRange {
        /**
         * 开始时间
         */
        private LocalDateTime startTime;

        /**
         * 结束时间
         */
        private LocalDateTime endTime;

        /**
         * 是否使用创建时间
         */
        private Boolean useCreateTime = true;

        /**
         * 是否使用更新时间
         */
        private Boolean useUpdateTime = false;

        /**
         * 是否使用付款时间
         */
        private Boolean usePaymentTime = false;
    }

    /**
     * 同步配置类
     */
    @Data
    public static class SyncConfig {
        /**
         * 同步方向
         */
        private String syncDirection;

        /**
         * 是否同步订单商品
         */
        private Boolean syncItems = true;

        /**
         * 是否同步物流信息
         */
        private Boolean syncLogistics = true;

        /**
         * 是否同步支付信息
         */
        private Boolean syncPayment = true;

        /**
         * 是否同步发票信息
         */
        private Boolean syncInvoice = false;

        /**
         * 是否同步优惠信息
         */
        private Boolean syncDiscount = true;

        /**
         * 是否同步买家信息
         */
        private Boolean syncBuyer = true;

        /**
         * 是否覆盖已有数据
         */
        private Boolean overwriteExisting = false;

        /**
         * 是否处理数据冲突
         */
        private Boolean handleConflict = true;

        /**
         * 冲突处理策略
         */
        private String conflictStrategy;

        /**
         * 同步批次大小
         */
        private Integer batchSize = 100;

        /**
         * 同步超时时间（秒）
         */
        private Integer timeoutSeconds = 300;

        /**
         * 重试次数
         */
        private Integer retryTimes = 3;

        /**
         * 重试间隔（毫秒）
         */
        private Long retryInterval = 5000L;
    }

    /**
     * 分页参数类
     */
    @Data
    public static class PageParam {
        /**
         * 页码
         */
        private Integer pageNum = 1;

        /**
         * 每页大小
         */
        private Integer pageSize = 100;

        /**
         * 排序字段
         */
        private String orderBy = "created_time";

        /**
         * 排序方向
         */
        private String orderDirection = "DESC";

        /**
         * 是否只获取总数
         */
        private Boolean countOnly = false;

        /**
         * 游标分页 - 上一次查询的最后一项ID
         */
        private String cursor;

        /**
         * 游标分页 - 游标方向
         */
        private String cursorDirection = "next";
    }

    /**
     * 检查是否为全量同步
     */
    public boolean isFullSync() {
        return SyncType.FULL.equals(syncType);
    }

    /**
     * 检查是否为增量同步
     */
    public boolean isIncrementalSync() {
        return SyncType.INCREMENTAL.equals(syncType);
    }

    /**
     * 检查是否为手动同步
     */
    public boolean isManualSync() {
        return SyncType.MANUAL.equals(syncType);
    }

    /**
     * 检查是否为实时同步
     */
    public boolean isRealtimeSync() {
        return SyncType.REALTIME.equals(syncType);
    }

    /**
     * 检查是否有时间范围
     */
    public boolean hasTimeRange() {
        return timeRange != null && 
               timeRange.getStartTime() != null && 
               timeRange.getEndTime() != null;
    }

    /**
     * 检查是否有订单ID列表
     */
    public boolean hasOrderIds() {
        return orderIds != null && !orderIds.isEmpty();
    }

    /**
     * 获取有效订单数量
     */
    public int getValidOrderCount() {
        if (hasOrderIds()) {
            return orderIds.size();
        }
        return 0;
    }

    /**
     * 获取默认同步配置
     */
    public SyncConfig getDefaultSyncConfig() {
        if (syncConfig == null) {
            syncConfig = new SyncConfig();
        }
        return syncConfig;
    }

    /**
     * 获取默认分页参数
     */
    public PageParam getDefaultPageParam() {
        if (pageParam == null) {
            pageParam = new PageParam();
        }
        return pageParam;
    }

    /**
     * 验证请求参数
     */
    public boolean isValid() {
        // 店铺ID必须存在
        if (shopId == null) {
            return false;
        }

        // 同步类型必须存在
        if (syncType == null || syncType.trim().isEmpty()) {
            return false;
        }

        // 检查时间范围有效性
        if (hasTimeRange()) {
            LocalDateTime start = timeRange.getStartTime();
            LocalDateTime end = timeRange.getEndTime();
            if (start.isAfter(end)) {
                return false;
            }
        }

        // 检查分页参数有效性
        if (pageParam != null) {
            if (pageParam.getPageNum() != null && pageParam.getPageNum() < 1) {
                return false;
            }
            if (pageParam.getPageSize() != null && 
                (pageParam.getPageSize() < 1 || pageParam.getPageSize() > 1000)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 构建全量同步请求
     */
    public static OrderSyncRequest buildFullSyncRequest(Long shopId, SyncTimeRange timeRange) {
        OrderSyncRequest request = new OrderSyncRequest();
        request.setShopId(shopId);
        request.setSyncType(SyncType.FULL);
        request.setTimeRange(timeRange);
        return request;
    }

    /**
     * 构建增量同步请求
     */
    public static OrderSyncRequest buildIncrementalSyncRequest(Long shopId, SyncTimeRange timeRange) {
        OrderSyncRequest request = new OrderSyncRequest();
        request.setShopId(shopId);
        request.setSyncType(SyncType.INCREMENTAL);
        request.setTimeRange(timeRange);
        return request;
    }

    /**
     * 构建手动同步请求
     */
    public static OrderSyncRequest buildManualSyncRequest(Long shopId, List<String> orderIds) {
        OrderSyncRequest request = new OrderSyncRequest();
        request.setShopId(shopId);
        request.setSyncType(SyncType.MANUAL);
        request.setOrderIds(orderIds);
        return request;
    }

    /**
     * 构建实时同步请求
     */
    public static OrderSyncRequest buildRealtimeSyncRequest(Long shopId, List<String> orderIds) {
        OrderSyncRequest request = new OrderSyncRequest();
        request.setShopId(shopId);
        request.setSyncType(SyncType.REALTIME);
        request.setOrderIds(orderIds);
        
        // 实时同步的默认配置
        SyncConfig config = new SyncConfig();
        config.setBatchSize(10);           // 小批次
        config.setTimeoutSeconds(30);      // 短超时
        config.setRetryTimes(1);          // 少重试
        config.setRetryInterval(1000L);   // 短间隔
        request.setSyncConfig(config);
        
        return request;
    }
}