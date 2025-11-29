package com.enterprise.brain.modules.ai.repository;

import com.enterprise.brain.modules.ai.entity.TrainingData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingDataRepository extends JpaRepository<TrainingData, Long> {
    
    Optional<TrainingData> findByDataId(String dataId);
    
    List<TrainingData> findByDataType(String dataType);
    
    List<TrainingData> findByStatus(String status);
    
    List<TrainingData> findByCreatedBy(String createdBy);
    
    List<TrainingData> findByNameContaining(String keyword);
    
    List<TrainingData> findByDataTypeAndStatus(String dataType, String status);
    
    void deleteByDataId(String dataId);
    
    long countByCreatedBy(String createdBy);
    
    boolean existsByDataId(String dataId);
}