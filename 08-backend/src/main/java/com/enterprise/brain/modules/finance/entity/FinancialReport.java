package com.enterprise.brain.modules.finance.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 财务报表实体类
 * 
 * @author Enterprise Brain
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("finance_financial_report")
@Schema(description = "财务报表实体类")
public class FinancialReport {

    @Schema(description = "主键ID")
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @Schema(description = "报表类型")
    @TableField("report_type")
    private String reportType;

    @Schema(description = "报表名称")
    @TableField("report_name")
    private String reportName;

    @Schema(description = "会计期间")
    @TableField("accounting_period")
    private String accountingPeriod;

    @Schema(description = "报表数据(JSON格式)")
    @TableField("report_data")
    private String reportData;

    @Schema(description = "生成状态")
    @TableField("generate_status")
    private String generateStatus;

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