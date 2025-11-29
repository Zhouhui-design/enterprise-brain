package com.enterprise.brain.modules.ai.dto.request;

import lombok.Data;
import java.util.Map;

@Data
public class AIRequest {
    
    private String prompt;
    private String conversationId;
    private String modelId;
    private Integer maxTokens;
    private Double temperature;
    private Double topP;
    private Integer n;
    private Boolean stream;
    private Map<String, Object> context;
    private Map<String, Object> metadata;
    
    public static class Builder {
        private String prompt;
        private String conversationId;
        private String modelId;
        private Integer maxTokens;
        private Double temperature;
        private Double topP;
        private Integer n;
        private Boolean stream;
        private Map<String, Object> context;
        private Map<String, Object> metadata;
        
        public Builder() {
            this.maxTokens = 1024;
            this.temperature = 0.7;
            this.topP = 1.0;
            this.n = 1;
            this.stream = false;
        }
        
        public Builder prompt(String prompt) {
            this.prompt = prompt;
            return this;
        }
        
        public Builder conversationId(String conversationId) {
            this.conversationId = conversationId;
            return this;
        }
        
        public Builder modelId(String modelId) {
            this.modelId = modelId;
            return this;
        }
        
        public Builder maxTokens(Integer maxTokens) {
            this.maxTokens = maxTokens;
            return this;
        }
        
        public Builder temperature(Double temperature) {
            this.temperature = temperature;
            return this;
        }
        
        public Builder topP(Double topP) {
            this.topP = topP;
            return this;
        }
        
        public Builder n(Integer n) {
            this.n = n;
            return this;
        }
        
        public Builder stream(Boolean stream) {
            this.stream = stream;
            return this;
        }
        
        public Builder context(Map<String, Object> context) {
            this.context = context;
            return this;
        }
        
        public Builder metadata(Map<String, Object> metadata) {
            this.metadata = metadata;
            return this;
        }
        
        public AIRequest build() {
            AIRequest request = new AIRequest();
            request.setPrompt(prompt);
            request.setConversationId(conversationId);
            request.setModelId(modelId);
            request.setMaxTokens(maxTokens);
            request.setTemperature(temperature);
            request.setTopP(topP);
            request.setN(n);
            request.setStream(stream);
            request.setContext(context);
            request.setMetadata(metadata);
            return request;
        }
    }
}