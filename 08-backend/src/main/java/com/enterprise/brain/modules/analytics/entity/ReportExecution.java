package com.enterprise.brain.modules.analytics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

/**
 * 报表执行历史实体类
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("report_execution")
public class ReportExecution {

    private static final long serialVersionUID = 1L;

    /**
     * ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 报表ID
     */
    @TableField("report_id")
    private Long reportId;

    /**
     * 执行时间
     */
    @TableField("execution_time")
    private LocalDateTime executionTime;

    /**
     * 执行耗时(毫秒)
     */
    @TableField("execution_duration")
    private Integer executionDuration;

    /**
     * 结果行数
     */
    @TableField("result_rows")
    private Integer resultRows;

    /**
     * 执行状态(1-成功 2-失败 3-超时)
     */
    @TableField("execution_status")
    private Integer executionStatus;

    /**
     * 错误信息
     */
    @TableField("error_message")
    private String errorMessage;

    /**
     * 执行人
     */
    @TableField("executed_by")
    private Long executedBy;
}
