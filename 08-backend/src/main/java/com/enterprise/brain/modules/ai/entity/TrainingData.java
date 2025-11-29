package com.enterprise.brain.modules.ai.entity;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Entity
@Table(name = "training_data")
public class TrainingData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String dataId;
    private String name;
    private String description;
    private String dataType; // e.g., "text", "image", "tabular"
    private String format;   // e.g., "json", "csv", "parquet"
    private long fileSize;   // 字节数
    private String filePath; // 文件存储路径
    
    @Column(columnDefinition = "JSONB")
    private Map<String, Object> metadata; // 存储数据元信息
    
    private String status; // e.g., "uploading", "processed", "error"
    private String validationResult; // 数据验证结果摘要
    
    private String createdBy;
    private LocalDateTime createdAt;
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