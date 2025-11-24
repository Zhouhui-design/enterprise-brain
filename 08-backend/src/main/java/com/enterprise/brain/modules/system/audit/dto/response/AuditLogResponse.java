package com.enterprise.brain.modules.system.audit.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AuditLogResponse {
    private Long id;
    private String userId;
    private String userName;
    private String operation;
    private String module;
    private String ipAddress;
    private LocalDateTime operationTime;
    private String details;
}
