package com.enterprise.brain.modules.integration.messaging.service.impl;

import com.enterprise.brain.modules.integration.messaging.dto.request.MessageSendRequest;
import com.enterprise.brain.modules.integration.messaging.dto.response.MessageSendResponse;
import com.enterprise.brain.modules.integration.messaging.service.QQService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;
import java.util.HashMap;

@Slf4j
@Service
public class QQServiceImpl implements QQService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Override
    public MessageSendResponse sendMessage(MessageSendRequest request) {
        // 根据接收者类型判断发送群消息还是私聊消息
        if (request.getRecipient().startsWith("group_")) {
            return sendGroupMessage(request);
        } else {
            return sendPrivateMessage(request);
        }
    }
    
    @Override
    public MessageSendResponse sendGroupMessage(MessageSendRequest request) {
        try {
            // 构建QQ群消息请求
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("group_id", request.getRecipient().replace("group_", ""));
            requestBody.put("message", request.getContent());
            
            String apiUrl = getQQApiUrl("send_group_msg");
            String response = restTemplate.postForObject(apiUrl, requestBody, String.class);
            
            log.info("QQ group message sent successfully: {}", response);
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("群消息发送成功")
                    .platformResponse(response)
                    .build();
        } catch (HttpClientErrorException e) {
            log.error("Failed to send QQ group message: {}", e.getMessage());
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("群消息发送失败: " + e.getMessage())
                    .platformResponse(e.getResponseBodyAsString())
                    .build();
        } catch (Exception e) {
            log.error("Error sending QQ group message", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("群消息发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public MessageSendResponse sendPrivateMessage(MessageSendRequest request) {
        try {
            // 构建QQ私聊消息请求
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("user_id", request.getRecipient());
            requestBody.put("message", request.getContent());
            
            String apiUrl = getQQApiUrl("send_private_msg");
            String response = restTemplate.postForObject(apiUrl, requestBody, String.class);
            
            log.info("QQ private message sent successfully: {}", response);
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("私聊消息发送成功")
                    .platformResponse(response)
                    .build();
        } catch (HttpClientErrorException e) {
            log.error("Failed to send QQ private message: {}", e.getMessage());
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("私聊消息发送失败: " + e.getMessage())
                    .platformResponse(e.getResponseBodyAsString())
                    .build();
        } catch (Exception e) {
            log.error("Error sending QQ private message", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("私聊消息发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public boolean testConnection(String appId, String appSecret) {
        try {
            // 测试QQ机器人API连接
            String testUrl = getQQApiUrl("get_status");
            restTemplate.getForObject(testUrl, String.class);
            return true;
        } catch (Exception e) {
            log.error("QQ connection test failed", e);
            return false;
        }
    }
    
    private String getQQApiUrl(String action) {
        // 从配置中获取QQ机器人API地址，这里简化处理
        return "http://localhost:5700/" + action;
    }
    
    private String generateMessageId() {
        return "QQ-" + System.currentTimeMillis();
    }
}