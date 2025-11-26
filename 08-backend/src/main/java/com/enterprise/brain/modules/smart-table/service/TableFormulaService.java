package com.enterprise.brain.modules.smart-table.service;

import com.enterprise.brain.modules.smart-table.dto.request.FormulaCalculateRequest;
import com.enterprise.brain.modules.smart-table.dto.response.FormulaResultResponse;
import com.enterprise.brain.modules.smart-table.entity.TableFormula;

import java.util.List;
import java.util.Map;

public interface TableFormulaService {
    
    TableFormula createFormula(Long columnId, String formulaExpression, String description);
    
    TableFormula getFormulaById(Long formulaId);
    
    TableFormula getFormulaByColumnId(Long columnId);
    
    List<TableFormula> getFormulasByTableId(Long tableId);
    
    TableFormula updateFormula(Long formulaId, String formulaExpression, String description);
    
    void deleteFormula(Long formulaId);
    
    FormulaResultResponse calculateFormula(FormulaCalculateRequest request);
    
    Map<String, String> batchCalculateFormulas(Long tableId, Map<String, String> cellValues);
    
    boolean validateFormula(String formulaExpression);
}