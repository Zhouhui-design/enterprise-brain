/**
 * 数据清理工具
 * 提供各类数据清洗、标准化和预处理功能
 */
class DataCleaner {
  /**
   * 清理字符串（去除首尾空格，处理空值）
   * @param {string} str - 输入字符串
   * @param {Object} options - 清理选项
   * @returns {string} 清理后的字符串
   */
  cleanString(str, options = {}) {
    const {
      trim = true,
      normalizeWhitespace = true,
      toLowerCase = false,
      toUpperCase = false,
      replaceEmptyWith = null
    } = options;

    // 处理null或undefined
    if (str === null || str === undefined) {
      return replaceEmptyWith;
    }

    // 转换为字符串
    let cleaned = String(str);

    // 去除首尾空格
    if (trim) {
      cleaned = cleaned.trim();
    }

    // 规范化空白字符（多个空格替换为单个）
    if (normalizeWhitespace) {
      cleaned = cleaned.replace(/\s+/g, ' ');
    }

    // 大小写转换
    if (toLowerCase) {
      cleaned = cleaned.toLowerCase();
    } else if (toUpperCase) {
      cleaned = cleaned.toUpperCase();
    }

    // 空字符串处理
    if (cleaned === '' && replaceEmptyWith !== undefined) {
      return replaceEmptyWith;
    }

    return cleaned;
  }

  /**
   * 清理数字（处理NaN，限制范围等）
   * @param {*} value - 输入值
   * @param {Object} options - 清理选项
   * @returns {number} 清理后的数字
   */
  cleanNumber(value, options = {}) {
    const {
      defaultTo = null,
      min = -Infinity,
      max = Infinity,
      round = false,
      floor = false,
      ceil = false,
      fixed = null
    } = options;

    // 尝试转换为数字
    let num = Number(value);

    // 处理NaN
    if (isNaN(num)) {
      return defaultTo;
    }

    // 限制范围
    num = Math.max(min, Math.min(max, num));

    // 数值处理
    if (round) {
      num = Math.round(num);
    } else if (floor) {
      num = Math.floor(num);
    } else if (ceil) {
      num = Math.ceil(num);
    }

    // 固定小数位数
    if (fixed !== null && typeof fixed === 'number') {
      num = Number(num.toFixed(fixed));
    }

    return num;
  }

  /**
   * 清理布尔值
   * @param {*} value - 输入值
   * @param {Object} options - 清理选项
   * @returns {boolean} 清理后的布尔值
   */
  cleanBoolean(value, options = {}) {
    const {
      truthyValues = ['true', '1', 'yes', 'y', 'on'],
      falsyValues = ['false', '0', 'no', 'n', 'off']
    } = options;

    // 处理布尔值
    if (typeof value === 'boolean') {
      return value;
    }

    // 处理数字
    if (typeof value === 'number') {
      return value !== 0;
    }

    // 处理字符串
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();
      if (truthyValues.includes(normalized)) return true;
      if (falsyValues.includes(normalized)) return false;
    }

