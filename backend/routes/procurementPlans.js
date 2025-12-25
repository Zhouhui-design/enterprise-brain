const express = require('express');
const router = express.Router();
const procurementPlanController = require('../controllers/procurementPlanController');

/**
 * 获取采购计划列表（分页+搜索）
 * GET /api/procurement-plans
 * Query参数: page, pageSize, procurementPlanNo, purchaseOrderNo, procurementStatus, supplierName
 */
router.get('/', procurementPlanController.getList);

/**
 * 获取单条采购计划详情
 * GET /api/procurement-plans/:id
 */
router.get('/:id', procurementPlanController.getById);

/**
 * 新增采购计划
 * POST /api/procurement-plans
 */
router.post('/', procurementPlanController.create);

/**
 * 更新采购计划
 * PUT /api/procurement-plans/:id
 */
router.put('/:id', procurementPlanController.update);

/**
 * 删除单条采购计划
 * DELETE /api/procurement-plans/:id
 */
router.delete('/:id', procurementPlanController.delete);

/**
 * 批量删除采购计划
 * POST /api/procurement-plans/batch-delete
 * Body: { ids: [1, 2, 3] }
 */
router.post('/batch-delete', procurementPlanController.batchDelete);

/**
 * 批量终止采购计划
 * POST /api/procurement-plans/batch-terminate
 * Body: { ids: [1, 2, 3] }
 */
router.post('/batch-terminate', procurementPlanController.batchTerminate);

/**
 * 批量撤回采购计划
 * POST /api/procurement-plans/batch-recall
 * Body: { ids: [1, 2, 3] }
 */
router.post('/batch-recall', procurementPlanController.batchRecall);

/**
 * ✅ 新增：采购计划合并为采购订单
 * POST /api/procurement-plans/merge-to-order
 * Body: { planIds: [1, 2, 3], mergeRule: 'sameSupplierSameDate' }
 */
router.post('/merge-to-order', procurementPlanController.mergeToOrder);

/**
 * ✅ 新增：采购前询问
 * POST /api/procurement-plans/pre-purchase-inquiry
 * Body: { ids: [1, 2, 3] }
 */
router.post('/pre-purchase-inquiry', procurementPlanController.prePurchaseInquiry);

/**
 * ✅ 新增：立即下单
 * POST /api/procurement-plans/place-order
 * Body: { ids: [1, 2, 3] }
 */
router.post('/place-order', procurementPlanController.placeOrder);

/**
 * ✅ 新增：撤回下单
 * POST /api/procurement-plans/withdraw-order
 * Body: { ids: [1, 2, 3] }
 */
router.post('/withdraw-order', procurementPlanController.withdrawOrder);

module.exports = router;
