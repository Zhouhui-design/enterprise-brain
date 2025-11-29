package com.enterprise.brain.modules.ai.dto.response;

import lombok.Data;
import java.util.Map;

@Data
public class AIChatResponse {
    private String conversationId;
    private String messageId;
    private String response;
    private boolean success;
    private String errorMessage;
    private Map<String, Object> metadata;
    private Long tokensUsed;
    private Long responseTimeMs;
    private String modelId;
    private boolean hasMore;
    private String streamId;
}