const express = require('express');
const router = express.Router();
const MaterialPreparationPlanService = require('../services/materialPreparationPlanService');

/**
 * 获取备料计划列表
 * GET /api/material-preparation-plans
 */
router.get('/', async (req, res) => {
  try {
    const result = await MaterialPreparationPlanService.getAll(req.query);
    res.json({
      code: 200,
      data: result,
      message: '获取备料计划列表成功'
    });
  } catch (error) {
    console.error('获取备料计划列表失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

/**
 * 获取单个备料计划
 * GET /api/material-preparation-plans/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await MaterialPreparationPlanService.getById(id);
    
    if (!plan) {
      return res.status(404).json({
        code: 404,
        message: '备料计划不存在'
      });
    }
    
    res.json({
      code: 200,
      data: plan,
      message: '获取备料计划成功'
    });
  } catch (error) {
    console.error('获取备料计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

/**
 * 创建备料计划
 * POST /api/material-preparation-plans
 */
router.post('/', async (req, res) => {
  try {
    console.log('收到创建备料计划请求');
    const result = await MaterialPreparationPlanService.create(req.body);
    res.json({
      code: 200,
      data: result,
      message: '创建备料计划成功'
    });
  } catch (error) {
    console.error('创建备料计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

/**
 * 更新备料计划
 * PUT /api/material-preparation-plans/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`收到更新备料计划请求, ID: ${id}`);
    const result = await MaterialPreparationPlanService.update(id, req.body);
    res.json({
      code: 200,
      data: result,
      message: '更新备料计划成功'
    });
  } catch (error) {
    console.error('更新备料计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

/**
 * 删除备料计划
 * DELETE /api/material-preparation-plans/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('收到删除备料计划请求, ID:', id);
    await MaterialPreparationPlanService.delete(id);
    res.json({
      code: 200,
      message: '删除备料计划成功'
    });
  } catch (error) {
    console.error('删除备料计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

/**
 * 批量删除备料计划
 * DELETE /api/material-preparation-plans/batch
 */
router.delete('/batch/delete', async (req, res) => {
  try {
    const { ids } = req.body;
    console.log('收到批量删除备料计划请求, IDs:', ids);
    const result = await MaterialPreparationPlanService.batchDelete(ids);
    res.json({
      code: 200,
      data: result,
      message: '批量删除备料计划成功'
    });
  } catch (error) {
    console.error('批量删除备料计划失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

/**
 * ✅ 推送到工序计划
 * POST /api/material-preparation-plans/:id/push-to-process
 */
router.post('/:id/push-to-process', async (req, res) => {
  const { pool } = require('../config/database');
  let connection;
  
  try {
    const { id } = req.params;
    console.log('📦 开始推送备料计划到工序计划, ID:', id);
    
    connection = await pool.getConnection();
    
    // 1. 查询备料计划详情
    const [planRows] = await connection.execute(`
      SELECT * FROM material_preparation_plans WHERE id = ?
    `, [id]);
    
    if (planRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '备料计划不存在'
      });
    }
    
    const plan = planRows[0];
    
    // 2. ✅ 触发条件校验
    if (!plan.plan_no) {
      return res.status(400).json({
        code: 400,
        message: '备料计划编号为空，不符合推送条件'
      });
    }
    
    if (plan.material_source !== '自制') {
      return res.status(400).json({
        code: 400,
        message: `物料来源为"${plan.material_source}"，非"自制"，不符合推送条件`
      });
    }
    
    // 计算需补货数量 = 需求数量 - 有效库存
    const demandQty = parseFloat(plan.demand_quantity || 0);
    const availableQty = parseFloat(plan.available_stock || 0);
    const replenishmentQty = demandQty - availableQty;
    
    if (replenishmentQty <= 0) {
      return res.status(400).json({
        code: 400,
        message: `需补货数量为 ${replenishmentQty.toFixed(2)}，不符合推送条件（必须>0）`
      });
    }
    
    // 3. 生成工序计划编号
    function generateProcessPlanNo() {
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `PP${year}${timestamp}${random}`;
    }
    
    const processPlanNo = generateProcessPlanNo();
    
    // 4. 计算计划完工日期 = 需求日期 - 1天
    let completionDate = null;
    if (plan.demand_date) {
      const demandDate = new Date(plan.demand_date);
      demandDate.setDate(demandDate.getDate() - 1);
      const year = demandDate.getFullYear();
      const month = String(demandDate.getMonth() + 1).padStart(2, '0');
      const day = String(demandDate.getDate()).padStart(2, '0');
      completionDate = `${year}-${month}-${day}`;
    }
    
    // 5. ✅ 创建工序计划（按照数据流映射规则）
    const [result] = await connection.execute(`
      INSERT INTO process_plans (
        plan_no,
        sales_order_no,
        master_plan_no,
        product_code,
        product_name,
        process_name,
        product_unit,
        level0_demand,
        completion_date,
        replenishment_qty,
        customer_name,
        submitted_by,
        submitted_at,
        created_at,
        updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW()
      )
    `, [
      processPlanNo,                      // 工序计划编号（系统自动生成）
      plan.sales_order_no || null,        // 销售订单编号
      plan.source_plan_no || null,        // 主生产计划编号 = 来源主计划编号
      plan.material_code || null,         // 生产产品编号 = 计划物料编号
      plan.material_name || null,         // 生产产品名称 = 计划物料名称
      plan.source_process || null,        // 工序名称 = 来源工序
      plan.material_unit || null,         // 产品单位 = 物料单位
      plan.main_plan_quantity || 0,       // 0阶需求数量 = 主计划排程数量
      completionDate,                     // 计划完工日期 = 需求日期 - 1天
      replenishmentQty,                   // ✅ 需补货数量 = 需求数量 - 有效库存
      plan.customer_name || null,         // 客户名称
      plan.submitter || 'admin'            // 提交人
    ]);
    
    const processPlan = {
      id: result.insertId,
      planNo: processPlanNo,
      productCode: plan.material_code,
      productName: plan.material_name,
      level0Demand: plan.main_plan_quantity,
      replenishmentQty: replenishmentQty.toFixed(2)
    };
    
    console.log(`✅ 成功生成工序计划: ${processPlanNo}, 需补货数量: ${replenishmentQty.toFixed(2)} ${plan.material_unit || ''}`);
    
    // 6. 返回结果
    res.json({
      code: 200,
      data: {
        processPlan
      },
      message: `推送成功，生成工序计划: ${processPlanNo}，需补货数量: ${replenishmentQty.toFixed(2)} ${plan.material_unit || ''}`
    });
    
  } catch (error) {
    console.error('❗ 推送到工序计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '推送失败: ' + error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;
