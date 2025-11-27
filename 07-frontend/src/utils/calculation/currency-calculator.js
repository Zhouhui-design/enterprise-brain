/**
 * 货币计算工具
 * 支持货币转换、汇率管理、货币格式化等功能
 */
class CurrencyCalculator {
  constructor() {
    // 默认汇率表（示例汇率，实际应用中应从API获取）
    this.exchangeRates = {
      base: 'CNY', // 默认基准货币
      rates: {
        CNY: 1,
        USD: 0.14,   // 美元
        EUR: 0.13,   // 欧元
        JPY: 20.65,  // 日元
        GBP: 0.11,   // 英镑
        KRW: 184.75, // 韩元
        HKD: 1.09,   // 港币
        TWD: 4.37,   // 新台币
        AUD: 0.21,   // 澳元
        CAD: 0.19,   // 加元
        CHF: 0.12,   // 瑞士法郎
        SGD: 0.19,   // 新加坡元
        RUB: 12.23,  // 卢布
        INR: 11.65,  // 印度卢比
        BRL: 0.70,   // 巴西雷亚尔
        RMB: 1       // 人民币别名
      }
    };
    
    // 货币符号配置
    this.currencySymbols = {
      CNY: '¥',
      USD: '$',
      EUR: '€',
      JPY: '¥',
      GBP: '£',
      KRW: '₩',
      HKD: 'HK$',
      TWD: 'NT$',
      AUD: 'A$',
      CAD: 'C$',
      CHF: 'Fr',
      SGD: 'S$',
      RUB: '₽',
      INR: '₹',
      BRL: 'R$',
      RMB: '¥'
    };
    
    // 汇率更新时间
    this.lastUpdated = new Date();
  }

  /**
   * 设置汇率数据
   * @param {Object} ratesData - 汇率数据对象 {base, rates}
   * @param {string} ratesData.base - 基准货币
   * @param {Object} ratesData.rates - 汇率映射
   */
  setExchangeRates(ratesData) {
    if (ratesData && ratesData.rates) {
      this.exchangeRates.base = ratesData.base || this.exchangeRates.base;
      this.exchangeRates.rates = { ...this.exchangeRates.rates, ...ratesData.rates };
      this.lastUpdated = new Date();
    }
  }

  /**
   * 从基准货币转换
   * @param {number} amount - 金额
   * @param {string} toCurrency - 目标货币代码
   * @returns {number} 转换后的金额
   */
  fromBaseCurrency(amount, toCurrency) {
    if (!this.exchangeRates.rates[toCurrency]) {
      throw new Error(`不支持的货币: ${toCurrency}`);
    }
    
    if (this.exchangeRates.base === toCurrency) {
      return amount;
    }
    
    const baseRate = this.exchangeRates.rates[this.exchangeRates.base];
    const targetRate = this.exchangeRates.rates[toCurrency];
    
    // 先转换到基准货币，再转换到目标货币
    return (amount / baseRate) * targetRate;
  }

  /**
   * 货币转换
   * @param {number} amount - 金额
   * @param {string} fromCurrency - 源货币代码
   * @param {string} toCurrency - 目标货币代码
   * @returns {number} 转换后的金额
   */
  convert(amount, fromCurrency, toCurrency) {
    // 参数验证
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('金额必须是有效数字');
    }
    
    if (!fromCurrency || !toCurrency) {
      throw new Error('货币代码不能为空');
    }
    
    // 检查货币是否支持
    if (!this.exchangeRates.rates[fromCurrency]) {
      throw new Error(`不支持的源货币: ${fromCurrency}`);
    }
    if (!this.exchangeRates.rates[toCurrency]) {
      throw new Error(`不支持的目标货币: ${toCurrency}`);
    }
    
