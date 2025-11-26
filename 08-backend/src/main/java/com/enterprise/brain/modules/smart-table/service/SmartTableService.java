package com.enterprise.brain.modules.smart-table.service;

import com.enterprise.brain.modules.smart-table.dto.request.TableCreateRequest;
import com.enterprise.brain.modules.smart-table.dto.response.TableDataResponse;
import com.enterprise.brain.modules.smart-table.entity.SmartTable;

import java.util.List;
import java.util.Map;

public interface SmartTableService {
    
    SmartTable createTable(TableCreateRequest request);
    
    SmartTable getTableById(Long tableId);
    
    List<SmartTable> getAllTables();
    
    List<SmartTable> getTablesByUserId(Long userId);
    
    SmartTable updateTable(Long tableId, TableCreateRequest request);
    
    void deleteTable(Long tableId);
    
    TableDataResponse getTableData(Long tableId, Integer page, Integer pageSize);
    
    Map<String, Object> copyTableData(Long sourceTableId, Long targetTableId);
    
    List<SmartTable> searchTables(String keyword);
}