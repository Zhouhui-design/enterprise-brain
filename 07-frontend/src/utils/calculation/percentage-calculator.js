/**
 * 百分比计算工具
 * 支持各类百分比相关计算：百分比转换、增长/减少百分比、占比计算等
 */
class PercentageCalculator {
  /**
   * 计算一个数是另一个数的百分之几
   * @param {number} part - 部分值
   * @param {number} whole - 整体值
   * @param {number} decimals - 保留小数位数
   * @returns {number} 百分比值（不含%符号）
   */
  calculatePercentage(part, whole, decimals = 2) {
    // 参数验证
    if (typeof part !== 'number' || typeof whole !== 'number') {
      throw new Error('参数必须是数字');
    }
    
    if (whole === 0) {
      throw new Error('整体值不能为零');
    }
    
    const percentage = (part / whole) * 100;
    return Number(percentage.toFixed(decimals));
  }

  /**
   * 计算一个数的百分比值
   * @param {number} value - 原始值
   * @param {number} percentage - 百分比
   * @param {number} decimals - 保留小数位数
   * @returns {number} 计算结果
   */
  calculateValueOfPercentage(value, percentage, decimals = 2) {
    if (typeof value !== 'number' || typeof percentage !== 'number') {
      throw new Error('参数必须是数字');
    }
    
    const result = value * (percentage / 100);
    return Number(result.toFixed(decimals));
  }

  /**
   * 计算增长百分比
   * @param {number} oldValue - 旧值
   * @param {number} newValue - 新值
   * @param {number} decimals - 保留小数位数
   * @returns {number} 增长百分比（正数为增长，负数为减少）
   */
  calculateGrowthPercentage(oldValue, newValue, decimals = 2) {
    if (typeof oldValue !== 'number' || typeof newValue !== 'number') {
      throw new Error('参数必须是数字');
    }
    
    if (oldValue === 0) {
      // 处理旧值为零的情况
      return newValue > 0 ? Infinity : 0;
    }
    
    const growth = ((newValue - oldValue) / Math.abs(oldValue)) * 100;
    return Number(growth.toFixed(decimals));
  }

  /**
   * 计算折扣后的价格
   * @param {number} originalPrice - 原价
   * @param {number} discountPercentage - 折扣百分比（如20表示20%折扣）
   * @param {number} decimals - 保留小数位数
   * @returns {Object} {discountedPrice, discountAmount}
   */
  calculateDiscount(originalPrice, discountPercentage, decimals = 2) {
    if (typeof originalPrice !== 'number' || typeof discountPercentage !== 'number') {
      throw new Error('参数必须是数字');
    }
    
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error('折扣百分比必须在0到100之间');
    }
    
    const discountAmount = originalPrice * (discountPercentage / 100);
    const discountedPrice = originalPrice - discountAmount;
    
