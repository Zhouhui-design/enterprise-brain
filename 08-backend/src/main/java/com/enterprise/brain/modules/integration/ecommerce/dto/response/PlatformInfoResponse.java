package com.enterprise.brain.modules.integration.ecommerce.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 平台信息响应DTO
 * 
 * @author Enterprise Brain Team
 * @version 1.0
 */
@Data
public class PlatformInfoResponse {

    /**
     * 平台类型
     */
    private String platform;

    /**
     * 平台名称
     */
    private String platformName;

    /**
     * 平台版本
     */
    private String platformVersion;

    /**
     * 支持的功能
     */
    private List<String> supportedFeatures;

    /**
     * API限制信息
     */
    private ApiLimitInfo apiLimitInfo;

    /**
     * 认证配置要求
     */
    private AuthRequirement authRequirement;

    /**
     * 字段映射配置
     */
    private FieldMappingInfo fieldMappingInfo;

    /**
     * 状态映射配置
     */
    private StatusMappingInfo statusMappingInfo;

    /**
     * 扩展信息
     */
    private Map<String, Object> extraInfo;

    /**
     * API限制信息类
     */
    @Data
    public static class ApiLimitInfo {
        /**
         * 每日最大请求数
         */
        private Integer maxDailyRequests;

        /**
         * 每小时最大请求数
         */
        private Integer maxHourlyRequests;

        /**
         * 每分钟最大请求数
         */
        private Integer maxMinuteRequests;

        /**
         * 批量操作最大数量
         */
        private Integer maxBatchSize;

        /**
         * 响应超时时间（秒）
         */
        private Integer responseTimeoutSeconds;

        /**
         * 重试次数限制
         */
        private Integer maxRetryTimes;

        /**
         * 限制类型
         */
        private String limitType;

        /**
         * 限制时间窗口
         */
        private String limitTimeWindow;
    }

    /**
     * 认证配置要求类
     */
    @Data
    public static class AuthRequirement {
        /**
         * 必需的认证字段
         */
        private List<String> requiredAuthFields;

        /**
         * 可选的认证字段
         */
        private List<String> optionalAuthFields;

        /**
         * 授权URL模板
         */
        private String authUrlTemplate;

        /**
         * 回调URL要求
         */
        private List<String> callbackUrlRequirements;

        /**
         * 令牌刷新机制
         */
        private String tokenRefreshMechanism;

        /**
         * 令牌有效期
         */
        private Integer tokenValidityDays;

        /**
         * 授权范围选项
         */
        private List<AuthScope> authScopeOptions;
    }

    /**
     * 授权范围类
     */
    @Data
    public static class AuthScope {
        private String scope;
        private String description;
        private Boolean required;
        private List<String> permissions;
    }

    /**
     * 字段映射信息类
     */
    @Data
    public static class FieldMappingInfo {
        /**
         * 产品字段映射
         */
        private Map<String, String> productFieldMapping;

        /**
         * 订单字段映射
         */
        private Map<String, String> orderFieldMapping;

        /**
         * 用户字段映射
         */
        private Map<String, String> userFieldMapping;

        /**
         * 地址字段映射
         */
        private Map<String, String> addressFieldMapping;

        /**
         * 物流字段映射
         */
        private Map<String, String> logisticsFieldMapping;

        /**
         * 支付字段映射
         */
        private Map<String, String> paymentFieldMapping;

        /**
         * 自定义字段映射
         */
        private Map<String, String> customFieldMapping;
    }

    /**
     * 状态映射信息类
     */
    @Data
    public static class StatusMappingInfo {
        /**
         * 订单状态映射
         */
        private Map<String, String> orderStatusMapping;

        /**
         * 支付状态映射
         */
        private Map<String, String> paymentStatusMapping;

        /**
         * 发货状态映射
         */
        private Map<String, String> shippingStatusMapping;

        /**
         * 退款状态映射
         */
        private Map<String, String> refundStatusMapping;

        /**
         * 产品状态映射
         */
        private Map<String, String> productStatusMapping;

        /**
         * 审核状态映射
         */
        private Map<String, String> reviewStatusMapping;
    }

    /**
     * 检查是否支持特定功能
     */
    public boolean supportsFeature(String feature) {
        return supportedFeatures != null && supportedFeatures.contains(feature);
    }

    /**
     * 获取默认字段映射
     */
    public FieldMappingInfo getDefaultFieldMapping() {
        if (fieldMappingInfo == null) {
            fieldMappingInfo = new FieldMappingInfo();
            fieldMappingInfo.setProductFieldMapping(new java.util.HashMap<>());
            fieldMappingInfo.setOrderFieldMapping(new java.util.HashMap<>());
            fieldMappingInfo.setUserFieldMapping(new java.util.HashMap<>());
            fieldMappingInfo.setAddressFieldMapping(new java.util.HashMap<>());
            fieldMappingInfo.setLogisticsFieldMapping(new java.util.HashMap<>());
            fieldMappingInfo.setPaymentFieldMapping(new java.util.HashMap<>());
            fieldMappingInfo.setCustomFieldMapping(new java.util.HashMap<>());
        }
        return fieldMappingInfo;
    }

