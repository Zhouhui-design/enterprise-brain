const express = require('express');
const router = express.Router();
const procurementPlanService = require('../services/procurementPlanService');

/**
 * 获取采购计划列表（分页+搜索）
 * GET /api/procurement-plans
 * Query参数: page, pageSize, procurementPlanNo, purchaseOrderNo, procurementStatus, supplierName
 */
router.get('/', async (req, res) => {
  console.log('[procurement-plans] GET / - 请求参数:', req.query);
  console.log('[procurement-plans] 参数类型:', {
    page: typeof req.query.page,
    pageSize: typeof req.query.pageSize,
    procurementPlanNo: typeof req.query.procurementPlanNo
  });
  try {
    // 清理参数，确保类型正确
    const cleanParams = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      procurementPlanNo: req.query.procurementPlanNo || undefined,
      purchaseOrderNo: req.query.purchaseOrderNo || undefined,
      procurementStatus: req.query.procurementStatus || undefined,
      supplierName: req.query.supplierName || undefined
    };
    console.log('[procurement-plans] 清理后参数:', cleanParams);
    const result = await procurementPlanService.getList(cleanParams);
    res.json({
      code: 200,
      message: 'success',
      data: {
        records: result.records,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize
      }
    });
  } catch (error) {
    console.error('获取采购计划列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取采购计划列表失败: ' + error.message
    });
  }
});

/**
 * 获取单条采购计划详情
 * GET /api/procurement-plans/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const plan = await procurementPlanService.getById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        code: 404,
        message: '采购计划不存在'
      });
    }
    res.json({
      code: 200,
      message: 'success',
      data: plan
    });
  } catch (error) {
    console.error('获取采购计划详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取采购计划详情失败: ' + error.message
    });
  }
});

/**
 * 新增采购计划
 * POST /api/procurement-plans
 */
router.post('/', async (req, res) => {
  try {
    const id = await procurementPlanService.create(req.body);
    res.json({
      code: 200,
      message: '新增采购计划成功',
      data: { id }
    });
  } catch (error) {
    console.error('新增采购计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '新增采购计划失败: ' + error.message
    });
  }
});

/**
 * 更新采购计划
 * PUT /api/procurement-plans/:id
 */
router.put('/:id', async (req, res) => {
  try {
    await procurementPlanService.update(req.params.id, req.body);
    res.json({
      code: 200,
      message: '更新采购计划成功'
    });
  } catch (error) {
    console.error('更新采购计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新采购计划失败: ' + error.message
    });
  }
});

/**
 * 删除单条采购计划
 * DELETE /api/procurement-plans/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await procurementPlanService.delete(req.params.id);
    res.json({
      code: 200,
      message: '删除采购计划成功'
    });
  } catch (error) {
    console.error('删除采购计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除采购计划失败: ' + error.message
    });
  }
});

/**
 * 批量删除采购计划
 * POST /api/procurement-plans/batch-delete
 * Body: { ids: [1, 2, 3] }
 */
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供要删除的ID列表'
      });
    }
    await procurementPlanService.batchDelete(ids);
    res.json({
      code: 200,
      message: `成功删除${ids.length}条采购计划`
    });
  } catch (error) {
    console.error('批量删除采购计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '批量删除采购计划失败: ' + error.message
    });
  }
});

/**
 * 批量终止采购计划
 * POST /api/procurement-plans/batch-terminate
 * Body: { ids: [1, 2, 3] }
 */
router.post('/batch-terminate', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供要终止的ID列表'
      });
    }
    await procurementPlanService.batchTerminate(ids);
    res.json({
      code: 200,
      message: `成功终止${ids.length}条采购计划`
    });
  } catch (error) {
    console.error('批量终止采购计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '批量终止采购计划失败: ' + error.message
    });
  }
});

/**
 * 批量撤回采购计划
 * POST /api/procurement-plans/batch-recall
 * Body: { ids: [1, 2, 3] }
 */
router.post('/batch-recall', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供要撤回的ID列表'
      });
    }
    await procurementPlanService.batchRecall(ids);
    res.json({
      code: 200,
      message: `成功撤回${ids.length}条采购计划`
    });
  } catch (error) {
    console.error('批量撤回采购计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '批量撤回采购计划失败: ' + error.message
    });
  }
});

/**
 * ✅ 新增：采购计划合并为采购订单
 * POST /api/procurement-plans/merge-to-order
 * Body: { planIds: [1, 2, 3], mergeRule: 'sameSupplierSameDate' }
 */
router.post('/merge-to-order', async (req, res) => {
  try {
    const { planIds, mergeRule } = req.body;
    
    if (!planIds || !Array.isArray(planIds) || planIds.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供要合并的采购计划ID列表'
      });
    }
    
    if (!mergeRule) {
      return res.status(400).json({
        code: 400,
        message: '请选择合并规则'
      });
    }
    
    console.log(`🔗 开始合并采购计划: ${planIds.length}条, 规则: ${mergeRule}`);
    
    const result = await procurementPlanService.mergeToOrder(planIds, mergeRule);
    
    res.json({
      code: 200,
      message: `成功合并${planIds.length}条采购计划，生成${result.orderCount}个采购订单`,
      data: result
    });
  } catch (error) {
    console.error('合并采购计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '合并采购计划失败: ' + error.message
    });
  }
});

module.exports = router;
