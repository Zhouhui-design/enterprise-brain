package com.enterprise.brain.modules.ai.service;

import com.enterprise.brain.modules.ai.dto.request.ModelDeployRequest;
import com.enterprise.brain.modules.ai.dto.response.ModelStatusResponse;
import com.enterprise.brain.modules.ai.entity.AIModel;

import java.util.List;
import java.util.Optional;

public interface AIModelService {
    
    /**
     * 获取所有模型列表
     */
    List<AIModel> listModels();
    
    /**
     * 获取单个模型
     */
    Optional<AIModel> getModel(String modelId);
    
    /**
     * 创建新模型
     */
    AIModel createModel(AIModel model);
    
    /**
     * 更新模型信息
     */
    AIModel updateModel(String modelId, AIModel model);
    
    /**
     * 删除模型
     */
    void deleteModel(String modelId);
    
    /**
     * 部署模型
     */
    ModelStatusResponse deployModel(ModelDeployRequest request);
    
    /**
     * 取消部署模型
     */
    void undeployModel(String modelId);
    
    /**
     * 获取模型部署状态
     */
    ModelStatusResponse getModelStatus(String modelId);
    
    /**
     * 设置默认模型
     */
    AIModel setDefaultModel(String modelId);
    
    /**
     * 获取默认模型
     */
    Optional<AIModel> getDefaultModel();
    
    /**
     * 搜索模型
     */
    List<AIModel> searchModels(String keyword);
    
    /**
     * 按类型筛选模型
     */
    List<AIModel> filterModelsByType(String modelType);
    
    /**
     * 按提供商筛选模型
     */
    List<AIModel> filterModelsByProvider(String provider);
}