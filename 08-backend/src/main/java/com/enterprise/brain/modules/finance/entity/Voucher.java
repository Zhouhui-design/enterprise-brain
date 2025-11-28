package com.enterprise.brain.modules.finance.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 凭证实体类
 * 
 * @author Enterprise Brain
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("finance_voucher")
@Schema(description = "凭证实体类")
public class Voucher {

    @Schema(description = "主键ID")
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @Schema(description = "凭证编号")
    @TableField("voucher_number")
    private String voucherNumber;

    @Schema(description = "凭证日期")
    @TableField("voucher_date")
    private LocalDateTime voucherDate;

    @Schema(description = "凭证类型")
    @TableField("voucher_type")
    private String voucherType;

    @Schema(description = "摘要")
    @TableField("summary")
    private String summary;

    @Schema(description = "附件数量")
    @TableField("attachment_count")
    private Integer attachmentCount;

    @Schema(description = "制单人")
    @TableField("created_by")
    private String createdBy;

    @Schema(description = "审核人")
    @TableField("approved_by")
    private String approvedBy;

    @Schema(description = "审核状态")
    @TableField("approval_status")
    private String approvalStatus;

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