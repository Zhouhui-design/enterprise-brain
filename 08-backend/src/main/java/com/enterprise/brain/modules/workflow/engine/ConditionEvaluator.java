/**
 * 条件评估器类
 * 负责评估工作流中的条件表达式
 */
package com.enterprise.brain.modules.workflow.engine;

import java.util.*;
import java.util.regex.*;

/**
 * 条件评估器，支持多种表达式语法的评估
 */
public class ConditionEvaluator {
    private static final ConditionEvaluator INSTANCE = new ConditionEvaluator();
    
    // 表达式解析器映射
    private final Map<String, ExpressionParser> expressionParsers = new HashMap<>();
    
    // 默认表达式语法类型
    private static final String DEFAULT_SYNTAX = "simple";

    private ConditionEvaluator() {
        // 注册默认的表达式解析器
        registerParser("simple", new SimpleExpressionParser());
        registerParser("spel", new SpelExpressionParser());
        registerParser("javascript", new JavaScriptExpressionParser());
    }

    /**
     * 获取条件评估器实例
     */
    public static ConditionEvaluator getInstance() {
        return INSTANCE;
    }

    /**
     * 注册表达式解析器
     * @param syntax 语法类型
     * @param parser 解析器实例
     */
    public void registerParser(String syntax, ExpressionParser parser) {
        expressionParsers.put(syntax, parser);
    }

