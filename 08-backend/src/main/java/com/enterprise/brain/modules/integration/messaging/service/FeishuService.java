package com.enterprise.brain.modules.integration.messaging.service;

import com.enterprise.brain.modules.integration.messaging.dto.request.MessageSendRequest;
import com.enterprise.brain.modules.integration.messaging.dto.response.MessageSendResponse;

public interface FeishuService {
    
    /**
     * 发送飞书消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendMessage(MessageSendRequest request);
    
    /**
     * 发送飞书文本消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendTextMessage(MessageSendRequest request);
    
    /**
     * 发送飞书富文本消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendRichTextMessage(MessageSendRequest request);
    
    /**
     * 发送飞书卡片消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendCardMessage(MessageSendRequest request);
    
    /**
     * 验证飞书配置
     * @param webhookUrl webhook地址
     * @param secret 密钥
     * @return 是否验证成功
     */
    boolean testConnection(String webhookUrl, String secret);
}