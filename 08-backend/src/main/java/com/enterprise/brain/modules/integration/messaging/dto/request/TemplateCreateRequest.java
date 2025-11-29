package com.enterprise.brain.modules.integration.messaging.dto.request;

import lombok.Data;

@Data
public class TemplateCreateRequest {
    
    private String templateName;
    private String platformType; // WECHAT, DINGTALK, FEISHU, EMAIL, QQ, SLACK, TEAMS
    private String templateContent;
    private String subject;
    private String description;
    private boolean active;
    private String createdBy;
}