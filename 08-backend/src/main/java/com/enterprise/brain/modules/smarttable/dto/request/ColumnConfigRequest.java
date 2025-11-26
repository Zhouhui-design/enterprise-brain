package com.enterprise.brain.modules.smarttable.dto.request;

import lombok.Data;

@Data
public class ColumnConfigRequest {
    private String columnName;
    private String columnType;
    private Integer columnIndex;
    private Boolean isFormulaColumn;
    private String formulaExpression;
    private String columnConfig;
    private Boolean isVisible;
}