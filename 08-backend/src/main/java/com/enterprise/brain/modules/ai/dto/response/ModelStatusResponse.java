package com.enterprise.brain.modules.ai.dto.response;

import lombok.Data;
import java.util.Map;
import java.time.LocalDateTime;

@Data
public class ModelStatusResponse {
    private String modelId;
    private String name;
    private String status;
    private String endpoint;
    private Integer replicaCount;
    private Map<String, Object> resourceUsage;
    private Long requestsPerSecond;
    private Double averageResponseTimeMs;
    private Double errorRate;
    private LocalDateTime deployedAt;
    private LocalDateTime lastHealthCheck;
    private Map<String, Object> configuration;
    private String environment;
}