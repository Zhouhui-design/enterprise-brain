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
 * 创建销售订单（修复版）
 * POST /api/sales-orders
 */
router.post('/', async (req, res) => {
  let connection;
  try {
    console.log('=== 创建销售订单（修复版）===');
    console.log('请求数据:', JSON.stringify(req.body, null, 2));

    const id = uuidv4();

    connection = await pool.getConnection();

    // 自动生成内部订单编号
    const year = new Date().getFullYear();
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM sales_orders');
    const count = countResult[0].count;
    const internalOrderNo = `SO${year}${String(count + 1).padStart(6, '0')}`;

    const {
      customerName,
      customerId,
      salesperson,
      orderTime,
      promisedDelivery,
      orderNotes,
      status = 'draft',
      products = [],
      createdBy = 'admin',
    } = req.body;

    // 验证必填字段
    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: '客户名称为必填项',
      });
    }

    // 开始事务
    await connection.beginTransaction();

    try {
      // ✅ 修复：使用简化的INSERT语句，只包含核心必要字段
      await connection.execute(
        `
        INSERT INTO sales_orders (
          id, internal_order_no, customer_name, customer_id,
          salesperson, order_time, promised_delivery, 
          order_notes, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          id,
          internalOrderNo,
          customerName,
          customerId || null,
          salesperson || null,
          formatDateForMySQL(orderTime),
          formatDateForMySQL(promisedDelivery),
          orderNotes || null,
          status,
          createdBy,
        ],
      );

      // 插入产品明细
      if (products && products.length > 0) {
        for (const product of products) {
          await connection.execute(
            `
            INSERT INTO sales_order_products (
              order_id, product_code, product_name, product_spec, product_color,
              product_unit, order_quantity, unit_price_excluding_tax, tax_rate,
              total_price_excluding_tax, total_tax, total_price, accessories, output_process
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
            [
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
            ],
          );
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
          customerName,
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

module.exports = router;
