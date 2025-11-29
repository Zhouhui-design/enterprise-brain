package com.enterprise.brain.modules.ai.repository;

import com.enterprise.brain.modules.ai.entity.AIConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AIConversationRepository extends JpaRepository<AIConversation, Long> {
    
    Optional<AIConversation> findByConversationId(String conversationId);
    
    List<AIConversation> findByUserId(String userId);
    
    List<AIConversation> findByUserIdAndActive(String userId, boolean active);
    
    Optional<AIConversation> findByConversationIdAndUserId(String conversationId, String userId);
    
    void deleteByConversationId(String conversationId);
    
    long countByUserId(String userId);
}