/**
 * 定价引擎
 * 提供产品定价相关的计算功能
 */
class PricingEngine {
  /**
   * 基于成本加成定价
   * @param {number} cost - 成本
   * @param {number} markupPercentage - 加成百分比
   * @param {Object} options - 定价选项
   * @returns {Object} 定价结果
   */
  calculateCostPlusPrice(cost, markupPercentage, options = {}) {
    const {
      taxRate = 0,
      decimals = 2,
      roundToNearest = 0.01
    } = options;

    if (cost <= 0) {
      throw new Error('成本必须大于零');
    }

    // 计算基础价格
    const markupAmount = cost * (markupPercentage / 100);
    const basePrice = cost + markupAmount;
    
    // 计算税额
    const taxAmount = basePrice * taxRate;
    
    // 计算最终价格
    let finalPrice = basePrice + taxAmount;
    
    // 价格舍入
    if (roundToNearest > 0) {
      finalPrice = Math.round(finalPrice / roundToNearest) * roundToNearest;
    }

    return {
      cost: Number(cost.toFixed(decimals)),
      markupPercentage: Number(markupPercentage.toFixed(decimals)),
      markupAmount: Number(markupAmount.toFixed(decimals)),
      basePrice: Number(basePrice.toFixed(decimals)),
      taxRate: Number((taxRate * 100).toFixed(decimals)),
      taxAmount: Number(taxAmount.toFixed(decimals)),
      finalPrice: Number(finalPrice.toFixed(decimals))
    };
  }

  /**
   * 基于目标利润率定价
   * @param {number} cost - 成本
   * @param {number} targetMarginPercentage - 目标利润率
   * @param {Object} options - 定价选项
   * @returns {Object} 定价结果
   */
  calculateTargetMarginPrice(cost, targetMarginPercentage, options = {}) {
    const {
      taxRate = 0,
      decimals = 2,
      roundToNearest = 0.01
    } = options;

    if (cost <= 0) {
      throw new Error('成本必须大于零');
    }

    if (targetMarginPercentage >= 100) {
      throw new Error('目标利润率必须小于100%');
    }

    // 计算基础价格（考虑目标利润率）
    const basePrice = cost / (1 - targetMarginPercentage / 100);
    const profitAmount = basePrice - cost;
    
    // 计算税额
    const taxAmount = basePrice * taxRate;
    
    // 计算最终价格
    let finalPrice = basePrice + taxAmount;
    
    // 价格舍入
    if (roundToNearest > 0) {
      finalPrice = Math.round(finalPrice / roundToNearest) * roundToNearest;
    }

    return {
      cost: Number(cost.toFixed(decimals)),
      targetMarginPercentage: Number(targetMarginPercentage.toFixed(decimals)),
      basePrice: Number(basePrice.toFixed(decimals)),
      profitAmount: Number(profitAmount.toFixed(decimals)),
      taxRate: Number((taxRate * 100).toFixed(decimals)),
      taxAmount: Number(taxAmount.toFixed(decimals)),
      finalPrice: Number(finalPrice.toFixed(decimals))
    };
  }

  /**
   * 计算折扣价格
   * @param {number} originalPrice - 原价
   * @param {number} discountPercentage - 折扣百分比
   * @param {Object} options - 折扣选项
   * @returns {Object} 折扣结果
   */
  calculateDiscountPrice(originalPrice, discountPercentage, options = {}) {
    const {
      taxRate = 0,
      decimals = 2,
      minPrice = 0
    } = options;

    if (originalPrice <= 0) {
      throw new Error('原价必须大于零');
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error('折扣百分比必须在0到100之间');
    }

    // 计算折扣金额和折后价格
    const discountAmount = originalPrice * (discountPercentage / 100);
    let discountedPrice = originalPrice - discountAmount;
    
    // 确保折后价格不低于最低价格
    if (discountedPrice < minPrice) {
      discountedPrice = minPrice;
    }
    
    // 计算税额
    const taxAmount = discountedPrice * taxRate;
    
    // 计算最终价格
    const finalPrice = discountedPrice + taxAmount;

    return {
      originalPrice: Number(originalPrice.toFixed(decimals)),
      discountPercentage: Number(discountPercentage.toFixed(decimals)),
      discountAmount: Number(discountAmount.toFixed(decimals)),
      discountedPrice: Number(discountedPrice.toFixed(decimals)),
      taxRate: Number((taxRate * 100).toFixed(decimals)),
      taxAmount: Number(taxAmount.toFixed(decimals)),
      finalPrice: Number(finalPrice.toFixed(decimals))
    };
  }

