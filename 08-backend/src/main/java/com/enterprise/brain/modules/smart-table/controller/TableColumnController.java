package com.enterprise.brain.modules.smarttable.controller;

import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import com.enterprise.brain.modules.smarttable.service.TableColumnService;
import com.enterprise.brain.modules.smarttable.dto.request.ColumnConfigRequest;
import com.enterprise.brain.modules.smarttable.dto.response.ColumnConfigResponse;

import java.util.List;

@RestController
@RequestMapping("/api/smart-table/columns")
@RequiredArgsConstructor
public class TableColumnController {
    private final TableColumnService tableColumnService;
    
    @PostMapping
    public Object createColumn(@RequestBody ColumnConfigRequest request) {
        return tableColumnService.createColumn(request);
    }
    
    @GetMapping("/table/{tableId}")
    public List<ColumnConfigResponse> getColumnsByTableId(@PathVariable Long tableId) {
        return tableColumnService.getColumnsByTableId(tableId);
    }
    
    @PutMapping("/{columnId}")
    public Object updateColumn(@PathVariable Long columnId, @RequestBody ColumnConfigRequest request) {
        return tableColumnService.updateColumn(columnId, request);
    }
    
    @DeleteMapping("/{columnId}")
    public Object deleteColumn(@PathVariable Long columnId) {
        return tableColumnService.deleteColumn(columnId);
    }
    
    @PutMapping("/reorder")
    public Object reorderColumns(@RequestParam Long tableId, @RequestBody List<Long> columnIds) {
        return tableColumnService.reorderColumns(tableId, columnIds);
    }
    
    @PutMapping("/{columnId}/visibility")
    public Object updateColumnVisibility(@PathVariable Long columnId, @RequestParam Boolean visible) {
        return tableColumnService.updateColumnVisibility(columnId, visible);
    }
}