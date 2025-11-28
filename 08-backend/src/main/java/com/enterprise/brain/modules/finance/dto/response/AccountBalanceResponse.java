package com.enterprise.brain.modules.finance.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 账户余额响应DTO
 * 
 * @author Enterprise Brain
 */
@Data
@Schema(description = "账户余额响应DTO")
public class AccountBalanceResponse {

    @Schema(description = "主键ID")
    private Long id;

    @Schema(description = "账户代码")
    private String accountCode;

    @Schema(description = "账户名称")
    private String accountName;

    @Schema(description = "期初余额")
    private BigDecimal openingBalance;

    @Schema(description = "借方累计")
    private BigDecimal debitTotal;

    @Schema(description = "贷方累计")
    private BigDecimal creditTotal;

    @Schema(description = "期末余额")
    private BigDecimal closingBalance;

    @Schema(description = "会计期间")
    private String accountingPeriod;

    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
}