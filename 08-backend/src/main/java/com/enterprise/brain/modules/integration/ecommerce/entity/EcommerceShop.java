package com.enterprise.brain.modules.integration.ecommerce.entity;

import com.enterprise.brain.common.base.BaseEntity;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 电商平台店铺实体类
 * 用于管理各电商平台的店铺信息
 * 
 * @author Enterprise Brain Team
 * @version 1.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "ecommerce_shop", indexes = {
    @Index(name = "idx_platform_shop_id", columnList = "platform,platformShopId"),
    @Index(name = "idx_user_id", columnList = "userId"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_created_at", columnList = "createdAt")
})
public class EcommerceShop extends BaseEntity {

    /**
     * 主键ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 用户ID - 店铺所属用户
     */
    @NotNull(message = "用户ID不能为空")
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * 电商平台类型
     * TAOBAO - 淘宝
     * TMALL - 天猫
     * JD - 京东
     * PDD - 拼多多
     * DOUYIN - 抖音
     * ALIBABA_1688 - 阿里巴巴1688
     * AMAZON - 亚马逊
     * SHOPIFY - Shopify
     */
    @NotBlank(message = "电商平台不能为空")
    @Enumerated(EnumType.STRING)
    @Column(name = "platform", nullable = false, length = 20)
    private Platform platform;

    /**
     * 平台店铺ID
     */
    @NotBlank(message = "平台店铺ID不能为空")
    @Column(name = "platform_shop_id", nullable = false, length = 100)
    private String platformShopId;

    /**
     * 店铺名称
     */
    @NotBlank(message = "店铺名称不能为空")
    @Column(name = "shop_name", nullable = false, length = 200)
    private String shopName;

    /**
     * 店铺描述
     */
    @Column(name = "shop_description", length = 1000)
    private String shopDescription;

    /**
     * 店铺logo URL
     */
    @Column(name = "shop_logo", length = 500)
    private String shopLogo;

    /**
     * 店铺网址
     */
    @Column(name = "shop_url", length = 500)
    private String shopUrl;

    /**
     * 店铺状态
     */
    @NotNull(message = "店铺状态不能为空")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ShopStatus status;

    /**
     * 认证状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "auth_status", length = 20)
    private AuthStatus authStatus;

    /**
     * 店铺等级
     */
    @Column(name = "shop_level", length = 50)
    private String shopLevel;

    /**
     * 主营类目
     */
    @Column(name = "main_category", length = 200)
    private String mainCategory;

    /**
     * 授权信息 - JSON格式存储
     */
    @Column(name = "auth_info", columnDefinition = "TEXT")
    private String authInfo;

    /**
     * API配置信息 - JSON格式存储
     */
    @Column(name = "api_config", columnDefinition = "TEXT")
    private String apiConfig;

    /**
     * 同步配置 - JSON格式存储
     */
    @Column(name = "sync_config", columnDefinition = "TEXT")
    private String syncConfig;

    /**
     * 店铺联系方式
     */
    @Embedded
    private ContactInfo contactInfo;

    /**
     * 店铺地址信息
     */
    @Embedded
    private AddressInfo addressInfo;

    /**
     * 店铺统计信息
     */
    @Embedded
    private ShopStatistics statistics;

    /**
     * 最后同步时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    /**
     * 授权过期时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "auth_expire_at")
    private LocalDateTime authExpireAt;

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
     * 电商平台类型枚举
     */
    public enum Platform {
        TAOBAO("淘宝"),
        TMALL("天猫"),
        JD("京东"),
        PDD("拼多多"),
        DOUYIN("抖音"),
        ALIBABA_1688("阿里巴巴1688"),
        AMAZON("亚马逊"),
        SHOPIFY("Shopify");

        private final String description;

        Platform(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 店铺状态枚举
     */
    public enum ShopStatus {
        ACTIVE("正常"),
        INACTIVE("停用"),
        SUSPENDED("暂停"),
        CLOSED("关闭");

        private final String description;

        ShopStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 认证状态枚举
     */
    public enum AuthStatus {
        PENDING("待认证"),
        AUTHORIZED("已授权"),
        EXPIRED("已过期"),
        REJECTED("已拒绝");

        private final String description;

        AuthStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 联系信息嵌入类
     */
    @Embeddable
    @Data
    public static class ContactInfo {
        @Column(name = "contact_person", length = 100)
        private String contactPerson;

        @Column(name = "contact_phone", length = 50)
        private String contactPhone;

        @Column(name = "contact_email", length = 100)
        private String contactEmail;

        @Column(name = "contact_qq", length = 50)
        private String contactQq;

        @Column(name = "contact_wechat", length = 50)
        private String contactWechat;
    }

    /**
     * 地址信息嵌入类
     */
    @Embeddable
    @Data
    public static class AddressInfo {
        @Column(name = "province", length = 50)
        private String province;

        @Column(name = "city", length = 50)
        private String city;

        @Column(name = "district", length = 50)
        private String district;

        @Column(name = "address", length = 500)
        private String address;

        @Column(name = "postal_code", length = 20)
        private String postalCode;
    }

    /**
     * 店铺统计信息嵌入类
     */
    @Embeddable
    @Data
    public static class ShopStatistics {
        @Column(name = "total_products")
        private Integer totalProducts = 0;

        @Column(name = "total_orders")
        private Integer totalOrders = 0;

        @Column(name = "total_sales")
        private Double totalSales = 0.0;

        @Column(name = "avg_rating")
        private Double avgRating = 0.0;

        @Column(name = "followers_count")
        private Integer followersCount = 0;

        @Column(name = "products_count")
        private Integer productsCount = 0;

        @Column(name = "positive_rate")
        private Double positiveRate = 0.0;
    }

    /**
     * 检查店铺是否已授权
     */
    public boolean isAuthorized() {
        return AuthStatus.AUTHORIZED.equals(authStatus) && 
               authExpireAt != null && 
               authExpireAt.isAfter(LocalDateTime.now());
    }

    /**
     * 检查店铺是否可以同步
     */
    public boolean canSync() {
        return ShopStatus.ACTIVE.equals(status) && 
               isAuthorized() && 
               Boolean.TRUE.equals(autoSyncEnabled);
    }

    /**
     * 获取店铺全称（平台+店铺名）
     */
    public String getFullShopName() {
        return platform.getDescription() + " - " + shopName;
    }
}