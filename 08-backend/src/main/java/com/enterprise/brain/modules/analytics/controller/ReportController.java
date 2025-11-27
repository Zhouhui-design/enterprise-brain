package com.enterprise.brain.modules.analytics.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.enterprise.brain.common.response.ApiResponse;
import com.enterprise.brain.modules.analytics.dto.ReportDefinitionDTO;
import com.enterprise.brain.modules.analytics.dto.ReportQueryDTO;
import com.enterprise.brain.modules.analytics.entity.DataReport;
import com.enterprise.brain.modules.analytics.service.DataReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 报表管理Controller
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Tag(name = "报表管理", description = "报表定义和查询接口")
@RestController
@RequestMapping("/analytics/report")
@RequiredArgsConstructor
public class ReportController {

    private final DataReportService dataReportService;

    @Operation(summary = "创建报表")
    @PostMapping
    public ApiResponse<Long> createReport(@Validated @RequestBody ReportDefinitionDTO dto) {
        Long reportId = dataReportService.createReport(dto);
        return ApiResponse.success(reportId);
    }

    @Operation(summary = "更新报表")
    @PutMapping("/{id}")
    public ApiResponse<Boolean> updateReport(@PathVariable Long id,
                                               @Validated @RequestBody ReportDefinitionDTO dto) {
        Boolean result = dataReportService.updateReport(id, dto);
        return ApiResponse.success(result);
    }

    @Operation(summary = "删除报表")
    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> deleteReport(@PathVariable Long id) {
        Boolean result = dataReportService.deleteReport(id);
        return ApiResponse.success(result);
    }

    @Operation(summary = "获取报表详情")
    @GetMapping("/{id}")
    public ApiResponse<DataReport> getReport(@PathVariable Long id) {
        DataReport report = dataReportService.getReportById(id);
        return ApiResponse.success(report);
    }

    @Operation(summary = "获取报表列表")
    @GetMapping("/list")
    public ApiResponse<Page<DataReport>> getReportList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String reportType,
            @RequestParam(required = false) String keyword) {
        Page<DataReport> page = new Page<>(pageNum, pageSize);
        Page<DataReport> result = dataReportService.getReportList(page, reportType, keyword);
        return ApiResponse.success(result);
    }

    @Operation(summary = "执行报表查询")
    @PostMapping("/execute")
    public ApiResponse<Map<String, Object>> executeReport(@Validated @RequestBody ReportQueryDTO queryDTO) {
        Map<String, Object> result = dataReportService.executeReport(queryDTO);
        return ApiResponse.success(result);
    }

    @Operation(summary = "导出报表")
    @PostMapping("/export")
    public ApiResponse<String> exportReport(@Validated @RequestBody ReportQueryDTO queryDTO) {
        String filePath = dataReportService.exportReport(queryDTO);
        return ApiResponse.success(filePath);
    }

    @Operation(summary = "获取公开报表列表")
    @GetMapping("/public")
    public ApiResponse<List<DataReport>> getPublicReports() {
        List<DataReport> reports = dataReportService.getPublicReports();
        return ApiResponse.success(reports);
    }

    @Operation(summary = "获取用户可见报表")
    @GetMapping("/user/{userId}")
    public ApiResponse<List<DataReport>> getUserReports(@PathVariable Long userId) {
        List<DataReport> reports = dataReportService.getUserReports(userId);
        return ApiResponse.success(reports);
    }
}
