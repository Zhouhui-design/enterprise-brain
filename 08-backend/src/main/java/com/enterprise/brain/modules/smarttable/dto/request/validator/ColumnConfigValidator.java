package com.enterprise.brain.modules.smarttable.dto.request.validator;

import com.enterprise.brain.modules.smarttable.dto.request.ColumnConfigRequest;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * 列配置验证器
 * 提供全面的列配置验证功能，包括业务规则、安全检查等
 * 
 * @author Enterprise Brain Team
 * @version 2.0.0
 * @since 2024-01-01
 */
@Slf4j
public class ColumnConfigValidator {
    
    // 列名正则表达式
    private static final Pattern COLUMN_NAME_PATTERN = Pattern.compile("^[\\u4e00-\\u9fa5a-zA-Z0-9_\\-\\s]+$");
    
    // 危险字符正则表达式
    private static final Pattern DANGEROUS_CHARS_PATTERN = Pattern.compile("[<>\"'&]");
    
    // 最大列名长度
    private static final int MAX_COLUMN_NAME_LENGTH = 50;
    
    // 最大公式表达式长度
    private static final int MAX_FORMULA_LENGTH = 1000;
    
    // 最大列配置长度
    private static final int MAX_CONFIG_LENGTH = 2000;
    
    /**
     * 验证结果
     */
    public static class ValidationResult {
        private final List<String> errors = new ArrayList<>();
        private final List<String> warnings = new ArrayList<>();
        
        public void addError(String error) {
            errors.add(error);
        }
        
        public void addWarning(String warning) {
            warnings.add(warning);
        }
        
        public List<String> getErrors() {
            return new ArrayList<>(errors);
        }
        
        public List<String> getWarnings() {
            return new ArrayList<>(warnings);
        }
        
        public boolean hasErrors() {
            return !errors.isEmpty();
        }
        
        public boolean hasWarnings() {
            return !warnings.isEmpty();
        }
        
        public String getErrorMessage() {
            return String.join("; ", errors);
        }
        
        public String getWarningMessage() {
            return String.join("; ", warnings);
        }
        
        public boolean isValid() {
            return !hasErrors();
        }
    }
    
    /**
     * 验证列配置请求
     * 
     * @param request 列配置请求
     * @return 验证结果
     */
    public static ValidationResult validate(ColumnConfigRequest request) {
        ValidationResult result = new ValidationResult();
        
        if (request == null) {
            result.addError("列配置请求不能为空");
            return result;
        }
        
        // 基础验证
        validateBasicFields(request, result);
        
        // 业务规则验证
        validateBusinessRules(request, result);
        
        // 安全性验证
        validateSecurity(request, result);
        
        // 格式验证
        validateFormat(request, result);
        
        // 性能相关验证
        validatePerformance(request, result);
        
        return result;
    }
    
    /**
     * 验证基础字段
     */
    private static void validateBasicFields(ColumnConfigRequest request, ValidationResult result) {
        // 验证列名
        if (request.getColumnName() == null || request.getColumnName().trim().isEmpty()) {
            result.addError("列名称不能为空");
        } else {
            String columnName = request.getColumnName().trim();
            
            // 长度验证
            if (columnName.length() > MAX_COLUMN_NAME_LENGTH) {
                result.addError("列名称长度不能超过" + MAX_COLUMN_NAME_LENGTH + "个字符");
            }
            
            // 格式验证
            if (!COLUMN_NAME_PATTERN.matcher(columnName).matches()) {
                result.addError("列名称只能包含中文、英文字母、数字、下划线、连字符和空格");
            }
            
            // 危险字符验证
            if (DANGEROUS_CHARS_PATTERN.matcher(columnName).find()) {
                result.addError("列名称不能包含特殊字符：<, >, \", ', ', &, '");
            }
            
            // 前后空格验证
            if (!columnName.equals(request.getColumnName())) {
                result.addWarning("列名称包含前后空格，已自动去除");
            }
        }
        
        // 验证列类型
        if (request.getColumnType() == null || request.getColumnType().trim().isEmpty()) {
            result.addError("列类型不能为空");
        } else {
            String columnType = request.getColumnType().trim().toUpperCase();
            
            boolean isValidType = false;
            for (ColumnConfigRequest.ColumnType type : ColumnConfigRequest.ColumnType.values()) {
                if (type.getCode().equals(columnType)) {
                    isValidType = true;
                    break;
                }
            }
            
            if (!isValidType) {
                result.addError("列类型必须是以下之一：TEXT, NUMBER, DATE, BOOLEAN, FORMULA");
            }
        }
        
        // 验证列索引
        if (request.getColumnIndex() == null) {
            result.addError("列索引不能为空");
        } else if (request.getColumnIndex() < 0) {
            result.addError("列索引不能小于0");
        } else if (request.getColumnIndex() > 999) {
            result.addWarning("列索引建议不要超过999，可能影响性能");
        }
    }
    
