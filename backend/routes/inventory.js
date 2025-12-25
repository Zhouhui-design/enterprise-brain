/**
 * 库存管理路由
 */
const express = require('express');
const router = express.Router();
const inventoryService = require('../services/inventoryService');

// 调试日志
router.use((req, res, next) => {
  console.log(`[Inventory Router Debug] ${req.method} ${req.path}`);
  next();
});

/**
 * 清空库存列表
 * DELETE /api/inventory/clear-all
 */
router.delete('/clear-all', async (req, res) => {
  try {
    console.log('=== 清空库存列表 ===', req.query);
    const { warehouse_code } = req.query;
    await inventoryService.clearInventory(warehouse_code);

    res.json({
      code: 200,
      success: true,
      message: '清空库存成功',
    });
  } catch (error) {
    console.error('❌ 清空库存列表失败:', error);
    res.status(500).json({
      code: 500,
      success: false,
      message: `清空失败: ${error.message}`,
    });
  }
});

/**
 * 获取库存列表
 * GET /api/inventory
 */
router.get('/', async (req, res) => {
  try {
    console.log('=== 获取库存列表 ===', req.query);
    const result = await inventoryService.getInventoryList(req.query);

    res.json({
      code: 200,
      success: true,
      data: result,
      message: '获取成功',
    });
  } catch (error) {
    console.error('❌ 获取库存列表失败:', error);
    res.status(500).json({
      code: 500,
      success: false,
      message: `获取失败: ${error.message}`,
    });
  }
});

/**
 * 创建库存记录
 * POST /api/inventory
 */
router.post('/', async (req, res) => {
  try {
    console.log('=== 创建库存记录 ===', req.body);

    const insertId = await inventoryService.createInventory(req.body);

    res.json({
      code: 200,
      success: true,
      data: { id: insertId },
      message: '创建成功',
    });
  } catch (error) {
    console.error('❌ 创建库存记录失败:', error);
    res.status(500).json({
      code: 500,
      success: false,
      message: `创建失败: ${error.message}`,
    });
  }
});

/**
 * 批量删除库存记录
 * POST /api/inventory/batch-delete
 */
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    console.log('=== 批量删除库存记录 ===', ids);

    if (!ids || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        success: false,
        message: '请提供要删除的ID列表',
      });
    }

    await inventoryService.batchDelete(ids);

    res.json({
      code: 200,
      success: true,
      message: `成功删除 ${ids.length} 条记录`,
    });
  } catch (error) {
    console.error('❌ 批量删除失败:', error);
    res.status(500).json({
      code: 500,
      success: false,
      message: `批量删除失败: ${error.message}`,
    });
  }
});

/**
 * 获取库存明细（流水记录）
 * GET /api/inventory/details/list
 */
router.get('/details/list', async (req, res) => {
  try {
    console.log('=== 获取库存明细 ===', req.query);
    const result = await inventoryService.getInventoryDetails(req.query);

    res.json({
      code: 200,
      success: true,
      data: result,
      message: '获取成功',
    });
  } catch (error) {
    console.error('❌ 获取库存明细失败:', error);
    res.status(500).json({
      code: 500,
      success: false,
      message: `获取失败: ${error.message}`,
    });
  }
});

/**
 * 获取库存报表
 * GET /api/inventory/report/summary
 */
router.get('/report/summary', async (req, res) => {
  try {
    console.log('=== 获取库存报表 ===', req.query);
    const result = await inventoryService.getInventoryReport(req.query);

    res.json({
      code: 200,
      success: true,
      data: result,
      message: '获取成功',
    });
  } catch (error) {
    console.error('❌ 获取库存报表失败:', error);
    res.status(500).json({
      code: 500,
      success: false,
      message: `获取失败: ${error.message}`,
    });
  }
});

/**
 * 库存入库
 * POST /api/inventory/in
 */
