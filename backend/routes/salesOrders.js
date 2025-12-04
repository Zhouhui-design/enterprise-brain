const express = require('express')
const router = express.Router()
const db = require('../config/database')

/**
 * 获取销售订单列表
 * GET /api/sales-orders
 */
router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, customerName, search } = req.query
    
    console.log('=== 获取销售订单列表 ===')
    
    let whereClause = []
    const params = []
    
    if (status) {
      whereClause.push('status = ?')
      params.push(status)
    }
    
    if (customerName) {
      whereClause.push('customer_name LIKE ?')
      params.push(`%${customerName}%`)
    }
    
    if (search) {
      whereClause.push('(internal_order_no LIKE ? OR customer_order_no LIKE ? OR customer_name LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    
    const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : ''
    
    const countSQL = `SELECT COUNT(*) as total FROM sales_orders ${whereSQL}`
    const total = db.prepare(countSQL).get(...params).total
    
    const offset = (page - 1) * pageSize
    const dataSQL = `
      SELECT * FROM sales_orders 
      ${whereSQL}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `
    const orders = db.prepare(dataSQL).all(...params, parseInt(pageSize), offset)
    
    console.log(`✅ 查询成功，共 ${total} 条记录，当前页 ${orders.length} 条`)
    
    res.json({
      success: true,
      data: {
        list: orders,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    })
  } catch (error) {
    console.error('❌ 获取销售订单列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取销售订单列表失败',
      error: error.message
    })
  }
})

/**
 * 根据ID获取订单详情
 * GET /api/sales-orders/:id
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    console.log('=== 获取订单详情 ===', id)
    
    const order = db.prepare('SELECT * FROM sales_orders WHERE id = ?').get(id)
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      })
    }
    
    // 获取产品明细
    const products = db.prepare('SELECT * FROM sales_order_products WHERE order_id = ?').all(id)
    
    // 获取回款计划
    const paymentSchedule = db.prepare('SELECT * FROM sales_order_payment_schedule WHERE order_id = ?').all(id)
    
    console.log('✅ 获取成功')
    res.json({
      success: true,
      data: {
        ...order,
        products,
        paymentSchedule
      }
    })
  } catch (error) {
    console.error('❌ 获取订单详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: error.message
    })
  }
})

/**
 * 创建销售订单
 * POST /api/sales-orders
 */
