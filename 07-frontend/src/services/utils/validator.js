/**
 * 数据验证工具
 * 提供全面的数据验证功能，支持多种数据类型和验证规则
 */
class Validator {
  constructor() {
    // 默认错误消息
    this.defaultMessages = {
      required: '此字段是必填项',
      type: '数据类型无效',
      min: '值必须大于或等于 {min}',
      max: '值必须小于或等于 {max}',
      minLength: '长度必须大于或等于 {min} 个字符',
      maxLength: '长度必须小于或等于 {max} 个字符',
      pattern: '格式不匹配',
      email: '请输入有效的电子邮件地址',
      url: '请输入有效的URL地址',
      date: '请输入有效的日期',
      time: '请输入有效的时间',
      datetime: '请输入有效的日期时间',
      number: '请输入有效的数字',
      integer: '请输入有效的整数',
      decimal: '请输入有效的小数，最多 {decimals} 位小数',
      positive: '请输入正数',
      negative: '请输入负数',
      nonEmpty: '不能为空',
      equals: '必须等于 {value}',
      notEquals: '不能等于 {value}',
      in: '必须是以下值之一: {values}',
      notIn: '不能是以下值之一: {values}',
      between: '必须在 {min} 到 {max} 之间',
      startsWith: '必须以 {value} 开头',
      endsWith: '必须以 {value} 结尾',
      contains: '必须包含 {value}',
      notContains: '不能包含 {value}',
      alpha: '只能包含字母',
      alphaNumeric: '只能包含字母和数字',
      numeric: '只能包含数字',
      alphanumeric: '只能包含字母、数字和下划线',
      hex: '必须是有效的十六进制格式',
      lowercase: '必须全部是小写字母',
      uppercase: '必须全部是大写字母',
      phone: '请输入有效的电话号码',
      mobile: '请输入有效的手机号码',
      idCard: '请输入有效的身份证号码',
      bankCard: '请输入有效的银行卡号',
      creditCard: '请输入有效的信用卡号',
      currency: '请输入有效的货币格式',
      ip: '请输入有效的IP地址',
      ipv4: '请输入有效的IPv4地址',
      ipv6: '请输入有效的IPv6地址',
      mac: '请输入有效的MAC地址',
      uuid: '请输入有效的UUID',
      json: '请输入有效的JSON格式',
      base64: '请输入有效的Base64编码',
      custom: '验证失败',
      array: '必须是数组',
      object: '必须是对象',
      boolean: '必须是布尔值',
      function: '必须是函数',
      null: '必须是null',
      undefined: '必须是undefined',
      requiredIf: '当 {field} 等于 {value} 时，此字段是必填项',
      requiredUnless: '当 {field} 不等于 {value} 时，此字段是必填项',
      requiredWith: '当 {fields} 存在时，此字段是必填项',
      requiredWithAll: '当所有 {fields} 存在时，此字段是必填项',
      requiredWithout: '当 {fields} 不存在时，此字段是必填项',
      requiredWithoutAll: '当所有 {fields} 不存在时，此字段是必填项',
      same: '必须与 {field} 相同',
      different: '必须与 {field} 不同',
      before: '必须在 {date} 之前',
      after: '必须在 {date} 之后',
      isTrue: '必须为true',
      isFalse: '必须为false',
      empty: '必须为空',
      unique: '值必须唯一',
      digits: '必须是 {length} 位数字',
      digitsBetween: '必须是 {min} 到 {max} 位数字',
      mimetype: '必须是以下类型之一: {types}',
      ext: '文件扩展名必须是以下之一: {extensions}',
      size: '文件大小必须小于或等于 {size}',
      minSize: '文件大小必须大于或等于 {min}',
      maxSize: '文件大小必须小于或等于 {max}'
    };
    
    // 自定义规则存储
    this.customRules = new Map();
    
    // 常用正则表达式
    this.regex = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
      phone: /^\d{7,15}$/,
      mobile: /^1[3-9]\d{9}$/,
      idCard: /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
      bankCard: /^\d{16,19}$/,
      creditCard: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})$/,
      ipv4: /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)(\.(?!$)|$)){4}$/,
      ipv6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
      mac: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
      uuid: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      alpha: /^[a-zA-Z]+$/,
      alphaNumeric: /^[a-zA-Z0-9]+$/,
      alphanumeric: /^[a-zA-Z0-9_]+$/,
      hex: /^#[0-9A-Fa-f]{6}$/,
      lowercase: /^[a-z]+$/,
      uppercase: /^[A-Z]+$/,
      currency: /^\d+(\.\d{2})?$/
    };
  }

  /**
   * 设置自定义错误消息
   * @param {Object} messages - 错误消息映射
   * @returns {Validator} 实例自身
   */
  setMessages(messages) {
    this.defaultMessages = { ...this.defaultMessages, ...messages };
    return this;
  }

  /**
   * 获取错误消息
   * @param {string} rule - 规则名称
   * @param {Object} params - 参数对象
   * @returns {string} 错误消息
   */
  getMessage(rule, params = {}) {
    let message = this.defaultMessages[rule] || this.defaultMessages.custom;
    
    // 替换消息中的占位符
    Object.entries(params).forEach(([key, value]) => {
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    
    return message;
  }

  /**
   * 添加自定义验证规则
   * @param {string} name - 规则名称
   * @param {Function} validator - 验证函数
   * @param {string} message - 错误消息（可选）
   * @returns {Validator} 实例自身
   */
  addRule(name, validator, message) {
    this.customRules.set(name, validator);
    if (message) {
      this.defaultMessages[name] = message;
    }
    return this;
  }

  /**
   * 获取自定义规则
   * @param {string} name - 规则名称
   * @returns {Function|null} 验证函数
   */
  getRule(name) {
    return this.customRules.get(name);
  }

  /**
   * 移除自定义规则
   * @param {string} name - 规则名称
   * @returns {Validator} 实例自身
   */
  removeRule(name) {
    this.customRules.delete(name);
    return this;
  }

  /**
   * 清除所有自定义规则
   * @returns {Validator} 实例自身
   */
  clearRules() {
    this.customRules.clear();
    return this;
  }

  /**
   * 验证单个值
   * @param {any} value - 要验证的值
   * @param {Object|Array|Function|string} rules - 验证规则
   * @param {Object} options - 选项
   * @returns {Object} 验证结果 { valid: boolean, errors: Array }
   */
  validate(value, rules, options = {}) {
    const errors = [];
    
    // 标准化规则格式
    const normalizedRules = this._normalizeRules(rules);
    
    // 执行验证
    for (const [rule, params] of Object.entries(normalizedRules)) {
      // 跳过空值的非required规则
      if (value === undefined || value === null || value === '' || value === NaN) {
        if (rule !== 'required' && rule !== 'nonEmpty' && rule !== 'empty') {
          continue;
        }
      }
      
      // 执行验证
      const isValid = this._validateRule(value, rule, params, options);
      
      if (!isValid) {
        const message = this._getErrorMessage(rule, params, options, value);
        errors.push(message);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证对象
   * @param {Object} data - 要验证的数据对象
   * @param {Object} rulesObject - 规则对象
   * @param {Object} options - 选项
   * @returns {Object} 验证结果 { valid: boolean, errors: Object }
   */
  validateObject(data, rulesObject, options = {}) {
    const errors = {};
    let isValid = true;
    
    // 遍历规则对象
    for (const [field, rules] of Object.entries(rulesObject)) {
      // 检查条件规则
      if (!this._shouldValidateField(field, data, rules, options)) {
        continue;
      }
      
      const value = this._getValueFromObject(data, field);
      const result = this.validate(value, rules, {
        ...options,
        field,
        data
      });
      
      if (!result.valid) {
        errors[field] = result.errors;
        isValid = false;
      }
    }
    
    return {
      valid: isValid,
      errors
    };
  }

  /**
   * 验证数组中的每个元素
   * @param {Array} array - 要验证的数组
   * @param {Object|Array|Function|string} rules - 验证规则
   * @param {Object} options - 选项
   * @returns {Object} 验证结果 { valid: boolean, errors: Array }
   */
  validateArray(array, rules, options = {}) {
    if (!Array.isArray(array)) {
      return {
        valid: false,
        errors: ['必须是数组']
      };
    }
    
    const errors = [];
    let isValid = true;
    
    array.forEach((item, index) => {
      const result = this.validate(item, rules, {
        ...options,
        index
      });
      
      if (!result.valid) {
        errors[index] = result.errors;
        isValid = false;
      }
    });
    
    return {
      valid: isValid,
      errors
    };
  }

  /**
   * 批量验证
   * @param {Array} items - 要验证的项目数组
   * @param {Object|Array|Function|string} rules - 验证规则
   * @param {Object} options - 选项
   * @returns {Array} 验证结果数组
   */
  validateBatch(items, rules, options = {}) {
    return items.map((item, index) => {
      return this.validate(item, rules, {
        ...options,
        index
      });
    });
  }

  /**
   * 检查值是否有效
   * @param {any} value - 要检查的值
   * @param {Object|Array|Function|string} rules - 验证规则
   * @param {Object} options - 选项
   * @returns {boolean} 是否有效
   */
  isValid(value, rules, options = {}) {
    return this.validate(value, rules, options).valid;
  }

  /**
   * 获取值的第一个错误
   * @param {any} value - 要检查的值
   * @param {Object|Array|Function|string} rules - 验证规则
   * @param {Object} options - 选项
   * @returns {string|null} 错误消息或null
   */
  getFirstError(value, rules, options = {}) {
    const result = this.validate(value, rules, options);
    return result.errors[0] || null;
  }

  // 规则验证方法

  /**
   * 验证必填
   * @param {any} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  required(value) {
    return value !== undefined && value !== null && value !== '' && !Number.isNaN(value);
  }

  /**
   * 验证类型
   * @param {any} value - 要验证的值
   * @param {string} type - 类型名称
   * @returns {boolean} 是否有效
   */
  type(value, type) {
    switch (type.toLowerCase()) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !Number.isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return value !== null && typeof value === 'object' && !Array.isArray(value);
      case 'function':
        return typeof value === 'function';
      case 'null':
        return value === null;
      case 'undefined':
        return value === undefined;
      case 'symbol':
        return typeof value === 'symbol';
      case 'bigint':
        return typeof value === 'bigint';
      default:
        return false;
    }
  }

  /**
   * 验证最小值
   * @param {number|string|Date|Array} value - 要验证的值
   * @param {number} min - 最小值
   * @returns {boolean} 是否有效
   */
  min(value, min) {
    if (value === undefined || value === null) return true;
    
    if (typeof value === 'number') {
      return value >= min;
    } else if (typeof value === 'string') {
      return value.length >= min;
    } else if (Array.isArray(value)) {
      return value.length >= min;
    } else if (value instanceof Date) {
      return value >= new Date(min);
    }
    
    return false;
  }

  /**
   * 验证最大值
   * @param {number|string|Date|Array} value - 要验证的值
   * @param {number} max - 最大值
   * @returns {boolean} 是否有效
   */
  max(value, max) {
    if (value === undefined || value === null) return true;
    
    if (typeof value === 'number') {
      return value <= max;
    } else if (typeof value === 'string') {
      return value.length <= max;
    } else if (Array.isArray(value)) {
      return value.length <= max;
    } else if (value instanceof Date) {
      return value <= new Date(max);
    }
    
    return false;
  }

  /**
   * 验证最小长度
   * @param {string|Array} value - 要验证的值
   * @param {number} min - 最小长度
   * @returns {boolean} 是否有效
   */
  minLength(value, min) {
    if (value === undefined || value === null) return true;
    return (typeof value === 'string' || Array.isArray(value)) && value.length >= min;
  }

  /**
   * 验证最大长度
   * @param {string|Array} value - 要验证的值
   * @param {number} max - 最大长度
   * @returns {boolean} 是否有效
   */
  maxLength(value, max) {
    if (value === undefined || value === null) return true;
    return (typeof value === 'string' || Array.isArray(value)) && value.length <= max;
  }

  /**
   * 验证正则表达式
   * @param {string} value - 要验证的值
   * @param {RegExp|string} pattern - 正则表达式
   * @returns {boolean} 是否有效
   */
  pattern(value, pattern) {
    if (value === undefined || value === null) return true;
    if (typeof value !== 'string') return false;
    
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return regex.test(value);
  }

  /**
   * 验证电子邮件
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  email(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.email.test(value);
  }

  /**
   * 验证URL
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  url(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.url.test(value);
  }

  /**
   * 验证日期
   * @param {string|Date} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  date(value) {
    if (value === undefined || value === null) return true;
    const date = value instanceof Date ? value : new Date(value);
    return !isNaN(date.getTime());
  }

  /**
   * 验证时间
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  time(value) {
    if (value === undefined || value === null) return true;
    if (typeof value !== 'string') return false;
    
    // 简单的时间格式验证 HH:MM 或 HH:MM:SS
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return timeRegex.test(value);
  }

  /**
   * 验证日期时间
   * @param {string|Date} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  datetime(value) {
    return this.date(value);
  }

  /**
   * 验证数字
   * @param {any} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  number(value) {
    if (value === undefined || value === null) return true;
    return !isNaN(Number(value)) && isFinite(value);
  }

  /**
   * 验证整数
   * @param {any} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  integer(value) {
    if (value === undefined || value === null) return true;
    return Number.isInteger(Number(value));
  }

  /**
   * 验证小数
   * @param {any} value - 要验证的值
   * @param {number} decimals - 小数位数
   * @returns {boolean} 是否有效
   */
  decimal(value, decimals = 2) {
    if (value === undefined || value === null) return true;
    
    const num = Number(value);
    if (isNaN(num)) return false;
    
    const decimalRegex = new RegExp(`^-?\\d+(\\.\\d{1,${decimals}})?$`);
    return decimalRegex.test(String(value));
  }

  /**
   * 验证正数
   * @param {any} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  positive(value) {
    if (value === undefined || value === null) return true;
    return Number(value) > 0;
  }

  /**
   * 验证负数
   * @param {any} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  negative(value) {
    if (value === undefined || value === null) return true;
    return Number(value) < 0;
  }

  /**
   * 验证非空
   * @param {any} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  nonEmpty(value) {
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }

  /**
   * 验证相等
   * @param {any} value - 要验证的值
   * @param {any} target - 目标值
   * @returns {boolean} 是否有效
   */
  equals(value, target) {
    if (value === undefined || value === null) return value === target;
    
    // 处理特殊类型比较
    if (value instanceof Date && target instanceof Date) {
      return value.getTime() === target.getTime();
    }
    
    if (Array.isArray(value) && Array.isArray(target)) {
      return JSON.stringify(value) === JSON.stringify(target);
    }
    
    if (typeof value === 'object' && typeof target === 'object') {
      return JSON.stringify(value) === JSON.stringify(target);
    }
    
    return value === target;
  }

  /**
   * 验证不相等
   * @param {any} value - 要验证的值
   * @param {any} target - 目标值
   * @returns {boolean} 是否有效
   */
  notEquals(value, target) {
    return !this.equals(value, target);
  }

  /**
   * 验证包含在列表中
   * @param {any} value - 要验证的值
   * @param {Array} list - 列表
   * @returns {boolean} 是否有效
   */
  in(value, list) {
    if (value === undefined || value === null) return true;
    return Array.isArray(list) && list.includes(value);
  }

  /**
   * 验证不包含在列表中
   * @param {any} value - 要验证的值
   * @param {Array} list - 列表
   * @returns {boolean} 是否有效
   */
  notIn(value, list) {
    return !this.in(value, list);
  }

  /**
   * 验证在范围内
   * @param {number} value - 要验证的值
   * @param {Object} range - 范围对象 {min, max}
   * @returns {boolean} 是否有效
   */
  between(value, { min, max }) {
    if (value === undefined || value === null) return true;
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  }

  /**
   * 验证字符串开头
   * @param {string} value - 要验证的值
   * @param {string} prefix - 前缀
   * @returns {boolean} 是否有效
   */
  startsWith(value, prefix) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && value.startsWith(prefix);
  }

  /**
   * 验证字符串结尾
   * @param {string} value - 要验证的值
   * @param {string} suffix - 后缀
   * @returns {boolean} 是否有效
   */
  endsWith(value, suffix) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && value.endsWith(suffix);
  }

  /**
   * 验证字符串包含
   * @param {string} value - 要验证的值
   * @param {string} substr - 子字符串
   * @returns {boolean} 是否有效
   */
  contains(value, substr) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && value.includes(substr);
  }

  /**
   * 验证字符串不包含
   * @param {string} value - 要验证的值
   * @param {string} substr - 子字符串
   * @returns {boolean} 是否有效
   */
  notContains(value, substr) {
    return !this.contains(value, substr);
  }

  /**
   * 验证字母
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  alpha(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.alpha.test(value);
  }

  /**
   * 验证字母数字
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  alphaNumeric(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.alphaNumeric.test(value);
  }

  /**
   * 验证数字格式
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  numeric(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && /^[0-9]+$/.test(value);
  }

  /**
   * 验证字母数字下划线
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  alphanumeric(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.alphanumeric.test(value);
  }

  /**
   * 验证十六进制颜色
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  hex(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.hex.test(value);
  }

  /**
   * 验证小写
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  lowercase(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.lowercase.test(value);
  }

  /**
   * 验证大写
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  uppercase(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.uppercase.test(value);
  }

  /**
   * 验证电话号码
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  phone(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.phone.test(value);
  }

  /**
   * 验证手机号码
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  mobile(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.mobile.test(value);
  }

  /**
   * 验证身份证号码
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  idCard(value) {
    if (value === undefined || value === null) return true;
    if (typeof value !== 'string') return false;
    
    // 基本格式验证
    if (!this.regex.idCard.test(value)) return false;
    
    // 校验码验证（简化版）
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(value[i]) * weights[i];
    }
    
    const checkCode = checkCodes[sum % 11];
    return value[17].toUpperCase() === checkCode;
  }

  /**
   * 验证银行卡号
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  bankCard(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.bankCard.test(value);
  }

  /**
   * 验证信用卡号
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  creditCard(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.creditCard.test(value);
  }

  /**
   * 验证货币格式
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  currency(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.currency.test(value);
  }

  /**
   * 验证IP地址
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  ip(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && (this.regex.ipv4.test(value) || this.regex.ipv6.test(value));
  }

  /**
   * 验证IPv4地址
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  ipv4(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.ipv4.test(value);
  }

  /**
   * 验证IPv6地址
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  ipv6(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.ipv6.test(value);
  }

  /**
   * 验证MAC地址
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  mac(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.mac.test(value);
  }

  /**
   * 验证UUID
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  uuid(value) {
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && this.regex.uuid.test(value);
  }

  /**
   * 验证JSON格式
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  json(value) {
    if (value === undefined || value === null) return true;
    if (typeof value !== 'string') return false;
    
    try {
      JSON.parse(value);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 验证Base64编码
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  base64(value) {
    if (value === undefined || value === null) return true;
    if (typeof value !== 'string') return false;
    
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(value)) return false;
    
    try {
      // 尝试验证Base64的有效性
      atob(value);
      return true;
    } catch (e) {
      return false;
    }
  }

  // 辅助方法

  /**
   * 标准化规则格式
   * @private
   */
  _normalizeRules(rules) {
    const normalized = {};
    
    if (typeof rules === 'function') {
      normalized.custom = rules;
    } else if (typeof rules === 'string') {
      // 解析字符串规则，如 'required|email|minLength:5'
      rules.split('|').forEach(ruleStr => {
        const [rule, ...params] = ruleStr.split(':');
        normalized[rule] = params.length > 0 ? params : true;
      });
    } else if (Array.isArray(rules)) {
      // 数组规则，每个元素可以是字符串或对象
      rules.forEach(rule => {
        if (typeof rule === 'string') {
          normalized[rule] = true;
        } else if (typeof rule === 'object') {
          Object.assign(normalized, rule);
        }
      });
    } else if (typeof rules === 'object') {
      // 对象规则
      Object.assign(normalized, rules);
    }
    
    return normalized;
  }

  /**
   * 验证单个规则
   * @private
   */
  _validateRule(value, rule, params, options) {
    // 检查是否是自定义规则
    const customRule = this.getRule(rule);
    if (customRule) {
      return customRule(value, params, options);
    }
    
    // 检查内置规则
    if (typeof this[rule] === 'function') {
      return this[rule](value, params);
    }
    
    // 特殊规则处理
    switch (rule) {
      case 'custom':
        if (typeof params === 'function') {
          return params(value, options);
        }
        break;
      case 'requiredIf':
        return this._requiredIf(value, params, options);
      case 'requiredUnless':
        return this._requiredUnless(value, params, options);
      case 'requiredWith':
        return this._requiredWith(value, params, options);
      case 'requiredWithAll':
        return this._requiredWithAll(value, params, options);
      case 'requiredWithout':
        return this._requiredWithout(value, params, options);
      case 'requiredWithoutAll':
        return this._requiredWithoutAll(value, params, options);
      case 'same':
        return this._same(value, params, options);
      case 'different':
        return this._different(value, params, options);
      case 'before':
        return this._before(value, params);
      case 'after':
        return this._after(value, params);
      case 'isTrue':
        return value === true;
      case 'isFalse':
        return value === false;
      case 'empty':
        return this._isEmpty(value);
      case 'unique':
        return this._unique(value, params, options);
      case 'digits':
        return this._digits(value, params);
      case 'digitsBetween':
        return this._digitsBetween(value, params);
      case 'mimetype':
        return this._mimetype(value, params);
      case 'ext':
        return this._extension(value, params);
      case 'size':
        return this._fileSize(value, params);
      case 'minSize':
        return this._minFileSize(value, params);
      case 'maxSize':
        return this._maxFileSize(value, params);
    }
    
    return true;
  }

  /**
   * 获取错误消息
   * @private
   */
  _getErrorMessage(rule, params, options, value) {
    // 检查选项中是否有自定义消息
    if (options.messages && options.messages[rule]) {
      return this.getMessage(rule, { ...params, ...options });
    }
    
    // 处理特殊参数格式
    const messageParams = { ...params };
    
    // 对于数组参数，格式化为字符串
    if (Array.isArray(params)) {
      messageParams.values = params.join(', ');
    }
    
    // 对于对象参数，提取min和max等
    if (typeof params === 'object' && params !== null && !Array.isArray(params)) {
      Object.assign(messageParams, params);
    }
    
    return this.getMessage(rule, messageParams);
  }

  /**
   * 从对象获取值（支持点号路径）
   * @private
   */
  _getValueFromObject(obj, path) {
    if (!obj) return undefined;
    
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * 检查是否应该验证字段
   * @private
   */
  _shouldValidateField(field, data, rules, options) {
    // 这里可以添加条件验证逻辑
    return true;
  }

  /**
   * requiredIf 规则
   * @private
   */
  _requiredIf(value, { field, value: targetValue }, options) {
    const otherValue = this._getValueFromObject(options.data, field);
    if (otherValue === targetValue) {
      return this.required(value);
    }
    return true;
  }

  /**
   * requiredUnless 规则
   * @private
   */
  _requiredUnless(value, { field, value: targetValue }, options) {
    const otherValue = this._getValueFromObject(options.data, field);
    if (otherValue !== targetValue) {
      return this.required(value);
    }
    return true;
  }

  /**
   * requiredWith 规则
   * @private
   */
  _requiredWith(value, fields, options) {
    const fieldsArray = Array.isArray(fields) ? fields : [fields];
    const hasAnyField = fieldsArray.some(field => {
      const fieldValue = this._getValueFromObject(options.data, field);
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    });
    
    if (hasAnyField) {
      return this.required(value);
    }
    return true;
  }

  /**
   * requiredWithAll 规则
   * @private
   */
  _requiredWithAll(value, fields, options) {
    const fieldsArray = Array.isArray(fields) ? fields : [fields];
    const hasAllFields = fieldsArray.every(field => {
      const fieldValue = this._getValueFromObject(options.data, field);
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    });
    
    if (hasAllFields) {
      return this.required(value);
    }
    return true;
  }

  /**
   * requiredWithout 规则
   * @private
   */
  _requiredWithout(value, fields, options) {
    const fieldsArray = Array.isArray(fields) ? fields : [fields];
    const hasNoFields = fieldsArray.some(field => {
      const fieldValue = this._getValueFromObject(options.data, field);
      return fieldValue === undefined || fieldValue === null || fieldValue === '';
    });
    
    if (hasNoFields) {
      return this.required(value);
    }
    return true;
  }

  /**
   * requiredWithoutAll 规则
   * @private
   */
  _requiredWithoutAll(value, fields, options) {
    const fieldsArray = Array.isArray(fields) ? fields : [fields];
    const hasNoFields = fieldsArray.every(field => {
      const fieldValue = this._getValueFromObject(options.data, field);
      return fieldValue === undefined || fieldValue === null || fieldValue === '';
    });
    
    if (hasNoFields) {
      return this.required(value);
    }
    return true;
  }

  /**
   * same 规则
   * @private
   */
  _same(value, field, options) {
    const otherValue = this._getValueFromObject(options.data, field);
    return this.equals(value, otherValue);
  }

  /**
   * different 规则
   * @private
   */
  _different(value, field, options) {
    const otherValue = this._getValueFromObject(options.data, field);
    return !this.equals(value, otherValue);
  }

  /**
   * before 规则
   * @private
   */
  _before(value, date) {
    if (value === undefined || value === null) return true;
    const valueDate = new Date(value);
    const targetDate = new Date(date);
    return !isNaN(valueDate.getTime()) && !isNaN(targetDate.getTime()) && valueDate < targetDate;
  }

  /**
   * after 规则
   * @private
   */
  _after(value, date) {
    if (value === undefined || value === null) return true;
    const valueDate = new Date(value);
    const targetDate = new Date(date);
    return !isNaN(valueDate.getTime()) && !isNaN(targetDate.getTime()) && valueDate > targetDate;
  }

  /**
   * isEmpty 规则
   * @private
   */
  _isEmpty(value) {
    if (value === undefined || value === null || value === '') return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * unique 规则
   * @private
   */
  _unique(value, array, options) {
    if (value === undefined || value === null) return true;
    const targetArray = Array.isArray(array) ? array : options.data[array];
    if (!Array.isArray(targetArray)) return true;
    
    const count = targetArray.filter(item => this.equals(item, value)).length;
    return count <= 1;
  }

  /**
   * digits 规则
   * @private
   */
  _digits(value, length) {
    if (value === undefined || value === null) return true;
    const digitRegex = new RegExp(`^\\d{${length}}$`);
    return typeof value === 'string' && digitRegex.test(value);
  }

  /**
   * digitsBetween 规则
   * @private
   */
  _digitsBetween(value, { min, max }) {
    if (value === undefined || value === null) return true;
    if (typeof value !== 'string') return false;
    
    const digitCount = value.replace(/[^0-9]/g, '').length;
    return digitCount >= min && digitCount <= max;
  }

  /**
   * mimetype 规则
   * @private
   */
  _mimetype(value, types) {
    if (value === undefined || value === null) return true;
    if (!value.type) return false;
    
    const typeArray = Array.isArray(types) ? types : [types];
    return typeArray.includes(value.type);
  }

  /**
   * extension 规则
   * @private
   */
  _extension(value, extensions) {
    if (value === undefined || value === null) return true;
    if (!value.name) return false;
    
    const extArray = Array.isArray(extensions) ? extensions : [extensions];
    const fileExt = value.name.split('.').pop().toLowerCase();
    return extArray.includes(fileExt);
  }

  /**
   * fileSize 规则
   * @private
   */
  _fileSize(value, size) {
    if (value === undefined || value === null) return true;
    if (!value.size) return false;
    return value.size <= size;
  }

  /**
   * minFileSize 规则
   * @private
   */
  _minFileSize(value, minSize) {
    if (value === undefined || value === null) return true;
    if (!value.size) return false;
    return value.size >= minSize;
  }

  /**
   * maxFileSize 规则
   * @private
   */
  _maxFileSize(value, maxSize) {
    return this._fileSize(value, maxSize);
  }

  /**
   * 创建验证规则集
   * @param {Object} rules - 规则对象
   * @returns {Function} 验证函数
   */
  createRuleSet(rules) {
    return (value, options = {}) => {
      return this.validate(value, rules, options);
    };
  }

  /**
   * 合并规则
   * @param {Array<Object>} ruleSets - 规则集数组
   * @returns {Object} 合并后的规则
   */
  mergeRules(...ruleSets) {
    return ruleSets.reduce((merged, rules) => {
      return { ...merged, ...rules };
    }, {});
  }

  /**
   * 获取所有内置规则列表
   * @returns {Array<string>} 规则名称列表
   */
  getRulesList() {
    const builtInRules = Object.keys(this.defaultMessages);
    const customRules = Array.from(this.customRules.keys());
    return [...new Set([...builtInRules, ...customRules])].sort();
  }

  /**
   * 导出验证器配置
   * @returns {Object} 配置对象
   */
  exportConfig() {
    return {
      messages: { ...this.defaultMessages },
      rules: Array.from(this.customRules.entries()).reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {})
    };
  }

  /**
   * 导入验证器配置
   * @param {Object} config - 配置对象
   * @returns {Validator} 实例自身
   */
  importConfig(config) {
    if (config.messages) {
      this.setMessages(config.messages);
    }
    
    if (config.rules) {
      Object.entries(config.rules).forEach(([name, rule]) => {
        this.addRule(name, rule);
      });
    }
    
    return this;
  }

  /**
   * 克隆实例
   * @returns {Validator} 新的实例
   */
  clone() {
    const newInstance = new Validator();
    newInstance.importConfig(this.exportConfig());
    return newInstance;
  }
}

// 导出单例实例
const validator = new Validator();
export default validator;
export { Validator };