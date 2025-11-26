package com.enterprise.brain.modules.smarttable.controller;

import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import com.enterprise.brain.modules.smarttable.service.SmartTableService;
import com.enterprise.brain.modules.smarttable.dto.request.TableCreateRequest;
import com.enterprise.brain.modules.smarttable.dto.request.CellUpdateRequest;
import com.enterprise.brain.modules.smarttable.dto.response.TableDataResponse;

@RestController
@RequestMapping("/api/smart-table")
@RequiredArgsConstructor
public class SmartTableController {
    private final SmartTableService smartTableService;
    
    @PostMapping
    public Object createTable(@RequestBody TableCreateRequest request) {
        return smartTableService.createTable(request);
    }
    
    @GetMapping("/{id}")
    public Object getTableById(@PathVariable Long id) {
        return smartTableService.getTableById(id);
    }
    
    @PutMapping("/{id}")
    public Object updateTable(@PathVariable Long id, @RequestBody TableCreateRequest request) {
        return smartTableService.updateTable(id, request);
    }
    
    @DeleteMapping("/{id}")
    public Object deleteTable(@PathVariable Long id) {
        return smartTableService.deleteTable(id);
    }
    
    @GetMapping("/{id}/data")
    public TableDataResponse getTableData(@PathVariable Long id) {
        return smartTableService.getTableData(id);
    }
    
    @PutMapping("/cell/update")
    public Object updateCell(@RequestBody CellUpdateRequest request) {
        return smartTableService.updateCell(request);
    }
    
    @PostMapping("/{id}/copy")
    public Object copyTableData(@PathVariable Long id, @RequestParam("targetTableId") Long targetTableId) {
        return smartTableService.copyTableData(id, targetTableId);
    }
}