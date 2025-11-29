package com.enterprise.brain.modules.integration.messaging.dto.request;

import lombok.Data;
import java.util.Map;

@Data
public class MessageSendRequest {
    
    private String platformType; // WECHAT, DINGTALK, FEISHU, EMAIL, QQ, SLACK, TEAMS
    private String recipient; // 接收者，可以是邮箱、手机号、用户ID等
    private String sender; // 发送者（可选）
    private String subject; // 消息主题（如邮件标题）
    private String content; // 消息内容
    private String templateId; // 模板ID（可选）
    private Map<String, Object> templateParams; // 模板参数
    private String businessType; // 业务类型
    private String businessId; // 业务ID
    private boolean isHtml; // 是否为HTML内容
    private boolean urgent; // 是否加急
}