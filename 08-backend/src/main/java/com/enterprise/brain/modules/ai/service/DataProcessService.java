package com.enterprise.brain.modules.ai.service;

import com.enterprise.brain.modules.ai.dto.request.DataProcessRequest;
import com.enterprise.brain.modules.ai.entity.TrainingData;

import java.util.List;
import java.util.Map;

public interface DataProcessService {
    
    /**
     * 处理训练数据
     */
    Map<String, Object> processData(DataProcessRequest request);
    
    /**
     * 清理数据
     */
    TrainingData cleanData(String dataId, Map<String, Object> parameters);
    
    /**
     * 增强数据
     */
    TrainingData augmentData(String dataId, Map<String, Object> parameters);
    
    /**
     * 转换数据格式
     */
    TrainingData transformData(String dataId, String targetFormat, Map<String, Object> parameters);
    
    /**
     * 验证数据
     */
    Map<String, Object> validateData(String dataId);
    
    /**
     * 分析数据质量
     */
    Map<String, Object> analyzeDataQuality(String dataId);
    
    /**
     * 分割数据集
     */
    Map<String, String> splitData(String dataId, Map<String, Double> ratios);
    
    /**
     * 合并数据集
     */
    TrainingData mergeData(List<String> dataIds, String name, String description);
    
    /**
     * 导出数据
     */
    String exportData(String dataId, String format);
    
    /**
     * 获取数据统计信息
     */
    Map<String, Object> getDataStatistics(String dataId);
}