    return {
      discountedPrice: Number(discountedPrice.toFixed(decimals)),
      discountAmount: Number(discountAmount.toFixed(decimals))
    };
  }

  /**
   * 计算税收金额
   * @param {number} price - 税前价格
   * @param {number} taxPercentage - 税率百分比
   * @param {number} decimals - 保留小数位数
   * @returns {Object} {taxAmount, totalPrice}
   */
  calculateTax(price, taxPercentage, decimals = 2) {
    if (typeof price !== 'number' || typeof taxPercentage !== 'number') {
      throw new Error('参数必须是数字');
    }
    
    if (taxPercentage < 0) {
      throw new Error('税率不能为负数');
    }
    
    const taxAmount = price * (taxPercentage / 100);
    const totalPrice = price + taxAmount;
    
    return {
      taxAmount: Number(taxAmount.toFixed(decimals)),
      totalPrice: Number(totalPrice.toFixed(decimals))
    };
  }

  /**
   * 将小数转换为百分比
   * @param {number} decimal - 小数值
   * @param {number} decimals - 保留小数位数
   * @returns {string} 百分比字符串（带%符号）
   */
  decimalToPercentage(decimal, decimals = 2) {
    if (typeof decimal !== 'number') {
      throw new Error('参数必须是数字');
    }
    
    const percentage = decimal * 100;
    return `${percentage.toFixed(decimals)}%`;
  }

  /**
   * 将百分比字符串转换为小数
   * @param {string} percentageString - 百分比字符串（如"25%"）
   * @returns {number} 小数值
   */
  percentageToDecimal(percentageString) {
    if (typeof percentageString !== 'string') {
      throw new Error('参数必须是字符串');
    }
    
    // 移除百分号并转换为数字
    const num = parseFloat(percentageString.replace('%', ''));
    
    if (isNaN(num)) {
      throw new Error('无效的百分比字符串');
    }
    
    return num / 100;
  }

  /**
   * 计算加权平均百分比
   * @param {Array} items - 项目数组 [{value, weight}]
   * @param {number} decimals - 保留小数位数
   * @returns {number} 加权平均百分比
   */
  calculateWeightedAverage(items, decimals = 2) {
    if (!Array.isArray(items)) {
      throw new Error('items参数必须是数组');
    }
    
    if (items.length === 0) {
      return 0;
    }
    
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (const item of items) {
      if (typeof item.value !== 'number' || typeof item.weight !== 'number') {
        throw new Error('每个项目必须包含value和weight数字属性');
      }
      
      totalWeight += item.weight;
      weightedSum += item.value * item.weight;
    }
    
    if (totalWeight === 0) {
      throw new Error('总权重不能为零');
    }
    
    const weightedAverage = weightedSum / totalWeight;
    return Number(weightedAverage.toFixed(decimals));
  }

  /**
   * 计算完成百分比
   * @param {number} completed - 已完成数量
   * @param {number} total - 总数量
   * @param {number} decimals - 保留小数位数
   * @returns {number} 完成百分比
   */
  calculateCompletionPercentage(completed, total, decimals = 2) {
    return this.calculatePercentage(completed, total, decimals);
  }

  /**
   * 计算误差百分比
   * @param {number} measuredValue - 测量值
   * @param {number} actualValue - 实际值
   * @param {number} decimals - 保留小数位数
   * @returns {number} 误差百分比
   */
  calculateErrorPercentage(measuredValue, actualValue, decimals = 2) {
    if (typeof measuredValue !== 'number' || typeof actualValue !== 'number') {
      throw new Error('参数必须是数字');
    }
    
    if (actualValue === 0) {
      throw new Error('实际值不能为零');
    }
    
    const error = Math.abs((measuredValue - actualValue) / actualValue) * 100;
    return Number(error.toFixed(decimals));
  }

  /**
   * 格式化百分比输出
   * @param {number} value - 百分比值（不含%）
   * @param {number} decimals - 保留小数位数
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化的百分比字符串
   */
  formatPercentage(value, decimals = 2, options = {}) {
    const {
      showSign = false,
      showSymbol = true
    } = options;
    
    if (typeof value !== 'number') {
      throw new Error('参数必须是数字');
    }
    
    let formattedValue = value.toFixed(decimals);
    
    // 添加正负号（如果需要）
    if (showSign && value > 0) {
      formattedValue = `+${formattedValue}`;
    }
    
    // 添加百分号（如果需要）
    if (showSymbol) {
      formattedValue += '%';
    }
    
    return formattedValue;
  }

  /**
   * 批量计算百分比
   * @param {Array} calculations - 计算任务数组
   * @returns {Array} 计算结果数组
   */
  batchCalculate(calculations) {
    if (!Array.isArray(calculations)) {
      throw new Error('calculations参数必须是数组');
    }
    
    return calculations.map(item => {
      try {
        let result;
        
        switch (item.type) {
          case 'percentage':
            result = this.calculatePercentage(item.part, item.whole, item.decimals);
            break;
          case 'valueOfPercentage':
            result = this.calculateValueOfPercentage(item.value, item.percentage, item.decimals);
            break;
          case 'growth':
            result = this.calculateGrowthPercentage(item.oldValue, item.newValue, item.decimals);
            break;
          case 'discount':
            result = this.calculateDiscount(item.originalPrice, item.discountPercentage, item.decimals);
            break;
          case 'tax':
            result = this.calculateTax(item.price, item.taxPercentage, item.decimals);
            break;
          default:
            throw new Error(`不支持的计算类型: ${item.type}`);
        }
        
        return {
          original: item,
          result: result,
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
   * 计算百分比变化的原始值
   * @param {number} currentValue - 当前值
   * @param {number} percentageChange - 百分比变化
   * @param {number} decimals - 保留小数位数
   * @returns {number} 原始值
   */
  calculateOriginalValue(currentValue, percentageChange, decimals = 2) {
    if (typeof currentValue !== 'number' || typeof percentageChange !== 'number') {
      throw new Error('参数必须是数字');
    }
    
    // 原始值 = 当前值 / (1 + 百分比变化/100)
    const originalValue = currentValue / (1 + percentageChange / 100);
    return Number(originalValue.toFixed(decimals));
  }

  /**
   * 计算复合增长率(CAGR)
   * @param {number} beginningValue - 期初值
   * @param {number} endingValue - 期末值
   * @param {number} periods - 期数
   * @param {number} decimals - 保留小数位数
   * @returns {number} 复合年增长率百分比
   */
  calculateCAGR(beginningValue, endingValue, periods, decimals = 2) {
    if (typeof beginningValue !== 'number' || 
        typeof endingValue !== 'number' || 
        typeof periods !== 'number') {
      throw new Error('参数必须是数字');
    }
    
    if (beginningValue <= 0 || endingValue <= 0) {
      throw new Error('期初值和期末值必须大于零');
    }
    
    if (periods <= 0) {
      throw new Error('期数必须大于零');
    }
    
    // CAGR = (期末值/期初值)^(1/期数) - 1
    const cagr = (Math.pow(endingValue / beginningValue, 1 / periods) - 1) * 100;
    return Number(cagr.toFixed(decimals));
  }

  /**
   * 计算部分相对于总值的比例（小数形式）
   * @param {number} part - 部分值
   * @param {number} total - 总值
   * @param {number} decimals - 保留小数位数
   * @returns {number} 比例值（0-1之间）
   */
  calculateRatio(part, total, decimals = 4) {
    if (typeof part !== 'number' || typeof total !== 'number') {
      throw new Error('参数必须是数字');
    }
    
    if (total === 0) {
      throw new Error('总值不能为零');
    }
    
    const ratio = part / total;
    return Number(ratio.toFixed(decimals));
  }

  /**
   * 根据百分比和总值计算部分值
   * @param {number} percentage - 百分比
   * @param {number} total - 总值
   * @param {number} decimals - 保留小数位数
   * @returns {number} 部分值
   */
  calculatePartFromPercentage(percentage, total, decimals = 2) {
    return this.calculateValueOfPercentage(total, percentage, decimals);
  }

  /**
   * 根据部分值和百分比计算总值
   * @param {number} part - 部分值
   * @param {percentage} percentage - 百分比
   * @param {number} decimals - 保留小数位数
   * @returns {number} 总值
   */
  calculateTotalFromPercentage(part, percentage, decimals = 2) {
    if (typeof part !== 'number' || typeof percentage !== 'number') {
      throw new Error('参数必须是数字');
    }
    
    if (percentage === 0) {
      throw new Error('百分比不能为零');
    }
    
    const total = (part * 100) / percentage;
    return Number(total.toFixed(decimals));
  }
}

// 导出单例实例
const percentageCalculator = new PercentageCalculator();
export default percentageCalculator;
export { PercentageCalculator };