    /**
     * 获取默认状态映射
     */
    public StatusMappingInfo getDefaultStatusMapping() {
        if (statusMappingInfo == null) {
            statusMappingInfo = new StatusMappingInfo();
            statusMappingInfo.setOrderStatusMapping(new java.util.HashMap<>());
            statusMappingInfo.setPaymentStatusMapping(new java.util.HashMap<>());
            statusMappingInfo.setShippingStatusMapping(new java.util.HashMap<>());
            statusMappingInfo.setRefundStatusMapping(new java.util.HashMap<>());
            statusMappingInfo.setProductStatusMapping(new java.util.HashMap<>());
            statusMappingInfo.setReviewStatusMapping(new java.util.HashMap<>());
        }
        return statusMappingInfo;
    }

    /**
     * 构建淘宝平台信息
     */
    public static PlatformInfoResponse buildTaobaoInfo() {
        PlatformInfoResponse response = new PlatformInfoResponse();
        response.setPlatform("TAOBAO");
        response.setPlatformName("淘宝网");
        response.setPlatformVersion("v2.0");
        
        response.setSupportedFeatures(java.util.Arrays.asList(
            "ORDER_SYNC", "PRODUCT_SYNC", "INVENTORY_SYNC", 
            "AUTH_MANAGEMENT", "WEBHOOK_NOTIFICATION"
        ));
        
        ApiLimitInfo limitInfo = new ApiLimitInfo();
        limitInfo.setMaxDailyRequests(100000);
        limitInfo.setMaxHourlyRequests(5000);
        limitInfo.setMaxMinuteRequests(100);
        limitInfo.setMaxBatchSize(100);
        limitInfo.setResponseTimeoutSeconds(30);
        limitInfo.setMaxRetryTimes(3);
        limitInfo.setLimitType("RATE_LIMIT");
        limitInfo.setLimitTimeWindow("SLIDING_WINDOW");
        response.setApiLimitInfo(limitInfo);
        
        return response;
    }

    /**
     * 构建天猫平台信息
     */
    public static PlatformInfoResponse buildTmallInfo() {
        PlatformInfoResponse response = new PlatformInfoResponse();
        response.setPlatform("TMALL");
        response.setPlatformName("天猫商城");
        response.setPlatformVersion("v2.0");
        
        response.setSupportedFeatures(java.util.Arrays.asList(
            "ORDER_SYNC", "PRODUCT_SYNC", "INVENTORY_SYNC", 
            "AUTH_MANAGEMENT", "WEBHOOK_NOTIFICATION", 
            "BRAND_MANAGEMENT", "PROMOTION_MANAGEMENT"
        ));
        
        ApiLimitInfo limitInfo = new ApiLimitInfo();
        limitInfo.setMaxDailyRequests(200000);
        limitInfo.setMaxHourlyRequests(10000);
        limitInfo.setMaxMinuteRequests(200);
        limitInfo.setMaxBatchSize(200);
        limitInfo.setResponseTimeoutSeconds(30);
        limitInfo.setMaxRetryTimes(3);
        response.setApiLimitInfo(limitInfo);
        
        return response;
    }

    /**
     * 构建京东平台信息
     */
    public static PlatformInfoResponse buildJDInfo() {
        PlatformInfoResponse response = new PlatformInfoResponse();
        response.setPlatform("JD");
        response.setPlatformName("京东商城");
        response.setPlatformVersion("v2.0");
        
        response.setSupportedFeatures(java.util.Arrays.asList(
            "ORDER_SYNC", "PRODUCT_SYNC", "INVENTORY_SYNC", 
            "AUTH_MANAGEMENT", "WEBHOOK_NOTIFICATION",
            "LOGISTICS_SYNC", "FINANCE_SYNC"
        ));
        
        ApiLimitInfo limitInfo = new ApiLimitInfo();
        limitInfo.setMaxDailyRequests(150000);
        limitInfo.setMaxHourlyRequests(8000);
        limitInfo.setMaxMinuteRequests(150);
        limitInfo.setMaxBatchSize(150);
        limitInfo.setResponseTimeoutSeconds(25);
        limitInfo.setMaxRetryTimes(3);
        response.setApiLimitInfo(limitInfo);
        
        return response;
    }

    /**
     * 构建拼多多平台信息
     */
    public static PlatformInfoResponse buildPddInfo() {
        PlatformInfoResponse response = new PlatformInfoResponse();
        response.setPlatform("PDD");
        response.setPlatformName("拼多多");
        response.setPlatformVersion("v1.0");
        
        response.setSupportedFeatures(java.util.Arrays.asList(
            "ORDER_SYNC", "PRODUCT_SYNC", "INVENTORY_SYNC", 
            "AUTH_MANAGEMENT", "PROMOTION_MANAGEMENT"
        ));
        
        ApiLimitInfo limitInfo = new ApiLimitInfo();
        limitInfo.setMaxDailyRequests(80000);
        limitInfo.setMaxHourlyRequests(4000);
        limitInfo.setMaxMinuteRequests(80);
        limitInfo.setMaxBatchSize(80);
        limitInfo.setResponseTimeoutSeconds(35);
        limitInfo.setMaxRetryTimes(2);
        response.setApiLimitInfo(limitInfo);
        
        return response;
    }

