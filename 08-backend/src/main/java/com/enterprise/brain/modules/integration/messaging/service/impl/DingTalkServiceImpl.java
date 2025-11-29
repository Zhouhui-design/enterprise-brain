package com.enterprise.brain.modules.integration.messaging.service.impl;

import com.enterprise.brain.modules.integration.messaging.dto.request.MessageSendRequest;
import com.enterprise.brain.modules.integration.messaging.dto.response.MessageSendResponse;
import com.enterprise.brain.modules.integration.messaging.service.DingTalkService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@Service
public class DingTalkServiceImpl implements DingTalkService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Override
    public MessageSendResponse sendMessage(MessageSendRequest request) {
        return sendTextMessage(request);
    }
    
    @Override
    public MessageSendResponse sendTextMessage(MessageSendRequest request) {
        try {
            // 构建钉钉文本消息体
            Map<String, Object> messageBody = new HashMap<>();
            messageBody.put("msgtype", "text");
            
            Map<String, String> textContent = new HashMap<>();
            textContent.put("content", request.getContent());
            messageBody.put("text", textContent);
            
            // 添加@功能（可选）
            if (request.getRecipient() != null) {
                Map<String, Object> at = new HashMap<>();
                at.put("atMobiles", new String[]{request.getRecipient()});
                at.put("isAtAll", false);
                messageBody.put("at", at);
            }
            
            String webhookUrl = getWebhookUrl(request);
            String response = restTemplate.postForObject(webhookUrl, messageBody, String.class);
            
            log.info("DingTalk text message sent successfully: {}", response);
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("消息发送成功")
                    .platformResponse(response)
                    .build();
        } catch (HttpClientErrorException e) {
            log.error("Failed to send DingTalk message: {}", e.getMessage());
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("消息发送失败: " + e.getMessage())
                    .platformResponse(e.getResponseBodyAsString())
                    .build();
        } catch (Exception e) {
            log.error("Error sending DingTalk message", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("消息发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public MessageSendResponse sendMarkdownMessage(MessageSendRequest request) {
        try {
            Map<String, Object> messageBody = new HashMap<>();
            messageBody.put("msgtype", "markdown");
            
            Map<String, String> markdownContent = new HashMap<>();
            markdownContent.put("title", request.getSubject() != null ? request.getSubject() : "通知");
            markdownContent.put("text", request.getContent());
            messageBody.put("markdown", markdownContent);
            
            String webhookUrl = getWebhookUrl(request);
            String response = restTemplate.postForObject(webhookUrl, messageBody, String.class);
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("Markdown消息发送成功")
                    .platformResponse(response)
                    .build();
        } catch (Exception e) {
            log.error("Error sending DingTalk markdown message", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("Markdown消息发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public MessageSendResponse sendCardMessage(MessageSendRequest request) {
        try {
            Map<String, Object> messageBody = new HashMap<>();
            messageBody.put("msgtype", "feedCard");
            
            // 简化的卡片消息实现
            Map<String, Object> feedCard = new HashMap<>();
            // 实际实现需要根据钉钉API文档构建正确的卡片结构
            messageBody.put("feedCard", feedCard);
            
            String webhookUrl = getWebhookUrl(request);
            String response = restTemplate.postForObject(webhookUrl, messageBody, String.class);
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("卡片消息发送成功")
                    .platformResponse(response)
                    .build();
        } catch (Exception e) {
            log.error("Error sending DingTalk card message", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("卡片消息发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public boolean testConnection(String webhookUrl, String secret) {
        try {
            Map<String, Object> testBody = new HashMap<>();
            testBody.put("msgtype", "text");
            Map<String, String> textContent = new HashMap<>();
            textContent.put("content", "Connection test from Brain system");
            testBody.put("text", textContent);
            
            String response = restTemplate.postForObject(webhookUrl, testBody, String.class);
            return true;
        } catch (Exception e) {
            log.error("DingTalk connection test failed", e);
            return false;
        }
    }
    
    private String getWebhookUrl(MessageSendRequest request) {
        // 从配置中获取webhookUrl，这里简化处理
        return request.getBusinessType();
    }
    
    private String generateMessageId() {
        return "DINGTALK-" + System.currentTimeMillis();
    }
}