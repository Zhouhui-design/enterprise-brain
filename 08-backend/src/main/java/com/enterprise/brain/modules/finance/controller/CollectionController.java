package com.enterprise.brain.modules.finance.controller;

import com.enterprise.brain.modules.finance.service.CollectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 回款管理控制器
 * 
 * @author enterprise
 * @date 2024-01-01
 */
@RestController
@RequestMapping("/api/finance/collection")
@Tag(name = "回款管理", description = "回款计划管理接口")
public class CollectionController {

    @Autowired
    private CollectionService collectionService;

    @Operation(summary = "获取回款计划列表")
    @GetMapping("/plans/list")
    public ResponseEntity<?> getCollectionPlanList(@RequestParam Map<String, Object> params) {
        try {
            return ResponseEntity.ok(collectionService.getCollectionPlanList(params));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "获取回款计划详情")
    @GetMapping("/plans/{id}")
    public ResponseEntity<?> getCollectionPlanDetail(@PathVariable("id") Long planId) {
        try {
            return ResponseEntity.ok(collectionService.getCollectionPlanDetail(planId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "创建回款计划")
    @PostMapping("/plans")
    public ResponseEntity<?> createCollectionPlan(@RequestBody Map<String, Object> planData) {
        try {
            boolean result = collectionService.createCollectionPlan(planData);
            return ResponseEntity.ok(Map.of("success", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "更新回款计划")
    @PutMapping("/plans")
    public ResponseEntity<?> updateCollectionPlan(@RequestBody Map<String, Object> planData) {
        try {
            boolean result = collectionService.updateCollectionPlan(planData);
            return ResponseEntity.ok(Map.of("success", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "确认回款计划")
    @PostMapping("/plans/{id}/confirm")
    public ResponseEntity<?> confirmCollectionPlan(@PathVariable("id") Long planId) {
        try {
            boolean result = collectionService.confirmCollectionPlan(planId);
            return ResponseEntity.ok(Map.of("success", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "执行回款计划")
    @PostMapping("/plans/{id}/execute")
    public ResponseEntity<?> executeCollectionPlan(@PathVariable("id") Long planId) {
        try {
            boolean result = collectionService.executeCollectionPlan(planId);
            return ResponseEntity.ok(Map.of("success", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "完成回款计划")
    @PostMapping("/plans/{id}/complete")
    public ResponseEntity<?> completeCollectionPlan(@PathVariable("id") Long planId) {
        try {
            boolean result = collectionService.completeCollectionPlan(planId);
            return ResponseEntity.ok(Map.of("success", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "终止回款计划")
    @PostMapping("/plans/{id}/terminate")
    public ResponseEntity<?> terminateCollectionPlan(@PathVariable("id") Long planId) {
        try {
            boolean result = collectionService.terminateCollectionPlan(planId);
            return ResponseEntity.ok(Map.of("success", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "记录回款")
    @PostMapping("/payments")
    public ResponseEntity<?> recordPayment(@RequestBody Map<String, Object> paymentData) {
        try {
            boolean result = collectionService.recordPayment(paymentData);
            return ResponseEntity.ok(Map.of("success", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "获取回款计划执行记录")
    @GetMapping("/plans/{id}/execution-records")
    public ResponseEntity<?> getCollectionPlanExecutionRecords(@PathVariable("id") Long planId) {
        try {
            return ResponseEntity.ok(collectionService.getCollectionPlanExecutionRecords(planId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "导出回款计划")
    @GetMapping("/plans/export")
    public ResponseEntity<byte[]> exportCollectionPlans(@RequestParam Map<String, Object> params) {
        try {
            byte[] fileData = collectionService.exportCollectionPlans(params);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "collection-plans.xlsx");
            return new ResponseEntity<>(fileData, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}