package com.enterprise.brain.modules.integration.messaging.service.impl;

import com.enterprise.brain.modules.integration.messaging.dto.request.MessageSendRequest;
import com.enterprise.brain.modules.integration.messaging.dto.response.MessageSendResponse;
import com.enterprise.brain.modules.integration.messaging.service.FeishuService;
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
public class FeishuServiceImpl implements FeishuService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Override
    public MessageSendResponse sendMessage(MessageSendRequest request) {
        return sendTextMessage(request);
    }
    
    @Override
    public MessageSendResponse sendTextMessage(MessageSendRequest request) {
        try {
            // 构建飞书文本消息体
            Map<String, Object> messageBody = new HashMap<>();
            messageBody.put("msg_type", "text");
            
            Map<String, String> content = new HashMap<>();
            content.put("text", request.getContent());
            messageBody.put("content", content);
            
            String webhookUrl = getWebhookUrl(request);
            String response = restTemplate.postForObject(webhookUrl, messageBody, String.class);
            
            log.info("Feishu text message sent successfully: {}", response);
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("消息发送成功")
                    .platformResponse(response)
                    .build();
        } catch (HttpClientErrorException e) {
            log.error("Failed to send Feishu message: {}", e.getMessage());
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("消息发送失败: " + e.getMessage())
                    .platformResponse(e.getResponseBodyAsString())
                    .build();
        } catch (Exception e) {
            log.error("Error sending Feishu message", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("消息发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public MessageSendResponse sendRichTextMessage(MessageSendRequest request) {
        try {
            Map<String, Object> messageBody = new HashMap<>();
            messageBody.put("msg_type", "post");
            
            Map<String, Object> content = new HashMap<>();
            Map<String, Object> zhCn = new HashMap<>();
            
            zhCn.put("title", request.getSubject() != null ? request.getSubject() : "通知");
            
            List<List<Map<String, String>>> contentList = new ArrayList<>();
            List<Map<String, String>> paragraph = new ArrayList<>();
            Map<String, String> text = new HashMap<>();
            text.put("tag", "text");
            text.put("text", request.getContent());
            paragraph.add(text);
            contentList.add(paragraph);
            
            zhCn.put("content", contentList);
            content.put("zh_cn", zhCn);
            messageBody.put("content", content);
            
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
            log.error("Error sending Feishu rich text message", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("富文本消息发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public MessageSendResponse sendCardMessage(MessageSendRequest request) {
        try {
            Map<String, Object> messageBody = new HashMap<>();
            messageBody.put("msg_type", "interactive");
            
            // 简化的卡片消息实现
            Map<String, Object> card = new HashMap<>();
            // 实际实现需要根据飞书API文档构建正确的卡片结构
            
            Map<String, Object> content = new HashMap<>();
            content.put("card", card);
            messageBody.put("content", content);
            
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
            log.error("Error sending Feishu card message", e);
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
            testBody.put("msg_type", "text");
            Map<String, String> content = new HashMap<>();
            content.put("text", "Connection test from Brain system");
            testBody.put("content", content);
            
            String response = restTemplate.postForObject(webhookUrl, testBody, String.class);
            return true;
        } catch (Exception e) {
            log.error("Feishu connection test failed", e);
            return false;
        }
    }
    
    private String getWebhookUrl(MessageSendRequest request) {
        // 从配置中获取webhookUrl，这里简化处理
        return request.getBusinessType();
    }
    
    private String generateMessageId() {
        return "FEISHU-" + System.currentTimeMillis();
    }
}