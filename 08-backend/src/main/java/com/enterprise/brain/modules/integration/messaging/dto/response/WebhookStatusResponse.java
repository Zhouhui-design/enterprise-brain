package com.enterprise.brain.modules.integration.messaging.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class WebhookStatusResponse {
    
    private String id;
    private String platformType;
    private String name;
    private boolean active;
    private String testStatus;
    private LocalDateTime lastTestTime;
    private String message;
    private boolean connected;
}