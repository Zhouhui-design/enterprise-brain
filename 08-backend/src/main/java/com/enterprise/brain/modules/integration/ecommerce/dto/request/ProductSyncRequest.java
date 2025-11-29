package com.enterprise.brain.modules.integration.ecommerce.dto.request;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

/**
 * 产品同步请求DTO
 * 
 * @author Enterprise Brain Team
 * @version 1.0
 */
@Data
public class ProductSyncRequest {

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
     * 平台产品ID列表
     */
    private List<String> platformProductIds;

    /**
     * 产品类目过滤
     */
    private List<String> categories;

    /**
     * 产品状态过滤
     */
    private List<String> productStatus;

    /**
     * 同步配置
     */
    private SyncConfig syncConfig;

    /**
     * 产品数据
     */
    private List<ProductData> productData;

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
         * 是否同步产品基本信息
         */
        private Boolean syncBasicInfo = true;

        /**
         * 是否同步产品描述
         */
        private Boolean syncDescription = true;

        /**
         * 是否同步产品图片
         */
        private Boolean syncImages = true;

        /**
         * 是否同步产品价格
         */
        private Boolean syncPrice = true;

        /**
         * 是否同步产品库存
         */
        private Boolean syncStock = true;

        /**
         * 是否同步产品规格
         */
        private Boolean syncSpecs = true;

        /**
         * 是否同步产品属性
         */
        private Boolean syncAttributes = true;

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
        private Integer batchSize = 50;

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

        /**
         * 是否启用价格策略
         */
        private Boolean enablePriceStrategy = false;

        /**
         * 价格策略配置
         */
        private PriceStrategy priceStrategy;

        /**
         * 是否启用库存策略
         */
        private Boolean enableStockStrategy = false;

