/**
 * 库存计算工具
 * 提供库存管理相关的计算功能
 */
class InventoryCalculator {
  /**
   * 计算经济订货批量(EOQ)
   * @param {number} annualDemand - 年需求量
   * @param {number} orderingCost - 每次订购成本
   * @param {number} holdingCostPerUnit - 每单位年持有成本
   * @param {Object} options - 计算选项
   * @returns {Object} EOQ计算结果
   */
  calculateEOQ(annualDemand, orderingCost, holdingCostPerUnit, options = {}) {
    const {
      decimals = 2
    } = options;

    if (annualDemand <= 0 || orderingCost <= 0 || holdingCostPerUnit <= 0) {
      throw new Error('年需求量、订购成本和持有成本必须大于零');
    }

    // EOQ公式: √(2 * 年需求量 * 每次订购成本 / 每单位年持有成本)
    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit);
    
    // 计算相关指标
    const numberofOrdersPerYear = annualDemand / eoq;
    const timeBetweenOrders = 365 / numberofOrdersPerYear; // 按天计算
    const annualOrderingCost = numberofOrdersPerYear * orderingCost;
    const annualHoldingCost = (eoq / 2) * holdingCostPerUnit;
    const totalAnnualCost = annualOrderingCost + annualHoldingCost;

    return {
      eoq: Number(eoq.toFixed(decimals)),
      roundedEOQ: Math.ceil(eoq),
      annualDemand: Number(annualDemand.toFixed(decimals)),
      orderingCost: Number(orderingCost.toFixed(decimals)),
      holdingCostPerUnit: Number(holdingCostPerUnit.toFixed(decimals)),
      numberofOrdersPerYear: Number(numberofOrdersPerYear.toFixed(decimals)),
      timeBetweenOrders: Number(timeBetweenOrders.toFixed(decimals)),
      annualOrderingCost: Number(annualOrderingCost.toFixed(decimals)),
      annualHoldingCost: Number(annualHoldingCost.toFixed(decimals)),
      totalAnnualCost: Number(totalAnnualCost.toFixed(decimals))
    };
  }

  /**
   * 计算安全库存
   * @param {number} leadTime - 前置时间(天)
   * @param {number} dailyDemand - 日均需求量
   * @param {number} demandVariability - 需求标准差
   * @param {number} serviceLevel - 服务水平(Z值)
   * @param {Object} options - 计算选项
   * @returns {Object} 安全库存计算结果
   */
  calculateSafetyStock(leadTime, dailyDemand, demandVariability, serviceLevel, options = {}) {
    const {
      decimals = 2,
      leadTimeVariability = 0
    } = options;

    if (leadTime <= 0 || dailyDemand <= 0 || serviceLevel <= 0) {
      throw new Error('前置时间、日均需求量和服务水平必须大于零');
    }

    // 安全库存公式
    // 考虑需求变化和前置时间变化
    const safetyStock = serviceLevel * 
      Math.sqrt((leadTime * Math.pow(demandVariability, 2)) + 
                (Math.pow(dailyDemand, 2) * Math.pow(leadTimeVariability, 2)));
    
    // 计算再订货点
    const reorderPoint = (dailyDemand * leadTime) + safetyStock;
    
    // 计算缺货风险
    const stockoutRisk = 1 - this._calculateNormalDistribution(serviceLevel);

    return {
      safetyStock: Number(safetyStock.toFixed(decimals)),
      roundedSafetyStock: Math.ceil(safetyStock),
      reorderPoint: Number(reorderPoint.toFixed(decimals)),
      roundedReorderPoint: Math.ceil(reorderPoint),
      leadTime: Number(leadTime.toFixed(decimals)),
      dailyDemand: Number(dailyDemand.toFixed(decimals)),
      demandVariability: Number(demandVariability.toFixed(decimals)),
      serviceLevel: Number(serviceLevel.toFixed(decimals)),
      leadTimeVariability: Number(leadTimeVariability.toFixed(decimals)),
      stockoutRisk: Number((stockoutRisk * 100).toFixed(decimals))
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
    const weeksInInventory = 52 / turnoverRatio;
    const monthsInInventory = 12 / turnoverRatio;

    return {
      costOfGoodsSold: Number(costOfGoodsSold.toFixed(decimals)),
      averageInventory: Number(averageInventory.toFixed(decimals)),
      turnoverRatio: Number(turnoverRatio.toFixed(decimals)),
      daysInInventory: Number(daysInInventory.toFixed(decimals)),
      weeksInInventory: Number(weeksInInventory.toFixed(decimals)),
      monthsInInventory: Number(monthsInInventory.toFixed(decimals))
    };
  }

  /**
   * 计算库存价值
   * @param {Array} inventoryItems - 库存项目数组
   * @param {string} valuationMethod - 估值方法 ('fifo', 'lifo', 'weighted-average')
   * @param {Object} options - 计算选项
   * @returns {Object} 库存价值计算结果
   */
  calculateInventoryValue(inventoryItems, valuationMethod = 'weighted-average', options = {}) {
    const {
      decimals = 2
    } = options;

    if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
      throw new Error('库存项目不能为空');
    }

    let totalValue = 0;
    let totalQuantity = 0;
    let details = [];

    switch (valuationMethod) {
      case 'fifo':
        // 先进先出法 - 先购入的库存先售出
        details = inventoryItems.map(item => ({
          ...item,
          value: Number((item.quantity * item.cost).toFixed(decimals))
        }));
        totalValue = details.reduce((sum, item) => sum + item.value, 0);
        totalQuantity = details.reduce((sum, item) => sum + item.quantity, 0);
        break;
      
      case 'lifo':
        // 后进先出法 - 后购入的库存先售出
        // 实际计算方式与FIFO相同，但在销售时的成本分配不同
        details = inventoryItems.map(item => ({
          ...item,
          value: Number((item.quantity * item.cost).toFixed(decimals))
        }));
        totalValue = details.reduce((sum, item) => sum + item.value, 0);
        totalQuantity = details.reduce((sum, item) => sum + item.quantity, 0);
        break;
      
      case 'weighted-average':
        // 加权平均法
        totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
        totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
        const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
        
        details = inventoryItems.map(item => ({
          ...item,
          weightedCost: Number(averageCost.toFixed(decimals)),
          value: Number((item.quantity * averageCost).toFixed(decimals))
        }));
        
        totalValue = details.reduce((sum, item) => sum + item.value, 0);
        break;
      
      default:
        throw new Error(`不支持的库存估值方法: ${valuationMethod}`);
    }

    return {
      valuationMethod,
      totalQuantity,
      totalValue: Number(totalValue.toFixed(decimals)),
      details
    };
  }

  /**
   * 计算库存年龄分析
   * @param {Array} inventoryItems - 库存项目数组
   * @param {Object} options - 分析选项
   * @returns {Object} 库存年龄分析结果
   */
  calculateInventoryAgeAnalysis(inventoryItems, options = {}) {
    const {
      decimals = 2,
      agingBuckets = [30, 60, 90, 120]
    } = options;

    if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
      throw new Error('库存项目不能为空');
    }

    const now = new Date();
    const agingAnalysis = {};
    let totalValue = 0;
    
    // 初始化老化区间
    agingBuckets.forEach((days, index) => {
      agingAnalysis[`bucket_${days}`] = {
        days: days,
        items: [],
        quantity: 0,
        value: 0
      };
    });
    
    agingAnalysis['bucket_over_120'] = {
      days: '>120',
      items: [],
      quantity: 0,
      value: 0
    };

    // 分析每个库存项目的年龄
    inventoryItems.forEach(item => {
      const receivedDate = new Date(item.receivedDate);
      const ageInDays = Math.floor((now - receivedDate) / (1000 * 60 * 60 * 24));
      
      let bucket;
      let bucketFound = false;
      
      // 找到合适的老化区间
      for (let i = agingBuckets.length - 1; i >= 0; i--) {
        if (ageInDays > agingBuckets[i]) {
          bucket = `bucket_${agingBuckets[i]}`;
          bucketFound = true;
          break;
        }
      }
      
      if (!bucketFound) {
        bucket = 'bucket_30';
      }
      
      // 处理超过最大天数的情况
      if (ageInDays > agingBuckets[agingBuckets.length - 1]) {
        bucket = 'bucket_over_120';
      }
      
      // 累加数量和价值
      const itemValue = item.quantity * item.cost;
      agingAnalysis[bucket].items.push({
        ...item,
        ageInDays,
        value: Number(itemValue.toFixed(decimals))
      });
      
      agingAnalysis[bucket].quantity += item.quantity;
      agingAnalysis[bucket].value += itemValue;
      totalValue += itemValue;
    });

    // 计算百分比
    Object.keys(agingAnalysis).forEach(key => {
      agingAnalysis[key].percentage = totalValue > 0 
        ? Number(((agingAnalysis[key].value / totalValue) * 100).toFixed(decimals))
        : 0;
      agingAnalysis[key].value = Number(agingAnalysis[key].value.toFixed(decimals));
    });

    return {
      totalValue: Number(totalValue.toFixed(decimals)),
      totalItems: inventoryItems.length,
      agingBuckets: agingAnalysis
    };
  }

  /**
   * 计算ABC库存分类
   * @param {Array} inventoryItems - 库存项目数组
   * @param {Object} options - 分类选项
   * @returns {Object} ABC分类结果
   */
  calculateABCAnalysis(inventoryItems, options = {}) {
    const {
      decimals = 2,
      aPercentage = 70,  // A类物品占总价值的百分比
      bPercentage = 20   // B类物品占总价值的百分比
    } = options;

    if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
      throw new Error('库存项目不能为空');
    }

    // 计算每个项目的价值
    const itemsWithValue = inventoryItems.map(item => ({
      ...item,
      value: item.quantity * item.cost
    }));

    // 按价值降序排序
    itemsWithValue.sort((a, b) => b.value - a.value);

    // 计算总价值
    const totalValue = itemsWithValue.reduce((sum, item) => sum + item.value, 0);
    
    const results = {
      totalValue: Number(totalValue.toFixed(decimals)),
      categoryA: {
        items: [],
        totalQuantity: 0,
        totalValue: 0,
        valuePercentage: 0,
        itemPercentage: 0
      },
      categoryB: {
        items: [],
        totalQuantity: 0,
        totalValue: 0,
        valuePercentage: 0,
        itemPercentage: 0
      },
      categoryC: {
        items: [],
        totalQuantity: 0,
        totalValue: 0,
        valuePercentage: 0,
        itemPercentage: 0
      }
    };

    let accumulatedValue = 0;
    const aThreshold = totalValue * (aPercentage / 100);
    const bThreshold = totalValue * ((aPercentage + bPercentage) / 100);

    // 分配到A、B、C类
    for (const item of itemsWithValue) {
      const itemWithFormattedValue = {
        ...item,
        value: Number(item.value.toFixed(decimals))
      };

      if (accumulatedValue < aThreshold) {
        results.categoryA.items.push(itemWithFormattedValue);
        results.categoryA.totalQuantity += item.quantity;
        results.categoryA.totalValue += item.value;
      } else if (accumulatedValue < bThreshold) {
        results.categoryB.items.push(itemWithFormattedValue);
        results.categoryB.totalQuantity += item.quantity;
        results.categoryB.totalValue += item.value;
      } else {
        results.categoryC.items.push(itemWithFormattedValue);
        results.categoryC.totalQuantity += item.quantity;
        results.categoryC.totalValue += item.value;
      }

      accumulatedValue += item.value;
    }

    // 计算百分比
    results.categoryA.valuePercentage = Number(((results.categoryA.totalValue / totalValue) * 100).toFixed(decimals));
    results.categoryA.itemPercentage = Number(((results.categoryA.items.length / inventoryItems.length) * 100).toFixed(decimals));
    results.categoryA.totalValue = Number(results.categoryA.totalValue.toFixed(decimals));

    results.categoryB.valuePercentage = Number(((results.categoryB.totalValue / totalValue) * 100).toFixed(decimals));
    results.categoryB.itemPercentage = Number(((results.categoryB.items.length / inventoryItems.length) * 100).toFixed(decimals));
    results.categoryB.totalValue = Number(results.categoryB.totalValue.toFixed(decimals));

    results.categoryC.valuePercentage = Number(((results.categoryC.totalValue / totalValue) * 100).toFixed(decimals));
    results.categoryC.itemPercentage = Number(((results.categoryC.items.length / inventoryItems.length) * 100).toFixed(decimals));
    results.categoryC.totalValue = Number(results.categoryC.totalValue.toFixed(decimals));

    return results;
  }

  /**
   * 计算库存准确率
   * @param {Object} physicalCounts - 实际盘点数据
   * @param {Object} systemCounts - 系统账面数据
   * @param {Object} options - 计算选项
   * @returns {Object} 库存准确率计算结果
   */
  calculateInventoryAccuracy(physicalCounts, systemCounts, options = {}) {
    const {
      decimals = 2,
      tolerancePercentage = 2
    } = options;

    const results = {
      itemsChecked: 0,
      itemsAccurate: 0,
      accuracyPercentage: 0,
      varianceDetails: [],
      totalPhysicalValue: 0,
      totalSystemValue: 0,
      totalVarianceValue: 0,
      totalVariancePercentage: 0
    };

    // 计算每个项目的准确性
    Object.keys(physicalCounts).forEach(itemId => {
      const physicalCount = physicalCounts[itemId];
      const systemCount = systemCounts[itemId] || 0;
      
      // 计算差异
      const quantityVariance = physicalCount.quantity - systemCount.quantity;
      const valueVariance = (physicalCount.quantity * physicalCount.cost) - 
                           (systemCount.quantity * (systemCount.cost || physicalCount.cost));
      
      // 判断是否准确（在容差范围内）
      const accuracyCheck = systemCount.quantity === 0 
        ? physicalCount.quantity === 0
        : Math.abs((quantityVariance / systemCount.quantity) * 100) <= tolerancePercentage;
      
      // 累加到结果
      results.itemsChecked++;
      if (accuracyCheck) {
        results.itemsAccurate++;
      }
      
      results.totalPhysicalValue += physicalCount.quantity * physicalCount.cost;
      results.totalSystemValue += systemCount.quantity * (systemCount.cost || physicalCount.cost);
      results.totalVarianceValue += valueVariance;
      
      results.varianceDetails.push({
        itemId,
        itemName: physicalCount.name || systemCount.name || itemId,
        physicalQuantity: physicalCount.quantity,
        systemQuantity: systemCount.quantity,
        quantityVariance,
        variancePercentage: systemCount.quantity === 0 
          ? (physicalCount.quantity > 0 ? 100 : 0)
          : Number(((quantityVariance / systemCount.quantity) * 100).toFixed(decimals)),
        physicalValue: Number((physicalCount.quantity * physicalCount.cost).toFixed(decimals)),
        systemValue: Number((systemCount.quantity * (systemCount.cost || physicalCount.cost)).toFixed(decimals)),
        valueVariance: Number(valueVariance.toFixed(decimals)),
        isAccurate: accuracyCheck
      });
    });

    // 计算准确率
    results.accuracyPercentage = results.itemsChecked > 0 
      ? Number(((results.itemsAccurate / results.itemsChecked) * 100).toFixed(decimals))
      : 0;
    
    // 计算总差异百分比
    results.totalVariancePercentage = results.totalSystemValue === 0 
      ? (results.totalPhysicalValue > 0 ? 100 : 0)
      : Number(((results.totalVarianceValue / results.totalSystemValue) * 100).toFixed(decimals));
    
    // 格式化数值
    results.totalPhysicalValue = Number(results.totalPhysicalValue.toFixed(decimals));
    results.totalSystemValue = Number(results.totalSystemValue.toFixed(decimals));
    results.totalVarianceValue = Number(results.totalVarianceValue.toFixed(decimals));

    return results;
  }

  /**
   * 计算库存预测（基于历史数据）
   * @param {Array} historicalData - 历史需求数据
   * @param {number} monthsToForecast - 预测月数
   * @param {Object} options - 预测选项
   * @returns {Object} 库存预测结果
   */
  calculateInventoryForecast(historicalData, monthsToForecast = 3, options = {}) {
    const {
      decimals = 2,
      forecastMethod = 'moving-average', // 'moving-average', 'linear-trend'
      movingAveragePeriod = 3
    } = options;

    if (!Array.isArray(historicalData) || historicalData.length === 0) {
      throw new Error('历史数据不能为空');
    }

    if (monthsToForecast <= 0) {
      throw new Error('预测月数必须大于零');
    }

    const forecasts = [];
    let forecastMethodDescription;

    switch (forecastMethod) {
      case 'moving-average':
        // 移动平均法
        if (historicalData.length < movingAveragePeriod) {
          throw new Error(`移动平均法需要至少 ${movingAveragePeriod} 个历史数据点`);
        }
        
        forecastMethodDescription = `${movingAveragePeriod}期移动平均`;
        
        // 计算移动平均值作为预测
        const recentValues = historicalData.slice(-movingAveragePeriod);
        const averageValue = recentValues.reduce((sum, value) => sum + value, 0) / movingAveragePeriod;
        
        // 生成未来月份预测
        for (let i = 1; i <= monthsToForecast; i++) {
          forecasts.push({
            month: i,
            forecast: Number(averageValue.toFixed(decimals))
          });
        }
        break;
        
      case 'linear-trend':
        // 线性趋势预测
        forecastMethodDescription = '线性趋势';
        
        // 计算线性回归
        const n = historicalData.length;
        const sumX = n * (n + 1) / 2; // 假设x从1开始递增
        const sumY = historicalData.reduce((sum, value) => sum + value, 0);
        const sumXY = historicalData.reduce((sum, value, index) => sum + (index + 1) * value, 0);
        const sumX2 = n * (n + 1) * (2 * n + 1) / 6;
        
        // 计算斜率和截距
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // 生成未来月份预测
        for (let i = 1; i <= monthsToForecast; i++) {
          const x = n + i;
          const forecast = intercept + slope * x;
          forecasts.push({
            month: i,
            forecast: Math.max(0, Number(forecast.toFixed(decimals))) // 确保预测值不为负
          });
        }
        break;
        
      default:
        throw new Error(`不支持的预测方法: ${forecastMethod}`);
    }

    return {
      historicalData: historicalData.map(value => Number(value.toFixed(decimals))),
      forecastMethod,
      forecastMethodDescription,
      monthsToForecast,
      forecasts
    };
  }

  /**
   * 计算库存持有成本
   * @param {Object} inventoryData - 库存数据
   * @param {Object} costFactors - 成本因素
   * @param {Object} options - 计算选项
   * @returns {Object} 库存持有成本计算结果
   */
  calculateInventoryHoldingCost(inventoryData, costFactors, options = {}) {
    const {
      decimals = 2
    } = options;

    const {
      averageInventoryValue,
      inventoryTurnover
    } = inventoryData;

    const {
      capitalCostRate = 0.15,    // 资金成本率
      storageCostRate = 0.08,    // 存储成本率
      handlingCostRate = 0.04,   // 处理成本率
      insuranceRate = 0.02,      // 保险费率
      obsolescenceRate = 0.03,   // 过时成本率
      shrinkageRate = 0.01       // 损耗率
    } = costFactors;

    if (averageInventoryValue <= 0) {
      throw new Error('平均库存价值必须大于零');
    }

    // 计算各项持有成本
    const capitalCost = averageInventoryValue * capitalCostRate;
    const storageCost = averageInventoryValue * storageCostRate;
    const handlingCost = averageInventoryValue * handlingCostRate;
    const insuranceCost = averageInventoryValue * insuranceRate;
    const obsolescenceCost = averageInventoryValue * obsolescenceRate;
    const shrinkageCost = averageInventoryValue * shrinkageRate;
    
    // 计算总持有成本
    const totalHoldingCost = capitalCost + storageCost + handlingCost + 
                            insuranceCost + obsolescenceCost + shrinkageCost;
    
    // 计算单位持有成本率
    const totalHoldingCostRate = capitalCostRate + storageCostRate + handlingCostRate + 
                                insuranceRate + obsolescenceRate + shrinkageRate;
    
    // 计算持有成本占销售额的比例
    let holdingCostAsPercentageOfSales = 0;
    if (inventoryTurnover && inventoryTurnover > 0) {
      const annualSales = averageInventoryValue * inventoryTurnover;
      holdingCostAsPercentageOfSales = (totalHoldingCost / annualSales) * 100;
    }

    return {
      averageInventoryValue: Number(averageInventoryValue.toFixed(decimals)),
      inventoryTurnover: Number(inventoryTurnover.toFixed(decimals)),
      capitalCost: Number(capitalCost.toFixed(decimals)),
      storageCost: Number(storageCost.toFixed(decimals)),
      handlingCost: Number(handlingCost.toFixed(decimals)),
      insuranceCost: Number(insuranceCost.toFixed(decimals)),
      obsolescenceCost: Number(obsolescenceCost.toFixed(decimals)),
      shrinkageCost: Number(shrinkageCost.toFixed(decimals)),
      totalHoldingCost: Number(totalHoldingCost.toFixed(decimals)),
      totalHoldingCostRate: Number((totalHoldingCostRate * 100).toFixed(decimals)),
      holdingCostAsPercentageOfSales: Number(holdingCostAsPercentageOfSales.toFixed(decimals))
    };
  }

  /**
   * 正态分布近似计算（简化版）
   * @private
   */
  _calculateNormalDistribution(zScore) {
    // 标准正态分布的累积分布函数近似值
    // 使用Abramowitz和Stegun的近似公式
    const t = 1 / (1 + 0.2316419 * Math.abs(zScore));
    const d = 0.3989423 * Math.exp(-zScore * zScore / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    
    return zScore > 0 ? 1 - prob : prob;
  }
}

// 导出单例实例
const inventoryCalculator = new InventoryCalculator();
export default inventoryCalculator;
export { InventoryCalculator };