    // 如果是相同货币，直接返回
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    // 转换逻辑：先转换到基准货币，再转换到目标货币
    const amountInBaseCurrency = this._toBaseCurrency(amount, fromCurrency);
    return this.fromBaseCurrency(amountInBaseCurrency, toCurrency);
  }

  /**
   * 转换到基准货币（内部方法）
   * @private
   */
  _toBaseCurrency(amount, fromCurrency) {
    if (this.exchangeRates.base === fromCurrency) {
      return amount;
    }
    
    const rate = this.exchangeRates.rates[fromCurrency];
    const baseRate = this.exchangeRates.rates[this.exchangeRates.base];
    
    return (amount * rate) / baseRate;
  }

  /**
   * 格式化货币显示
   * @param {number} amount - 金额
   * @param {string} currency - 货币代码
   * @param {Object} options - 格式化选项
   * @param {string} options.locale - 地区设置
   * @param {boolean} options.showSymbol - 是否显示货币符号
   * @param {number} options.decimals - 小数位数
   * @returns {string} 格式化后的货币字符串
   */
  format(amount, currency = 'CNY', options = {}) {
    const {
      locale = 'zh-CN',
      showSymbol = true,
      decimals = 2
    } = options;
    
    if (!this.exchangeRates.rates[currency]) {
      throw new Error(`不支持的货币: ${currency}`);
    }
    
    try {
      // 使用Intl.NumberFormat进行国际化格式化
      const formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        style: showSymbol ? 'currency' : 'decimal',
        currency: currency
      });
      
      return formatter.format(amount);
    } catch (error) {
      // 降级方案
      const symbol = showSymbol ? this.currencySymbols[currency] || '' : '';
      return `${symbol}${amount.toFixed(decimals)}`;
    }
  }

  /**
   * 批量转换货币
   * @param {Array} conversions - 转换任务数组 [{amount, fromCurrency, toCurrency}]
   * @returns {Array} 转换结果数组
   */
  batchConvert(conversions) {
    return conversions.map(item => {
      try {
        const result = this.convert(
          item.amount,
          item.fromCurrency,
          item.toCurrency
        );
        return {
          original: item,
          result: result,
          formatted: this.format(result, item.toCurrency, item.formatOptions),
          success: true
        };
      } catch (error) {
        return {
          original: item,
          error: error.message,
          success: false
        };
      }
    });
  }

  /**
   * 获取货币符号
   * @param {string} currency - 货币代码
   * @returns {string} 货币符号
   */
  getCurrencySymbol(currency) {
    return this.currencySymbols[currency] || '';
  }

  /**
   * 注册新的货币
   * @param {string} currencyCode - 货币代码
   * @param {number} rate - 相对于基准货币的汇率
   * @param {string} symbol - 货币符号（可选）
   */
  registerCurrency(currencyCode, rate, symbol = '') {
    this.exchangeRates.rates[currencyCode] = rate;
    if (symbol) {
      this.currencySymbols[currencyCode] = symbol;
    }
  }

  /**
   * 获取所有支持的货币代码
   * @returns {Array} 货币代码数组
   */
  getSupportedCurrencies() {
    return Object.keys(this.exchangeRates.rates);
  }

  /**
   * 获取汇率
   * @param {string} fromCurrency - 源货币
   * @param {string} toCurrency - 目标货币
   * @returns {number} 汇率
   */
  getExchangeRate(fromCurrency, toCurrency) {
    if (!this.exchangeRates.rates[fromCurrency] || !this.exchangeRates.rates[toCurrency]) {
      throw new Error('不支持的货币代码');
    }
    
    if (fromCurrency === toCurrency) {
      return 1;
    }
    
    // 计算从fromCurrency到toCurrency的汇率
    const fromRate = this.exchangeRates.rates[fromCurrency];
    const toRate = this.exchangeRates.rates[toCurrency];
    const baseRate = this.exchangeRates.rates[this.exchangeRates.base];
    
    return (toRate / baseRate) / (fromRate / baseRate);
  }

  /**
   * 货币计算（支持加减乘除）
   * @param {number} num1 - 第一个数值
   * @param {number} num2 - 第二个数值
   * @param {string} operation - 操作类型: '+', '-', '*', '/' 
   * @param {string} currency - 货币代码
   * @returns {number} 计算结果
   */
  calculate(num1, num2, operation, currency = 'CNY') {
    if (!this.exchangeRates.rates[currency]) {
      throw new Error(`不支持的货币: ${currency}`);
    }
    
    let result;
    switch (operation) {
      case '+':
        result = num1 + num2;
        break;
      case '-':
        result = num1 - num2;
        break;
      case '*':
        result = num1 * num2;
        break;
      case '/':
        if (num2 === 0) {
          throw new Error('除数不能为零');
        }
        result = num1 / num2;
        break;
      default:
        throw new Error(`不支持的操作: ${operation}`);
    }
    
    return result;
  }

  /**
   * 计算折扣金额
   * @param {number} originalPrice - 原价
   * @param {number} discountRate - 折扣率（0-1之间）
   * @param {string} currency - 货币代码
   * @returns {Object} {discountAmount, discountedPrice}
   */
  calculateDiscount(originalPrice, discountRate, currency = 'CNY') {
    if (discountRate < 0 || discountRate > 1) {
      throw new Error('折扣率必须在0到1之间');
    }
    
    const discountAmount = originalPrice * discountRate;
    const discountedPrice = originalPrice - discountAmount;
    
    return {
      discountAmount,
      discountedPrice
    };
  }

  /**
   * 计算税费
   * @param {number} price - 价格
   * @param {number} taxRate - 税率（小数形式）
   * @param {string} currency - 货币代码
   * @returns {Object} {taxAmount, totalPrice}
   */
  calculateTax(price, taxRate, currency = 'CNY') {
    if (taxRate < 0) {
      throw new Error('税率不能为负数');
    }
    
    const taxAmount = price * taxRate;
    const totalPrice = price + taxAmount;
    
    return {
      taxAmount,
      totalPrice
    };
  }

  /**
   * 获取汇率更新时间
   * @returns {Date} 更新时间
   */
  getLastUpdatedTime() {
    return this.lastUpdated;
  }

  /**
   * 导出汇率数据
   * @returns {Object} 汇率数据
   */
  exportExchangeRates() {
    return {
      ...this.exchangeRates,
      lastUpdated: this.lastUpdated
    };
  }
}

// 导出单例实例
const currencyCalculator = new CurrencyCalculator();
export default currencyCalculator;
export { CurrencyCalculator };