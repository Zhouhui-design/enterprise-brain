package com.enterprise.brain.modules.smart-table.dto.request;

import lombok.Data;
import java.util.Map;

@Data
public class FormulaCalculateRequest {
    private Long tableId;
    private String formulaExpression;
    private Map<String, String> cellValues;
}