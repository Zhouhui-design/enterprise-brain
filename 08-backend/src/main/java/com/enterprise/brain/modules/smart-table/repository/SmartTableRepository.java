package com.enterprise.brain.modules.smart-table.repository;

import com.enterprise.brain.modules.smart-table.entity.SmartTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmartTableRepository extends JpaRepository<SmartTable, Long> {
    
    List<SmartTable> findByIsDeletedFalse();
    
    @Query("SELECT t FROM SmartTable t WHERE t.createUserId = :userId AND t.isDeleted = false")
    List<SmartTable> findByCreateUserId(@Param("userId") Long userId);
    
    @Query("SELECT t FROM SmartTable t WHERE t.name LIKE %:keyword% AND t.isDeleted = false")
    List<SmartTable> searchByName(@Param("keyword") String keyword);
}