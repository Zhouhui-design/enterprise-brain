package com.enterprise.brain.modules.integration.messaging.dto.request;

import lombok.Data;

@Data
public class WebhookConfigRequest {
    
    private String platformType; // WECHAT, DINGTALK, FEISHU, SLACK, TEAMS
    private String webhookUrl;
    private String secret;
    private String accessToken;
    private String appId;
    private String appSecret;
    private String name;
    private String description;
    private boolean active;
    private String createdBy;
    private String updatedBy;
}