router.post('/in', async (req, res) => {
  try {
    console.log('=== 库存入库 ===', req.body);
    const result = await inventoryService.inventoryIn(req.body);

    res.json({
      code: 200,
      success: true,
      data: result,
      message: '入库成功',
    });
  } catch (error) {
    console.error('❌ 库存入库失败:', error);
    res.status(500).json({
      code: 500,
      success: false,
      message: `入库失败: ${error.message}`,
    });
  }
});

/**
 * 库存出库
 * POST /api/inventory/out
 */
router.post('/out', async (req, res) => {
  try {
    console.log('=== 库存出库 ===', req.body);
    const result = await inventoryService.inventoryOut(req.body);

    res.json({
      code: 200,
      success: true,
      data: result,
      message: '出库成功',
    });
  } catch (error) {
    console.error('❌ 库存出库失败:', error);
    res.status(500).json({
      code: 500,
      success: false,
      message: `出库失败: ${error.message}`,
    });
  }
});

/**
 * 导出库存数据
 * GET /api/inventory/export
 */
router.get('/export', async (req, res) => {
  try {
    console.log('=== 导出库存数据 ===', req.query);
    const data = await inventoryService.exportInventory(req.query);

    res.json({
      code: 200,
      success: true,
      data: data,
      message: '导出成功',
    });
  } catch (error) {
    console.error('❌ 导出库存数据失败:', error);
    res.status(500).json({
      code: 500,
      success: false,
      message: `导出失败: ${error.message}`,
    });
  }
});

/**
 * 导入库存数据
 * POST /api/inventory/import
 */
router.post('/import', async (req, res) => {
  try {
    console.log('=== 导入库存数据 ===', req.body);
    const result = await inventoryService.importInventory(req.body);

    res.json({
      code: 200,
      success: true,
      data: result,
      message: `导入完成，成功 ${result.successCount} 条，失败 ${result.errorCount} 条`,
    });
  } catch (error) {
    console.error('❌ 导入库存数据失败:', error);
    res.status(500).json({
      code: 500,
      success: false,
      message: `导入失败: ${error.message}`,
    });
  }
});

/**
 * 获取库存详情
 * GET /api/inventory/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== 获取库存详情 ===', id);

    // 检查ID是否为数字
    if (isNaN(id)) {
      return res.status(400).json({
        code: 400,
        success: false,
        message: 'ID必须是数字',
      });
    }

    const inventory = await inventoryService.getInventoryById(id);

    if (!inventory) {
      return res.status(404).json({
        code: 404,
        success: false,
        message: '库存记录不存在',
      });
    }

    res.json({
      code: 200,
      success: true,
      data: inventory,
      message: '获取成功',
    });
  } catch (error) {
    console.error('❌ 获取库存详情失败:', error);
    res.status(500).json({
      code: 500,
      success: false,
      message: `获取失败: ${error.message}`,
    });
  }
});

/**
 * 更新库存记录
 * PUT /api/inventory/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== 更新库存记录 ===', id, req.body);

    // 检查ID是否为数字
    if (isNaN(id)) {
      return res.status(400).json({
        code: 400,
        success: false,
        message: 'ID必须是数字',
      });
    }

    await inventoryService.updateInventory(id, req.body);

    res.json({
      code: 200,
      success: true,
      message: '更新成功',
    });
  } catch (error) {
    console.error('❌ 更新库存记录失败:', error);
    res.status(500).json({
      code: 500,
      success: false,
      message: `更新失败: ${error.message}`,
    });
  }
});

/**
 * 删除库存记录
 * DELETE /api/inventory/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== 删除库存记录 ===', id, typeof id);

    // 检查ID是否为数字
    if (isNaN(id)) {
      return res.status(400).json({
        code: 400,
        success: false,
        message: 'ID必须是数字',
      });
    }

    await inventoryService.deleteInventory(id);

    res.json({
      code: 200,
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('❌ 删除库存记录失败:', error);
    res.status(500).json({
      code: 500,
      success: false,
      message: `删除失败: ${error.message}`,
    });
  }
});

module.exports = router;
