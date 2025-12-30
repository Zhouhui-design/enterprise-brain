/**
 * 模拟物料需求明细路由
 * 处理模拟物料需求明细相关的HTTP请求
 */

'use strict';

const express = require('express');
const router = express.Router();
const simulationMaterialRequirementService = require('../services/simulationMaterialRequirementService');

/**
 * 获取模拟物料需求明细列表
 * GET /api/simulation-material-requirements
 * 查询参数: page, pageSize, search, internalSalesOrderNo, productCode, currentMaterialCode
 */
router.get('/', async (req, res) => {
  try {
    console.log('?? 收到获取模拟物料需求明细列表请求:', req.query);

    const result = await simulationMaterialRequirementService.getMaterialRequirementList(req.query);

    console.log('✅ 获取模拟物料需求明细列表成功，记录数:', result.data?.list?.length || 0);
    console.log('📊 是否有模拟排程数据:', result.data?.hasSimulationData);
    
    res.json(result);
  } catch (error) {
    console.error('❌ 获取模拟物料需求明细列表失败:', error.message);
    console.error('🔍 错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: '获取模拟物料需求明细列表失败',
      error: error.message
    });
  }
});

/**
 * 手动刷新物料需求计算
 * POST /api/simulation-material-requirements/refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 收到刷新物料需求计算请求');

    const result = await simulationMaterialRequirementService.refreshMaterialRequirements();

    console.log('✅ 刷新物料需求计算成功，计算数量:', result.data?.calculatedCount || 0);
    
    res.json(result);
  } catch (error) {
    console.error('❌ 刷新物料需求计算失败:', error.message);
    console.error('🔍 错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: '刷新物料需求计算失败',
      error: error.message
    });
  }
});

/**
 * 处理模拟排程更新事件
 * POST /api/simulation-material-requirements/handle-update
 * 请求体: { simulationIds: ["id1", "id2", "id3"] }
 */
router.post('/handle-update', async (req, res) => {
  try {
    const { simulationIds } = req.body;
    console.log('📤 收到处理模拟排程更新请求:', simulationIds);

    if (!simulationIds || !Array.isArray(simulationIds)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的模拟排程ID数组'
      });
    }

    const result = await simulationMaterialRequirementService.handleSimulationSchedulingUpdate(simulationIds);

    console.log('✅ 处理模拟排程更新成功，计算数量:', result.data?.calculatedCount || 0);
    
    // 触发前端更新事件
    if (result.data?.calculatedCount > 0) {
      console.log('📤 触发物料需求明细更新事件');
      // 这里可以通过WebSocket或其他机制通知前端
    }
    
    res.json(result);
  } catch (error) {
    console.error('❌ 处理模拟排程更新失败:', error.message);
    console.error('🔍 错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: '处理模拟排程更新失败',
      error: error.message
    });
  }
});

/**
 * 计算指定模拟排程的物料需求
 * POST /api/simulation-material-requirements/calculate
 * 请求体: { simulationIds: ["id1", "id2", "id3"] }
 */
router.post('/calculate', async (req, res) => {
  try {
    const { simulationIds } = req.body;
    console.log('📊 收到计算物料需求请求:', simulationIds);

    if (!simulationIds || !Array.isArray(simulationIds)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的模拟排程ID数组'
      });
    }

    const result = await simulationMaterialRequirementService.calculateMaterialRequirements(simulationIds);

    console.log('✅ 计算物料需求成功，计算数量:', result.data?.calculatedCount || 0);
    
    res.json(result);
  } catch (error) {
    console.error('❌ 计算物料需求失败:', error.message);
    console.error('🔍 错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: '计算物料需求失败',
      error: error.message
    });
  }
});

/**
 * 获取物料需求统计信息
 * GET /api/simulation-material-requirements/stats
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 收到获取物料需求统计信息请求');

    // 这里可以实现统计功能，比如：
    // - 总需求数量
    // - 不同状态的需求数量
    // - 采购需求数量
    // - 库存不足数量等
    
    const stats = await getMaterialRequirementStats();

    console.log('✅ 获取物料需求统计信息成功');

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ 获取物料需求统计信息失败:', error.message);
    console.error('🔍 错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: '获取物料需求统计信息失败',
      error: error.message
    });
  }
});

/**
 * 获取物料需求统计信息
 * @returns {Promise<Object>} 统计信息
 */
const getMaterialRequirementStats = async () => {
  try {
    const { query } = require('../config/database');
    
    const [stats] = await query(`
      SELECT 
        COUNT(*) as totalRequirements,
        COUNT(CASE WHEN current_process = '采购' THEN 1 END) as purchaseRequirements,
        COUNT(CASE WHEN still_needed_qty > 0 THEN 1 END) as stillNeededCount,
        COUNT(CASE WHEN still_needed_qty <= 0 THEN 1 END) as sufficientCount,
        SUM(current_required_qty) as totalRequiredQty,
        SUM(still_needed_qty) as totalStillNeededQty,
        SUM(available_inventory) as totalAvailableInventory,
        AVG(requirement_days) as avgRequirementDays
      FROM simulation_material_requirements
      WHERE level_address != '9999999'
    `);

    return {
      totalRequirements: stats[0]?.totalRequirements || 0,
      purchaseRequirements: stats[0]?.purchaseRequirements || 0,
      stillNeededCount: stats[0]?.stillNeededCount || 0,
      sufficientCount: stats[0]?.sufficientCount || 0,
      totalRequiredQty: stats[0]?.totalRequiredQty || 0,
      totalStillNeededQty: stats[0]?.totalStillNeededQty || 0,
      totalAvailableInventory: stats[0]?.totalAvailableInventory || 0,
      avgRequirementDays: stats[0]?.avgRequirementDays || 0
    };
  } catch (error) {
    console.error('获取统计信息失败:', error);
    return {
      totalRequirements: 0,
      purchaseRequirements: 0,
      stillNeededCount: 0,
      sufficientCount: 0,
      totalRequiredQty: 0,
      totalStillNeededQty: 0,
      totalAvailableInventory: 0,
      avgRequirementDays: 0
    };
  }
};

module.exports = router;