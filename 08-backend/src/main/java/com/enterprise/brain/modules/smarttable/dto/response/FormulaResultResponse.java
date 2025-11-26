package com.enterprise.brain.modules.smarttable.dto.response;

import lombok.Data;

@Data
public class FormulaResultResponse {
    private String result;
    private Boolean success;
    private String errorMessage;
    private Long calculationId;
}