  /**
   * 计算批量定价
   * @param {Array} tiers - 阶梯价格配置
   * @param {number} quantity - 购买数量
   * @param {Object} options - 定价选项
   * @returns {Object} 批量定价结果
   */
  calculateVolumePricing(tiers, quantity, options = {}) {
    const {
      taxRate = 0,
      decimals = 2
    } = options;

    if (!Array.isArray(tiers) || tiers.length === 0) {
      throw new Error('阶梯价格配置不能为空');
    }

    if (quantity <= 0) {
      throw new Error('数量必须大于零');
    }

    // 按最低购买数量排序
    const sortedTiers = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
    
    // 找到适用的价格
    let applicableTier = sortedTiers[0];
    for (const tier of sortedTiers) {
      if (quantity >= tier.minQuantity) {
        applicableTier = tier;
      } else {
        break;
      }
    }

    // 计算总价
    const subtotal = quantity * applicableTier.pricePerUnit;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    return {
      quantity,
      applicableTier,
      pricePerUnit: Number(applicableTier.pricePerUnit.toFixed(decimals)),
      subtotal: Number(subtotal.toFixed(decimals)),
      taxRate: Number((taxRate * 100).toFixed(decimals)),
      taxAmount: Number(taxAmount.toFixed(decimals)),
      total: Number(total.toFixed(decimals))
    };
  }

  /**
   * 计算动态定价（基于市场需求和竞争）
   * @param {number} baseCost - 基础成本
   * @param {number} demandFactor - 需求因子 (0-2, 1为正常需求)
   * @param {number} competitionFactor - 竞争因子 (0-2, 1为正常竞争)
   * @param {Object} options - 定价选项
   * @returns {Object} 动态定价结果
   */
  calculateDynamicPrice(baseCost, demandFactor, competitionFactor, options = {}) {
    const {
      minMarginPercentage = 10,
      maxMarginPercentage = 100,
      taxRate = 0,
      decimals = 2
    } = options;

    if (baseCost <= 0) {
      throw new Error('基础成本必须大于零');
    }

    if (demandFactor < 0 || demandFactor > 2) {
      throw new Error('需求因子必须在0到2之间');
    }

    if (competitionFactor < 0 || competitionFactor > 2) {
      throw new Error('竞争因子必须在0到2之间');
    }

    // 计算动态加成比例
    // 高需求 + 低竞争 = 高加成
    // 低需求 + 高竞争 = 低加成
    const baseMarginPercentage = 30; // 基础加成比例
    const dynamicAdjustment = (demandFactor - 1) * 20 - (competitionFactor - 1) * 15;
    let marginPercentage = baseMarginPercentage + dynamicAdjustment;
    
    // 确保在设定的范围内
    marginPercentage = Math.max(minMarginPercentage, 
                              Math.min(maxMarginPercentage, marginPercentage));
    
    // 计算价格
    const marginAmount = baseCost * (marginPercentage / 100);
    const basePrice = baseCost + marginAmount;
    const taxAmount = basePrice * taxRate;
    const finalPrice = basePrice + taxAmount;

    return {
      baseCost: Number(baseCost.toFixed(decimals)),
      demandFactor: Number(demandFactor.toFixed(decimals)),
      competitionFactor: Number(competitionFactor.toFixed(decimals)),
      marginPercentage: Number(marginPercentage.toFixed(decimals)),
      marginAmount: Number(marginAmount.toFixed(decimals)),
      basePrice: Number(basePrice.toFixed(decimals)),
      taxRate: Number((taxRate * 100).toFixed(decimals)),
      taxAmount: Number(taxAmount.toFixed(decimals)),
      finalPrice: Number(finalPrice.toFixed(decimals))
    };
  }

