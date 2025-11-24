package com.enterprise.brain.modules.system.audit.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DataChangeResponse {
    private Long id;
    private String tableName;
    private String recordId;
    private String changeType;
    private String oldValue;
    private String newValue;
    private String operatorId;
    private LocalDateTime changeTime;
}
