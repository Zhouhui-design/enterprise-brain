const express = require('express');
const customJsonStringify = require('../utils/custom-json-stringify');
const router = express.Router();
const drillingProcessPlanService = require('../services/drillingProcessPlanService');

// 获取打孔工序计划列表(分页+搜索)
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

    const result = await drillingProcessPlanService.getAll({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      planNo,
      masterPlanNo,
      processName,
      scheduleDateStart,
      scheduleDateEnd
    });

    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify({
      code: 200,
      data: result,
      message: '查询成功'
    }));
  } catch (error) {
    console.error('获取打孔工序计划列表失败:', error);
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify({
      code: 500,
      message: error.message
    }));
  }
});

// 根据ID获取打孔工序计划
router.get('/:id', async (req, res) => {
  try {
    const plan = await drillingProcessPlanService.getById(req.params.id);
    
    if (!plan) {
      return res.status(404);
    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify({
        code: 404,
        message: '打孔工序计划不存在'
      }));
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify({
      code: 200,
      data: plan,
      message: '查询成功'
    }));
  } catch (error) {
    console.error('获取打孔工序计划失败:', error);
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify({
      code: 500,
      message: error.message
    }));
  }
});

// 创建打孔工序计划
router.post('/', async (req, res) => {
  try {
    const id = await drillingProcessPlanService.create(req.body);
    
    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify({
      code: 200,
      data: { id },
      message: '创建成功'
    }));
  } catch (error) {
    console.error('创建打孔工序计划失败:', error);
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify({
      code: 500,
      message: error.message
    }));
  }
});

// 更新打孔工序计划
router.put('/:id', async (req, res) => {
  try {
    await drillingProcessPlanService.update(req.params.id, req.body);
    
    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify({
      code: 200,
      message: '更新成功'
    }));
  } catch (error) {
    console.error('更新打孔工序计划失败:', error);
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify({
      code: 500,
      message: error.message
    }));
  }
});

// 删除打孔工序计划
router.delete('/:id', async (req, res) => {
  try {
    await drillingProcessPlanService.deleteById(req.params.id);
    
    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify({
      code: 200,
      message: '删除成功'
    }));
  } catch (error) {
    console.error('删除打孔工序计划失败:', error);
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify({
      code: 500,
      message: error.message
    }));
  }
});

// 批量删除打孔工序计划
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400);
    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify({
        code: 400,
        message: '请提供要删除的ID数组'
      }));
    }

    await drillingProcessPlanService.batchDelete(ids);
    
    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify({
      code: 200,
      message: `成功删除${ids.length}条记录`
    }));
  } catch (error) {
    console.error('批量删除打孔工序计划失败:', error);
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify({
      code: 500,
      message: error.message
    }));
  }
});

// 触发自增行功能
router.post('/:id/increment', async (req, res) => {
  try {
    const { id } = req.params;
    const frontEndData = req.body; // 前端传递的数据，包括unscheduledQty, remainingRequiredHours, nextScheduleDate1等
    
    console.log(`
🚀 触发打孔工序计划自增行, ID: ${id}`);
    console.log(`📊 前端传递的数据:`, frontEndData);
    
    await drillingProcessPlanService.checkAndCreateIncremental(id, frontEndData);
    
    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify({
      code: 200,
      message: '自增行触发成功'
    }));
  } catch (error) {
    console.error('触发打孔工序计划自增行失败:', error);
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify({
      code: 500,
      message: error.message
    }));
  }
});

module.exports = router;