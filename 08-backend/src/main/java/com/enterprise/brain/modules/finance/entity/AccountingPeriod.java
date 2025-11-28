package com.enterprise.brain.modules.finance.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDateTime;

/**
 * 会计期间实体类
 * 
 * @author Enterprise Brain
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("finance_accounting_period")
@Schema(description = "会计期间实体类")
public class AccountingPeriod {

    @Schema(description = "主键ID")
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @Schema(description = "会计期间")
    @TableField("accounting_period")
    private String accountingPeriod;

    @Schema(description = "开始日期")
    @TableField("start_date")
    private LocalDateTime startDate;

    @Schema(description = "结束日期")
    @TableField("end_date")
    private LocalDateTime endDate;

    @Schema(description = "状态(OPEN:开启, CLOSED:关闭)")
    @TableField("status")
    private String status;

    @Schema(description = "创建时间")
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @Schema(description = "更新时间")
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @Schema(description = "删除标识(0:未删除, 1:已删除)")
    @TableField("deleted")
    @TableLogic
    private Integer deleted;
}