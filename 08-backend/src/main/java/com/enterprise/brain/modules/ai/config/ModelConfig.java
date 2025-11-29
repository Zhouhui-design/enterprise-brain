package com.enterprise.brain.modules.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
@ConfigurationProperties(prefix = "ai.model")
public class ModelConfig {
    
    private Map<String, ModelProperties> models;
    private String modelStoragePath;
    private Integer maxModelSize; // MB
    private Integer maxConcurrentLoads = 5;
    private boolean enableModelValidation = true;
    private Integer modelValidationTimeout = 30000;
    
    public static class ModelProperties {
        private String type;
        private String provider;
        private String defaultEndpoint;
        private Map<String, Object> defaultParameters;
        private Integer maxTokens;
        private Double defaultTemperature;
        private Boolean streamingSupported = false;
        
        // Getters and Setters
        public String getType() {
            return type;
        }
        
        public void setType(String type) {
            this.type = type;
        }
        
        public String getProvider() {
            return provider;
        }
        
        public void setProvider(String provider) {
            this.provider = provider;
        }
        
        public String getDefaultEndpoint() {
            return defaultEndpoint;
        }
        
        public void setDefaultEndpoint(String defaultEndpoint) {
            this.defaultEndpoint = defaultEndpoint;
        }
        
        public Map<String, Object> getDefaultParameters() {
            return defaultParameters;
        }
        
        public void setDefaultParameters(Map<String, Object> defaultParameters) {
            this.defaultParameters = defaultParameters;
        }
        
        public Integer getMaxTokens() {
            return maxTokens;
        }
        
        public void setMaxTokens(Integer maxTokens) {
            this.maxTokens = maxTokens;
        }
        
        public Double getDefaultTemperature() {
            return defaultTemperature;
        }
        
        public void setDefaultTemperature(Double defaultTemperature) {
            this.defaultTemperature = defaultTemperature;
        }
        
        public Boolean getStreamingSupported() {
            return streamingSupported;
        }
        
        public void setStreamingSupported(Boolean streamingSupported) {
            this.streamingSupported = streamingSupported;
        }
    }
    
    // Getters and Setters
    public Map<String, ModelProperties> getModels() {
        return models;
    }
    
    public void setModels(Map<String, ModelProperties> models) {
        this.models = models;
    }
    
    public String getModelStoragePath() {
        return modelStoragePath;
    }
    
    public void setModelStoragePath(String modelStoragePath) {
        this.modelStoragePath = modelStoragePath;
    }
    
    public Integer getMaxModelSize() {
        return maxModelSize;
    }
    
    public void setMaxModelSize(Integer maxModelSize) {
        this.maxModelSize = maxModelSize;
    }
    
    public Integer getMaxConcurrentLoads() {
        return maxConcurrentLoads;
    }
    
    public void setMaxConcurrentLoads(Integer maxConcurrentLoads) {
        this.maxConcurrentLoads = maxConcurrentLoads;
    }
    
    public boolean isEnableModelValidation() {
        return enableModelValidation;
    }
    
    public void setEnableModelValidation(boolean enableModelValidation) {
        this.enableModelValidation = enableModelValidation;
    }
    
    public Integer getModelValidationTimeout() {
        return modelValidationTimeout;
    }
    
    public void setModelValidationTimeout(Integer modelValidationTimeout) {
        this.modelValidationTimeout = modelValidationTimeout;
    }
}