        /**
         * 库存策略配置
         */
        private StockStrategy stockStrategy;
    }

    /**
     * 价格策略类
     */
    @Data
    public static class PriceStrategy {
        /**
         * 策略类型
         */
        private String strategyType;

        /**
         * 固定加价金额
         */
        private Double fixedMarkup;

        /**
         * 百分比加价
         */
        private Double percentageMarkup;

        /**
         * 批量价格规则
         */
        private List<BulkPriceRule> bulkPriceRules;

        /**
         * 会员价格规则
         */
        private List<MemberPriceRule> memberPriceRules;

        /**
         * 促销价格规则
         */
        private List<PromotionPriceRule> promotionPriceRules;
    }

    /**
     * 批量价格规则类
     */
    @Data
    public static class BulkPriceRule {
        private Integer minQuantity;
        private Integer maxQuantity;
        private Double price;
        private Double discountPercentage;
    }

    /**
     * 会员价格规则类
     */
    @Data
    public static class MemberPriceRule {
        private String memberLevel;
        private Double price;
        private Double discountPercentage;
    }

    /**
     * 促销价格规则类
     */
    @Data
    public static class PromotionPriceRule {
        private String promotionType;
        private String condition;
        private Double price;
        private Double discountPercentage;
        private java.time.LocalDateTime startTime;
        private java.time.LocalDateTime endTime;
    }

    /**
     * 库存策略类
     */
    @Data
    public static class StockStrategy {
        /**
         * 策略类型
         */
        private String strategyType;

        /**
         * 固定库存数量
         */
        private Integer fixedStock;

        /**
         * 百分比库存分配
         */
        private Double percentageAllocation;

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
    }

    /**
     * 产品数据类
     */
    @Data
    public static class ProductData {
        /**
         * 本地产品ID
         */
        private Long productId;

        /**
         * 平台产品ID
         */
        private String platformProductId;

        /**
         * 产品标题
         */
        private String title;

        /**
         * 产品描述
         */
        private String description;

        /**
         * 产品主图URL
         */
        private String mainImage;

        /**
         * 产品图片URL列表
         */
        private List<String> images;

        /**
         * 产品价格信息
         */
        private ProductPrice price;

        /**
         * 产品库存信息
         */
        private ProductStock stock;

        /**
         * 产品规格信息
         */
        private List<ProductSpec> specs;

        /**
         * 产品属性信息
         */
        private List<ProductAttribute> attributes;

        /**
         * 产品类目
         */
        private String category;

        /**
         * 产品品牌
         */
        private String brand;

        /**
         * 产品重量（克）
         */
        private Double weight;

        /**
         * 产品体积（立方厘米）
         */
        private Double volume;

        /**
         * 产品状态
         */
        private String status;

        /**
         * 扩展信息
         */
        private Map<String, Object> extraInfo;
    }

    /**
     * 产品价格类
     */
    @Data
    public static class ProductPrice {
        private Double originalPrice;
        private Double salePrice;
        private Double costPrice;
        private Double marketPrice;
        private Double promotionPrice;
        private String currency;
    }

    /**
     * 产品库存类
     */
    @Data
    public static class ProductStock {
        private Integer quantity;
        private Integer availableQuantity;
        private Integer reservedQuantity;
        private Integer soldQuantity;
        private Integer safetyStock;
        private String location;
    }

    /**
     * 产品规格类
     */
    @Data
    public static class ProductSpec {
        private String name;
        private String value;
        private String specType;
        private Integer sort;
    }

    /**
     * 产品属性类
     */
    @Data
    public static class ProductAttribute {
        private String name;
        private String value;
        private String attributeType;
        private Integer sort;
    }

    /**
     * 分页参数类
     */
    @Data
    public static class PageParam {
        private Integer pageNum = 1;
        private Integer pageSize = 100;
        private String orderBy = "created_time";
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
     * 检查是否有平台产品ID列表
     */
    public boolean hasPlatformProductIds() {
        return platformProductIds != null && !platformProductIds.isEmpty();
    }

    /**
     * 检查是否有产品数据
     */
    public boolean hasProductData() {
        return productData != null && !productData.isEmpty();
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

        // 检查产品数据有效性
        if (hasProductData()) {
            for (ProductData data : productData) {
                if (data.getProductId() == null && data.getPlatformProductId() == null) {
                    return false;
                }
                if (data.getTitle() == null || data.getTitle().trim().isEmpty()) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * 构建全量推送同步请求
     */
    public static ProductSyncRequest buildFullToPlatformSyncRequest(Long shopId, List<Long> productIds) {
        ProductSyncRequest request = new ProductSyncRequest();
        request.setShopId(shopId);
        request.setSyncType(SyncType.FULL);
        request.setSyncDirection(SyncDirection.TO_PLATFORM);
        request.setProductIds(productIds);
        return request;
    }

    /**
     * 构建全量拉取同步请求
     */
    public static ProductSyncRequest buildFullFromPlatformSyncRequest(Long shopId, List<String> platformProductIds) {
        ProductSyncRequest request = new ProductSyncRequest();
        request.setShopId(shopId);
        request.setSyncType(SyncType.FULL);
        request.setSyncDirection(SyncDirection.FROM_PLATFORM);
        request.setPlatformProductIds(platformProductIds);
        return request;
    }

    /**
     * 构建手动推送同步请求
     */
    public static ProductSyncRequest buildManualToPlatformSyncRequest(Long shopId, List<ProductData> productData) {
        ProductSyncRequest request = new ProductSyncRequest();
        request.setShopId(shopId);
        request.setSyncType(SyncType.MANUAL);
        request.setSyncDirection(SyncDirection.TO_PLATFORM);
        request.setProductData(productData);
        return request;
    }

    /**
     * 构建批量同步请求
     */
    public static ProductSyncRequest buildBatchSyncRequest(Long shopId, List<Long> productIds, SyncConfig syncConfig) {
        ProductSyncRequest request = new ProductSyncRequest();
        request.setShopId(shopId);
        request.setSyncType(SyncType.BATCH);
        request.setSyncDirection(SyncDirection.TO_PLATFORM);
        request.setProductIds(productIds);
        request.setSyncConfig(syncConfig);
        
        // 批量同步的默认配置
        if (request.getDefaultSyncConfig().getBatchSize() == null) {
            request.getDefaultSyncConfig().setBatchSize(20);
        }
        request.getDefaultSyncConfig().setTimeoutSeconds(600);
        
        return request;
    }
}