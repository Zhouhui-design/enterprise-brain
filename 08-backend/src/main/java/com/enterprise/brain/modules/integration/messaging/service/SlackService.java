package com.enterprise.brain.modules.integration.messaging.service;

import com.enterprise.brain.modules.integration.messaging.dto.request.MessageSendRequest;
import com.enterprise.brain.modules.integration.messaging.dto.response.MessageSendResponse;

public interface SlackService {
    
    /**
     * 发送Slack消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendMessage(MessageSendRequest request);
    
    /**
     * 发送Slack文本消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendTextMessage(MessageSendRequest request);
    
    /**
     * 发送Slack块消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendBlockMessage(MessageSendRequest request);
    
    /**
     * 发送Slack附件消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendAttachmentMessage(MessageSendRequest request);
    
    /**
     * 验证Slack配置
     * @param webhookUrl webhook地址
     * @return 是否验证成功
     */
    boolean testConnection(String webhookUrl);
}