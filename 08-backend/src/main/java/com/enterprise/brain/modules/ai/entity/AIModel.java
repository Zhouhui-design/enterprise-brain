package com.enterprise.brain.modules.ai.entity;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Entity
@Table(name = "ai_models")
public class AIModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String modelId;
    private String name;
    private String description;
    private String version;
    private String modelType; // e.g., "chat", "embedding", "completion"
    private String provider;  // e.g., "openai", "anthropic", "custom"
    
    @Column(columnDefinition = "JSONB")
    private Map<String, Object> modelConfig; // 存储模型特定配置
    
    private String endpoint;
    private String status; // e.g., "active", "inactive", "training", "deploying"
    private boolean isDefault = false;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deployedAt;
    
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