  /**
   * 计算心理定价（99定价法等）
   * @param {number} calculatedPrice - 计算出的价格
   * @param {string} strategy - 心理定价策略 ('nine-ending', 'rounded', 'prestige')
   * @param {Object} options - 定价选项
   * @returns {Object} 心理定价结果
   */
  calculatePsychologicalPrice(calculatedPrice, strategy = 'nine-ending', options = {}) {
    const {
      decimals = 2,
      prestigeFactor = 1.2
    } = options;

    if (calculatedPrice <= 0) {
      throw new Error('计算价格必须大于零');
    }

    let psychologicalPrice;

    switch (strategy) {
      case 'nine-ending':
        // 99定价法，如 $9.99 而不是 $10
        const magnitude = Math.pow(10, Math.floor(Math.log10(calculatedPrice)));
        psychologicalPrice = Math.floor(calculatedPrice / magnitude) * magnitude - 0.01;
        break;
      
      case 'rounded':
        // 四舍五入，简化价格
        psychologicalPrice = Math.round(calculatedPrice);
        break;
      
      case 'prestige':
        // 声望定价，提高价格以显示高品质
        psychologicalPrice = calculatedPrice * prestigeFactor;
        // 向上舍入到整数
        psychologicalPrice = Math.ceil(psychologicalPrice);
        break;
      
      default:
        throw new Error(`不支持的心理定价策略: ${strategy}`);
    }

    return {
      calculatedPrice: Number(calculatedPrice.toFixed(decimals)),
      strategy,
      psychologicalPrice: Number(psychologicalPrice.toFixed(decimals)),
      difference: Number((psychologicalPrice - calculatedPrice).toFixed(decimals))
    };
  }

  /**
   * 计算捆绑销售价格
   * @param {Array} products - 产品列表
   * @param {number} bundleDiscountPercentage - 捆绑折扣百分比
   * @param {Object} options - 定价选项
   * @returns {Object} 捆绑销售定价结果
   */
  calculateBundlePrice(products, bundleDiscountPercentage, options = {}) {
    const {
      taxRate = 0,
      decimals = 2
    } = options;

    if (!Array.isArray(products) || products.length < 2) {
      throw new Error('捆绑销售至少需要两个产品');
    }

    if (bundleDiscountPercentage < 0 || bundleDiscountPercentage > 100) {
      throw new Error('捆绑折扣百分比必须在0到100之间');
    }

    // 计算各产品单独购买的总价
    const individualTotal = products.reduce((sum, product) => {
      return sum + product.price * (product.quantity || 1);
    }, 0);

    // 计算捆绑折扣
    const bundleDiscount = individualTotal * (bundleDiscountPercentage / 100);
    const bundlePrice = individualTotal - bundleDiscount;
    
    // 计算税额
    const taxAmount = bundlePrice * taxRate;
    const finalPrice = bundlePrice + taxAmount;

    return {
      individualTotal: Number(individualTotal.toFixed(decimals)),
      bundleDiscountPercentage: Number(bundleDiscountPercentage.toFixed(decimals)),
      bundleDiscount: Number(bundleDiscount.toFixed(decimals)),
      bundlePrice: Number(bundlePrice.toFixed(decimals)),
      taxRate: Number((taxRate * 100).toFixed(decimals)),
      taxAmount: Number(taxAmount.toFixed(decimals)),
      finalPrice: Number(finalPrice.toFixed(decimals)),
      products: products.map(product => ({
        ...product,
        price: Number(product.price.toFixed(decimals))
      }))
    };
  }

