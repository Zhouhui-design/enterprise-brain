/**
 * 数字工具类
 * 提供数字格式化、计算、转换等功能
 */
class NumberUtils {
  constructor() {
    this.decimalSeparator = '.';
    this.thousandSeparator = ',';
  }

  /**
   * 设置数字格式分隔符
   * @param {string} decimal - 小数点分隔符
   * @param {string} thousand - 千位分隔符
   */
  setSeparators(decimal = '.', thousand = ',') {
    this.decimalSeparator = decimal;
    this.thousandSeparator = thousand;
  }

  /**
   * 格式化数字（添加千位分隔符）
   * @param {number|string} num - 要格式化的数字
   * @param {number} decimals - 小数位数
   * @returns {string} 格式化后的字符串
   */
  format(num, decimals = 2) {
    const number = this.parse(num);
    if (isNaN(number)) {
      return '0';
    }

    const fixed = number.toFixed(decimals);
    const parts = fixed.split('.');
    
    // 添加千位分隔符
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.thousandSeparator);
    
    return parts.join(this.decimalSeparator);
  }

  /**
   * 解析数字字符串
   * @param {string|number} value - 要解析的值
   * @returns {number} 解析后的数字
   */
  parse(value) {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      // 移除千位分隔符，替换小数点分隔符为标准小数点
      const cleaned = value.replace(/[^0-9\-\.]/g, '');
      return parseFloat(cleaned) || 0;
    }

    return 0;
  }

  /**
   * 四舍五入到指定小数位
   * @param {number|string} num - 数字
   * @param {number} decimals - 小数位数
   * @returns {number} 四舍五入后的数字
   */
  round(num, decimals = 0) {
    const number = this.parse(num);
    const factor = Math.pow(10, decimals);
    return Math.round(number * factor) / factor;
  }

  /**
   * 向上取整到指定小数位
   * @param {number|string} num - 数字
   * @param {number} decimals - 小数位数
   * @returns {number} 向上取整后的数字
   */
  ceil(num, decimals = 0) {
    const number = this.parse(num);
    const factor = Math.pow(10, decimals);
    return Math.ceil(number * factor) / factor;
  }

  /**
   * 向下取整到指定小数位
   * @param {number|string} num - 数字
   * @param {number} decimals - 小数位数
   * @returns {number} 向下取整后的数字
   */
  floor(num, decimals = 0) {
    const number = this.parse(num);
    const factor = Math.pow(10, decimals);
    return Math.floor(number * factor) / factor;
  }

  /**
   * 格式化百分比
   * @param {number|string} num - 数字（0-1之间的小数）
   * @param {number} decimals - 小数位数
   * @returns {string} 百分比字符串
   */
  formatPercentage(num, decimals = 2) {
    const number = this.parse(num);
    const percentage = number * 100;
    return `${this.format(percentage, decimals)}%`;
  }

  /**
   * 格式化货币
   * @param {number|string} num - 数字
   * @param {string} currency - 货币符号
   * @param {number} decimals - 小数位数
   * @param {boolean} showSymbol - 是否显示货币符号
   * @returns {string} 货币字符串
   */
  formatCurrency(num, currency = '¥', decimals = 2, showSymbol = true) {
    const formatted = this.format(num, decimals);
    return showSymbol ? `${currency}${formatted}` : formatted;
  }

  /**
   * 格式化大数字（K, M, B等）
   * @param {number|string} num - 数字
   * @param {number} decimals - 小数位数
   * @returns {string} 格式化后的字符串
   */
  formatLargeNumber(num, decimals = 2) {
    const number = this.parse(num);
    
    if (Math.abs(number) < 1000) {
      return this.format(number, decimals);
    }

    const units = ['K', 'M', 'B', 'T'];
    const unitIndex = Math.floor(Math.log10(Math.abs(number)) / 3);
    const unit = units[unitIndex - 1];
    const scaled = number / Math.pow(1000, unitIndex);

    return `${this.format(scaled, decimals)}${unit}`;
  }

  /**
   * 生成随机数
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @param {boolean} isInteger - 是否为整数
   * @returns {number} 随机数
   */
  random(min = 0, max = 1, isInteger = false) {
    const result = Math.random() * (max - min) + min;
    return isInteger ? Math.round(result) : result;
  }

  /**
   * 检查数字是否在范围内
   * @param {number|string} num - 数字
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {boolean} 是否在范围内
   */
  isInRange(num, min, max) {
    const number = this.parse(num);
    return number >= min && number <= max;
  }

  /**
   * 限制数字在范围内
   * @param {number|string} num - 数字
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 限制后的数字
   */
  clamp(num, min, max) {
    const number = this.parse(num);
    return Math.min(Math.max(number, min), max);
  }

  /**
   * 计算平均值
   * @param {Array<number|string>} numbers - 数字数组
   * @returns {number} 平均值
   */
  average(numbers) {
    if (!Array.isArray(numbers) || numbers.length === 0) {
      return 0;
    }

    const sum = numbers.reduce((acc, num) => acc + this.parse(num), 0);
    return sum / numbers.length;
  }

  /**
   * 计算总和
   * @param {Array<number|string>} numbers - 数字数组
   * @returns {number} 总和
   */
  sum(numbers) {
    if (!Array.isArray(numbers) || numbers.length === 0) {
      return 0;
    }

    return numbers.reduce((acc, num) => acc + this.parse(num), 0);
  }

  /**
   * 计算中位数
   * @param {Array<number|string>} numbers - 数字数组
   * @returns {number} 中位数
   */
  median(numbers) {
    if (!Array.isArray(numbers) || numbers.length === 0) {
      return 0;
    }

    const sorted = numbers
      .map(num => this.parse(num))
      .sort((a, b) => a - b);
    
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  /**
   * 计算众数
   * @param {Array<number|string>} numbers - 数字数组
   * @returns {number} 众数
   */
  mode(numbers) {
    if (!Array.isArray(numbers) || numbers.length === 0) {
      return 0;
    }

    const counts = {};
    numbers.forEach(num => {
      const parsed = this.parse(num);
      counts[parsed] = (counts[parsed] || 0) + 1;
    });

    let maxCount = 0;
    let mode = 0;

    Object.entries(counts).forEach(([num, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mode = parseFloat(num);
      }
    });

    return mode;
  }

  /**
   * 计算方差
   * @param {Array<number|string>} numbers - 数字数组
   * @returns {number} 方差
   */
  variance(numbers) {
    if (!Array.isArray(numbers) || numbers.length <= 1) {
      return 0;
    }

    const avg = this.average(numbers);
    const squaredDiffs = numbers.map(num => {
      const diff = this.parse(num) - avg;
      return diff * diff;
    });

    return this.sum(squaredDiffs) / numbers.length;
  }

  /**
   * 计算标准差
   * @param {Array<number|string>} numbers - 数字数组
   * @returns {number} 标准差
   */
  standardDeviation(numbers) {
    return Math.sqrt(this.variance(numbers));
  }

  /**
   * 转换数字到指定进制
   * @param {number|string} num - 数字
   * @param {number} base - 目标进制（2-36）
   * @returns {string} 转换后的字符串
   */
  convertBase(num, base = 10) {
    const number = this.parse(num);
    if (isNaN(number)) {
      return '';
    }
    return number.toString(base);
  }

  /**
   * 计算百分比变化
   * @param {number|string} oldValue - 旧值
   * @param {number|string} newValue - 新值
   * @returns {number} 百分比变化
   */
  percentageChange(oldValue, newValue) {
    const oldNum = this.parse(oldValue);
    const newNum = this.parse(newValue);

    if (oldNum === 0) {
      return newNum === 0 ? 0 : (newNum > 0 ? 100 : -100);
    }

    return ((newNum - oldNum) / Math.abs(oldNum)) * 100;
  }

  /**
   * 计算折扣金额
   * @param {number|string} originalPrice - 原价
   * @param {number|string} discount - 折扣（百分比）
   * @returns {number} 折扣金额
   */
  calculateDiscount(originalPrice, discount) {
    const price = this.parse(originalPrice);
    const discountRate = this.parse(discount);
    return price * (discountRate / 100);
  }

  /**
   * 计算折后价格
   * @param {number|string} originalPrice - 原价
   * @param {number|string} discount - 折扣（百分比）
   * @returns {number} 折后价格
   */
  calculateDiscountedPrice(originalPrice, discount) {
    const price = this.parse(originalPrice);
    const discountAmount = this.calculateDiscount(price, discount);
    return price - discountAmount;
  }

  /**
   * 格式化文件大小
   * @param {number|string} bytes - 字节数
   * @param {number} decimals - 小数位数
   * @returns {string} 格式化后的大小
   */
  formatFileSize(bytes, decimals = 2) {
    const number = this.parse(bytes);
    if (number === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(number) / Math.log(k));

    return `${this.format(number / Math.pow(k, i), decimals)} ${sizes[i]}`;
  }

  /**
   * 检查是否为整数
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为整数
   */
  isInteger(value) {
    return Number.isInteger(this.parse(value));
  }

  /**
   * 检查是否为浮点数
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为浮点数
   */
  isFloat(value) {
    const number = this.parse(value);
    return !Number.isInteger(number) && !isNaN(number);
  }

  /**
   * 检查是否为正数
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为正数
   */
  isPositive(value) {
    return this.parse(value) > 0;
  }

  /**
   * 检查是否为负数
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为负数
   */
  isNegative(value) {
    return this.parse(value) < 0;
  }

  /**
   * 安全地进行数值计算，避免精度问题
   * @param {number|string} num1 - 第一个数
   * @param {string} operator - 运算符
   * @param {number|string} num2 - 第二个数
   * @returns {number} 计算结果
   */
  safeCalculate(num1, operator, num2) {
    const n1 = this.parse(num1);
    const n2 = this.parse(num2);
    
    // 使用toFixed处理精度问题
    switch (operator) {
      case '+':
        return Number((n1 + n2).toFixed(10));
      case '-':
        return Number((n1 - n2).toFixed(10));
      case '*':
        return Number((n1 * n2).toFixed(10));
      case '/':
        if (n2 === 0) return 0;
        return Number((n1 / n2).toFixed(10));
      case '%':
        if (n2 === 0) return 0;
        return Number((n1 % n2).toFixed(10));
      default:
        return 0;
    }
  }

  /**
   * 将数字转换为中文数字
   * @param {number|string} num - 数字
   * @returns {string} 中文数字
   */
  toChineseNumber(num) {
    const number = this.parse(num);
    if (number === 0) return '零';
    if (number < 0 || number >= 100000000) return String(number);

    const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const units = ['', '十', '百', '千'];
    const bigUnits = ['', '万'];

    let result = '';
    let unitIndex = 0;
    let bigUnitIndex = 0;
    let temp = Math.floor(number);

    while (temp > 0) {
      const section = temp % 10000;
      if (section > 0) {
        let sectionStr = '';
        let sectionTemp = section;
        let sectionUnitIndex = 0;
        let lastWasZero = false;

        while (sectionTemp > 0) {
          const digit = sectionTemp % 10;
          if (digit === 0) {
            if (!lastWasZero && sectionUnitIndex > 0) {
              sectionStr = digits[digit] + sectionStr;
              lastWasZero = true;
            }
          } else {
            sectionStr = digits[digit] + units[sectionUnitIndex] + sectionStr;
            lastWasZero = false;
          }
          sectionTemp = Math.floor(sectionTemp / 10);
          sectionUnitIndex++;
        }

        result = sectionStr + bigUnits[bigUnitIndex] + result;
      }
      temp = Math.floor(temp / 10000);
      bigUnitIndex++;
    }

    // 处理特殊情况：一十 -> 十
    if (result.startsWith('一十')) {
      result = result.substring(1);
    }

    return result;
  }
}

// 导出单例实例
const numberUtils = new NumberUtils();
export default numberUtils;
export { NumberUtils };