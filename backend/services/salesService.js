const { Op } = require('sequelize');
const { Order, Quotation, Customer, Product, SalesTarget, ActivityLog, sequelize } = require('../models');

class SalesService {
  /**
   * 获取销售关键指标
   */
  async getSalesMetrics(params) {
    const { period, startDate, endDate, userId, customerId, regionId, categoryId } = params;

    // 构建时间条件
    const dateCondition = this.buildDateCondition(period, startDate, endDate);

    // 构建查询条件
    const whereConditions = {
      ...dateCondition,
      ...(userId && { userId }),
      ...(customerId && { customerId }),
      ...(regionId && { '$customer.regionId$': regionId }),
    };

    try {
      // 获取订单数据
      const orderMetrics = await this.getOrderMetrics(whereConditions, categoryId);

      // 获取报价数据
      const quotationMetrics = await this.getQuotationMetrics(whereConditions, categoryId);

      // 获取客户数据
      const customerMetrics = await this.getCustomerMetrics(whereConditions);

      // 获取比较数据（上期）
      const comparePeriod = this.getComparePeriod(period, startDate, endDate);
      const compareDateCondition = this.buildDateCondition(comparePeriod.period);

      const compareOrderMetrics = await this.getOrderMetrics(
        {
          ...whereConditions,
          ...compareDateCondition,
        },
        categoryId,
      );

      const compareQuotationMetrics = await this.getQuotationMetrics(
        {
          ...whereConditions,
          ...compareDateCondition,
        },
        categoryId,
      );

      const compareCustomerMetrics = await this.getCustomerMetrics({
        ...whereConditions,
        ...compareDateCondition,
      });

      // 计算转化率
      const conversionRate =
        orderMetrics.totalOrders > 0
          ? ((orderMetrics.totalOrders / quotationMetrics.totalQuotations) * 100).toFixed(2)
          : 0;

      const compareConversionRate =
        compareOrderMetrics.totalOrders > 0
          ? ((compareOrderMetrics.totalOrders / compareQuotationMetrics.totalQuotations) * 100).toFixed(2)
          : 0;

      return {
        revenue: {
          value: orderMetrics.totalRevenue,
          compareValue: compareOrderMetrics.totalRevenue,
          trend: this.calculateTrend(orderMetrics.totalRevenue, compareOrderMetrics.totalRevenue),
          trendPercentage: this.calculateTrendPercentage(orderMetrics.totalRevenue, compareOrderMetrics.totalRevenue),
        },
        orders: {
          value: orderMetrics.totalOrders,
          compareValue: compareOrderMetrics.totalOrders,
          trend: this.calculateTrend(orderMetrics.totalOrders, compareOrderMetrics.totalOrders),
          trendPercentage: this.calculateTrendPercentage(orderMetrics.totalOrders, compareOrderMetrics.totalOrders),
        },
        customers: {
          value: customerMetrics.totalCustomers,
          compareValue: compareCustomerMetrics.totalCustomers,
          trend: this.calculateTrend(customerMetrics.totalCustomers, compareCustomerMetrics.totalCustomers),
          trendPercentage: this.calculateTrendPercentage(
            customerMetrics.totalCustomers,
            compareCustomerMetrics.totalCustomers,
          ),
        },
        conversion: {
          value: parseFloat(conversionRate),
          compareValue: parseFloat(compareConversionRate),
          trend: this.calculateTrend(parseFloat(conversionRate), parseFloat(compareConversionRate)),
          trendPercentage: this.calculateTrendPercentage(parseFloat(conversionRate), parseFloat(compareConversionRate)),
        },
        averageOrderValue: orderMetrics.totalOrders > 0 ? orderMetrics.totalRevenue / orderMetrics.totalOrders : 0,
        averageCustomerValue:
          customerMetrics.totalCustomers > 0 ? orderMetrics.totalRevenue / customerMetrics.totalCustomers : 0,
      };
    } catch (error) {
      console.error('获取销售指标失败:', error);
      throw new Error('获取销售指标失败');
    }
  }

