package com.enterprise.brain.modules.system.initialization.controller;

import com.enterprise.brain.common.api.ApiResult;
import com.enterprise.brain.modules.system.initialization.dto.request.InitializeRequest;
import com.enterprise.brain.modules.system.initialization.dto.request.DataResetRequest;
import com.enterprise.brain.modules.system.initialization.dto.request.BackupRequest;
import com.enterprise.brain.modules.system.initialization.dto.response.InitializeResponse;
import com.enterprise.brain.modules.system.initialization.dto.response.DataResetResponse;
import com.enterprise.brain.modules.system.initialization.dto.response.BackupResponse;
import com.enterprise.brain.modules.system.initialization.service.SystemInitializeService;
import com.enterprise.brain.modules.system.initialization.service.DataResetService;
import com.enterprise.brain.modules.system.initialization.entity.SystemConfig;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

/**
 * 系统初始化控制器
 * 
 * @author Enterprise Brain Team
 * @version 1.0.0
 * @since 2024-01-01
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/system/initialization")
@RequiredArgsConstructor
@Api(tags = "系统初始化管理")
@Validated
public class SystemInitializeController {

    private final SystemInitializeService systemInitializeService;
    private final DataResetService dataResetService;

    /**
     * 获取系统初始化状态
     */
    @GetMapping("/status")
    @ApiOperation("获取系统初始化状态")
    @PreAuthorize("hasAuthority('system:initialization:view')")
    public ApiResult<SystemConfig> getInitializationStatus() {
        log.info("获取系统初始化状态");
        SystemConfig config = systemInitializeService.getInitializationStatus();
        return ApiResult.success(config);
    }

    /**
     * 执行系统初始化
     */
    @PostMapping("/initialize")
    @ApiOperation("执行系统初始化")
    @PreAuthorize("hasAuthority('system:initialization:execute')")
    public ApiResult<InitializeResponse> initializeSystem(
            @Valid @RequestBody InitializeRequest request) {
        log.info("执行系统初始化: {}", request);
        
        try {
            InitializeResponse response = systemInitializeService.initializeSystem(request);
            return ApiResult.success(response);
        } catch (Exception e) {
            log.error("系统初始化失败", e);
            return ApiResult.error("系统初始化失败: " + e.getMessage());
        }
    }

    /**
     * 重置系统数据
     */
    @PostMapping("/data/reset")
    @ApiOperation("重置系统数据")
    @PreAuthorize("hasAuthority('system:initialization:reset')")
    public ApiResult<DataResetResponse> resetSystemData(
            @Valid @RequestBody DataResetRequest request) {
        log.info("重置系统数据: {}", request);
        
        try {
            DataResetResponse response = dataResetService.resetSystemData(request);
            return ApiResult.success(response);
        } catch (Exception e) {
            log.error("系统数据重置失败", e);
            return ApiResult.error("系统数据重置失败: " + e.getMessage());
        }
    }

    /**
     * 备份系统数据
     */
    @PostMapping("/data/backup")
    @ApiOperation("备份系统数据")
    @PreAuthorize("hasAuthority('system:initialization:backup')")
    public ApiResult<BackupResponse> backupSystemData(
            @Valid @RequestBody BackupRequest request) {
        log.info("备份系统数据: {}", request);
        
        try {
            BackupResponse response = dataResetService.backupSystemData(request);
            return ApiResult.success(response);
        } catch (Exception e) {
            log.error("系统数据备份失败", e);
            return ApiResult.error("系统数据备份失败: " + e.getMessage());
        }
    }

    /**
     * 恢复系统数据
     */
    @PostMapping("/data/restore")
    @ApiOperation("恢复系统数据")
    @PreAuthorize("hasAuthority('system:initialization:restore')")
    public ApiResult<InitializeResponse> restoreSystemData(
            @ApiParam(value = "备份文件ID", required = true) @RequestParam String backupId) {
        log.info("恢复系统数据: {}", backupId);
        
        try {
            InitializeResponse response = dataResetService.restoreSystemData(backupId);
            return ApiResult.success(response);
        } catch (Exception e) {
            log.error("系统数据恢复失败", e);
            return ApiResult.error("系统数据恢复失败: " + e.getMessage());
        }
    }

    /**
     * 获取初始化日志
     */
    @GetMapping("/logs")
    @ApiOperation("获取初始化日志")
    @PreAuthorize("hasAuthority('system:initialization:view')")
    public ApiResult<List<String>> getInitializationLogs(
            @ApiParam(value = "页码") @RequestParam(defaultValue = "1") int page,
            @ApiParam(value = "每页大小") @RequestParam(defaultValue = "20") int size,
            @ApiParam(value = "操作类型") @RequestParam(required = false) String operationType) {
        log.info("获取初始化日志: page={}, size={}, operationType={}", page, size, operationType);
        
        List<String> logs = systemInitializeService.getInitializationLogs(page, size, operationType);
        return ApiResult.success(logs);
    }

    /**
     * 验证初始化环境
     */
    @GetMapping("/environment/validate")
    @ApiOperation("验证初始化环境")
    @PreAuthorize("hasAuthority('system:initialization:view')")
    public ApiResult<InitializeResponse> validateInitializationEnvironment() {
        log.info("验证初始化环境");
        
        try {
            InitializeResponse response = systemInitializeService.validateInitializationEnvironment();
            return ApiResult.success(response);
        } catch (Exception e) {
            log.error("初始化环境验证失败", e);
            return ApiResult.error("初始化环境验证失败: " + e.getMessage());
        }
    }

    /**
     * 获取支持的初始化模板
     */
    @GetMapping("/templates")
    @ApiOperation("获取支持的初始化模板")
    @PreAuthorize("hasAuthority('system:initialization:view')")
    public ApiResult<List<SystemConfig>> getInitializationTemplates() {
        log.info("获取初始化模板");
        
        try {
            List<SystemConfig> templates = systemInitializeService.getInitializationTemplates();
            return ApiResult.success(templates);
        } catch (Exception e) {
            log.error("获取初始化模板失败", e);
            return ApiResult.error("获取初始化模板失败: " + e.getMessage());
        }
    }

    /**
     * 清理临时文件
     */
    @Delete("/temp/cleanup")
    @ApiOperation("清理临时文件")
    @PreAuthorize("hasAuthority('system:initialization:cleanup')")
    public ApiResult<Boolean> cleanupTempFiles() {
        log.info("清理临时文件");
        
        try {
            Boolean result = systemInitializeService.cleanupTempFiles();
            return ApiResult.success(result);
        } catch (Exception e) {
            log.error("清理临时文件失败", e);
            return ApiResult.error("清理临时文件失败: " + e.getMessage());
        }
    }

    /**
     * 获取系统健康状态
     */
    @GetMapping("/health")
    @ApiOperation("获取系统健康状态")
    @PreAuthorize("hasAuthority('system:initialization:view')")
    public ApiResult<InitializeResponse> getSystemHealth() {
        log.info("获取系统健康状态");
        
        try {
            InitializeResponse response = systemInitializeService.getSystemHealth();
            return ApiResult.success(response);
        } catch (Exception e) {
            log.error("获取系统健康状态失败", e);
            return ApiResult.error("获取系统健康状态失败: " + e.getMessage());
        }
    }

    /**
     * 执行系统优化
     */
    @PostMapping("/optimize")
    @ApiOperation("执行系统优化")
    @PreAuthorize("hasAuthority('system:initialization:optimize')")
    public ApiResult<InitializeResponse> optimizeSystem(
            @ApiParam(value = "优化类型") @RequestParam(required = false) String optimizeType) {
        log.info("执行系统优化: {}", optimizeType);
        
        try {
            InitializeResponse response = systemInitializeService.optimizeSystem(optimizeType);
            return ApiResult.success(response);
        } catch (Exception e) {
            log.error("系统优化执行失败", e);
            return ApiResult.error("系统优化执行失败: " + e.getMessage());
        }
    }
}