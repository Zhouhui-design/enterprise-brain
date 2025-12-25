const procurementPlanService = require('../services/procurementPlanService');

/**
 * 采购计划控制器
 */
class ProcurementPlanController {
  /**
   * 获取采购计划列表（分页+搜索）
   */
  async getList(req, res) {
    try {
      const params = req.query;
      const result = await procurementPlanService.getList(params);
      
      res.json({
        success: true,
        data: result,
        message: '获取采购计划列表成功'
      });
    } catch (error) {
      console.error('获取采购计划列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 根据ID获取采购计划
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const procurementPlan = await procurementPlanService.getById(id);
      
      if (!procurementPlan) {
        return res.status(404).json({
          success: false,
          message: '采购计划不存在',
          code: 404
        });
      }
      
      res.json({
        success: true,
        data: procurementPlan,
        message: '获取采购计划详情成功'
      });
    } catch (error) {
      console.error('获取采购计划详情失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 创建采购计划
   */
  async create(req, res) {
    try {
      const procurementPlanData = req.body;
      const result = await procurementPlanService.create(procurementPlanData);
      
      res.status(201).json({
        success: true,
        data: { id: result },
        message: '创建采购计划成功'
      });
    } catch (error) {
      console.error('创建采购计划失败:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 400
      });
    }
  }

  /**
   * 更新采购计划
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const procurementPlanData = req.body;
      
      await procurementPlanService.update(id, procurementPlanData);
      
      res.json({
        success: true,
        message: '更新采购计划成功'
      });
    } catch (error) {
      console.error('更新采购计划失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 删除采购计划
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      await procurementPlanService.delete(id);
      
      res.json({
        success: true,
        message: '删除采购计划成功'
      });
    } catch (error) {
      console.error('删除采购计划失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 批量删除采购计划
   */
  async batchDelete(req, res) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的采购计划ID列表',
          code: 400
        });
      }
      
      await procurementPlanService.batchDelete(ids);
      
      res.json({
        success: true,
        message: '批量删除采购计划成功'
      });
    } catch (error) {
      console.error('批量删除采购计划失败:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        code: 500
      });
    }
  }

  /**
   * 批量终止采购计划
   */
  async batchTerminate(req, res) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的采购计划ID列表',
          code: 400
        });
      }
      
      await procurementPlanService.batchTerminate(ids);
      
      res.json({
        success: true,
        message: '批量终止采购计划成功'
      });
    } catch (error) {
      console.error('批量终止采购计划失败:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        code: 500
      });
    }
  }

  /**
   * 批量撤回采购计划
   */
  async batchRecall(req, res) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的采购计划ID列表',
          code: 400
        });
      }
      
      await procurementPlanService.batchRecall(ids);
      
      res.json({
        success: true,
        message: '批量撤回采购计划成功'
      });
    } catch (error) {
      console.error('批量撤回采购计划失败:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        code: 500
      });
    }
  }

  /**
   * 采购计划合并为采购订单
   */
  async mergeToOrder(req, res) {
    try {
      const { planIds, mergeRule } = req.body;
      
      if (!Array.isArray(planIds) || planIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的采购计划ID列表',
          code: 400
        });
      }
      
      const result = await procurementPlanService.mergeToOrder(planIds, mergeRule);
      
      res.json({
        success: true,
        data: result,
        message: '采购计划合并为采购订单成功'
      });
    } catch (error) {
      console.error('采购计划合并为采购订单失败:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        code: 500
      });
    }
  }

  /**
   * 采购前询问
   */
  async prePurchaseInquiry(req, res) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的采购计划ID列表',
          code: 400
        });
      }
      
      await procurementPlanService.prePurchaseInquiry(ids);
      
      res.json({
        success: true,
        message: '采购前询问成功'
      });
    } catch (error) {
      console.error('采购前询问失败:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        code: 500
      });
    }
  }

  /**
   * 立即下单
   */
  async placeOrder(req, res) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的采购计划ID列表',
          code: 400
        });
      }
      
      await procurementPlanService.placeOrder(ids);
      
      res.json({
        success: true,
        message: '立即下单成功'
      });
    } catch (error) {
      console.error('立即下单失败:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        code: 500
      });
    }
  }

  /**
   * 撤回下单
   */
  async withdrawOrder(req, res) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的采购计划ID列表',
          code: 400
        });
      }
      
      await procurementPlanService.withdrawOrder(ids);
      
      res.json({
        success: true,
        message: '撤回下单成功'
      });
    } catch (error) {
      console.error('撤回下单失败:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        code: 500
      });
    }
  }
}

module.exports = new ProcurementPlanController();
