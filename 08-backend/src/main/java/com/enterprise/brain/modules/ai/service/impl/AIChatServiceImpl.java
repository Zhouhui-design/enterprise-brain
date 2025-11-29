package com.enterprise.brain.modules.ai.service.impl;

import com.enterprise.brain.modules.ai.config.AIConfig;
import com.enterprise.brain.modules.ai.config.ModelConfig;
import com.enterprise.brain.modules.ai.dto.request.AIChatRequest;
import com.enterprise.brain.modules.ai.dto.response.AIChatResponse;
import com.enterprise.brain.modules.ai.entity.AIConversation;
import com.enterprise.brain.modules.ai.entity.AIPrompt;
import com.enterprise.brain.modules.ai.repository.AIConversationRepository;
import com.enterprise.brain.modules.ai.service.AIChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AIChatServiceImpl implements AIChatService {

    @Autowired
    private AIConversationRepository conversationRepository;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private AIConfig aiConfig;
    
    @Autowired
    private ModelConfig modelConfig;
    
    @Override
    public AIChatResponse chat(AIChatRequest request) {
        AIChatResponse response = new AIChatResponse();
        try {
            // 验证请求参数
            if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
                throw new IllegalArgumentException("Message cannot be empty");
            }
            
            // 处理对话
            AIConversation conversation = null;
            if (request.getConversationId() != null) {
                conversation = getConversation(request.getConversationId(), request.getUserId())
                    .orElseThrow(() -> new RuntimeException("Conversation not found"));
            } else {
                // 创建新对话
                String title = request.getConversationId() != null ? "New Conversation" : 
                               generateConversationTitle(request.getMessage());
                conversation = createConversation(request.getUserId(), title);
                response.setConversationId(conversation.getConversationId());
            }
            
            // 构建AI请求
            String modelId = request.getModelId() != null ? request.getModelId() : aiConfig.getDefaultModel();
            
            // 模拟AI响应（实际项目中应调用真实的AI服务API）
            String aiResponse = simulateAIResponse(request.getMessage(), modelId);
            
            // 保存对话记录
            AIPrompt prompt = new AIPrompt();
            prompt.setPromptId(UUID.randomUUID().toString());
            prompt.setConversation(conversation);
            prompt.setUserMessage(request.getMessage());
            prompt.setAssistantResponse(aiResponse);
            prompt.setModelUsed(modelId);
            prompt.setTokensUsed(estimateTokens(aiResponse));
            prompt.setResponseTime(1500L); // 模拟响应时间
            
            conversation.getPrompts().add(prompt);
            conversationRepository.save(conversation);
            
            // 构建响应
            response.setMessageId(prompt.getPromptId());
            response.setResponse(aiResponse);
            response.setSuccess(true);
            response.setTokensUsed(prompt.getTokensUsed());
            response.setResponseTimeMs(prompt.getResponseTime());
            response.setModelId(modelId);
            
        } catch (Exception e) {
            response.setSuccess(false);
            response.setErrorMessage(e.getMessage());
        }
        return response;
    }
    
    @Override
    public AIConversation createConversation(String userId, String title) {
        AIConversation conversation = new AIConversation();
        conversation.setConversationId(UUID.randomUUID().toString());
        conversation.setUserId(userId);
        conversation.setTitle(title);
        conversation.setPrompts(new ArrayList<>());
        return conversationRepository.save(conversation);
    }
    
    @Override
    public List<AIConversation> getConversations(String userId) {
        return conversationRepository.findByUserIdAndActive(userId, true);
    }
    
    @Override
    public Optional<AIConversation> getConversation(String conversationId, String userId) {
        return conversationRepository.findByConversationIdAndUserId(conversationId, userId);
    }
    
    @Override
    public AIConversation updateConversationTitle(String conversationId, String userId, String title) {
        AIConversation conversation = getConversation(conversationId, userId)
            .orElseThrow(() -> new RuntimeException("Conversation not found"));
        conversation.setTitle(title);
        return conversationRepository.save(conversation);
    }
    
    @Override
    public void deleteConversation(String conversationId, String userId) {
        AIConversation conversation = getConversation(conversationId, userId)
            .orElseThrow(() -> new RuntimeException("Conversation not found"));
        conversation.setActive(false);
        conversationRepository.save(conversation);
    }
    
    @Override
    public List<AIPrompt> getConversationPrompts(String conversationId, String userId) {
        AIConversation conversation = getConversation(conversationId, userId)
            .orElseThrow(() -> new RuntimeException("Conversation not found"));
        return conversation.getPrompts();
    }
    
    @Override
    public AIConversation clearConversationHistory(String conversationId, String userId) {
        AIConversation conversation = getConversation(conversationId, userId)
            .orElseThrow(() -> new RuntimeException("Conversation not found"));
        conversation.getPrompts().clear();
        return conversationRepository.save(conversation);
    }
    
    @Override
    public String generateConversationTitle(String message) {
        // 简单实现，实际项目中可以使用AI生成更合适的标题
        return message.length() > 30 ? message.substring(0, 30) + "..." : message;
    }
    
    // 辅助方法：模拟AI响应
    private String simulateAIResponse(String message, String modelId) {
        // 模拟不同模型的响应
        Map<String, String> responses = new HashMap<>();
        responses.put("gpt-4", "I'm GPT-4, how can I help you today?");
        responses.put("claude-3", "I'm Claude 3, your AI assistant.");
        responses.put("llama3", "I'm Llama 3, ready to assist you.");
        
        return responses.getOrDefault(modelId, "I'm your AI assistant. How can I help you?");
    }
    
    // 辅助方法：估计token数量
    private Long estimateTokens(String text) {
        return (long) (text.length() / 1.3); // 简单估计
    }
}