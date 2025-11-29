package com.enterprise.brain.modules.integration.messaging.service;

import com.enterprise.brain.modules.integration.messaging.dto.request.MessageSendRequest;
import com.enterprise.brain.modules.integration.messaging.dto.response.MessageSendResponse;

public interface WechatService {
    
    /**
     * 发送微信消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendMessage(MessageSendRequest request);
    
    /**
     * 发送微信模板消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendTemplateMessage(MessageSendRequest request);
    
    /**
     * 发送企业微信应用消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendAppMessage(MessageSendRequest request);
    
    /**
     * 验证微信配置
     * @param webhookUrl webhook地址
     * @param secret 密钥
     * @return 是否验证成功
     */
    boolean testConnection(String webhookUrl, String secret);
}