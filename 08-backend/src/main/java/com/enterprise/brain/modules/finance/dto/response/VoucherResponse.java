package com.enterprise.brain.modules.finance.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 凭证响应DTO
 * 
 * @author Enterprise Brain
 */
@Data
@Schema(description = "凭证响应DTO")
public class VoucherResponse {

    @Schema(description = "主键ID")
    private Long id;

    @Schema(description = "凭证编号")
    private String voucherNumber;

    @Schema(description = "凭证日期")
    private LocalDateTime voucherDate;

    @Schema(description = "凭证类型")
    private String voucherType;

    @Schema(description = "摘要")
    private String summary;

    @Schema(description = "附件数量")
    private Integer attachmentCount;

    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @Schema(description = "更新时间")
    private LocalDateTime updateTime;

    @Schema(description = "凭证明细列表")
    private List<VoucherItemResponse> items;

    /**
     * 凭证明细响应DTO
     */
    @Data
    @Schema(description = "凭证明细响应DTO")
    public static class VoucherItemResponse {

        @Schema(description = "主键ID")
        private Long id;

        @Schema(description = "会计科目代码")
        private String accountCode;

        @Schema(description = "会计科目名称")
        private String accountName;

        @Schema(description = "借方金额")
        private BigDecimal debitAmount;

        @Schema(description = "贷方金额")
        private BigDecimal creditAmount;

        @Schema(description = "摘要")
        private String summary;

        @Schema(description = "辅助核算项")
        private String auxiliaryItems;
    }
}