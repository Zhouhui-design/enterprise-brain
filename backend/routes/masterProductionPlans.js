const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * 主生产计划路由 - 使用MySQL数据库
 */

// 生成主生产计划编号
function generatePlanCode() {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MPS${year}${timestamp}${random}`;
}

// 格式化日期为MySQL DATE格式 (YYYY-MM-DD)
// ✅ 使用本地时间，保持与前端显示一致
function formatDateForMySQL(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    
    // ✅ 使用本地时间，因为前端发送的UTC时间需要转换为本地时区
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error('日期格式化失败:', dateStr, e);
    return null;
  }
}

// 创建主生产计划（从销售订单）
router.post('/from-sales-order', async (req, res) => {
  try {
    const { salesOrders, advanceStorageDays } = req.body; // ✅ 接收提前入库期
    
    if (!salesOrders || !Array.isArray(salesOrders) || salesOrders.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请至少选择一个销售订单'
      });
    }
    
    console.log('📝 从销售订单创建主生产计划，数量:', salesOrders.length);
    console.log('📦 销售订单详情:', JSON.stringify(salesOrders, null, 2));
    console.log('📅 提前入库期:', advanceStorageDays, '天'); // ✅ 日志输出
    
    const results = [];
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      for (const order of salesOrders) {
        // 遍历销售订单中的每个产品
        const products = order.products || [];
        console.log('📦 当前订单产品数量:', products.length, '产品列表:', products.map(p => p.productCode));
        
        for (const product of products) {
          const planCode = generatePlanCode();
          
          // 计算计划数量：if(可用库存>=订单数量，0，订单数量-可用库存）
          const availableStock = 0; // 暂为0
          const orderQuantity = parseFloat(product.orderQuantity || 0);
          const planQuantity = availableStock >= orderQuantity ? 0 : orderQuantity - availableStock;
          
          // ✅ 修复：订单承诺交期 = 客户交期 (customerDeliveryDate)
          const promisedDeliveryDate = formatDateForMySQL(order.customerDeliveryDate);
          
          // ✅ 计算计划入库日期 = 订单承诺交期 - 提前入库期
          let plannedStorageDate = null;
          if (promisedDeliveryDate && advanceStorageDays !== undefined && advanceStorageDays !== null) {
            const deliveryDate = new Date(promisedDeliveryDate);
            deliveryDate.setDate(deliveryDate.getDate() - parseInt(advanceStorageDays || 0));
            plannedStorageDate = formatDateForMySQL(deliveryDate);
            
            console.log('📅 计划入库日期计算:', {
              订单承诺交期: promisedDeliveryDate,
              提前天数: advanceStorageDays,
              计划入库日期: plannedStorageDate
            });
          }
          
          // 从产品物料库lookup产品图片和产品来源
          let productImage = product.productImage || null;
          let productSource = null;
          
          if (product.productCode) {
            try {
              // 从产品手册表（product_manual）查询产品图片和来源
              const [productRows] = await connection.execute(
                'SELECT productImage, source FROM product_manual WHERE productCode = ? LIMIT 1',
                [product.productCode]
              );
              
              if (productRows.length > 0) {
                const foundProduct = productRows[0];
                
                // 产品图片
                if (foundProduct.productImage) {
                  productImage = foundProduct.productImage;
                }
                
                // 产品来源：source字段是JSON数组，取第一个值（产出工序名称）
                if (foundProduct.source) {
                  try {
                    const sourceArray = JSON.parse(foundProduct.source);
                    if (Array.isArray(sourceArray) && sourceArray.length > 0) {
                      productSource = sourceArray[0]; // 取第一个工序名称
                    }
                  } catch (e) {
                    // 如果不是JSON，直接使用
                    productSource = foundProduct.source;
                  }
                }
                
                console.log('🔍 Lookup结果:', {
                  productCode: product.productCode,
                  productImage,
                  productSource
                });
              } else {
                console.log('⚠️ 未找到产品:', product.productCode);
              }
            } catch (lookupError) {
              console.error('⚠️ Lookup产品信息失败:', lookupError.message);
            }
          }
          
          console.log('📝 创建主生产计划:', {
            planCode,
            productCode: product.productCode,
            productName: product.productName,
            orderQuantity,
            productImage,
            productSource,
            outputProcess: product.outputProcess || '', // ✅ 添加产出工序
            promisedDeliveryDate
          });
          
          const [result] = await connection.execute(`
            INSERT INTO master_production_plans (
              plan_code, product_code, product_name, order_quantity,
              salesperson, sales_unit, available_stock, current_stock,
              plan_quantity, product_image, output_process, promised_delivery_date,
              status, planned_storage_date, product_source,
              internal_order_no, customer_order_no,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            planCode,
            product.productCode || '',
            product.productName || '',
            orderQuantity,
            order.salesperson || '',
            product.productUnit || '',
            availableStock,
            0, // 实时库存暂为0
            planQuantity,
            productImage, // 使用lookup后的图片
            product.outputProcess || '', // ✅ 保存产出工序（从订单获取）
            promisedDeliveryDate,
            '已下单',
            plannedStorageDate, // ✅ 计划入库日期（承诺交期 - 提前天数）
            productSource, // 使用lookup后的产品来源
            order.internalOrderNo || '',
            order.customerOrderNo || ''
          ]);
          
          results.push({
            planCode,
            id: result.insertId,
            productCode: product.productCode,
            productName: product.productName
          });
        }
      }
      
      await connection.commit();
      console.log('✅ 成功创建主生产计划:', results.length, '条');
      
      res.json({
        code: 200,
        data: results,
        message: `成功创建${results.length}条主生产计划`
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ 创建主生产计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建主生产计划失败: ' + error.message
    });
  }
});

