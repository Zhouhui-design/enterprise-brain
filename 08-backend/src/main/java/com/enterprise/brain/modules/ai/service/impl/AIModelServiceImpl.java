package com.enterprise.brain.modules.ai.service.impl;

import com.enterprise.brain.modules.ai.config.ModelConfig;
import com.enterprise.brain.modules.ai.dto.request.ModelDeployRequest;
import com.enterprise.brain.modules.ai.dto.response.ModelStatusResponse;
import com.enterprise.brain.modules.ai.entity.AIModel;
import com.enterprise.brain.modules.ai.repository.AIModelRepository;
import com.enterprise.brain.modules.ai.service.AIModelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AIModelServiceImpl implements AIModelService {

    @Autowired
    private AIModelRepository modelRepository;
    
    @Autowired
    private ModelConfig modelConfig;
    
    // 模拟部署状态存储
    private final Map<String, ModelStatusResponse> deployedModels = new HashMap<>();
    
    @Override
    public List<AIModel> listModels() {
        return modelRepository.findAll();
    }
    
    @Override
    public Optional<AIModel> getModel(String modelId) {
        return modelRepository.findByModelId(modelId);
    }
    
    @Override
    public AIModel createModel(AIModel model) {
        // 生成模型ID
        if (model.getModelId() == null) {
            model.setModelId(UUID.randomUUID().toString());
        }
        
        // 设置默认状态
        if (model.getStatus() == null) {
            model.setStatus("inactive");
        }
        
        // 如果设置为默认模型，更新其他模型
        if (model.isDefault()) {
            Optional<AIModel> existingDefault = modelRepository.findByIsDefaultTrue();
            existingDefault.ifPresent(defaultModel -> {
                defaultModel.setDefault(false);
                modelRepository.save(defaultModel);
            });
        }
        
        return modelRepository.save(model);
    }
    
    @Override
    public AIModel updateModel(String modelId, AIModel model) {
        AIModel existingModel = modelRepository.findByModelId(modelId)
            .orElseThrow(() -> new RuntimeException("Model not found"));
        
        // 更新字段
        if (model.getName() != null) existingModel.setName(model.getName());
        if (model.getDescription() != null) existingModel.setDescription(model.getDescription());
        if (model.getVersion() != null) existingModel.setVersion(model.getVersion());
        if (model.getModelConfig() != null) existingModel.setModelConfig(model.getModelConfig());
        
        // 处理默认模型设置
        if (model.isDefault()) {
            Optional<AIModel> existingDefault = modelRepository.findByIsDefaultTrue();
            existingDefault.ifPresent(defaultModel -> {
                if (!defaultModel.getModelId().equals(modelId)) {
                    defaultModel.setDefault(false);
                    modelRepository.save(defaultModel);
                }
            });
            existingModel.setDefault(true);
        }
        
        return modelRepository.save(existingModel);
    }
    
    @Override
    public void deleteModel(String modelId) {
        AIModel model = modelRepository.findByModelId(modelId)
            .orElseThrow(() -> new RuntimeException("Model not found"));
        
        // 如果模型已部署，先取消部署
        if (deployedModels.containsKey(modelId)) {
            undeployModel(modelId);
        }
        
        modelRepository.delete(model);
    }
    
    @Override
    public ModelStatusResponse deployModel(ModelDeployRequest request) {
        AIModel model = modelRepository.findByModelId(request.getModelId())
            .orElseThrow(() -> new RuntimeException("Model not found"));
        
        // 模拟部署
        ModelStatusResponse status = new ModelStatusResponse();
        status.setModelId(request.getModelId());
        status.setName(model.getName());
        status.setStatus("deployed");
        status.setEnvironment(request.getEnvironment());
        status.setReplicaCount(request.getReplicaCount());
        status.setEndpoint(request.getEndpoint() != null ? request.getEndpoint() : "http://localhost:8080/api/ai/models/" + request.getModelId());
        status.setDeployedAt(java.time.LocalDateTime.now());
        status.setLastHealthCheck(java.time.LocalDateTime.now());
        status.setConfiguration(request.getDeploymentConfig() != null ? request.getDeploymentConfig() : new HashMap<>());
        
        // 模拟资源使用情况
        Map<String, Object> resourceUsage = new HashMap<>();
        resourceUsage.put("cpu", 0.2);
        resourceUsage.put("memory", 1.5);
        resourceUsage.put("gpu", 0.0);
        status.setResourceUsage(resourceUsage);
        
        // 设置性能指标
        status.setRequestsPerSecond(5.0);
        status.setAverageResponseTimeMs(250.0);
        status.setErrorRate(0.0);
        
        deployedModels.put(request.getModelId(), status);
        
        // 更新模型状态
        model.setStatus("active");
        model.setDeployedAt(java.time.LocalDateTime.now());
        modelRepository.save(model);
        
        return status;
    }
    
    @Override
    public void undeployModel(String modelId) {
        AIModel model = modelRepository.findByModelId(modelId)
            .orElseThrow(() -> new RuntimeException("Model not found"));
        
        deployedModels.remove(modelId);
        
        // 更新模型状态
        model.setStatus("inactive");
        modelRepository.save(model);
    }
    
    @Override
    public ModelStatusResponse getModelStatus(String modelId) {
        ModelStatusResponse status = deployedModels.get(modelId);
        if (status == null) {
            // 检查模型是否存在但未部署
            AIModel model = modelRepository.findByModelId(modelId)
                .orElseThrow(() -> new RuntimeException("Model not found"));
            
            status = new ModelStatusResponse();
            status.setModelId(modelId);
            status.setName(model.getName());
            status.setStatus("not_deployed");
        }
        
        // 更新健康检查时间
        status.setLastHealthCheck(java.time.LocalDateTime.now());
        
        return status;
    }
    
    @Override
    public AIModel setDefaultModel(String modelId) {
        AIModel model = modelRepository.findByModelId(modelId)
            .orElseThrow(() -> new RuntimeException("Model not found"));
        
        // 更新所有模型的默认状态
        List<AIModel> allModels = modelRepository.findAll();
        for (AIModel m : allModels) {
            m.setDefault(m.getModelId().equals(modelId));
        }
        modelRepository.saveAll(allModels);
        
        return model;
    }
    
    @Override
    public Optional<AIModel> getDefaultModel() {
        return modelRepository.findByIsDefaultTrue();
    }
    
    @Override
    public List<AIModel> searchModels(String keyword) {
        return modelRepository.findByNameContaining(keyword);
    }
    
    @Override
    public List<AIModel> filterModelsByType(String modelType) {
        return modelRepository.findByModelType(modelType);
    }
    
    @Override
    public List<AIModel> filterModelsByProvider(String provider) {
        return modelRepository.findByProvider(provider);
    }
}