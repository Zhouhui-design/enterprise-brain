package com.enterprise.brain.modules.integration.messaging.service.impl;

import com.enterprise.brain.modules.integration.messaging.dto.request.MessageSendRequest;
import com.enterprise.brain.modules.integration.messaging.dto.response.MessageSendResponse;
import com.enterprise.brain.modules.integration.messaging.service.SlackService;
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
public class SlackServiceImpl implements SlackService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Override
    public MessageSendResponse sendMessage(MessageSendRequest request) {
        return sendTextMessage(request);
    }
    
    @Override
    public MessageSendResponse sendTextMessage(MessageSendRequest request) {
        try {
            // 构建Slack文本消息体
            Map<String, Object> messageBody = new HashMap<>();
            messageBody.put("text", request.getContent());
            
            // 如果指定了频道
            if (request.getRecipient() != null && !request.getRecipient().isEmpty()) {
                messageBody.put("channel", request.getRecipient());
            }
            
            String webhookUrl = getWebhookUrl(request);
            String response = restTemplate.postForObject(webhookUrl, messageBody, String.class);
            
            log.info("Slack text message sent successfully: {}", response);
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("消息发送成功")
                    .platformResponse(response)
                    .build();
        } catch (HttpClientErrorException e) {
            log.error("Failed to send Slack message: {}", e.getMessage());
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("消息发送失败: " + e.getMessage())
                    .platformResponse(e.getResponseBodyAsString())
                    .build();
        } catch (Exception e) {
            log.error("Error sending Slack message", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("消息发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public MessageSendResponse sendBlockMessage(MessageSendRequest request) {
        try {
            Map<String, Object> messageBody = new HashMap<>();
            
            // 构建块消息
            List<Map<String, Object>> blocks = new ArrayList<>();
            
            // 标题块
            if (request.getSubject() != null) {
                Map<String, Object> headerBlock = new HashMap<>();
                headerBlock.put("type", "header");
                Map<String, Object> headerText = new HashMap<>();
                headerText.put("type", "plain_text");
                headerText.put("text", request.getSubject());
                headerBlock.put("text", headerText);
                blocks.add(headerBlock);
            }
            
            // 内容块
            Map<String, Object> contentBlock = new HashMap<>();
            contentBlock.put("type", "section");
            Map<String, Object> contentText = new HashMap<>();
            contentText.put("type", "mrkdwn");
            contentText.put("text", request.getContent());
            contentBlock.put("text", contentText);
            blocks.add(contentBlock);
            
            messageBody.put("blocks", blocks);
            
            if (request.getRecipient() != null && !request.getRecipient().isEmpty()) {
                messageBody.put("channel", request.getRecipient());
            }
            
            String webhookUrl = getWebhookUrl(request);
            String response = restTemplate.postForObject(webhookUrl, messageBody, String.class);
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("块消息发送成功")
                    .platformResponse(response)
                    .build();
        } catch (Exception e) {
            log.error("Error sending Slack block message", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("块消息发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public MessageSendResponse sendAttachmentMessage(MessageSendRequest request) {
        try {
            Map<String, Object> messageBody = new HashMap<>();
            messageBody.put("text", "附件消息");
            
            List<Map<String, Object>> attachments = new ArrayList<>();
            Map<String, Object> attachment = new HashMap<>();
            attachment.put("title", request.getSubject() != null ? request.getSubject() : "通知");
            attachment.put("text", request.getContent());
            attachment.put("color", "#36a64f");
            attachments.add(attachment);
            
            messageBody.put("attachments", attachments);
            
            if (request.getRecipient() != null && !request.getRecipient().isEmpty()) {
                messageBody.put("channel", request.getRecipient());
            }
            
            String webhookUrl = getWebhookUrl(request);
            String response = restTemplate.postForObject(webhookUrl, messageBody, String.class);
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("附件消息发送成功")
                    .platformResponse(response)
                    .build();
        } catch (Exception e) {
            log.error("Error sending Slack attachment message", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("附件消息发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public boolean testConnection(String webhookUrl) {
        try {
            Map<String, Object> testBody = new HashMap<>();
            testBody.put("text", "Connection test from Brain system");
            
            String response = restTemplate.postForObject(webhookUrl, testBody, String.class);
            return true;
        } catch (Exception e) {
            log.error("Slack connection test failed", e);
            return false;
        }
    }
    
    private String getWebhookUrl(MessageSendRequest request) {
        // 从配置中获取webhookUrl，这里简化处理
        return request.getBusinessType();
    }
    
    private String generateMessageId() {
        return "SLACK-" + System.currentTimeMillis();
    }
}