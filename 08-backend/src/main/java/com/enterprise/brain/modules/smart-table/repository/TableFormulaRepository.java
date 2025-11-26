package com.enterprise.brain.modules.smart-table.repository;

import com.enterprise.brain.modules.smart-table.entity.TableFormula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TableFormulaRepository extends JpaRepository<TableFormula, Long> {
    
    @Query("SELECT f FROM TableFormula f WHERE f.columnId = :columnId AND f.isDeleted = false")
    Optional<TableFormula> findByColumnId(@Param("columnId") Long columnId);
    
    @Query("SELECT f FROM TableFormula f WHERE f.tableId = :tableId AND f.isDeleted = false")
    List<TableFormula> findByTableId(@Param("tableId") Long tableId);
}