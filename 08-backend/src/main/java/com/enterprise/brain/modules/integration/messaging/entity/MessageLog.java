package com.enterprise.brain.modules.integration.messaging.entity;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "message_logs")
public class MessageLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(name = "message_id")
    private String messageId; // 平台返回的消息ID
    
    @Column(name = "platform_type", nullable = false)
    private String platformType; // WECHAT, DINGTALK, FEISHU, EMAIL, QQ, SLACK, TEAMS
    
    @Column(name = "recipient", nullable = false)
    private String recipient; // 接收者
    
    @Column(name = "sender")
    private String sender; // 发送者
    
    @Column(name = "subject")
    private String subject;
    
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "status", nullable = false)
    private String status; // SUCCESS, FAILED, PENDING
    
    @Column(name = "error_message")
    private String errorMessage;
    
    @Column(name = "template_id")
    private String templateId;
    
    @Column(name = "business_type")
    private String businessType;
    
    @Column(name = "business_id")
    private String businessId;
    
    @Column(name = "send_time")
    private LocalDateTime sendTime;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}