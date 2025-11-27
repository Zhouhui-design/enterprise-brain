package com.enterprise.brain.modules.system.initialization.dto.request;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

/**
 * 数据备份请求DTO
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
@ApiModel(value = "数据备份请求", description = "数据备份请求参数")
public class BackupRequest {

    @ApiModelProperty(value = "备份类型", required = true, allowableValues = "FULL,INCREMENTAL,DIFFERENTIAL")
    @NotBlank(message = "备份类型不能为空")
    private String backupType;

    @ApiModelProperty(value = "备份模式", required = true, allowableValues = "MANUAL,AUTO,SCHEDULED")
    @NotBlank(message = "备份模式不能为空")
    private String backupMode;

    @ApiModelProperty(value = "备份范围", required = true, allowableValues = "ALL,BUSINESS,SYSTEM,CUSTOM")
    @NotBlank(message = "备份范围不能为空")
    private String backupScope;

    @ApiModelProperty(value = "备份名称")
    private String backupName;

    @ApiModelProperty(value = "备份描述")
    private String description;

    @ApiModelProperty(value = "模块列表")
    private List<String> modules;

    @ApiModelProperty(value = "表列表")
    private List<String> tables;

    @ApiModelProperty(value = "排除的模块列表")
    private List<String> excludeModules;

    @ApiModelProperty(value = "排除的表列表")
    private List<String> excludeTables;

    @ApiModelProperty(value = "数据过滤条件")
    private Map<String, String> dataFilters;

    @ApiModelProperty(value = "压缩配置")
    private CompressionConfig compressionConfig;

    @ApiModelProperty(value = "存储配置")
    private StorageConfig storageConfig;

    @ApiModelProperty(value = "是否验证备份文件完整性")
    @NotNull(message = "验证备份文件完整性标识不能为空")
    private Boolean verifyIntegrity;

    @ApiModelProperty(value = "是否立即执行")
    @NotNull(message = "立即执行标识不能为空")
    private Boolean executeImmediately;

    @ApiModelProperty(value = "计划执行时间")
    private String scheduledTime;

    @ApiModelProperty(value = "重复策略")
    private RepeatStrategy repeatStrategy;

    @ApiModelProperty(value = "通知配置")
    private NotificationConfig notificationConfig;

    /**
     * 压缩配置内部类
     */
    @Data
    @ApiModel(value = "压缩配置", description = "数据备份压缩配置")
    public static class CompressionConfig {

        @ApiModelProperty(value = "是否启用压缩")
        @NotNull(message = "启用压缩标识不能为空")
        private Boolean enabled;

        @ApiModelProperty(value = "压缩方式", allowableValues = "NONE,ZIP,GZIP,7Z")
        private String compressionType;

        @ApiModelProperty(value = "压缩级别（1-9）")
        private Integer compressionLevel;

        @ApiModelProperty(value = "分卷大小（MB）")
        private Long volumeSize;
    }

    /**
     * 存储配置内部类
     */
    @Data
    @ApiModel(value = "存储配置", description = "数据备份存储配置")
    public static class StorageConfig {

        @ApiModelProperty(value = "存储类型", allowableValues = "LOCAL,FTP,S3,OSS,COS")
        private String storageType;

        @ApiModelProperty(value = "存储路径")
        private String storagePath;

        @ApiModelProperty(value = "访问密钥")
        private String accessKey;

        @ApiModelProperty(value = "密钥")
        private String secretKey;

        @ApiModelProperty(value = "端点URL")
        private String endpointUrl;

        @ApiModelProperty(value = "存储桶名称")
        private String bucketName;

        @ApiModelProperty(value = "存储区域")
        private String region;

        @ApiModelProperty(value = "连接参数")
        private Map<String, Object> connectionParams;
    }

    /**
     * 重复策略内部类
     */
    @Data
    @ApiModel(value = "重复策略", description = "定时备份重复策略")
    public static class RepeatStrategy {

        @ApiModelProperty(value = "重复类型", allowableValues = "ONCE,DAILY,WEEKLY,MONTHLY,CUSTOM")
        private String repeatType;

        @ApiModelProperty(value = "重复间隔")
        private Integer interval;

        @ApiModelProperty(value = "Cron表达式")
        private String cronExpression;

        @ApiModelProperty(value = "执行时间（HH:mm:ss）")
        private String executeTime;

        @ApiModelProperty(value = "星期几（1-7）")
        private List<Integer> daysOfWeek;

        @ApiModelProperty(value = "月份中的第几天")
        private List<Integer> daysOfMonth;
    }

    /**
     * 通知配置内部类
     */
    @Data
    @ApiModel(value = "通知配置", description = "备份完成通知配置")
    public static class NotificationConfig {

        @ApiModelProperty(value = "是否启用通知")
        private Boolean enabled;

        @ApiModelProperty(value = "通知类型", allowableValues = "EMAIL,SMS,WEBHOOK,SYSTEM")
        private List<String> notificationTypes;

        @ApiModelProperty(value = "通知对象")
        private List<String> recipients;

        @ApiModelProperty(value = "成功时是否通知")
        private Boolean notifyOnSuccess;

        @ApiModelProperty(value = "失败时是否通知")
        private Boolean notifyOnFailure;

        @ApiModelProperty(value = "自定义通知内容")
        private String customMessage;

        @ApiModelProperty(value = "Webhook URL")
        private String webhookUrl;
    }
}