  /**
   * 获取销售趋势数据
   */
  async getSalesTrend(params) {
    const { period, startDate, endDate, type = 'revenue' } = params;

    const dateCondition = this.buildDateCondition(period, startDate, endDate);
    const groupFormat = this.getGroupFormat(period);

    try {
      if (type === 'revenue') {
        const revenueData = await Order.findAll({
          attributes: [
            [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
            [sequelize.fn('SUM', sequelize.col('totalAmount')), 'value'],
          ],
          where: {
            ...dateCondition,
            status: 'completed',
          },
          group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
          order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
          raw: true,
        });

        return {
          period,
          startDate: dateCondition.startDate,
          endDate: dateCondition.endDate,
          revenue: revenueData.map(item => ({
            date: this.formatDate(item.date),
            value: parseFloat(item.value) || 0,
          })),
        };
      } else if (type === 'orders') {
        const ordersData = await Order.findAll({
          attributes: [
            [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'value'],
          ],
          where: {
            ...dateCondition,
          },
          group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
          order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
          raw: true,
        });

        return {
          period,
          startDate: dateCondition.startDate,
          endDate: dateCondition.endDate,
          orders: ordersData.map(item => ({
            date: this.formatDate(item.date),
            value: parseInt(item.value) || 0,
          })),
        };
      } else if (type === 'customers') {
        const customersData = await Order.findAll({
          attributes: [
            [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
            [sequelize.fn('COUNT_DISTINCT', sequelize.col('customerId')), 'value'],
          ],
          where: {
            ...dateCondition,
          },
          group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
          order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
          raw: true,
        });

        return {
          period,
          startDate: dateCondition.startDate,
          endDate: dateCondition.endDate,
          customers: customersData.map(item => ({
            date: this.formatDate(item.date),
            value: parseInt(item.value) || 0,
          })),
        };
      }
    } catch (error) {
      console.error('获取销售趋势失败:', error);
      throw new Error('获取销售趋势失败');
    }
  }

  /**
   * 获取热销产品排行
   */
  async getTopProducts(params) {
    const { limit = 10, period, startDate, endDate, categoryId, sortBy = 'salesAmount', sortOrder = 'desc' } = params;

    const dateCondition = this.buildDateCondition(period, startDate, endDate);

    try {
      const whereConditions = {
        ...dateCondition,
        status: 'completed',
      };

      if (categoryId) {
        whereConditions['$product.categoryId$'] = categoryId;
      }

      const orderData = await Order.findAll({
        include: [
          {
            model: Product,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
              },
            ],
          },
        ],
        where: whereConditions,
        order: [[sequelize.literal(`CAST(items.product.${sortBy} AS DECIMAL)`), sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        raw: true,
      });

      // 聚合产品数据
      const productMap = new Map();
      orderData.forEach(order => {
        order.items.forEach(item => {
          if (!item.product) return;

          const productId = item.product.id;
          if (!productMap.has(productId)) {
            productMap.set(productId, {
              id: productId,
              name: item.product.name,
              code: item.product.code,
              salesAmount: 0,
              quantity: 0,
              profitMargin: 0,
              category: item.product.category?.name || '未分类',
              imageUrl: item.product.imageUrl,
            });
          }

          const product = productMap.get(productId);
          product.salesAmount += item.quantity * item.unitPrice;
          product.quantity += item.quantity;
          // 计算利润率（假设有成本价）
          const profitMargin =
            item.product.costPrice > 0 ? ((item.unitPrice - item.product.costPrice) / item.unitPrice) * 100 : 0;
          product.profitMargin += profitMargin * item.quantity;
        });
      });

      // 计算趋势（与上期比较）
      const products = Array.from(productMap.values());
      const productsWithTrend = await this.addProductTrends(products, dateCondition);

      return productsWithTrend
        .sort((a, b) => {
          const orderA = sortOrder === 'asc' ? 1 : -1;
          return orderA * (a[sortBy] - b[sortBy]);
        })
        .slice(0, limit);
    } catch (error) {
      console.error('获取热销产品失败:', error);
      throw new Error('获取热销产品失败');
    }
  }

  /**
   * 获取客户分析数据
   */
  async getCustomerAnalysis(params) {
    const { type = 'type', period, startDate, endDate } = params;

    const dateCondition = this.buildDateCondition(period, startDate, endDate);
    const whereConditions = {
      ...dateCondition,
    };

    try {
      if (type === 'type') {
        // 获取客户类型分析
        const [newCustomers, existingCustomers, vipCustomers, potentialCustomers] = await Promise.all([
          this.getCustomerCountByType(whereConditions, 'new'),
          this.getCustomerCountByType(whereConditions, 'existing'),
          this.getCustomerCountByType(whereConditions, 'vip'),
          this.getCustomerCountByType(whereConditions, 'potential'),
        ]);

        return {
          type: {
            newCustomers,
            existingCustomers,
            vipCustomers,
            potentialCustomers,
          },
        };
      } else if (type === 'region') {
        // 获取地域分析
        const regionData = await Customer.findAll({
          attributes: ['regionId', [sequelize.fn('COUNT_DISTINCT', sequelize.col('id')), 'count']],
          include: [
            {
              model: require('../models').Region,
              as: 'region',
            },
          ],
          where: whereConditions,
          group: ['regionId'],
          raw: true,
        });

        const regions = {};
        const totalCustomers = await Customer.count({ where: whereConditions });

        regionData.forEach(item => {
          regions[item.regionId || 'unknown'] = {
            regionId: item.regionId,
            regionName: item.region?.name || '未知地区',
            count: parseInt(item.count),
            percentage: ((parseInt(item.count) / totalCustomers) * 100).toFixed(1),
          };
        });

        return {
          region: regions,
        };
      } else if (type === 'industry') {
        // 获取行业分析
        const industryData = await Customer.findAll({
          attributes: ['industry', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
          where: whereConditions,
          group: ['industry'],
          raw: true,
        });

        const industries = {};
        const totalCustomers = await Customer.count({ where: whereConditions });

        industryData.forEach(item => {
          industries[item.industry || 'unknown'] = {
            industry: item.industry,
            count: parseInt(item.count),
            percentage: ((parseInt(item.count) / totalCustomers) * 100).toFixed(1),
          };
        });

        return {
          industry: industries,
        };
      }
    } catch (error) {
      console.error('获取客户分析失败:', error);
      throw new Error('获取客户分析失败');
    }
  }

  /**
   * 获取销售目标
   */
  async getSalesTargets(params) {
    const { period, year, month, quarter, userId } = params;

    const whereConditions = {};
    if (userId) whereConditions.userId = userId;
    if (year) whereConditions.year = year;
    if (month) whereConditions.month = month;
    if (quarter) whereConditions.quarter = quarter;

    try {
      const targets = await SalesTarget.findAll({
        where: whereConditions,
        order: [['createdAt', 'DESC']],
      });

      return targets.map(target => {
        const progress = target.target > 0 ? (target.current / target.target) * 100 : 0;
        return {
          ...target.toJSON(),
          progress: Math.min(progress, 100),
        };
      });
    } catch (error) {
      console.error('获取销售目标失败:', error);
      throw new Error('获取销售目标失败');
    }
  }

  /**
   * 获取销售活动日志
   */
  async getActivities(params) {
    const { type, userId, customerId, startDate, endDate, limit = 10, before } = params;

    const whereConditions = {};
    if (type) whereConditions.type = type;
    if (userId) whereConditions.userId = userId;
    if (customerId) whereConditions.customerId = customerId;
    if (before) {
      whereConditions.createdAt = { [Op.lt]: before };
    } else {
      const dateCondition = this.buildDateCondition('month', startDate, endDate);
      Object.assign(whereConditions, dateCondition);
    }

    try {
      const activities = await ActivityLog.findAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name'],
          },
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
      });

      return activities.map(activity => ({
        ...activity.toJSON(),
        userName: activity.user?.name,
        customerName: activity.customer?.name,
      }));
    } catch (error) {
      console.error('获取活动日志失败:', error);
      throw new Error('获取活动日志失败');
    }
  }

