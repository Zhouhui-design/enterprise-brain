package com.enterprise.brain.modules.analytics.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.io.Serializable;

/**
 * 报表定义DTO
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
public class ReportDefinitionDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 报表ID
     */
    private Long id;

    /**
     * 报表名称
     */
    @NotBlank(message = "报表名称不能为空")
    private String reportName;

    /**
     * 报表编码
     */
    @NotBlank(message = "报表编码不能为空")
    private String reportCode;

    /**
     * 报表类型(table,chart,dashboard)
     */
    @NotBlank(message = "报表类型不能为空")
    private String reportType;

    /**
     * 数据源
     */
    private String dataSource;

    /**
     * 查询SQL
     */
    private String querySql;

    /**
     * 报表配置(JSON)
     */
    private String reportConfig;

    /**
     * 图表配置(JSON)
     */
    private String chartConfig;

    /**
     * 筛选配置(JSON)
     */
    private String filterConfig;

    /**
     * 是否公开
     */
    private Integer isPublic;

    /**
     * 刷新间隔(分钟)
     */
    private Integer refreshInterval;
}
