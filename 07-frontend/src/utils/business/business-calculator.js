/**
 * 业务计算工具
 * 提供各类业务场景下的计算功能
 */
class BusinessCalculator {
  /**
   * 计算毛利率
   * @param {number} revenue - 收入
   * @param {number} cost - 成本
   * @param {Object} options - 计算选项
   * @returns {Object} 毛利率计算结果
   */
  calculateGrossMargin(revenue, cost, options = {}) {
    const {
      decimals = 2
    } = options;

    if (revenue <= 0) {
      throw new Error('收入必须大于零');
    }

    const grossProfit = revenue - cost;
    const grossMarginRate = (grossProfit / revenue) * 100;

    return {
      grossProfit: Number(grossProfit.toFixed(decimals)),
      grossMarginRate: Number(grossMarginRate.toFixed(decimals)),
      revenue: Number(revenue.toFixed(decimals)),
      cost: Number(cost.toFixed(decimals))
    };
  }

  /**
   * 计算净利润
   * @param {number} revenue - 收入
   * @param {number} cost - 成本
   * @param {Object} expenses - 费用明细
   * @param {Object} options - 计算选项
   * @returns {Object} 净利润计算结果
   */
  calculateNetProfit(revenue, cost, expenses = {}, options = {}) {
    const {
      decimals = 2
    } = options;

    // 计算毛利润
    const grossProfit = revenue - cost;

    // 计算总费用
    const totalExpenses = Object.values(expenses).reduce((sum, expense) => sum + expense, 0);

    // 计算净利润
    const netProfit = grossProfit - totalExpenses;
    const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      revenue: Number(revenue.toFixed(decimals)),
      cost: Number(cost.toFixed(decimals)),
      grossProfit: Number(grossProfit.toFixed(decimals)),
      totalExpenses: Number(totalExpenses.toFixed(decimals)),
      expenses: Object.entries(expenses).reduce((acc, [key, value]) => {
        acc[key] = Number(value.toFixed(decimals));
        return acc;
      }, {}),
      netProfit: Number(netProfit.toFixed(decimals)),
      netProfitMargin: Number(netProfitMargin.toFixed(decimals))
    };
  }

  /**
   * 计算投资回报率(ROI)
   * @param {number} investment - 投资额
   * @param {number} returnValue - 回报金额
   * @param {number} years - 投资年限
   * @param {Object} options - 计算选项
   * @returns {Object} ROI计算结果
   */
  calculateROI(investment, returnValue, years = 1, options = {}) {
    const {
      decimals = 2
    } = options;

    if (investment <= 0) {
      throw new Error('投资额必须大于零');
    }

    if (years <= 0) {
      throw new Error('投资年限必须大于零');
    }

    const netReturn = returnValue - investment;
    const roi = (netReturn / investment) * 100;
    const annualROI = roi / years;

    return {
      investment: Number(investment.toFixed(decimals)),
      returnValue: Number(returnValue.toFixed(decimals)),
      netReturn: Number(netReturn.toFixed(decimals)),
      roi: Number(roi.toFixed(decimals)),
      annualROI: Number(annualROI.toFixed(decimals)),
      years
    };
  }

  /**
   * 计算保本点
   * @param {number} fixedCosts - 固定成本
   * @param {number} variableCostPerUnit - 单位变动成本
   * @param {number} sellingPricePerUnit - 单位售价
   * @param {Object} options - 计算选项
   * @returns {Object} 保本点计算结果
   */
  calculateBreakEvenPoint(fixedCosts, variableCostPerUnit, sellingPricePerUnit, options = {}) {
    const {
      decimals = 2
    } = options;

    if (sellingPricePerUnit <= variableCostPerUnit) {
      throw new Error('售价必须大于单位变动成本');
    }

    const contributionMarginPerUnit = sellingPricePerUnit - variableCostPerUnit;
    const contributionMarginRatio = contributionMarginPerUnit / sellingPricePerUnit;
    const breakEvenUnits = fixedCosts / contributionMarginPerUnit;
    const breakEvenRevenue = fixedCosts / contributionMarginRatio;

    return {
      fixedCosts: Number(fixedCosts.toFixed(decimals)),
      variableCostPerUnit: Number(variableCostPerUnit.toFixed(decimals)),
      sellingPricePerUnit: Number(sellingPricePerUnit.toFixed(decimals)),
      contributionMarginPerUnit: Number(contributionMarginPerUnit.toFixed(decimals)),
      contributionMarginRatio: Number((contributionMarginRatio * 100).toFixed(decimals)),
      breakEvenUnits: Math.ceil(breakEvenUnits),
      breakEvenRevenue: Number(breakEvenRevenue.toFixed(decimals))
    };
  }

  /**
   * 计算客户终身价值(LTV)
   * @param {number} averageOrderValue - 平均订单价值
   * @param {number} purchaseFrequency - 购买频率(每年)
   * @param {number} customerLifespan - 客户生命周期(年)
   * @param {Object} options - 计算选项
   * @returns {Object} LTV计算结果
   */
  calculateCustomerLTV(averageOrderValue, purchaseFrequency, customerLifespan, options = {}) {
    const {
      decimals = 2
    } = options;

    const customerValue = averageOrderValue * purchaseFrequency;
    const ltv = customerValue * customerLifespan;

    // 如果提供了获客成本，可以计算LTV:CAC比率
    let ltvToCacRatio = null;
    if (options.customerAcquisitionCost) {
      ltvToCacRatio = ltv / options.customerAcquisitionCost;
    }

    return {
      averageOrderValue: Number(averageOrderValue.toFixed(decimals)),
      purchaseFrequency: Number(purchaseFrequency.toFixed(decimals)),
      customerLifespan: Number(customerLifespan.toFixed(decimals)),
      customerValue: Number(customerValue.toFixed(decimals)),
      ltv: Number(ltv.toFixed(decimals)),
      ltvToCacRatio: ltvToCacRatio !== null ? Number(ltvToCacRatio.toFixed(decimals)) : null
    };
  }

  /**
   * 计算库存周转率
   * @param {number} costOfGoodsSold - 销售成本
   * @param {number} averageInventory - 平均库存价值
   * @param {Object} options - 计算选项
   * @returns {Object} 库存周转率计算结果
   */
  calculateInventoryTurnover(costOfGoodsSold, averageInventory, options = {}) {
    const {
      decimals = 2
    } = options;

    if (averageInventory <= 0) {
      throw new Error('平均库存价值必须大于零');
    }

    const turnoverRatio = costOfGoodsSold / averageInventory;
    const daysInInventory = 365 / turnoverRatio;

    return {
      costOfGoodsSold: Number(costOfGoodsSold.toFixed(decimals)),
      averageInventory: Number(averageInventory.toFixed(decimals)),
      turnoverRatio: Number(turnoverRatio.toFixed(decimals)),
      daysInInventory: Number(daysInInventory.toFixed(decimals))
    };
  }

  /**
   * 计算应收账款周转率
   * @param {number} netCreditSales - 赊销净额
   * @param {number} averageAccountsReceivable - 平均应收账款
   * @param {Object} options - 计算选项
   * @returns {Object} 应收账款周转率计算结果
   */
  calculateAccountsReceivableTurnover(netCreditSales, averageAccountsReceivable, options = {}) {
    const {
      decimals = 2
    } = options;

    if (averageAccountsReceivable <= 0) {
      throw new Error('平均应收账款必须大于零');
    }

    const turnoverRatio = netCreditSales / averageAccountsReceivable;
    const daysSalesOutstanding = 365 / turnoverRatio;

    return {
      netCreditSales: Number(netCreditSales.toFixed(decimals)),
      averageAccountsReceivable: Number(averageAccountsReceivable.toFixed(decimals)),
      turnoverRatio: Number(turnoverRatio.toFixed(decimals)),
      daysSalesOutstanding: Number(daysSalesOutstanding.toFixed(decimals))
    };
  }

  /**
   * 计算总资产周转率
   * @param {number} netSales - 销售收入净额
   * @param {number} averageTotalAssets - 平均总资产
   * @param {Object} options - 计算选项
   * @returns {Object} 总资产周转率计算结果
   */
  calculateAssetTurnover(netSales, averageTotalAssets, options = {}) {
    const {
      decimals = 2
    } = options;

    if (averageTotalAssets <= 0) {
      throw new Error('平均总资产必须大于零');
    }

    const turnoverRatio = netSales / averageTotalAssets;

    return {
      netSales: Number(netSales.toFixed(decimals)),
      averageTotalAssets: Number(averageTotalAssets.toFixed(decimals)),
      turnoverRatio: Number(turnoverRatio.toFixed(decimals))
    };
  }

  /**
   * 计算负债率
   * @param {number} totalLiabilities - 总负债
   * @param {number} totalAssets - 总资产
   * @param {Object} options - 计算选项
   * @returns {Object} 负债率计算结果
   */
  calculateDebtRatio(totalLiabilities, totalAssets, options = {}) {
    const {
      decimals = 2
    } = options;

    if (totalAssets <= 0) {
      throw new Error('总资产必须大于零');
    }

    const debtRatio = (totalLiabilities / totalAssets) * 100;
    const equityRatio = 100 - debtRatio;

    return {
      totalLiabilities: Number(totalLiabilities.toFixed(decimals)),
      totalAssets: Number(totalAssets.toFixed(decimals)),
      debtRatio: Number(debtRatio.toFixed(decimals)),
      equityRatio: Number(equityRatio.toFixed(decimals))
    };
  }

  /**
   * 计算流动比率
   * @param {number} currentAssets - 流动资产
   * @param {number} currentLiabilities - 流动负债
   * @param {Object} options - 计算选项
   * @returns {Object} 流动比率计算结果
   */
  calculateCurrentRatio(currentAssets, currentLiabilities, options = {}) {
    const {
      decimals = 2
    } = options;

    if (currentLiabilities <= 0) {
      throw new Error('流动负债必须大于零');
    }

    const currentRatio = currentAssets / currentLiabilities;

    // 同时计算速动比率（如果提供了存货数据）
    let quickRatio = null;
    if (options.inventory) {
      quickRatio = (currentAssets - options.inventory) / currentLiabilities;
    }

    return {
      currentAssets: Number(currentAssets.toFixed(decimals)),
      currentLiabilities: Number(currentLiabilities.toFixed(decimals)),
      currentRatio: Number(currentRatio.toFixed(decimals)),
      quickRatio: quickRatio !== null ? Number(quickRatio.toFixed(decimals)) : null
    };
  }

  /**
   * 计算复合年增长率(CAGR)
   * @param {number} beginningValue - 期初值
   * @param {number} endingValue - 期末值
   * @param {number} periods - 期数(年)
   * @param {Object} options - 计算选项
   * @returns {Object} CAGR计算结果
   */
  calculateCAGR(beginningValue, endingValue, periods, options = {}) {
    const {
      decimals = 2
    } = options;

    if (beginningValue <= 0 || endingValue <= 0) {
      throw new Error('期初值和期末值必须大于零');
    }

    if (periods <= 0) {
      throw new Error('期数必须大于零');
    }

    const cagr = (Math.pow(endingValue / beginningValue, 1 / periods) - 1) * 100;

    return {
      beginningValue: Number(beginningValue.toFixed(decimals)),
      endingValue: Number(endingValue.toFixed(decimals)),
      periods: Number(periods.toFixed(decimals)),
      cagr: Number(cagr.toFixed(decimals))
    };
  }

  /**
   * 计算员工 productivity
   * @param {number} revenue - 收入
   * @param {number} numberOfEmployees - 员工数量
   * @param {Object} options - 计算选项
   * @returns {Object} 员工生产力计算结果
   */
  calculateEmployeeProductivity(revenue, numberOfEmployees, options = {}) {
    const {
      decimals = 2
    } = options;

    if (numberOfEmployees <= 0) {
      throw new Error('员工数量必须大于零');
    }

    const revenuePerEmployee = revenue / numberOfEmployees;
    
    // 如果提供了工资总额，可以计算额外指标
    let profitPerEmployee = null;
    let laborCostRatio = null;
    
    if (options.profit) {
      profitPerEmployee = options.profit / numberOfEmployees;
    }
    
    if (options.totalLaborCost) {
      laborCostRatio = (options.totalLaborCost / revenue) * 100;
    }

    return {
      revenue: Number(revenue.toFixed(decimals)),
      numberOfEmployees,
      revenuePerEmployee: Number(revenuePerEmployee.toFixed(decimals)),
      profitPerEmployee: profitPerEmployee !== null ? Number(profitPerEmployee.toFixed(decimals)) : null,
      laborCostRatio: laborCostRatio !== null ? Number(laborCostRatio.toFixed(decimals)) : null
    };
  }

  /**
   * 计算项目投资回收期
   * @param {Array} cashFlows - 现金流数组
   * @param {number} initialInvestment - 初始投资额
   * @param {Object} options - 计算选项
   * @returns {Object} 投资回收期计算结果
   */
  calculatePaybackPeriod(cashFlows, initialInvestment, options = {}) {
    const {
      decimals = 2
    } = options;

    if (!Array.isArray(cashFlows) || cashFlows.length === 0) {
      throw new Error('现金流必须是非空数组');
    }

    if (initialInvestment <= 0) {
      throw new Error('初始投资额必须大于零');
    }

    let cumulativeCashFlow = -initialInvestment;
    let paybackPeriod = 0;

    // 计算回收期
    for (let i = 0; i < cashFlows.length; i++) {
      if (cashFlows[i] <= 0) {
        throw new Error('所有现金流必须为正数');
      }

      cumulativeCashFlow += cashFlows[i];
      
      if (cumulativeCashFlow >= 0) {
        // 精确计算回收期（线性插值）
        const overshoot = cumulativeCashFlow;
        const lastCashFlow = cashFlows[i];
        const exactPeriod = i + 1 - overshoot / lastCashFlow;
        paybackPeriod = exactPeriod;
        break;
      }
    }

    // 检查是否在给定的现金流期内收回投资
    const investmentRecovered = paybackPeriod > 0;

    return {
      initialInvestment: Number(initialInvestment.toFixed(decimals)),
      cashFlows: cashFlows.map(cf => Number(cf.toFixed(decimals))),
      paybackPeriod: investmentRecovered ? Number(paybackPeriod.toFixed(decimals)) : null,
      investmentRecovered
    };
  }

  /**
   * 计算净现值(NPV)
   * @param {Array} cashFlows - 现金流数组
   * @param {number} discountRate - 折现率(小数形式)
   * @param {number} initialInvestment - 初始投资额
   * @param {Object} options - 计算选项
   * @returns {Object} NPV计算结果
   */
  calculateNPV(cashFlows, discountRate, initialInvestment = 0, options = {}) {
    const {
      decimals = 2
    } = options;

    if (!Array.isArray(cashFlows)) {
      throw new Error('现金流必须是数组');
    }

    if (discountRate < 0) {
      throw new Error('折现率不能为负数');
    }

    // 计算NPV
    let npv = -initialInvestment;
    
    cashFlows.forEach((cashFlow, index) => {
      const period = index + 1;
      npv += cashFlow / Math.pow(1 + discountRate, period);
    });

    return {
      initialInvestment: Number(initialInvestment.toFixed(decimals)),
      cashFlows: cashFlows.map(cf => Number(cf.toFixed(decimals))),
      discountRate: Number((discountRate * 100).toFixed(decimals)),
      npv: Number(npv.toFixed(decimals))
    };
  }

  /**
   * 计算内部收益率(IRR)（简化版）
   * @param {Array} cashFlows - 现金流数组（包括初始投资，通常为负数）
   * @param {Object} options - 计算选项
   * @returns {Object} IRR计算结果
   */
  calculateIRR(cashFlows, options = {}) {
    const {
      decimals = 2,
      iterations = 100,
      tolerance = 0.0001
    } = options;

    if (!Array.isArray(cashFlows) || cashFlows.length < 2) {
      throw new Error('现金流数组至少需要两个元素');
    }

    // 使用二分法求解IRR
    let low = -0.99; // 最低可能的回报率
    let high = 10;   // 最高可能的回报率
    let irr = 0;
    let npv = 0;

    // 确保初始现金流为负数
    if (cashFlows[0] >= 0) {
      throw new Error('初始现金流应为负数（表示投资）');
    }

    // 二分法迭代
    for (let i = 0; i < iterations; i++) {
      irr = (low + high) / 2;
      npv = this._calculateNPVAtRate(cashFlows, irr);

      if (Math.abs(npv) < tolerance) {
        break;
      }

      if (npv > 0) {
        low = irr;
      } else {
        high = irr;
      }
    }

    return {
      cashFlows: cashFlows.map(cf => Number(cf.toFixed(decimals))),
      irr: Number((irr * 100).toFixed(decimals)),
      finalNPV: Number(npv.toFixed(decimals))
    };
  }

  /**
   * 在特定折现率下计算NPV（内部方法）
   * @private
   */
  _calculateNPVAtRate(cashFlows, rate) {
    return cashFlows.reduce((npv, cf, index) => {
      return npv + cf / Math.pow(1 + rate, index);
    }, 0);
  }

  /**
   * 计算盈亏平衡点分析
   * @param {number} fixedCosts - 固定成本
   * @param {number} variableCostPerUnit - 单位变动成本
   * @param {number} sellingPricePerUnit - 单位售价
   * @param {number} targetProfit - 目标利润
   * @param {Object} options - 计算选项
   * @returns {Object} 盈亏平衡分析结果
   */
  calculateBreakEvenAnalysis(fixedCosts, variableCostPerUnit, sellingPricePerUnit, targetProfit = 0, options = {}) {
    const {
      decimals = 2
    } = options;

    if (sellingPricePerUnit <= variableCostPerUnit) {
      throw new Error('售价必须大于单位变动成本');
    }

    const contributionMarginPerUnit = sellingPricePerUnit - variableCostPerUnit;
    const contributionMarginRatio = contributionMarginPerUnit / sellingPricePerUnit;
    
    // 保本点
    const breakEvenUnits = fixedCosts / contributionMarginPerUnit;
    const breakEvenRevenue = fixedCosts / contributionMarginRatio;
    
    // 目标利润点
    const targetUnits = (fixedCosts + targetProfit) / contributionMarginPerUnit;
    const targetRevenue = (fixedCosts + targetProfit) / contributionMarginRatio;

    return {
      fixedCosts: Number(fixedCosts.toFixed(decimals)),
      variableCostPerUnit: Number(variableCostPerUnit.toFixed(decimals)),
      sellingPricePerUnit: Number(sellingPricePerUnit.toFixed(decimals)),
      contributionMarginPerUnit: Number(contributionMarginPerUnit.toFixed(decimals)),
      contributionMarginRatio: Number((contributionMarginRatio * 100).toFixed(decimals)),
      breakEvenUnits: Math.ceil(breakEvenUnits),
      breakEvenRevenue: Number(breakEvenRevenue.toFixed(decimals)),
      targetProfit: Number(targetProfit.toFixed(decimals)),
      targetUnits: Math.ceil(targetUnits),
      targetRevenue: Number(targetRevenue.toFixed(decimals))
    };
  }
}

// 导出单例实例
const businessCalculator = new BusinessCalculator();
export default businessCalculator;
export { BusinessCalculator };