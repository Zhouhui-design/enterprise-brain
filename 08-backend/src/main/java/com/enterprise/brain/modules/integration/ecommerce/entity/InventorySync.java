package com.enterprise.brain.modules.integration.ecommerce.entity;

import com.enterprise.brain.common.base.BaseEntity;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * 库存同步实体类
 * 用于管理产品在各电商平台间的库存同步状态和信息
 * 
 * @author Enterprise Brain Team
 * @version 1.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "inventory_sync", indexes = {
    @Index(name = "idx_shop_id", columnList = "shopId"),
    @Index(name = "idx_product_id", columnList = "productId"),
    @Index(name = "idx_platform_sku", columnList = "platform,platformSkuId"),
    @Index(name = "idx_sync_status", columnList = "syncStatus"),
    @Index(name = "idx_last_sync_at", columnList = "lastSyncAt"),
    @Index(name = "idx_created_at", columnList = "createdAt")
})
public class InventorySync extends BaseEntity {

    /**
     * 主键ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 关联的店铺ID
     */
    @NotNull(message = "店铺ID不能为空")
    @Column(name = "shop_id", nullable = false)
    private Long shopId;

    /**
     * 本地产品ID
     */
    @NotNull(message = "产品ID不能为空")
    @Column(name = "product_id", nullable = false)
    private Long productId;

    /**
     * 电商平台类型
     */
    @NotNull(message = "电商平台不能为空")
    @Enumerated(EnumType.STRING)
    @Column(name = "platform", nullable = false, length = 20)
    private EcommerceShop.Platform platform;

    /**
     * 平台SKU ID
     */
    @NotBlank(message = "平台SKU ID不能为空")
    @Column(name = "platform_sku_id", nullable = false, length = 100)
    private String platformSkuId;

    /**
     * 平台SKU编码
     */
    @Column(name = "platform_sku_code", length = 100)
    private String platformSkuCode;

    /**
     * 同步状态
     */
    @NotNull(message = "同步状态不能为空")
    @Enumerated(EnumType.STRING)
    @Column(name = "sync_status", nullable = false, length = 20)
    private SyncStatus syncStatus;

    /**
     * 同步方向
     */
    @NotNull(message = "同步方向不能为空")
    @Enumerated(EnumType.STRING)
    @Column(name = "sync_direction", nullable = false, length = 20)
    private SyncDirection syncDirection;

    /**
     * 库存信息
     */
    @Embedded
    private InventoryInfo inventoryInfo;

    /**
     * 本地库存信息
     */
    @Embedded
    private LocalInventoryInfo localInventoryInfo;

    /**
     * 平台库存信息
     */
    @Embedded
    private PlatformInventoryInfo platformInventoryInfo;

    /**
     * 同步配置 - JSON格式存储
     */
    @Column(name = "sync_config", columnDefinition = "TEXT")
    private String syncConfig;

    /**
     * 同步规则 - JSON格式存储
     */
    @Column(name = "sync_rules", columnDefinition = "TEXT")
    private String syncRules;

    /**
     * 平台返回信息 - JSON格式存储
     */
    @Column(name = "platform_response", columnDefinition = "TEXT")
    private String platformResponse;

    /**
     * 同步错误信息
     */
    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    /**
     * 重试次数
     */
    @Column(name = "retry_count")
    private Integer retryCount = 0;

    /**
     * 最大重试次数
     */
    @Column(name = "max_retry_count")
    private Integer maxRetryCount = 3;

    /**
     * 最后同步时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    /**
     * 下次同步时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "next_sync_at")
    private LocalDateTime nextSyncAt;

    /**
     * 库存变更记录 - JSON格式存储
     */
    @Column(name = "inventory_changes", columnDefinition = "TEXT")
    private String inventoryChanges;

    /**
     * 同步优先级
     */
    @Column(name = "sync_priority")
    private Integer syncPriority = 0;

    /**
     * 是否启用自动同步
     */
    @Column(name = "auto_sync_enabled", nullable = false)
    private Boolean autoSyncEnabled = false;

    /**
     * 同步频率（分钟）
     */
    @Column(name = "sync_interval_minutes")
    private Integer syncIntervalMinutes;

    /**
     * 库存预警阈值
     */
    @Column(name = "stock_warning_threshold")
    private Integer stockWarningThreshold;

