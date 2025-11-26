package com.enterprise.brain.modules.smart-table.service;

import com.enterprise.brain.modules.smart-table.dto.request.ColumnConfigRequest;
import com.enterprise.brain.modules.smart-table.dto.response.ColumnConfigResponse;
import com.enterprise.brain.modules.smart-table.entity.TableColumn;

import java.util.List;

public interface TableColumnService {
    
    TableColumn createColumn(Long tableId, ColumnConfigRequest request);
    
    TableColumn getColumnById(Long columnId);
    
    List<TableColumn> getColumnsByTableId(Long tableId);
    
    List<ColumnConfigResponse> getColumnConfigs(Long tableId);
    
    TableColumn updateColumn(Long columnId, ColumnConfigRequest request);
    
    void deleteColumn(Long columnId);
    
    void updateColumnOrder(Long tableId, List<Long> columnIds);
    
    List<TableColumn> getFormulaColumns(Long tableId);
}