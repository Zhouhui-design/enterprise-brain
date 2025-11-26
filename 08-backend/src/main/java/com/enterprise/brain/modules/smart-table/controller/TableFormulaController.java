package com.enterprise.brain.modules.smarttable.controller;

import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import com.enterprise.brain.modules.smarttable.service.TableFormulaService;
import com.enterprise.brain.modules.smarttable.dto.request.FormulaCalculateRequest;
import com.enterprise.brain.modules.smarttable.dto.response.FormulaResultResponse;

@RestController
@RequestMapping("/api/smart-table/formulas")
@RequiredArgsConstructor
public class TableFormulaController {
    private final TableFormulaService tableFormulaService;
    
    @PostMapping("/calculate")
    public FormulaResultResponse calculateFormula(@RequestBody FormulaCalculateRequest request) {
        return tableFormulaService.calculateFormula(request);
    }
    
    @PostMapping
    public Object createFormula(@RequestBody FormulaCalculateRequest request) {
        return tableFormulaService.saveFormula(request);
    }
    
    @GetMapping("/table/{tableId}")
    public Object getFormulasByTableId(@PathVariable Long tableId) {
        return tableFormulaService.getFormulasByTableId(tableId);
    }
    
    @PutMapping("/{formulaId}")
    public Object updateFormula(@PathVariable Long formulaId, @RequestBody FormulaCalculateRequest request) {
        return tableFormulaService.updateFormula(formulaId, request);
    }
    
    @DeleteMapping("/{formulaId}")
    public Object deleteFormula(@PathVariable Long formulaId) {
        return tableFormulaService.deleteFormula(formulaId);
    }
    
    @PostMapping("/validate")
    public Object validateFormula(@RequestParam String formulaExpression) {
        return tableFormulaService.validateFormula(formulaExpression);
    }
}