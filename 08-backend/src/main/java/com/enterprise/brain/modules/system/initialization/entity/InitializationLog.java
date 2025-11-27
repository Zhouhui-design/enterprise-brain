package com.enterprise.brain.modules.system.initialization.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

/**
 * 系统初始化日志实体类
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("sys_initialization_log")
public class InitializationLog {

    private static final long serialVersionUID = 1L;

    /**
     * 日志ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 初始化批次号
     */
    @TableField("batch_no")
    private String batchNo;

    /**
     * 初始化类型：FULL-完全初始化，PARTIAL-部分初始化，REPAIR-修复初始化
     */
    @TableField("init_type")
    private String initType;

    /**
     * 步骤名称
     */
    @TableField("step_name")
    private String stepName;

    /**
     * 步骤序号
     */
    @TableField("step_order")
    private Integer stepOrder;

    /**
     * 操作状态：PENDING-待执行，RUNNING-执行中，SUCCESS-成功，FAILED-失败，SKIPPED-跳过
     */
    @TableField("status")
    private String status;

    /**
     * 开始时间
     */
    @TableField("start_time")
    private LocalDateTime startTime;

    /**
     * 结束时间
     */
    @TableField("end_time")
    private LocalDateTime endTime;

    /**
     * 执行时长（毫秒）
     */
    @TableField("duration")
    private Long duration;

    /**
     * 操作者ID
     */
    @TableField("operator_id")
    private Long operatorId;

    /**
     * 操作者姓名
     */
    @TableField("operator_name")
    private String operatorName;

    /**
     * 操作结果详情
     */
    @TableField("result_detail")
    private String resultDetail;

    /**
     * 错误信息
     */
    @TableField("error_message")
    private String errorMessage;

    /**
     * 处理记录数
     */
    @TableField("processed_count")
    private Integer processedCount;

    /**
     * 总记录数
     */
    @TableField("total_count")
    private Integer totalCount;

    /**
     * 客户端IP
     */
    @TableField("client_ip")
    private String clientIp;

    /**
     * 用户代理
     */
    @TableField("user_agent")
    private String userAgent;

    /**
     * 创建时间
     */
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 备注
     */
    @TableField("remark")
    private String remark;

    /**
     * 逻辑删除：0-未删除，1-已删除
     */
    @TableLogic
    @TableField("deleted")
    private Integer deleted;
}