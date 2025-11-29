package com.enterprise.brain.modules.ai.dto.request;

import lombok.Data;
import java.util.Map;
import java.util.List;

@Data
public class TrainingRequest {
    private String modelName;
    private String baseModelId;
    private List<String> trainingDataIds;
    private Map<String, Object> hyperparameters;
    private String description;
    private Integer epochs = 1;
    private Double learningRate;
    private Integer batchSize;
    private String outputPath;
    private boolean resume = false;
    private String checkpointId;
}