  /**
   * 计算最优定价（基于价格弹性）
   * @param {Object} priceElasticity - 价格弹性数据
   * @param {number} baseCost - 基础成本
   * @param {Object} options - 定价选项
   * @returns {Object} 最优定价结果
   */
  calculateOptimalPrice(priceElasticity, baseCost, options = {}) {
    const {
      currentPrice,
      currentDemand,
      elasticityCoefficient
    } = priceElasticity;

    const {
      iterations = 100,
      tolerance = 0.01,
      decimals = 2
    } = options;

    if (!currentPrice || !currentDemand || !elasticityCoefficient) {
      throw new Error('价格弹性数据不完整');
    }

    if (baseCost <= 0) {
      throw new Error('基础成本必须大于零');
    }

    // 使用边际收益等于边际成本的原则计算最优价格
    // 最优价格 = 成本 / (1 + 1/弹性系数)
    // 注意：弹性系数应为负数（价格上升，需求下降）
    if (elasticityCoefficient >= 0) {
      throw new Error('弹性系数通常为负数，表示价格和需求的反比关系');
    }

    const optimalPrice = baseCost / (1 + 1 / elasticityCoefficient);
    
    // 计算预计需求变化
    // 弹性系数 = (% 需求量变化) / (% 价格变化)
    const priceChangePercentage = (optimalPrice - currentPrice) / currentPrice;
    const demandChangePercentage = elasticityCoefficient * priceChangePercentage;
    const projectedDemand = currentDemand * (1 + demandChangePercentage);
    
    // 计算当前和最优情况下的收益
    const currentRevenue = currentPrice * currentDemand;
    const currentProfit = currentRevenue - (baseCost * currentDemand);
    
    const optimalRevenue = optimalPrice * projectedDemand;
    const optimalProfit = optimalRevenue - (baseCost * projectedDemand);

    return {
      baseCost: Number(baseCost.toFixed(decimals)),
      currentPrice: Number(currentPrice.toFixed(decimals)),
      currentDemand: Number(currentDemand.toFixed(decimals)),
      currentRevenue: Number(currentRevenue.toFixed(decimals)),
      currentProfit: Number(currentProfit.toFixed(decimals)),
      optimalPrice: Number(optimalPrice.toFixed(decimals)),
      projectedDemand: Number(projectedDemand.toFixed(decimals)),
      optimalRevenue: Number(optimalRevenue.toFixed(decimals)),
      optimalProfit: Number(optimalProfit.toFixed(decimals)),
      profitIncrease: Number((optimalProfit - currentProfit).toFixed(decimals)),
      profitIncreasePercentage: Number(((optimalProfit - currentProfit) / currentProfit * 100).toFixed(decimals))
    };
  }

  /**
   * 计算生命周期定价
   * @param {Object} productData - 产品数据
   * @param {string} phase - 当前生命周期阶段 ('introduction', 'growth', 'maturity', 'decline')
   * @param {Object} options - 定价选项
   * @returns {Object} 生命周期定价结果
   */
  calculateLifecyclePrice(productData, phase, options = {}) {
    const {
      baseCost,
      developmentCost,
      targetMarketShare,
      competitionLevel
    } = productData;

    const {
      decimals = 2,
      marketSize = 10000
    } = options;

    if (!baseCost || !developmentCost) {
      throw new Error('产品数据不完整，缺少必要的成本信息');
    }

    let price,
        strategy,
        markupPercentage;

    switch (phase) {
      case 'introduction':
        // 引入期定价策略
        if (competitionLevel === 'low') {
          // 撇脂定价
          strategy = 'skimming';
          markupPercentage = 80;
        } else {
          // 渗透定价
          strategy = 'penetration';
          markupPercentage = 20;
        }
        break;
      
      case 'growth':
        // 成长期定价
        strategy = 'growth';
        markupPercentage = 50;
        break;
      
      case 'maturity':
        // 成熟期定价
        strategy = 'maturity';
        markupPercentage = 30;
        break;
      
      case 'decline':
        // 衰退期定价
        strategy = 'decline';
        markupPercentage = 10;
        break;
      
      default:
        throw new Error(`不支持的生命周期阶段: ${phase}`);
    }

    // 计算价格
    price = baseCost * (1 + markupPercentage / 100);

    // 考虑目标市场份额的调整
    if (targetMarketShare > 0.5) {
      // 高市场份额目标，适当降低价格
      price *= 0.9;
    }

    return {
      phase,
      strategy,
      baseCost: Number(baseCost.toFixed(decimals)),
      developmentCost: Number(developmentCost.toFixed(decimals)),
      markupPercentage: Number(markupPercentage.toFixed(decimals)),
      suggestedPrice: Number(price.toFixed(decimals)),
      competitionLevel,
      targetMarketShare: Number((targetMarketShare * 100).toFixed(decimals))
    };
  }

