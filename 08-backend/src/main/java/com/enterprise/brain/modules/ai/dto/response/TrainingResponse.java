package com.enterprise.brain.modules.ai.dto.response;

import lombok.Data;
import java.util.Map;
import java.time.LocalDateTime;

@Data
public class TrainingResponse {
    private String jobId;
    private String status;
    private Double progress;
    private Long currentEpoch;
    private Long totalEpochs;
    private Map<String, Double> metrics;
    private String modelId;
    private String outputPath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
    private String errorMessage;
    private String logs;
}