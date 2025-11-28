package com.enterprise.brain.modules.finance.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * 财务分析请求DTO
 * 
 * @author Enterprise Brain
 */
@Data
@Schema(description = "财务分析请求DTO")
public class FinancialAnalysisRequest {

    @Schema(description = "分析类型", required = true)
    @NotNull(message = "分析类型不能为空")
    private String analysisType;

    @Schema(description = "开始日期")
    private LocalDateTime startDate;

    @Schema(description = "结束日期")
    private LocalDateTime endDate;

    @Schema(description = "分析维度")
    private String dimension;

    @Schema(description = "对比期间")
    private String comparisonPeriod;
}