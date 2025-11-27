package com.enterprise.brain.modules.system.initialization.service;

import com.enterprise.brain.modules.system.initialization.dto.request.DataResetRequest;
import com.enterprise.brain.modules.system.initialization.dto.request.BackupRequest;
import com.enterprise.brain.modules.system.initialization.dto.response.DataResetResponse;
import com.enterprise.brain.modules.system.initialization.dto.response.BackupResponse;
import com.enterprise.brain.modules.system.initialization.dto.response.InitializeResponse;

/**
 * 数据重置服务接口
 * 
 * @author Enterprise Brain Team
 * @version 1.0.0
 * @since 2024-01-01
 */
public interface DataResetService {

    /**
     * 重置系统数据
     * 
     * @param request 重置请求
     * @return 重置响应
     */
    DataResetResponse resetSystemData(DataResetRequest request);

    /**
     * 备份系统数据
     * 
     * @param request 备份请求
     * @return 备份响应
     */
    BackupResponse backupSystemData(BackupRequest request);

    /**
     * 恢复系统数据
     * 
     * @param backupId 备份ID
     * @return 恢复响应
     */
    InitializeResponse restoreSystemData(String backupId);

    /**
     * 获取备份列表
     * 
     * @param page 页码
     * @param size 每页大小
     * @param backupType 备份类型
     * @return 备份列表
     */
    BackupResponse getBackupList(int page, int size, String backupType);

    /**
     * 删除备份
     * 
     * @param backupId 备份ID
     * @return 删除结果
     */
    Boolean deleteBackup(String backupId);

    /**
     * 下载备份文件
     * 
     * @param backupId 备份ID
     * @return 下载URL
     */
    String getBackupDownloadUrl(String backupId);

    /**
     * 验证备份完整性
     * 
     * @param backupId 备份ID
     * @return 验证结果
     */
    Boolean validateBackupIntegrity(String backupId);

    /**
     * 压缩备份文件
     * 
     * @param backupId 备份ID
     * @return 压缩结果
     */
    Boolean compressBackup(String backupId);

    /**
     * 解压备份文件
     * 
     * @param backupId 备份ID
     * @return 解压结果
     */
    Boolean decompressBackup(String backupId);

    /**
     * 同步备份到远程存储
     * 
     * @param backupId 备份ID
     * @return 同步结果
     */
    Boolean syncBackupToRemote(String backupId);

    /**
     * 从远程存储恢复备份
     * 
     * @param backupId 备份ID
     * @return 恢复结果
     */
    Boolean restoreBackupFromRemote(String backupId);

    /**
     * 获取备份统计信息
     * 
     * @return 统计信息
     */
    BackupResponse getBackupStatistics();

    /**
     * 清理过期备份
     * 
     * @param retentionDays 保留天数
     * @return 清理结果
     */
    Boolean cleanupExpiredBackups(Integer retentionDays);

    /**
     * 导出数据模板
     * 
     * @param templateType 模板类型
     * @return 模板数据
     */
    BackupResponse exportDataTemplate(String templateType);

    /**
     * 导入数据模板
     * 
     * @param templateData 模板数据
     * @return 导入结果
     */
    DataResetResponse importDataTemplate(String templateData);

    /**
     * 数据迁移检查
     * 
     * @param sourceVersion 源版本
     * @param targetVersion 目标版本
     * @return 迁移检查结果
     */
    DataResetResponse checkDataMigration(String sourceVersion, String targetVersion);

    /**
     * 执行数据迁移
     * 
     * @param sourceVersion 源版本
     * @param targetVersion 目标版本
     * @return 迁移结果
     */
    DataResetResponse executeDataMigration(String sourceVersion, String targetVersion);

    /**
     * 验证数据一致性
     * 
     * @param consistencyType 一致性类型
     * @return 验证结果
     */
    DataResetResponse validateDataConsistency(String consistencyType);

    /**
     * 修复数据不一致
     * 
     * @param inconsistencyData 不一致数据
     * @return 修复结果
     */
    DataResetResponse fixDataInconsistency(String inconsistencyData);

    /**
     * 获取数据重置日志
     * 
     * @param page 页码
     * @param size 每页大小
     * @param operationType 操作类型
     * @return 日志列表
     */
    BackupResponse getResetLogs(int page, int size, String operationType);

    /**
     * 获取备份恢复进度
     * 
     * @param taskId 任务ID
     * @return 进度信息
     */
    InitializeResponse getBackupRestoreProgress(String taskId);

    /**
     * 取消备份或恢复任务
     * 
     * @param taskId 任务ID
     * @return 取消结果
     */
    Boolean cancelBackupRestoreTask(String taskId);

    /**
     * 获取数据重置预览
     * 
     * @param request 重置请求
     * @return 预览结果
     */
    DataResetResponse getDataResetPreview(DataResetRequest request);

    /**
     * 创建定时备份计划
     * 
     * @param scheduleConfig 计划配置
     * @return 计划结果
     */
    BackupResponse createBackupSchedule(String scheduleConfig);

    /**
     * 获取备份计划列表
     * 
     * @return 计划列表
     */
    BackupResponse getBackupSchedules();

    /**
     * 更新备份计划
     * 
     * @param scheduleId 计划ID
     * @param scheduleConfig 计划配置
     * @return 更新结果
     */
    BackupResponse updateBackupSchedule(String scheduleId, String scheduleConfig);

    /**
     * 删除备份计划
     * 
     * @param scheduleId 计划ID
     * @return 删除结果
     */
    Boolean deleteBackupSchedule(String scheduleId);

    /**
     * 执行增量备份
     * 
     * @param lastBackupId 最后备份ID
     * @return 增量备份结果
     */
    BackupResponse performIncrementalBackup(String lastBackupId);

    /**
     * 合并备份文件
     * 
     * @param backupIds 备份ID列表
     * @return 合并结果
     */
    BackupResponse mergeBackups(String[] backupIds);

    /**
     * 分割备份文件
     * 
     * @param backupId 备份ID
     * @param splitSize 分割大小
     * @return 分割结果
     */
    BackupResponse splitBackup(String backupId, Long splitSize);
}