    // 其他情况：null/undefined返回false，对象/数组返回true
    return !!value;
  }

  /**
   * 清理日期
   * @param {*} value - 输入值
   * @param {Object} options - 清理选项
   * @returns {Date|null} 清理后的日期对象
   */
  cleanDate(value, options = {}) {
    const {
      defaultTo = null,
      minDate = null,
      maxDate = null
    } = options;

    let date;

    // 已经是Date对象
    if (value instanceof Date) {
      date = value;
    } else {
      // 尝试转换
      date = new Date(value);
    }

    // 验证日期有效性
    if (isNaN(date.getTime())) {
      return defaultTo;
    }

    // 检查日期范围
    if (minDate && date < new Date(minDate)) {
      return minDate instanceof Date ? minDate : new Date(minDate);
    }

    if (maxDate && date > new Date(maxDate)) {
      return maxDate instanceof Date ? maxDate : new Date(maxDate);
    }

    return date;
  }

  /**
   * 清理数组
   * @param {*} arr - 输入数组
   * @param {Object} options - 清理选项
   * @returns {Array} 清理后的数组
   */
  cleanArray(arr, options = {}) {
    const {
      removeDuplicates = false,
      removeEmpty = false,
      removeNull = true,
      sort = false,
      maxLength = null
    } = options;

    // 确保是数组
    if (!Array.isArray(arr)) {
      return [];
    }

    let cleaned = [...arr];

    // 移除null和undefined
    if (removeNull) {
      cleaned = cleaned.filter(item => item !== null && item !== undefined);
    }

    // 移除空值
    if (removeEmpty) {
      cleaned = cleaned.filter(item => {
        if (item === '' || item === 0 || item === false) return false;
        if (Array.isArray(item) && item.length === 0) return false;
        if (typeof item === 'object' && item !== null && Object.keys(item).length === 0) return false;
        return true;
      });
    }

    // 去重
    if (removeDuplicates) {
      cleaned = this._removeDuplicates(cleaned);
    }

    // 排序
    if (sort) {
      cleaned.sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        return String(a).localeCompare(String(b));
      });
    }

    // 限制最大长度
    if (maxLength !== null && cleaned.length > maxLength) {
      cleaned = cleaned.slice(0, maxLength);
    }

    return cleaned;
  }

  /**
   * 清理对象
   * @param {Object} obj - 输入对象
   * @param {Object} options - 清理选项
   * @returns {Object} 清理后的对象
   */
  cleanObject(obj, options = {}) {
    const {
      removeNull = true,
      removeUndefined = true,
      removeEmpty = false,
      allowedFields = null,
      excludedFields = null,
      deep = false
    } = options;

    // 确保是对象
    if (typeof obj !== 'object' || obj === null) {
      return {};
    }

    const cleaned = {};

    Object.entries(obj).forEach(([key, value]) => {
      // 检查是否允许的字段
      if (allowedFields && !allowedFields.includes(key)) {
        return;
      }

      // 检查是否排除的字段
      if (excludedFields && excludedFields.includes(key)) {
        return;
      }

      // 处理null值
      if (removeNull && value === null) {
        return;
      }

      // 处理undefined值
      if (removeUndefined && value === undefined) {
        return;
      }

      // 处理空值
      if (removeEmpty) {
        if (value === '') return;
        if (Array.isArray(value) && value.length === 0) return;
        if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) return;
      }

      // 深度清理
      if (deep && typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          cleaned[key] = this.cleanArray(value, options);
        } else {
          cleaned[key] = this.cleanObject(value, options);
        }
      } else {
        cleaned[key] = value;
      }
    });

    return cleaned;
  }

  /**
   * 清理HTML字符串
   * @param {string} html - HTML字符串
   * @param {Object} options - 清理选项
   * @returns {string} 清理后的字符串
   */
  cleanHtml(html, options = {}) {
    const {
      stripTags = true,
      allowTags = [],
      stripComments = true,
      cleanWhitespace = true
    } = options;

    if (!html || typeof html !== 'string') {
      return '';
    }

    let cleaned = html;

    // 移除HTML注释
    if (stripComments) {
      cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
    }

    // 移除HTML标签
    if (stripTags) {
      if (allowTags && allowTags.length > 0) {
        // 允许特定标签
        const allowedTagsPattern = allowTags.map(tag => tag.toLowerCase()).join('|');
        const tagRegex = new RegExp(`</?(${allowedTagsPattern})[^>]*>`, 'gi');
        const allTagsRegex = /</?[^>]+>/g;
        
        // 保存允许的标签
        const allowedTagsMap = {};
        let match;
        while ((match = tagRegex.exec(cleaned)) !== null) {
          allowedTagsMap[match.index] = match[0];
        }
        
        // 移除所有标签，然后恢复允许的标签
        cleaned = cleaned.replace(allTagsRegex, (match, offset) => {
          return allowedTagsMap[offset] || '';
        });
      } else {
        // 移除所有标签
        cleaned = cleaned.replace(/</?[^>]+>/g, '');
      }
    }

    // 清理空白字符
    if (cleanWhitespace) {
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
    }

    return cleaned;
  }

  /**
   * 标准化手机号码
   * @param {string} phone - 手机号码
   * @param {string} countryCode - 国家代码
   * @returns {string} 标准化后的手机号码
   */
  normalizePhone(phone, countryCode = 'CN') {
    if (!phone || typeof phone !== 'string') {
      return '';
    }

    // 移除所有非数字字符
    let normalized = phone.replace(/\D/g, '');

    // 根据国家代码进行特定处理
    switch (countryCode.toUpperCase()) {
      case 'CN':
        // 中国大陆手机号处理
        if (normalized.length === 11) {
          // 11位手机号，可能需要添加+86
          if (!normalized.startsWith('+')) {
            normalized = '+86' + normalized;
          }
        } else if (normalized.length === 13 && normalized.startsWith('86')) {
          // 带86的手机号
          normalized = '+' + normalized;
        }
        break;
      case 'US':
      case 'CA':
        // 北美手机号处理
        if (normalized.length === 10) {
          normalized = '+1' + normalized;
        } else if (normalized.length === 11 && normalized.startsWith('1')) {
          normalized = '+' + normalized;
        }
        break;
      default:
        // 保留原始处理
        break;
    }

    return normalized;
  }

  /**
   * 标准化邮箱地址
   * @param {string} email - 邮箱地址
   * @returns {string} 标准化后的邮箱地址
   */
  normalizeEmail(email) {
    if (!email || typeof email !== 'string') {
      return '';
    }

    // 转换为小写并去除首尾空格
    const normalized = email.toLowerCase().trim();

    // 简单的邮箱格式检查
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return '';
    }

    return normalized;
  }

  /**
   * 清理和标准化URL
   * @param {string} url - URL字符串
   * @param {Object} options - 清理选项
   * @returns {string} 清理后的URL
   */
  normalizeUrl(url, options = {}) {
    const {
      defaultProtocol = 'https',
      stripTrailingSlash = true
    } = options;

    if (!url || typeof url !== 'string') {
      return '';
    }

    let normalized = url.trim();

    // 添加默认协议
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = `${defaultProtocol}://${normalized}`;
    }

    try {
      // 使用URL对象进行标准化
      const urlObj = new URL(normalized);
      normalized = urlObj.toString();

      // 移除末尾斜杠
      if (stripTrailingSlash && normalized.endsWith('/') && normalized.length > urlObj.origin.length + 1) {
        normalized = normalized.slice(0, -1);
      }
    } catch (e) {
      // URL无效
      return '';
    }

    return normalized;
  }

  /**
   * 批量清理数据
   * @param {Array} items - 数据项数组
   * @param {Object} fieldCleaners - 字段清理器配置 {field: {cleaner: function, options: {}}}
   * @returns {Array} 清理后的数据数组
   */
  batchClean(items, fieldCleaners) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map(item => {
      if (typeof item !== 'object' || item === null) {
        return item;
      }

      const cleanedItem = { ...item };

      Object.entries(fieldCleaners).forEach(([field, config]) => {
        if (field in cleanedItem) {
          const { cleaner, options = {} } = config;
          if (typeof cleaner === 'function') {
            cleanedItem[field] = cleaner(cleanedItem[field], options);
          }
        }
      });

      return cleanedItem;
    });
  }

  /**
   * 移除数组中的重复项（内部方法）
   * @private
   */
  _removeDuplicates(arr) {
    if (Array.from && Set) {
      // 对于简单类型的数组
      const hasObjects = arr.some(item => typeof item === 'object' && item !== null);
      if (!hasObjects) {
        return Array.from(new Set(arr));
      }
    }

    // 对于包含对象的数组，使用字符串化比较
    const seen = new Set();
    return arr.filter(item => {
      try {
        const serialized = typeof item === 'object' && item !== null 
          ? JSON.stringify(item)
          : String(item);
        if (!seen.has(serialized)) {
          seen.add(serialized);
          return true;
        }
        return false;
      } catch (e) {
        // 循环引用等情况，保留原值
        return true;
      }
    });
  }

  /**
   * 处理敏感数据（掩码处理）
   * @param {string} data - 敏感数据
   * @param {Object} options - 掩码选项
   * @returns {string} 掩码后的数据
   */
  maskSensitiveData(data, options = {}) {
    const {
      type = 'default',
      visibleStart = 3,
      visibleEnd = 3,
      maskChar = '*'
    } = options;

    if (!data || typeof data !== 'string') {
      return '';
    }

    // 根据类型进行特定掩码处理
    switch (type) {
      case 'phone':
        // 手机号：显示前3后4
        if (data.length > 7) {
          return data.slice(0, 3) + maskChar.repeat(data.length - 7) + data.slice(-4);
        }
        break;
      case 'email':
        // 邮箱：用户名部分显示前2后1
        const [username, domain] = data.split('@');
        if (username && domain) {
          if (username.length <= 3) {
            return username[0] + maskChar.repeat(username.length - 1) + '@' + domain;
          }
          return username.slice(0, 2) + maskChar.repeat(username.length - 3) + 
                 username.slice(-1) + '@' + domain;
        }
        break;
      case 'idcard':
        // 身份证号：显示前6后4
        if (data.length > 10) {
          return data.slice(0, 6) + maskChar.repeat(data.length - 10) + data.slice(-4);
        }
        break;
      default:
        // 默认掩码规则
        if (data.length <= visibleStart + visibleEnd) {
          // 太短的数据只显示第一个字符
          return data[0] + maskChar.repeat(data.length - 1);
        }
        return data.slice(0, visibleStart) + 
               maskChar.repeat(data.length - visibleStart - visibleEnd) + 
               data.slice(-visibleEnd);
    }

    return data;
  }

  /**
   * 清理数据中的特殊字符
   * @param {string} str - 输入字符串
   * @param {Object} options - 清理选项
   * @returns {string} 清理后的字符串
   */
  removeSpecialChars(str, options = {}) {
    const {
      allowChars = '',
      replaceWith = '',
      keepLetters = true,
      keepNumbers = true
    } = options;

    if (!str || typeof str !== 'string') {
      return '';
    }

    let pattern = '';
    const allowed = [];

    if (keepLetters) allowed.push('a-zA-Z');
    if (keepNumbers) allowed.push('0-9');
    if (allowChars) allowed.push(allowChars);

    if (allowed.length > 0) {
      pattern = `[^${allowed.join('')}\s]`;
    } else {
      pattern = '[^\s]';
    }

    return str.replace(new RegExp(pattern, 'g'), replaceWith);
  }

  /**
   * 标准化数据格式（根据数据类型自动清理）
   * @param {*} data - 任意类型的数据
   * @param {string} type - 目标数据类型
   * @param {Object} options - 清理选项
   * @returns {*} 标准化后的数据
   */
  normalize(data, type = 'auto', options = {}) {
    // 自动检测类型
    if (type === 'auto') {
      if (typeof data === 'string') {
        // 尝试检测字符串内容类型
        if (/^\d+$/.test(data)) return this.cleanNumber(data, options);
        if (/^(true|false|yes|no|on|off)$/i.test(data)) return this.cleanBoolean(data, options);
        if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(data)) return this.cleanDate(data, options);
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) return this.normalizeEmail(data);
        if (/^https?:\/\//i.test(data) || data.includes('.')) return this.normalizeUrl(data, options);
        return this.cleanString(data, options);
      } else if (typeof data === 'number') {
        return this.cleanNumber(data, options);
      } else if (typeof data === 'boolean') {
        return data;
      } else if (Array.isArray(data)) {
        return this.cleanArray(data, options);
      } else if (typeof data === 'object' && data !== null) {
        return this.cleanObject(data, options);
      }
    } else {
      // 指定类型处理
      switch (type.toLowerCase()) {
        case 'string': return this.cleanString(data, options);
        case 'number': return this.cleanNumber(data, options);
        case 'boolean': return this.cleanBoolean(data, options);
        case 'date': return this.cleanDate(data, options);
        case 'array': return this.cleanArray(data, options);
        case 'object': return this.cleanObject(data, options);
        case 'email': return this.normalizeEmail(data);
        case 'phone': return this.normalizePhone(data, options.countryCode);
        case 'url': return this.normalizeUrl(data, options);
      }
    }

    return data;
  }
}

// 导出单例实例
const dataCleaner = new DataCleaner();
export default dataCleaner;
export { DataCleaner };