package com.enterprise.brain.modules.ai.service;

import com.enterprise.brain.modules.ai.dto.request.AIChatRequest;
import com.enterprise.brain.modules.ai.dto.response.AIChatResponse;
import com.enterprise.brain.modules.ai.entity.AIConversation;
import com.enterprise.brain.modules.ai.entity.AIPrompt;

import java.util.List;
import java.util.Optional;

public interface AIChatService {
    
    /**
     * 发送聊天请求到AI模型
     */
    AIChatResponse chat(AIChatRequest request);
    
    /**
     * 创建新的对话
     */
    AIConversation createConversation(String userId, String title);
    
    /**
     * 获取对话列表
     */
    List<AIConversation> getConversations(String userId);
    
    /**
     * 获取单个对话
     */
    Optional<AIConversation> getConversation(String conversationId, String userId);
    
    /**
     * 更新对话标题
     */
    AIConversation updateConversationTitle(String conversationId, String userId, String title);
    
    /**
     * 删除对话
     */
    void deleteConversation(String conversationId, String userId);
    
    /**
     * 获取对话的提示历史
     */
    List<AIPrompt> getConversationPrompts(String conversationId, String userId);
    
    /**
     * 清除对话历史
     */
    AIConversation clearConversationHistory(String conversationId, String userId);
    
    /**
     * 生成对话标题
     */
    String generateConversationTitle(String message);
}