package com.enterprise.brain.modules.integration.messaging.controller;

import com.enterprise.brain.modules.integration.messaging.dto.request.MessageSendRequest;
import com.enterprise.brain.modules.integration.messaging.dto.request.WebhookConfigRequest;
import com.enterprise.brain.modules.integration.messaging.dto.request.TemplateCreateRequest;
import com.enterprise.brain.modules.integration.messaging.dto.response.MessageSendResponse;
import com.enterprise.brain.modules.integration.messaging.dto.response.WebhookStatusResponse;
import com.enterprise.brain.modules.integration.messaging.service.WechatService;
import com.enterprise.brain.modules.integration.messaging.service.DingTalkService;
import com.enterprise.brain.modules.integration.messaging.service.FeishuService;
import com.enterprise.brain.modules.integration.messaging.service.EmailService;
import com.enterprise.brain.modules.integration.messaging.service.QQService;
import com.enterprise.brain.modules.integration.messaging.service.SlackService;
import com.enterprise.brain.modules.integration.messaging.service.TeamsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/messaging")
public class MessagingController {
    
    @Autowired
    private WechatService wechatService;
    
    @Autowired
    private DingTalkService dingTalkService;
    
    @Autowired
    private FeishuService feishuService;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private QQService qqService;
    
    @Autowired
    private SlackService slackService;
    
    @Autowired
    private TeamsService teamsService;
    
    /**
     * 发送消息接口
     * 统一的消息发送入口，根据platformType调用不同的服务
     */
    @PostMapping("/send")
    public ResponseEntity<MessageSendResponse> sendMessage(@RequestBody MessageSendRequest request) {
        log.info("Received message send request: {}", request);
        
        try {
            MessageSendResponse response;
            
            // 根据平台类型调用对应的服务
            switch (request.getPlatformType().toUpperCase()) {
                case "WECHAT":
                    response = wechatService.sendMessage(request);
                    break;
                case "DINGTALK":
                    response = dingTalkService.sendMessage(request);
                    break;
                case "FEISHU":
                    response = feishuService.sendMessage(request);
                    break;
                case "EMAIL":
                    response = request.isHtml() ? 
                            emailService.sendHtmlEmail(request) : 
                            emailService.sendEmail(request);
                    break;
                case "QQ":
                    response = qqService.sendMessage(request);
                    break;
                case "SLACK":
                    response = slackService.sendMessage(request);
                    break;
                case "TEAMS":
                    response = teamsService.sendMessage(request);
                    break;
                default:
                    log.error("Unsupported platform type: {}", request.getPlatformType());
                    response = MessageSendResponse.builder()
                            .success(false)
                            .status("FAILED")
                            .message("不支持的平台类型")
                            .build();
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing message send request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageSendResponse.builder()
                            .success(false)
                            .status("FAILED")
                            .message("服务器内部错误: " + e.getMessage())
                            .build());
        }
    }
    
    /**
     * 发送模板消息
     */
    @PostMapping("/template/send")
    public ResponseEntity<MessageSendResponse> sendTemplateMessage(@RequestBody MessageSendRequest request) {
        try {
            MessageSendResponse response;
            
            switch (request.getPlatformType().toUpperCase()) {
                case "WECHAT":
                    response = wechatService.sendTemplateMessage(request);
                    break;
                case "EMAIL":
                    response = emailService.sendTemplateEmail(request);
                    break;
                default:
                    response = MessageSendResponse.builder()
                            .success(false)
                            .status("FAILED")
                            .message("该平台不支持模板消息")
                            .build();
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error sending template message", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageSendResponse.builder()
                            .success(false)
                            .status("FAILED")
                            .message("模板消息发送失败: " + e.getMessage())
                            .build());
        }
    }
    
    /**
     * 测试webhook连接
     */
    @PostMapping("/webhook/test")
    public ResponseEntity<WebhookStatusResponse> testWebhookConnection(@RequestBody WebhookConfigRequest request) {
        try {
            boolean connected = false;
            
            switch (request.getPlatformType().toUpperCase()) {
                case "WECHAT":
                    connected = wechatService.testConnection(request.getWebhookUrl(), request.getSecret());
                    break;
                case "DINGTALK":
                    connected = dingTalkService.testConnection(request.getWebhookUrl(), request.getSecret());
                    break;
                case "FEISHU":
                    connected = feishuService.testConnection(request.getWebhookUrl(), request.getSecret());
                    break;
                case "SLACK":
                    connected = slackService.testConnection(request.getWebhookUrl());
                    break;
                case "TEAMS":
                    connected = teamsService.testConnection(request.getWebhookUrl());
                    break;
                case "EMAIL":
                    connected = emailService.testConnection();
                    break;
                case "QQ":
                    connected = qqService.testConnection(request.getAppId(), request.getAppSecret());
                    break;
                default:
                    log.error("Unsupported platform type for webhook test: {}", request.getPlatformType());
            }
            
            WebhookStatusResponse response = WebhookStatusResponse.builder()
                    .platformType(request.getPlatformType())
                    .name(request.getName())
                    .active(request.isActive())
                    .testStatus(connected ? "SUCCESS" : "FAILED")
                    .lastTestTime(LocalDateTime.now())
                    .message(connected ? "连接成功" : "连接失败")
                    .connected(connected)
                    .build();
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error testing webhook connection", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(WebhookStatusResponse.builder()
                            .platformType(request.getPlatformType())
                            .name(request.getName())
                            .testStatus("FAILED")
                            .lastTestTime(LocalDateTime.now())
                            .message("测试失败: " + e.getMessage())
                            .connected(false)
                            .build());
        }
    }
    
    /**
     * 创建消息模板
     */
    @PostMapping("/template/create")
    public ResponseEntity<String> createTemplate(@RequestBody TemplateCreateRequest request) {
        try {
            // TODO: 实现模板创建逻辑，保存到数据库
            log.info("Creating template: {}", request);
            return ResponseEntity.ok("模板创建成功");
        } catch (Exception e) {
            log.error("Error creating template", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("模板创建失败: " + e.getMessage());
        }
    }
    
    /**
     * 健康检查接口
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Messaging service is healthy");
    }
}