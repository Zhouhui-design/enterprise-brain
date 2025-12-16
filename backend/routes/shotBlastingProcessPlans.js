const express = require('express');
const router = express.Router();
const shotBlastingProcessPlanService = require('../services/shotBlastingProcessPlanService');

// 获取抛丸工序计划列表(分页+搜索)
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

    const result = await shotBlastingProcessPlanService.getAll({
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
    console.error('获取抛丸工序计划列表失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 根据ID获取抛丸工序计划
router.get('/:id', async (req, res) => {
  try {
    const plan = await shotBlastingProcessPlanService.getById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({
        code: 404,
        message: '抛丸工序计划不存在'
      });
    }

    res.json({
      code: 200,
      data: plan,
      message: '查询成功'
    });
  } catch (error) {
    console.error('获取抛丸工序计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 创建抛丸工序计划
router.post('/', async (req, res) => {
  try {
    const id = await shotBlastingProcessPlanService.create(req.body);
    
    res.json({
      code: 200,
      data: { id },
      message: '创建成功'
    });
  } catch (error) {
    console.error('创建抛丸工序计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 更新抛丸工序计划
router.put('/:id', async (req, res) => {
  try {
    await shotBlastingProcessPlanService.update(req.params.id, req.body);
    
    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新抛丸工序计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 删除抛丸工序计划
router.delete('/:id', async (req, res) => {
  try {
    await shotBlastingProcessPlanService.deleteById(req.params.id);
    
    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除抛丸工序计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 批量删除抛丸工序计划
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供要删除的ID数组'
      });
    }

    await shotBlastingProcessPlanService.batchDelete(ids);
    
    res.json({
      code: 200,
      message: `成功删除${ids.length}条记录`
    });
  } catch (error) {
    console.error('批量删除抛丸工序计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

module.exports = router;
