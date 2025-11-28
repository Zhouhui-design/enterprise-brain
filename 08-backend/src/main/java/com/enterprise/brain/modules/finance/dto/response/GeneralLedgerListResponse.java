package com.enterprise.brain.modules.finance.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 总账列表响应DTO
 * 
 * @author Enterprise Brain
 */
@Data
@Schema(description = "总账列表响应DTO")
public class GeneralLedgerListResponse {

    @Schema(description = "总账记录列表")
    private List<GeneralLedgerResponse> records;

    @Schema(description = "总记录数")
    private Long total;

    @Schema(description = "当前页码")
    private Integer current;

    @Schema(description = "每页记录数")
    private Integer size;
}