    /**
     * 构建抖音平台信息
     */
    public static PlatformInfoResponse buildDouyinInfo() {
        PlatformInfoResponse response = new PlatformInfoResponse();
        response.setPlatform("DOUYIN");
        response.setPlatformName("抖音电商");
        response.setPlatformVersion("v1.0");
        
        response.setSupportedFeatures(java.util.Arrays.asList(
            "ORDER_SYNC", "PRODUCT_SYNC", "INVENTORY_SYNC", 
            "AUTH_MANAGEMENT", "LIVE_STREAM_SYNC", 
            "CONTENT_MANAGEMENT"
        ));
        
        ApiLimitInfo limitInfo = new ApiLimitInfo();
        limitInfo.setMaxDailyRequests(60000);
        limitInfo.setMaxHourlyRequests(3000);
        limitInfo.setMaxMinuteRequests(60);
        limitInfo.setMaxBatchSize(50);
        limitInfo.setResponseTimeoutSeconds(20);
        limitInfo.setMaxRetryTimes(3);
        response.setApiLimitInfo(limitInfo);
        
        return response;
    }

    /**
     * 构建阿里巴巴1688平台信息
     */
    public static PlatformInfoResponse buildAlibaba1688Info() {
        PlatformInfoResponse response = new PlatformInfoResponse();
        response.setPlatform("ALIBABA_1688");
        response.setPlatformName("阿里巴巴1688");
        response.setPlatformVersion("v2.0");
        
        response.setSupportedFeatures(java.util.Arrays.asList(
            "ORDER_SYNC", "PRODUCT_SYNC", "INVENTORY_SYNC", 
            "AUTH_MANAGEMENT", "SUPPLIER_MANAGEMENT",
            "PROCUREMENT_SYNC"
        ));
        
        ApiLimitInfo limitInfo = new ApiLimitInfo();
        limitInfo.setMaxDailyRequests(120000);
        limitInfo.setMaxHourlyRequests(6000);
        limitInfo.setMaxMinuteRequests(120);
        limitInfo.setMaxBatchSize(120);
        limitInfo.setResponseTimeoutSeconds(30);
        limitInfo.setMaxRetryTimes(3);
        response.setApiLimitInfo(limitInfo);
        
        return response;
    }

    /**
     * 构建亚马逊平台信息
     */
    public static PlatformInfoResponse buildAmazonInfo() {
        PlatformInfoResponse response = new PlatformInfoResponse();
        response.setPlatform("AMAZON");
        response.setPlatformName("亚马逊");
        response.setPlatformVersion("v3.0");
        
        response.setSupportedFeatures(java.util.Arrays.asList(
            "ORDER_SYNC", "PRODUCT_SYNC", "INVENTORY_SYNC", 
            "AUTH_MANAGEMENT", "WEBHOOK_NOTIFICATION",
            "FBA_SYNC", "MULTI_MARKETPLACE"
        ));
        
        ApiLimitInfo limitInfo = new ApiLimitInfo();
        limitInfo.setMaxDailyRequests(200000);
        limitInfo.setMaxHourlyRequests(10000);
        limitInfo.setMaxMinuteRequests(200);
        limitInfo.setMaxBatchSize(200);
        limitInfo.setResponseTimeoutSeconds(25);
        limitInfo.setMaxRetryTimes(5);
        response.setApiLimitInfo(limitInfo);
        
        return response;
    }

    /**
     * 构建Shopify平台信息
     */
    public static PlatformInfoResponse buildShopifyInfo() {
        PlatformInfoResponse response = new PlatformInfoResponse();
        response.setPlatform("SHOPIFY");
        response.setPlatformName("Shopify");
        response.setPlatformVersion("v2024-01");
        
        response.setSupportedFeatures(java.util.Arrays.asList(
            "ORDER_SYNC", "PRODUCT_SYNC", "INVENTORY_SYNC", 
            "AUTH_MANAGEMENT", "WEBHOOK_NOTIFICATION",
            "CUSTOMER_SYNC", "THEME_CUSTOMIZATION"
        ));
        
        ApiLimitInfo limitInfo = new ApiLimitInfo();
        limitInfo.setMaxDailyRequests(180000);
        limitInfo.setMaxHourlyRequests(9000);
        limitInfo.setMaxMinuteRequests(180);
        limitInfo.setMaxBatchSize(250);
        limitInfo.setResponseTimeoutSeconds(20);
        limitInfo.setMaxRetryTimes(3);
        response.setApiLimitInfo(limitInfo);
        
        return response;
    }
}