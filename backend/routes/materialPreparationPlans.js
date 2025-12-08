const express = require('express');
const router = express.Router();
const MaterialPreparationPlanService = require('../services/materialPreparationPlanService');

/**
 * 获取备料计划列表
 * GET /api/material-preparation-plans
 */
router.get('/', async (req, res) => {
  try {
    const result = await MaterialPreparationPlanService.getAll(req.query);
    res.json({
      code: 200,
      data: result,
      message: '获取备料计划列表成功'
    });
  } catch (error) {
    console.error('获取备料计划列表失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

/**
 * 获取单个备料计划
 * GET /api/material-preparation-plans/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await MaterialPreparationPlanService.getById(id);
    
    if (!plan) {
      return res.status(404).json({
        code: 404,
        message: '备料计划不存在'
      });
    }
    
    res.json({
      code: 200,
      data: plan,
      message: '获取备料计划成功'
    });
  } catch (error) {
    console.error('获取备料计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

/**
 * 创建备料计划
 * POST /api/material-preparation-plans
 */
router.post('/', async (req, res) => {
  try {
    console.log('收到创建备料计划请求');
    const result = await MaterialPreparationPlanService.create(req.body);
    res.json({
      code: 200,
      data: result,
      message: '创建备料计划成功'
    });
  } catch (error) {
    console.error('创建备料计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

/**
 * 更新备料计划
 * PUT /api/material-preparation-plans/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`收到更新备料计划请求, ID: ${id}`);
    const result = await MaterialPreparationPlanService.update(id, req.body);
    res.json({
      code: 200,
      data: result,
      message: '更新备料计划成功'
    });
  } catch (error) {
    console.error('更新备料计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

/**
 * 删除备料计划
 * DELETE /api/material-preparation-plans/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('收到删除备料计划请求, ID:', id);
    await MaterialPreparationPlanService.delete(id);
    res.json({
      code: 200,
      message: '删除备料计划成功'
    });
  } catch (error) {
    console.error('删除备料计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

/**
 * 批量删除备料计划
 * DELETE /api/material-preparation-plans/batch
 */
router.delete('/batch/delete', async (req, res) => {
  try {
    const { ids } = req.body;
    console.log('收到批量删除备料计划请求, IDs:', ids);
    const result = await MaterialPreparationPlanService.batchDelete(ids);
    res.json({
      code: 200,
      data: result,
      message: '批量删除备料计划成功'
    });
  } catch (error) {
    console.error('批量删除备料计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

module.exports = router;
