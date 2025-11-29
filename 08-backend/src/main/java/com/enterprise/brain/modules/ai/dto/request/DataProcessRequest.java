package com.enterprise.brain.modules.ai.dto.request;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class DataProcessRequest {
    private List<String> dataIds;
    private String operationType; // e.g., "clean", "augment", "transform", "validate"
    private Map<String, Object> parameters;
    private Boolean saveProcessed = true;
    private String outputFormat;
    private String outputPath;
    private Boolean asyncProcess = false;
    private String callbackUrl;
}