    /**
     * 验证业务规则
     */
    private static void validateBusinessRules(ColumnConfigRequest request, ValidationResult result) {
        // 验证公式列逻辑
        boolean isFormulaType = ColumnConfigRequest.ColumnType.FORMULA.equals(request.getColumnTypeEnum());
        boolean isFormulaFlag = Boolean.TRUE.equals(request.getIsFormulaColumn());
        
        if (isFormulaType && !isFormulaFlag) {
            result.addError("公式类型的列必须设置isFormulaColumn为true");
        }
        
        if (!isFormulaType && isFormulaFlag) {
            result.addError("非公式类型的列不能设置isFormulaColumn为true");
        }
        
        // 验证公式表达式
        if ((isFormulaFlag || isFormulaType) && (request.getFormulaExpression() == null || request.getFormulaExpression().trim().isEmpty())) {
            result.addError("公式列必须提供公式表达式");
        } else if (request.getFormulaExpression() != null) {
            String formula = request.getFormulaExpression().trim();
            
            // 长度验证
            if (formula.length() > MAX_FORMULA_LENGTH) {
                result.addError("公式表达式长度不能超过" + MAX_FORMULA_LENGTH + "个字符");
            }
            
            // 格式验证
            if (!formula.startsWith("=")) {
                result.addError("公式表达式必须以=开头");
            }
            
            // 复杂度验证
            if (formula.chars().filter(ch -> ch == '(').count() > 10) {
                result.addWarning("公式表达式过于复杂，可能影响性能");
            }
            
            if (formula.chars().filter(ch -> ch == '+').count() > 20) {
                result.addWarning("公式表达式包含过多运算符，可能影响性能");
            }
        }
        
        // 验证列配置
        if (request.getColumnConfig() != null && !request.getColumnConfig().trim().isEmpty()) {
            String config = request.getColumnConfig().trim();
            
            // 长度验证
            if (config.length() > MAX_CONFIG_LENGTH) {
                result.addError("列配置长度不能超过" + MAX_CONFIG_LENGTH + "个字符");
            }
            
            // JSON格式基础验证
            if (!isValidJsonFormat(config)) {
                result.addError("列配置必须是有效的JSON格式");
            }
        }
    }
    
    /**
     * 验证安全性
     */
    private static void validateSecurity(ColumnConfigRequest request, ValidationResult result) {
        // 验证SQL注入风险
        if (request.getColumnName() != null) {
            String columnName = request.getColumnName().toLowerCase();
            String[] sqlKeywords = {"select", "insert", "update", "delete", "drop", "create", "alter", "exec", "script"};
            
            for (String keyword : sqlKeywords) {
                if (columnName.contains(keyword)) {
                    result.addError("列名称不能包含SQL关键字: " + keyword);
                }
            }
        }
        
        // 验证XSS风险
        if (request.getColumnName() != null) {
            String columnName = request.getColumnName().toLowerCase();
            String[] xssPatterns = {"<script", "javascript:", "vbscript:", "onload=", "onerror="};
            
            for (String pattern : xssPatterns) {
                if (columnName.contains(pattern)) {
                    result.addError("列名称不能包含潜在的XSS攻击代码");
                    break;
                }
            }
        }
        
        // 验证公式表达式的安全性
        if (request.getFormulaExpression() != null) {
            if (!ColumnConfigUtils.isFormulaExpressionSafe(request.getFormulaExpression())) {
                result.addError("公式表达式包含不安全的函数或模式");
            }
        }
    }
    
    /**
     * 验证格式
     */
    private static void validateFormat(ColumnConfigRequest request, ValidationResult result) {
        // 验证列名格式
        if (request.getColumnName() != null) {
            String columnName = request.getColumnName().trim();
            
            // 不能以数字开头
            if (columnName.matches("^\\d.*")) {
                result.addWarning("列名以数字开头，可能影响某些系统的兼容性");
            }
            
            // 不能只有空格
            if (columnName.trim().isEmpty()) {
                result.addError("列名称不能只包含空格");
            }
            
            // 检查连续的特殊字符
            if (columnName.matches(".*[-_\\s]{2,}.*")) {
                result.addWarning("列名包含连续的特殊字符，建议优化");
            }
        }
        
        // 验证公式表达式格式
        if (request.getFormulaExpression() != null) {
            String formula = request.getFormulaExpression().trim();
            
            // 检查括号匹配
            int openCount = (int) formula.chars().filter(ch -> ch == '(').count();
            int closeCount = (int) formula.chars().filter(ch -> ch == ')').count();
            
            if (openCount != closeCount) {
                result.addError("公式表达式中括号不匹配");
            }
            
            // 检查连续的运算符
            if (formula.matches(".*[+\\-*/]{2,}.*")) {
                result.addError("公式表达式不能包含连续的运算符");
            }
            
            // 检查无效的单元格引用格式
            if (formula.matches(".*[A-Za-z]\\d{2,}.*")) {
                result.addWarning("公式表达式可能包含无效的单元格引用格式");
            }
        }
    }
    