// 获取主生产计划列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, planCode, productCode, productName, status } = req.query;
    
    let sql = `
      SELECT 
        id, plan_code as planCode, product_code as productCode,
        product_name as productName, order_quantity as orderQuantity,
        salesperson, sales_unit as salesUnit,
        available_stock as availableStock, current_stock as currentStock,
        plan_quantity as planQuantity, product_image as productImage,
        output_process as outputProcess,
        promised_delivery_date as promisedDeliveryDate, status,
        planned_storage_date as plannedStorageDate,
        product_source as productSource,
        internal_order_no as internalOrderNo,
        customer_order_no as customerOrderNo,
        created_at as createdAt, updated_at as updatedAt
      FROM master_production_plans
      WHERE 1=1
    `;
    
    const params = [];
    
    if (planCode) {
      sql += ' AND plan_code LIKE ?';
      params.push(`%${planCode}%`);
    }
    if (productCode) {
      sql += ' AND product_code LIKE ?';
      params.push(`%${productCode}%`);
    }
    if (productName) {
      sql += ' AND product_name LIKE ?';
      params.push(`%${productName}%`);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    // 查询总数
    const countSql = 'SELECT COUNT(*) as total FROM master_production_plans WHERE 1=1' + 
      (planCode ? ' AND plan_code LIKE ?' : '') +
      (productCode ? ' AND product_code LIKE ?' : '') +
      (productName ? ' AND product_name LIKE ?' : '') +
      (status ? ' AND status = ?' : '');
    
    const [countResult] = await pool.execute(countSql, params);
    const total = countResult[0].total;
    
    // 分页查询
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    sql += ' LIMIT ' + parseInt(pageSize) + ' OFFSET ' + offset;
    
    const [rows] = await pool.execute(sql, params);
    
    res.json({
      code: 200,
      data: {
        list: rows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取主生产计划列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取列表失败: ' + error.message
    });
  }
});

// 删除主生产计划
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ 需求1：先查询主生产计划的plan_code，用于级联删除备料计划
    const [planRows] = await pool.execute(
      'SELECT plan_code FROM master_production_plans WHERE id = ?',
      [id]
    );
    
    if (planRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '主生产计划不存在'
      });
    }
    
    const planCode = planRows[0].plan_code;
    console.log('🗑️ 删除主生产计划:', { id, planCode });
    
    // ✅ 级联删除备料计划（source_plan_no = 主计划的plan_code）
    const [materialPlanResult] = await pool.execute(
      'DELETE FROM material_preparation_plans WHERE source_plan_no = ?',
      [planCode]
    );
    
    console.log(`✅ 级联删除备料计划: ${materialPlanResult.affectedRows} 条`);
    
    // 删除主生产计划
    await pool.execute('DELETE FROM master_production_plans WHERE id = ?', [id]);
    
    console.log('✅ 主生产计划删除成功');
    
    res.json({
      code: 200,
      message: `删除成功（同时删除 ${materialPlanResult.affectedRows} 条备料计划）`
    });
  } catch (error) {
    console.error('删除主生产计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除失败: ' + error.message
    });
  }
});

