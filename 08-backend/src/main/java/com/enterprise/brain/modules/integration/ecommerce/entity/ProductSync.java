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
 * 产品同步实体类
 * 用于管理产品在各电商平台间的同步状态和信息
 * 
 * @author Enterprise Brain Team
 * @version 1.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "product_sync", indexes = {
    @Index(name = "idx_shop_id", columnList = "shopId"),
    @Index(name = "idx_product_id", columnList = "productId"),
    @Index(name = "idx_platform_product_id", columnList = "platform,platformProductId"),
    @Index(name = "idx_sync_status", columnList = "syncStatus"),
    @Index(name = "idx_last_sync_at", columnList = "lastSyncAt"),
    @Index(name = "idx_created_at", columnList = "createdAt")
})
public class ProductSync extends BaseEntity {

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
     * 平台产品ID
     */
    @NotBlank(message = "平台产品ID不能为空")
    @Column(name = "platform_product_id", nullable = false, length = 100)
    private String platformProductId;

    /**
     * 平台商品编码
     */
    @Column(name = "platform_product_code", length = 100)
    private String platformProductCode;

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
     * 同步类型
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "sync_type", length = 20)
    private SyncType syncType;

    /**
     * 产品标题
     */
    @Column(name = "product_title", length = 500)
    private String productTitle;

    /**
     * 产品描述
     */
    @Column(name = "product_description", columnDefinition = "TEXT")
    private String productDescription;

    /**
     * 产品图片URL列表 - JSON格式存储
     */
    @Column(name = "product_images", columnDefinition = "TEXT")
    private String productImages;

    /**
     * 产品价格信息
     */
    @Embedded
    private PriceInfo priceInfo;

    /**
     * 产品库存信息
     */
    @Embedded
    private StockInfo stockInfo;

    /**
     * 产品规格信息 - JSON格式存储
     */
    @Column(name = "product_specs", columnDefinition = "TEXT")
    private String productSpecs;

    /**
     * 产品属性信息 - JSON格式存储
     */
    @Column(name = "product_attributes", columnDefinition = "TEXT")
    private String productAttributes;

    /**
     * 同步配置 - JSON格式存储
     */
    @Column(name = "sync_config", columnDefinition = "TEXT")
    private String syncConfig;

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
     * 产品状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "product_status", length = 20)
    private ProductStatus productStatus;

    /**
     * 审核状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", length = 20)
    private ReviewStatus reviewStatus;

    /**
     * 备注信息
     */
    @Column(name = "remark", length = 500)
    private String remark;

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
     * 同步状态枚举
     */
    public enum SyncStatus {
        PENDING("待同步"),
        SYNCING("同步中"),
        SUCCESS("同步成功"),
        FAILED("同步失败"),
        CONFLICT("数据冲突"),
        SKIPPED("跳过同步");

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
     * 同步类型枚举
     */
    public enum SyncType {
        FULL("全量同步"),
        INCREMENTAL("增量同步"),
        MANUAL("手动同步"),
        SCHEDULED("定时同步");

        private final String description;

        SyncType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 产品状态枚举
     */
    public enum ProductStatus {
        ACTIVE("上架"),
        INACTIVE("下架"),
        DRAFT("草稿"),
        DELETED("已删除");

        private final String description;

        ProductStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 审核状态枚举
     */
    public enum ReviewStatus {
        PENDING("待审核"),
        APPROVED("已通过"),
        REJECTED("已拒绝"),
        REVIEWING("审核中");

        private final String description;

        ReviewStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 价格信息嵌入类
     */
    @Embeddable
    @Data
    public static class PriceInfo {
        @Column(name = "original_price", precision = 10, scale = 2)
        private Double originalPrice;

        @Column(name = "sale_price", precision = 10, scale = 2)
        private Double salePrice;

        @Column(name = "cost_price", precision = 10, scale = 2)
        private Double costPrice;

        @Column(name = "market_price", precision = 10, scale = 2)
        private Double marketPrice;

        @Column(name = "promotion_price", precision = 10, scale = 2)
        private Double promotionPrice;

        @Column(name = "currency", length = 10)
        private String currency = "CNY";
    }

    /**
     * 库存信息嵌入类
     */
    @Embeddable
    @Data
    public static class StockInfo {
        @Column(name = "stock_quantity")
        private Integer stockQuantity;

        @Column(name = "available_quantity")
        private Integer availableQuantity;

        @Column(name = "reserved_quantity")
        private Integer reservedQuantity;

        @Column(name = "sold_quantity")
        private Integer soldQuantity;

        @Column(name = "stock_warning_threshold")
        private Integer stockWarningThreshold;

        @Column(name = "stock_status", length = 20)
        private String stockStatus;
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
            long delayMinutes = (long) Math.pow(2, retryCount) * 5; // 5分钟、10分钟、20分钟...
            this.nextSyncAt = lastSyncAt.plusMinutes(delayMinutes);
        }
    }
}