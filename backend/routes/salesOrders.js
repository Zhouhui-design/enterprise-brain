const express = require('express')
const router = express.Router()
const pool = require('../config/database')
const { v4: uuidv4 } = require('uuid')

/**
 * 将ISO日期格式转换为MySQL DATETIME格式
 * @param {string} isoDate - ISO格式的日期字符串
 * @returns {string|null} - MySQL DATETIME格式或null
 */
function formatDateForMySQL(isoDate) {
  if (!isoDate) return null
  try {
    const date = new Date(isoDate)
    if (isNaN(date.getTime())) return null
    // 格式: YYYY-MM-DD HH:MM:SS
    return date.toISOString().slice(0, 19).replace('T', ' ')
  } catch (error) {
    return null
  }
}

/**
 * 获取销售订单列表
 * GET /api/sales-orders
 */
router.get('/', async (req, res) => {
  let connection
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
    
    connection = await pool.getConnection()
    
    // 查询总数
    const countSQL = `SELECT COUNT(*) as total FROM sales_orders ${whereSQL}`
    const [countResult] = await connection.execute(countSQL, params)
    const total = countResult[0].total
    
    // 分页查询
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const limitPageSize = parseInt(pageSize)
    const dataSQL = `
      SELECT * FROM sales_orders 
      ${whereSQL}
      ORDER BY created_at DESC 
      LIMIT ${limitPageSize} OFFSET ${offset}
    `
    const [orders] = await connection.execute(dataSQL, params)
    
    // 为每个订单查询产品明细
    const ordersWithProducts = await Promise.all(orders.map(async (order) => {
      const [products] = await connection.execute(
        'SELECT * FROM sales_order_products WHERE order_id = ?',
        [order.id]
      )
      
      // 为每个产品查询图片（从物料表中获取）
      const productsWithImage = await Promise.all(products.map(async (product) => {
        try {
          const [materials] = await connection.execute(
            'SELECT material_image FROM materials WHERE material_code = ? LIMIT 1',
            [product.product_code]
          )
          
          return {
            ...product,
            product_image: materials.length > 0 ? materials[0].material_image : null
          }
        } catch (err) {
          console.warn(`查询产品图片失败 (${product.product_code}):`, err.message)
          return product
        }
      }))
      
      // 将产品列表添加到订单中
      return {
        ...order,
        productList: JSON.stringify(productsWithImage), // 存储为JSON字符串，与前端期望一致
        // 同时提取第一个产品的信息到主字段（便于表格显示）
        productCode: productsWithImage.length > 0 ? productsWithImage[0].product_code : null,
        productName: productsWithImage.length > 0 ? productsWithImage[0].product_name : null,
        productImage: productsWithImage.length > 0 ? productsWithImage[0].product_image : null,
        productSpec: productsWithImage.length > 0 ? productsWithImage[0].product_spec : null,
        productColor: productsWithImage.length > 0 ? productsWithImage[0].product_color : null,
        productUnit: productsWithImage.length > 0 ? productsWithImage[0].product_unit : null,
        orderQuantity: productsWithImage.length > 0 ? productsWithImage[0].order_quantity : null
      }
    }))
    
    console.log(`✅ 查询成功，共 ${total} 条记录，当前页 ${orders.length} 条`)
    
    res.json({
      success: true,
      data: {
        list: ordersWithProducts,
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
  } finally {
    if (connection) connection.release()
  }
})

/**
 * 根据ID获取订单详情
 * GET /api/sales-orders/:id
 */
router.get('/:id', async (req, res) => {
  let connection
  try {
    const { id } = req.params
    console.log('=== 获取订单详情 ===', id)
    
    connection = await pool.getConnection()
    
    const [orders] = await connection.execute('SELECT * FROM sales_orders WHERE id = ?', [id])
    
    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      })
    }
    
    const order = orders[0]
    
    // 获取产品明细
    const [products] = await connection.execute('SELECT * FROM sales_order_products WHERE order_id = ?', [id])
    
    // 获取回款计划
    const [paymentSchedule] = await connection.execute('SELECT * FROM sales_order_payment_schedule WHERE order_id = ?', [id])
    
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
  } finally {
    if (connection) connection.release()
  }
})

