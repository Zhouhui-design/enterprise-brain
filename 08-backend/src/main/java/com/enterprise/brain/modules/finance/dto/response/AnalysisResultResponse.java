package com.enterprise.brain.modules.finance.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 分析结果响应DTO
 * 
 * @author Enterprise Brain
 */
@Data
@Schema(description = "分析结果响应DTO")
public class AnalysisResultResponse {

    @Schema(description = "分析类型")
    private String analysisType;

    @Schema(description = "分析名称")
    private String analysisName;

    @Schema(description = "分析期间")
    private String analysisPeriod;

    @Schema(description = "分析结果数据")
    private List<AnalysisItem> items;

    @Schema(description = "分析时间")
    private LocalDateTime analysisTime;

    /**
     * 分析项
     */
    @Data
    @Schema(description = "分析项")
    public static class AnalysisItem {

        @Schema(description = "项目名称")
        private String itemName;

        @Schema(description = "数值")
        private BigDecimal value;

        @Schema(description = "比率")
        private BigDecimal ratio;

        @Schema(description = "趋势")
        private String trend;

        @Schema(description = "分析说明")
        private String description;
    }
}