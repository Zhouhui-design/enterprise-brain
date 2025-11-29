package com.enterprise.brain.modules.integration.messaging.service.impl;

import com.enterprise.brain.modules.integration.messaging.dto.request.MessageSendRequest;
import com.enterprise.brain.modules.integration.messaging.dto.response.MessageSendResponse;
import com.enterprise.brain.modules.integration.messaging.entity.MessageLog;
import com.enterprise.brain.modules.integration.messaging.service.WechatService;
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
public class WechatServiceImpl implements WechatService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Override
    public MessageSendResponse sendMessage(MessageSendRequest request) {
        try {
            // 构建微信消息体
            Map<String, Object> messageBody = buildMessageBody(request);
            
            // 调用微信API发送消息
            String webhookUrl = getWebhookUrl(request);
            String response = restTemplate.postForObject(webhookUrl, messageBody, String.class);
            
            log.info("Wechat message sent successfully: {}", response);
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("消息发送成功")
                    .platformResponse(response)
                    .build();
        } catch (HttpClientErrorException e) {
            log.error("Failed to send Wechat message: {}", e.getMessage());
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("消息发送失败: " + e.getMessage())
                    .platformResponse(e.getResponseBodyAsString())
                    .build();
        } catch (Exception e) {
            log.error("Error sending Wechat message", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("消息发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public MessageSendResponse sendTemplateMessage(MessageSendRequest request) {
        // 实现模板消息发送逻辑
        return sendMessage(request);
    }
    
    @Override
    public MessageSendResponse sendAppMessage(MessageSendRequest request) {
        // 实现应用消息发送逻辑
        return sendMessage(request);
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
            log.error("Wechat connection test failed", e);
            return false;
        }
    }
    
    private Map<String, Object> buildMessageBody(MessageSendRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("msgtype", "text");
        
        Map<String, String> textContent = new HashMap<>();
        textContent.put("content", request.getContent());
        body.put("text", textContent);
        
        return body;
    }
    
    private String getWebhookUrl(MessageSendRequest request) {
        // 从配置中获取webhookUrl，这里简化处理
        return request.getBusinessType();
    }
    
    private String generateMessageId() {
        return "WECHAT-" + System.currentTimeMillis();
    }
}