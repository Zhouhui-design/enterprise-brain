package com.enterprise.brain.modules.smart-table.service.impl;

import com.enterprise.brain.modules.smart-table.dto.request.ColumnConfigRequest;
import com.enterprise.brain.modules.smart-table.dto.response.ColumnConfigResponse;
import com.enterprise.brain.modules.smart-table.entity.TableColumn;
import com.enterprise.brain.modules.smart-table.repository.TableColumnRepository;
import com.enterprise.brain.modules.smart-table.service.TableColumnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class TableColumnServiceImpl implements TableColumnService {
    
    @Autowired
    private TableColumnRepository tableColumnRepository;
    
    @Override
    @Transactional
    public TableColumn createColumn(Long tableId, ColumnConfigRequest request) {
        TableColumn column = new TableColumn();
        column.setTableId(tableId);
        column.setColumnName(request.getColumnName());
        column.setColumnType(request.getColumnType());
        column.setColumnIndex(request.getColumnIndex());
        column.setIsFormulaColumn(request.getIsFormulaColumn());
        column.setColumnConfig(request.getColumnConfig());
        column.setCreateTime(new Date());
        column.setUpdateTime(new Date());
        column.setIsDeleted(false);
        return tableColumnRepository.save(column);
    }
    
    @Override
    public TableColumn getColumnById(Long columnId) {
        return tableColumnRepository.findById(columnId)
                .orElseThrow(() -> new RuntimeException("Column not found with id: " + columnId));
    }
    
    @Override
    public List<TableColumn> getColumnsByTableId(Long tableId) {
        return tableColumnRepository.findByTableIdAndIsDeletedFalseOrderByColumnIndexAsc(tableId);
    }
    
    @Override
    public List<ColumnConfigResponse> getColumnConfigs(Long tableId) {
        List<TableColumn> columns = getColumnsByTableId(tableId);
        List<ColumnConfigResponse> configs = new ArrayList<>();
        
        for (TableColumn column : columns) {
            ColumnConfigResponse config = new ColumnConfigResponse();
            config.setColumnId(column.getId());
            config.setColumnName(column.getColumnName());
            config.setColumnType(column.getColumnType());
            config.setColumnIndex(column.getColumnIndex());
            config.setIsFormulaColumn(column.getIsFormulaColumn());
            config.setColumnConfig(column.getColumnConfig());
            configs.add(config);
        }
        
        return configs;
    }
    
    @Override
    @Transactional
    public TableColumn updateColumn(Long columnId, ColumnConfigRequest request) {
        TableColumn column = getColumnById(columnId);
        column.setColumnName(request.getColumnName());
        column.setColumnType(request.getColumnType());
        column.setIsFormulaColumn(request.getIsFormulaColumn());
        column.setColumnConfig(request.getColumnConfig());
        column.setUpdateTime(new Date());
        return tableColumnRepository.save(column);
    }
    
    @Override
    @Transactional
    public void deleteColumn(Long columnId) {
        TableColumn column = getColumnById(columnId);
        column.setIsDeleted(true);
        column.setUpdateTime(new Date());
        tableColumnRepository.save(column);
    }
    
    @Override
    @Transactional
    public void updateColumnOrder(Long tableId, List<Long> columnIds) {
        for (int i = 0; i < columnIds.size(); i++) {
            TableColumn column = getColumnById(columnIds.get(i));
            column.setColumnIndex(i);
            column.setUpdateTime(new Date());
            tableColumnRepository.save(column);
        }
    }
    
    @Override
    public List<TableColumn> getFormulaColumns(Long tableId) {
        return tableColumnRepository.findFormulaColumnsByTableId(tableId);
    }
}