package com.enterprise.brain.modules.system.audit.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.enterprise.brain.modules.system.audit.dto.request.DataChangeQueryRequest;
import com.enterprise.brain.modules.system.audit.dto.response.DataChangeResponse;
import com.enterprise.brain.modules.system.audit.service.DataChangeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;

@RestController
@RequestMapping("/api/audit/changes")
public class DataChangeController {

    @Resource
    private DataChangeService dataChangeService;

    @GetMapping
    public ResponseEntity<Page<DataChangeResponse>> getDataChanges(DataChangeQueryRequest request) {
        Page<DataChangeResponse> changes = dataChangeService.getDataChanges(request);
        return ResponseEntity.ok(changes);
    }

    @PostMapping
    public ResponseEntity<Boolean> saveDataChange(@RequestBody DataChangeResponse record) {
        boolean success = dataChangeService.saveDataChange(record);
        return ResponseEntity.ok(success);
    }
}
