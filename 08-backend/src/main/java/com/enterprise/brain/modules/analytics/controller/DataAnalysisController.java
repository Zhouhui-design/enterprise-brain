package com.enterprise.brain.modules.analytics.controller;

import com.enterprise.brain.common.response.ApiResponse;
import com.enterprise.brain.modules.analytics.dto.DataAnalysisDTO;
import com.enterprise.brain.modules.analytics.service.DataAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 数据分析Controller
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Tag(name = "数据分析", description = "数据分析接口")
@RestController
@RequestMapping("/analytics/analysis")
@RequiredArgsConstructor
public class DataAnalysisController {

    private final DataAnalysisService dataAnalysisService;

    @Operation(summary = "执行数据分析")
    @PostMapping("/execute")
    public ApiResponse<Map<String, Object>> analyzeData(@Validated @RequestBody DataAnalysisDTO dto) {
        Map<String, Object> result = dataAnalysisService.analyzeData(dto);
        return ApiResponse.success(result);
    }

    @Operation(summary = "销售趋势分析")
    @PostMapping("/sales-trend")
    public ApiResponse<Map<String, Object>> analyzeSalesTrend(@Validated @RequestBody DataAnalysisDTO dto) {
        Map<String, Object> result = dataAnalysisService.analyzeSalesTrend(dto);
        return ApiResponse.success(result);
    }

    @Operation(summary = "库存分析")
    @PostMapping("/inventory")
    public ApiResponse<Map<String, Object>> analyzeInventory(@Validated @RequestBody DataAnalysisDTO dto) {
        Map<String, Object> result = dataAnalysisService.analyzeInventory(dto);
        return ApiResponse.success(result);
    }

    @Operation(summary = "生产效率分析")
    @PostMapping("/production-efficiency")
    public ApiResponse<Map<String, Object>> analyzeProductionEfficiency(@Validated @RequestBody DataAnalysisDTO dto) {
        Map<String, Object> result = dataAnalysisService.analyzeProductionEfficiency(dto);
        return ApiResponse.success(result);
    }

    @Operation(summary = "客户分析")
    @PostMapping("/customer")
    public ApiResponse<Map<String, Object>> analyzeCustomer(@Validated @RequestBody DataAnalysisDTO dto) {
        Map<String, Object> result = dataAnalysisService.analyzeCustomer(dto);
        return ApiResponse.success(result);
    }
}
