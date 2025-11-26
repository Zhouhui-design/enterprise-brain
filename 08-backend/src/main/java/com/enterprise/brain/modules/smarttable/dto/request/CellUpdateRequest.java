package com.enterprise.brain.modules.smarttable.dto.request;

import lombok.Data;

@Data
public class CellUpdateRequest {
    private Long tableId;
    private Long rowId;
    private Long columnId;
    private String cellValue;
    private Boolean isCalculated;
}