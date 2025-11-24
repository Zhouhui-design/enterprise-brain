package com.enterprise.brain.modules.system.audit.dto.request;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DataChangeQueryRequest {
    private String tableName;
    private String recordId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer pageNum = 1;
    private Integer pageSize = 10;
}
