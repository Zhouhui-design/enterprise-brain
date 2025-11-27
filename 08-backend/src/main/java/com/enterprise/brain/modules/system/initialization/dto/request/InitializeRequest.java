package com.enterprise.brain.modules.system.initialization.dto.request;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

/**
 * 系统初始化请求DTO
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
@ApiModel(value = "系统初始化请求", description = "系统初始化请求参数")
public class InitializeRequest {

    @ApiModelProperty(value = "初始化类型", required = true, allowableValues = "FULL,PARTIAL,REPAIR")
    @NotBlank(message = "初始化类型不能为空")
    private String initType;

    @ApiModelProperty(value = "初始化模式", required = true, allowableValues = "AUTO,MANUAL,CUSTOM")
    @NotBlank(message = "初始化模式不能为空")
    private String initMode;

    @ApiModelProperty(value = "环境类型", required = true, allowableValues = "DEV,TEST,STAGING,PROD")
    @NotBlank(message = "环境类型不能为空")
    private String environment;

    @ApiModelProperty(value = "是否强制重新初始化")
    @NotNull(message = "强制重新初始化标识不能为空")
    private Boolean forceReinit;

    @ApiModelProperty(value = "是否跳过数据验证")
    @NotNull(message = "跳过数据验证标识不能为空")
    private Boolean skipValidation;

    @ApiModelProperty(value = "是否创建示例数据")
    @NotNull(message = "创建示例数据标识不能为空")
    private Boolean createSampleData;

    @ApiModelProperty(value = "初始化步骤列表")
    private List<String> initSteps;

    @ApiModelProperty(value = "模块列表")
    private List<String> modules;

    @ApiModelProperty(value = "自定义配置参数")
    private Map<String, Object> customConfig;

    @ApiModelProperty(value = "数据库配置")
    private DatabaseConfig databaseConfig;

    @ApiModelProperty(value = "管理员配置")
    private AdminConfig adminConfig;

    @ApiModelProperty(value = "系统配置")
    private SystemConfig systemConfig;

    @ApiModelProperty(value = "初始化描述")
    private String description;

    @ApiModelProperty(value = "批次号（可选，不传则自动生成）")
    private String batchNo;

    /**
     * 数据库配置内部类
     */
    @Data
    @ApiModel(value = "数据库配置", description = "数据库初始化配置")
    public static class DatabaseConfig {

        @ApiModelProperty(value = "是否初始化数据库结构")
        private Boolean initSchema;

        @ApiModelProperty(value = "是否初始化基础数据")
        private Boolean initData;

        @ApiModelProperty(value = "是否清空现有数据")
        private Boolean truncateExisting;

        @ApiModelProperty(value = "数据源配置")
        private Map<String, Object> dataSourceConfig;

        @ApiModelProperty(value = "表空间配置")
        private Map<String, String> tablespaceConfig;
    }

    /**
     * 管理员配置内部类
     */
    @Data
    @ApiModel(value = "管理员配置", description = "系统管理员初始化配置")
    public static class AdminConfig {

        @ApiModelProperty(value = "管理员用户名")
        private String username;

        @ApiModelProperty(value = "管理员密码")
        private String password;

        @ApiModelProperty(value = "管理员邮箱")
        private String email;

        @ApiModelProperty(value = "管理员手机号")
        private String phone;

        @ApiModelProperty(value = "管理员真实姓名")
        private String realName;

        @ApiModelProperty(value = "管理员部门")
        private String department;

        @ApiModelProperty(value = "管理员角色")
        private List<String> roles;
    }

    /**
     * 系统配置内部类
     */
    @Data
    @ApiModel(value = "系统配置", description = "系统参数初始化配置")
    public static class SystemConfig {

        @ApiModelProperty(value = "系统名称")
        private String systemName;

        @ApiModelProperty(value = "系统版本")
        private String systemVersion;

        @ApiModelProperty(value = "系统编码")
        private String systemCode;

        @ApiModelProperty(value = "时区设置")
        private String timezone;

        @ApiModelProperty(value = "语言设置")
        private String language;

        @ApiModelProperty(value = "主题设置")
        private String theme;

        @ApiModelProperty(value = "系统参数配置")
        private Map<String, String> systemParams;
    }
}