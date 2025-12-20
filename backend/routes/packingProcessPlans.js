const express = require('express');
const router = express.Router();
const packingProcessPlanService = require('../services/packingProcessPlanService');

// 获取打包工序计划列表(分页+搜索)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 50,
      planNo,
      masterPlanNo,
      processName,
      scheduleDateStart,
      scheduleDateEnd
    } = req.query;

    const result = await packingProcessPlanService.getAll({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      planNo,
      masterPlanNo,
      processName,
      scheduleDateStart,
      scheduleDateEnd
    });

    res.json({
      code: 200,
      data: result,
      message: '查询成功'
    });
  } catch (error) {
    console.error('获取打包工序计划列表失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// ✅ 查询当天已排程工时
router.get('/query-daily-scheduled-hours', async (req, res) => {
  try {
    const { processName, scheduleDate, excludeId } = req.query;
    
    if (!processName || !scheduleDate) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：processName 和 scheduleDate'
      });
    }

    const result = await packingProcessPlanService.queryDailyScheduledHours({
      processName,
      scheduleDate,
      excludeId: excludeId ? parseInt(excludeId) : null
    });

    res.json({
      code: 200,
      data: result,
      message: '查询成功'
    });
  } catch (error) {
    console.error('查询当天已排程工时失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// ✅ 修复字段计算
router.post('/fix-field-calculations', async (req, res) => {
  try {
    const result = await packingProcessPlanService.fixFieldCalculations();
    
    res.json({
      code: 200,
      data: result,
      message: '字段计算修复成功'
    });
  } catch (error) {
    console.error('修复字段计算失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 根据ID获取打包工序计划
router.get('/:id', async (req, res) => {
  try {
    const plan = await packingProcessPlanService.getById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({
        code: 404,
        message: '打包工序计划不存在'
      });
    }

    res.json({
      code: 200,
      data: plan,
      message: '查询成功'
    });
  } catch (error) {
    console.error('获取打包工序计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 创建打包工序计划
router.post('/', async (req, res) => {
  try {
    const id = await packingProcessPlanService.create(req.body);
    
    res.json({
      code: 200,
      data: { id },
      message: '创建成功'
    });
  } catch (error) {
    console.error('创建打包工序计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 更新打包工序计划
router.put('/:id', async (req, res) => {
  try {
    await packingProcessPlanService.update(req.params.id, req.body);
    
    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新打包工序计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 删除打包工序计划
router.delete('/:id', async (req, res) => {
  try {
    await packingProcessPlanService.deleteById(req.params.id);
    
    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除打包工序计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 批量删除打包工序计划
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供要删除的ID数组'
      });
    }

    await packingProcessPlanService.batchDelete(ids);
    
    res.json({
      code: 200,
      message: `成功删除${ids.length}条记录`
    });
  } catch (error) {
    console.error('批量删除打包工序计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

module.exports = router;