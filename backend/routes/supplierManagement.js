/**
 * 供应商管理 Routes 层
 * 定义 REST API 端点
 */
const express = require('express');
const router = express.Router();
const supplierManagementService = require('../services/supplierManagementService');

/**
 * 获取供应商列表
 * GET /api/supplier-management
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 获取供应商列表:', req.query);
    const data = await supplierManagementService.getList(req.query);

    res.json({
      code: 200,
      data,
      message: '获取成功',
    });
  } catch (error) {
    console.error('获取供应商列表失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
    });
  }
});

/**
 * 根据ID获取供应商详情
 * GET /api/supplier-management/:id
 */
router.get('/:id', async (req, res) => {
  try {
    console.log('📄 获取供应商详情:', req.params.id);
    const data = await supplierManagementService.getById(req.params.id);

    res.json({
      code: 200,
      data,
      message: '获取成功',
    });
  } catch (error) {
    console.error('获取供应商详情失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
    });
  }
});

/**
 * 创建供应商
 * POST /api/supplier-management
 */
router.post('/', async (req, res) => {
  try {
    console.log('✨ 创建供应商:', req.body);
    const data = await supplierManagementService.create(req.body);

    res.json({
      code: 200,
      data,
      message: '创建成功',
    });
  } catch (error) {
    console.error('创建供应商失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '创建失败',
    });
  }
});

/**
 * 更新供应商
 * PUT /api/supplier-management/:id
 */
router.put('/:id', async (req, res) => {
  try {
    console.log('📝 更新供应商:', req.params.id, req.body);
    const data = await supplierManagementService.update(req.params.id, req.body);

    res.json({
      code: 200,
      data,
      message: '更新成功',
    });
  } catch (error) {
    console.error('更新供应商失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '更新失败',
    });
  }
});

/**
 * 删除供应商
 * DELETE /api/supplier-management/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ 删除供应商:', req.params.id);
    await supplierManagementService.deleteById(req.params.id);

    res.json({
      code: 200,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除供应商失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '删除失败',
    });
  }
});

/**
 * 批量删除供应商
 * POST /api/supplier-management/batch-delete
 */
router.post('/batch-delete', async (req, res) => {
  try {
    console.log('🗑️ 批量删除供应商:', req.body.ids);
    const data = await supplierManagementService.batchDelete(req.body.ids);

    res.json({
      code: 200,
      data,
      message: '批量删除成功',
    });
  } catch (error) {
    console.error('批量删除供应商失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '批量删除失败',
    });
  }
});

/**
 * 获取统计数据
 * GET /api/supplier-management/statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    console.log('📊 获取供应商统计数据');
    const data = await supplierManagementService.getStatistics();

    res.json({
      code: 200,
      data,
      message: '获取成功',
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
    });
  }
});

/**
 * 导出供应商数据
 * GET /api/supplier-management/export
 */
router.get('/export', async (req, res) => {
  try {
    console.log('📤 导出供应商数据');
    // TODO: 实现Excel导出逻辑
    res.status(501).json({
      code: 501,
      message: '导出功能待实现',
    });
  } catch (error) {
    console.error('导出供应商数据失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '导出失败',
    });
  }
});

/**
 * 导入供应商数据
 * POST /api/supplier-management/import
 */
router.post('/import', async (req, res) => {
  try {
    console.log('📥 导入供应商数据');
    // TODO: 实现Excel导入逻辑
    res.status(501).json({
      code: 501,
      message: '导入功能待实现',
    });
  } catch (error) {
    console.error('导入供应商数据失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '导入失败',
    });
  }
});

module.exports = router;
