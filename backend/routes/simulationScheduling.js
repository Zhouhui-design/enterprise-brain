/**
 * 模拟排程列表路由
 * 处理模拟排程相关的HTTP请求
 */

'use strict';

const express = require('express');
const router = express.Router();
const simulationSchedulingService = require('../services/simulationSchedulingService');

/**
 * 获取模拟排程列表
 * GET /api/simulation-scheduling
 * 查询参数: page, pageSize, search, simulationStatus, productCode, internalSalesOrderNo
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 收到获取模拟排程列表请求:', req.query);

    const result = await simulationSchedulingService.getSimulationSchedulingList(req.query);

    console.log('✅ 获取模拟排程列表成功，记录数:', result.data?.list?.length || 0);
    console.log('📊 返回结果结构:', JSON.stringify(result, null, 2));
    
    res.json(result);
  } catch (error) {
    console.error('❌ 获取模拟排程列表失败:', error.message);
    console.error('🔍 错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: '获取模拟排程列表失败',
      error: error.message
    });
  }
});

/**
 * 根据ID获取模拟排程详情
 * GET /api/simulation-scheduling/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📋 收到获取模拟排程详情请求，ID:', id);

    const result = await simulationSchedulingService.getSimulationSchedulingById(id);

    console.log('✅ 获取模拟排程详情成功');
    
    res.json(result);
  } catch (error) {
    console.error('❌ 获取模拟排程详情失败:', error.message);
    const statusCode = error.message.includes('不存在') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || '获取模拟排程详情失败',
      error: error.message
    });
  }
});

/**
 * 创建模拟排程记录
 * POST /api/simulation-scheduling
 */
router.post('/', async (req, res) => {
  try {
    console.log('📝 收到创建模拟排程请求:', req.body);

    const result = await simulationSchedulingService.createSimulationScheduling(req.body);

    console.log('✅ 创建模拟排程成功，ID:', result.data.id);

    res.status(201).json(result);
  } catch (error) {
    console.error('❌ 创建模拟排程失败:', error.message);
    res.status(500).json({
      success: false,
      message: '创建模拟排程失败',
      error: error.message
    });
  }
});

/**
 * 更新模拟排程记录
 * PUT /api/simulation-scheduling/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📝 收到更新模拟排程请求，ID:', id, '数据:', req.body);

    const result = await simulationSchedulingService.updateSimulationScheduling(id, req.body);

    console.log('✅ 更新模拟排程成功，ID:', id);

    res.json(result);
  } catch (error) {
    console.error('❌ 更新模拟排程失败:', error.message);
    const statusCode = error.message.includes('不存在') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || '更新模拟排程失败',
      error: error.message
    });
  }
});

/**
 * 删除模拟排程记录
 * DELETE /api/simulation-scheduling/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ 收到删除模拟排程请求，ID:', id);

    const result = await simulationSchedulingService.deleteSimulationScheduling(id);

    console.log('✅ 删除模拟排程成功，ID:', id);

    res.json(result);
  } catch (error) {
    console.error('❌ 删除模拟排程失败:', error.message);
    const statusCode = error.message.includes('不存在') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || '删除模拟排程失败',
      error: error.message
    });
  }
});

/**
 * 批量删除模拟排程记录
 * DELETE /api/simulation-scheduling/batch
 * 请求体: { ids: ["1", "2", "3"] }
 */
router.delete('/batch', async (req, res) => {
  try {
    const { ids } = req.body;
    console.log('🗑️ 收到批量删除模拟排程请求，IDs:', ids);

    const result = await simulationSchedulingService.batchDeleteSimulationScheduling(ids);

    console.log('✅ 批量删除模拟排程成功，删除数量:', result.data.deletedCount);

    res.json(result);
  } catch (error) {
    console.error('❌ 批量删除模拟排程失败:', error.message);
    res.status(500).json({
      success: false,
      message: '批量删除模拟排程失败',
      error: error.message
    });
  }
});

/**
 * 从销售订单推送数据到模拟排程列表
 * POST /api/simulation-scheduling/push-from-sales-orders
 * 请求体: { salesOrderIds: ["id1", "id2", "id3"] }
 */
router.post('/push-from-sales-orders', async (req, res) => {
  try {
    const { salesOrderIds } = req.body;
    console.log('📤 收到从销售订单推送数据请求:', salesOrderIds);

    if (!salesOrderIds || !Array.isArray(salesOrderIds)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的销售订单ID数组'
      });
    }

    const result = await simulationSchedulingService.pushFromSalesOrders(salesOrderIds);

    console.log('✅ 从销售订单推送数据成功，推送数量:', result.data.pushedCount);

    res.json(result);
  } catch (error) {
    console.error('❌ 从销售订单推送数据失败:', error.message);
    const statusCode = error.message.includes('已存在') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || '从销售订单推送数据失败',
      error: error.message
    });
  }
});

/**
 * 获取模拟排程统计信息
 * GET /api/simulation-scheduling/stats
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 收到获取模拟排程统计信息请求');

    const result = await simulationSchedulingService.getSimulationSchedulingStats();

    console.log('✅ 获取模拟排程统计信息成功');

    res.json(result);
  } catch (error) {
    console.error('❌ 获取模拟排程统计信息失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取模拟排程统计信息失败',
      error: error.message
    });
  }
});

module.exports = router;