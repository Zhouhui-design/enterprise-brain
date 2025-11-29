package com.enterprise.brain.modules.ai.service;

import com.enterprise.brain.modules.ai.dto.request.TrainingRequest;
import com.enterprise.brain.modules.ai.dto.response.TrainingResponse;
import com.enterprise.brain.modules.ai.entity.TrainingData;
import com.enterprise.brain.modules.ai.entity.TrainingJob;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

public interface AITrainingService {
    
    /**
     * 启动模型训练任务
     */
    TrainingResponse startTraining(TrainingRequest request);
    
    /**
     * 获取训练任务状态
     */
    TrainingResponse getTrainingStatus(String jobId);
    
    /**
     * 列出所有训练任务
     */
    List<TrainingJob> listTrainingJobs();
    
    /**
     * 取消训练任务
     */
    void cancelTraining(String jobId);
    
    /**
     * 获取训练日志
     */
    String getTrainingLogs(String jobId);
    
    /**
     * 上传训练数据
     */
    TrainingData uploadTrainingData(MultipartFile file, String dataType, String description);
    
    /**
     * 获取训练数据列表
     */
    List<TrainingData> listTrainingData();
    
    /**
     * 获取单个训练数据
     */
    Optional<TrainingData> getTrainingData(String dataId);
    
    /**
     * 删除训练数据
     */
    void deleteTrainingData(String dataId);
    
    /**
     * 验证训练数据
     */
    boolean validateTrainingData(String dataId);
    
    /**
     * 暂停训练任务
     */
    void pauseTraining(String jobId);
    
    /**
     * 恢复训练任务
     */
    void resumeTraining(String jobId);
}