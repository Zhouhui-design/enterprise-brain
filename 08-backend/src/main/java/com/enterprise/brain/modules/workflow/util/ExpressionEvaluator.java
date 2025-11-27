/**
 * 表达式计算器类
 * 负责计算工作流中的表达式和脚本
 */
package com.enterprise.brain.modules.workflow.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.script.*;
import java.util.*;
import java.util.regex.*;

/**
 * 表达式计算器，支持多种表达式语言和脚本语言的计算
 */
public class ExpressionEvaluator {
    private static final ExpressionEvaluator INSTANCE = new ExpressionEvaluator();
    private static final Logger logger = LoggerFactory.getLogger(ExpressionEvaluator.class);
    
    // JavaScript引擎
    private final ScriptEngineManager scriptEngineManager = new ScriptEngineManager();
    private final Map<String, ScriptEngine> scriptEngines = new HashMap<>();
    
    // 表达式缓存
    private final Map<String, CompiledScript> compiledScriptCache = new HashMap<>();
    
    // 表达式前缀和引擎映射
    private static final Map<String, String> EXPRESSION_PREFIX_ENGINE = new HashMap<>();
    static {
        EXPRESSION_PREFIX_ENGINE.put("js:", "javascript");
        EXPRESSION_PREFIX_ENGINE.put("groovy:", "groovy");
        EXPRESSION_PREFIX_ENGINE.put("ruby:", "jruby");
    }

    private ExpressionEvaluator() {
        // 初始化常用脚本引擎
        initScriptEngines();
    }

    /**
     * 获取表达式计算器实例
     */
    public static ExpressionEvaluator getInstance() {
        return INSTANCE;
    }

    /**
     * 初始化脚本引擎
     */
    private void initScriptEngines() {
        try {
            // 尝试获取JavaScript引擎
            ScriptEngine jsEngine = scriptEngineManager.getEngineByName("javascript");
            if (jsEngine != null) {
                scriptEngines.put("javascript", jsEngine);
                logger.info("已初始化JavaScript脚本引擎");
            }

            // 尝试获取其他引擎（如果可用）
            ScriptEngine groovyEngine = scriptEngineManager.getEngineByName("groovy");
            if (groovyEngine != null) {
                scriptEngines.put("groovy", groovyEngine);
                logger.info("已初始化Groovy脚本引擎");
            }
        } catch (Exception e) {
            logger.warn("初始化脚本引擎时发生异常", e);
        }
    }

    /**
     * 计算表达式的值
     * @param expression 表达式字符串
     * @param variables 变量上下文
     * @return 表达式计算结果
     */
    public Object evaluate(String expression, Map<String, Object> variables) {
        if (expression == null || expression.trim().isEmpty()) {
            return null;
        }

        try {
            // 移除首尾空白
            String trimmedExpression = expression.trim();
            
            // 检查是否有引擎前缀
            String engineName = "javascript"; // 默认使用JavaScript
            String actualExpression = trimmedExpression;
            
            for (Map.Entry<String, String> entry : EXPRESSION_PREFIX_ENGINE.entrySet()) {
                if (trimmedExpression.startsWith(entry.getKey())) {
                    engineName = entry.getValue();
                    actualExpression = trimmedExpression.substring(entry.getKey().length()).trim();
                    break;
                }
            }

            // 根据引擎类型执行表达式
            return evaluateExpression(actualExpression, engineName, variables);
        } catch (Exception e) {
            logger.error("计算表达式失败: {}", expression, e);
            throw new RuntimeException("表达式计算失败: " + e.getMessage(), e);
        }
    }

    /**
     * 使用指定引擎计算表达式
     */
    private Object evaluateExpression(String expression, String engineName, Map<String, Object> variables)
            throws ScriptException {
        // 获取脚本引擎
        ScriptEngine engine = scriptEngines.get(engineName);
        if (engine == null) {
            // 如果找不到指定引擎，尝试重新获取
            engine = scriptEngineManager.getEngineByName(engineName);
            if (engine == null) {
                throw new UnsupportedOperationException("不支持的脚本引擎: " + engineName);
            }
            scriptEngines.put(engineName, engine);
        }

        // 创建绑定上下文
        Bindings bindings = engine.createBindings();
        if (variables != null) {
            bindings.putAll(variables);
        }
        
        // 添加工具类
        bindings.put("logger", logger);
        bindings.put("util", new ExpressionUtil());

        // 对于支持编译的引擎，尝试使用编译缓存
        if (engine instanceof Compilable && expression.length() > 50) { // 只缓存较长的表达式
            String cacheKey = engineName + ":" + expression;
            CompiledScript compiledScript = compiledScriptCache.get(cacheKey);
            
            if (compiledScript == null) {
                synchronized (this) {
                    // 双重检查锁定
                    compiledScript = compiledScriptCache.get(cacheKey);
                    if (compiledScript == null) {
                        compiledScript = ((Compilable) engine).compile(expression);
                        compiledScriptCache.put(cacheKey, compiledScript);
                    }
                }
            }
            return compiledScript.eval(bindings);
        } else {
            // 直接执行表达式
            return engine.eval(expression, bindings);
        }
    }

