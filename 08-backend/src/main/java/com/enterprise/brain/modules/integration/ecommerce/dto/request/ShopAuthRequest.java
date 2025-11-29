package com.enterprise.brain.modules.integration.ecommerce.dto.request;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.util.List;

/**
 * 店铺授权请求DTO
 * 
 * @author Enterprise Brain Team
 * @version 1.0
 */
@Data
public class ShopAuthRequest {

    /**
     * 电商平台类型
     */
    @NotBlank(message = "电商平台不能为空")
    private String platform;

    /**
     * 平台店铺ID
     */
    @NotBlank(message = "平台店铺ID不能为空")
    private String platformShopId;

    /**
     * 店铺名称
     */
    @NotBlank(message = "店铺名称不能为空")
    private String shopName;

    /**
     * 授权码或授权信息
     */
    @NotBlank(message = "授权码不能为空")
    private String authCode;

    /**
     * 回调地址
     */
    private String callbackUrl;

    /**
     * 授权范围
     */
    private List<String> scopes;

    /**
     * 授权配置
     */
    private AuthConfig authConfig;

    /**
     * 联系信息
     */
    private ContactInfo contactInfo;

    /**
     * 地址信息
     */
    private AddressInfo addressInfo;

    /**
     * 备注
     */
    private String remark;

    /**
     * 授权配置类
     */
    @Data
    public static class AuthConfig {
        private String appKey;
        private String appSecret;
        private String sessionKey;
        private String accessToken;
        private String refreshToken;
        private String sandbox;
        private String signMethod;
        private String apiVersion;
        private String format;
        private String lang;
        private String simplify;
        private Long expiresIn;
    }

    /**
     * 联系信息类
     */
    @Data
    public static class ContactInfo {
        private String contactPerson;
        private String contactPhone;
        private String contactEmail;
        private String contactQq;
        private String contactWechat;
    }

    /**
     * 地址信息类
     */
    @Data
    public static class AddressInfo {
        private String province;
        private String city;
        private String district;
        private String address;
        private String postalCode;
    }
}