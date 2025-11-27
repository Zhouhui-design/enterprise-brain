package com.enterprise.brain.modules.system.initialization.dto.response;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 数据备份响应DTO
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
@ApiModel(value = "数据备份响应", description = "数据备份结果")
public class BackupResponse {

    @ApiModelProperty(value = "备份ID")
    private Long backupId;

    @ApiModelProperty(value = "备份编号")
    private String backupNo;

    @ApiModelProperty(value = "备份状态", allowableValues = "PENDING,RUNNING,SUCCESS,FAILED,CANCELLED")
    private String status;

    @ApiModelProperty(value = "备份类型")
    private String backupType;

    @ApiModelProperty(value = "备份模式")
    private String backupMode;

    @ApiModelProperty(value = "备份范围")
    private String backupScope;

    @ApiModelProperty(value = "开始时间")
    private LocalDateTime startTime;

    @ApiModelProperty(value = "结束时间")
    private LocalDateTime endTime;

    @ApiModelProperty(value = "执行时长（毫秒）")
    private Long duration;

    @ApiModelProperty(value = "是否成功")
    private Boolean success;

    @ApiModelProperty(value = "备份文件路径")
    private String filePath;

    @ApiModelProperty(value = "备份文件名")
    private String fileName;

    @ApiModelProperty(value = "文件大小（字节）")
    private Long fileSize;

    @ApiModelProperty(value = "压缩后大小（字节）")
    private Long compressedSize;

    @ApiModelProperty(value = "压缩率")
    private Double compressionRatio;

    @ApiModelProperty(value = "文件MD5校验值")
    private String fileMd5;

    @ApiModelProperty(value = "错误信息")
    private String errorMessage;

    @ApiModelProperty(value = "错误代码")
    private String errorCode;

    @ApiModelProperty(value = "备份详情")
    private BackupDetail backupDetail;

    @ApiModelProperty(value = "备份统计")
    private BackupStatistics statistics;

    @ApiModelProperty(value = "操作日志ID列表")
    private List<Long> logIds;

    @ApiModelProperty(value = "警告信息")
    private List<String> warnings;

    @ApiModelProperty(value = "建议操作")
    private List<String> suggestions;

    /**
     * 备份详情内部类
     */
    @Data
    @ApiModel(value = "备份详情", description = "数据备份详细信息")
    public static class BackupDetail {

        @ApiModelProperty(value = "包含的模块列表")
        private List<String> modules;

        @ApiModelProperty(value = "包含的表列表")
        private List<TableInfo> tables;

        @ApiModelProperty(value = "排除的模块列表")
        private List<String> excludeModules;

        @ApiModelProperty(value = "排除的表列表")
        private List<String> excludeTables;

        @ApiModelProperty(value = "数据过滤条件")
        private Map<String, String> dataFilters;

        @ApiModelProperty(value = "压缩方式")
        private String compressionType;

        @ApiModelProperty(value = "存储配置")
        private StorageInfo storageInfo;

        @ApiModelProperty(value = "备份配置")
        private Map<String, Object> backupConfig;
    }

    /**
     * 表信息内部类
     */
    @Data
    @ApiModel(value = "表信息", description = "备份表的详细信息")
    public static class TableInfo {

        @ApiModelProperty(value = "表名")
        private String tableName;

        @ApiModelProperty(value = "表描述")
        private String tableComment;

        @ApiModelProperty(value = "记录数")
        private Long recordCount;

        @ApiModelProperty(value = "数据大小（字节）")
        private Long dataSize;

        @ApiModelProperty(value = "索引大小（字节）")
        private Long indexSize;

        @ApiModelProperty(value = "总大小（字节）")
        private Long totalSize;

        @ApiModelProperty(value = "备份时间")
        private LocalDateTime backupTime;

        @ApiModelProperty(value = "过滤条件")
        private String filterCondition;
    }

    /**
     * 存储信息内部类
     */
    @Data
    @ApiModel(value = "存储信息", description = "备份文件存储信息")
    public static class StorageInfo {

        @ApiModelProperty(value = "存储类型")
        private String storageType;

        @ApiModelProperty(value = "存储路径")
        private String storagePath;

        @ApiModelProperty(value = "存储桶名称")
        private String bucketName;

        @ApiModelProperty(value = "存储区域")
        private String region;

        @ApiModelProperty(value = "访问URL")
        private String accessUrl;

        @ApiModelProperty(value = "下载链接")
        private String downloadUrl;

        @ApiModelProperty(value = "过期时间")
        private LocalDateTime expireTime;
    }

    /**
     * 备份统计内部类
     */
    @Data
    @ApiModel(value = "备份统计", description = "数据备份统计信息")
    public static class BackupStatistics {

        @ApiModelProperty(value = "总模块数")
        private Integer totalModules;

        @ApiModelProperty(value = "总表数")
        private Integer totalTables;

        @ApiModelProperty(value = "总记录数")
        private Long totalRecords;

        @ApiModelProperty(value = "成功备份数")
        private Integer successCount;

        @ApiModelProperty(value = "失败备份数")
        private Integer failedCount;

        @ApiModelProperty(value = "跳过备份数")
        private Integer skippedCount;

        @ApiModelProperty(value = "原始数据大小（字节）")
        private Long originalSize;

        @ApiModelProperty(value = "压缩后大小（字节）")
        private Long compressedSize;

        @ApiModelProperty(value = "压缩率")
        private Double compressionRatio;

        @ApiModelProperty(value = "平均备份速度（MB/s）")
        private Double backupSpeed;

        @ApiModelProperty(value = "数据完整性校验结果")
        private Boolean integrityPassed;

        @ApiModelProperty(value = "备份完成度")
        private Double completionPercentage;
    }
}