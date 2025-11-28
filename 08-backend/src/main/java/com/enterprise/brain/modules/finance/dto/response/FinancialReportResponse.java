package com.enterprise.brain.modules.finance.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 财务报表响应DTO
 * 
 * @author Enterprise Brain
 */
@Data
@Schema(description = "财务报表响应DTO")
public class FinancialReportResponse {

    @Schema(description = "报表类型")
    private String reportType;

    @Schema(description = "报表名称")
    private String reportName;

    @Schema(description = "会计期间")
    private String accountingPeriod;

    @Schema(description = "报表数据")
    private List<ReportItem> items;

    @Schema(description = "生成时间")
    private LocalDateTime generateTime;

    /**
     * 报表项
     */
    @Data
    @Schema(description = "报表项")
    public static class ReportItem {

        @Schema(description = "项目名称")
        private String itemName;

        @Schema(description = "行次")
        private Integer lineNumber;

        @Schema(description = "本期金额")
        private BigDecimal currentAmount;

        @Schema(description = "累计金额")
        private BigDecimal cumulativeAmount;

        @Schema(description = "上年金额")
        private BigDecimal previousAmount;

        @Schema(description = "项目类型")
        private String itemType;
    }
}