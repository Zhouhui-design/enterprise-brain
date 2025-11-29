package com.enterprise.brain.modules.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Configuration
@ConfigurationProperties(prefix = "ai")
public class AIConfig {
    
    private Map<String, String> endpoints;
    private Map<String, String> apiKeys;
    private Integer connectionTimeout = 30000;
    private Integer readTimeout = 60000;
    private Integer maxConnections = 100;
    private String defaultModel;
    private boolean enableCaching = true;
    private Integer cacheTtl = 3600; // 秒
    
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        // 可以在这里配置超时、拦截器等
        return restTemplate;
    }
    
    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
                .build();
    }
    
    // Getters and Setters
    public Map<String, String> getEndpoints() {
        return endpoints;
    }
    
    public void setEndpoints(Map<String, String> endpoints) {
        this.endpoints = endpoints;
    }
    
    public Map<String, String> getApiKeys() {
        return apiKeys;
    }
    
    public void setApiKeys(Map<String, String> apiKeys) {
        this.apiKeys = apiKeys;
    }
    
    public Integer getConnectionTimeout() {
        return connectionTimeout;
    }
    
    public void setConnectionTimeout(Integer connectionTimeout) {
        this.connectionTimeout = connectionTimeout;
    }
    
    public Integer getReadTimeout() {
        return readTimeout;
    }
    
    public void setReadTimeout(Integer readTimeout) {
        this.readTimeout = readTimeout;
    }
    
    public Integer getMaxConnections() {
        return maxConnections;
    }
    
    public void setMaxConnections(Integer maxConnections) {
        this.maxConnections = maxConnections;
    }
    
    public String getDefaultModel() {
        return defaultModel;
    }
    
    public void setDefaultModel(String defaultModel) {
        this.defaultModel = defaultModel;
    }
    
    public boolean isEnableCaching() {
        return enableCaching;
    }
    
    public void setEnableCaching(boolean enableCaching) {
        this.enableCaching = enableCaching;
    }
    
    public Integer getCacheTtl() {
        return cacheTtl;
    }
    
    public void setCacheTtl(Integer cacheTtl) {
        this.cacheTtl = cacheTtl;
    }
}