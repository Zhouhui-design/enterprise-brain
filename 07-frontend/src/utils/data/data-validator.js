/**
 * 数据验证工具
 * 提供各类数据验证规则和方法，支持自定义验证规则
 */
class DataValidator {
  constructor() {
    // 预定义的验证规则
    this.rules = {
      // 基础类型验证
      required: value => value !== undefined && value !== null && value !== '',
      
      // 数值验证
      number: value => typeof value === 'number' && !isNaN(value),
      integer: value => Number.isInteger(value),
      positive: value => typeof value === 'number' && value > 0,
      negative: value => typeof value === 'number' && value < 0,
      nonNegative: value => typeof value === 'number' && value >= 0,
      
      // 范围验证
      min: (value, param) => typeof value === 'number' && value >= param,
      max: (value, param) => typeof value === 'number' && value <= param,
      range: (value, [min, max]) => typeof value === 'number' && value >= min && value <= max,
      
      // 字符串验证
      string: value => typeof value === 'string',
      email: value => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return typeof value === 'string' && emailRegex.test(value);
      },
      url: value => {
        try {
          new URL(value);
          return true;
        } catch (e) {
          return false;
        }
      },
      phone: value => {
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
        return typeof value === 'string' && phoneRegex.test(value.replace(/\s/g, ''));
      },
      length: (value, param) => typeof value === 'string' && value.length === param,
      minLength: (value, param) => typeof value === 'string' && value.length >= param,
      maxLength: (value, param) => typeof value === 'string' && value.length <= param,
      
      // 数组验证
      array: value => Array.isArray(value),
      arrayMin: (value, param) => Array.isArray(value) && value.length >= param,
      arrayMax: (value, param) => Array.isArray(value) && value.length <= param,
      
      // 日期验证
      date: value => value instanceof Date && !isNaN(value.getTime()),
      dateBefore: (value, param) => {
        const dateValue = value instanceof Date ? value : new Date(value);
        const compareDate = param instanceof Date ? param : new Date(param);
        return !isNaN(dateValue.getTime()) && !isNaN(compareDate.getTime()) && 
               dateValue < compareDate;
      },
      dateAfter: (value, param) => {
        const dateValue = value instanceof Date ? value : new Date(value);
        const compareDate = param instanceof Date ? param : new Date(param);
        return !isNaN(dateValue.getTime()) && !isNaN(compareDate.getTime()) && 
               dateValue > compareDate;
      },
      
      // 正则表达式验证
      pattern: (value, regex) => {
        if (typeof regex === 'string') {
          regex = new RegExp(regex);
        }
        return regex instanceof RegExp && regex.test(value);
      },
      
      // 枚举验证
      enum: (value, allowedValues) => allowedValues.includes(value),
      
      // 对象验证
      object: value => typeof value === 'object' && value !== null && !Array.isArray(value),
      hasKey: (value, key) => typeof value === 'object' && value !== null && key in value,
      
      // 布尔值验证
      boolean: value => typeof value === 'boolean'
    };

