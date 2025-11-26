package com.enterprise.brain.modules.smart-table.util;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 公式解析工具类，用于提取单元格引用、验证公式合法性和标准化公式
 */
public class FormulaParser {
    // 支持大小写字母的单元格引用正则（如"A1"、"b2"、"AA3"）
    private static final Pattern CELL_PATTERN = Pattern.compile("([A-Za-z]+)(\\d+)");
    
    /**
     * 从公式中提取所有单元格引用
     * @param formula 公式字符串（如"A1+B2*C3"）
     * @return 单元格引用列表（若公式为null则返回空列表）
     */
    public static List<CellReference> extractCellReferences(String formula) {
        List<CellReference> references = new ArrayList<>();
        if (formula == null || formula.isEmpty()) {
            return references;
        }
        
        Matcher matcher = CELL_PATTERN.matcher(formula);
        while (matcher.find()) {
            String cellRef = matcher.group(0);
            try {
                references.add(CellReference.fromString(cellRef));
            } catch (IllegalArgumentException e) {
                // 忽略无效的单元格引用，避免影响整体解析
                continue;
            }
        }
        
        return references;
    }
    
    /**
     * 验证公式的基本合法性（括号匹配、无连续运算符等）
     * @param formula 待验证的公式
     * @return 合法返回true，否则返回false
     */
    public static boolean validateFormula(String formula) {
        if (formula == null || formula.isEmpty()) {
            return false;
        }
        
        // 检查括号匹配
        int openBrackets = 0;
        for (char c : formula.toCharArray()) {
            if (c == '(') {
                openBrackets++;
            } else if (c == ')') {
                openBrackets--;
                if (openBrackets < 0) {  // 右括号多于左括号
                    return false;
                }
            }
        }
        if (openBrackets != 0) {  // 括号未闭合
            return false;
        }
        
        // 检查连续运算符（如"1++2"、"3*-4"）
        if (formula.matches(".*[+\\-*/]{2,}.*")) {
            return false;
        }
        
        // 检查开头或结尾为运算符
        if (formula.matches("^[+\\-*/].*|.*[+\\-*/]$")) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 标准化公式（去除开头的等号并trim）
     * @param formula 原始公式（可能带等号，如"=A1+B2"）
     * @return 标准化后的公式（如"A1+B2"）；若输入为null返回null
     */
    public static String normalizeFormula(String formula) {
        if (formula == null) {
            return null;
        }
        String trimmed = formula.trim();
        return trimmed.startsWith("=") ? trimmed.substring(1).trim() : trimmed;
    }
}