    /**
     * 计算简单表达式（不使用脚本引擎，适用于基本算术和逻辑运算）
     */
    public Object evaluateSimpleExpression(String expression, Map<String, Object> variables) {
        if (expression == null || expression.trim().isEmpty()) {
            return null;
        }

        try {
            // 处理变量替换
            String processedExpression = replaceVariables(expression, variables);
            
            // 解析并计算表达式
            return parseAndEvaluate(processedExpression);
        } catch (Exception e) {
            logger.error("计算简单表达式失败: {}", expression, e);
            throw new RuntimeException("简单表达式计算失败: " + e.getMessage(), e);
        }
    }

    /**
     * 替换表达式中的变量
     */
    private String replaceVariables(String expression, Map<String, Object> variables) {
        if (variables == null || variables.isEmpty()) {
            return expression;
        }

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
     * 解析并计算简单表达式
     */
    private Object parseAndEvaluate(String expression) {
        // 这是一个简化版的表达式解析器
        // 支持基本的算术运算、比较运算和逻辑运算
        expression = expression.trim();
        
        // 处理括号
        if (expression.startsWith("(") && expression.endsWith(")")) {
            int depth = 0;
            for (int i = 1; i < expression.length() - 1; i++) {
                if (expression.charAt(i) == '(') depth++;
                if (expression.charAt(i) == ')') depth--;
                if (depth < 0) break;
            }
            if (depth == 0) {
                return parseAndEvaluate(expression.substring(1, expression.length() - 1));
            }
        }

        // 处理逻辑运算符 ||
        String[] parts = splitWithBalance(expression, "||");
        if (parts.length > 1) {
            for (String part : parts) {
                Object result = parseAndEvaluate(part);
                if (Boolean.TRUE.equals(result)) {
                    return true;
                }
            }
            return false;
        }

        // 处理逻辑运算符 &&
        parts = splitWithBalance(expression, "&&");
        if (parts.length > 1) {
            for (String part : parts) {
                Object result = parseAndEvaluate(part);
                if (Boolean.FALSE.equals(result)) {
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
                
                Object left = parseAndEvaluate(leftStr);
                Object right = parseAndEvaluate(rightStr);
                
                return compare(left, right, operator);
            }
        }

        // 处理算术运算符
        operators = {"+", "-", "*", "/", "%"};
        for (String operator : operators) {
            int index = findOperatorIndex(expression, operator);
            if (index > 0) {
                String leftStr = expression.substring(0, index).trim();
                String rightStr = expression.substring(index + 1).trim();
                
                Number left = (Number) parseAndEvaluate(leftStr);
                Number right = (Number) parseAndEvaluate(rightStr);
                
                return calculate(left, right, operator);
            }
        }

        // 处理字面量
        if (expression.equalsIgnoreCase("true")) return Boolean.TRUE;
        if (expression.equalsIgnoreCase("false")) return Boolean.FALSE;
        if (expression.equalsIgnoreCase("null")) return null;
        
        // 处理数字
        try {
            if (expression.contains(".")) {
                return Double.parseDouble(expression);
            } else {
                return Long.parseLong(expression);
            }
        } catch (NumberFormatException e) {
            // 不是数字，作为字符串返回
        }
        
        // 处理字符串（带引号）
        if ((expression.startsWith("'") && expression.endsWith("'")) || 
            (expression.startsWith("\"") && expression.endsWith("\""))) {
            return expression.substring(1, expression.length() - 1);
        }
        
        // 其他情况，直接返回字符串
        return expression;
    }

    /**
     * 在考虑括号平衡的情况下分割字符串
     */
    private String[] splitWithBalance(String expression, String delimiter) {
        List<String> parts = new ArrayList<>();
        int depth = 0;
        int lastIndex = 0;
        
        for (int i = 0; i <= expression.length() - delimiter.length(); i++) {
            char c = expression.charAt(i);
            if (c == '(') depth++;
            else if (c == ')') depth--;
            
            if (depth == 0 && expression.substring(i, i + delimiter.length()).equals(delimiter)) {
                parts.add(expression.substring(lastIndex, i).trim());
                lastIndex = i + delimiter.length();
                i += delimiter.length() - 1;
            }
        }
        
        parts.add(expression.substring(lastIndex).trim());
        
        return parts.size() > 1 ? parts.toArray(new String[0]) : new String[]{expression};
    }

    /**
     * 查找运算符索引（考虑括号平衡）
     */
    private int findOperatorIndex(String expression, String operator) {
        int depth = 0;
        for (int i = 0; i <= expression.length() - operator.length(); i++) {
            char c = expression.charAt(i);
            if (c == '(') depth++;
            else if (c == ')') depth--;
            
            if (depth == 0 && expression.substring(i, i + operator.length()).equals(operator)) {
                // 对于减法和负号，需要特殊处理
                if (operator.equals("-") && (i == 0 || 
                    isOperator(expression.charAt(i - 1)) || 
                    expression.charAt(i - 1) == '(')) {
                    continue; // 这是负号而不是减法运算符
                }
                return i;
            }
        }
        return -1;
    }

    /**
     * 判断字符是否为运算符
     */
    private boolean isOperator(char c) {
        return c == '+' || c == '-' || c == '*' || c == '/' || c == '%';
    }

    /**
     * 比较两个值
     */
    private boolean compare(Object left, Object right, String operator) {
        if (left == right) return true;
        if (left == null || right == null) return false;
        
        switch (operator) {
            case "==": return left.equals(right);
            case "!=": return !left.equals(right);
            case ">": return compareValues(left, right) > 0;
            case "<": return compareValues(left, right) < 0;
            case ">=": return compareValues(left, right) >= 0;
            case "<=": return compareValues(left, right) <= 0;
            default: throw new IllegalArgumentException("不支持的比较运算符: " + operator);
        }
    }

    /**
     * 比较两个值的大小
     */
    private int compareValues(Object left, Object right) {
        if (left instanceof Comparable && left.getClass().equals(right.getClass())) {
            return ((Comparable) left).compareTo(right);
        }
        // 转换为字符串比较
        return left.toString().compareTo(right.toString());
    }

    /**
     * 执行算术运算
     */
    private Number calculate(Number left, Number right, String operator) {
        double leftValue = left.doubleValue();
        double rightValue = right.doubleValue();
        
        switch (operator) {
            case "+": return leftValue + rightValue;
            case "-": return leftValue - rightValue;
            case "*": return leftValue * rightValue;
            case "/": 
                if (rightValue == 0) throw new ArithmeticException("除数不能为零");
                return leftValue / rightValue;
            case "%": 
                if (rightValue == 0) throw new ArithmeticException("模数不能为零");
                return leftValue % rightValue;
            default: throw new IllegalArgumentException("不支持的算术运算符: " + operator);
        }
    }

    /**
     * 清除表达式缓存
     */
    public void clearCache() {
        compiledScriptCache.clear();
        logger.info("已清除表达式缓存");
    }

    /**
     * 获取缓存大小
     */
    public int getCacheSize() {
        return compiledScriptCache.size();
    }

    /**
     * 表达式工具类，提供给脚本使用
     */
    public static class ExpressionUtil {
        
        /**
         * 格式化日期
         */
        public String formatDate(Date date, String format) {
            if (date == null) return null;
            // 实际应用中可以使用SimpleDateFormat或DateTimeFormatter
            return date.toString();
        }
        
        /**
         * 生成UUID
         */
        public String uuid() {
            return UUID.randomUUID().toString();
        }
        
        /**
         * 字符串转大写
         */
        public String toUpperCase(String str) {
            return str != null ? str.toUpperCase() : null;
        }
        
        /**
         * 字符串转小写
         */
        public String toLowerCase(String str) {
            return str != null ? str.toLowerCase() : null;
        }
        
        /**
         * 判断对象是否为空
         */
        public boolean isEmpty(Object obj) {
            if (obj == null) return true;
            if (obj instanceof String) return ((String) obj).trim().isEmpty();
            if (obj instanceof Collection) return ((Collection<?>) obj).isEmpty();
            if (obj instanceof Map) return ((Map<?, ?>) obj).isEmpty();
            return false;
        }
        
        /**
         * 安全地获取对象属性
         */
        public Object getProperty(Object obj, String property) {
            if (obj == null || property == null) return null;
            
            try {
                // 使用反射获取属性
                java.lang.reflect.Field field = obj.getClass().getDeclaredField(property);
                field.setAccessible(true);
                return field.get(obj);
            } catch (Exception e) {
                return null;
            }
        }
    }
}