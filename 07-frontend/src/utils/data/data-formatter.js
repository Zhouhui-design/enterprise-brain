/**
 * 数据格式化工具
 * 提供各类数据的格式化和展示功能
 */
class DataFormatter {
  /**
   * 格式化数字
   * @param {number} value - 数值
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的字符串
   */
  formatNumber(value, options = {}) {
    const {
      decimals = 2,
      useGrouping = true,
      locale = 'zh-CN',
      currency = null,
      style = currency ? 'currency' : 'decimal',
      minimumFractionDigits = decimals,
      maximumFractionDigits = decimals
    } = options;

    // 处理无效输入
    if (value === null || value === undefined || isNaN(value)) {
      return options.emptyValue || '--';
    }

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style,
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping
      });

      return formatter.format(value);
    } catch (e) {
      // 降级方案
      let formatted = Number(value).toFixed(decimals);
      
      if (useGrouping) {
        // 添加千位分隔符
        formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
      
      return formatted;
    }
  }

  /**
   * 格式化货币
   * @param {number} value - 金额
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的货币字符串
   */
  formatCurrency(value, options = {}) {
    const defaultOptions = {
      currency: 'CNY',
      locale: 'zh-CN',
      decimals: 2
    };

    return this.formatNumber(value, { ...defaultOptions, ...options, style: 'currency' });
  }

  /**
   * 格式化百分比
   * @param {number} value - 数值（0-1之间的小数）
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的百分比字符串
   */
  formatPercentage(value, options = {}) {
    const {
      decimals = 2,
      locale = 'zh-CN',
      multiplyBy100 = true
    } = options;

    if (value === null || value === undefined || isNaN(value)) {
      return options.emptyValue || '--';
    }

    // 将小数转换为百分比值
    const percentageValue = multiplyBy100 ? value * 100 : value;

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });

      return multiplyBy100 ? formatter.format(value) : `${percentageValue.toFixed(decimals)}%`;
    } catch (e) {
      // 降级方案
      return `${percentageValue.toFixed(decimals)}%`;
    }
  }

  /**
   * 格式化日期
   * @param {*} date - 日期值
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date, options = {}) {
    const {
      format = 'YYYY-MM-DD',
      locale = 'zh-CN',
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    } = options;

    // 处理无效输入
    if (!date) {
      return options.emptyValue || '--';
    }

    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;

    if (isNaN(dateObj.getTime())) {
      return options.emptyValue || '--';
    }

    // 使用预定义格式
    if (format === 'YYYY-MM-DD') {
      return `${dateObj.getFullYear()}-${this._padZero(dateObj.getMonth() + 1)}-${this._padZero(dateObj.getDate())}`;
    } else if (format === 'MM/DD/YYYY') {
      return `${this._padZero(dateObj.getMonth() + 1)}/${this._padZero(dateObj.getDate())}/${dateObj.getFullYear()}`;
    } else if (format === 'DD/MM/YYYY') {
      return `${this._padZero(dateObj.getDate())}/${this._padZero(dateObj.getMonth() + 1)}/${dateObj.getFullYear()}`;
    } else if (format === 'YYYY-MM-DD HH:mm:ss') {
      return `${dateObj.getFullYear()}-${this._padZero(dateObj.getMonth() + 1)}-${this._padZero(dateObj.getDate())} ${this._padZero(dateObj.getHours())}:${this._padZero(dateObj.getMinutes())}:${this._padZero(dateObj.getSeconds())}`;
    } else if (format === 'relative') {
      // 相对时间格式化
      return this.formatRelativeTime(dateObj);
    }

    // 使用Intl.DateTimeFormat进行自定义格式化
    try {
      const formatter = new Intl.DateTimeFormat(locale, {
        timeZone,
        year: 'numeric',
        month: format.includes('MMM') ? 'short' : '2-digit',
        day: '2-digit',
        hour: format.includes('HH') ? '2-digit' : undefined,
        minute: format.includes('mm') ? '2-digit' : undefined,
        second: format.includes('ss') ? '2-digit' : undefined,
        hour12: false
      });

      return formatter.format(dateObj);
    } catch (e) {
      // 降级到ISO格式
      return dateObj.toISOString().slice(0, 10);
    }
  }

  /**
   * 格式化时间
   * @param {*} time - 时间值
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的时间字符串
   */
  formatTime(time, options = {}) {
    const {
      format = 'HH:mm:ss',
      use12Hour = false
    } = options;

    // 处理无效输入
    if (!time) {
      return options.emptyValue || '--';
    }

    const dateObj = typeof time === 'string' || typeof time === 'number' 
      ? new Date(time) 
      : time;

    if (isNaN(dateObj.getTime())) {
      return options.emptyValue || '--';
    }

    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const seconds = dateObj.getSeconds();

    if (use12Hour) {
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      if (format === 'HH:mm:ss') {
        return `${this._padZero(hour12)}:${this._padZero(minutes)}:${this._padZero(seconds)} ${period}`;
      }
      return `${this._padZero(hour12)}:${this._padZero(minutes)} ${period}`;
    }

    if (format === 'HH:mm') {
      return `${this._padZero(hours)}:${this._padZero(minutes)}`;
    }

    return `${this._padZero(hours)}:${this._padZero(minutes)}:${this._padZero(seconds)}`;
  }

  /**
   * 格式化相对时间
   * @param {*} date - 日期值
   * @returns {string} 相对时间字符串
   */
  formatRelativeTime(date) {
    const now = new Date();
    const targetDate = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;

    if (isNaN(targetDate.getTime())) {
      return '--';
    }

    const diffMs = now - targetDate;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) {
      return '刚刚';
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 30) {
      return `${diffDays}天前`;
    } else if (diffMonths < 12) {
      return `${diffMonths}个月前`;
    } else {
      return `${diffYears}年前`;
    }
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的文件大小字符串
   */
  formatFileSize(bytes, options = {}) {
    const {
      decimals = 2,
      showBytes = true
    } = options;

    if (bytes === null || bytes === undefined || bytes < 0) {
      return options.emptyValue || '--';
    }

    if (bytes === 0) {
      return showBytes ? '0 Bytes' : '0';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const sizeIndex = Math.min(i, sizes.length - 1);

    const formattedValue = (bytes / Math.pow(k, sizeIndex)).toFixed(decimals);
    return showBytes ? `${formattedValue} ${sizes[sizeIndex]}` : formattedValue;
  }

  /**
   * 格式化电话号码
   * @param {string} phone - 电话号码
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的电话号码
   */
  formatPhone(phone, options = {}) {
    const {
      format = 'cn'
    } = options;

    if (!phone) {
      return options.emptyValue || '--';
    }

    // 移除所有非数字字符
    const digits = phone.replace(/\D/g, '');

    switch (format) {
      case 'cn':
        // 中国大陆手机号格式: 138 1234 5678
        if (digits.length === 11) {
          return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
        }
        break;
      case 'us':
        // 美国手机号格式: (123) 456-7890
        if (digits.length === 10) {
          return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        break;
      case 'intl':
        // 国际格式: +1-123-456-7890
        if (digits.length > 10) {
          const countryCode = digits.slice(0, digits.length - 10);
          const localNumber = digits.slice(-10);
          return `+${countryCode}-${localNumber.slice(0, 3)}-${localNumber.slice(3, 6)}-${localNumber.slice(6)}`;
        }
        break;
    }

    return phone;
  }

  /**
   * 格式化身份证号
   * @param {string} idCard - 身份证号
   * @returns {string} 格式化后的身份证号
   */
  formatIdCard(idCard) {
    if (!idCard || typeof idCard !== 'string') {
      return '--';
    }

    const cleaned = idCard.replace(/\s/g, '');
    if (cleaned.length === 18) {
      // 格式化为: 110101 19900101 1234
      return `${cleaned.slice(0, 6)} ${cleaned.slice(6, 14)} ${cleaned.slice(14)}`;
    }

    return idCard;
  }

  /**
   * 格式化银行卡号
   * @param {string} cardNumber - 银行卡号
   * @returns {string} 格式化后的银行卡号
   */
  formatBankCard(cardNumber) {
    if (!cardNumber || typeof cardNumber !== 'string') {
      return '--';
    }

    // 移除所有空格，然后每4位添加一个空格
    return cardNumber.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  }

  /**
   * 格式化文本（处理换行、截断等）
   * @param {string} text - 文本内容
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的文本
   */
  formatText(text, options = {}) {
    const {
      maxLength = null,
      ellipsis = '...',
      preserveNewlines = false,
      escapeHtml = false
    } = options;

    if (!text || typeof text !== 'string') {
      return options.emptyValue || '';
    }

    let formatted = text;

    // HTML转义
    if (escapeHtml) {
      formatted = this._escapeHtml(formatted);
    }

    // 处理换行符
    if (!preserveNewlines) {
      formatted = formatted.replace(/\r?\n/g, ' ');
    }

    // 文本截断
    if (maxLength !== null && formatted.length > maxLength) {
      formatted = formatted.slice(0, maxLength - ellipsis.length) + ellipsis;
    }

    return formatted;
  }

  /**
   * 格式化列表（数组转字符串）
   * @param {Array} list - 列表数据
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的字符串
   */
  formatList(list, options = {}) {
    const {
      separator = ', ',
      maxItems = null,
      formatItem = null
    } = options;

    if (!Array.isArray(list) || list.length === 0) {
      return options.emptyValue || '';
    }

    let items = [...list];

    // 限制最大项数
    if (maxItems !== null && items.length > maxItems) {
      const remaining = items.length - maxItems;
      items = items.slice(0, maxItems);
      items.push(`等${remaining}项`);
    }

    // 格式化每个项
    if (typeof formatItem === 'function') {
      items = items.map(item => formatItem(item));
    }

    return items.join(separator);
  }

  /**
   * 格式化布尔值
   * @param {boolean} value - 布尔值
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的字符串
   */
  formatBoolean(value, options = {}) {
    const {
      trueText = '是',
      falseText = '否',
      emptyValue = '--'
    } = options;

    if (value === null || value === undefined) {
      return emptyValue;
    }

    return value ? trueText : falseText;
  }

  /**
   * 格式化枚举值
   * @param {*} value - 枚举值
   * @param {Object} enumMap - 枚举映射对象
   * @returns {string} 格式化后的字符串
   */
  formatEnum(value, enumMap, options = {}) {
    if (value === null || value === undefined) {
      return options.emptyValue || '--';
    }

    return enumMap[value] !== undefined ? enumMap[value] : String(value);
  }

  /**
   * 格式化对象为字符串
   * @param {Object} obj - 对象
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的字符串
   */
  formatObject(obj, options = {}) {
    const {
      indent = 2,
      maxDepth = null
    } = options;

    if (obj === null || obj === undefined) {
      return options.emptyValue || 'null';
    }

    try {
      return JSON.stringify(obj, (key, value) => {
        // 处理循环引用
        if (maxDepth !== null) {
          const stack = [];
          const replacer = (k, v) => {
            if (stack.includes(v)) return '[Circular]';
            if (typeof v === 'object' && v !== null) {
              stack.push(v);
              // 限制深度
              if (stack.length > maxDepth) return '{...}';
            }
            return v;
          };
          return replacer(key, value);
        }
        return value;
      }, indent);
    } catch (e) {
      return String(obj);
    }
  }

  /**
   * 格式化状态
   * @param {string|number} status - 状态值
   * @param {Object} statusMap - 状态映射配置
   * @returns {Object} 状态配置对象 {text, color, ...}
   */
  formatStatus(status, statusMap, options = {}) {
    const defaultConfig = {
      text: String(status),
      color: 'default',
      backgroundColor: '',
      icon: '',
      ...options.defaultStatus
    };

    return statusMap[status] || defaultConfig;
  }

  /**
   * 格式化地址
   * @param {Object} address - 地址对象
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的地址字符串
   */
  formatAddress(address, options = {}) {
    if (!address || typeof address !== 'object') {
      return options.emptyValue || '';
    }

    const {
      format = 'full',
      separator = ''
    } = options;

    // 中国地址格式
    const parts = [];
    
    if (address.province) parts.push(address.province);
    if (address.city) parts.push(address.city);
    if (address.district) parts.push(address.district);
    if (address.street) parts.push(address.street);
    if (address.detail) parts.push(address.detail);

    return parts.join(separator);
  }

  /**
   * HTML转义（内部方法）
   * @private
   */
  _escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * 数字补零（内部方法）
   * @private
   */
  _padZero(num) {
    return num < 10 ? '0' + num : num;
  }

  /**
   * 批量格式化数据
   * @param {Array} items - 数据项数组
   * @param {Object} fieldFormatters - 字段格式化配置 {field: {formatter: function, options: {}}}
   * @returns {Array} 格式化后的数据数组
   */
  batchFormat(items, fieldFormatters) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map(item => {
      if (typeof item !== 'object' || item === null) {
        return item;
      }

      const formattedItem = { ...item };

      Object.entries(fieldFormatters).forEach(([field, config]) => {
        if (field in formattedItem) {
          const { formatter, options = {} } = config;
          if (typeof formatter === 'function') {
            formattedItem[field] = formatter(formattedItem[field], options);
          }
        }
      });

      return formattedItem;
    });
  }

  /**
   * 智能格式化（根据数据类型自动选择格式化方法）
   * @param {*} value - 任意类型的值
   * @param {string} type - 数据类型提示
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的字符串
   */
  autoFormat(value, type = 'auto', options = {}) {
    // 处理空值
    if (value === null || value === undefined) {
      return options.emptyValue || '--';
    }

    // 自动检测类型
    if (type === 'auto') {
      if (typeof value === 'number') {
        if (options.isCurrency) return this.formatCurrency(value, options);
        if (options.isPercentage) return this.formatPercentage(value, options);
        return this.formatNumber(value, options);
      } else if (typeof value === 'boolean') {
        return this.formatBoolean(value, options);
      } else if (value instanceof Date || (typeof value === 'string' && /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(value))) {
        return this.formatDate(value, options);
      } else if (Array.isArray(value)) {
        return this.formatList(value, options);
      } else if (typeof value === 'object') {
        return this.formatObject(value, options);
      } else if (typeof value === 'string') {
        // 尝试识别特殊格式
        if (/^1[3-9]\d{9}$/.test(value)) return this.formatPhone(value, options);
        if (/^\d{17}[\dXx]$/.test(value)) return this.formatIdCard(value);
        if (value.length >= 16 && value.length <= 19 && /^\d+$/.test(value)) return this.formatBankCard(value);
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return value.toLowerCase(); // 邮箱格式化
      }
    } else {
      // 指定类型格式化
      switch (type.toLowerCase()) {
        case 'number': return this.formatNumber(value, options);
        case 'currency': return this.formatCurrency(value, options);
        case 'percentage': return this.formatPercentage(value, options);
        case 'date': return this.formatDate(value, options);
        case 'time': return this.formatTime(value, options);
        case 'boolean': return this.formatBoolean(value, options);
        case 'list': return this.formatList(value, options);
        case 'object': return this.formatObject(value, options);
        case 'phone': return this.formatPhone(value, options);
        case 'idcard': return this.formatIdCard(value);
        case 'bankcard': return this.formatBankCard(value);
        case 'filesize': return this.formatFileSize(value, options);
        case 'text': return this.formatText(value, options);
        case 'enum': return this.formatEnum(value, options.enumMap || {}, options);
        case 'status': return this.formatStatus(value, options.statusMap || {}, options);
        case 'address': return this.formatAddress(value, options);
      }
    }

    // 默认处理
    return String(value);
  }
}

// 导出单例实例
const dataFormatter = new DataFormatter();
export default dataFormatter;
export { DataFormatter };