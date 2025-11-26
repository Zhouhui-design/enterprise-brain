package com.enterprise.brain.modules.smart-table.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class TableCreateRequest {
    private String name;
    private String description;
    private List<ColumnConfigRequest> columns;
    private Long createUserId;
}