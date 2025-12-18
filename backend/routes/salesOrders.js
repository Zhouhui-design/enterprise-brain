const express = require('express')
const router = express.Router()
const { pool } = require('../config/database')
const { v4: uuidv4 } = require('uuid')

/**
 * 将ISO日期格式转换为MySQL DATETIME格式
 * @param {string} isoDate - ISO格式的日期字符串
 * @returns {string|null} - MySQL DATETIME格式或null
 */
function formatDateForMySQL(dateStr) {
  if (!dateStr) return null;
  try {
    // 如果已经是YYYY-MM-DD格式，直接使用
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr + ' 00:00:00'; // 添加时间部分用于DATETIME字段
    }
    
    // ✅ 关键修复：对于ISO 8601格式（含有T），使用Date对象转换为本地时间
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    
    // 使用本地时间方法，让JS自动处理时区转换
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('日期格式化失败:', dateStr, error);
    return null;
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
        orderQuantity: productsWithImage.length > 0 ? productsWithImage[0].order_quantity : null,
        output_process: productsWithImage.length > 0 ? productsWithImage[0].output_process : null // ✅ 添加产出工序字段
      }
    }))
    
    // ✅ 修复：将日期字段格式化为字符串，使用本地时间避免时区转换问题
    const formattedOrders = ordersWithProducts.map(order => {
      const customerDeliveryFormatted = order.customer_delivery ? order.customer_delivery.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') : null;
      
      console.log('🔍 调试订单日期格式化:', {
        internal_order_no: order.internal_order_no,
        原始值: order.customer_delivery,
        格式化后: customerDeliveryFormatted
      });
      
      return {
        ...order,
        customer_delivery: customerDeliveryFormatted,
        promised_delivery: order.promised_delivery ? order.promised_delivery.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') : null,
        estimated_completion_date: order.estimated_completion_date ? order.estimated_completion_date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') : null,
        order_time: order.order_time ? order.order_time.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') : null,
        created_at: order.created_at ? order.created_at.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') : null,
        updated_at: order.updated_at ? order.updated_at.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') : null
      };
    });

    console.log(`✅ 查询成功，共 ${total} 条记录，当前页 ${formattedOrders.length} 条`)
    
    res.json({
      success: true,
      data: {
        list: formattedOrders,
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
    
    // ✅ 修复：将日期字段格式化为字符串，使用本地时间避免时区转换问题
    const formattedOrder = {
      ...order,
      customer_delivery: order.customer_delivery ? order.customer_delivery.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') : null,
      promised_delivery: order.promised_delivery ? order.promised_delivery.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') : null,
      estimated_completion_date: order.estimated_completion_date ? order.estimated_completion_date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') : null,
      order_time: order.order_time ? order.order_time.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') : null,
      created_at: order.created_at ? order.created_at.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') : null,
      updated_at: order.updated_at ? order.updated_at.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') : null
    };
    
    console.log('✅ 获取成功')
    res.json({
      success: true,
      data: {
        ...formattedOrder,
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
          salesperson, submitter, quotation_no, order_type,
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, internalOrderNo, customerOrderNo || null, customerName, customerId || null,
        salesperson || null, 'admin', quotationNo || null, orderType || null,
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
            product.taxRate || 0,
            product.totalPriceExcludingTax || 0, 
            product.totalTax || 0, 
            product.totalPrice || 0,
            product.accessories ? JSON.stringify(product.accessories) : null,
            product.outputProcess || null  // ✅ 关键：保存产出工序
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
    console.log('请求数据:', req.body)
    
    connection = await pool.getConnection()
    
    // 检查订单是否存在
    const [existing] = await connection.execute('SELECT * FROM sales_orders WHERE id = ?', [id])
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      })
    }
    
    // 如果只有status字段，只更新状态
    if (Object.keys(req.body).length === 1 && req.body.status) {
      await connection.execute(
        'UPDATE sales_orders SET status = ?, updated_by = ? WHERE id = ?',
        [req.body.status, 'admin', id]
      )
      
      const [updatedOrders] = await connection.execute('SELECT * FROM sales_orders WHERE id = ?', [id])
      
      console.log('✅ 更新状态成功:', req.body.status)
      
      return res.json({
        success: true,
        message: '更新订单状态成功',
        data: updatedOrders[0]
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
              total_price_excluding_tax, total_tax, total_price, accessories, output_process
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            id, product.productCode, product.productName, product.productSpec, product.productColor,
            product.productUnit, product.orderQuantity, product.unitPriceExcludingTax, product.taxRate,
            product.totalPriceExcludingTax, product.totalTax, product.totalPrice,
            product.accessories ? JSON.stringify(product.accessories) : null,
            product.outputProcess || null  // ✅ 关键：保存产出工序
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
  const startTime = Date.now()
  try {
    const { id } = req.params
    const userId = req.user?.id || 'anonymous' // 假设有用户信息
    console.log('=== 删除销售订单 ===', { id, userId })
    
    connection = await pool.getConnection()
    await connection.beginTransaction() // 开启事务
    
    // ✅ 需求2：先查询订单完整信息，包括状态检查
    const [existing] = await connection.execute(
      'SELECT id, internal_order_no, status, order_no FROM sales_orders WHERE id = ?',
      [id]
    )
    
    if (!existing || existing.length === 0) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      })
    }
    
    const orderInfo = existing[0];
    const { internal_order_no: internalOrderNo, status, order_no } = orderInfo;
    
    // 🛡️ 安全检查1：订单状态检查
    if (status && status !== 'draft') {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: `只能删除草稿状态的订单，当前状态：${status}`
      })
    }
    
    // 🛡️ 安全检查2：检查是否存在活跃的生产计划
    const [activeProduction] = await connection.execute(
      'SELECT COUNT(*) as count FROM master_production_plans WHERE internal_order_no = ? AND status NOT IN ("completed", "cancelled")',
      [internalOrderNo]
    );
    
    if (activeProduction[0].count > 0) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: '订单存在活跃的生产计划，无法删除'
      })
    }
    
    console.log('🗑️ 开始删除订单:', { id, internalOrderNo, order_no: order_no });
    
    // 📊 记录删除影响的统计信息
    const deleteStats = {
      masterProductionPlans: 0,
      materialPreparationPlans: 0,
      procurementPlans: 0,
      processPlans: 0,
      assemblyPlans: 0,
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
      await connection.rollback()
      return res.status(500).json({
        success: false,
        message: '删除主生产计划失败',
        error: error.message
      })
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
      await connection.rollback()
      return res.status(500).json({
        success: false,
        message: '删除备料计划失败',
        error: error.message
      })
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
      await connection.rollback()
      return res.status(500).json({
        success: false,
        message: '删除采购计划失败',
        error: error.message
      })
    }
    
    // 🗂️ 阶段4：删除工序计划（real_process_plans）
    try {
      const [processPlanResult] = await connection.execute(
        'DELETE FROM real_process_plans WHERE sales_order_no = ?',
        [internalOrderNo]
      );
      deleteStats.processPlans = processPlanResult.affectedRows;
      console.log(`✅ 级联删除工序计划: ${processPlanResult.affectedRows} 条`);
    } catch (error) {
      console.error('❌ 删除工序计划失败:', error.message);
      await connection.rollback()
      return res.status(500).json({
        success: false,
        message: '删除工序计划失败',
        error: error.message
      })
    }
    
    // 🗂️ 阶段5：删除组装工序计划
    try {
      const [assemblyPlanResult] = await connection.execute(
        'DELETE FROM assembly_process_plans WHERE sales_order_no = ?',
        [internalOrderNo]
      );
      deleteStats.assemblyPlans = assemblyPlanResult.affectedRows;
      console.log(`✅ 级联删除组装工序计划: ${assemblyPlanResult.affectedRows} 条`);
    } catch (error) {
      console.error('❌ 删除组装工序计划失败:', error.message);
      await connection.rollback()
      return res.status(500).json({
        success: false,
        message: '删除组装工序计划失败',
        error: error.message
      })
    }
    
    // 🗂️ 阶段6：删除其他工序计划表（只包含确认存在的表）
    const otherProcessTables = [
      'packing_process_plans',           // 打包工序计划
      'sewing_process_plans',           // 缝纫工序计划
      'shot_blasting_process_plans',     // 抛丸工序计划
      'manual_welding_process_plans',    // 人工焊接工序计划
      'tube_bending_process_plans',      // 弯管工序计划
      'laser_tube_cutting_process_plans', // 激光切管工序计划
      'laser_cutting_process_plans',     // 激光下料工序计划
      'bending_process_plans',           // 折弯工序计划
      'drilling_process_plans',           // 打孔工序计划
      'punching_process_plans',           // 冲床工序计划
      'manual_cutting_process_plans',     // 人工下料工序计划
      'machine_grinding_process_plans',    // 机器打磨工序计划
      'cutting_process_plans',            // 裁剪工序计划
      'spray_painting_process_plans'       // 喷塑工序计划（可能不存在）
    ];
    
    for (const tableName of otherProcessTables) {
      try {
        const [result] = await connection.execute(
          `DELETE FROM ${tableName} WHERE sales_order_no = ?`,
          [internalOrderNo]
        );
        if (result.affectedRows > 0) {
          deleteStats.otherPlans += result.affectedRows;
          console.log(`✅ 级联删除${tableName}: ${result.affectedRows} 条`);
        }
      } catch (error) {
        console.warn(`⚠️ 删除${tableName}失败（表可能不存在）:`, error.message);
        // 不回滚，继续执行其他表的删除
      }
    }
    
    // 🗂️ 阶段7：删除订单产品和支付计划
    try {
      const [productResult] = await connection.execute(
        'DELETE FROM order_products WHERE order_id = ?',
        [id]
      );
      console.log(`✅ 级联删除订单产品: ${productResult.affectedRows} 条`);
      
      const [paymentResult] = await connection.execute(
        'DELETE FROM order_payment_schedules WHERE order_id = ?',
        [id]
      );
      console.log(`✅ 级联删除支付计划: ${paymentResult.affectedRows} 条`);
    } catch (error) {
      console.error('❌ 删除订单明细失败:', error.message);
      await connection.rollback()
      return res.status(500).json({
        success: false,
        message: '删除订单明细失败',
        error: error.message
      })
    }
    
    // 🗂️ 阶段8：删除主订单记录
    try {
      const [orderResult] = await connection.execute(
        'DELETE FROM sales_orders WHERE id = ?',
        [id]
      );
      
      if (orderResult.affectedRows === 0) {
        await connection.rollback()
        return res.status(404).json({
          success: false,
          message: '订单不存在或已被删除'
        })
      }
      
      console.log(`✅ 删除主订单记录成功`);
    } catch (error) {
      console.error('❌ 删除主订单失败:', error.message);
      await connection.rollback()
      return res.status(500).json({
        success: false,
        message: '删除主订单失败',
        error: error.message
      })
    }
    
    // 📝 记录删除审计日志
    try {
      await connection.execute(`
        INSERT INTO system_logs 
        (operation_type, table_name, record_id, user_id, operation_details, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [
        'DELETE',
        'sales_orders',
        id,
        userId,
        JSON.stringify({
          order_no: order_no,
          internal_order_no: internalOrderNo,
          delete_stats: deleteStats,
          execution_time: Date.now() - startTime
        })
      ]);
    } catch (error) {
      console.warn('⚠️ 记录审计日志失败:', error.message);
      // 不影响主流程
    }
    
    // 提交事务
    await connection.commit()
    
    console.log('🎉 订单删除完成:', {
      order_no: order_no,
      internal_order_no: internalOrderNo,
      total_deleted: Object.values(deleteStats).reduce((sum, count) => sum + count, 0) + 1,
      execution_time: Date.now() - startTime
    });
    
    res.json({
      success: true,
      message: '订单删除成功',
      data: {
        order_no: order_no,
        internal_order_no: internalOrderNo,
        delete_stats: deleteStats,
        execution_time: Date.now() - startTime
      }
    })
  } catch (error) {
    console.error('❌ 删除订单失败:', error.message)
    if (connection) await connection.rollback()
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
    await connection.beginTransaction()
    
    let totalMasterPlans = 0
    let totalMaterialPlans = 0
    let totalProcessPlans = 0
    let totalRealProcessPlans = 0
    let totalAssemblyPlans = 0
    // let totalSprayPaintingPlans = 0 // 喷塑工序计划表不存在
    let totalSewingPlans = 0
    let totalPackingPlans = 0
    let totalShotBlastingPlans = 0
    let totalManualWeldingPlans = 0
    let totalTubeBendingPlans = 0
    let totalLaserTubeCuttingPlans = 0
    let totalLaserCuttingPlans = 0
    let totalBendingPlans = 0
    let totalDrillingPlans = 0
    let totalPunchingPlans = 0
    let totalManualCuttingPlans = 0
    let totalMachineGrindingPlans = 0
    let totalCuttingPlans = 0
    const affectedProcessDates = new Set() // 记录受影响的工序+日期
    
    // 逐个处理，确保级联删除
    for (const id of ids) {
      // 1. 查询订单的internal_order_no
      const [orderRows] = await connection.execute(
        'SELECT internal_order_no FROM sales_orders WHERE id = ?',
        [id]
      )
      
      if (orderRows.length > 0) {
        const internalOrderNo = orderRows[0].internal_order_no
        
        // 2. 级联删除主生产计划
        const [masterPlanResult] = await connection.execute(
          'DELETE FROM master_production_plans WHERE internal_order_no = ?',
          [internalOrderNo]
        )
        totalMasterPlans += masterPlanResult.affectedRows
        
        // 3. 级联删除备料计划
        const [materialPlanResult] = await connection.execute(
          'DELETE FROM material_preparation_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        )
        totalMaterialPlans += materialPlanResult.affectedRows
        
        // 4. 级联删除工序计划
        const [processPlanResult] = await connection.execute(
          'DELETE FROM real_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        totalProcessPlans += processPlanResult.affectedRows;
        
        // 4.1 级联删除组装工序计划
        const [assemblyPlanResult] = await connection.execute(
          'DELETE FROM assembly_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        totalAssemblyPlans += assemblyPlanResult.affectedRows;
        
        // 4.2 级联删除喷塑工序计划（packing_process_plans表）
        const [packingPlanResult] = await connection.execute(
          'DELETE FROM packing_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        totalPackingPlans += packingPlanResult.affectedRows;
        
        // 4.3 级联删除缝纫工序计划
        const [sewingPlanResult] = await connection.execute(
          'DELETE FROM sewing_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        totalSewingPlans += sewingPlanResult.affectedRows;
        
        // 4.4-4.14 级联删除11个新工序计划
        const [shotBlastingPlanResult] = await connection.execute(
          'DELETE FROM shot_blasting_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        totalShotBlastingPlans += shotBlastingPlanResult.affectedRows;
        
        const [manualWeldingPlanResult] = await connection.execute(
          'DELETE FROM manual_welding_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        totalManualWeldingPlans += manualWeldingPlanResult.affectedRows;
        
        const [tubeBendingPlanResult] = await connection.execute(
          'DELETE FROM tube_bending_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        totalTubeBendingPlans += tubeBendingPlanResult.affectedRows;
        
        const [laserTubeCuttingPlanResult] = await connection.execute(
          'DELETE FROM laser_tube_cutting_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        totalLaserTubeCuttingPlans += laserTubeCuttingPlanResult.affectedRows;
        
        const [laserCuttingPlanResult] = await connection.execute(
          'DELETE FROM laser_cutting_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        totalLaserCuttingPlans += laserCuttingPlanResult.affectedRows;
        
        const [bendingPlanResult] = await connection.execute(
          'DELETE FROM bending_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        totalBendingPlans += bendingPlanResult.affectedRows;
        
        const [drillingPlanResult] = await connection.execute(
          'DELETE FROM drilling_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        totalDrillingPlans += drillingPlanResult.affectedRows;
        
        const [punchingPlanResult] = await connection.execute(
          'DELETE FROM punching_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        totalPunchingPlans += punchingPlanResult.affectedRows;
        
        const [manualCuttingPlanResult] = await connection.execute(
          'DELETE FROM manual_cutting_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        totalManualCuttingPlans += manualCuttingPlanResult.affectedRows;
        
        const [machineGrindingPlanResult] = await connection.execute(
          'DELETE FROM machine_grinding_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        totalMachineGrindingPlans += machineGrindingPlanResult.affectedRows;
        
        const [cuttingPlanResult] = await connection.execute(
          'DELETE FROM cutting_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        totalCuttingPlans += cuttingPlanResult.affectedRows;
        
        // 4.15 旧的喷塑工序计划表（表不存在，跳过）
        console.log('⚠️ 跳过不存在的喷塑工序计划表: spray_painting_process_plans');
        
        // 5. 级联删除真工序计划(打包) - 先记录受影响的工序+日期
        const [realProcessPlans] = await connection.execute(
          'SELECT process_name, DATE_FORMAT(schedule_date, \'%Y-%m-%d\') as schedule_date FROM real_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        
        // 记录受影响的工序+日期
        realProcessPlans.forEach(plan => {
          if (plan.process_name && plan.schedule_date) {
            // ✅ 使用本地时区格式化，避免时区偏移
            let scheduleDate;
            if (plan.schedule_date instanceof Date) {
              const year = plan.schedule_date.getFullYear();
              const month = String(plan.schedule_date.getMonth() + 1).padStart(2, '0');
              const day = String(plan.schedule_date.getDate()).padStart(2, '0');
              scheduleDate = `${year}-${month}-${day}`;
            } else {
              scheduleDate = String(plan.schedule_date).split('T')[0];
            }
            affectedProcessDates.add(`${plan.process_name}|${scheduleDate}`);
          }
        });
        
        const [realProcessPlanResult] = await connection.execute(
          'DELETE FROM real_process_plans WHERE sales_order_no = ?',
          [internalOrderNo]
        );
        totalRealProcessPlans += realProcessPlanResult.affectedRows;
        
        // 6. 删除订单
        await connection.execute(
          'DELETE FROM sales_orders WHERE id = ?',
          [id]
        )
      }
    }
    
    // ✅ 批量重置受影响的工序+日期的已占用工时
    console.log(`🔄 批量重置 ${affectedProcessDates.size} 个工序+日期的已占用工时`)
    
    for (const key of affectedProcessDates) {
      const [processName, scheduleDate] = key.split('|')
      
      try {
        // ✅ SUMIF - 重新统计该工序+日期下所有真工序计划的计划排程工时总和
        const [sumRows] = await connection.execute(
          `SELECT COALESCE(SUM(scheduled_work_hours), 0) as total_hours 
           FROM real_process_plans 
           WHERE process_name = ? 
             AND schedule_date = ?`,
          [processName, scheduleDate]
        )
        
        const sumResult = sumRows[0].total_hours
        const validResult = sumResult !== null && sumResult !== undefined ? parseFloat(sumResult) : 0
        const newOccupiedHours = parseFloat(validResult.toFixed(2))
        
        // ✅ 查询工序能力负荷记录
        const [capacityRows] = await connection.execute(
          'SELECT id, work_shift, available_workstations, occupied_hours FROM process_capacity_load WHERE process_name = ? AND date = ?',
          [processName, scheduleDate]
        )
        
        if (capacityRows.length > 0) {
          const record = capacityRows[0]
          const previousOccupiedHours = parseFloat(record.occupied_hours || 0)
          const workShift = parseFloat(record.work_shift || 0)
          const availableWorkstations = parseFloat(record.available_workstations || 0)
          
          // ✅ 重新计算剩余工时和剩余时段
          const newRemainingHours = parseFloat(
            (workShift * availableWorkstations - newOccupiedHours).toFixed(2)
          )
          
          let newRemainingShift = null
          if (availableWorkstations > 0) {
            newRemainingShift = parseFloat(
              (newRemainingHours / availableWorkstations).toFixed(2)
            )
          }
          
          // ✅ 更新数据库
          await connection.execute(
            `UPDATE process_capacity_load 
             SET occupied_hours = ?, 
                 remaining_hours = ?, 
                 remaining_shift = ?,
                 updated_at = NOW()
             WHERE id = ?`,
            [newOccupiedHours, newRemainingHours, newRemainingShift, record.id]
          )
          
          console.log(`✅ [工序=${processName}, 日期=${scheduleDate}] ${previousOccupiedHours} → ${newOccupiedHours}`)
        }
      } catch (error) {
        console.error(`⚠️ [工序=${processName}, 日期=${scheduleDate}] 重置失败:`, error.message)
        // 继续处理其他记录
      }
    }
    
    await connection.commit()
    
    console.log('✅ 批量删除成功，删除数量:', {
      orders: ids.length,
      masterPlans: totalMasterPlans,
      materialPlans: totalMaterialPlans,
      processPlans: totalProcessPlans,
      realProcessPlans: totalRealProcessPlans,
      assemblyPlans: totalAssemblyPlans,
      sprayPaintingPlans: 0, // totalSprayPaintingPlans - 表不存在
      sewingPlans: totalSewingPlans
    })
    
    res.json({
      success: true,
      message: `成功删除 ${ids.length} 个订单（同时删除 ${totalMasterPlans} 条主生产计划、${totalMaterialPlans} 条备料计划、${totalProcessPlans} 条工序计划、${totalRealProcessPlans} 条打包工序计划、${totalAssemblyPlans} 条组装工序计划、0 条喷塑工序计划、${totalSewingPlans} 条缝纫工序计划）`,
      data: {
        deletedCount: ids.length,
        masterPlansDeleted: totalMasterPlans,
        materialPlansDeleted: totalMaterialPlans,
        processPlansDeleted: totalProcessPlans,
        realProcessPlansDeleted: totalRealProcessPlans,
        assemblyPlansDeleted: totalAssemblyPlans,
        sprayPaintingPlansDeleted: 0, // totalSprayPaintingPlans - 表不存在
        sewingPlansDeleted: totalSewingPlans
      }
    })
  } catch (error) {
    if (connection) {
      await connection.rollback()
    }
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
 * 确认下单 - 推送数据到主生产计划或采购计划
 * POST /api/sales-orders/confirm-order
 */
router.post('/confirm-order', async (req, res) => {
  let connection
  try {
    const { ids } = req.body
    console.log('=== 确认下单 ===', ids)
    
    if (!ids || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择至少一个订单'
      })
    }
    
    connection = await pool.getConnection()
    await connection.beginTransaction()
    
    let totalMasterPlans = 0 // 推送到主生产计划数量
    let totalProcurementPlans = 0 // 推送到采购计划数量
    
    try {
      // 遍历每个订单
      for (const orderId of ids) {
        // 1. 查询订单及产品明细
        const [orders] = await connection.execute(
          'SELECT * FROM sales_orders WHERE id = ?',
          [orderId]
        )
        
        if (orders.length === 0) {
          console.warn(`订单 ${orderId} 不存在`)
          continue
        }
        
        const order = orders[0]
        
        // 2. 查询产品明细(包含output_process)
        const [products] = await connection.execute(
          'SELECT * FROM sales_order_products WHERE order_id = ?',
          [orderId]
        )
        
        if (products.length === 0) {
          console.warn(`订单 ${order.internal_order_no} 无产品明细`)
          continue
        }
        
        // 3. 查询库存以计算建议补货数量
        const [inventoryRows] = await connection.execute(
          `SELECT material_code, COALESCE(available_quantity, 0) as available_quantity 
           FROM inventory`
        )
        const inventoryMap = new Map()
        inventoryRows.forEach(row => {
          inventoryMap.set(row.material_code, row.available_quantity)
        })
        
        // 4. 遍历产品，根据产出工序分流
        for (const product of products) {
          const outputProcess = product.output_process || ''
          const productCode = product.product_code
          const availableStock = inventoryMap.get(productCode) || 0
          const suggestedQty = Math.max(0, product.order_quantity - availableStock)
          
          if (outputProcess === '采购' && suggestedQty > 0) {
            // ===== 推送到采购计划（仅当产出工序=采购 且 建议补货数量>0时） =====
            // ✅ 修复：生成唯一的采购计划编号，避免重复
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
            const timestamp = Date.now().toString().slice(-4)
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
            const procurementPlanNo = `CG${today}${timestamp}${random}`
            
            // 查询物料的默认采购提前期
            const [materialRows] = await connection.execute(
              `SELECT default_procurement_lead_time FROM materials WHERE material_code = ?`,
              [productCode]
            )
            const defaultLeadTime = materialRows.length > 0 ? (materialRows[0].default_procurement_lead_time || 3) : 3
            
            // 计算计划到货日期 = 客户交期 - 采购提前期
            let planArrivalDate = null
            if (order.customer_delivery) {
              const customerDelivery = new Date(order.customer_delivery)
              customerDelivery.setDate(customerDelivery.getDate() - defaultLeadTime)
              planArrivalDate = customerDelivery.toISOString().split('T')[0]
            }
            
            // 插入采购计划
            console.log(`📤 准备推送到采购计划: 产品=${product.product_name}, 建议补货数量=${suggestedQty}`);
            await connection.execute(
              `INSERT INTO procurement_plans (
                procurement_plan_no, source_form_name, source_no,
                material_code, material_name, required_quantity, base_unit,
                sales_order_no, customer_order_no,
                procurement_lead_time, plan_arrival_date,
                procurement_status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                procurementPlanNo,
                '销售订单列表',
                order.internal_order_no,
                productCode,
                product.product_name,
                suggestedQty,
                product.product_unit,
                order.internal_order_no,
                order.customer_order_no,
                defaultLeadTime,
                planArrivalDate,
                'PENDING_INQUIRY'
              ]
            )
            
            totalProcurementPlans++
            console.log(`✅ 推送到采购计划: ${procurementPlanNo} (${product.product_name})`)
          } else {
            // ===== 推送到主生产计划 =====
            // ✅ 修复：生成唯一的主生产计划编号，避免重复
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
            const timestamp = Date.now().toString().slice(-4)
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
            const planCode = `MP${today}${timestamp}${random}`
            
            // 插入主生产计划
            await connection.execute(
              `INSERT INTO master_production_plans (
                plan_code, product_code, product_name, order_quantity,
                salesperson, sales_unit, available_stock, plan_quantity,
                output_process, promised_delivery_date, status,
                internal_order_no, customer_order_no, customer_name
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                planCode,
                productCode,
                product.product_name,
                product.order_quantity,
                order.salesperson,
                product.product_unit,
                availableStock,
                suggestedQty,
                outputProcess,
                order.promised_delivery || order.customer_delivery,
                '已下单',
                order.internal_order_no,
                order.customer_order_no,
                order.customer_name
              ]
            )
            
            totalMasterPlans++
            console.log(`✅ 推送到主生产计划: ${planCode} (${product.product_name})`)
          }
        }
        
        // 5. 更新订单状态
        await connection.execute(
          'UPDATE sales_orders SET status = ? WHERE id = ?',
          ['已确认', orderId]
        )
      }
      
      await connection.commit()
      
      res.json({
        success: true,
        message: `确认下单成功！推送 ${totalMasterPlans} 条到主生产计划，${totalProcurementPlans} 条到采购计划`,
        data: {
          masterPlansCreated: totalMasterPlans,
          procurementPlansCreated: totalProcurementPlans
        }
      })
    } catch (error) {
      await connection.rollback()
      throw error
    }
  } catch (error) {
    console.error('❌ 确认下单失败:', error)
    res.status(500).json({
      success: false,
      message: '确认下单失败',
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
