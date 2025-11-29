package com.enterprise.brain.modules.integration.messaging.service;

import com.enterprise.brain.modules.integration.messaging.dto.request.MessageSendRequest;
import com.enterprise.brain.modules.integration.messaging.dto.response.MessageSendResponse;

public interface EmailService {
    
    /**
     * 发送邮件
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendEmail(MessageSendRequest request);
    
    /**
     * 发送HTML邮件
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendHtmlEmail(MessageSendRequest request);
    
    /**
     * 发送带附件的邮件
     * @param request 消息发送请求
     * @param attachments 附件路径列表
     * @return 消息发送响应
     */
    MessageSendResponse sendEmailWithAttachments(MessageSendRequest request, String[] attachments);
    
    /**
     * 发送模板邮件
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendTemplateEmail(MessageSendRequest request);
    
    /**
     * 验证邮件配置
     * @return 是否验证成功
     */
    boolean testConnection();
}