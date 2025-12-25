const express = require('express');
const router = express.Router();
const processPlanController = require('../controllers/processPlanController');

/**
 * 获取工序计划列表(分页)
 * GET /api/process-plans
 */
router.get('/', processPlanController.getAll);

/**
 * 根据ID获取工序计划详情
 * GET /api/process-plans/:id
 */
router.get('/:id', processPlanController.getById);

/**
 * 创建工序计划
 * POST /api/process-plans
 */
router.post('/', processPlanController.create);

/**
 * 更新工序计划
 * PUT /api/process-plans/:id
 */
router.put('/:id', processPlanController.update);

/**
 * 删除工序计划
 * DELETE /api/process-plans/:id
 */
router.delete('/:id', processPlanController.delete);

/**
 * 批量删除工序计划
 * POST /api/process-plans/batch-delete
 */
router.post('/batch-delete', processPlanController.batchDelete);

// 修复定时工额接口
router.post('/fix-standard-work-quota', async (req, res) => {
  try {
    const { fixProcessPlanStandardWorkQuota } = require('../scripts/fixProcessPlanStandardWorkQuota');

    console.log('🔧 收到修复定时工额请求...');
    const result = await fixProcessPlanStandardWorkQuota();

    res.setHeader('Content-Type', 'application/json');
    res.send(
      customJsonStringify({
        code: 200,
        data: result,
        message: '定时工额修复完成',
      }),
    );
  } catch (error) {
    console.error('❌ 修复定时工额失败:', error);
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(
      customJsonStringify({
        code: 500,
        message: '修复定时工额失败: ' + error.message,
      }),
    );
  }
});

module.exports = router;
