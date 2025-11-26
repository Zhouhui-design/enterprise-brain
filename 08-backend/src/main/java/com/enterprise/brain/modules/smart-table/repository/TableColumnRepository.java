package com.enterprise.brain.modules.smart-table.repository;

import com.enterprise.brain.modules.smart-table.entity.TableColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TableColumnRepository extends JpaRepository<TableColumn, Long> {
    
    List<TableColumn> findByTableIdAndIsDeletedFalseOrderByColumnIndexAsc(Long tableId);
    
    @Query("SELECT c FROM TableColumn c WHERE c.tableId = :tableId AND c.isFormulaColumn = true AND c.isDeleted = false")
    List<TableColumn> findFormulaColumnsByTableId(@Param("tableId") Long tableId);
    
    void deleteByTableIdAndIsDeletedTrue(Long tableId);
}