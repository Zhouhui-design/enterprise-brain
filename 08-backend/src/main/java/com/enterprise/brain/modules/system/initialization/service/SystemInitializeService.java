package com.enterprise.brain.modules.system.initialization.service;

import com.enterprise.brain.modules.system.initialization.dto.request.InitializeRequest;
import com.enterprise.brain.modules.system.initialization.dto.request.DataResetRequest;
import com.enterprise.brain.modules.system.initialization.dto.request.BackupRequest;
import com.enterprise.brain.modules.system.initialization.dto.response.InitializeResponse;
import com.enterprise.brain.modules.system.initialization.dto.response.DataResetResponse;
import com.enterprise.brain.modules.system.initialization.dto.response.BackupResponse;
import com.enterprise.brain.modules.system.initialization.entity.SystemConfig;

import java.util.List;

/**
 * 系统初始化服务接口
 * 
 * @author Enterprise Brain Team
 * @version 1.0.0
 * @since 2024-01-01
 */
public interface SystemInitializeService {

    /**
     * 获取系统初始化状态
     * 
     * @return 系统配置信息
     */
    SystemConfig getInitializationStatus();

    /**
     * 执行系统初始化
     * 
     * @param request 初始化请求
     * @return 初始化响应
     */
    InitializeResponse initializeSystem(InitializeRequest request);

    /**
     * 验证初始化环境
     * 
     * @return 验证结果
     */
    InitializeResponse validateInitializationEnvironment();

    /**
     * 获取初始化日志
     * 
     * @param page 页码
     * @param size 每页大小
     * @param operationType 操作类型
     * @return 日志列表
     */
    List<String> getInitializationLogs(int page, int size, String operationType);

    /**
     * 获取支持的初始化模板
     * 
     * @return 模板列表
     */
    List<SystemConfig> getInitializationTemplates();

    /**
     * 清理临时文件
     * 
     * @return 清理结果
     */
    Boolean cleanupTempFiles();

    /**
     * 获取系统健康状态
     * 
     * @return 健康状态信息
     */
    InitializeResponse getSystemHealth();

    /**
     * 执行系统优化
     * 
     * @param optimizeType 优化类型
     * @return 优化结果
     */
    InitializeResponse optimizeSystem(String optimizeType);

    /**
     * 执行数据库迁移
     * 
     * @param migrateVersion 目标版本
     * @return 迁移结果
     */
    InitializeResponse migrateDatabase(String migrateVersion);

    /**
     * 验证系统完整性
     * 
     * @return 验证结果
     */
    InitializeResponse validateSystemIntegrity();

    /**
     * 初始化权限系统
     * 
     * @param request 初始化请求
     * @return 初始化结果
     */
    InitializeResponse initializePermissionSystem(InitializeRequest request);

    /**
     * 初始化基础数据
     * 
     * @param request 初始化请求
     * @return 初始化结果
     */
    InitializeResponse initializeBasicData(InitializeRequest request);

    /**
     * 初始化系统参数
     * 
     * @param request 初始化请求
     * @return 初始化结果
     */
    InitializeResponse initializeSystemParameters(InitializeRequest request);

    /**
     * 生成初始化报告
     * 
     * @param reportType 报告类型
     * @return 报告结果
     */
    InitializeResponse generateInitializationReport(String reportType);

    /**
     * 检查初始化依赖
     * 
     * @return 依赖检查结果
     */
    InitializeResponse checkInitializationDependencies();

    /**
     * 执行预处理
     * 
     * @param request 初始化请求
     * @return 预处理结果
     */
    InitializeResponse executePreprocessing(InitializeRequest request);

    /**
     * 执行后处理
     * 
     * @param request 初始化请求
     * @return 后处理结果
     */
    InitializeResponse executePostprocessing(InitializeRequest request);

    /**
     * 回滚初始化
     * 
     * @param rollbackId 回滚点ID
     * @return 回滚结果
     */
    InitializeResponse rollbackInitialization(String rollbackId);

    /**
     * 获取初始化进度
     * 
     * @param taskId 任务ID
     * @return 进度信息
     */
    InitializeResponse getInitializationProgress(String taskId);

    /**
     * 取消初始化任务
     * 
     * @param taskId 任务ID
     * @return 取消结果
     */
    InitializeResponse cancelInitializationTask(String taskId);

    /**
     * 重试初始化任务
     * 
     * @param taskId 任务ID
     * @return 重试结果
     */
    InitializeResponse retryInitializationTask(String taskId);

    /**
     * 计划初始化任务
     * 
     * @param request 初始化请求
     * @param scheduledTime 计划时间
     * @return 计划结果
     */
    InitializeResponse scheduleInitialization(InitializeRequest request, String scheduledTime);

    /**
     * 获取初始化历史
     * 
     * @param page 页码
     * @param size 每页大小
     * @return 历史记录
     */
    List<InitializeResponse> getInitializationHistory(int page, int size);

    /**
     * 导出初始化配置
     * 
     * @param configId 配置ID
     * @return 导出结果
     */
    InitializeResponse exportInitializationConfig(String configId);

    /**
     * 导入初始化配置
     * 
     * @param configData 配置数据
     * @return 导入结果
     */
    InitializeResponse importInitializationConfig(String configData);
}