    /**
     * 备注信息
     */
    @Column(name = "remark", length = 500)
    private String remark;

    /**
     * 同步状态枚举
     */
    public enum SyncStatus {
        PENDING("待同步"),
        SYNCING("同步中"),
        SUCCESS("同步成功"),
        FAILED("同步失败"),
        CONFLICT("库存冲突"),
        SKIPPED("跳过同步"),
        LOCKED("库存锁定");

        private final String description;

        SyncStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 同步方向枚举
     */
    public enum SyncDirection {
        TO_PLATFORM("推送到平台"),
        FROM_PLATFORM("从平台拉取"),
        BIDIRECTIONAL("双向同步");

        private final String description;

        SyncDirection(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 库存信息嵌入类
     */
    @Embeddable
    @Data
    public static class InventoryInfo {
        @Column(name = "current_quantity")
        private Integer currentQuantity;

        @Column(name = "available_quantity")
        private Integer availableQuantity;

        @Column(name = "reserved_quantity")
        private Integer reservedQuantity;

        @Column(name = "locked_quantity")
        private Integer lockedQuantity;

        @Column(name = "safety_stock")
        private Integer safetyStock;

        @Column(name = "max_stock")
        private Integer maxStock;

        @Column(name = "min_stock")
        private Integer minStock;

        @Column(name = "reorder_point")
        private Integer reorderPoint;

        @Column(name = "stock_status", length = 20)
        private String stockStatus;

        @Column(name = "last_updated")
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime lastUpdated;
    }

    /**
     * 本地库存信息嵌入类
     */
    @Embeddable
    @Data
    public static class LocalInventoryInfo {
        @Column(name = "local_quantity")
        private Integer localQuantity;

        @Column(name = "local_available_quantity")
        private Integer localAvailableQuantity;

        @Column(name = "local_reserved_quantity")
        private Integer localReservedQuantity;

        @Column(name = "warehouse_location", length = 100)
        private String warehouseLocation;

        @Column(name = "batch_number", length = 50)
        private String batchNumber;

        @Column(name = "expiry_date")
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDateTime expiryDate;

        @Column(name = "last_stock_in")
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime lastStockIn;

        @Column(name = "last_stock_out")
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime lastStockOut;
    }

    /**
     * 平台库存信息嵌入类
     */
    @Embeddable
    @Data
    public static class PlatformInventoryInfo {
        @Column(name = "platform_quantity")
        private Integer platformQuantity;

        @Column(name = "platform_available_quantity")
        private Integer platformAvailableQuantity;

        @Column(name = "platform_reserved_quantity")
        private Integer platformReservedQuantity;

        @Column(name = "platform_warehouse_id", length = 100)
        private String platformWarehouseId;

        @Column(name = "platform_warehouse_name", length = 200)
        private String platformWarehouseName;

        @Column(name = "platform_stock_location", length = 200)
        private String platformStockLocation;

        @Column(name = "platform_sync_time")
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime platformSyncTime;

        @Column(name = "platform_last_modified")
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime platformLastModified;
    }

    /**
     * 检查是否可以同步
     */
    public boolean canSync() {
        return SyncStatus.PENDING.equals(syncStatus) ||
               (SyncStatus.FAILED.equals(syncStatus) && 
                retryCount < maxRetryCount) ||
               autoSyncEnabled;
    }

    /**
     * 检查同步是否成功
     */
    public boolean isSyncSuccess() {
        return SyncStatus.SUCCESS.equals(syncStatus);
    }

    /**
     * 检查同步是否失败
     */
    public boolean isSyncFailed() {
        return SyncStatus.FAILED.equals(syncStatus);
    }

    /**
     * 检查是否需要重试
     */
    public boolean needRetry() {
        return SyncStatus.FAILED.equals(syncStatus) && 
               retryCount < maxRetryCount;
    }

    /**
     * 检查是否有库存冲突
     */
    public boolean hasConflict() {
        if (localInventoryInfo == null || platformInventoryInfo == null) {
            return false;
        }
        
        Integer localQty = localInventoryInfo.getLocalAvailableQuantity();
        Integer platformQty = platformInventoryInfo.getPlatformAvailableQuantity();
        
        return localQty != null && platformQty != null && !localQty.equals(platformQty);
    }

    /**
     * 检查是否库存不足
     */
    public boolean isLowStock() {
        if (inventoryInfo == null || stockWarningThreshold == null) {
            return false;
        }
        
        Integer availableQty = inventoryInfo.getAvailableQuantity();
        return availableQty != null && availableQty <= stockWarningThreshold;
    }

    /**
     * 增加重试次数
     */
    public void incrementRetryCount() {
        this.retryCount = (this.retryCount == null ? 0 : this.retryCount) + 1;
    }

    /**
     * 重置同步状态
     */
    public void resetSyncStatus() {
        this.syncStatus = SyncStatus.PENDING;
        this.retryCount = 0;
        this.errorMessage = null;
        this.lastSyncAt = null;
    }

    /**
     * 设置同步成功
     */
    public void setSyncSuccess() {
        this.syncStatus = SyncStatus.SUCCESS;
        this.errorMessage = null;
        this.lastSyncAt = LocalDateTime.now();
        
        // 计算下次同步时间
        if (Boolean.TRUE.equals(autoSyncEnabled) && syncIntervalMinutes != null) {
            this.nextSyncAt = lastSyncAt.plusMinutes(syncIntervalMinutes);
        }
    }

    /**
     * 设置同步失败
     */
    public void setSyncFailed(String errorMessage) {
        this.syncStatus = SyncStatus.FAILED;
        this.errorMessage = errorMessage;
        this.lastSyncAt = LocalDateTime.now();
        incrementRetryCount();
        
        // 计算重试时间（指数退避）
        if (needRetry()) {
            long delayMinutes = (long) Math.pow(2, retryCount) * 3; // 3分钟、6分钟、12分钟...
            this.nextSyncAt = lastSyncAt.plusMinutes(delayMinutes);
        }
    }

    /**
     * 设置库存冲突
     */
    public void setConflict(String conflictMessage) {
        this.syncStatus = SyncStatus.CONFLICT;
        this.errorMessage = conflictMessage;
        this.lastSyncAt = LocalDateTime.now();
    }

    /**
     * 锁定库存
     */
    public void lockInventory() {
        this.syncStatus = SyncStatus.LOCKED;
        this.lastSyncAt = LocalDateTime.now();
        
        // 库存锁定通常需要人工处理，不自动重试
        this.nextSyncAt = null;
    }

    /**
     * 获取总库存数量
     */
    public Integer getTotalQuantity() {
        if (inventoryInfo == null) {
            return 0;
        }
        
        Integer current = inventoryInfo.getCurrentQuantity();
        Integer reserved = inventoryInfo.getReservedQuantity();
        Integer locked = inventoryInfo.getLockedQuantity();
        
        int total = (current != null ? current : 0);
        total += (reserved != null ? reserved : 0);
        total += (locked != null ? locked : 0);
        
        return total;
    }

    /**
     * 获取可用库存数量
     */
    public Integer getAvailableQuantity() {
        if (inventoryInfo == null) {
            return 0;
        }
        return inventoryInfo.getAvailableQuantity() != null ? 
               inventoryInfo.getAvailableQuantity() : 0;
    }

    /**
     * 更新库存信息
     */
    public void updateInventoryQuantity(Integer newQuantity, String source) {
        if (inventoryInfo == null) {
            inventoryInfo = new InventoryInfo();
        }
        
        Integer oldQuantity = inventoryInfo.getCurrentQuantity();
        inventoryInfo.setCurrentQuantity(newQuantity);
        inventoryInfo.setAvailableQuantity(newQuantity);
        inventoryInfo.setLastUpdated(LocalDateTime.now());
        
        // 记录库存变更
        if (oldQuantity != null && !oldQuantity.equals(newQuantity)) {
            recordInventoryChange(oldQuantity, newQuantity, source);
        }
    }

    /**
     * 记录库存变更
     */
    private void recordInventoryChange(Integer oldQuantity, Integer newQuantity, String source) {
        String changeRecord = String.format("%s|%s|%d|%d", 
            LocalDateTime.now(), source, oldQuantity, newQuantity);
        
        if (inventoryChanges == null) {
            inventoryChanges = changeRecord;
        } else {
            inventoryChanges = changeRecord + "\n" + inventoryChanges;
        }
        
        // 只保留最近10条变更记录
        String[] records = inventoryChanges.split("\n");
        if (records.length > 10) {
            inventoryChanges = String.join("\n", 
                java.util.Arrays.copyOf(records, 10));
        }
    }
}