    /**
     * 验证性能相关
     */
    private static void validatePerformance(ColumnConfigRequest request, ValidationResult result) {
        // 验证列名长度对性能的影响
        if (request.getColumnName() != null && request.getColumnName().length() > 30) {
            result.addWarning("列名过长，可能影响数据库性能");
        }
        
        // 验证公式的复杂度
        if (request.getFormulaExpression() != null) {
            String formula = request.getFormulaExpression();
            
            // 计算嵌套层数
            int maxNesting = 0;
            int currentNesting = 0;
            
            for (char c : formula.toCharArray()) {
                if (c == '(') {
                    currentNesting++;
                    maxNesting = Math.max(maxNesting, currentNesting);
                } else if (c == ')') {
                    currentNesting--;
                }
            }
            
            if (maxNesting > 5) {
                result.addWarning("公式表达式嵌套过深，可能影响性能");
            }
        }
        
        // 验证列配置的复杂度
        if (request.getColumnConfig() != null) {
            try {
                Map<String, Object> config = ColumnConfigUtils.parseJsonSafely(request.getColumnConfig());
                
                // 检查配置项数量
                if (config.size() > 20) {
                    result.addWarning("列配置项过多，可能影响性能");
                }
                
                // 检查自定义函数
                Object customFunction = config.get("customFunction");
                if (customFunction != null) {
                    result.addWarning("列配置包含自定义函数，可能影响性能");
                }
                
            } catch (Exception e) {
                log.warn("解析列配置时发生异常", e);
            }
        }
    }
    
    /**
     * 批量验证列配置
     * 
     * @param requests 列配置列表
     * @return 批量验证结果
     */
    public static BatchValidationResult validateBatch(List<ColumnConfigRequest> requests) {
        BatchValidationResult result = new BatchValidationResult();
        
        if (requests == null || requests.isEmpty()) {
            result.addError("列配置列表不能为空");
            return result;
        }
        
        // 验证每个列配置
        for (int i = 0; i < requests.size(); i++) {
            ColumnConfigRequest request = requests.get(i);
            ValidationResult individualResult = validate(request);
            
            if (individualResult.hasErrors()) {
                for (String error : individualResult.getErrors()) {
                    result.addError("第" + (i + 1) + "列: " + error);
                }
            }
            
            if (individualResult.hasWarnings()) {
                for (String warning : individualResult.getWarnings()) {
                    result.addWarning("第" + (i + 1) + "列: " + warning);
                }
            }
        }
        
        // 验证列名唯一性
        validateColumnNamesUniqueness(requests, result);
        
        // 验证列索引唯一性
        validateColumnIndexesUniqueness(requests, result);
        
        return result;
    }
    
    /**
     * 验证列名唯一性
     */
    private static void validateColumnNamesUniqueness(List<ColumnConfigRequest> requests, BatchValidationResult result) {
        Set<String> columnNames = new HashSet<>();
        Set<String> duplicateNames = new HashSet<>();
        
        for (int i = 0; i < requests.size(); i++) {
            ColumnConfigRequest request = requests.get(i);
            String columnName = request.getColumnName();
            
            if (columnNames.contains(columnName)) {
                duplicateNames.add(columnName);
            } else {
                columnNames.add(columnName);
            }
        }
        
        for (String duplicateName : duplicateNames) {
            result.addError("列名重复: " + duplicateName);
        }
    }
    
    /**
     * 验证列索引唯一性
     */
    private static void validateColumnIndexesUniqueness(List<ColumnConfigRequest> requests, BatchValidationResult result) {
        Set<Integer> columnIndexes = new HashSet<>();
        Set<Integer> duplicateIndexes = new HashSet<>();
        
        for (int i = 0; i < requests.size(); i++) {
            ColumnConfigRequest request = requests.get(i);
            Integer columnIndex = request.getColumnIndex();
            
            if (columnIndexes.contains(columnIndex)) {
                duplicateIndexes.add(columnIndex);
            } else {
                columnIndexes.add(columnIndex);
            }
        }
        
        for (Integer duplicateIndex : duplicateIndexes) {
            result.addError("列索引重复: " + duplicateIndex);
        }
    }
    
    /**
     * 简单的JSON格式验证
     */
    private static boolean isValidJsonFormat(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty()) {
            return false;
        }
        
        String trimmed = jsonString.trim();
        return (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
               (trimmed.startsWith("[") && trimmed.endsWith("]"));
    }
    
    /**
     * 批量验证结果
     */
    public static class BatchValidationResult {
        private final List<String> errors = new ArrayList<>();
        private final List<String> warnings = new ArrayList<>();
        
        public void addError(String error) {
            errors.add(error);
        }
        
        public void addWarning(String warning) {
            warnings.add(warning);
        }
        
        public List<String> getErrors() {
            return new ArrayList<>(errors);
        }
        
        public List<String> getWarnings() {
            return new ArrayList<>(warnings);
        }
        
        public boolean hasErrors() {
            return !errors.isEmpty();
        }
        
        public boolean hasWarnings() {
            return !warnings.isEmpty();
        }
        
        public boolean isValid() {
            return !hasErrors();
        }
        
        public String getErrorMessage() {
            return String.join("; ", errors);
        }
        
        public String getWarningMessage() {
            return String.join("; ", warnings);
        }
        
        public int getErrorCount() {
            return errors.size();
        }
        
        public int getWarningCount() {
            return warnings.size();
        }
    }
}