package com.enterprise.brain.modules.ai.controller;

import com.enterprise.brain.modules.ai.dto.request.TrainingRequest;
import com.enterprise.brain.modules.ai.dto.response.TrainingResponse;
import com.enterprise.brain.modules.ai.entity.TrainingData;
import com.enterprise.brain.modules.ai.entity.TrainingJob;
import com.enterprise.brain.modules.ai.service.AITrainingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai/training")
public class AITrainingController {

    @Autowired
    private AITrainingService trainingService;
    
    @PostMapping("/jobs")
    public ResponseEntity<TrainingResponse> startTraining(@RequestBody TrainingRequest request) {
        try {
            TrainingResponse response = trainingService.startTraining(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Failed to start training: " + e.getMessage()));
        }
    }
    
    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<TrainingResponse> getTrainingStatus(@PathVariable String jobId) {
        try {
            TrainingResponse response = trainingService.getTrainingStatus(jobId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Failed to get training status"));
        }
    }
    
    @GetMapping("/jobs")
    public ResponseEntity<List<TrainingJob>> listTrainingJobs() {
        try {
            List<TrainingJob> jobs = trainingService.listTrainingJobs();
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @DeleteMapping("/jobs/{jobId}")
    public ResponseEntity<Void> cancelTraining(@PathVariable String jobId) {
        try {
            trainingService.cancelTraining(jobId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/jobs/{jobId}/logs")
    public ResponseEntity<String> getTrainingLogs(@PathVariable String jobId) {
        try {
            String logs = trainingService.getTrainingLogs(jobId);
            return ResponseEntity.ok(logs);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @PostMapping("/data/upload")
    public ResponseEntity<TrainingData> uploadTrainingData(
            @RequestParam("file") MultipartFile file,
            @RequestParam("dataType") String dataType,
            @RequestParam("description") String description) {
        try {
            TrainingData data = trainingService.uploadTrainingData(file, dataType, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(data);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @GetMapping("/data")
    public ResponseEntity<List<TrainingData>> listTrainingData() {
        try {
            List<TrainingData> dataList = trainingService.listTrainingData();
            return ResponseEntity.ok(dataList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @GetMapping("/data/{dataId}")
    public ResponseEntity<TrainingData> getTrainingData(@PathVariable String dataId) {
        try {
            return trainingService.getTrainingData(dataId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @DeleteMapping("/data/{dataId}")
    public ResponseEntity<Void> deleteTrainingData(@PathVariable String dataId) {
        try {
            trainingService.deleteTrainingData(dataId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/data/{dataId}/validate")
    public ResponseEntity<Map<String, Boolean>> validateTrainingData(@PathVariable String dataId) {
        try {
            boolean isValid = trainingService.validateTrainingData(dataId);
            return ResponseEntity.ok(Map.of("valid", isValid));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @PutMapping("/jobs/{jobId}/pause")
    public ResponseEntity<Void> pauseTraining(@PathVariable String jobId) {
        try {
            trainingService.pauseTraining(jobId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PutMapping("/jobs/{jobId}/resume")
    public ResponseEntity<Void> resumeTraining(@PathVariable String jobId) {
        try {
            trainingService.resumeTraining(jobId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // 辅助方法：创建错误响应
    private TrainingResponse createErrorResponse(String errorMessage) {
        TrainingResponse response = new TrainingResponse();
        response.setStatus("error");
        response.setErrorMessage(errorMessage);
        return response;
    }
}