  /**
   * 创建销售目标
   */
  async createSalesTarget(targetData) {
    try {
      const target = await SalesTarget.create({
        ...targetData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return target;
    } catch (error) {
      console.error('创建销售目标失败:', error);
      throw new Error('创建销售目标失败');
    }
  }

  /**
   * 更新销售目标
   */
  async updateSalesTarget(id, updateData) {
    try {
      await SalesTarget.update({ ...updateData, updatedAt: new Date() }, { where: { id } });

      const updatedTarget = await SalesTarget.findByPk(id);
      return updatedTarget;
    } catch (error) {
      console.error('更新销售目标失败:', error);
      throw new Error('更新销售目标失败');
    }
  }

  // 私有方法

  buildDateCondition(period, startDate, endDate) {
    const now = new Date();
    let condition = {};

    if (startDate && endDate) {
      condition.createdAt = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate + ' 23:59:59'),
      };
    } else {
      switch (period) {
        case 'today':
          condition.createdAt = {
            [Op.gte]: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            [Op.lt]: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          };
          break;
        case 'week':
          const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
          const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          condition.createdAt = {
            [Op.gte]: weekStart,
            [Op.lte]: weekEnd,
          };
          break;
        case 'month':
          condition.createdAt = {
            [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1),
            [Op.lt]: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          };
          break;
        case 'quarter':
          const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
          condition.createdAt = {
            [Op.gte]: new Date(now.getFullYear(), quarterStartMonth, 1),
            [Op.lt]: new Date(now.getFullYear(), quarterStartMonth + 3, 1),
          };
          break;
        case 'year':
          condition.createdAt = {
            [Op.gte]: new Date(now.getFullYear(), 0, 1),
            [Op.lt]: new Date(now.getFullYear() + 1, 0, 1),
          };
          break;
        default:
          // 默认最近30天
          condition.createdAt = {
            [Op.gte]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            [Op.lte]: now,
          };
      }
    }

    return condition;
  }

