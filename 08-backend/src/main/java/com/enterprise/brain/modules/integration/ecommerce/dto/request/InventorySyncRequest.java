package com.enterprise.brain.modules.integration.ecommerce.dto.request;

import lombok.Data;
import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

/**
 * 库存同步请求DTO
 * 
 * @author Enterprise Brain Team
 * @version 1.0
 */
@Data
public class InventorySyncRequest {

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
     * 同步方向
     */
    @NotNull(message = "同步方向不能为空")
    private String syncDirection;

    /**
     * 产品ID列表
     */
    private List<Long> productIds;

    /**
     * SKU ID列表
     */
    private List<String> skuIds;

    /**
     * 平台SKU ID列表
     */
    private List<String> platformSkuIds;

    /**
     * 库存数据列表
     */
    private List<InventoryData> inventoryData;

    /**
     * 同步配置
     */
    private SyncConfig syncConfig;

    /**
     * 同步规则
     */
    private SyncRules syncRules;

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
        public static final String BATCH = "BATCH";           // 批量同步
    }

    /**
     * 同步方向枚举
     */
    public static class SyncDirection {
        public static final String TO_PLATFORM = "TO_PLATFORM";     // 推送到平台
        public static final String FROM_PLATFORM = "FROM_PLATFORM"; // 从平台拉取
        public static final String BIDIRECTIONAL = "BIDIRECTIONAL"; // 双向同步
    }

    /**
     * 同步配置类
     */
    @Data
    public static class SyncConfig {
        /**
         * 是否同步可用库存
         */
        private Boolean syncAvailableStock = true;

        /**
         * 是否同步预留库存
         */
        private Boolean syncReservedStock = false;

        /**
         * 是否同步锁定库存
         */
        private Boolean syncLockedStock = false;

        /**
         * 是否覆盖已有数据
         */
        private Boolean overwriteExisting = false;

        /**
         * 是否处理库存冲突
         */
        private Boolean handleConflict = true;

        /**
         * 冲突处理策略
         */
        private String conflictStrategy;

        /**
         * 同步批次大小
         */
        private Integer batchSize = 200;

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
        private Long retryInterval = 3000L;

        /**
         * 是否启用库存策略
         */
        private Boolean enableInventoryStrategy = false;

        /**
         * 库存策略配置
         */
        private InventoryStrategy inventoryStrategy;
    }

    /**
     * 库存策略类
     */
    @Data
    public static class InventoryStrategy {
        /**
         * 策略类型
         */
        private String strategyType;

        /**
         * 库存分配比例
         */
        private Double allocationRatio;

        /**
         * 最小库存保留
         */
        private Integer minStockRetention;

        /**
         * 最大库存限制
         */
        private Integer maxStockLimit;

        /**
         * 安全库存设置
         */
        private Integer safetyStock;

        /**
         * 库存同步延迟（分钟）
         */
        private Integer syncDelayMinutes;

        /**
         * 库存预警阈值
         */
        private Integer warningThreshold;

        /**
         * 库存同步规则列表
         */
        private List<InventoryRule> inventoryRules;
    }

    /**
     * 库存同步规则类
     */
    @Data
    public static class InventoryRule {
        /**
         * 规则名称
         */
        private String ruleName;

        /**
         * 规则条件
         */
        private String condition;

        /**
         * 规则动作
         */
        private String action;

        /**
         * 规则参数
         */
        private Map<String, Object> parameters;

        /**
         * 优先级
         */
        private Integer priority;

        /**
         * 是否启用
         */
        private Boolean enabled = true;
    }

    /**
     * 同步规则类
     */
    @Data
    public static class SyncRules {
        /**
         * 自动同步规则
         */
        private List<AutoSyncRule> autoSyncRules;

        /**
         * 冲突处理规则
         */
        private List<ConflictRule> conflictRules;

        /**
         * 数据校验规则
         */
        private List<ValidationRule> validationRules;

        /**
         * 预警规则
         */
        private List<AlertRule> alertRules;
    }

    /**
     * 自动同步规则类
     */
    @Data
    public static class AutoSyncRule {
        /**
         * 触发条件
         */
        private String triggerCondition;

        /**
         * 同步频率（分钟）
         */
        private Integer syncFrequency;

        /**
         * 同步时间窗口
         */
        private String timeWindow;

        /**
         * 是否启用
         */
        private Boolean enabled = true;
    }

    /**
     * 冲突处理规则类
     */
    @Data
    public static class ConflictRule {
        /**
         * 冲突类型
         */
        private String conflictType;

        /**
         * 处理策略
         */
        private String resolutionStrategy;

        /**
         * 优先级规则
         */
        private String priorityRule;

        /**
         * 是否自动处理
         */
        private Boolean autoResolve = false;
    }

    /**
     * 数据校验规则类
     */
    @Data
    public static class ValidationRule {
        /**
         * 校验名称
         */
        private String validationName;

        /**
         * 校验条件
         */
        private String validationCondition;

        /**
         * 错误消息
         */
        private String errorMessage;

        /**
         * 是否严格校验
         */
        private Boolean strictValidation = false;
    }

    /**
     * 预警规则类
     */
    @Data
    public static class AlertRule {
        /**
         * 预警条件
         */
        private String alertCondition;

        /**
         * 预警级别
         */
        private String alertLevel;

        /**
         * 预警消息
         */
        private String alertMessage;

        /**
         * 通知方式
         */
        private List<String> notificationMethods;
    }

    /**
     * 库存数据类
     */
    @Data
    public static class InventoryData {
        /**
         * 本地产品ID
         */
        private Long productId;

        /**
         * SKU ID
         */
        private String skuId;

        /**
         * 平台SKU ID
         */
        private String platformSkuId;

        /**
         * 平台SKU编码
         */
        private String platformSkuCode;

        /**
         * 当前库存数量
         */
        private Integer currentQuantity;

        /**
         * 可用库存数量
         */
        private Integer availableQuantity;

        /**
         * 预留库存数量
         */
        private Integer reservedQuantity;

        /**
         * 锁定库存数量
         */
        private Integer lockedQuantity;

        /**
         * 安全库存
         */
        private Integer safetyStock;

        /**
         * 仓库位置
         */
        private String warehouseLocation;

        /**
         * 批次号
         */
        private String batchNumber;

        /**
         * 有效期
         */
        private java.time.LocalDateTime expiryDate;

        /**
         * 成本价
         */
        private Double costPrice;

        /**
         * 更新原因
         */
        private String updateReason;

        /**
         * 操作类型
         */
        private String operationType;

        /**
         * 操作时间
         */
        private java.time.LocalDateTime operationTime;

        /**
         * 操作人
         */
        private String operator;

        /**
         * 扩展信息
         */
        private Map<String, Object> extraInfo;
    }

    /**
     * 分页参数类
     */
    @Data
    public static class PageParam {
        private Integer pageNum = 1;
        private Integer pageSize = 100;
        private String orderBy = "updated_time";
        private String orderDirection = "DESC";
        private Boolean countOnly = false;
        private String cursor;
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
     * 检查是否为批量同步
     */
    public boolean isBatchSync() {
        return SyncType.BATCH.equals(syncType);
    }

    /**
     * 检查是否为推送同步
     */
    public boolean isToPlatformSync() {
        return SyncDirection.TO_PLATFORM.equals(syncDirection);
    }

    /**
     * 检查是否为拉取同步
     */
    public boolean isFromPlatformSync() {
        return SyncDirection.FROM_PLATFORM.equals(syncDirection);
    }

    /**
     * 检查是否为双向同步
     */
    public boolean isBidirectionalSync() {
        return SyncDirection.BIDIRECTIONAL.equals(syncDirection);
    }

    /**
     * 检查是否有产品ID列表
     */
    public boolean hasProductIds() {
        return productIds != null && !productIds.isEmpty();
    }

    /**
     * 检查是否有SKU ID列表
     */
    public boolean hasSkuIds() {
        return skuIds != null && !skuIds.isEmpty();
    }

    /**
     * 检查是否有平台SKU ID列表
     */
    public boolean hasPlatformSkuIds() {
        return platformSkuIds != null && !platformSkuIds.isEmpty();
    }

    /**
     * 检查是否有库存数据
     */
    public boolean hasInventoryData() {
        return inventoryData != null && !inventoryData.isEmpty();
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

        // 同步方向必须存在
        if (syncDirection == null || syncDirection.trim().isEmpty()) {
            return false;
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

        // 检查库存数据有效性
        if (hasInventoryData()) {
            for (InventoryData data : inventoryData) {
                if (data.getProductId() == null && data.getPlatformSkuId() == null) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * 构建全量推送同步请求
     */
    public static InventorySyncRequest buildFullToPlatformSyncRequest(Long shopId, List<Long> productIds) {
        InventorySyncRequest request = new InventorySyncRequest();
        request.setShopId(shopId);
        request.setSyncType(SyncType.FULL);
        request.setSyncDirection(SyncDirection.TO_PLATFORM);
        request.setProductIds(productIds);
        return request;
    }

    /**
     * 构建全量拉取同步请求
     */
    public static InventorySyncRequest buildFullFromPlatformSyncRequest(Long shopId, List<String> platformSkuIds) {
        InventorySyncRequest request = new InventorySyncRequest();
        request.setShopId(shopId);
        request.setSyncType(SyncType.FULL);
        request.setSyncDirection(SyncDirection.FROM_PLATFORM);
        request.setPlatformSkuIds(platformSkuIds);
        return request;
    }

    /**
     * 构建手动推送同步请求
     */
    public static InventorySyncRequest buildManualToPlatformSyncRequest(Long shopId, List<InventoryData> inventoryData) {
        InventorySyncRequest request = new InventorySyncRequest();
        request.setShopId(shopId);
        request.setSyncType(SyncType.MANUAL);
        request.setSyncDirection(SyncDirection.TO_PLATFORM);
        request.setInventoryData(inventoryData);
        return request;
    }

    /**
     * 构建实时同步请求
     */
    public static InventorySyncRequest buildRealtimeSyncRequest(Long shopId, List<InventoryData> inventoryData) {
        InventorySyncRequest request = new InventorySyncRequest();
        request.setShopId(shopId);
        request.setSyncType(SyncType.REALTIME);
        request.setSyncDirection(SyncDirection.BIDIRECTIONAL);
        request.setInventoryData(inventoryData);
        
        // 实时同步的默认配置
        SyncConfig config = new SyncConfig();
        config.setBatchSize(50);          // 中等批次
        config.setTimeoutSeconds(120);    // 短超时
        config.setRetryTimes(1);         // 少重试
        config.setRetryInterval(1000L);   // 短间隔
        request.setSyncConfig(config);
        
        return request;
    }

    /**
     * 构建批量同步请求
     */
    public static InventorySyncRequest buildBatchSyncRequest(Long shopId, List<Long> productIds, SyncConfig syncConfig) {
        InventorySyncRequest request = new InventorySyncRequest();
        request.setShopId(shopId);
        request.setSyncType(SyncType.BATCH);
        request.setSyncDirection(SyncDirection.TO_PLATFORM);
        request.setProductIds(productIds);
        request.setSyncConfig(syncConfig);
        
        // 批量同步的默认配置
        if (request.getDefaultSyncConfig().getBatchSize() == null) {
            request.getDefaultSyncConfig().setBatchSize(100);
        }
        request.getDefaultSyncConfig().setTimeoutSeconds(600);
        
        return request;
    }
}