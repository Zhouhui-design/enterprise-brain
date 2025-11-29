package com.enterprise.brain.modules.ai.controller;

import com.enterprise.brain.modules.ai.dto.request.ModelDeployRequest;
import com.enterprise.brain.modules.ai.dto.response.ModelStatusResponse;
import com.enterprise.brain.modules.ai.entity.AIModel;
import com.enterprise.brain.modules.ai.service.AIModelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/models")
public class AIModelController {

    @Autowired
    private AIModelService modelService;
    
    @GetMapping
    public ResponseEntity<List<AIModel>> listModels() {
        try {
            List<AIModel> models = modelService.listModels();
            return ResponseEntity.ok(models);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @GetMapping("/{modelId}")
    public ResponseEntity<AIModel> getModel(@PathVariable String modelId) {
        try {
            return modelService.getModel(modelId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @PostMapping
    public ResponseEntity<AIModel> createModel(@RequestBody AIModel model) {
        try {
            AIModel createdModel = modelService.createModel(model);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdModel);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @PutMapping("/{modelId}")
    public ResponseEntity<AIModel> updateModel(@PathVariable String modelId, @RequestBody AIModel model) {
        try {
            AIModel updatedModel = modelService.updateModel(modelId, model);
            return ResponseEntity.ok(updatedModel);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @DeleteMapping("/{modelId}")
    public ResponseEntity<Void> deleteModel(@PathVariable String modelId) {
        try {
            modelService.deleteModel(modelId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/deploy")
    public ResponseEntity<ModelStatusResponse> deployModel(@RequestBody ModelDeployRequest request) {
        try {
            ModelStatusResponse status = modelService.deployModel(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(status);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @DeleteMapping("/{modelId}/deploy")
    public ResponseEntity<Void> undeployModel(@PathVariable String modelId) {
        try {
            modelService.undeployModel(modelId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{modelId}/status")
    public ResponseEntity<ModelStatusResponse> getModelStatus(@PathVariable String modelId) {
        try {
            ModelStatusResponse status = modelService.getModelStatus(modelId);
            return ResponseEntity.ok(status);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @PutMapping("/{modelId}/default")
    public ResponseEntity<AIModel> setDefaultModel(@PathVariable String modelId) {
        try {
            AIModel defaultModel = modelService.setDefaultModel(modelId);
            return ResponseEntity.ok(defaultModel);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @GetMapping("/default")
    public ResponseEntity<AIModel> getDefaultModel() {
        try {
            return modelService.getDefaultModel()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<AIModel>> searchModels(@RequestParam String keyword) {
        try {
            List<AIModel> models = modelService.searchModels(keyword);
            return ResponseEntity.ok(models);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @GetMapping("/filter/type")
    public ResponseEntity<List<AIModel>> filterModelsByType(@RequestParam String type) {
        try {
            List<AIModel> models = modelService.filterModelsByType(type);
            return ResponseEntity.ok(models);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @GetMapping("/filter/provider")
    public ResponseEntity<List<AIModel>> filterModelsByProvider(@RequestParam String provider) {
        try {
            List<AIModel> models = modelService.filterModelsByProvider(provider);
            return ResponseEntity.ok(models);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}