package com.enterprise.brain.modules.integration.messaging.service.impl;

import com.enterprise.brain.modules.integration.messaging.dto.request.MessageSendRequest;
import com.enterprise.brain.modules.integration.messaging.dto.response.MessageSendResponse;
import com.enterprise.brain.modules.integration.messaging.service.TeamsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

@Slf4j
@Service
public class TeamsServiceImpl implements TeamsService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Override
    public MessageSendResponse sendMessage(MessageSendRequest request) {
        return sendTextMessage(request);
    }
    
    @Override
    public MessageSendResponse sendTextMessage(MessageSendRequest request) {
        try {
            // 构建Teams文本消息体
            Map<String, Object> messageBody = new HashMap<>();
            Map<String, String> textContent = new HashMap<>();
            textContent.put("content", request.getContent());
            messageBody.put("text", textContent);
            
            String webhookUrl = getWebhookUrl(request);
            String response = restTemplate.postForObject(webhookUrl, messageBody, String.class);
            
            log.info("Teams text message sent successfully: {}", response);
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("消息发送成功")
                    .platformResponse(response)
                    .build();
        } catch (HttpClientErrorException e) {
            log.error("Failed to send Teams message: {}", e.getMessage());
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("消息发送失败: " + e.getMessage())
                    .platformResponse(e.getResponseBodyAsString())
                    .build();
        } catch (Exception e) {
            log.error("Error sending Teams message", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("消息发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public MessageSendResponse sendAdaptiveCardMessage(MessageSendRequest request) {
        try {
            Map<String, Object> messageBody = new HashMap<>();
            
            // 构建自适应卡片
            Map<String, Object> adaptiveCard = new HashMap<>();
            adaptiveCard.put("type", "AdaptiveCard");
            adaptiveCard.put("version", "1.2");
            
            List<Map<String, Object>> body = new ArrayList<>();
            
            // 标题
            if (request.getSubject() != null) {
                Map<String, Object> titleBlock = new HashMap<>();
                titleBlock.put("type", "TextBlock");
                titleBlock.put("size", "large");
                titleBlock.put("weight", "bolder");
                titleBlock.put("text", request.getSubject());
                body.add(titleBlock);
            }
            
            // 内容
            Map<String, Object> contentBlock = new HashMap<>();
            contentBlock.put("type", "TextBlock");
            contentBlock.put("text", request.getContent());
            contentBlock.put("wrap", true);
            body.add(contentBlock);
            
            adaptiveCard.put("body", body);
            messageBody.put("type", "message");
            messageBody.put("attachments", new Object[]{
                new HashMap<String, Object>() {{
                    put("contentType", "application/vnd.microsoft.card.adaptive");
                    put("content", adaptiveCard);
                }}
            });
            
            String webhookUrl = getWebhookUrl(request);
            String response = restTemplate.postForObject(webhookUrl, messageBody, String.class);
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("自适应卡片消息发送成功")
                    .platformResponse(response)
                    .build();
        } catch (Exception e) {
            log.error("Error sending Teams adaptive card message", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("自适应卡片消息发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public MessageSendResponse sendRichTextMessage(MessageSendRequest request) {
        try {
            Map<String, Object> messageBody = new HashMap<>();
            Map<String, Object> sections = new HashMap<>();
            
            if (request.getSubject() != null) {
                sections.put("activityTitle", request.getSubject());
            }
            sections.put("text", request.getContent());
            
            messageBody.put("sections", new Object[]{sections});
            
            String webhookUrl = getWebhookUrl(request);
            String response = restTemplate.postForObject(webhookUrl, messageBody, String.class);
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("富文本消息发送成功")
                    .platformResponse(response)
                    .build();
        } catch (Exception e) {
            log.error("Error sending Teams rich text message", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("富文本消息发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public boolean testConnection(String webhookUrl) {
        try {
            Map<String, Object> testBody = new HashMap<>();
            Map<String, String> textContent = new HashMap<>();
            textContent.put("content", "Connection test from Brain system");
            testBody.put("text", textContent);
            
            String response = restTemplate.postForObject(webhookUrl, testBody, String.class);
            return true;
        } catch (Exception e) {
            log.error("Teams connection test failed", e);
            return false;
        }
    }
    
    private String getWebhookUrl(MessageSendRequest request) {
        // 从配置中获取webhookUrl，这里简化处理
        return request.getBusinessType();
    }
    
    private String generateMessageId() {
        return "TEAMS-" + System.currentTimeMillis();
    }
}