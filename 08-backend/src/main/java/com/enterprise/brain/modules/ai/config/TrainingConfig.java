package com.enterprise.brain.modules.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
@ConfigurationProperties(prefix = "ai.training")
public class TrainingConfig {
    
    private String dataStoragePath;
    private String outputPath;
    private Integer maxTrainingJobs = 5;
    private Integer maxDataSize = 1024; // MB
    private Integer checkpointInterval = 1000;
    private String defaultOptimizer = "adam";
    private Double defaultLearningRate = 0.001;
    private Integer defaultBatchSize = 32;
    private Integer defaultEpochs = 10;
    private boolean enableEarlyStopping = true;
    private Integer earlyStoppingPatience = 5;
    private Map<String, String> availableFrameworks;
    
    // Getters and Setters
    public String getDataStoragePath() {
        return dataStoragePath;
    }
    
    public void setDataStoragePath(String dataStoragePath) {
        this.dataStoragePath = dataStoragePath;
    }
    
    public String getOutputPath() {
        return outputPath;
    }
    
    public void setOutputPath(String outputPath) {
        this.outputPath = outputPath;
    }
    
    public Integer getMaxTrainingJobs() {
        return maxTrainingJobs;
    }
    
    public void setMaxTrainingJobs(Integer maxTrainingJobs) {
        this.maxTrainingJobs = maxTrainingJobs;
    }
    
    public Integer getMaxDataSize() {
        return maxDataSize;
    }
    
    public void setMaxDataSize(Integer maxDataSize) {
        this.maxDataSize = maxDataSize;
    }
    
    public Integer getCheckpointInterval() {
        return checkpointInterval;
    }
    
    public void setCheckpointInterval(Integer checkpointInterval) {
        this.checkpointInterval = checkpointInterval;
    }
    
    public String getDefaultOptimizer() {
        return defaultOptimizer;
    }
    
    public void setDefaultOptimizer(String defaultOptimizer) {
        this.defaultOptimizer = defaultOptimizer;
    }
    
    public Double getDefaultLearningRate() {
        return defaultLearningRate;
    }
    
    public void setDefaultLearningRate(Double defaultLearningRate) {
        this.defaultLearningRate = defaultLearningRate;
    }
    
    public Integer getDefaultBatchSize() {
        return defaultBatchSize;
    }
    
    public void setDefaultBatchSize(Integer defaultBatchSize) {
        this.defaultBatchSize = defaultBatchSize;
    }
    
    public Integer getDefaultEpochs() {
        return defaultEpochs;
    }
    
    public void setDefaultEpochs(Integer defaultEpochs) {
        this.defaultEpochs = defaultEpochs;
    }
    
    public boolean isEnableEarlyStopping() {
        return enableEarlyStopping;
    }
    
    public void setEnableEarlyStopping(boolean enableEarlyStopping) {
        this.enableEarlyStopping = enableEarlyStopping;
    }
    
    public Integer getEarlyStoppingPatience() {
        return earlyStoppingPatience;
    }
    
    public void setEarlyStoppingPatience(Integer earlyStoppingPatience) {
        this.earlyStoppingPatience = earlyStoppingPatience;
    }
    
    public Map<String, String> getAvailableFrameworks() {
        return availableFrameworks;
    }
    
    public void setAvailableFrameworks(Map<String, String> availableFrameworks) {
        this.availableFrameworks = availableFrameworks;
    }
}