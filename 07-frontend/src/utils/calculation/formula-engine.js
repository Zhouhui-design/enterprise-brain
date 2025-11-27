/**
 * 公式计算引擎
 * 支持基础运算、函数计算和变量替换
 */
class FormulaEngine {
  constructor() {
    // 预定义函数库
    this.functions = {
      // 数学函数
      SUM: (...args) => args.reduce((sum, val) => sum + (parseFloat(val) || 0), 0),
      AVG: (...args) => {
        const nums = args.map(val => parseFloat(val) || 0);
        return nums.length > 0 ? nums.reduce((sum, val) => sum + val, 0) / nums.length : 0;
      },
      MAX: (...args) => Math.max(...args.map(val => parseFloat(val) || -Infinity)),
      MIN: (...args) => Math.min(...args.map(val => parseFloat(val) || Infinity)),
      ROUND: (val, decimals = 0) => Math.round(parseFloat(val) * Math.pow(10, decimals)) / Math.pow(10, decimals),
      ABS: (val) => Math.abs(parseFloat(val) || 0),
      SQRT: (val) => Math.sqrt(Math.abs(parseFloat(val) || 0)),
      POW: (base, exponent) => Math.pow(parseFloat(base) || 0, parseFloat(exponent) || 0),
      
      // 逻辑函数
      IF: (condition, trueVal, falseVal) => condition ? trueVal : falseVal,
      AND: (...args) => args.every(Boolean),
      OR: (...args) => args.some(Boolean),
      NOT: (val) => !val,
      
      // 文本函数
      CONCAT: (...args) => args.join(''),
      LENGTH: (text) => String(text || '').length,
      SUBSTRING: (text, start, length) => String(text || '').substring(parseInt(start) || 0, parseInt(length) || undefined),
      
      // 日期函数
      TODAY: () => new Date().toISOString().split('T')[0],
      DATEDIF: (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
      }
    };
  }

  /**
   * 解析并计算公式
   * @param {string} formula - 公式字符串
   * @param {Object} variables - 变量映射对象
   * @returns {*} 计算结果
   */
  evaluate(formula, variables = {}) {
    try {
      // 移除多余空格
      formula = formula.replace(/\s+/g, '');
      
      // 替换变量
      let processedFormula = formula;
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        processedFormula = processedFormula.replace(regex, variables[key]);
      });
      
      // 处理函数调用
      processedFormula = this._processFunctions(processedFormula);
      
      // 计算表达式（使用Function构造器，注意安全风险）
      const result = this._safeEval(processedFormula);
      return result;
    } catch (error) {
      console.error('公式计算错误:', error);
      throw new Error(`公式计算失败: ${formula}`);
    }
  }

  /**
   * 处理函数调用
   * @private
   */
  _processFunctions(formula) {
    let result = formula;
    const functionRegex = /([A-Z]+)\\(([^)]+)\\)/g;
    let match;
    
    while ((match = functionRegex.exec(formula)) !== null) {
      const funcName = match[1];
      const argsStr = match[2];
      
      if (this.functions[funcName]) {
        const args = this._parseArgs(argsStr);
        const funcResult = this.functions[funcName](...args);
        result = result.replace(match[0], funcResult);
      }
    }
    
    return result;
  }

  /**
   * 解析函数参数
   * @private
   */
  _parseArgs(argsStr) {
    const args = [];
    let currentArg = '';
    let bracketLevel = 0;
    
    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];
      
      if (char === ',' && bracketLevel === 0) {
        args.push(currentArg.trim());
        currentArg = '';
      } else {
        if (char === '(') bracketLevel++;
        if (char === ')') bracketLevel--;
        currentArg += char;
      }
    }
    
    if (currentArg.trim()) {
      args.push(currentArg.trim());
    }
    
    return args;
  }

  /**
   * 安全计算表达式
   * @private
   */
  _safeEval(expression) {
    // 只允许基本数学运算和常量
    const allowedPattern = /^[0-9+\-*/.%()\[\]]+$/;
    
    // 检查是否包含不安全的字符
    if (!allowedPattern.test(expression)) {
      throw new Error('表达式包含不安全的字符');
    }
    
    // 使用Function构造器计算
    return new Function(`'use strict'; return ${expression};`)();
  }

  /**
   * 注册自定义函数
   * @param {string} name - 函数名
   * @param {Function} fn - 函数实现
   */
  registerFunction(name, fn) {
    if (typeof fn !== 'function') {
      throw new Error('注册的必须是函数');
    }
    this.functions[name.toUpperCase()] = fn;
  }

  /**
   * 验证公式语法
   * @param {string} formula - 公式字符串
   * @returns {boolean} 是否有效
   */
  validate(formula) {
    try {
      // 使用安全的方式验证公式
      this.evaluate(formula, { TEST: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取公式中使用的变量列表
   * @param {string} formula - 公式字符串
   * @returns {string[]} 变量名列表
   */
  extractVariables(formula) {
    const variables = new Set();
    // 简单的变量提取规则：字母开头，后面跟字母、数字或下划线
    const variableRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s*\()/g;
    let match;
    
    while ((match = variableRegex.exec(formula)) !== null) {
      // 排除内置函数名
      if (!this.functions[match[1].toUpperCase()]) {
        variables.add(match[1]);
      }
    }
    
    return Array.from(variables);
  }

  /**
   * 计算字符串表达式（简单版本）
   * @param {string} expr - 数学表达式
   * @returns {number} 计算结果
   */
  calculateExpression(expr) {
    try {
      // 非常简单的安全检查
      if (/[^0-9+\-*/.%()\s]/.test(expr)) {
        throw new Error('表达式包含非法字符');
      }
      return new Function(`'use strict'; return ${expr};`)();
    } catch (error) {
      console.error('表达式计算错误:', error);
      throw new Error(`无法计算表达式: ${expr}`);
    }
  }
}

// 导出单例实例
const formulaEngine = new FormulaEngine();
export default formulaEngine;
export { FormulaEngine };