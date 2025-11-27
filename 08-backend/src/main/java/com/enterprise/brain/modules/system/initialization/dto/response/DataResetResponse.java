package com.enterprise.brain.modules.system.initialization.dto.response;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 数据重置响应DTO
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
@ApiModel(value = "数据重置响应", description = "数据重置结果")
public class DataResetResponse {

    @ApiModelProperty(value = "重置ID")
    private String resetId;

    @ApiModelProperty(value = "重置状态", allowableValues = "PENDING,RUNNING,SUCCESS,FAILED,ROLLBACK")
    private String status;

    @ApiModelProperty(value = "重置类型")
    private String resetType;

    @ApiModelProperty(value = "重置模式")
    private String resetMode;

    @ApiModelProperty(value = "开始时间")
    private LocalDateTime startTime;

    @ApiModelProperty(value = "结束时间")
    private LocalDateTime endTime;

    @ApiModelProperty(value = "执行时长（毫秒）")
    private Long duration;

    @ApiModelProperty(value = "是否成功")
    private Boolean success;

    @ApiModelProperty(value = "错误信息")
    private String errorMessage;

    @ApiModelProperty(value = "错误代码")
    private String errorCode;

    @ApiModelProperty(value = "备份信息（如果执行了备份）")
    private BackupInfo backupInfo;

    @ApiModelProperty(value = "重置详情")
    private List<ResetDetail> resetDetails;

    @ApiModelProperty(value = "重置统计")
    private ResetStatistics statistics;

    @ApiModelProperty(value = "操作日志ID列表")
    private List<Long> logIds;

    @ApiModelProperty(value = "警告信息")
    private List<String> warnings;

    @ApiModelProperty(value = "建议操作")
    private List<String> suggestions;

    @ApiModelProperty(value = "回滚信息")
    private RollbackInfo rollbackInfo;

    /**
     * 备份信息内部类
     */
    @Data
    @ApiModel(value = "备份信息", description = "重置前的备份信息")
    public static class BackupInfo {

        @ApiModelProperty(value = "是否已备份")
        private Boolean backedUp;

        @ApiModelProperty(value = "备份ID")
        private Long backupId;

        @ApiModelProperty(value = "备份编号")
        private String backupNo;

        @ApiModelProperty(value = "备份文件路径")
        private String backupPath;

        @ApiModelProperty(value = "备份文件名")
        private String backupFileName;

        @ApiModelProperty(value = "备份大小")
        private Long backupSize;

        @ApiModelProperty(value = "备份时间")
        private LocalDateTime backupTime;

        @ApiModelProperty(value = "备份状态")
        private String backupStatus;
    }

    /**
     * 重置详情内部类
     */
    @Data
    @ApiModel(value = "重置详情", description = "数据重置详细信息")
    public static class ResetDetail {

        @ApiModelProperty(value = "对象类型")
        private String objectType;

        @ApiModelProperty(value = "对象名称")
        private String objectName;

        @ApiModelProperty(value = "重置状态")
        private String status;

        @ApiModelProperty(value = "重置前记录数")
        private Long beforeCount;

        @ApiModelProperty(value = "重置后记录数")
        private Long afterCount;

        @ApiModelProperty(value = "重置记录数")
        private Long resetCount;

        @ApiModelProperty(value = "保留记录数")
        private Long preservedCount;

        @ApiModelProperty(value = "开始时间")
        private LocalDateTime startTime;

        @ApiModelProperty(value = "结束时间")
        private LocalDateTime endTime;

        @ApiModelProperty(value = "执行时长")
        private Long duration;

        @ApiModelProperty(value = "重置条件")
        private String resetCondition;

        @ApiModelProperty(value = "错误信息")
        private String errorMessage;

        @ApiModelProperty(value = "详细信息")
        private Map<String, Object> details;
    }

    /**
     * 重置统计内部类
     */
    @Data
    @ApiModel(value = "重置统计", description = "数据重置统计信息")
    public static class ResetStatistics {

        @ApiModelProperty(value = "总对象数")
        private Integer totalObjects;

        @ApiModelProperty(value = "成功重置数")
        private Integer successCount;

        @ApiModelProperty(value = "失败重置数")
        private Integer failedCount;

        @ApiModelProperty(value = "跳过重置数")
        private Integer skippedCount;

        @ApiModelProperty(value = "重置模块数")
        private Integer resetModules;

        @ApiModelProperty(value = "重置表数")
        private Integer resetTables;

        @ApiModelProperty(value = "重置前总记录数")
        private Long totalRecordsBefore;

        @ApiModelProperty(value = "重置后总记录数")
        private Long totalRecordsAfter;

        @ApiModelProperty(value = "重置记录总数")
        private Long totalResetRecords;

        @ApiModelProperty(value = "保留记录总数")
        private Long totalPreservedRecords;

        @ApiModelProperty(value = "释放存储空间（字节）")
        private Long releasedStorage;

        @ApiModelProperty(value = "平均重置速度（记录/秒）")
        private Double resetSpeed;

        @ApiModelProperty(value = "数据完成度")
        private Double completionPercentage;
    }

    /**
     * 回滚信息内部类
     */
    @Data
    @ApiModel(value = "回滚信息", description = "数据重置回滚信息")
    public static class RollbackInfo {

        @ApiModelProperty(value = "是否支持回滚")
        private Boolean rollbackSupported;

        @ApiModelProperty(value = "回滚状态")
        private String rollbackStatus;

        @ApiModelProperty(value = "回滚备份ID")
        private Long rollbackBackupId;

        @ApiModelProperty(value = "回滚开始时间")
        private LocalDateTime rollbackStartTime;

        @ApiModelProperty(value = "回滚结束时间")
        private LocalDateTime rollbackEndTime;

        @ApiModelProperty(value = "回滚时长")
        private Long rollbackDuration;

        @ApiModelProperty(value = "回滚进度")
        private Double rollbackProgress;

        @ApiModelProperty(value = "回滚错误信息")
        private String rollbackErrorMessage;

        @ApiModelProperty(value = "回滚操作日志")
        private List<String> rollbackLogs;
    }
}