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
      // ✅ 修复：分两步插入，先插入核心字段
      const mainFields = [
        'id', 'internal_order_no', 'customer_order_no', 'customer_name', 'customer_id',
        'salesperson', 'submitter', 'quotation_no', 'order_type',
        'order_time', 'promised_delivery', 'customer_delivery', 'estimated_completion_date',
        'sales_department', 'delivery_method', 'return_order_no',
        'order_currency', 'current_exchange_rate', 'tax_rate', 'fees',
        'total_amount', 'total_amount_excluding_tax', 'total_tax',
        'order_attachment', 'packaging_attachment', 'order_notes',
        'packaging_method', 'packaging_requirements',
        'consignee', 'delivery_address', 'bill_recipient', 'bill_address',
        'payment_method', 'advance_payment_ratio', 'advance_payment_amount',
        'planned_payment_account', 'total_receivable',
        'has_after_sales', 'after_sales_order_no', 'after_sales_details',
        'status', 'created_by', 'updated_by'
      ];
      
      const mainValues = [
        id, internalOrderNo, customerOrderNo || null, customerName, customerId || null,
        salesperson || null, createdBy, quotationNo || null, orderType || null,
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
        status, createdBy, null
      ];
      
      const mainSql = `
        INSERT INTO sales_orders (${mainFields.join(', ')})
        VALUES (${mainFields.map(() => '?').join(', ')})
      `;
      
      await connection.execute(mainSql, mainValues);
      
      // 插入产品明细
      if (products && products.length > 0) {
        for (const product of products) {
          await connection.execute(`
            INSERT INTO sales_order_products (
              order_id, product_code, product_name, product_spec, product_color,
              product_unit, order_quantity, unit_price_excluding_tax, tax_rate,
              total_price_excluding_tax, total_tax, total_price, accessories, output_process
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            product.outputProcess || null
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
    
    // 获取分页数据
    const [orders] = await connection.execute(
      `SELECT * FROM sales_orders ${whereClauseStr} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(pageSize), parseInt(offset)]
    );
    
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

module.exports = router;