package com.enterprise.brain.modules.integration.messaging.service;

import com.enterprise.brain.modules.integration.messaging.dto.request.MessageSendRequest;
import com.enterprise.brain.modules.integration.messaging.dto.response.MessageSendResponse;

public interface TeamsService {
    
    /**
     * 发送Teams消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendMessage(MessageSendRequest request);
    
    /**
     * 发送Teams文本消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendTextMessage(MessageSendRequest request);
    
    /**
     * 发送Teams自适应卡片消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendAdaptiveCardMessage(MessageSendRequest request);
    
    /**
     * 发送Teams富文本消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendRichTextMessage(MessageSendRequest request);
    
    /**
     * 验证Teams配置
     * @param webhookUrl webhook地址
     * @return 是否验证成功
     */
    boolean testConnection(String webhookUrl);
}