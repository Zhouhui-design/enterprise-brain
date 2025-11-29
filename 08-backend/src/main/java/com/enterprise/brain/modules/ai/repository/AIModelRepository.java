package com.enterprise.brain.modules.ai.repository;

import com.enterprise.brain.modules.ai.entity.AIModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AIModelRepository extends JpaRepository<AIModel, Long> {
    
    Optional<AIModel> findByModelId(String modelId);
    
    List<AIModel> findByProvider(String provider);
    
    List<AIModel> findByModelType(String modelType);
    
    List<AIModel> findByStatus(String status);
    
    Optional<AIModel> findByIsDefaultTrue();
    
    List<AIModel> findByNameContaining(String keyword);
    
    List<AIModel> findByProviderAndStatus(String provider, String status);
    
    void deleteByModelId(String modelId);
    
    boolean existsByModelId(String modelId);
}