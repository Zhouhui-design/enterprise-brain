package com.enterprise.brain.modules.productmanual.controller;

import com.enterprise.brain.modules.productmanual.entity.ProductManual;
import com.enterprise.brain.modules.productmanual.service.ProductManualService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/product-manual")
@CrossOrigin(origins = "*")
public class ProductManualController {

    @Autowired
    private ProductManualService productManualService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProductManuals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String productCode,
            @RequestParam(required = false) String productName,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status) {
        
        Page<ProductManual> productPage = productManualService.findPage(page, size, productCode, productName, category, status);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", productPage.getContent());
        response.put("pagination", Map.of(
            "total", productPage.getTotalElements(),
            "page", productPage.getNumber(),
            "pageSize", productPage.getSize(),
            "totalPages", productPage.getTotalPages()
        ));
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getProductManual(@PathVariable Long id) {
        return productManualService.findById(id)
                .map(product -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("data", product);
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createProductManual(@RequestBody ProductManual productManual) {
        ProductManual savedProduct = productManualService.save(productManual);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", savedProduct);
        response.put("message", "产品创建成功");
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateProductManual(@PathVariable Long id, @RequestBody ProductManual productManual) {
        if (!productManualService.findById(id).isPresent()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "产品不存在");
            return ResponseEntity.notFound().build();
        }
        
        productManual.setId(id);
        ProductManual updatedProduct = productManualService.save(productManual);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", updatedProduct);
        response.put("message", "产品更新成功");
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteProductManual(@PathVariable Long id) {
        if (!productManualService.findById(id).isPresent()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "产品不存在");
            return ResponseEntity.notFound().build();
        }
        
        productManualService.deleteById(id);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "产品删除成功");
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", productManualService.count());
        stats.put("onSale", productManualService.countByStatus("在售"));
        stats.put("discontinued", productManualService.countByStatus("停产"));
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);
        
        return ResponseEntity.ok(response);
    }
}