package com.enterprise.brain.modules.integration.messaging.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MessageSendResponse {
    
    private boolean success;
    private String messageId;
    private String status;
    private String message;
    private String platformResponse;
    private String logId;
}