package com.enterprise.brain.modules.analytics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

/**
 * 数据报表实体类
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("report_definition")
public class DataReport {

    private static final long serialVersionUID = 1L;

    /**
     * 报表ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 报表名称
     */
    @TableField("report_name")
    private String reportName;

    /**
     * 报表编码
     */
    @TableField("report_code")
    private String reportCode;

    /**
     * 报表类型(table,chart,dashboard)
     */
    @TableField("report_type")
    private String reportType;

    /**
     * 数据源
     */
    @TableField("data_source")
    private String dataSource;

    /**
     * 查询SQL
     */
    @TableField("query_sql")
    private String querySql;

    /**
     * 报表配置
     */
    @TableField("report_config")
    private String reportConfig;

    /**
     * 图表配置
     */
    @TableField("chart_config")
    private String chartConfig;

    /**
     * 筛选配置
     */
    @TableField("filter_config")
    private String filterConfig;

    /**
     * 是否公开
     */
    @TableField("is_public")
    private Integer isPublic;

    /**
     * 刷新间隔(分钟)
     */
    @TableField("refresh_interval")
    private Integer refreshInterval;

    /**
     * 创建时间
     */
    @TableField(value = "created_time", fill = FieldFill.INSERT)
    private LocalDateTime createdTime;

    /**
     * 更新时间
     */
    @TableField(value = "updated_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedTime;

    /**
     * 创建人
     */
    @TableField("created_by")
    private Long createdBy;

    /**
     * 更新人
     */
    @TableField("updated_by")
    private Long updatedBy;

    /**
     * 逻辑删除
     */
    @TableLogic
    @TableField("deleted")
    private Integer deleted;
}
