const express = require('express');
const router = express.Router();
const ProcessPlanService = require('../services/processPlanService');

/**
 * 获取工序计划列表(分页)
 * GET /api/process-plans
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      planNo, 
      masterPlanNo, 
      processName,
      scheduleDateStart,
      scheduleDateEnd
    } = req.query;
    
    console.log('📋 查询工序计划列表, 参数:', { page, pageSize, planNo, masterPlanNo, processName });
    
    const result = await ProcessPlanService.getAll({
      page,
      pageSize,
      planNo,
      masterPlanNo,
      processName,
      scheduleDateStart,
      scheduleDateEnd
    });
    
    console.log('🔍 服务返回结果:');
    console.log('- result类型:', typeof result);
    console.log('- records数量:', result.records?.length);
    if (result.records && result.records.length > 0) {
      console.log('- 首条记录字段:', Object.keys(result.records[0]));
      console.log('- planNo值:', result.records[0].planNo);
      console.log('- processName值:', result.records[0].processName);
    }
    
    res.json({
      code: 200,
      data: result,
      message: '查询成功'
    });
  } catch (error) {
    console.error('❌ 查询工序计划列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '查询失败: ' + error.message
    });
  }
});

/**
 * 根据ID获取工序计划详情
 * GET /api/process-plans/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📄 查询工序计划详情, ID:', id);
    
    const plan = await ProcessPlanService.getById(id);
    
    if (!plan) {
      return res.status(404).json({
        code: 404,
        message: '工序计划不存在'
      });
    }
    
    res.json({
      code: 200,
      data: plan,
      message: '查询成功'
    });
  } catch (error) {
    console.error('❌ 查询工序计划详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '查询失败: ' + error.message
    });
  }
});

/**
 * 创建工序计划
 * POST /api/process-plans
 */
router.post('/', async (req, res) => {
  try {
    const planData = req.body;
    console.log('➕ 创建工序计划:', planData.planNo);
    
    // 生成计划编号
    if (!planData.planNo) {
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      planData.planNo = `PP${year}${timestamp}${random}`;
    }
    
    const result = await ProcessPlanService.create(planData);
    
    res.status(201).json({
      code: 201,
      data: result,
      message: '创建成功'
    });
  } catch (error) {
    console.error('❌ 创建工序计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建失败: ' + error.message
    });
  }
});

/**
 * 更新工序计划
 * PUT /api/process-plans/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const planData = req.body;
    console.log('✏️ 更新工序计划, ID:', id);
    
    const result = await ProcessPlanService.update(id, planData);
    
    res.json({
      code: 200,
      data: result,
      message: '更新成功'
    });
  } catch (error) {
    console.error('❌ 更新工序计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新失败: ' + error.message
    });
  }
});

/**
 * 删除工序计划
 * DELETE /api/process-plans/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ 删除工序计划, ID:', id);
    
    await ProcessPlanService.delete(id);
    
    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('❌ 删除工序计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除失败: ' + error.message
    });
  }
});

/**
 * 批量删除工序计划
 * POST /api/process-plans/batch-delete
 */
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    console.log('🗑️ 批量删除工序计划, IDs:', ids);
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供要删除的ID列表'
      });
    }
    
    const result = await ProcessPlanService.batchDelete(ids);
    
    res.json({
      code: 200,
      data: result,
      message: `批量删除成功: ${result.successCount}/${result.totalCount}`
    });
  } catch (error) {
    console.error('❌ 批量删除工序计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '批量删除失败: ' + error.message
    });
  }
});

// 修复定时工额接口
router.post('/fix-standard-work-quota', async (req, res) => {
  try {
    const { fixProcessPlanStandardWorkQuota } = require('../scripts/fixProcessPlanStandardWorkQuota');
    
    console.log('🔧 收到修复定时工额请求...');
    const result = await fixProcessPlanStandardWorkQuota();
    
    res.json({
      code: 200,
      data: result,
      message: '定时工额修复完成'
    });
  } catch (error) {
    console.error('❌ 修复定时工额失败:', error);
    res.status(500).json({
      code: 500,
      message: '修复定时工额失败: ' + error.message
    });
  }
});

module.exports = router;
