package com.enterprise.brain.modules.ai.entity;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Entity
@Table(name = "ai_prompts")
public class AIPrompt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String promptId;
    
    @ManyToOne
    @JoinColumn(name = "conversation_id")
    private AIConversation conversation;
    
    @Column(columnDefinition = "TEXT")
    private String userMessage;
    
    @Column(columnDefinition = "TEXT")
    private String assistantResponse;
    
    @Column(columnDefinition = "JSONB")
    private Map<String, Object> promptConfig; // 提示配置参数
    
    private String modelUsed;
    private Long tokensUsed;
    private Long responseTime; // 毫秒
    private boolean success = true;
    
    @Column(columnDefinition = "TEXT")
    private String errorMessage;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}