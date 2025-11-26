package com.enterprise.brain.modules.smart-table.service.impl;

import com.enterprise.brain.modules.smart-table.dto.request.TableCreateRequest;
import com.enterprise.brain.modules.smart-table.dto.response.TableDataResponse;
import com.enterprise.brain.modules.smart-table.entity.SmartTable;
import com.enterprise.brain.modules.smart-table.repository.SmartTableRepository;
import com.enterprise.brain.modules.smart-table.service.SmartTableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class SmartTableServiceImpl implements SmartTableService {
    
    @Autowired
    private SmartTableRepository smartTableRepository;
    
    @Override
    @Transactional
    public SmartTable createTable(TableCreateRequest request) {
        SmartTable table = new SmartTable();
        table.setName(request.getName());
        table.setDescription(request.getDescription());
        table.setCreateUserId(request.getCreateUserId());
        table.setCreateTime(new Date());
        table.setUpdateTime(new Date());
        table.setIsDeleted(false);
        return smartTableRepository.save(table);
    }
    
    @Override
    public SmartTable getTableById(Long tableId) {
        return smartTableRepository.findById(tableId)
                .orElseThrow(() -> new RuntimeException("Table not found with id: " + tableId));
    }
    
    @Override
    public List<SmartTable> getAllTables() {
        return smartTableRepository.findByIsDeletedFalse();
    }
    
    @Override
    public List<SmartTable> getTablesByUserId(Long userId) {
        return smartTableRepository.findByCreateUserId(userId);
    }
    
    @Override
    @Transactional
    public SmartTable updateTable(Long tableId, TableCreateRequest request) {
        SmartTable table = getTableById(tableId);
        table.setName(request.getName());
        table.setDescription(request.getDescription());
        table.setUpdateTime(new Date());
        return smartTableRepository.save(table);
    }
    
    @Override
    @Transactional
    public void deleteTable(Long tableId) {
        SmartTable table = getTableById(tableId);
        table.setIsDeleted(true);
        table.setUpdateTime(new Date());
        smartTableRepository.save(table);
    }
    
    @Override
    public TableDataResponse getTableData(Long tableId, Integer page, Integer pageSize) {
        SmartTable table = getTableById(tableId);
        TableDataResponse response = new TableDataResponse();
        response.setTableId(table.getId());
        response.setTableName(table.getName());
        // 这里需要集成TableColumnService和单元格数据服务
        // 暂时返回空数据结构
        response.setColumns(new ArrayList<>());
        response.setRows(new ArrayList<>());
        response.setTotalRows(0);
        return response;
    }
    
    @Override
    @Transactional
    public Map<String, Object> copyTableData(Long sourceTableId, Long targetTableId) {
        // 实现表格数据复制逻辑
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Table data copied successfully");
        // 实际实现中需要复制单元格数据和公式配置
        return result;
    }
    
    @Override
    public List<SmartTable> searchTables(String keyword) {
        return smartTableRepository.searchByName(keyword);
    }
}