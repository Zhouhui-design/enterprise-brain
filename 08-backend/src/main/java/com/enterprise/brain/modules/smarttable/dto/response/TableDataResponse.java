package com.enterprise.brain.modules.smarttable.dto.response;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class TableDataResponse {
    private Long tableId;
    private String tableName;
    private List<ColumnConfigResponse> columns;
    private List<Map<String, Object>> rows;
    private Long totalRows;
}