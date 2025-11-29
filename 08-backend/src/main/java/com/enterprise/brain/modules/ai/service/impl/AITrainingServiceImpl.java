package com.enterprise.brain.modules.ai.service.impl;

import com.enterprise.brain.modules.ai.config.TrainingConfig;
import com.enterprise.brain.modules.ai.dto.request.TrainingRequest;
import com.enterprise.brain.modules.ai.dto.response.TrainingResponse;
import com.enterprise.brain.modules.ai.entity.TrainingData;
import com.enterprise.brain.modules.ai.entity.TrainingJob;
import com.enterprise.brain.modules.ai.repository.TrainingDataRepository;
import com.enterprise.brain.modules.ai.service.AITrainingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AITrainingServiceImpl implements AITrainingService {

    @Autowired
    private TrainingDataRepository trainingDataRepository;
    
    @Autowired
    private TrainingConfig trainingConfig;
    
    // 模拟训练任务存储
    private final Map<String, TrainingJob> activeJobs = new ConcurrentHashMap<>();
    
    @Override
    public TrainingResponse startTraining(TrainingRequest request) {
        // 验证请求参数
        if (request.getBaseModelId() == null || request.getTrainingDataIds() == null || request.getTrainingDataIds().isEmpty()) {
            throw new IllegalArgumentException("Base model and training data are required");
        }
        
        // 创建训练任务
        TrainingJob job = new TrainingJob();
        job.setJobId(UUID.randomUUID().toString());
        job.setModelId(request.getModelName());
        job.setBaseModelId(request.getBaseModelId());
        job.setTrainingDataId(String.join(",", request.getTrainingDataIds()));
        job.setTrainingConfig(request.getHyperparameters());
        job.setStatus("queued");
        job.setProgress(0.0);
        job.setEpochCount((long) request.getEpochs());
        job.setCurrentEpoch(0L);
        job.setMetrics(new HashMap<>());
        job.setCreatedBy("system");
        
        // 存储任务
        activeJobs.put(job.getJobId(), job);
        
        // 模拟异步训练
        simulateTraining(job);
        
        // 构建响应
        return convertToResponse(job);
    }
    
    @Override
    public TrainingResponse getTrainingStatus(String jobId) {
        TrainingJob job = activeJobs.get(jobId);
        if (job == null) {
            throw new RuntimeException("Training job not found");
        }
        return convertToResponse(job);
    }
    
    @Override
    public List<TrainingJob> listTrainingJobs() {
        return new ArrayList<>(activeJobs.values());
    }
    
    @Override
    public void cancelTraining(String jobId) {
        TrainingJob job = activeJobs.get(jobId);
        if (job != null) {
            job.setStatus("canceled");
            job.setLogs(job.getLogs() + "\nTraining canceled by user");
        }
    }
    
    @Override
    public String getTrainingLogs(String jobId) {
        TrainingJob job = activeJobs.get(jobId);
        if (job == null) {
            throw new RuntimeException("Training job not found");
        }
        return job.getLogs();
    }
    
    @Override
    public TrainingData uploadTrainingData(MultipartFile file, String dataType, String description) {
        try {
            // 验证文件大小
            if (file.getSize() > trainingConfig.getMaxDataSize() * 1024 * 1024) {
                throw new IllegalArgumentException("File size exceeds maximum limit");
            }
            
            // 确保存储目录存在
            Path storageDir = Paths.get(trainingConfig.getDataStoragePath());
            Files.createDirectories(storageDir);
            
            // 保存文件
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = storageDir.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);
            
            // 创建训练数据记录
            TrainingData data = new TrainingData();
            data.setDataId(UUID.randomUUID().toString());
            data.setName(file.getOriginalFilename());
            data.setDescription(description);
            data.setDataType(dataType);
            data.setFormat(getFileExtension(file.getOriginalFilename()));
            data.setFileSize(file.getSize());
            data.setFilePath(filePath.toString());
            data.setStatus("processed");
            data.setCreatedBy("system");
            
            return trainingDataRepository.save(data);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload training data", e);
        }
    }
    
    @Override
    public List<TrainingData> listTrainingData() {
        return trainingDataRepository.findAll();
    }
    
    @Override
    public Optional<TrainingData> getTrainingData(String dataId) {
        return trainingDataRepository.findByDataId(dataId);
    }
    
    @Override
    public void deleteTrainingData(String dataId) {
        TrainingData data = trainingDataRepository.findByDataId(dataId)
            .orElseThrow(() -> new RuntimeException("Training data not found"));
        
        // 删除文件
        try {
            Files.deleteIfExists(Paths.get(data.getFilePath()));
        } catch (IOException e) {
            // 记录日志但继续删除数据库记录
        }
        
        trainingDataRepository.deleteByDataId(dataId);
    }
    
    @Override
    public boolean validateTrainingData(String dataId) {
        TrainingData data = trainingDataRepository.findByDataId(dataId)
            .orElseThrow(() -> new RuntimeException("Training data not found"));
        
        // 简单验证，实际项目中需要根据数据类型进行详细验证
        try {
            File file = new File(data.getFilePath());
            boolean isValid = file.exists() && file.length() > 0;
            data.setValidationResult(isValid ? "Valid" : "Invalid file");
            trainingDataRepository.save(data);
            return isValid;
        } catch (Exception e) {
            data.setValidationResult("Validation error: " + e.getMessage());
            trainingDataRepository.save(data);
            return false;
        }
    }
    
    @Override
    public void pauseTraining(String jobId) {
        TrainingJob job = activeJobs.get(jobId);
        if (job != null && "running".equals(job.getStatus())) {
            job.setStatus("paused");
        }
    }
    
    @Override
    public void resumeTraining(String jobId) {
        TrainingJob job = activeJobs.get(jobId);
        if (job != null && "paused".equals(job.getStatus())) {
            job.setStatus("running");
            // 继续模拟训练
            simulateTraining(job);
        }
    }
    
    // 辅助方法：模拟训练过程
    private void simulateTraining(TrainingJob job) {
        Thread thread = new Thread(() -> {
            try {
                job.setStatus("running");
                job.setLogs("Training started\n");
                
                for (long epoch = job.getCurrentEpoch() + 1; epoch <= job.getEpochCount(); epoch++) {
                    if ("canceled".equals(job.getStatus())) break;
                    if ("paused".equals(job.getStatus())) {
                        job.setCurrentEpoch(epoch - 1);
                        return;
                    }
                    
                    job.setCurrentEpoch(epoch);
                    job.setProgress((double) epoch / job.getEpochCount() * 100);
                    
                    // 模拟每个epoch的训练
                    Thread.sleep(1000);
                    
                    // 更新指标
                    Map<String, Double> metrics = job.getMetrics();
                    metrics.put("loss", 1.0 / epoch);
                    metrics.put("accuracy", 0.5 + epoch * 0.05);
                    
                    job.setLogs(job.getLogs() + String.format("Epoch %d/%d: loss=%.4f, accuracy=%.4f\n", 
                            epoch, job.getEpochCount(), metrics.get("loss"), metrics.get("accuracy")));
                }
                
                if (!"canceled".equals(job.getStatus())) {
                    job.setStatus("completed");
                    job.setProgress(100.0);
                    job.setCompletedAt(java.time.LocalDateTime.now());
                    job.setLogs(job.getLogs() + "\nTraining completed successfully!");
                }
            } catch (Exception e) {
                job.setStatus("failed");
                job.setLogs(job.getLogs() + "\nError: " + e.getMessage());
            }
        });
        thread.setDaemon(true);
        thread.start();
    }
    
    // 辅助方法：转换为响应对象
    private TrainingResponse convertToResponse(TrainingJob job) {
        TrainingResponse response = new TrainingResponse();
        response.setJobId(job.getJobId());
        response.setStatus(job.getStatus());
        response.setProgress(job.getProgress());
        response.setCurrentEpoch(job.getCurrentEpoch());
        response.setTotalEpochs(job.getEpochCount());
        response.setMetrics(job.getMetrics());
        response.setModelId(job.getModelId());
        response.setCreatedAt(job.getCreatedAt());
        response.setUpdatedAt(job.getUpdatedAt());
        response.setCompletedAt(job.getCompletedAt());
        response.setLogs(job.getLogs());
        return response;
    }
    
    // 辅助方法：获取文件扩展名
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex > 0 ? filename.substring(lastDotIndex + 1) : "unknown";
    }
}