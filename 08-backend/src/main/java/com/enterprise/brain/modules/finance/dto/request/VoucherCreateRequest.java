package com.enterprise.brain.modules.finance.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 凭证创建请求DTO
 * 
 * @author Enterprise Brain
 */
@Data
@Schema(description = "凭证创建请求DTO")
public class VoucherCreateRequest {

    @Schema(description = "凭证编号", required = true)
    @NotBlank(message = "凭证编号不能为空")
    private String voucherNumber;

    @Schema(description = "凭证日期", required = true)
    @NotNull(message = "凭证日期不能为空")
    private LocalDateTime voucherDate;

    @Schema(description = "凭证类型")
    private String voucherType;

    @Schema(description = "摘要")
    private String summary;

    @Schema(description = "附件数量")
    private Integer attachmentCount;

    @Schema(description = "凭证明细列表")
    private List<VoucherItemRequest> items;

    /**
     * 凭证明细请求DTO
     */
    @Data
    @Schema(description = "凭证明细请求DTO")
    public static class VoucherItemRequest {

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