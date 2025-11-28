package com.enterprise.brain.modules.system.initialization.dto.request;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

/**
 * 数据重置请求DTO
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
@ApiModel(value = "数据重置请求", description = "数据重置请求参数")
public class DataResetRequest {

    @ApiModelProperty(value = "重置类型", required = true, allowableValues = "FULL,MODULE,TABLE,CUSTOM")
    @NotBlank(message = "重置类型不能为空")
    private String resetType;

    @ApiModelProperty(value = "重置模式", required = true, allowableValues = "TRUNCATE,DELETE,SOFT_DELETE")
    @NotBlank(message = "重置模式不能为空")
    private String resetMode;

    @ApiModelProperty(value = "目标模块列表")
    private List<String> targetModules;

    @ApiModelProperty(value = "目标表列表")
    private List<String> targetTables;

    @ApiModelProperty(value = "重置条件（SQL WHERE条件）")
    private String resetCondition;

    @ApiModelProperty(value = "是否备份原数据")
    @NotNull(message = "是否备份原数据标识不能为空")
    private Boolean backupBeforeReset;

    @ApiModelProperty(value = "备份配置")
    private BackupConfig backupConfig;

    @ApiModelProperty(value = "是否确认操作")
    @NotNull(message = "确认操作标识不能为空")
    private Boolean confirmed;

    @ApiModelProperty(value = "确认密码（敏感操作需要）")
    private String confirmPassword;

    @ApiModelProperty(value = "操作原因")
    private String reason;

    @ApiModelProperty(value = "自定义重置配置")
    private Map<String, Object> customConfig;

    @ApiModelProperty(value = "是否跳过外键约束检查")
    @NotNull(message = "跳过外键约束检查标识不能为空")
    private Boolean skipForeignKeyCheck;

    @ApiModelProperty(value = "是否重置自增序列")
    @NotNull(message = "重置自增序列标识不能为空")
    private Boolean resetSequence;

    @ApiModelProperty(value = "保留数据配置")
    private PreserveConfig preserveConfig;

    /**
     * 备份配置内部类
     */
    @Data
    @ApiModel(value = "备份配置", description = "重置前数据备份配置")
    public static class BackupConfig {

        @ApiModelProperty(value = "是否启用备份")
        private Boolean enabled;

        @ApiModelProperty(value = "备份类型")
        private String backupType;

        @ApiModelProperty(value = "备份路径")
        private String backupPath;

        @ApiModelProperty(value = "备份名称")
        private String backupName;

        @ApiModelProperty(value = "压缩方式")
        private String compressionType;

        @ApiModelProperty(value = "保留天数")
        private Integer retentionDays;
    }

    /**
     * 保留数据配置内部类
     */
    @Data
    @ApiModel(value = "保留数据配置", description = "重置时需要保留的数据配置")
    public static class PreserveConfig {

        @ApiModelProperty(value = "保留的用户ID列表")
        private List<Long> preserveUserIds;

        @ApiModelProperty(value = "保留的部门ID列表")
        private List<Long> preserveDeptIds;

        @ApiModelProperty(value = "保留的配置键列表")
        private List<String> preserveConfigKeys;

        @ApiModelProperty(value = "保留的系统表列表")
        private List<String> preserveSystemTables;

        @ApiModelProperty(value = "保留条件（SQL WHERE条件）")
        private String preserveCondition;
    }
}