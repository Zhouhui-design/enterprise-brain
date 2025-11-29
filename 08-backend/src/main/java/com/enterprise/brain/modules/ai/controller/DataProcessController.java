package com.enterprise.brain.modules.ai.controller;

import com.enterprise.brain.modules.ai.service.DataProcessService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/ai/data")
public class DataProcessController {

    @Autowired
    private DataProcessService dataProcessService;
    
    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> processData(@RequestParam("file") MultipartFile file,
                                                        @RequestParam("processType") String processType) {
        try {
            Map<String, Object> result = dataProcessService.processData(file, processType);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/clean")
    public ResponseEntity<Map<String, Object>> cleanData(@RequestParam("file") MultipartFile file,
                                                      @RequestBody Map<String, Object> options) {
        try {
            Map<String, Object> result = dataProcessService.cleanData(file, options);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/augment")
    public ResponseEntity<Map<String, Object>> augmentData(@RequestParam("file") MultipartFile file,
                                                        @RequestBody Map<String, Object> options) {
        try {
            Map<String, Object> result = dataProcessService.augmentData(file, options);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/convert")
    public ResponseEntity<Map<String, Object>> convertFormat(@RequestParam("file") MultipartFile file,
                                                          @RequestParam("targetFormat") String targetFormat) {
        try {
            Map<String, Object> result = dataProcessService.convertFormat(file, targetFormat);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateData(@RequestParam("file") MultipartFile file,
                                                         @RequestBody Map<String, Object> validationRules) {
        try {
            Map<String, Object> result = dataProcessService.validateData(file, validationRules);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/analyze")
    public ResponseEntity<Map<String, Object>> analyzeQuality(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> result = dataProcessService.analyzeQuality(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/split")
    public ResponseEntity<Map<String, Object>> splitDataset(@RequestParam("file") MultipartFile file,
                                                        @RequestBody Map<String, Object> splitOptions) {
        try {
            Map<String, Object> result = dataProcessService.splitDataset(file, splitOptions);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/merge")
    public ResponseEntity<Map<String, Object>> mergeDatasets(@RequestParam("files") MultipartFile[] files) {
        try {
            Map<String, Object> result = dataProcessService.mergeDatasets(files);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/export")
    public ResponseEntity<Map<String, Object>> exportData(@RequestParam("file") MultipartFile file,
                                                       @RequestParam("exportFormat") String exportFormat) {
        try {
            Map<String, Object> result = dataProcessService.exportData(file, exportFormat);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStatistics(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> stats = dataProcessService.getStatistics(file);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}