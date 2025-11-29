package com.enterprise.brain.modules.integration.ecommerce.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 店铺授权响应DTO
 * 
 * @author Enterprise Brain Team
 * @version 1.0
 */
@Data
public class ShopAuthResponse {

    /**
     * 授权状态
     */
    private String status;

    /**
     * 授权URL
     */
    private String authUrl;

    /**
     * 授权码
     */
    private String authCode;

    /**
     * 访问令牌
     */
    private String accessToken;

    /**
     * 刷新令牌
     */
    private String refreshToken;

    /**
     * 令牌过期时间
     */
    private LocalDateTime expiresIn;

    /**
     * 店铺信息
     */
    private ShopInfo shopInfo;

    /**
     * 权限范围
     */
    private List<String> scopes;

    /**
     * 授权配置
     */
    private AuthConfig authConfig;

    /**
     * 扩展信息
     */
    private Map<String, Object> extraInfo;

    /**
     * 授权状态枚举
     */
    public static class Status {
        public static final String PENDING = "PENDING";         // 待授权
        public static final String AUTHORIZED = "AUTHORIZED";     // 已授权
        public static final String EXPIRED = "EXPIRED";         // 已过期
        public static final String REJECTED = "REJECTED";         // 已拒绝
        public static final String INVALID = "INVALID";         // 无效
        public static final String REVOKED = "REVOKED";         // 已撤销
    }

    /**
     * 店铺信息类
     */
    @Data
    public static class ShopInfo {
        private String shopId;
        private String shopName;
        private String shopLogo;
        private String shopUrl;
        private String shopDescription;
        private String shopLevel;
        private String mainCategory;
        private String platform;
    }

    /**
     * 授权配置类
     */
    @Data
    public static class AuthConfig {
        private String appKey;
        private String appSecret;
        private String sessionKey;
        private String callbackUrl;
        private String sandbox;
        private String signMethod;
        private String apiVersion;
        private String format;
        private String lang;
        private String simplify;
    }

    /**
     * 检查是否已授权
     */
    public boolean isAuthorized() {
        return Status.AUTHORIZED.equals(status);
    }

    /**
     * 检查是否过期
     */
    public boolean isExpired() {
        return Status.EXPIRED.equals(status) || 
               (expiresIn != null && expiresIn.isBefore(LocalDateTime.now()));
    }

    /**
     * 检查是否需要刷新令牌
     */
    public boolean needRefreshToken() {
        return expiresIn != null && 
               expiresIn.isBefore(LocalDateTime.now().plusDays(1));
    }

    /**
     * 构建待授权响应
     */
    public static ShopAuthResponse buildPendingResponse(String authUrl) {
        ShopAuthResponse response = new ShopAuthResponse();
        response.setStatus(Status.PENDING);
        response.setAuthUrl(authUrl);
        return response;
    }

    /**
     * 构建已授权响应
     */
    public static ShopAuthResponse buildAuthorizedResponse(String accessToken, 
            String refreshToken, LocalDateTime expiresIn, ShopInfo shopInfo) {
        ShopAuthResponse response = new ShopAuthResponse();
        response.setStatus(Status.AUTHORIZED);
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setExpiresIn(expiresIn);
        response.setShopInfo(shopInfo);
        return response;
    }

    /**
     * 构建过期响应
     */
    public static ShopAuthResponse buildExpiredResponse() {
        ShopAuthResponse response = new ShopAuthResponse();
        response.setStatus(Status.EXPIRED);
        return response;
    }

    /**
     * 构建拒绝响应
     */
    public static ShopAuthResponse buildRejectedResponse(String reason) {
        ShopAuthResponse response = new ShopAuthResponse();
        response.setStatus(Status.REJECTED);
        if (response.getExtraInfo() == null) {
            response.setExtraInfo(new java.util.HashMap<>());
        }
        response.getExtraInfo().put("rejectReason", reason);
        return response;
    }
}