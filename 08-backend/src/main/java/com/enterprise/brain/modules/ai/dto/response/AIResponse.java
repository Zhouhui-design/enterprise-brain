package com.enterprise.brain.modules.ai.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
public class AIResponse {
    
    private String id;
    private String conversationId;
    private String content;
    private String modelName;
    private Integer tokenCount;
    private Long responseTime;
    private String status;
    private Map<String, Object> metadata;
    private LocalDateTime createdAt;
    
    public static class Builder {
        private String id;
        private String conversationId;
        private String content;
        private String modelName;
        private Integer tokenCount;
        private Long responseTime;
        private String status;
        private Map<String, Object> metadata;
        private LocalDateTime createdAt;
        
        public Builder() {
            this.createdAt = LocalDateTime.now();
            this.status = "COMPLETED";
        }
        
        public Builder id(String id) {
            this.id = id;
            return this;
        }
        
        public Builder conversationId(String conversationId) {
            this.conversationId = conversationId;
            return this;
        }
        
        public Builder content(String content) {
            this.content = content;
            return this;
        }
        
        public Builder modelName(String modelName) {
            this.modelName = modelName;
            return this;
        }
        
        public Builder tokenCount(Integer tokenCount) {
            this.tokenCount = tokenCount;
            return this;
        }
        
        public Builder responseTime(Long responseTime) {
            this.responseTime = responseTime;
            return this;
        }
        
        public Builder status(String status) {
            this.status = status;
            return this;
        }
        
        public Builder metadata(Map<String, Object> metadata) {
            this.metadata = metadata;
            return this;
        }
        
        public AIResponse build() {
            AIResponse response = new AIResponse();
            response.setId(id);
            response.setConversationId(conversationId);
            response.setContent(content);
            response.setModelName(modelName);
            response.setTokenCount(tokenCount);
            response.setResponseTime(responseTime);
            response.setStatus(status);
            response.setMetadata(metadata);
            response.setCreatedAt(createdAt);
            return response;
        }
    }
}