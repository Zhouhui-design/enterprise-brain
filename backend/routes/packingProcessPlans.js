const express = require('express');
const router = express.Router();
const packingProcessPlanService = require('../services/packingProcessPlanService');
const customJsonStringify = require('../utils/custom-json-stringify');

// 获取打包工序计划列表(分页+搜索)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 50,
      planNo,
      sourcePlanNo,
      materialCode,
      scheduleDateStart,
      scheduleDateEnd,
    } = req.query;

    const result = await packingProcessPlanService.getAll({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      planNo,
      sourcePlanNo,
      materialCode,
      scheduleDateStart,
      scheduleDateEnd,
    });

    const response = {
      code: 200,
      data: {
        records: result.records,
        total: result.total,
      },
      message: '查询成功',
    };
    res.setHeader('Content-Type', 'application/json');
    res.send(customJsonStringify(response));
  } catch (error) {
    console.error('获取打包工序计划列表失败:', error);
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(
      customJsonStringify({
        code: 500,
        message: error.message,
      }),
    );
  }
});

// 根据ID获取打包工序计划
router.get('/:id', async (req, res) => {
  try {
    const plan = await packingProcessPlanService.getById(req.params.id);

    if (!plan) {
      res.status(404);
      res.setHeader('Content-Type', 'application/json');
      return res.send(
        customJsonStringify({
          code: 404,
          message: '打包工序计划不存在',
        }),
      );
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(
      customJsonStringify({
        code: 200,
        data: plan,
        message: '查询成功',
      }),
    );
  } catch (error) {
    console.error('获取打包工序计划失败:', error);
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(
      customJsonStringify({
        code: 500,
        message: error.message,
      }),
    );
  }
});

// 创建打包工序计划
router.post('/', async (req, res) => {
  try {
    const id = await packingProcessPlanService.create(req.body);

    res.setHeader('Content-Type', 'application/json');
    res.send(
      customJsonStringify({
        code: 200,
        data: { id },
        message: '创建成功',
      }),
    );
  } catch (error) {
    console.error('创建打包工序计划失败:', error);
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(
      customJsonStringify({
        code: 500,
        message: error.message,
      }),
    );
  }
});

// 更新打包工序计划
router.put('/:id', async (req, res) => {
  try {
    await packingProcessPlanService.update(req.params.id, req.body);

    res.setHeader('Content-Type', 'application/json');
    res.send(
      customJsonStringify({
        code: 200,
        message: '更新成功',
      }),
    );
  } catch (error) {
    console.error('更新打包工序计划失败:', error);
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(
      customJsonStringify({
        code: 500,
        message: error.message,
      }),
    );
  }
});

// 删除打包工序计划
router.delete('/:id', async (req, res) => {
  try {
    await packingProcessPlanService.delete(req.params.id);

    res.setHeader('Content-Type', 'application/json');
    res.send(
      customJsonStringify({
        code: 200,
        message: '删除成功',
      }),
    );
  } catch (error) {
    console.error('删除打包工序计划失败:', error);
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(
      customJsonStringify({
        code: 500,
        message: error.message,
      }),
    );
  }
});

// 批量删除打包工序计划
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({
        code: 400,
        message: 'ids必须是数组',
      });
    }

    const result = await packingProcessPlanService.batchDelete(ids);

    res.setHeader('Content-Type', 'application/json');
    res.send(
      customJsonStringify({
        code: 200,
        data: result,
        message: '查询成功',
      }),
    );
  } catch (error) {
    console.error('批量删除打包工序计划失败:', error);
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(
      customJsonStringify({
        code: 500,
        message: error.message,
      }),
    );
  }
});

// 查询当天已排程工时
// SUMIFS(计划排程工时, 工序名称=当前工序, 计划排程日期=当前日期, ID<>当前ID)
router.get('/query-daily-scheduled-hours', async (req, res) => {
  try {
    const { processName, scheduleDate, excludeId } = req.query;

    if (!processName || !scheduleDate) {
      return res.status(400).json({
        code: 400,
        message: '工序名称和计划排程日期不能为空',
      });
    }

    const result = await packingProcessPlanService.getDailyScheduledHours({
      processName,
      scheduleDate,
      excludeId,
    });

    res.setHeader('Content-Type', 'application/json');
    res.send(
      customJsonStringify({
        code: 200,
        data: result,
        message: '查询成功',
      }),
    );
  } catch (error) {
    console.error('查询当天已排程工时失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// 修复字段计算
router.post('/fix-field-calculations', async (req, res) => {
  try {
    const result = await packingProcessPlanService.fixFieldCalculations();

    res.json({
      code: 200,
      data: result,
      message: '所有字段计算已修复',
    });
  } catch (error) {
    console.error('修复字段计算失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

module.exports = router;
