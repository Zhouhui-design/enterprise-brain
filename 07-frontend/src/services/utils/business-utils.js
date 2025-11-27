/**
 * 业务工具类
 * 提供各种业务相关的通用功能
 */
class BusinessUtils {
  constructor() {
    // 业务相关常量
    this.businessConstants = {
      // 税率相关
      taxRates: {
        vat: 0.13, // 增值税率
        consumption: 0.05, // 消费税率
        service: 0.06 // 服务税率
      },
      // 折扣阈值
      discountThresholds: {
        small: 1000,
        medium: 5000,
        large: 10000
      },
      // 账期相关
      paymentTerms: {
        immediate: 0,
        net7: 7,
        net15: 15,
        net30: 30,
        net45: 45,
        net60: 60
      }
    };
  }

  /**
   * 计算含税价格
   * @param {number} price - 不含税价格
   * @param {number} taxRate - 税率（百分比）
   * @returns {number} 含税价格
   */
  calculatePriceWithTax(price, taxRate = this.businessConstants.taxRates.vat * 100) {
    const rate = taxRate / 100;
    return price * (1 + rate);
  }

  /**
   * 计算税额
   * @param {number} price - 价格
   * @param {number} taxRate - 税率（百分比）
   * @returns {number} 税额
   */
  calculateTaxAmount(price, taxRate = this.businessConstants.taxRates.vat * 100) {
    const rate = taxRate / 100;
    return price * rate;
  }

  /**
   * 从含税价格计算不含税价格
   * @param {number} priceWithTax - 含税价格
   * @param {number} taxRate - 税率（百分比）
   * @returns {number} 不含税价格
   */
  calculatePriceExcludingTax(priceWithTax, taxRate = this.businessConstants.taxRates.vat * 100) {
    const rate = taxRate / 100;
    return priceWithTax / (1 + rate);
  }

  /**
   * 计算订单总金额
   * @param {Array} items - 订单项数组 [{price, quantity, discount?, taxRate?}]
   * @returns {Object} 计算结果 {subtotal, discount, tax, total}
   */
  calculateOrderTotal(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return { subtotal: 0, discount: 0, tax: 0, total: 0 };
    }

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    items.forEach(item => {
      const price = item.price || 0;
      const quantity = item.quantity || 1;
      const itemDiscount = item.discount || 0;
      const itemTaxRate = item.taxRate || this.businessConstants.taxRates.vat * 100;

      const itemSubtotal = price * quantity;
      const itemDiscountAmount = (itemSubtotal * itemDiscount) / 100;
      const itemPriceAfterDiscount = itemSubtotal - itemDiscountAmount;
      const itemTaxAmount = this.calculateTaxAmount(itemPriceAfterDiscount, itemTaxRate);

      subtotal += itemSubtotal;
      discountTotal += itemDiscountAmount;
      taxTotal += itemTaxAmount;
    });

    const total = subtotal - discountTotal + taxTotal;

