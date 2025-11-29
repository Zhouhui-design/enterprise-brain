package com.enterprise.brain.modules.ai.controller;

import com.enterprise.brain.modules.ai.dto.request.AIChatRequest;
import com.enterprise.brain.modules.ai.dto.response.AIChatResponse;
import com.enterprise.brain.modules.ai.entity.AIConversation;
import com.enterprise.brain.modules.ai.entity.AIPrompt;
import com.enterprise.brain.modules.ai.service.AIChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai/chat")
public class AIChatController {

    @Autowired
    private AIChatService chatService;
    
    @PostMapping("/send")
    public ResponseEntity<AIChatResponse> sendMessage(@RequestBody AIChatRequest request) {
        try {
            AIChatResponse response = chatService.chat(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Failed to process chat request: " + e.getMessage()));
        }
    }
    
    @PostMapping("/conversations")
    public ResponseEntity<AIConversation> createConversation(@RequestBody Map<String, String> request) {
        try {
            String userId = request.get("userId");
            String title = request.getOrDefault("title", "New Conversation");
            
            if (userId == null || userId.isEmpty()) {
                return ResponseEntity.badRequest().body(null);
            }
            
            AIConversation conversation = chatService.createConversation(userId, title);
            return ResponseEntity.status(HttpStatus.CREATED).body(conversation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @GetMapping("/conversations/{userId}")
    public ResponseEntity<List<AIConversation>> getConversations(@PathVariable String userId) {
        try {
            List<AIConversation> conversations = chatService.getConversations(userId);
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @GetMapping("/conversations/detail/{conversationId}/{userId}")
    public ResponseEntity<AIConversation> getConversation(
            @PathVariable String conversationId, 
            @PathVariable String userId) {
        try {
            return chatService.getConversation(conversationId, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @PutMapping("/conversations/{conversationId}/{userId}/title")
    public ResponseEntity<AIConversation> updateConversationTitle(
            @PathVariable String conversationId, 
            @PathVariable String userId, 
            @RequestBody Map<String, String> request) {
        try {
            String title = request.get("title");
            if (title == null || title.isEmpty()) {
                return ResponseEntity.badRequest().body(null);
            }
            
            AIConversation updated = chatService.updateConversationTitle(conversationId, userId, title);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @DeleteMapping("/conversations/{conversationId}/{userId}")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable String conversationId, 
            @PathVariable String userId) {
        try {
            chatService.deleteConversation(conversationId, userId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/conversations/{conversationId}/{userId}/prompts")
    public ResponseEntity<List<AIPrompt>> getConversationPrompts(
            @PathVariable String conversationId, 
            @PathVariable String userId) {
        try {
            List<AIPrompt> prompts = chatService.getConversationPrompts(conversationId, userId);
            return ResponseEntity.ok(prompts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @PutMapping("/conversations/{conversationId}/{userId}/clear")
    public ResponseEntity<AIConversation> clearConversationHistory(
            @PathVariable String conversationId, 
            @PathVariable String userId) {
        try {
            AIConversation cleared = chatService.clearConversationHistory(conversationId, userId);
            return ResponseEntity.ok(cleared);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @PostMapping("/generate-title")
    public ResponseEntity<Map<String, String>> generateConversationTitle(@RequestBody Map<String, String> request) {
        try {
            String message = request.get("message");
            if (message == null || message.isEmpty()) {
                return ResponseEntity.badRequest().body(null);
            }
            
            String title = chatService.generateConversationTitle(message);
            return ResponseEntity.ok(Map.of("title", title));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    // 辅助方法：创建错误响应
    private AIChatResponse createErrorResponse(String errorMessage) {
        AIChatResponse response = new AIChatResponse();
        response.setSuccess(false);
        response.setErrorMessage(errorMessage);
        return response;
    }
}