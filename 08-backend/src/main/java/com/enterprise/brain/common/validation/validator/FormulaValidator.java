package com.enterprise.brain.common.validation.validator;

import com.enterprise.brain.common.validation.annotation.ValidFormula;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;

import java.util.regex.Pattern;

/**
 * 公式验证器
 * 验证公式表达式的格式和语法正确性
 * 
 * @author Enterprise Brain Team
 * @version 1.0.0
 * @since 2024-01-01
 */
@Slf4j
public class FormulaValidator implements ConstraintValidator<ValidFormula, String> {
    
    // 基本公式格式检查
    private static final Pattern FORMULA_PATTERN = Pattern.compile("^=.*");
    
    // 函数名检查
    private static final Pattern FUNCTION_PATTERN = Pattern.compile("^[A-Z_][A-Z0-9_]*\\(");
    
    // 单元格引用检查
    private static final Pattern CELL_REFERENCE_PATTERN = Pattern.compile("^[A-Z]+[0-9]+$");
    
    // 支持的函数列表
    private static final String[] SUPPORTED_FUNCTIONS = {
        "SUM", "AVERAGE", "COUNT", "MAX", "MIN", "IF", "AND", "OR", "NOT",
        "ROUND", "CEILING", "FLOOR", "ABS", "SQRT", "POWER", "MOD",
        "CONCATENATE", "LEFT", "RIGHT", "MID", "LEN", "FIND", "REPLACE",
        "DATE", "YEAR", "MONTH", "DAY", "TODAY", "NOW"
    };
    
    private boolean allowEmpty;
    
    @Override
    public void initialize(ValidFormula constraintAnnotation) {
        this.allowEmpty = constraintAnnotation.allowEmpty();
    }
    
    @Override
    public boolean isValid(String formula, ConstraintValidatorContext context) {
        if (formula == null) {
            return allowEmpty;
        }
        
        if (!StringUtils.hasText(formula)) {
            return allowEmpty;
        }
        
        try {
            return validateFormula(formula);
        } catch (Exception e) {
            log.warn("公式验证异常: formula={}, error={}", formula, e.getMessage());
            return false;
        }
    }
    
    /**
     * 验证公式格式
     * 
     * @param formula 公式表达式
     * @return true表示验证通过，false表示验证失败
     */
    private boolean validateFormula(String formula) {
        // 基本格式检查：必须以=开头
        if (!FORMULA_PATTERN.matcher(formula).matches()) {
            log.debug("公式格式错误：不以=开头 - {}", formula);
            return false;
        }
        
        // 移除开头的=进行处理
        String formulaBody = formula.substring(1);
        
        // 检查基本语法
        return checkBasicSyntax(formulaBody) && 
               checkFunctions(formulaBody) && 
               checkCellReferences(formulaBody) && 
               checkOperators(formulaBody);
    }
    
    /**
     * 检查基本语法
     */
    private boolean checkBasicSyntax(String formulaBody) {
        // 检查括号是否匹配
        int bracketCount = 0;
        for (int i = 0; i < formulaBody.length(); i++) {
            char c = formulaBody.charAt(i);
            if (c == '(') {
                bracketCount++;
            } else if (c == ')') {
                bracketCount--;
                if (bracketCount < 0) {
                    log.debug("括号不匹配 - {}", formulaBody);
                    return false;
                }
            }
        }
        
        if (bracketCount != 0) {
            log.debug("括号不匹配 - {}", formulaBody);
            return false;
        }
        
        return true;
    }
    
    /**
     * 检查函数调用
     */
    private boolean checkFunctions(String formulaBody) {
        // 查找所有函数调用
        java.util.regex.Pattern functionCallPattern = java.util.regex.Pattern.compile("([A-Z_][A-Z0-9_]*)\\(");
        java.util.regex.Matcher matcher = functionCallPattern.matcher(formulaBody);
        
        while (matcher.find()) {
            String functionName = matcher.group(1);
            boolean isSupported = false;
            
            for (String supportedFunction : SUPPORTED_FUNCTIONS) {
                if (supportedFunction.equals(functionName)) {
                    isSupported = true;
                    break;
                }
            }
            
            if (!isSupported) {
                log.debug("不支持的函数: {} - {}", functionName, formulaBody);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 检查单元格引用
     */
    private boolean checkCellReferences(String formulaBody) {
        // 查找所有可能的单元格引用
        java.util.regex.Pattern cellRefPattern = java.util.regex.Pattern.compile("([A-Z]+[0-9]+)");
        java.util.regex.Matcher matcher = cellRefPattern.matcher(formulaBody);
        
        while (matcher.find()) {
            String cellRef = matcher.group(1);
            if (!CELL_REFERENCE_PATTERN.matcher(cellRef).matches()) {
                log.debug("无效的单元格引用: {} - {}", cellRef, formulaBody);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 检查操作符使用
     */
    private boolean checkOperators(String formulaBody) {
        // 检查是否有连续的操作符
        if (formulaBody.matches(".*[+\\-*/]{2,}.*")) {
            log.debug("连续的操作符 - {}", formulaBody);
            return false;
        }
        
        // 检查是否以操作符开头或结尾
        if (formulaBody.matches("^[+\\-*/].*") || formulaBody.matches(".*[+\\-*/]$")) {
            log.debug("操作符位置不当 - {}", formulaBody);
            return false;
        }
        
        return true;
    }
}