/**
 * 创建销售订单
 * POST /api/sales-orders
 */
router.post('/', async (req, res) => {
  let connection
  try {
    console.log('=== 创建销售订单 ===')
    console.log('请求数据:', JSON.stringify(req.body, null, 2))
    
    const id = uuidv4()
    
    connection = await pool.getConnection()
    
    // 自动生成内部订单编号
    const year = new Date().getFullYear()
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM sales_orders')
    const count = countResult[0].count
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
    
    // 开始事务
    await connection.beginTransaction()
    
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
      
      // 插入产品明细
      if (products && products.length > 0) {
        for (const product of products) {
          await connection.execute(`
            INSERT INTO sales_order_products (
              order_id, product_code, product_name, product_spec, product_color,
              product_unit, order_quantity, unit_price_excluding_tax, tax_rate,
              total_price_excluding_tax, total_tax, total_price, accessories
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            id, 
            product.productCode || null, 
            product.productName || null, 
            product.productSpec || null, 
            product.productColor || null,
            product.productUnit || null, 
            product.orderQuantity || 0, 
            product.unitPriceExcludingTax || 0, 
            product.taxRate || 0,
            product.totalPriceExcludingTax || 0, 
            product.totalTax || 0, 
            product.totalPrice || 0,
            product.accessories ? JSON.stringify(product.accessories) : null
          ])
        }
      }
      
      // 插入回款计划
      if (paymentSchedule && paymentSchedule.length > 0) {
        for (const payment of paymentSchedule) {
          await connection.execute(`
            INSERT INTO sales_order_payment_schedule (
              order_id, payment_ratio, payment_amount, payment_date, payment_account
            ) VALUES (?, ?, ?, ?, ?)
          `, [
            id, 
            payment.paymentRatio || 0, 
            payment.paymentAmount || 0, 
            formatDateForMySQL(payment.paymentDate), 
            payment.paymentAccount || null
          ])
        }
      }
      
      // 提交事务
      await connection.commit()
      
      // 获取创建的订单
      const [newOrders] = await connection.execute('SELECT * FROM sales_orders WHERE id = ?', [id])
      
      console.log('✅ 创建成功，订单号:', internalOrderNo)
      
      res.json({
        success: true,
        message: '创建订单成功',
        data: newOrders[0]
      })
    } catch (error) {
      // 回滚事务
      await connection.rollback()
      throw error
    }
  } catch (error) {
    console.error('❌ 创建订单失败:', error)
    res.status(500).json({
      success: false,
      message: '创建订单失败',
      error: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * 更新销售订单
 * PUT /api/sales-orders/:id
 */
router.put('/:id', async (req, res) => {
  let connection
  try {
    const { id } = req.params
    console.log('=== 更新销售订单 ===', id)
    
    connection = await pool.getConnection()
    
    // 检查订单是否存在
    const [existing] = await connection.execute('SELECT id FROM sales_orders WHERE id = ?', [id])
    if (!existing || existing.length === 0) {
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
    
    // 开始事务
    await connection.beginTransaction()
    
    try {
      // 更新主订单
      await connection.execute(`
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
          status = ?, updated_by = ?
        WHERE id = ?
      `, [
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
      ])
      
      // 删除旧的产品明细和回款计划
      await connection.execute('DELETE FROM sales_order_products WHERE order_id = ?', [id])
      await connection.execute('DELETE FROM sales_order_payment_schedule WHERE order_id = ?', [id])
      
      // 重新插入产品明细
      if (products && products.length > 0) {
        for (const product of products) {
          await connection.execute(`
            INSERT INTO sales_order_products (
              order_id, product_code, product_name, product_spec, product_color,
              product_unit, order_quantity, unit_price_excluding_tax, tax_rate,
              total_price_excluding_tax, total_tax, total_price, accessories
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            id, product.productCode, product.productName, product.productSpec, product.productColor,
            product.productUnit, product.orderQuantity, product.unitPriceExcludingTax, product.taxRate,
            product.totalPriceExcludingTax, product.totalTax, product.totalPrice,
            product.accessories ? JSON.stringify(product.accessories) : null
          ])
        }
      }
      
      // 重新插入回款计划
      if (paymentSchedule && paymentSchedule.length > 0) {
        for (const payment of paymentSchedule) {
          await connection.execute(`
            INSERT INTO sales_order_payment_schedule (
              order_id, payment_ratio, payment_amount, payment_date, payment_account
            ) VALUES (?, ?, ?, ?, ?)
          `, [
            id, payment.paymentRatio, payment.paymentAmount, payment.paymentDate, payment.paymentAccount
          ])
        }
      }
      
      // 提交事务
      await connection.commit()
      
      // 获取更新后的订单
      const [updatedOrders] = await connection.execute('SELECT * FROM sales_orders WHERE id = ?', [id])
      
      console.log('✅ 更新成功')
      
      res.json({
        success: true,
        message: '更新订单成功',
        data: updatedOrders[0]
      })
    } catch (error) {
      // 回滚事务
      await connection.rollback()
      throw error
    }
  } catch (error) {
    console.error('❌ 更新订单失败:', error)
    res.status(500).json({
      success: false,
      message: '更新订单失败',
      error: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * 删除销售订单
 * DELETE /api/sales-orders/:id
 */
router.delete('/:id', async (req, res) => {
  let connection
  try {
    const { id } = req.params
    console.log('=== 删除销售订单 ===', id)
    
    connection = await pool.getConnection()
    
    const [existing] = await connection.execute('SELECT id FROM sales_orders WHERE id = ?', [id])
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      })
    }
    
    // 删除订单(级联删除产品和回款计划)
    await connection.execute('DELETE FROM sales_orders WHERE id = ?', [id])
    
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
  } finally {
    if (connection) connection.release()
  }
})

/**
 * 批量删除
 * POST /api/sales-orders/batch-delete
 */
router.post('/batch-delete', async (req, res) => {
  let connection
  try {
    const { ids } = req.body
    console.log('=== 批量删除销售订单 ===', ids)
    
    if (!ids || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ID列表不能为空'
      })
    }
    
    connection = await pool.getConnection()
    
    const placeholders = ids.map(() => '?').join(',')
    const [result] = await connection.execute(`DELETE FROM sales_orders WHERE id IN (${placeholders})`, ids)
    
    console.log('✅ 批量删除成功，删除数量:', result.affectedRows)
    
    res.json({
      success: true,
      message: `成功删除 ${result.affectedRows} 个订单`,
      data: {
        deletedCount: result.affectedRows
      }
    })
  } catch (error) {
    console.error('❌ 批量删除订单失败:', error)
    res.status(500).json({
      success: false,
      message: '批量删除订单失败',
      error: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * 获取订单产品明细
 * GET /api/sales-orders/:id/products
 */
router.get('/:id/products', async (req, res) => {
  let connection
  try {
    const { id } = req.params
    console.log('=== 获取订单产品明细 ===', id)
    
    connection = await pool.getConnection()
    const [products] = await connection.execute('SELECT * FROM sales_order_products WHERE order_id = ?', [id])
    
    console.log('✅ 获取产品明细成功')
    res.json({
      success: true,
      data: products
    })
  } catch (error) {
    console.error('❌ 获取产品明细失败:', error)
    res.status(500).json({
      success: false,
      message: '获取产品明细失败',
      error: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * 获取订单回款计划
 * GET /api/sales-orders/:id/payments
 */
router.get('/:id/payments', async (req, res) => {
  let connection
  try {
    const { id } = req.params
    console.log('=== 获取订单回款计划 ===', id)
    
    connection = await pool.getConnection()
    const [payments] = await connection.execute('SELECT * FROM sales_order_payment_schedule WHERE order_id = ?', [id])
    
    console.log('✅ 获取回款计划成功')
    res.json({
      success: true,
      data: payments
    })
  } catch (error) {
    console.error('❌ 获取回款计划失败:', error)
    res.status(500).json({
      success: false,
      message: '获取回款计划失败',
      error: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

module.exports = router
