package com.enterprise.brain.modules.analytics.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.enterprise.brain.common.response.ApiResponse;
import com.enterprise.brain.modules.analytics.dto.DashboardDTO;
import com.enterprise.brain.modules.analytics.entity.Dashboard;
import com.enterprise.brain.modules.analytics.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 仪表板管理Controller
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Tag(name = "仪表板管理", description = "仪表板配置和展示接口")
@RestController
@RequestMapping("/analytics/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @Operation(summary = "创建仪表板")
    @PostMapping
    public ApiResponse<Long> createDashboard(@Validated @RequestBody DashboardDTO dto) {
        Long dashboardId = dashboardService.createDashboard(dto);
        return ApiResponse.success(dashboardId);
    }

    @Operation(summary = "更新仪表板")
    @PutMapping("/{id}")
    public ApiResponse<Boolean> updateDashboard(@PathVariable Long id,
                                                  @Validated @RequestBody DashboardDTO dto) {
        Boolean result = dashboardService.updateDashboard(id, dto);
        return ApiResponse.success(result);
    }

    @Operation(summary = "删除仪表板")
    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> deleteDashboard(@PathVariable Long id) {
        Boolean result = dashboardService.deleteDashboard(id);
        return ApiResponse.success(result);
    }

    @Operation(summary = "获取仪表板详情")
    @GetMapping("/{id}")
    public ApiResponse<Dashboard> getDashboard(@PathVariable Long id) {
        Dashboard dashboard = dashboardService.getDashboardById(id);
        return ApiResponse.success(dashboard);
    }

    @Operation(summary = "获取仪表板列表")
    @GetMapping("/list")
    public ApiResponse<Page<Dashboard>> getDashboardList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword) {
        Page<Dashboard> page = new Page<>(pageNum, pageSize);
        Page<Dashboard> result = dashboardService.getDashboardList(page, keyword);
        return ApiResponse.success(result);
    }

    @Operation(summary = "获取公开仪表板列表")
    @GetMapping("/public")
    public ApiResponse<List<Dashboard>> getPublicDashboards() {
        List<Dashboard> dashboards = dashboardService.getPublicDashboards();
        return ApiResponse.success(dashboards);
    }

    @Operation(summary = "获取用户可见仪表板")
    @GetMapping("/user/{userId}")
    public ApiResponse<List<Dashboard>> getUserDashboards(@PathVariable Long userId) {
        List<Dashboard> dashboards = dashboardService.getUserDashboards(userId);
        return ApiResponse.success(dashboards);
    }
}
