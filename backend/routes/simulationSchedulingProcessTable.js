const express = require('express');
const simulationSchedulingService = require('../services/simulationSchedulingService');

const router = express.Router();

/**
 * 接收模拟物料需求数据并触发业务规则
 * POST /api/simulation-scheduling-process/receive
 */
router.post('/receive', async (req, res) => {
  try {
    const { materialRequirements } = req.body;
    
    if (!materialRequirements || !Array.isArray(materialRequirements)) {
      return res.status(400).json({
        success: false,
        message: '参数错误：materialRequirements必须是数组'
      });
    }
    
    const result = await simulationSchedulingService.receiveMaterialRequirements(materialRequirements);
    
    res.json({
      success: true,
      message: '模拟物料需求数据处理完成',
      data: result
    });
    
  } catch (error) {
    console.error('❌ 接收模拟物料需求数据API错误:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 获取模拟排程工序表列表（分页）
 * GET /api/simulation-scheduling-process/list
 */
router.get('/list', async (req, res) => {
  try {
    const queryParams = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 50,
      internal_sales_order_no: req.query.internal_sales_order_no,
      product_code: req.query.product_code,
      current_process: req.query.current_process,
      effective_planned_date_start: req.query.effective_planned_date_start,
      effective_planned_date_end: req.query.effective_planned_date_end,
      continue_scheduling: req.query.continue_scheduling !== undefined ? parseInt(req.query.continue_scheduling) : undefined
    };
    
    const result = await simulationSchedulingService.getSimulationSchedulingList(queryParams);
    
    res.json({
      success: true,
      message: '获取模拟排程工序表列表成功',
      data: result.data,
      pagination: result.pagination
    });
    
  } catch (error) {
    console.error('❌ 获取模拟排程工序表列表API错误:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 根据ID获取模拟排程工序详情
 * GET /api/simulation-scheduling-process/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '参数错误：缺少ID'
      });
    }
    
    const result = await simulationSchedulingService.getSimulationSchedulingById(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      });
    }
    
    res.json({
      success: true,
      message: '获取模拟排程工序详情成功',
      data: result
    });
    
  } catch (error) {
    console.error('❌ 获取模拟排程工序详情API错误:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 更新模拟排程工序记录
 * PUT /api/simulation-scheduling-process/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '参数错误：缺少ID'
      });
    }
    
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: '参数错误：缺少更新数据'
      });
    }
    
    const result = await simulationSchedulingService.updateSimulationScheduling(id, updateData);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: '记录不存在或更新失败'
      });
    }
    
    res.json({
      success: true,
      message: '更新模拟排程工序记录成功'
    });
    
  } catch (error) {
    console.error('❌ 更新模拟排程工序记录API错误:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 删除模拟排程工序记录
 * DELETE /api/simulation-scheduling-process/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '参数错误：缺少ID'
      });
    }
    
    const result = await simulationSchedulingService.deleteSimulationScheduling(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: '记录不存在或删除失败'
      });
    }
    
    res.json({
      success: true,
      message: '删除模拟排程工序记录成功'
    });
    
  } catch (error) {
    console.error('❌ 删除模拟排程工序记录API错误:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 批量删除模拟排程工序记录
 * DELETE /api/simulation-scheduling-process/batch
 */
router.delete('/batch', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '参数错误：ids必须是非空数组'
      });
    }
    
    const deletedCount = await simulationSchedulingService.batchDeleteSimulationScheduling(ids);
    
    res.json({
      success: true,
      message: `批量删除${deletedCount}条记录成功`,
      data: { deletedCount }
    });
    
  } catch (error) {
    console.error('❌ 批量删除模拟排程工序记录API错误:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 导出模拟排程工序数据
 * GET /api/simulation-scheduling-process/export
 */
router.get('/export', async (req, res) => {
  try {
    const queryParams = {
      internal_sales_order_no: req.query.internal_sales_order_no,
      product_code: req.query.product_code,
      current_process: req.query.current_process,
      effective_planned_date_start: req.query.effective_planned_date_start,
      effective_planned_date_end: req.query.effective_planned_date_end,
      continue_scheduling: req.query.continue_scheduling !== undefined ? parseInt(req.query.continue_scheduling) : undefined
    };
    
    const data = await simulationSchedulingService.exportSimulationSchedulingData(queryParams);
    
    // 设置响应头，告诉浏览器这是一个Excel文件
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=simulation_scheduling_process_export.xlsx');
    
    // 这里应该返回Excel文件，暂时返回JSON数据
    res.json({
      success: true,
      message: '导出数据获取成功',
      data: data
    });
    
  } catch (error) {
    console.error('❌ 导出模拟排程工序数据API错误:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 获取模拟排程工序统计信息
 * GET /api/simulation-scheduling-process/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const result = await simulationSchedulingService.getSimulationSchedulingStats();
    
    res.json({
      success: true,
      message: '获取模拟排程工序统计信息成功',
      data: result
    });
    
  } catch (error) {
    console.error('❌ 获取模拟排程工序统计信息API错误:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 重新计算指定记录
 * POST /api/simulation-scheduling-process/:id/recalculate
 */
router.post('/:id/recalculate', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '参数错误：缺少ID'
      });
    }
    
    const result = await simulationSchedulingService.recalculateSimulationScheduling(id);
    
    res.json({
      success: true,
      message: '重新计算完成',
      data: result
    });
    
  } catch (error) {
    console.error('❌ 重新计算API错误:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 手动触发自增行规则
 * POST /api/simulation-scheduling-process/:id/auto-increment
 */
router.post('/:id/auto-increment', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '参数错误：缺少ID'
      });
    }
    
    const result = await simulationSchedulingService.triggerAutoIncrement(id);
    
    res.json({
      success: true,
      message: '自增行规则执行成功',
      data: result
    });
    
  } catch (error) {
    console.error('❌ 触发自增行规则API错误:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

module.exports = router;
