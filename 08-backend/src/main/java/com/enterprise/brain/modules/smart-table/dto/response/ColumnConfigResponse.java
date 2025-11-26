package com.enterprise.brain.modules.smart-table.dto.response;

import lombok.Data;

@Data
public class ColumnConfigResponse {
    private Long columnId;
    private String columnName;
    private String columnType;
    private Integer columnIndex;
    private Boolean isFormulaColumn;
    private String formulaExpression;
    private String columnConfig;
}