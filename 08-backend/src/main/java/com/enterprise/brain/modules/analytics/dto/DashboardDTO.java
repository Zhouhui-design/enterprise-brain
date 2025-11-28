package com.enterprise.brain.modules.analytics.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.io.Serializable;

/**
 * 仪表板DTO
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
public class DashboardDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 仪表板ID
     */
    private Long id;

    /**
     * 仪表板名称
     */
    @NotBlank(message = "仪表板名称不能为空")
    private String dashboardName;

    /**
     * 仪表板编码
     */
    @NotBlank(message = "仪表板编码不能为空")
    private String dashboardCode;

    /**
     * 仪表板类型
     */
    private String dashboardType;

    /**
     * 布局配置(JSON)
     */
    private String layoutConfig;

    /**
     * 组件配置(JSON)
     */
    private String widgetConfig;

    /**
     * 是否公开
     */
    private Integer isPublic;

    /**
     * 刷新间隔(分钟)
     */
    private Integer refreshInterval;
}
