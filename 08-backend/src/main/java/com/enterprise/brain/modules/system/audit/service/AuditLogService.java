package com.enterprise.brain.modules.system.audit.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.enterprise.brain.modules.system.audit.dto.request.AuditQueryRequest;
import com.enterprise.brain.modules.system.audit.dto.response.AuditLogResponse;

public interface AuditLogService {
    Page<AuditLogResponse> getAuditLogs(AuditQueryRequest request);
    boolean saveAuditLog(AuditLogResponse log);
}
