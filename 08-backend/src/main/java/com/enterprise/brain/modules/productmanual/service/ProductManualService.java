package com.enterprise.brain.modules.productmanual.service;

import com.enterprise.brain.modules.productmanual.entity.ProductManual;
import com.enterprise.brain.modules.productmanual.repository.ProductManualRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import javax.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ProductManualService {

    @Autowired
    private ProductManualRepository productManualRepository;

    public List<ProductManual> findAll() {
        return productManualRepository.findAll();
    }

    public Page<ProductManual> findPage(int page, int size, String productCode, String productName, String category, String status) {
        Pageable pageable = PageRequest.of(page, size);
        
        Specification<ProductManual> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (productCode != null && !productCode.isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("productCode")), 
                    "%" + productCode.toLowerCase() + "%"));
            }
            
            if (productName != null && !productName.isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("productName")), 
                    "%" + productName.toLowerCase() + "%"));
            }
            
            if (category != null && !category.isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("category"), category));
            }
            
            if (status != null && !status.isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
        
        return productManualRepository.findAll(spec, pageable);
    }

    public Optional<ProductManual> findById(Long id) {
        return productManualRepository.findById(id);
    }

    public ProductManual save(ProductManual productManual) {
        if (productManual.getCreateTime() == null) {
            productManual.setCreateTime(LocalDateTime.now());
        }
        productManual.setUpdateTime(LocalDateTime.now());
        return productManualRepository.save(productManual);
    }

    public void deleteById(Long id) {
        productManualRepository.deleteById(id);
    }

    public long count() {
        return productManualRepository.count();
    }

    public long countByStatus(String status) {
        return productManualRepository.findByStatus(status).size();
    }
}