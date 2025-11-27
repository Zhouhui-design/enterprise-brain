package com.enterprise.brain.modules.system.initialization.dto.response;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 系统初始化响应DTO
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
@ApiModel(value = "系统初始化响应", description = "系统初始化结果")
public class InitializeResponse {

    @ApiModelProperty(value = "初始化批次号")
    private String batchNo;

    @ApiModelProperty(value = "初始化状态", allowableValues = "PENDING,RUNNING,SUCCESS,FAILED,ROLLBACK")
    private String status;

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

    @ApiModelProperty(value = "初始化步骤结果")
    private List<StepResult> stepResults;

    @ApiModelProperty(value = "初始化统计信息")
    private InitializeStatistics statistics;

    @ApiModelProperty(value = "系统信息")
    private SystemInfo systemInfo;

    @ApiModelProperty(value = "管理员信息")
    private AdminInfo adminInfo;

    @ApiModelProperty(value = "配置信息")
    private List<ConfigInfo> configInfos;

    @ApiModelProperty(value = "警告信息")
    private List<String> warnings;

    @ApiModelProperty(value = "操作日志ID列表")
    private List<Long> logIds;

    @ApiModelProperty(value = "建议操作")
    private List<String> suggestions;

    /**
     * 步骤结果内部类
     */
    @Data
    @ApiModel(value = "初始化步骤结果", description = "单个初始化步骤的执行结果")
    public static class StepResult {

        @ApiModelProperty(value = "步骤名称")
        private String stepName;

        @ApiModelProperty(value = "步骤序号")
        private Integer stepOrder;

        @ApiModelProperty(value = "步骤状态")
        private String status;

        @ApiModelProperty(value = "开始时间")
        private LocalDateTime startTime;

        @ApiModelProperty(value = "结束时间")
        private LocalDateTime endTime;

        @ApiModelProperty(value = "执行时长")
        private Long duration;

        @ApiModelProperty(value = "是否成功")
        private Boolean success;

        @ApiModelProperty(value = "处理数量")
        private Integer processedCount;

        @ApiModelProperty(value = "总数量")
        private Integer totalCount;

        @ApiModelProperty(value = "结果详情")
        private String detail;

        @ApiModelProperty(value = "错误信息")
        private String errorMessage;
    }

    /**
     * 初始化统计信息内部类
     */
    @Data
    @ApiModel(value = "初始化统计信息", description = "系统初始化统计数据")
    public static class InitializeStatistics {

        @ApiModelProperty(value = "总步骤数")
        private Integer totalSteps;

        @ApiModelProperty(value = "成功步骤数")
        private Integer successSteps;

        @ApiModelProperty(value = "失败步骤数")
        private Integer failedSteps;

        @ApiModelProperty(value = "跳过步骤数")
        private Integer skippedSteps;

        @ApiModelProperty(value = "创建的用户数")
        private Integer createdUsers;

        @ApiModelProperty(value = "创建的角色数")
        private Integer createdRoles;

        @ApiModelProperty(value = "创建的权限数")
        private Integer createdPermissions;

        @ApiModelProperty(value = "创建的菜单数")
        private Integer createdMenus;

        @ApiModelProperty(value = "创建的字典数")
        private Integer createdDictionaries;

        @ApiModelProperty(value = "创建的配置数")
        private Integer createdConfigs;

        @ApiModelProperty(value = "初始化的模块数")
        private Integer initializedModules;
    }

    /**
     * 系统信息内部类
     */
    @Data
    @ApiModel(value = "系统信息", description = "初始化后的系统信息")
    public static class SystemInfo {

        @ApiModelProperty(value = "系统ID")
        private String systemId;

        @ApiModelProperty(value = "系统名称")
        private String systemName;

        @ApiModelProperty(value = "系统版本")
        private String systemVersion;

        @ApiModelProperty(value = "系统编码")
        private String systemCode;

        @ApiModelProperty(value = "环境类型")
        private String environment;

        @ApiModelProperty(value = "数据库版本")
        private String databaseVersion;

        @ApiModelProperty(value = "初始化时间")
        private LocalDateTime initializeTime;

        @ApiModelProperty(value = "系统状态")
        private String systemStatus;

        @ApiModelProperty(value = "管理员URL")
        private String adminUrl;

        @ApiModelProperty(value = "API文档URL")
        private String apiDocUrl;
    }

    /**
     * 管理员信息内部类
     */
    @Data
    @ApiModel(value = "管理员信息", description = "初始化的管理员账户信息")
    public static class AdminInfo {

        @ApiModelProperty(value = "管理员ID")
        private Long adminId;

        @ApiModelProperty(value = "用户名")
        private String username;

        @ApiModelProperty(value = "真实姓名")
        private String realName;

        @ApiModelProperty(value = "邮箱")
        private String email;

        @ApiModelProperty(value = "手机号")
        private String phone;

        @ApiModelProperty(value = "部门")
        private String department;

        @ApiModelProperty(value = "角色列表")
        private List<String> roles;

        @ApiModelProperty(value = "权限列表")
        private List<String> permissions;

        @ApiModelProperty(value = "创建时间")
        private LocalDateTime createTime;
    }

    /**
     * 配置信息内部类
     */
    @Data
    @ApiModel(value = "配置信息", description = "初始化的系统配置信息")
    public static class ConfigInfo {

        @ApiModelProperty(value = "配置键")
        private String configKey;

        @ApiModelProperty(value = "配置名称")
        private String configName;

        @ApiModelProperty(value = "配置值")
        private String configValue;

        @ApiModelProperty(value = "配置类型")
        private String configType;

        @ApiModelProperty(value = "是否系统内置")
        private Boolean isSystem;

        @ApiModelProperty(value = "描述")
        private String description;
    }
}