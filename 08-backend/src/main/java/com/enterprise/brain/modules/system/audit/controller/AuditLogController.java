package com.enterprise.brain.modules.system.audit.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.enterprise.brain.modules.system.audit.dto.request.AuditQueryRequest;
import com.enterprise.brain.modules.system.audit.dto.response.AuditLogResponse;
import com.enterprise.brain.modules.system.audit.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;

@RestController
@RequestMapping("/api/audit/logs")
public class AuditLogController {

    @Resource
    private AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<Page<AuditLogResponse>> getAuditLogs(AuditQueryRequest request) {
        Page<AuditLogResponse> logs = auditLogService.getAuditLogs(request);
        return ResponseEntity.ok(logs);
    }

    @PostMapping
    public ResponseEntity<Boolean> saveAuditLog(@RequestBody AuditLogResponse log) {
        boolean success = auditLogService.saveAuditLog(log);
        return ResponseEntity.ok(success);
    }
}