    /**
     * 评估条件表达式
     * @param expression 表达式字符串
     * @param variables 变量上下文
     * @return 评估结果
     */
    public boolean evaluate(String expression, Map<String, Object> variables) {
        if (expression == null || expression.trim().isEmpty()) {
            return true; // 空表达式默认为true
        }

        try {
            // 解析表达式语法类型
            String syntax = DEFAULT_SYNTAX;
            String actualExpression = expression;
            
            // 检查是否有语法前缀，如 "spel:expression" 或 "javascript:expression"
            int colonIndex = expression.indexOf(':');
            if (colonIndex > 0) {
                String syntaxPrefix = expression.substring(0, colonIndex).trim();
                if (expressionParsers.containsKey(syntaxPrefix)) {
                    syntax = syntaxPrefix;
                    actualExpression = expression.substring(colonIndex + 1).trim();
                }
            }

            // 获取对应的解析器
            ExpressionParser parser = expressionParsers.get(syntax);
            if (parser == null) {
                throw new IllegalArgumentException("未知的表达式语法: " + syntax);
            }

            // 评估表达式
            return parser.evaluate(actualExpression, variables);
        } catch (Exception e) {
            // 表达式评估失败，记录异常并返回false
            System.err.println("条件表达式评估失败: " + expression);
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 验证表达式语法是否正确
     * @param expression 表达式字符串
     * @return 是否有效
     */
    public boolean validateExpression(String expression) {
        if (expression == null || expression.trim().isEmpty()) {
            return true;
        }

        try {
            // 解析表达式语法类型
            String syntax = DEFAULT_SYNTAX;
            String actualExpression = expression;
            
            int colonIndex = expression.indexOf(':');
            if (colonIndex > 0) {
                String syntaxPrefix = expression.substring(0, colonIndex).trim();
                if (expressionParsers.containsKey(syntaxPrefix)) {
                    syntax = syntaxPrefix;
                    actualExpression = expression.substring(colonIndex + 1).trim();
                }
            }

            // 获取对应的解析器
            ExpressionParser parser = expressionParsers.get(syntax);
            if (parser == null) {
                return false;
            }

            // 验证表达式
            return parser.validate(actualExpression);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 预处理表达式，进行变量替换或其他转换
     * @param expression 原始表达式
     * @param variables 变量上下文
     * @return 处理后的表达式
     */
    public String preprocessExpression(String expression, Map<String, Object> variables) {
        if (expression == null || variables == null) {
            return expression;
        }

        // 简单变量替换，格式：${variableName}
        Pattern pattern = Pattern.compile("\\$\\{([^\\}]*)\\}");
        Matcher matcher = pattern.matcher(expression);
        StringBuffer sb = new StringBuffer();
        
        while (matcher.find()) {
            String variableName = matcher.group(1);
            Object value = variables.get(variableName);
            String replacement = value != null ? value.toString() : "null";
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        
        return sb.toString();
    }

    /**
     * 表达式解析器接口
     */
    public interface ExpressionParser {
        /**
         * 评估表达式
         * @param expression 表达式字符串
         * @param variables 变量上下文
         * @return 评估结果
         */
        boolean evaluate(String expression, Map<String, Object> variables) throws Exception;
        
        /**
         * 验证表达式语法
         * @param expression 表达式字符串
         * @return 是否有效
         */
        boolean validate(String expression);
    }

    /**
     * 简单表达式解析器，支持基本的比较操作
     */
    private static class SimpleExpressionParser implements ExpressionParser {
        // 支持的操作符优先级
        private static final Map<String, Integer> OPERATOR_PRIORITY = new HashMap<>();
        static {
            OPERATOR_PRIORITY.put("(", 0);
            OPERATOR_PRIORITY.put(")", 0);
            OPERATOR_PRIORITY.put("==", 1);
            OPERATOR_PRIORITY.put("!=", 1);
            OPERATOR_PRIORITY.put(">", 1);
            OPERATOR_PRIORITY.put("<", 1);
            OPERATOR_PRIORITY.put(">=", 1);
            OPERATOR_PRIORITY.put("<=", 1);
            OPERATOR_PRIORITY.put("&&", 2);
            OPERATOR_PRIORITY.put("||", 2);
        }

        @Override
        public boolean evaluate(String expression, Map<String, Object> variables) throws Exception {
            // 简单表达式：变量比较、逻辑运算等
            expression = expression.trim();
            
            // 处理括号
            if (expression.startsWith("(") && expression.endsWith(")")) {
                int depth = 0;
                boolean hasInnerParentheses = false;
                for (int i = 1; i < expression.length() - 1; i++) {
                    char c = expression.charAt(i);
                    if (c == '(') depth++;
                    if (c == ')') depth--;
                    if (depth < 0) break;
                }
                if (depth == 0) {
                    return evaluate(expression.substring(1, expression.length() - 1), variables);
                }
            }

            // 处理逻辑运算符
            String[] parts = splitExpression(expression, "||");
            if (parts.length > 1) {
                for (String part : parts) {
                    if (evaluate(part, variables)) {
                        return true;
                    }
                }
                return false;
            }

            parts = splitExpression(expression, "&&");
            if (parts.length > 1) {
                for (String part : parts) {
                    if (!evaluate(part, variables)) {
                        return false;
                    }
                }
                return true;
            }

            // 处理比较运算符
            String[] operators = {"==", "!=", ">=", "<=", ">", "<"};
            for (String operator : operators) {
                int index = expression.indexOf(operator);
                if (index > 0) {
                    String leftStr = expression.substring(0, index).trim();
                    String rightStr = expression.substring(index + operator.length()).trim();
                    
                    Object left = getValue(leftStr, variables);
                    Object right = getValue(rightStr, variables);
                    
                    return compareValues(left, right, operator);
                }
            }

            // 处理单个布尔值或变量
            Object value = getValue(expression, variables);
            return Boolean.TRUE.equals(value);
        }

        @Override
        public boolean validate(String expression) {
            try {
                // 简单的语法验证
                expression = expression.trim();
                
                // 检查括号匹配
                int depth = 0;
                for (char c : expression.toCharArray()) {
                    if (c == '(') depth++;
                    if (c == ')') depth--;
                    if (depth < 0) return false;
                }
                if (depth != 0) return false;
                
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        private String[] splitExpression(String expression, String operator) {
            List<String> parts = new ArrayList<>();
            int depth = 0;
            int lastIndex = 0;
            
            for (int i = 0; i <= expression.length() - operator.length(); i++) {
                if (expression.charAt(i) == '(') depth++;
                if (expression.charAt(i) == ')') depth--;
                
                if (depth == 0 && expression.substring(i, i + operator.length()).equals(operator)) {
                    parts.add(expression.substring(lastIndex, i).trim());
                    lastIndex = i + operator.length();
                    i += operator.length() - 1;
                }
            }
            
            parts.add(expression.substring(lastIndex).trim());
            
            return parts.size() > 1 ? parts.toArray(new String[0]) : new String[]{expression};
        }

        private Object getValue(String valueStr, Map<String, Object> variables) {
            // 处理常量
            if (valueStr.equals("true")) return Boolean.TRUE;
            if (valueStr.equals("false")) return Boolean.FALSE;
            if (valueStr.equals("null")) return null;
            
            // 处理数字
            try {
                if (valueStr.contains(".")) {
                    return Double.parseDouble(valueStr);
                } else {
                    return Long.parseLong(valueStr);
                }
            } catch (NumberFormatException e) {
                // 不是数字，继续处理
            }
            
            // 处理字符串（带引号）
            if ((valueStr.startsWith("'")) && (valueStr.endsWith("'")) || 
                (valueStr.startsWith("\"") && valueStr.endsWith("\""))) {
                return valueStr.substring(1, valueStr.length() - 1);
            }
            
            // 处理变量
            return variables.get(valueStr);
        }

        private boolean compareValues(Object left, Object right, String operator) {
            if (left == right) return true;
            if (left == null || right == null) return false;
            
            switch (operator) {
                case "==":
                    return left.equals(right);
                case "!=":
                    return !left.equals(right);
                case ">":
                    return compare(left, right) > 0;
                case "<":
                    return compare(left, right) < 0;
                case ">=":
                    return compare(left, right) >= 0;
                case "<=":
                    return compare(left, right) <= 0;
                default:
                    return false;
            }
        }

        private int compare(Object left, Object right) {
            if (left instanceof Comparable && left.getClass().equals(right.getClass())) {
                return ((Comparable) left).compareTo(right);
            }
            // 转换为字符串比较
            return left.toString().compareTo(right.toString());
        }
    }

    /**
     * Spring EL表达式解析器（简化版）
     */
    private static class SpelExpressionParser implements ExpressionParser {
        @Override
        public boolean evaluate(String expression, Map<String, Object> variables) throws Exception {
            // 这里是一个简化实现，实际应用中可以集成Spring Expression Language
            // 这里使用简单表达式解析器作为后备
            return new SimpleExpressionParser().evaluate(expression, variables);
        }

        @Override
        public boolean validate(String expression) {
            // 简单验证
            return expression != null && !expression.trim().isEmpty();
        }
    }

    /**
     * JavaScript表达式解析器（简化版）
     */
    private static class JavaScriptExpressionParser implements ExpressionParser {
        @Override
        public boolean evaluate(String expression, Map<String, Object> variables) throws Exception {
            // 这里是一个简化实现，实际应用中可以使用ScriptEngine
            // 这里使用简单表达式解析器作为后备
            return new SimpleExpressionParser().evaluate(expression, variables);
        }

        @Override
        public boolean validate(String expression) {
            // 简单验证
            return expression != null && !expression.trim().isEmpty();
        }
    }
}