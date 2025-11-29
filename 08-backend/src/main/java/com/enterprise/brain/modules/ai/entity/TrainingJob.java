package com.enterprise.brain.modules.ai.entity;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Entity
@Table(name = "training_jobs")
public class TrainingJob {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String jobId;
    private String modelId; // 关联到AIModel
    private String baseModelId; // 基础模型ID
    private String trainingDataId; // 关联到TrainingData
    
    @Column(columnDefinition = "JSONB")
    private Map<String, Object> trainingConfig; // 训练配置参数
    
    private String status; // e.g., "queued", "running", "completed", "failed"
    private Double progress; // 进度百分比
    private Long epochCount;
    private Long currentEpoch;
    
    @Column(columnDefinition = "TEXT")
    private String logs; // 训练日志
    
    @Column(columnDefinition = "JSONB")
    private Map<String, Double> metrics; // 训练指标
    
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
    
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