    return {
      subtotal,
      discount: discountTotal,
      tax: taxTotal,
      total
    };
  }

  /**
   * 计算折扣价格
   * @param {number} price - 原价
   * @param {number} discount - 折扣（百分比）
   * @returns {number} 折扣后价格
   */
  calculateDiscountPrice(price, discount) {
    return price * (1 - discount / 100);
  }

  /**
   * 根据订单金额获取推荐折扣
   * @param {number} orderAmount - 订单金额
   * @returns {number} 推荐折扣百分比
   */
  getRecommendedDiscount(orderAmount) {
    const thresholds = this.businessConstants.discountThresholds;

    if (orderAmount >= thresholds.large) {
      return 15;
    } else if (orderAmount >= thresholds.medium) {
      return 10;
    } else if (orderAmount >= thresholds.small) {
      return 5;
    }

    return 0;
  }

  /**
   * 计算毛利率
   * @param {number} revenue - 收入
   * @param {number} cost - 成本
   * @returns {number} 毛利率（百分比）
   */
  calculateGrossMargin(revenue, cost) {
    if (revenue <= 0) return 0;
    return ((revenue - cost) / revenue) * 100;
  }

  /**
   * 计算净利润
   * @param {number} revenue - 收入
   * @param {number} cost - 成本
   * @param {number} expenses - 费用
   * @returns {number} 净利润
   */
  calculateNetProfit(revenue, cost, expenses = 0) {
    return revenue - cost - expenses;
  }

  /**
   * 计算净利润率
   * @param {number} revenue - 收入
   * @param {number} cost - 成本
   * @param {number} expenses - 费用
   * @returns {number} 净利润率（百分比）
   */
  calculateNetProfitMargin(revenue, cost, expenses = 0) {
    if (revenue <= 0) return 0;
    const netProfit = this.calculateNetProfit(revenue, cost, expenses);
    return (netProfit / revenue) * 100;
  }

  /**
   * 计算ROI（投资回报率）
   * @param {number} gain - 收益
   * @param {number} cost - 投资成本
   * @returns {number} ROI（百分比）
   */
  calculateROI(gain, cost) {
    if (cost <= 0) return 0;
    return ((gain - cost) / cost) * 100;
  }

  /**
   * 计算保本点
   * @param {number} fixedCosts - 固定成本
   * @param {number} variableCostPerUnit - 单位变动成本
   * @param {number} pricePerUnit - 单位售价
   * @returns {Object} 保本点 {units, revenue}
   */
  calculateBreakEvenPoint(fixedCosts, variableCostPerUnit, pricePerUnit) {
    if (pricePerUnit <= variableCostPerUnit) {
      return { units: 0, revenue: 0 };
    }

    const contributionMarginPerUnit = pricePerUnit - variableCostPerUnit;
    const units = fixedCosts / contributionMarginPerUnit;
    const revenue = units * pricePerUnit;

    return { units, revenue };
  }

  /**
   * 格式化订单号
   * @param {number|string} orderId - 订单ID
   * @returns {string} 格式化的订单号
   */
  formatOrderNumber(orderId) {
    const id = String(orderId).padStart(8, '0');
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `ORD-${year}${month}${day}-${id}`;
  }

  /**
   * 格式化发票号
   * @param {number|string} invoiceId - 发票ID
   * @returns {string} 格式化的发票号
   */
  formatInvoiceNumber(invoiceId) {
    const id = String(invoiceId).padStart(6, '0');
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `INV-${year}${month}-${id}`;
  }

  /**
   * 生成客户编号
   * @param {string} prefix - 前缀
   * @param {number} sequence - 序列号
   * @returns {string} 客户编号
   */
  generateCustomerCode(prefix = 'C', sequence = 1) {
    const seqStr = String(sequence).padStart(5, '0');
    return `${prefix}-${seqStr}`;
  }

  /**
   * 生成产品编号
   * @param {string} category - 产品类别
   * @param {number} sequence - 序列号
   * @returns {string} 产品编号
   */
  generateProductCode(category, sequence = 1) {
    const categoryCode = category ? String(category).slice(0, 3).toUpperCase() : 'PRD';
    const seqStr = String(sequence).padStart(4, '0');
    return `${categoryCode}-${seqStr}`;
  }

  /**
   * 计算预计交货日期
   * @param {Date|string} orderDate - 订单日期
   * @param {number} leadTime - 交货周期（天）
   * @returns {Date} 预计交货日期
   */
  calculateEstimatedDeliveryDate(orderDate, leadTime = 7) {
    const date = orderDate instanceof Date ? orderDate : new Date(orderDate);
    const deliveryDate = new Date(date);
    deliveryDate.setDate(deliveryDate.getDate() + leadTime);
    return deliveryDate;
  }

  /**
   * 计算账期到期日
   * @param {Date|string} transactionDate - 交易日期
   * @param {number|string} paymentTerm - 账期（天数或预设值如'net30'）
   * @returns {Date} 到期日期
   */
  calculateDueDate(transactionDate, paymentTerm = 'net30') {
    const date = transactionDate instanceof Date ? transactionDate : new Date(transactionDate);
    const dueDate = new Date(date);
    
    let days;
    if (typeof paymentTerm === 'number') {
      days = paymentTerm;
    } else {
      days = this.businessConstants.paymentTerms[paymentTerm] || this.businessConstants.paymentTerms.net30;
    }
    
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate;
  }

  /**
   * 检查是否逾期
   * @param {Date|string} dueDate - 到期日期
   * @returns {boolean} 是否逾期
   */
  isOverdue(dueDate) {
    const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return today > due;
  }

  /**
   * 计算逾期天数
   * @param {Date|string} dueDate - 到期日期
   * @returns {number} 逾期天数
   */
  calculateOverdueDays(dueDate) {
    if (!this.isOverdue(dueDate)) return 0;
    
    const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
    const today = new Date();
    const diffTime = Math.abs(today - due);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 验证订单状态转换
   * @param {string} currentStatus - 当前状态
   * @param {string} targetStatus - 目标状态
   * @returns {boolean} 是否允许转换
   */
  isValidStatusTransition(currentStatus, targetStatus) {
    // 定义订单状态转换规则
    const allowedTransitions = {
      'pending': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'returned'],
      'delivered': ['returned', 'completed'],
      'returned': ['refunded'],
      'cancelled': [],
      'completed': [],
      'refunded': []
    };

    return allowedTransitions[currentStatus]?.includes(targetStatus) || false;
  }

  /**
   * 计算库存周转率
   * @param {number} costOfGoodsSold - 销售成本
   * @param {number} averageInventory - 平均库存
   * @returns {number} 库存周转率
   */
  calculateInventoryTurnover(costOfGoodsSold, averageInventory) {
    if (averageInventory <= 0) return 0;
    return costOfGoodsSold / averageInventory;
  }

  /**
   * 计算库存周转天数
   * @param {number} costOfGoodsSold - 销售成本
   * @param {number} averageInventory - 平均库存
   * @returns {number} 库存周转天数
   */
  calculateInventoryDays(costOfGoodsSold, averageInventory) {
    const turnover = this.calculateInventoryTurnover(costOfGoodsSold, averageInventory);
    if (turnover <= 0) return 0;
    return 365 / turnover;
  }

  /**
   * 计算应收账款周转率
   * @param {number} netCreditSales - 信用销售额
   * @param {number} averageAccountsReceivable - 平均应收账款
   * @returns {number} 应收账款周转率
   */
  calculateAccountsReceivableTurnover(netCreditSales, averageAccountsReceivable) {
    if (averageAccountsReceivable <= 0) return 0;
    return netCreditSales / averageAccountsReceivable;
  }

  /**
   * 计算应收账款周转天数
   * @param {number} netCreditSales - 信用销售额
   * @param {number} averageAccountsReceivable - 平均应收账款
   * @returns {number} 应收账款周转天数
   */
  calculateAccountsReceivableDays(netCreditSales, averageAccountsReceivable) {
    const turnover = this.calculateAccountsReceivableTurnover(netCreditSales, averageAccountsReceivable);
    if (turnover <= 0) return 0;
    return 365 / turnover;
  }

  /**
   * 计算客户终身价值(LTV)
   * @param {number} averagePurchaseValue - 平均购买价值
   * @param {number} purchaseFrequency - 购买频率（每年）
   * @param {number} customerLifespan - 客户生命周期（年）
   * @returns {number} 客户终身价值
   */
  calculateCustomerLTV(averagePurchaseValue, purchaseFrequency, customerLifespan) {
    return averagePurchaseValue * purchaseFrequency * customerLifespan;
  }

  /**
   * 计算客户获取成本(CAC)
   * @param {number} marketingCosts - 营销成本
   * @param {number} salesCosts - 销售成本
   * @param {number} newCustomers - 新客户数量
   * @returns {number} 客户获取成本
   */
  calculateCAC(marketingCosts, salesCosts, newCustomers) {
    if (newCustomers <= 0) return 0;
    return (marketingCosts + salesCosts) / newCustomers;
  }

  /**
   * 计算LTV:CAC比率
   * @param {number} ltv - 客户终身价值
   * @param {number} cac - 客户获取成本
   * @returns {number} LTV:CAC比率
   */
  calculateLTVCACRatio(ltv, cac) {
    if (cac <= 0) return 0;
    return ltv / cac;
  }

  /**
   * 格式化业务金额（带千位分隔符和货币符号）
   * @param {number} amount - 金额
   * @param {string} currency - 货币符号
   * @returns {string} 格式化的金额
   */
  formatBusinessAmount(amount, currency = '¥') {
    if (typeof amount !== 'number') {
      amount = parseFloat(amount) || 0;
    }
    
    return `${currency}${amount.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * 验证业务代码格式
   * @param {string} code - 业务代码
   * @param {string} pattern - 正则表达式模式
   * @returns {boolean} 是否有效
   */
  isValidBusinessCode(code, pattern = /^[A-Z0-9-]{3,20}$/) {
    return pattern.test(code);
  }

  /**
   * 生成业务操作日志描述
   * @param {string} action - 操作类型
   * @param {string} entityType - 实体类型
   * @param {string} entityId - 实体ID
   * @param {Object} details - 详细信息
   * @returns {string} 日志描述
   */
  generateOperationLog(action, entityType, entityId, details = {}) {
    const timestamp = new Date().toLocaleString('zh-CN');
    const detailStr = Object.entries(details)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    return `[${timestamp}] ${action} ${entityType} (ID: ${entityId})${detailStr ? ` - ${detailStr}` : ''}`;
  }

  /**
   * 计算批量折扣
   * @param {number} quantity - 数量
   * @param {Array} tieredDiscounts - 阶梯折扣配置 [{minQuantity, discountPercentage}]
   * @returns {number} 折扣百分比
   */
  calculateTieredDiscount(quantity, tieredDiscounts) {
    if (!Array.isArray(tieredDiscounts) || tieredDiscounts.length === 0) {
      return 0;
    }

    // 按最小数量降序排序
    const sortedDiscounts = [...tieredDiscounts].sort((a, b) => b.minQuantity - a.minQuantity);
    
    for (const tier of sortedDiscounts) {
      if (quantity >= tier.minQuantity) {
        return tier.discountPercentage;
      }
    }

    return 0;
  }

  /**
   * 评估信用风险等级
   * @param {number} creditScore - 信用分数
   * @returns {Object} 风险评估 {level, description}
   */
  evaluateCreditRisk(creditScore) {
    if (creditScore >= 80) {
      return { level: 'low', description: '低风险' };
    } else if (creditScore >= 60) {
      return { level: 'medium', description: '中等风险' };
    } else if (creditScore >= 40) {
      return { level: 'high', description: '高风险' };
    } else {
      return { level: 'critical', description: '极高风险' };
    }
  }

  /**
   * 计算复合年增长率(CAGR)
   * @param {number} beginningValue - 初始值
   * @param {number} endingValue - 结束值
   * @param {number} years - 年数
   * @returns {number} CAGR（百分比）
   */
  calculateCAGR(beginningValue, endingValue, years) {
    if (beginningValue <= 0 || years <= 0) return 0;
    return (Math.pow(endingValue / beginningValue, 1 / years) - 1) * 100;
  }
}

// 导出单例实例
const businessUtils = new BusinessUtils();
export default businessUtils;
export { BusinessUtils };