  /**
   * 计算促销定价
   * @param {number} originalPrice - 原价
   * @param {string} promotionType - 促销类型
   * @param {Object} promotionDetails - 促销详情
   * @param {Object} options - 定价选项
   * @returns {Object} 促销定价结果
   */
  calculatePromotionPrice(originalPrice, promotionType, promotionDetails = {}, options = {}) {
    const {
      taxRate = 0,
      decimals = 2,
      minPrice = 0
    } = options;

    if (originalPrice <= 0) {
      throw new Error('原价必须大于零');
    }

    let discountedPrice, discountAmount, discountPercentage;

    switch (promotionType) {
      case 'percentage-discount':
        // 百分比折扣
        discountPercentage = promotionDetails.percentage || 0;
        discountAmount = originalPrice * (discountPercentage / 100);
        discountedPrice = originalPrice - discountAmount;
        break;
      
      case 'fixed-amount-discount':
        // 固定金额折扣
        discountAmount = promotionDetails.amount || 0;
        discountedPrice = originalPrice - discountAmount;
        discountPercentage = (discountAmount / originalPrice) * 100;
        break;
      
      case 'buy-x-get-y-free':
        // 买X送Y
        const buyQuantity = promotionDetails.buyQuantity || 1;
        const freeQuantity = promotionDetails.freeQuantity || 1;
        const totalQuantity = buyQuantity + freeQuantity;
        discountedPrice = (originalPrice * buyQuantity) / totalQuantity;
        discountAmount = originalPrice - discountedPrice;
        discountPercentage = (discountAmount / originalPrice) * 100;
        break;
      
      case 'threshold-discount':
        // 达到阈值折扣
        const threshold = promotionDetails.threshold || 0;
        const thresholdDiscount = promotionDetails.discount || 0;
        discountedPrice = originalPrice >= threshold 
          ? originalPrice * (1 - thresholdDiscount / 100)
          : originalPrice;
        discountAmount = originalPrice - discountedPrice;
        discountPercentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;
        break;
      
      default:
        throw new Error(`不支持的促销类型: ${promotionType}`);
    }

    // 确保不低于最低价格
    if (discountedPrice < minPrice) {
      discountedPrice = minPrice;
      discountAmount = originalPrice - discountedPrice;
      discountPercentage = (discountAmount / originalPrice) * 100;
    }

    // 计算税额
    const taxAmount = discountedPrice * taxRate;
    const finalPrice = discountedPrice + taxAmount;

    return {
      originalPrice: Number(originalPrice.toFixed(decimals)),
      promotionType,
      promotionDetails,
      discountPercentage: Number(discountPercentage.toFixed(decimals)),
      discountAmount: Number(discountAmount.toFixed(decimals)),
      discountedPrice: Number(discountedPrice.toFixed(decimals)),
      taxRate: Number((taxRate * 100).toFixed(decimals)),
      taxAmount: Number(taxAmount.toFixed(decimals)),
      finalPrice: Number(finalPrice.toFixed(decimals))
    };
  }

