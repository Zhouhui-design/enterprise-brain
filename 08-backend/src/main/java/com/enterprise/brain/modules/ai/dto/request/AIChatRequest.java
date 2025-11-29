package com.enterprise.brain.modules.ai.dto.request;

import lombok.Data;
import java.util.Map;

@Data
public class AIChatRequest {
    private String conversationId;
    private String message;
    private String modelId;
    private Map<String, Object> parameters;
    private boolean stream = false;
    private String systemPrompt;
    private Integer maxTokens;
    private Double temperature;
    private Double topP;
    private Boolean useHistory = true;
}