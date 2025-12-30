'use strict';

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

// 格式化日期为MySQL格式
const formatDateForMySQL = date => {
  if (!date) return null;
  if (typeof date === 'string') {
    return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
  }
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * 创建销售订单（完整版）
 * POST /api/sales-orders
 */
router.post('/', async (req, res) => {
  let connection;
  try {
    console.log('=== 创建销售订单（完整版）===');
    console.log('请求数据:', JSON.stringify(req.body, null, 2));

    connection = await pool.getConnection();

    // 自动生成内部订单编号前缀
    const year = new Date().getFullYear();
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM sales_orders');
    let baseCount = countResult[0].count + 1;

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
      createdBy = 'admin',
    } = req.body;

    // 验证必填字段
    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: '客户名称为必填项',
      });
    }

    if (!products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请至少添加一个产品',
      });
    }

    // 开始事务
    await connection.beginTransaction();

    try {
      const createdOrders = [];

      // 为每个产品创建一个独立的销售订单
      for (const product of products) {
        const orderId = uuidv4();
        const internalOrderNo = `SO${year}${String(baseCount++).padStart(6, '0')}`;

        // 计算单个产品的金额
        const productAmountExcludingTax = (product.orderQuantity || 0) * (product.unitPriceExcludingTax || 0);
        const productTax = productAmountExcludingTax * ((product.taxRate || 13) / 100);
        const productTotalAmount = productAmountExcludingTax + productTax;

        // 插入销售订单（每个产品一行，包含所有非产品信息）
        await connection.execute(
          `
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
            status, created_by,
            -- 产品信息字段（直接合并到主表）
            product_code, product_name, product_spec, product_color,
            product_unit, order_quantity, unit_price_excluding_tax, product_tax_rate,
            accessories, output_process, product_source
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            orderId,
            internalOrderNo,
            customerOrderNo || null,
            customerName,
            customerId || null,
            salesperson || null,
            quotationNo || null,
            orderType || null,
            formatDateForMySQL(orderTime),
            formatDateForMySQL(promisedDelivery),
            formatDateForMySQL(customerDelivery),
            formatDateForMySQL(estimatedCompletionDate),
            salesDepartment || null,
            deliveryMethod || null,
            returnOrderNo || null,
            orderCurrency,
            currentExchangeRate,
            taxRate,
            fees,
            productTotalAmount,
            productAmountExcludingTax,
            productTax,
            orderAttachment || null,
            packagingAttachment || null,
            orderNotes || null,
            packagingMethod || null,
            packagingRequirements || null,
            consignee || null,
            deliveryAddress || null,
            billRecipient || null,
            billAddress || null,
            paymentMethod || null,
            advancePaymentRatio,
            advancePaymentAmount,
            plannedPaymentAccount || null,
            productTotalAmount,
            hasAfterSales,
            afterSalesOrderNo || null,
            afterSalesDetails || null,
            status,
            createdBy,
            // 产品信息
            product.productCode || null,
            product.productName || null,
            product.productSpec || null,
            product.productColor || null,
            product.productUnit || null,
            product.orderQuantity || 0,
            product.unitPriceExcludingTax || 0,
            product.taxRate || 13,
            product.accessories || null,
            product.outputProcess || null,
            product.productSource || null,
          ],
        );

        createdOrders.push({
          id: orderId,
          internalOrderNo,
          customerName,
          productCode: product.productCode,
        });
      }

      await connection.commit();

      console.log('✅ 销售订单创建成功，共创建', createdOrders.length, '条记录');

      res.json({
        success: true,
        message: '订单创建成功',
        data: {
          orders: createdOrders,
          count: createdOrders.length,
        },
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
      error: error.message,
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
    console.log('📋 收到获取销售订单列表请求:', req.query);

    const { page = 1, pageSize = 20 } = req.query;
    const pageInt = parseInt(page);
    const pageSizeInt = parseInt(pageSize);
    const offset = (pageInt - 1) * pageSizeInt;

    console.log('🔢 分页参数:', { pageInt, pageSizeInt, offset });

    connection = await pool.getConnection();
    console.log('✅ 成功获取数据库连接');

    // 获取总数
    console.log('🔍 执行计数查询...');
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM sales_orders');
    const total = countResult[0].total;
    console.log('📊 销售订单总数:', total);

    // 获取列表数据，包含关联的客户信息
    console.log('🔍 执行列表查询...');
    const [orders] = await connection.execute(
      `SELECT 
        so.*,
        c.name as customer_name,
        c.contact_person as customer_contact,
        c.phone as customer_phone,
        u.name as sales_person_name
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      LEFT JOIN users u ON so.sales_person_id = u.id
      ORDER BY so.created_at DESC 
      LIMIT ${pageSizeInt} OFFSET ${offset}`
    );
    console.log('📋 查询到的订单数量:', orders.length);

    res.json({
      success: true,
      data: {
        list: orders,
        total,
        page: pageInt,
        pageSize: pageSizeInt,
      },
    });
  } catch (error) {
    console.error('❌ 获取销售订单列表失败:', error);
    console.error('📋 错误详情:', {
      message: error.message,
      stack: error.stack,
      query: req.query,
    });
    res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  } finally {
    if (connection) {
      console.log('🔄 释放数据库连接');
      connection.release();
    }
  }
});

/**
 * 根据ID获取销售订单详情
 * GET /api/sales-orders/:id
 */
router.get('/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await pool.getConnection();

    // 获取订单主信息
    const [orders] = await connection.execute('SELECT * FROM sales_orders WHERE id = ?', [id]);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在',
      });
    }

    const order = orders[0];

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('❌ 获取销售订单详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 批量删除销售订单
 * POST /api/sales-orders/batch-delete
 */
router.post('/batch-delete', async (req, res) => {
  let connection;
  try {
    console.log('🗑️ 收到批量删除销售订单请求:', JSON.stringify(req.body, null, 2));
    
    const { ids } = req.body;
    
    // 参数验证
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的订单ID列表'
      });
    }
    
    // 验证ID格式（UUID）
    const validIds = ids.filter(id => {
      return typeof id === 'string' && 
             id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
    
    if (validIds.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: '提供的订单ID格式不正确'
      });
    }
    
    console.log(`🔄 开始批量删除 ${ids.length} 个销售订单`);
    
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // 检查要删除的订单是否存在
    const [existingOrders] = await connection.execute(
      `SELECT id, internal_order_no, customer_name FROM sales_orders WHERE id IN (${ids.map(() => '?').join(',')})`,
      ids
    );
    
    console.log(`📋 找到 ${existingOrders.length} 个存在的订单，详情:`, existingOrders);
    
    if (existingOrders.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '未找到要删除的订单'
      });
    }
    
    // 记录删除前的订单信息（用于日志）
    const orderInfo = existingOrders.map(order => ({
      id: order.id,
      internalOrderNo: order.internal_order_no,
      customerName: order.customer_name
    }));
    
    // 执行批量删除
    const [result] = await connection.execute(
      `DELETE FROM sales_orders WHERE id IN (${ids.map(() => '?').join(',')})`,
      ids
    );
    
    console.log(`✅ 数据库删除结果: 影响行数 ${result.affectedRows}`);
    
    await connection.commit();
    
    // 记录删除操作日志
    console.log(`?? 批量删除销售订单成功:`, {
      deletedCount: result.affectedRows,
      orderInfo,
      deletedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: `成功删除${result.affectedRows}条订单`,
      data: {
        deletedCount: result.affectedRows,
        deletedOrders: orderInfo
      }
    });
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ 批量删除销售订单失败:', error);
    console.error('📋 错误详情:', {
      message: error.message,
      stack: error.stack,
      requestIds: req.body.ids
    });
    
    res.status(500).json({
      success: false,
      message: '批量删除失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;
