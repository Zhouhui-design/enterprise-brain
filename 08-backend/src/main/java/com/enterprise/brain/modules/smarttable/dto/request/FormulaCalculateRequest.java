package com.enterprise.brain.modules.smarttable.dto.request;

import lombok.Data;
import java.util.Map;

@Data
public class FormulaCalculateRequest {
    private Long tableId;
    private String formulaExpression;
    private Map<String, String> cellValues;
    private String formulaName;
    private String formulaDescription;
    private String formulaType;
}