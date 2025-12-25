const salesService = require('../services/salesService');
const { validationResult } = require('../utils/validation');

class SalesController {
  /**
   * 获取销售关键指标
   */
  async getSalesMetrics(req, res) {
    try {
      const { period, startDate, endDate, userId, customerId, regionId, categoryId } = req.query;

      // 参数验证
      const validation = validationResult.validateSalesQuery(req.query);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          code: 400,
        });
      }

      const metrics = await salesService.getSalesMetrics({
        period,
        startDate,
        endDate,
        userId,
        customerId,
        regionId,
        categoryId,
      });

      res.json({
        success: true,
        data: metrics,
        message: '获取销售指标成功',
      });
    } catch (error) {
      console.error('获取销售指标失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500,
      });
    }
  }

  /**
   * 获取销售趋势数据
   */
  async getSalesTrend(req, res) {
    try {
      const { period, startDate, endDate, type = 'revenue' } = req.query;

      const validation = validationResult.validateTrendQuery(req.query);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          code: 400,
        });
      }

      const trendData = await salesService.getSalesTrend({
        period,
        startDate,
        endDate,
        type,
      });

      res.json({
        success: true,
        data: trendData,
        message: '获取销售趋势成功',
      });
    } catch (error) {
      console.error('获取销售趋势失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500,
      });
    }
  }

  /**
   * 获取热销产品排行
   */
  async getTopProducts(req, res) {
    try {
      const {
        limit = 10,
        period,
        startDate,
        endDate,
        categoryId,
        sortBy = 'salesAmount',
        sortOrder = 'desc',
      } = req.query;

      const validation = validationResult.validateTopProductsQuery(req.query);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          code: 400,
        });
      }

      const topProducts = await salesService.getTopProducts({
        limit: parseInt(limit),
        period,
        startDate,
        endDate,
        categoryId,
        sortBy,
        sortOrder,
      });

      res.json({
        success: true,
        data: topProducts,
        message: '获取热销产品成功',
      });
    } catch (error) {
      console.error('获取热销产品失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500,
      });
    }
  }

  /**
   * 获取客户分析数据
   */
  async getCustomerAnalysis(req, res) {
    try {
      const { type = 'type', period, startDate, endDate } = req.query;

      const validation = validationResult.validateCustomerAnalysisQuery(req.query);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          code: 400,
        });
      }

      const customerAnalysis = await salesService.getCustomerAnalysis({
        type,
        period,
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: customerAnalysis,
        message: '获取客户分析成功',
      });
    } catch (error) {
      console.error('获取客户分析失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500,
      });
    }
  }

  /**
   * 获取销售目标
   */
  async getSalesTargets(req, res) {
    try {
      const { period, year, month, quarter, userId } = req.query;

      const validation = validationResult.validateTargetsQuery(req.query);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          code: 400,
        });
      }

      const targets = await salesService.getSalesTargets({
        period,
        year: year ? parseInt(year) : undefined,
        month: month ? parseInt(month) : undefined,
        quarter: quarter ? parseInt(quarter) : undefined,
        userId,
      });

      res.json({
        success: true,
        data: targets,
        message: '获取销售目标成功',
      });
    } catch (error) {
      console.error('获取销售目标失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500,
      });
    }
  }

  /**
   * 创建销售目标
   */
  async createSalesTarget(req, res) {
    try {
      const targetData = req.body;
      targetData.userId = req.user.id;
      targetData.createdBy = req.user.name;

      const validation = validationResult.validateTargetCreation(targetData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          code: 400,
        });
      }

      const target = await salesService.createSalesTarget(targetData);

      res.status(201).json({
        success: true,
        data: target,
        message: '创建销售目标成功',
      });
    } catch (error) {
      console.error('创建销售目标失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500,
      });
    }
  }

  /**
   * 更新销售目标
   */
  async updateSalesTarget(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.updatedBy = req.user.name;

      const validation = validationResult.validateTargetUpdate(updateData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          code: 400,
        });
      }

      const target = await salesService.updateSalesTarget(id, updateData);

      res.json({
        success: true,
        data: target,
        message: '更新销售目标成功',
      });
    } catch (error) {
      console.error('更新销售目标失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500,
      });
    }
  }

  /**
   * 获取销售活动日志
   */
  async getActivities(req, res) {
    try {
      const { type, userId, customerId, startDate, endDate, limit = 10, before } = req.query;

      const validation = validationResult.validateActivitiesQuery(req.query);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          code: 400,
        });
      }

      const activities = await salesService.getActivities({
        type,
        userId,
        customerId,
        startDate,
        endDate,
        limit: parseInt(limit),
        before,
      });

      res.json({
        success: true,
        data: activities,
        message: '获取活动日志成功',
      });
    } catch (error) {
      console.error('获取活动日志失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500,
      });
    }
  }

  /**
   * 获取销售报表
   */
  async getSalesReport(req, res) {
    try {
      const {
        type = 'summary',
        period = 'monthly',
        startDate,
        endDate,
        format = 'json',
        includeCharts = true,
      } = req.query;

      const validation = validationResult.validateReportQuery(req.query);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          code: 400,
        });
      }

      if (format === 'excel' || format === 'pdf') {
        // 导出文件
        const reportData = await salesService.generateSalesReport({
          type,
          period,
          startDate,
          endDate,
          includeCharts: includeCharts === 'true',
        });

        res.setHeader(
          'Content-Type',
          format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf',
        );
        res.setHeader('Content-Disposition', `attachment; filename="sales-report.${format}"`);
        res.send(reportData);
      } else {
        // 返回JSON数据
        const reportData = await salesService.getSalesReportData({
          type,
          period,
          startDate,
          endDate,
          includeCharts: includeCharts === 'true',
        });

        res.json({
          success: true,
          data: reportData,
          message: '获取销售报表成功',
        });
      }
    } catch (error) {
      console.error('获取销售报表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500,
      });
    }
  }

  /**
   * 获取销售预测
   */
  async getSalesForecast(req, res) {
    try {
      const { period = 'monthly', forecastMonths = 12, basis = 'historical', confidence = 80 } = req.query;

      const validation = validationResult.validateForecastQuery(req.query);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          code: 400,
        });
      }

      const forecast = await salesService.getSalesForecast({
        period,
        forecastMonths: parseInt(forecastMonths),
        basis,
        confidence: parseInt(confidence),
      });

      res.json({
        success: true,
        data: forecast,
        message: '获取销售预测成功',
      });
    } catch (error) {
      console.error('获取销售预测失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500,
      });
    }
  }

  /**
   * 获取销售排行
   */
  async getSalesRanking(req, res) {
    try {
      const { type = 'salesperson', period = 'monthly', startDate, endDate, limit = 20 } = req.query;

      const validation = validationResult.validateRankingQuery(req.query);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          code: 400,
        });
      }

      const ranking = await salesService.getSalesRanking({
        type,
        period,
        startDate,
        endDate,
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        data: ranking,
        message: '获取销售排行成功',
      });
    } catch (error) {
      console.error('获取销售排行失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500,
      });
    }
  }

  /**
   * 获取销售转化漏斗
   */
  async getSalesFunnel(req, res) {
    try {
      const { period, startDate, endDate } = req.query;

      const validation = validationResult.validateFunnelQuery(req.query);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          code: 400,
        });
      }

      const funnel = await salesService.getSalesFunnel({
        period,
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: funnel,
        message: '获取销售转化漏斗成功',
      });
    } catch (error) {
      console.error('获取销售转化漏斗失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500,
      });
    }
  }

  /**
   * 获取销售效率分析
   */
  async getSalesEfficiency(req, res) {
    try {
      const { userId, period, startDate, endDate } = req.query;

      const validation = validationResult.validateEfficiencyQuery(req.query);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          code: 400,
        });
      }

      const efficiency = await salesService.getSalesEfficiency({
        userId,
        period,
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: efficiency,
        message: '获取销售效率分析成功',
      });
    } catch (error) {
      console.error('获取销售效率分析失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500,
      });
    }
  }

  /**
   * 获取实时销售数据
   */
  async getRealTimeSales(req, res) {
    try {
      const { timeRange = 60, refreshRate = 30 } = req.query;

      const validation = validationResult.validateRealTimeQuery(req.query);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          code: 400,
        });
      }

      const realTimeData = await salesService.getRealTimeSales({
        timeRange: parseInt(timeRange),
        refreshRate: parseInt(refreshRate),
      });

      res.json({
        success: true,
        data: realTimeData,
        message: '获取实时销售数据成功',
      });
    } catch (error) {
      console.error('获取实时销售数据失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500,
      });
    }
  }

  /**
   * 获取销售业绩对比
   */
  async getSalesComparison(req, res) {
    try {
      const { currentPeriod, comparePeriod, metrics, userIds } = req.body;

      const validation = validationResult.validateComparisonQuery(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          code: 400,
        });
      }

      const comparison = await salesService.getSalesComparison({
        currentPeriod,
        comparePeriod,
        metrics,
        userIds,
      });

      res.json({
        success: true,
        data: comparison,
        message: '获取销售业绩对比成功',
      });
    } catch (error) {
      console.error('获取销售业绩对比失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500,
      });
    }
  }

  /**
   * 导出销售数据
   */
  async exportSalesData(req, res) {
    try {
      const { type = 'orders', period, startDate, endDate, format = 'excel', columns } = req.query;

      const validation = validationResult.validateExportQuery(req.query);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          code: 400,
        });
      }

      const exportData = await salesService.exportSalesData({
        type,
        period,
        startDate,
        endDate,
        format,
        columns: columns ? columns.split(',') : undefined,
      });

      res.setHeader(
        'Content-Type',
        format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
      );
      res.setHeader('Content-Disposition', `attachment; filename="sales-data.${format}"`);
      res.send(exportData);
    } catch (error) {
      console.error('导出销售数据失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500,
      });
    }
  }
}

module.exports = new SalesController();
