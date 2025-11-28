package com.enterprise.brain.modules.analytics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

/**
 * 仪表板实体类
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("dashboard_definition")
public class Dashboard {

    private static final long serialVersionUID = 1L;

    /**
     * 仪表板ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 仪表板名称
     */
    @TableField("dashboard_name")
    private String dashboardName;

    /**
     * 仪表板编码
     */
    @TableField("dashboard_code")
    private String dashboardCode;

    /**
     * 仪表板类型
     */
    @TableField("dashboard_type")
    private String dashboardType;

    /**
     * 布局配置
     */
    @TableField("layout_config")
    private String layoutConfig;

    /**
     * 组件配置
     */
    @TableField("widget_config")
    private String widgetConfig;

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
