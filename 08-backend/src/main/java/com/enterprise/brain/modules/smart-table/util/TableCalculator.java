package com.enterprise.brain.modules.smart-table.util;

import java.util.Map;
import java.util.List;
import java.util.HashMap;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;  // 补充缺失的导入

/**
 * 表格计算公式计算器，用于解析和计算包含单元格引用的公式
 */
public class TableCalculator {
    
    /**
     * 计算包含单元格引用的公式结果
     * @param formula 公式字符串（支持类似"=A1+B2*C3"的格式）
     * @param cellValues 单元格引用到值的映射（如"A1" -> "100"）
     * @return 计算结果字符串；若计算失败返回"#ERROR"
     */
    public static String calculateFormula(String formula, Map<String, String> cellValues) {
        if (formula == null || cellValues == null) {
            return "#ERROR";
        }
        
        try {
            // 标准化公式（去除开头的等号）
            String processedFormula = FormulaParser.normalizeFormula(formula);
            if (processedFormula == null || processedFormula.isEmpty()) {
                return "";
            }
            
            // 替换公式中的单元格引用为实际值
            List<CellReference> references = FormulaParser.extractCellReferences(processedFormula);
            for (CellReference ref : references) {
                String refStr = ref.toString();
                String value = cellValues.getOrDefault(refStr, "0");  // 不存在的单元格默认为0
                
                // 检查是否为数字值（支持整数和小数）
                if (value.matches("^-?\\d+(\\.\\d+)?$")) {
                    processedFormula = processedFormula.replace(refStr, value);
                } else {
                    processedFormula = processedFormula.replace(refStr, "0");  // 非数字值视为0
                }
            }
            
            // 验证公式合法性
            if (!FormulaParser.validateFormula(processedFormula)) {
                return "#ERROR";
            }
            
            // 计算表达式结果
            return evaluateExpression(processedFormula);
        } catch (IllegalArgumentException e) {
            // 处理公式格式错误等已知异常
            return "#ERROR";
        } catch (Exception e) {
            // 捕获其他未预期异常
            return "#ERROR";
        }
    }
    
    /**
     * 计算表达式的值（注意：存在安全风险，生产环境需替换为安全的表达式解析器）
     * @param expression 数学表达式（如"1+2*3"）
     * @return 计算结果字符串
     * @throws ScriptException 当表达式解析或执行失败时抛出
     */
    private static String evaluateExpression(String expression) throws ScriptException {
        // 警告：使用JavaScript引擎执行表达式存在安全风险，可能被注入恶意代码
        // 生产环境建议使用Apache Commons JEXL、MVEL等安全的表达式解析库
        ScriptEngineManager manager = new ScriptEngineManager();
        ScriptEngine engine = manager.getEngineByName("JavaScript");
        Object result = engine.eval(expression);
        return result.toString();
    }
    
    /**
     * 复制原始记录的单元格值到新记录（排除ID相关字段）
     * @param originalValues 原始记录的单元格值映射
     * @param originalRecordId 原始记录ID（未使用，保留参数用于扩展）
     * @param newRecordId 新记录ID（未使用，保留参数用于扩展）
     * @return 新记录的单元格值映射（排除ID字段）
     */
    public static Map<String, String> copyValuesForNewRecord(Map<String, String> originalValues, 
                                                             Long originalRecordId, 
                                                             Long newRecordId) {
        Map<String, String> newValues = new HashMap<>();
        
        if (originalValues == null) {
            return newValues;
        }
        
        for (Map.Entry<String, String> entry : originalValues.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            
            // 排除键中包含"id"（不区分大小写）的字段（如"id"、"ID"、"UserId"）
            if (key == null || !key.toLowerCase().contains("id")) {
                newValues.put(key, value);
            }
        }
        
        return newValues;
    }
}
