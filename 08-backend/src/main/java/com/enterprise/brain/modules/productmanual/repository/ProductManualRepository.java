package com.enterprise.brain.modules.productmanual.repository;

import com.enterprise.brain.modules.productmanual.entity.ProductManual;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductManualRepository extends JpaRepository<ProductManual, Long>, JpaSpecificationExecutor<ProductManual> {
    
    List<ProductManual> findByProductCodeContainingIgnoreCase(String productCode);
    
    List<ProductManual> findByProductNameContainingIgnoreCase(String productName);
    
    List<ProductManual> findByCategory(String category);
    
    List<ProductManual> findByStatus(String status);
    
    List<ProductManual> findByProductCode(String productCode);
}