// 执行排程 - 将主生产计划推送到备料计划
router.post('/:id/execute-schedule', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📦 开始执行排程, 主计划ID:', id);
    
    // 1. 查询主生产计划详情
    const [planRows] = await pool.execute(`
      SELECT * FROM master_production_plans WHERE id = ?
    `, [id]);
    
    if (planRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '主生产计划不存在'
      });
    }
    
    const plan = planRows[0];
    console.log('📝 主计划信息:', {
      planCode: plan.plan_code,
      productCode: plan.product_code,
      productName: plan.product_name,
      planQuantity: plan.plan_quantity,
      outputProcess: plan.output_process // ✅ 添加产出工序
    });
    
    // 2. 生成备料计划编号
    function generateMaterialPlanNo() {
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `MPP${year}${timestamp}${random}`;
    }
    
    const materialPlanNo = generateMaterialPlanNo();
    
    // 3. 创建备料计划（直接将主计划的产品推送到备料计划）
    // 规则映射:
    // - 备料计划编号: 系统自动生成
    // - 来源主计划编号 = 主生产计划编号
    // - 来源工序计划编号 = "/"
    // - 来源工序 = 产出工序 (✅ 新增映射)
    // - 计划物料编号 = 产品编号
    // - 计划物料名称 = 产品名称
    // - 物料来源 = 产品来源
    // - 物料单位 = 销售单位
    // - 需求数量 = 计划数量
    // - 是否需要MRP运算 = "/"
    // - 实时库存 = "/"
    // - 预计结存 = "/"
    // - 有效库存 = "/"
    // - 需求日期 = 计划入库日期
    // - 销售订单编号 = 内部销售订单编号
    // - 客户订单编号 = 客户订单编号
    
    const [result] = await pool.execute(`
      INSERT INTO material_preparation_plans (
        plan_no,
        source_plan_no,
        source_process_plan_no,
        source_process,
        material_code,
        material_name,
        material_source,
        material_unit,
        demand_quantity,
        need_mrp,
        realtime_stock,
        projected_balance,
        available_stock,
        demand_date,
        sales_order_no,
        customer_order_no,
        main_plan_product_code,
        main_plan_product_name,
        main_plan_quantity,
        promise_delivery_date,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      materialPlanNo,                    // 备料计划编号(自动生成)
      plan.plan_code,                    // 来源主计划编号
      '/',                               // 来源工序计划编号
      plan.output_process || null,       // ✅ 来源工序 = 产出工序
      plan.product_code,                 // 计划物料编号 = 产品编号
      plan.product_name,                 // 计划物料名称 = 产品名称
      plan.product_source || null,       // 物料来源 = 产品来源
      plan.sales_unit || null,           // 物料单位 = 销售单位
      plan.plan_quantity || 0,           // 需求数量 = 计划数量
      // need_mrp, realtime_stock, projected_balance, available_stock 都设为NULL (对应"/")
      plan.planned_storage_date || null, // 需求日期 = 计划入库日期
      plan.internal_order_no || null,    // 销售订单编号 = 内部销售订单编号
      plan.customer_order_no || null,    // 客户订单编号
      plan.product_code,                 // 主计划产品编号
      plan.product_name,                 // 主计划产品名称
      plan.plan_quantity || 0,           // 主计划排程数量
      plan.promised_delivery_date || null // 订单承诺交期
    ]);
    
    const materialPlan = {
      id: result.insertId,
      planNo: materialPlanNo,
      materialCode: plan.product_code,
      materialName: plan.product_name,
      demandQuantity: plan.plan_quantity
    };
    
    console.log(`✅ 成功生成备料计划: ${materialPlanNo}`);
    console.log(`   物料: ${plan.product_code} - ${plan.product_name}`);
    console.log(`   需求数量: ${plan.plan_quantity} ${plan.sales_unit || ''}`);
    
    // 4. 返回结果
    res.json({
      code: 200,
      data: {
        materialPlanCount: 1,
        processPlanCount: 0, // 工序计划后续实现
        materialPlan
      },
      message: `排程执行成功，生成1条备料计划`
    });
    
  } catch (error) {
    console.error('❌ 执行排程失败:', error);
    res.status(500).json({
      code: 500,
      message: '执行排程失败: ' + error.message
    });
  }
});

module.exports = router;