  getComparePeriod(currentPeriod, startDate, endDate) {
    // 计算上期时间范围
    if (startDate && endDate) {
      const currentStart = new Date(startDate);
      const currentEnd = new Date(endDate);
      const daysDiff = Math.ceil((currentEnd - currentStart) / (24 * 60 * 60 * 1000));

      const compareStart = new Date(currentStart.getTime() - daysDiff * 24 * 60 * 60 * 1000);
      const compareEnd = new Date(currentEnd.getTime() - daysDiff * 24 * 60 * 60 * 1000);

      return {
        period: currentPeriod,
        startDate: this.formatDate(compareStart),
        endDate: this.formatDate(compareEnd),
      };
    }

    switch (currentPeriod) {
      case 'today':
        return { period: 'yesterday' };
      case 'week':
        return { period: 'lastWeek' };
      case 'month':
        return { period: 'lastMonth' };
      case 'quarter':
        return { period: 'lastQuarter' };
      case 'year':
        return { period: 'lastYear' };
      default:
        return { period: 'lastPeriod' };
    }
  }

  async getOrderMetrics(whereConditions, categoryId) {
    const whereClause = { ...whereConditions };
    if (categoryId) {
      whereClause['$items.product.categoryId$'] = categoryId;
    }

    const [totalRevenue, totalOrders] = await Promise.all([
      Order.sum('totalAmount', { where: whereClause }),
      Order.count({ where: whereClause }),
    ]);

    return {
      totalRevenue: parseFloat(totalRevenue) || 0,
      totalOrders: parseInt(totalOrders) || 0,
    };
  }

  async getQuotationMetrics(whereConditions, categoryId) {
    const whereClause = { ...whereConditions };
    if (categoryId) {
      whereClause['$items.product.categoryId$'] = categoryId;
    }

    const totalQuotations = await Quotation.count({ where: whereClause });

    return {
      totalQuotations: parseInt(totalQuotations) || 0,
    };
  }

