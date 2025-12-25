/**
 * 供应商评价路由
 */

const express = require('express');
const router = express.Router();
const supplierEvaluationService = require('../services/supplierEvaluationService');

/**
 * 获取供应商评价列表
 * GET /api/supplier-evaluations
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 获取供应商评价列表:', req.query);
    const data = await supplierEvaluationService.getList(req.query);

    res.json({
      code: 200,
      data,
      message: '获取成功',
    });
  } catch (error) {
    console.error('获取供应商评价列表失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
    });
  }
});

/**
 * 根据ID获取供应商评价详情
 * GET /api/supplier-evaluations/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📄 获取供应商评价详情: ID=${id}`);

    const data = await supplierEvaluationService.getById(id);

    res.json({
      code: 200,
      data,
      message: '获取成功',
    });
  } catch (error) {
    console.error('获取供应商评价详情失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
    });
  }
});

/**
 * 创建供应商评价
 * POST /api/supplier-evaluations
 */
router.post('/', async (req, res) => {
  try {
    console.log('➕ 创建供应商评价:', req.body);
    const data = await supplierEvaluationService.create(req.body);

    res.json({
      code: 200,
      data,
      message: '创建成功',
    });
  } catch (error) {
    console.error('创建供应商评价失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '创建失败',
    });
  }
});

/**
 * 更新供应商评价
 * PUT /api/supplier-evaluations/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✏️ 更新供应商评价: ID=${id}`, req.body);

    const data = await supplierEvaluationService.update(id, req.body);

    res.json({
      code: 200,
      data,
      message: '更新成功',
    });
  } catch (error) {
    console.error('更新供应商评价失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '更新失败',
    });
  }
});

/**
 * 删除供应商评价
 * DELETE /api/supplier-evaluations/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`❌ 删除供应商评价: ID=${id}`);

    await supplierEvaluationService.deleteById(id);

    res.json({
      code: 200,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除供应商评价失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '删除失败',
    });
  }
});

/**
 * 批量删除供应商评价
 * POST /api/supplier-evaluations/batch-delete
 */
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    console.log(`🗑️ 批量删除供应商评价: IDs=${ids}`);

    await supplierEvaluationService.batchDelete(ids);

    res.json({
      code: 200,
      message: '批量删除成功',
    });
  } catch (error) {
    console.error('批量删除供应商评价失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '批量删除失败',
    });
  }
});

module.exports = router;