    // 错误消息模板
    this.errorMessages = {
      required: '此字段为必填项',
      number: '请输入有效的数字',
      integer: '请输入整数',
      positive: '请输入正数',
      negative: '请输入负数',
      nonNegative: '请输入非负数',
      min: (field, param) => `最小值为 ${param}`,
      max: (field, param) => `最大值为 ${param}`,
      range: (field, [min, max]) => `值必须在 ${min} 到 ${max} 之间`,
      string: '请输入字符串',
      email: '请输入有效的邮箱地址',
      url: '请输入有效的网址',
      phone: '请输入有效的电话号码',
      length: (field, param) => `长度必须为 ${param} 个字符`,
      minLength: (field, param) => `长度至少为 ${param} 个字符`,
      maxLength: (field, param) => `长度最多为 ${param} 个字符`,
      array: '请输入数组',
      arrayMin: (field, param) => `至少需要 ${param} 个元素`,
      arrayMax: (field, param) => `最多只能有 ${param} 个元素`,
      date: '请输入有效的日期',
      dateBefore: (field, param) => `日期必须早于 ${param}`,
      dateAfter: (field, param) => `日期必须晚于 ${param}`,
      pattern: '格式不正确',
      enum: (field, values) => `值必须是 ${values.join(', ')} 中的一个`,
      object: '请输入对象',
      hasKey: (field, key) => `必须包含键 ${key}`,
      boolean: '请输入布尔值'
    };
  }

  /**
   * 验证单个值
   * @param {*} value - 要验证的值
   * @param {string|Function|Array} rule - 验证规则
   * @param {*} param - 规则参数
   * @returns {boolean} 验证结果
   */
  validate(value, rule, param = null) {
    if (typeof rule === 'function') {
      // 自定义验证函数
      return rule(value, param);
    }
    
    if (typeof rule === 'string') {
      // 预定义规则
      if (this.rules[rule]) {
        return this.rules[rule](value, param);
      }
      throw new Error(`未知的验证规则: ${rule}`);
    }
    
    if (Array.isArray(rule)) {
      // 规则数组，全部通过才算通过
      return rule.every(r => {
        if (Array.isArray(r)) {
          const [subRule, subParam] = r;
          return this.validate(value, subRule, subParam);
        }
        return this.validate(value, r);
      });
    }
    
    throw new Error('无效的验证规则');
  }

  /**
   * 验证对象
   * @param {Object} data - 要验证的数据对象
   * @param {Object} schema - 验证规则对象 {field: rules}
   * @returns {Object} 验证结果 {valid: boolean, errors: Object}
   */
  validateObject(data, schema) {
    const errors = {};
    
    // 遍历规则，验证每个字段
    Object.entries(schema).forEach(([field, rules]) => {
      const value = data[field];
      const fieldErrors = this._validateField(value, rules, field);
      
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    });
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * 验证字段（内部方法）
   * @private
   */
  _validateField(value, rules, fieldName) {
    const errors = [];
    
    // 处理规则数组
    if (Array.isArray(rules)) {
      rules.forEach(rule => {
        this._applyRule(value, rule, fieldName, errors);
      });
    } else if (typeof rules === 'object') {
      // 处理规则对象 {rule: param, ...}
      Object.entries(rules).forEach(([ruleName, param]) => {
        this._applyRule(value, ruleName, fieldName, errors, param);
      });
    } else {
      // 单个规则
      this._applyRule(value, rules, fieldName, errors);
    }
    
    return errors;
  }

  /**
   * 应用单个规则（内部方法）
   * @private
   */
  _applyRule(value, rule, fieldName, errors, param = null) {
    // 特殊处理required规则：只有非空值才需要应用其他规则
    if (rule === 'required') {
      if (!this.validate(value, 'required')) {
        errors.push(this._getErrorMessage('required', fieldName));
      }
    } else if (value !== undefined && value !== null && value !== '') {
      // 对于非必填字段，如果为空则跳过验证
      if (!this.validate(value, rule, param)) {
        errors.push(this._getErrorMessage(rule, fieldName, param));
      }
    }
  }

  /**
   * 获取错误消息（内部方法）
   * @private
   */
  _getErrorMessage(rule, fieldName, param = null) {
    const message = this.errorMessages[rule];
    
    if (typeof message === 'function') {
      return message(fieldName, param);
    }
    
    return message || `验证失败: ${rule}`;
  }

  /**
   * 添加自定义验证规则
   * @param {string} name - 规则名称
   * @param {Function} validator - 验证函数
   * @param {string|Function} errorMessage - 错误消息
   */
  addRule(name, validator, errorMessage = null) {
    if (typeof name !== 'string' || typeof validator !== 'function') {
      throw new Error('规则名称必须是字符串，验证函数必须是函数');
    }
    
    this.rules[name] = validator;
    
    if (errorMessage) {
      this.errorMessages[name] = errorMessage;
    }
  }

  /**
   * 自定义错误消息
   * @param {string} rule - 规则名称
   * @param {string|Function} message - 错误消息
   */
  setErrorMessage(rule, message) {
    if (rule in this.rules) {
      this.errorMessages[rule] = message;
    } else {
      throw new Error(`未知的验证规则: ${rule}`);
    }
  }

  /**
   * 批量验证多个对象
   * @param {Array} items - 要验证的对象数组
   * @param {Object} schema - 验证规则对象
   * @returns {Array} 验证结果数组
   */
  validateBatch(items, schema) {
    if (!Array.isArray(items)) {
      throw new Error('items参数必须是数组');
    }
    
    return items.map(item => this.validateObject(item, schema));
  }

  /**
   * 验证数据是否符合指定类型
   * @param {*} value - 要验证的值
   * @param {string} type - 类型名称
   * @returns {boolean} 验证结果
   */
  validateType(value, type) {
    const typeCheckers = {
      'string': val => typeof val === 'string',
      'number': val => typeof val === 'number' && !isNaN(val),
      'boolean': val => typeof val === 'boolean',
      'array': val => Array.isArray(val),
      'object': val => typeof val === 'object' && val !== null && !Array.isArray(val),
      'date': val => val instanceof Date && !isNaN(val.getTime()),
      'function': val => typeof val === 'function',
      'null': val => val === null,
      'undefined': val => val === undefined
    };
    
    if (typeCheckers[type]) {
      return typeCheckers[type](value);
    }
    
    // 处理构造函数类型检查
    if (typeof type === 'function') {
      return value instanceof type;
    }
    
    throw new Error(`不支持的类型检查: ${type}`);
  }

  /**
   * 验证数组中的每个元素
   * @param {Array} array - 要验证的数组
   * @param {*} rule - 验证规则
   * @returns {Object} 验证结果 {valid: boolean, errors: Array}
   */
  validateArrayElements(array, rule) {
    if (!Array.isArray(array)) {
      return {
        valid: false,
        errors: ['数据必须是数组']
      };
    }
    
    const errors = [];
    
    array.forEach((item, index) => {
      if (!this.validate(item, rule)) {
        errors.push(`索引 ${index} 的元素验证失败`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证嵌套对象
   * @param {Object} data - 要验证的数据对象
   * @param {Object} schema - 嵌套验证规则
   * @returns {Object} 验证结果
   */
  validateNested(data, schema) {
    if (typeof schema !== 'object' || schema === null) {
      throw new Error('schema必须是对象');
    }

    const result = this.validateObject(data, schema.base || {});
    const nestedErrors = {};
    let hasNestedErrors = false;

    // 处理嵌套验证
    Object.entries(schema.nested || {}).forEach(([field, nestedSchema]) => {
      if (data[field]) {
        const nestedResult = this.validateNested(data[field], nestedSchema);
        if (!nestedResult.valid) {
          nestedErrors[field] = nestedResult.errors;
          hasNestedErrors = true;
        }
      }
    });

    // 合并结果
    return {
      valid: result.valid && !hasNestedErrors,
      errors: {
        ...result.errors,
        ...nestedErrors
      }
    };
  }

  /**
   * 清理并验证数据（移除未定义的字段，验证剩余字段）
   * @param {Object} data - 要处理的数据
   * @param {Object} schema - 验证规则
   * @returns {Object} {valid: boolean, data: Object, errors: Object}
   */
  sanitizeAndValidate(data, schema) {
    // 创建只包含schema中定义字段的新对象
    const sanitized = {};
    Object.keys(schema).forEach(field => {
      if (field in data) {
        sanitized[field] = data[field];
      }
    });

    // 验证清理后的数据
    const validationResult = this.validateObject(sanitized, schema);
    
    return {
      valid: validationResult.valid,
      data: sanitized,
      errors: validationResult.errors
    };
  }

  /**
   * 生成验证摘要
   * @param {Object} errors - 验证错误对象
   * @returns {string} 错误摘要
   */
  getValidationSummary(errors) {
    if (!errors || Object.keys(errors).length === 0) {
      return '验证通过';
    }

    let summary = '验证失败：\n';
    Object.entries(errors).forEach(([field, fieldErrors]) => {
      summary += `  ${field}: ${fieldErrors.join(', ')}\n`;
    });

    return summary.trim();
  }

  /**
   * 检查是否有任何必填字段缺失
   * @param {Object} data - 数据对象
   * @param {Array} requiredFields - 必填字段数组
   * @returns {Array} 缺失的字段数组
   */
  getMissingRequiredFields(data, requiredFields) {
    return requiredFields.filter(field => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });
  }
}

// 导出单例实例
const dataValidator = new DataValidator();
export default dataValidator;
export { DataValidator };