package com.enterprise.brain.modules.ai.controller;

import com.enterprise.brain.modules.ai.dto.request.AIRequest;
import com.enterprise.brain.modules.ai.dto.response.AIResponse;
import com.enterprise.brain.modules.ai.entity.AIConversation;
import com.enterprise.brain.modules.ai.service.AIChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/conversations")
public class AIConversationController {

    @Autowired
    private AIChatService chatService;
    
    @GetMapping
    public ResponseEntity<List<AIConversation>> getUserConversations(@RequestParam String userId) {
        try {
            List<AIConversation> conversations = chatService.getConversations(userId);
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @GetMapping("/{conversationId}")
    public ResponseEntity<AIConversation> getConversation(@PathVariable String conversationId) {
        try {
            return chatService.getConversation(conversationId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @PostMapping
    public ResponseEntity<AIConversation> createConversation(@RequestBody AIConversation conversation) {
        try {
            AIConversation createdConversation = chatService.createConversation(conversation);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdConversation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @PutMapping("/{conversationId}")
    public ResponseEntity<AIConversation> updateConversation(@PathVariable String conversationId,
                                                          @RequestBody AIConversation conversation) {
        try {
            AIConversation updatedConversation = chatService.updateConversation(conversationId, conversation);
            return ResponseEntity.ok(updatedConversation);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @DeleteMapping("/{conversationId}")
    public ResponseEntity<Void> deleteConversation(@PathVariable String conversationId) {
        try {
            chatService.deleteConversation(conversationId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/{conversationId}/chat")
    public ResponseEntity<AIResponse> chat(@PathVariable String conversationId, @RequestBody AIRequest request) {
        try {
            // 设置对话ID，确保消息发送到正确的对话
            request.setConversationId(conversationId);
            AIResponse response = chatService.chat(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<AIConversation>> searchConversations(@RequestParam String userId,
                                                                 @RequestParam String keyword) {
        try {
            List<AIConversation> conversations = chatService.searchConversations(userId, keyword);
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @GetMapping("/count")
    public ResponseEntity<Long> getConversationCount(@RequestParam String userId) {
        try {
            long count = chatService.getConversationCount(userId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}