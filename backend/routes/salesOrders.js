const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// 格式化日期为MySQL格式
function formatDateForMySQL(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * 创建销售订单（完整版）
 * POST /api/sales-orders
 */
router.post('/', async (req, res) => {
  let connection;
  try {
    console.log('=== 创建销售订单（完整版）===')
    console.log('请求数据:', JSON.stringify(req.body, null, 2))
    
    const id = uuidv4();
    
    connection = await pool.getConnection();
    
    // 自动生成内部订单编号
    const year = new Date().getFullYear();
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM sales_orders');
    const count = countResult[0].count;
    const internalOrderNo = `SO${year}${String(count + 1).padStart(6, '0')}`;
    
    const {
      customerOrderNo,
      customerName,
      customerId,
      salesperson,
      quotationNo,
      orderType,
      orderTime,
      promisedDelivery,
      customerDelivery,
      estimatedCompletionDate,
      salesDepartment,
      deliveryMethod,
      returnOrderNo,
      orderCurrency = 'CNY',
      currentExchangeRate = 1.0,
      taxRate = 13,
      fees = 0,
      totalAmount = 0,
      totalAmountExcludingTax = 0,
      totalTax = 0,
      orderAttachment,
      packagingAttachment,
      orderNotes,
      packagingMethod,
      packagingRequirements,
      consignee,
      deliveryAddress,
      billRecipient,
      billAddress,
      paymentMethod,
      advancePaymentRatio = 0,
      advancePaymentAmount = 0,
      plannedPaymentAccount,
      totalReceivable = 0,
      hasAfterSales = 0,
      afterSalesOrderNo,
      afterSalesDetails,
      status = 'draft',
      products = [],
      paymentSchedule = [],
      createdBy = 'admin'
    } = req.body;
    
    // 验证必填字段
    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: '客户名称为必填项'
      });
    }
    
    // 开始事务
    await connection.beginTransaction();
    
    try {
      // 插入主订单
      await connection.execute(`
        INSERT INTO sales_orders (
          id, internal_order_no, customer_order_no, customer_name, customer_id,
          salesperson, quotation_no, order_type,
          order_time, promised_delivery, customer_delivery, estimated_completion_date,
          sales_department, delivery_method, return_order_no,
          order_currency, current_exchange_rate, tax_rate, fees,
          total_amount, total_amount_excluding_tax, total_tax,
          order_attachment, packaging_attachment, order_notes,
          packaging_method, packaging_requirements,
          consignee, delivery_address, bill_recipient, bill_address,
          payment_method, advance_payment_ratio, advance_payment_amount,
          planned_payment_account, total_receivable,
          has_after_sales, after_sales_order_no, after_sales_details,
          status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, internalOrderNo, customerOrderNo || null, customerName, customerId || null,
        salesperson || null, quotationNo || null, orderType || null,
        formatDateForMySQL(orderTime), formatDateForMySQL(promisedDelivery), formatDateForMySQL(customerDelivery), formatDateForMySQL(estimatedCompletionDate),
        salesDepartment || null, deliveryMethod || null, returnOrderNo || null,
        orderCurrency, currentExchangeRate, taxRate, fees,
        totalAmount, totalAmountExcludingTax, totalTax,
        orderAttachment || null, packagingAttachment || null, orderNotes || null,
        packagingMethod || null, packagingRequirements || null,
        consignee || null, deliveryAddress || null, billRecipient || null, billAddress || null,
        paymentMethod || null, advancePaymentRatio, advancePaymentAmount,
        plannedPaymentAccount || null, totalReceivable,
        hasAfterSales, afterSalesOrderNo || null, afterSalesDetails || null,
        status, createdBy
      ])
      
      console.log('📦 准备插入产品明细，数量:', products ? products.length : 0);
      if (products && products.length > 0) {
        console.log('📦 产品数据:', JSON.stringify(products, null, 2));
      }
      
      // 插入产品明细
      if (products && products.length > 0) {
        for (const product of products) {
          await connection.execute(`
            INSERT INTO sales_order_products (
              order_id, product_code, product_name, product_spec, product_color,
              product_unit, order_quantity, unit_price_excluding_tax, tax_rate,
              total_price_excluding_tax, total_tax, total_price, accessories, output_process, product_source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            id, 
            product.productCode || null, 
            product.productName || null, 
            product.productSpec || null, 
            product.productColor || null,
            product.productUnit || null, 
            product.orderQuantity || 0, 
            product.unitPriceExcludingTax || 0, 
            product.taxRate || 13,
            product.totalPriceExcludingTax || 0, 
            product.totalTax || 0, 
            product.totalPrice || 0, 
            product.accessories || null, 
            product.outputProcess || null,
            product.productSource || null  // 🆕 添加产品来源字段
          ]);
        }
      }
      
      // 插入回款计划
      if (paymentSchedule && paymentSchedule.length > 0) {
        for (const schedule of paymentSchedule) {
          await connection.execute(`
            INSERT INTO sales_order_payment_schedule (
              order_id, payment_type, payment_ratio, payment_amount, 
              payment_method, payment_date, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            id,
            schedule.paymentType || null,
            schedule.paymentRatio || 0,
            schedule.paymentAmount || 0,
            schedule.paymentMethod || null,
            formatDateForMySQL(schedule.paymentDate),
            schedule.notes || null
          ]);
        }
      }
      
      await connection.commit();
      
      console.log('✅ 销售订单创建成功:', id);
      
      res.json({
        success: true,
        message: '订单创建成功',
        data: {
          id,
          internalOrderNo,
          customerName
        }
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ 创建销售订单失败:', error);
    res.status(500).json({
      success: false,
      message: '创建订单失败',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// ✅ 添加其他必要的路由处理函数，确保完整性
/**
 * 获取销售订单列表
 * GET /api/sales-orders
 */
router.get('/', async (req, res) => {
  let connection;
  try {
    const { page = 1, pageSize = 20, customerName, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    let whereClause = [];
    const queryParams = [];
    
    if (customerName) {
      whereClause.push('customer_name LIKE ?');
      queryParams.push(`%${customerName}%`);
    }
    
    if (status) {
      whereClause.push('status = ?');
      queryParams.push(status);
    }
    
    const whereClauseStr = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
    
    connection = await pool.getConnection();
    
    // 获取总数
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM sales_orders ${whereClauseStr}`,
      queryParams
    );
    const total = countResult[0].total;
    
    // 获取分页数据 - 修复：使用字符串拼接避免参数化问题
    const [orders] = await connection.execute(
      `SELECT * FROM sales_orders ${whereClauseStr} ORDER BY created_at DESC LIMIT ${Math.max(0, parseInt(pageSize))} OFFSET ${Math.max(0, parseInt(offset))}`,
      queryParams
    );
    
    // ✅ 为每个订单加载产品明细
    for (const order of orders) {
      const [products] = await connection.execute(
        'SELECT * FROM sales_order_products WHERE order_id = ?',
        [order.id]
      );
      
      // 将产品明细转换为驼峰命名并添加到订单对象
      order.productList = products.map(p => ({
        productCode: p.product_code,
        productName: p.product_name,
        productSpec: p.product_spec,
        productColor: p.product_color,
        productMaterial: p.product_material || '',
        productDescription: p.product_description || '',
        productImage: p.product_image || '',
        productUnit: p.product_unit,
        orderQuantity: parseFloat(p.order_quantity) || 0,
        unitPriceExcludingTax: parseFloat(p.unit_price_excluding_tax) || 0,
        taxRate: parseFloat(p.tax_rate) || 0,
        totalPriceExcludingTax: parseFloat(p.total_price_excluding_tax) || 0,
        totalTax: parseFloat(p.total_tax) || 0,
        totalPrice: parseFloat(p.total_price) || 0,
        accessories: p.accessories,
        outputProcess: p.output_process || '',
        productSource: p.product_source || ''  // 🆕 添加产品来源字段
      }));
    }
    
    res.json({
      success: true,
      data: {
        list: orders,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('❌ 获取销售订单列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取销售订单列表失败',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 获取订单产品明细
 * GET /api/sales-orders/:id/products
 */
router.get('/:id/products', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await pool.getConnection();
    
    const [products] = await connection.execute(
      'SELECT * FROM sales_order_products WHERE order_id = ?',
      [id]
    );
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('❌ 获取订单产品明细失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单产品明细失败',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 获取订单回款计划
 * GET /api/sales-orders/:id/payments
 */
router.get('/:id/payments', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await pool.getConnection();
    
    const [payments] = await connection.execute(
      'SELECT * FROM sales_order_payment_schedule WHERE order_id = ?',
      [id]
    );
    
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('❌ 获取订单回款计划失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单回款计划失败',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 获取订单详情
 * GET /api/sales-orders/:id
 */
router.get('/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await pool.getConnection();
    
    // 获取主订单信息
    const [orders] = await connection.execute(
      'SELECT * FROM sales_orders WHERE id = ?',
      [id]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    const order = orders[0];
    
    // 获取产品明细
    const [products] = await connection.execute(
      'SELECT * FROM sales_order_products WHERE order_id = ?',
      [id]
    );
    
    // 获取回款计划
    const [paymentSchedule] = await connection.execute(
      'SELECT * FROM sales_order_payment_schedule WHERE order_id = ?',
      [id]
    );
    
    res.json({
      success: true,
      data: {
        ...order,
        products,
        paymentSchedule
      }
    });
  } catch (error) {
    console.error('❌ 获取订单详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 删除单个销售订单（完整级联删除）
 * DELETE /api/sales-orders/:id
 */
router.delete('/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    console.log('🔄 开始删除销售订单:', id);
    
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 检查订单是否存在
      const [orders] = await connection.execute(
        'SELECT internal_order_no FROM sales_orders WHERE id = ?',
        [id]
      );
      
      if (orders.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      const internalOrderNo = orders[0].internal_order_no;
      console.log('📋 内部订单编号:', internalOrderNo);
      
      const deleteStats = {
        masterProductionPlans: 0,
        materialPreparationPlans: 0,
        procurementPlans: 0,
        processPlans: 0,
        otherPlans: 0
      };
      
      // 🗂️ 阶段1：删除主生产计划
      try {
        const [masterPlanResult] = await connection.execute(
          'DELETE FROM master_production_plans WHERE internal_order_no = ?',
          [internalOrderNo]
        );
        deleteStats.masterProductionPlans = masterPlanResult.affectedRows;
        console.log(`✅ 级联删除主生产计划: ${masterPlanResult.affectedRows} 条`);
      } catch (error) {
        console.error('❌ 删除主生产计划失败:', error.message);
      }
      
      // 🗂️ 阶段2：删除备料计划
      try {
        const [materialPlanResult] = await connection.execute(
          'DELETE FROM material_preparation_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        deleteStats.materialPreparationPlans = materialPlanResult.affectedRows;
        console.log(`✅ 级联删除备料计划: ${materialPlanResult.affectedRows} 条`);
      } catch (error) {
        console.error('❌ 删除备料计划失败:', error.message);
      }
      
      // 🗂️ 阶段3：删除采购计划
      try {
        const [procurementPlanResult] = await connection.execute(
          'DELETE FROM procurement_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        deleteStats.procurementPlans = procurementPlanResult.affectedRows;
        console.log(`✅ 级联删除采购计划: ${procurementPlanResult.affectedRows} 条`);
      } catch (error) {
        console.error('❌ 删除采购计划失败:', error.message);
      }
      
      // 🗂️ 阶段4：删除所有工序计划表（使用sales_order_no匹配）
      const processTables = [
        'packing_process_plans',           // 打包工序计划
        'spray_painting_process_plans',    // 喷塑工序计划
        'assembly_process_plans',          // 组装工序计划
        'sewing_process_plans',            // 缝纫工序计划
        'shot_blasting_process_plans',     // 抛丸工序计划
        'manual_welding_process_plans',    // 人工焊接工序计划
        'tube_bending_process_plans',      // 弯管工序计划
        'laser_tube_cutting_process_plans', // 激光切管工序计划
        'laser_cutting_process_plans',     // 激光下料工序计划
        'bending_process_plans',           // 折弯工序计划
        'drilling_process_plans',          // 打孔工序计划
        'punching_process_plans',          // 冲床工序计划
        'manual_cutting_process_plans',    // 人工下料工序计划
        'machine_grinding_process_plans',  // 机器打磨工序计划
        'cutting_process_plans'            // 裁剪工序计划
      ];
      
      for (const tableName of processTables) {
        try {
          const [result] = await connection.execute(
            `DELETE FROM ${tableName} WHERE sales_order_no = ?`,
            [internalOrderNo]
          );
          if (result.affectedRows > 0) {
            deleteStats.processPlans += result.affectedRows;
            console.log(`✅ 级联删除 ${tableName}: ${result.affectedRows} 条`);
          }
        } catch (error) {
          console.warn(`⚠️ 删除 ${tableName} 失败（表可能不存在）:`, error.message);
          // 不回滚，继续执行其他表的删除
        }
      }
      
      // 🗂️ 阶段5：删除订单产品明细
      await connection.execute(
        'DELETE FROM sales_order_products WHERE order_id = ?',
        [id]
      );
      console.log('✅ 删除订单产品明细');
      
      // 🗂️ 阶段6：删除回款计划
      await connection.execute(
        'DELETE FROM sales_order_payment_schedule WHERE order_id = ?',
        [id]
      );
      console.log('✅ 删除回款计划');
      
      // 🗂️ 阶段7：删除主订单
      await connection.execute(
        'DELETE FROM sales_orders WHERE id = ?',
        [id]
      );
      console.log('✅ 删除主订单记录');
      
      await connection.commit();
      
      const totalDeleted = deleteStats.masterProductionPlans + 
                          deleteStats.materialPreparationPlans + 
                          deleteStats.procurementPlans + 
                          deleteStats.processPlans;
      
      console.log('🎉 订单级联删除成功:', {
        internalOrderNo,
        主生产计划: deleteStats.masterProductionPlans,
        备料计划: deleteStats.materialPreparationPlans,
        采购计划: deleteStats.procurementPlans,
        工序计划: deleteStats.processPlans,
        总计: totalDeleted
      });
      
      res.json({
        success: true,
        message: `订单删除成功，级联删除 ${totalDeleted} 条关联数据`,
        data: { 
          id, 
          internalOrderNo,
          cascadeDeleted: deleteStats
        }
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ 删除订单失败:', error);
    res.status(500).json({
      success: false,
      message: '删除订单失败',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 批量删除销售订单（完整级联删除）
 * POST /api/sales-orders/batch-delete
 */
router.post('/batch-delete', async (req, res) => {
  let connection;
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的订单ID列表'
      });
    }
    
    console.log('🔄 批量删除订单:', ids.length, '个');
    
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      const deletedOrders = [];
      const totalStats = {
        masterProductionPlans: 0,
        materialPreparationPlans: 0,
        procurementPlans: 0,
        processPlans: 0
      };
      
      for (const id of ids) {
        // 检查订单是否存在
        const [orders] = await connection.execute(
          'SELECT internal_order_no FROM sales_orders WHERE id = ?',
          [id]
        );
        
        if (orders.length === 0) continue;
        
        const internalOrderNo = orders[0].internal_order_no;
        console.log(`📋 处理订单: ${internalOrderNo}`);
        
        // 🗂️ 删除主生产计划
        try {
          const [masterPlanResult] = await connection.execute(
            'DELETE FROM master_production_plans WHERE internal_order_no = ?',
            [internalOrderNo]
          );
          totalStats.masterProductionPlans += masterPlanResult.affectedRows;
          if (masterPlanResult.affectedRows > 0) {
            console.log(`  ✅ 级联删除主生产计划: ${masterPlanResult.affectedRows} 条`);
          }
        } catch (error) {
          console.error('  ❌ 删除主生产计划失败:', error.message);
        }
        
        // 🗂️ 删除备料计划
        try {
          const [materialPlanResult] = await connection.execute(
            'DELETE FROM material_preparation_plans WHERE sales_order_no = ?',
            [internalOrderNo]
          );
          totalStats.materialPreparationPlans += materialPlanResult.affectedRows;
          if (materialPlanResult.affectedRows > 0) {
            console.log(`  ✅ 级联删除备料计划: ${materialPlanResult.affectedRows} 条`);
          }
        } catch (error) {
          console.error('  ❌ 删除备料计划失败:', error.message);
        }
        
        // 🗂️ 删除采购计划
        try {
          const [procurementPlanResult] = await connection.execute(
            'DELETE FROM procurement_plans WHERE sales_order_no = ?',
            [internalOrderNo]
          );
          totalStats.procurementPlans += procurementPlanResult.affectedRows;
          if (procurementPlanResult.affectedRows > 0) {
            console.log(`  ✅ 级联删除采购计划: ${procurementPlanResult.affectedRows} 条`);
          }
        } catch (error) {
          console.error('  ❌ 删除采购计划失败:', error.message);
        }
        
        // 🗂️ 删除所有工序计划表
        const processTables = [
          'packing_process_plans',
          'spray_painting_process_plans',
          'assembly_process_plans',
          'sewing_process_plans',
          'shot_blasting_process_plans',
          'manual_welding_process_plans',
          'tube_bending_process_plans',
          'laser_tube_cutting_process_plans',
          'laser_cutting_process_plans',
          'bending_process_plans',
          'drilling_process_plans',
          'punching_process_plans',
          'manual_cutting_process_plans',
          'machine_grinding_process_plans',
          'cutting_process_plans'
        ];
        
        for (const tableName of processTables) {
          try {
            const [result] = await connection.execute(
              `DELETE FROM ${tableName} WHERE sales_order_no = ?`,
              [internalOrderNo]
            );
            if (result.affectedRows > 0) {
              totalStats.processPlans += result.affectedRows;
              console.log(`  ✅ 级联删除 ${tableName}: ${result.affectedRows} 条`);
            }
          } catch (error) {
            // 忽略表不存在的错误
          }
        }
        
        // 🗂️ 删除订单产品明细
        await connection.execute(
          'DELETE FROM sales_order_products WHERE order_id = ?',
          [id]
        );
        
        // 🗂️ 删除回款计划
        await connection.execute(
          'DELETE FROM sales_order_payment_schedule WHERE order_id = ?',
          [id]
        );
        
        // 🗂️ 删除主订单
        await connection.execute(
          'DELETE FROM sales_orders WHERE id = ?',
          [id]
        );
        
        deletedOrders.push({ id, internalOrderNo });
      }
      
      await connection.commit();
      
      const totalCascadeDeleted = totalStats.masterProductionPlans + 
                                  totalStats.materialPreparationPlans + 
                                  totalStats.procurementPlans + 
                                  totalStats.processPlans;
      
      console.log('🎉 批量删除成功:', {
        删除订单数: deletedOrders.length,
        主生产计划: totalStats.masterProductionPlans,
        备料计划: totalStats.materialPreparationPlans,
        采购计划: totalStats.procurementPlans,
        工序计划: totalStats.processPlans,
        级联删除总计: totalCascadeDeleted
      });
      
      res.json({
        success: true,
        message: `成功删除 ${deletedOrders.length} 个订单，级联删除 ${totalCascadeDeleted} 条关联数据`,
        data: { 
          deletedOrders,
          cascadeDeleted: totalStats
        }
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ 批量删除订单失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除订单失败',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 确认下单（推送到主生产计划或采购计划）
 * POST /api/sales-orders/confirm-order
 */
router.post('/confirm-order', async (req, res) => {
  let connection;
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要确认的订单'
      });
    }
    
    console.log('🔄 确认下单:', ids);
    
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      const confirmedOrders = [];
      const productionPlans = []; // 生产计划产品
      const procurementPlans = []; // 采购计划产品
      
      for (const orderId of ids) {
        // 获取订单信息
        const [orders] = await connection.execute(
          'SELECT * FROM sales_orders WHERE id = ?',
          [orderId]
        );
        
        if (orders.length === 0) continue;
        
        const order = orders[0];
        
        // 获取订单产品
        const [products] = await connection.execute(
          'SELECT * FROM sales_order_products WHERE order_id = ?',
          [orderId]
        );
        
        // 更新订单状态为已确认
        await connection.execute(
          'UPDATE sales_orders SET status = ? WHERE id = ?',
          ['confirmed', orderId]
        );
        
        // 推送产品到主生产计划或采购计划（根据 output_process 字段判断）
        for (const product of products) {
          const outputProcess = (product.output_process || '').trim();
          
          // 🔧 处理product_source可能是JSON数组的情况
          let productSource = product.product_source || '';
          if (typeof productSource === 'string' && productSource.startsWith('[')) {
            try {
              const parsed = JSON.parse(productSource);
              productSource = Array.isArray(parsed) ? parsed[0] || '' : productSource;
            } catch (e) {
              // 解析失败，保持原值
            }
          }
          
          if (outputProcess === '采购') {
            // 推送到采购计划
            // 生成采购计划编号
            const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM procurement_plans');
            const count = countResult[0].count;
            const year = new Date().getFullYear();
            const procurementPlanNo = `CG${year}${String(count + 1).padStart(6, '0')}`;
            
            await connection.execute(`
              INSERT INTO procurement_plans (
                procurement_plan_no, source_form_name, source_no,
                material_code, material_name, required_quantity, base_unit,
                sales_order_no, customer_order_no,
                plan_arrival_date, procurement_status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              procurementPlanNo,
              '销售订单',
              order.internal_order_no,
              product.product_code,
              product.product_name,
              product.order_quantity,
              product.product_unit || '个',
              order.internal_order_no,
              order.customer_order_no,
              order.customer_delivery,
              'PENDING_INQUIRY'
            ]);
            
            procurementPlans.push({
              productCode: product.product_code,
              productName: product.product_name,
              planNo: procurementPlanNo
            });
            
          } else {
            // 推送到主生产计划
            // 生成主生产计划编号
            const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM master_production_plans');
            const count = countResult[0].count;
            const year = new Date().getFullYear();
            const planCode = `MPS${year}${String(count + 1).padStart(6, '0')}`;
            
            // 🔧 计算计划数量：if(可用库存>=订单数量，0，订单数量-可用库存）
            const availableStock = 0; // 可用库存暂为0
            const orderQuantity = parseFloat(product.order_quantity || 0);
            const planQuantity = availableStock >= orderQuantity ? 0 : orderQuantity - availableStock;
            
            await connection.execute(`
              INSERT INTO master_production_plans (
                plan_code, product_code, product_name, order_quantity,
                salesperson, sales_unit, product_source,
                available_stock, current_stock, plan_quantity,
                output_process, promised_delivery_date,
                internal_order_no, customer_order_no, customer_name,
                status, submitter, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
              planCode,
              product.product_code,
              product.product_name,
              orderQuantity,
              order.salesperson || '', // ✅ 销售员
              product.product_unit || '', // ✅ 销售单位（产品单位）
              productSource, // 🔧 使用处理后的产品来源
              availableStock, // 🆕 可用库存
              0, // 🆕 实时库存（暂为0）
              planQuantity, // 🆕 计划数量 = 订单数量 - 可用库存
              outputProcess,
              order.customer_delivery,
              order.internal_order_no,
              order.customer_order_no,
              order.customer_name,
              '已下单',
              order.salesperson || 'admin' // ✅ 提交人使用销售员
            ]);
            
            productionPlans.push({
              productCode: product.product_code,
              productName: product.product_name,
              planCode: planCode,
              salesperson: order.salesperson, // 添加到返回结果
              productUnit: product.product_unit,
              productSource: productSource, // 🔧 使用处理后的产品来源
              orderQuantity: orderQuantity, // 🆕 订单数量
              availableStock: availableStock, // 🆕 可用库存
              planQuantity: planQuantity // 🆕 计划数量
            });
          }
        }
        
        confirmedOrders.push(order.internal_order_no);
      }
      
      await connection.commit();
      
      console.log('✅ 确认下单成功:', confirmedOrders);
      console.log('📦 生产计划:', productionPlans);
      console.log('🛒 采购计划:', procurementPlans);
      
      res.json({
        success: true,
        message: `成功确认 ${confirmedOrders.length} 个订单`,
        data: { 
          confirmedOrders,
          masterPlansCreated: productionPlans.length,
          procurementPlansCreated: procurementPlans.length,
          productionPlans,  // 保留详细信息供调试
          procurementPlans
        }
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ 确认下单失败:', error);
    res.status(500).json({
      success: false,
      message: '确认下单失败',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;