const express = require('express');
const router = express.Router();
const MaterialPreparationPlanService = require('../services/materialPreparationPlanService');

// 获取备料计划列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, planNo, sourcePlanNo, materialCode, demandDateStart, demandDateEnd } = req.query;
    
    const result = await MaterialPreparationPlanService.getAll({
      page,
      pageSize,
      planNo,
      sourcePlanNo,
      materialCode,
      demandDateStart,
      demandDateEnd
    });
    
    res.json(result);
  } catch (error) {
    console.error('获取备料计划列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取备料计划列表失败',
      error: error.message
    });
  }
});

// 获取单个备料计划
router.get('/:id', async (req, res) => {
  try {
    const plan = await MaterialPreparationPlanService.getById(req.params.id);
    if (plan) {
      res.json(plan);
    } else {
      res.status(404).json({ message: '备料计划不存在' });
    }
  } catch (error) {
    console.error('获取备料计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取备料计划失败',
      error: error.message
    });
  }
});

// 创建备料计划
router.post('/', async (req, res) => {
  try {
    const newPlan = await MaterialPreparationPlanService.create(req.body);
    res.status(201).json(newPlan);
  } catch (error) {
    console.error('创建备料计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建备料计划失败',
      error: error.message
    });
  }
});

// 更新备料计划
router.put('/:id', async (req, res) => {
  try {
    const updatedPlan = await MaterialPreparationPlanService.update(req.params.id, req.body);
    res.json(updatedPlan);
  } catch (error) {
    console.error('更新备料计划失败:', error);
    if (error.message === '备料计划不存在') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({
        code: 500,
        message: '更新备料计划失败',
        error: error.message
      });
    }
  }
});

// 删除备料计划
router.delete('/:id', async (req, res) => {
  try {
    const deletedPlan = await MaterialPreparationPlanService.delete(req.params.id);
    res.json(deletedPlan);
  } catch (error) {
    console.error('删除备料计划失败:', error);
    if (error.message === '备料计划不存在') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({
        code: 500,
        message: '删除备料计划失败',
        error: error.message
      });
    }
  }
});

// 批量删除备料计划
router.delete('/batch/delete', async (req, res) => {
  try {
    const { ids } = req.body;
    const deletedPlans = await MaterialPreparationPlanService.batchDelete(ids);
    res.json(deletedPlans);
  } catch (error) {
    console.error('批量删除备料计划失败:', error);
    if (error.message === 'ids必须是数组') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({
        code: 500,
        message: '批量删除备料计划失败',
        error: error.message
      });
    }
  }
});

// 推送到工序计划
router.post('/:id/push-to-process', async (req, res) => {
  try {
    const result = await MaterialPreparationPlanService.pushToProcessPlan(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('推送到工序计划失败:', error);
    if (error.message === '备料计划不存在') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({
        code: 500,
        message: '推送到工序计划失败',
        error: error.message
      });
    }
  }
});

// 自动生成备料计划（根据用户需求）
router.post('/auto-generate', async (req, res) => {
  try {
    const { materialCode, materialName, demandQuantity, sourceProcess } = req.body;
    const result = await MaterialPreparationPlanService.autoGenerateMaterialPreparationPlan({
      materialCode,
      materialName,
      demandQuantity,
      sourceProcess
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('自动生成备料计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '自动生成备料计划失败',
      error: error.message
    });
  }
});

module.exports = router;