package com.enterprise.brain.modules.ai.entity;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "ai_conversations")
public class AIConversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String conversationId;
    private String userId;
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String context;
    
    private String modelId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean active = true;
    
    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AIPrompt> prompts;
    
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