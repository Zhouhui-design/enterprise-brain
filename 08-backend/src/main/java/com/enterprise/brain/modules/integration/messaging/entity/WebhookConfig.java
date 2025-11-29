package com.enterprise.brain.modules.integration.messaging.entity;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "webhook_configs")
public class WebhookConfig {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(name = "platform_type", nullable = false)
    private String platformType; // WECHAT, DINGTALK, FEISHU, SLACK, TEAMS
    
    @Column(name = "webhook_url", nullable = false)
    private String webhookUrl;
    
    @Column(name = "secret")
    private String secret; // 用于签名验证
    
    @Column(name = "access_token")
    private String accessToken;
    
    @Column(name = "app_id")
    private String appId;
    
    @Column(name = "app_secret")
    private String appSecret;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "description")
    private String description;
    
    @Column(name = "is_active", nullable = false)
    private boolean active = true;
    
    @Column(name = "last_test_time")
    private LocalDateTime lastTestTime;
    
    @Column(name = "test_status")
    private String testStatus;
    
    @Column(name = "created_by")
    private String createdBy;
    
    @Column(name = "updated_by")
    private String updatedBy;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}