  /**
   * 计算价格敏感性分析
   * @param {Object} priceSensitivityData - 价格敏感性数据
   * @param {Object} options - 分析选项
   * @returns {Object} 价格敏感性分析结果
   */
  calculatePriceSensitivity(priceSensitivityData, options = {}) {
    const {
      basePrice,
      baseDemand,
      elasticity,
      costPerUnit
    } = priceSensitivityData;

    const {
      priceChangeStep = 0.1, // 10%
      maxPriceChanges = 5,
      decimals = 2
    } = options;

    if (!basePrice || !baseDemand || !elasticity || !costPerUnit) {
      throw new Error('价格敏感性数据不完整');
    }

    const scenarios = [];

    // 生成不同价格变化的情景
    for (let i = -maxPriceChanges; i <= maxPriceChanges; i++) {
      if (i === 0) continue; // 跳过基准价格

      const priceChangePercentage = i * priceChangeStep;
      const newPrice = basePrice * (1 + priceChangePercentage);
      
      // 计算需求变化（价格上升，需求下降）
      const demandChangePercentage = -elasticity * priceChangePercentage;
      const newDemand = Math.max(0, baseDemand * (1 + demandChangePercentage));
      
      // 计算收入和利润
      const revenue = newPrice * newDemand;
      const cost = costPerUnit * newDemand;
      const profit = revenue - cost;
      
      // 计算变化百分比
      const revenueChangePercentage = ((revenue - (basePrice * baseDemand)) / (basePrice * baseDemand)) * 100;
      const profitChangePercentage = ((profit - ((basePrice - costPerUnit) * baseDemand)) / ((basePrice - costPerUnit) * baseDemand)) * 100;

      scenarios.push({
        priceChangePercentage: Number((priceChangePercentage * 100).toFixed(decimals)),
        newPrice: Number(newPrice.toFixed(decimals)),
        demandChangePercentage: Number(demandChangePercentage.toFixed(decimals)),
        newDemand: Number(newDemand.toFixed(decimals)),
        revenue: Number(revenue.toFixed(decimals)),
        revenueChangePercentage: Number(revenueChangePercentage.toFixed(decimals)),
        cost: Number(cost.toFixed(decimals)),
        profit: Number(profit.toFixed(decimals)),
        profitChangePercentage: Number(profitChangePercentage.toFixed(decimals))
      });
    }

    // 添加基准情景
    const baseRevenue = basePrice * baseDemand;
    const baseCost = costPerUnit * baseDemand;
    const baseProfit = baseRevenue - baseCost;

    scenarios.push({
      priceChangePercentage: 0,
      newPrice: Number(basePrice.toFixed(decimals)),
      demandChangePercentage: 0,
      newDemand: Number(baseDemand.toFixed(decimals)),
      revenue: Number(baseRevenue.toFixed(decimals)),
      revenueChangePercentage: 0,
      cost: Number(baseCost.toFixed(decimals)),
      profit: Number(baseProfit.toFixed(decimals)),
      profitChangePercentage: 0
    });

    // 按价格变化百分比排序
    scenarios.sort((a, b) => a.priceChangePercentage - b.priceChangePercentage);

    // 找出最优利润情景
    const optimalProfitScenario = scenarios.reduce((best, current) => 
      current.profit > best.profit ? current : best
    );

    // 找出最优收入情景
    const optimalRevenueScenario = scenarios.reduce((best, current) => 
      current.revenue > best.revenue ? current : best
    );

    return {
      basePrice: Number(basePrice.toFixed(decimals)),
      baseDemand: Number(baseDemand.toFixed(decimals)),
      elasticity: Number(elasticity.toFixed(decimals)),
      costPerUnit: Number(costPerUnit.toFixed(decimals)),
      scenarios,
      optimalProfitScenario,
      optimalRevenueScenario
    };
  }
}

// 导出单例实例
const pricingEngine = new PricingEngine();
export default pricingEngine;
export { PricingEngine };