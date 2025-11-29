package com.enterprise.brain.modules.ai.dto.request;

import lombok.Data;
import java.util.Map;

@Data
public class ModelDeployRequest {
    private String modelId;
    private String modelPath;
    private String environment = "production";
    private Map<String, Object> deploymentConfig;
    private Integer replicaCount = 1;
    private String resourceProfile = "standard";
    private Boolean autoScale = false;
    private Integer minReplicas = 1;
    private Integer maxReplicas = 5;
    private String serviceName;
    private String endpoint;
}