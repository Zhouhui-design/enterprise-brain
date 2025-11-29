package com.enterprise.brain.modules.integration.messaging.service;

import com.enterprise.brain.modules.integration.messaging.dto.request.MessageSendRequest;
import com.enterprise.brain.modules.integration.messaging.dto.response.MessageSendResponse;

public interface QQService {
    
    /**
     * 发送QQ消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendMessage(MessageSendRequest request);
    
    /**
     * 发送QQ群消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendGroupMessage(MessageSendRequest request);
    
    /**
     * 发送QQ私聊消息
     * @param request 消息发送请求
     * @return 消息发送响应
     */
    MessageSendResponse sendPrivateMessage(MessageSendRequest request);
    
    /**
     * 验证QQ配置
     * @param appId 应用ID
     * @param appSecret 应用密钥
     * @return 是否验证成功
     */
    boolean testConnection(String appId, String appSecret);
}