router.post('/', (req, res) => {
  try {
    console.log('=== 创建销售订单 ===')
    console.log('请求数据:', JSON.stringify(req.body, null, 2))
    
    const { v4: uuidv4 } = require('uuid')
    const id = uuidv4()
    
    // 自动生成内部订单编号
    const year = new Date().getFullYear()
    const count = db.prepare('SELECT COUNT(*) as count FROM sales_orders').get().count
    const internalOrderNo = `SO${year}${String(count + 1).padStart(6, '0')}`
    
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
    } = req.body
    
    // 验证必填字段
    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: '客户名称为必填项'
      })
    }
    
    // 插入主订单
    const stmt = db.prepare(`
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
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `)
    
    stmt.run(
      id, internalOrderNo, customerOrderNo, customerName, customerId,
      salesperson, quotationNo, orderType,
      orderTime, promisedDelivery, customerDelivery, estimatedCompletionDate,
      salesDepartment, deliveryMethod, returnOrderNo,
      orderCurrency, currentExchangeRate, taxRate, fees,
      totalAmount, totalAmountExcludingTax, totalTax,
      orderAttachment, packagingAttachment, orderNotes,
      packagingMethod, packagingRequirements,
      consignee, deliveryAddress, billRecipient, billAddress,
      paymentMethod, advancePaymentRatio, advancePaymentAmount,
      plannedPaymentAccount, totalReceivable,
      hasAfterSales, afterSalesOrderNo, afterSalesDetails,
      status, createdBy
    )
    
    // 插入产品明细
    if (products && products.length > 0) {
      const productStmt = db.prepare(`
        INSERT INTO sales_order_products (
          order_id, product_code, product_name, product_spec, product_color,
          product_unit, order_quantity, unit_price_excluding_tax, tax_rate,
          total_price_excluding_tax, total_tax, total_price, accessories
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      for (const product of products) {
        productStmt.run(
          id, product.productCode, product.productName, product.productSpec, product.productColor,
          product.productUnit, product.orderQuantity, product.unitPriceExcludingTax, product.taxRate,
          product.totalPriceExcludingTax, product.totalTax, product.totalPrice,
          product.accessories ? JSON.stringify(product.accessories) : null
        )
      }
    }
    
    // 插入回款计划
    if (paymentSchedule && paymentSchedule.length > 0) {
      const paymentStmt = db.prepare(`
        INSERT INTO sales_order_payment_schedule (
          order_id, payment_ratio, payment_amount, payment_date, payment_account
        ) VALUES (?, ?, ?, ?, ?)
      `)
      
      for (const payment of paymentSchedule) {
        paymentStmt.run(
          id, payment.paymentRatio, payment.paymentAmount, payment.paymentDate, payment.paymentAccount
        )
      }
    }
    
    // 获取创建的订单
    const newOrder = db.prepare('SELECT * FROM sales_orders WHERE id = ?').get(id)
    
    console.log('✅ 创建成功，订单号:', internalOrderNo)
    
    res.json({
      success: true,
      message: '创建订单成功',
      data: newOrder
    })
  } catch (error) {
    console.error('❌ 创建订单失败:', error)
    res.status(500).json({
      success: false,
      message: '创建订单失败',
      error: error.message
    })
  }
})

/**
 * 更新销售订单
 * PUT /api/sales-orders/:id
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    console.log('=== 更新销售订单 ===', id)
    
    // 检查订单是否存在
    const existing = db.prepare('SELECT id FROM sales_orders WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      })
    }
    
    const {
      customerOrderNo, customerName, customerId, salesperson, quotationNo, orderType,
      orderTime, promisedDelivery, customerDelivery, estimatedCompletionDate,
      salesDepartment, deliveryMethod, returnOrderNo,
      orderCurrency, currentExchangeRate, taxRate, fees,
      totalAmount, totalAmountExcludingTax, totalTax,
      orderAttachment, packagingAttachment, orderNotes,
      packagingMethod, packagingRequirements,
      consignee, deliveryAddress, billRecipient, billAddress,
      paymentMethod, advancePaymentRatio, advancePaymentAmount,
      plannedPaymentAccount, totalReceivable,
      hasAfterSales, afterSalesOrderNo, afterSalesDetails,
      status,
      products = [],
      paymentSchedule = [],
      updatedBy = 'admin'
    } = req.body
    
    // 更新主订单
    const stmt = db.prepare(`
      UPDATE sales_orders SET
        customer_order_no = ?, customer_name = ?, customer_id = ?,
        salesperson = ?, quotation_no = ?, order_type = ?,
        order_time = ?, promised_delivery = ?, customer_delivery = ?, estimated_completion_date = ?,
        sales_department = ?, delivery_method = ?, return_order_no = ?,
        order_currency = ?, current_exchange_rate = ?, tax_rate = ?, fees = ?,
        total_amount = ?, total_amount_excluding_tax = ?, total_tax = ?,
        order_attachment = ?, packaging_attachment = ?, order_notes = ?,
        packaging_method = ?, packaging_requirements = ?,
        consignee = ?, delivery_address = ?, bill_recipient = ?, bill_address = ?,
        payment_method = ?, advance_payment_ratio = ?, advance_payment_amount = ?,
        planned_payment_account = ?, total_receivable = ?,
        has_after_sales = ?, after_sales_order_no = ?, after_sales_details = ?,
        status = ?, updated_by = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    
    stmt.run(
      customerOrderNo, customerName, customerId, salesperson, quotationNo, orderType,
      orderTime, promisedDelivery, customerDelivery, estimatedCompletionDate,
      salesDepartment, deliveryMethod, returnOrderNo,
      orderCurrency, currentExchangeRate, taxRate, fees,
      totalAmount, totalAmountExcludingTax, totalTax,
      orderAttachment, packagingAttachment, orderNotes,
      packagingMethod, packagingRequirements,
      consignee, deliveryAddress, billRecipient, billAddress,
      paymentMethod, advancePaymentRatio, advancePaymentAmount,
      plannedPaymentAccount, totalReceivable,
      hasAfterSales, afterSalesOrderNo, afterSalesDetails,
      status, updatedBy, id
    )
    
    // 删除旧的产品明细和回款计划
    db.prepare('DELETE FROM sales_order_products WHERE order_id = ?').run(id)
    db.prepare('DELETE FROM sales_order_payment_schedule WHERE order_id = ?').run(id)
    
    // 重新插入产品明细
    if (products && products.length > 0) {
      const productStmt = db.prepare(`
        INSERT INTO sales_order_products (
          order_id, product_code, product_name, product_spec, product_color,
          product_unit, order_quantity, unit_price_excluding_tax, tax_rate,
          total_price_excluding_tax, total_tax, total_price, accessories
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      for (const product of products) {
        productStmt.run(
          id, product.productCode, product.productName, product.productSpec, product.productColor,
          product.productUnit, product.orderQuantity, product.unitPriceExcludingTax, product.taxRate,
          product.totalPriceExcludingTax, product.totalTax, product.totalPrice,
          product.accessories ? JSON.stringify(product.accessories) : null
        )
      }
    }
    
    // 重新插入回款计划
    if (paymentSchedule && paymentSchedule.length > 0) {
      const paymentStmt = db.prepare(`
        INSERT INTO sales_order_payment_schedule (
          order_id, payment_ratio, payment_amount, payment_date, payment_account
        ) VALUES (?, ?, ?, ?, ?)
      `)
      
      for (const payment of paymentSchedule) {
        paymentStmt.run(
          id, payment.paymentRatio, payment.paymentAmount, payment.paymentDate, payment.paymentAccount
        )
      }
    }
    
    // 获取更新后的订单
    const updatedOrder = db.prepare('SELECT * FROM sales_orders WHERE id = ?').get(id)
    
    console.log('✅ 更新成功')
    
    res.json({
      success: true,
      message: '更新订单成功',
      data: updatedOrder
    })
  } catch (error) {
    console.error('❌ 更新订单失败:', error)
    res.status(500).json({
      success: false,
      message: '更新订单失败',
      error: error.message
    })
  }
})

/**
 * 删除销售订单
 * DELETE /api/sales-orders/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    console.log('=== 删除销售订单 ===', id)
    
    const existing = db.prepare('SELECT id FROM sales_orders WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      })
    }
    
    // 删除订单(级联删除产品和回款计划)
    db.prepare('DELETE FROM sales_orders WHERE id = ?').run(id)
    
    console.log('✅ 删除成功')
    
    res.json({
      success: true,
      message: '删除订单成功'
    })
  } catch (error) {
    console.error('❌ 删除订单失败:', error)
    res.status(500).json({
      success: false,
      message: '删除订单失败',
      error: error.message
    })
  }
})

/**
 * 批量删除
 * POST /api/sales-orders/batch-delete
 */
router.post('/batch-delete', (req, res) => {
  try {
    const { ids } = req.body
    console.log('=== 批量删除销售订单 ===', ids)
    
    if (!ids || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ID列表不能为空'
      })
    }
    
    const placeholders = ids.map(() => '?').join(',')
    const stmt = db.prepare(`DELETE FROM sales_orders WHERE id IN (${placeholders})`)
    const result = stmt.run(...ids)
    
    console.log('✅ 批量删除成功，删除数量:', result.changes)
    
    res.json({
      success: true,
      message: `成功删除 ${result.changes} 个订单`,
      data: {
        deletedCount: result.changes
      }
    })
  } catch (error) {
    console.error('❌ 批量删除订单失败:', error)
    res.status(500).json({
      success: false,
      message: '批量删除订单失败',
      error: error.message
    })
  }
})

module.exports = router
