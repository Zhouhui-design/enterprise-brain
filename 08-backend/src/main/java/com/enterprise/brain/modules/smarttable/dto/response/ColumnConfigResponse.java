package com.enterprise.brain.modules.smarttable.dto.response;

import lombok.Data;

@Data
public class ColumnConfigResponse {
    private Long id;
    private String columnName;
    private String columnType;
    private Integer columnIndex;
    private Boolean isFormulaColumn;
    private String formulaExpression;
    private String columnConfig;
    private Boolean isVisible;
}