  async getCustomerMetrics(whereConditions) {
    const totalCustomers = await Customer.count({ where: whereConditions });

    return {
      totalCustomers: parseInt(totalCustomers) || 0,
    };
  }

  async getCustomerCountByType(whereConditions, type) {
    // 这里需要根据实际业务逻辑实现
    // 例如：new客户 - 创建时间在指定时间范围内
    // existing客户 - 创建时间早于指定时间范围
    // vip客户 - 累计订单金额大于某个阈值
    // potential客户 - 有询价但没有订单

    switch (type) {
      case 'new':
        return await Customer.count({
          where: {
            ...whereConditions,
            createdAt: whereConditions.createdAt,
          },
        });
      case 'existing':
        return await Customer.count({
          where: {
            ...whereConditions,
            createdAt: {
              [Op.lt]: whereConditions.createdAt[Op.gte],
            },
          },
        });
      case 'vip':
        return await sequelize
          .query(
            `
          SELECT COUNT(DISTINCT c.id) as count 
          FROM customers c 
          INNER JOIN orders o ON c.id = o.customerId 
          WHERE o.status = 'completed' 
          AND o.createdAt >= :startDate 
          AND o.createdAt <= :endDate
          GROUP BY c.id 
          HAVING SUM(o.totalAmount) >= 100000
        `,
            {
              replacements: whereConditions.createdAt,
              type: sequelize.QueryTypes.SELECT,
            },
          )
          .then(result => result[0][0].count || 0);
      case 'potential':
        return await sequelize
          .query(
            `
          SELECT COUNT(DISTINCT c.id) as count 
          FROM customers c 
          INNER JOIN quotations q ON c.id = q.customerId 
          LEFT JOIN orders o ON c.id = o.customerId 
          WHERE q.createdAt >= :startDate 
          AND q.createdAt <= :endDate 
          AND o.id IS NULL
        `,
            {
              replacements: whereConditions.createdAt,
              type: sequelize.QueryTypes.SELECT,
            },
          )
          .then(result => result[0][0].count || 0);
    }
  }

  async addProductTrends(products, dateCondition) {
    const compareDateCondition = this.getComparePeriod(
      'month',
      dateCondition.createdAt?.[Op.gte],
      dateCondition.createdAt?.[Op.lte],
    );
    const compareWhereConditions = {
      ...compareDateCondition,
      status: 'completed',
    };

    const compareProductsMap = new Map();

    for (const product of products) {
      const [compareData] = await sequelize.query(
        `
        SELECT 
          SUM(oi.quantity * oi.unitPrice) as salesAmount,
          SUM(oi.quantity) as quantity
        FROM orders o
        INNER JOIN order_items oi ON o.id = oi.orderId
        INNER JOIN products p ON oi.productId = p.id
        WHERE o.status = 'completed'
        AND o.createdAt >= :startDate
        AND o.createdAt <= :endDate
        AND oi.productId = :productId
        GROUP BY oi.productId
      `,
        {
          replacements: {
            startDate: compareDateCondition.startDate,
            endDate: compareDateCondition.endDate,
            productId: product.id,
          },
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (compareData.length > 0) {
        const compareSalesAmount = parseFloat(compareData[0].salesAmount) || 0;
        product.trend = this.calculateTrend(product.salesAmount, compareSalesAmount);
      } else {
        product.trend = 'stable';
      }
    }

    return products;
  }

  getGroupFormat(period) {
    switch (period) {
      case 'daily':
        return sequelize.fn('DATE', sequelize.col('createdAt'));
      case 'weekly':
        return sequelize.fn('WEEK', sequelize.col('createdAt'));
      case 'monthly':
      default:
        return sequelize.fn('DATE', sequelize.col('createdAt'));
    }
  }

  calculateTrend(current, compare) {
    if (current > compare) return 'up';
    if (current < compare) return 'down';
    return 'stable';
  }

  calculateTrendPercentage(current, compare) {
    if (compare === 0) return 0;
    return ((current - compare) / compare) * 100;
  }

  formatDate(date) {
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  }
}

module.exports = new SalesService();
