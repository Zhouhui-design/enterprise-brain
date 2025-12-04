const express = require('express')
const router = express.Router()
const db = require('../config/database')

// ==================== 客户管理API ====================

/**
 * 获取所有客户列表
 * GET /api/customers
 */
router.get('/', async (req, res) => {
  try {
    console.log('=== 获取客户列表 ===')
    
    const { 
      page = 1, 
      pageSize = 20, 
      customerType, 
      status, 
      region,
      search 
    } = req.query
    
    // 构建查询条件
    let whereClause = []
    const params = []
    
    if (customerType) {
      whereClause.push('customer_type = ?')
      params.push(customerType)
    }
    
    if (status) {
      whereClause.push('status = ?')
      params.push(status)
    }
    
    if (region) {
      whereClause.push('region = ?')
      params.push(region)
    }
    
    if (search) {
      whereClause.push('(customer_name LIKE ? OR customer_code LIKE ? OR contact_person LIKE ?)')
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }
    
    const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : ''
    
    // 获取总数
    const countSQL = `SELECT COUNT(*) as total FROM customers ${whereSQL}`
    const countResult = db.prepare(countSQL).get(...params)
    const total = countResult.total
    
    // 获取分页数据
    const offset = (page - 1) * pageSize
    const dataSQL = `
      SELECT * FROM customers 
      ${whereSQL}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `
    const customers = db.prepare(dataSQL).all(...params, parseInt(pageSize), offset)
    
    console.log(`✅ 查询成功，共 ${total} 条记录，当前页 ${customers.length} 条`)
    
    res.json({
      success: true,
      data: {
        list: customers,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    })
  } catch (error) {
    console.error('❌ 获取客户列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取客户列表失败',
      error: error.message
    })
  }
})

/**
 * 根据ID获取客户详情
 * GET /api/customers/:id
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    console.log('=== 获取客户详情 ===', id)
    
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id)
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      })
    }
    
    console.log('✅ 获取成功')
    res.json({
      success: true,
      data: customer
    })
  } catch (error) {
    console.error('❌ 获取客户详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取客户详情失败',
      error: error.message
    })
  }
})

/**
 * 创建新客户
 * POST /api/customers
 */
router.post('/', (req, res) => {
  try {
    console.log('=== 创建客户 ===')
    console.log('请求数据:', req.body)
    
    const {
      customerCode,
      customerName,
      customerType = 'regular',
      status = 'active',
      contactPerson,
      contactPhone,
      contactEmail,
      contactAddress,
      company,
      companyAddress,
      industry,
      region,
      taxNumber,
      creditLevel,
      creditLimit = 0,
      salesPerson,
      source,
      tags,
      remark,
      createdBy = 'admin'
    } = req.body
    
    // 验证必填字段
    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: '客户名称为必填项'
      })
    }
    
   // 自动生成客户编号（如果没有提供）
let finalCustomerCode = customerCode
if (!finalCustomerCode) {
  // 生成格式：C + 年份 + 递增编号
  const year = new Date().getFullYear()
  const count = db.prepare('SELECT COUNT(*) as count FROM customers').get().count
  finalCustomerCode = `C${year}${String(count + 1).padStart(4, '0')}`
  
  console.log('自动生成客户编号:', finalCustomerCode)
}

// 检查客户编号是否已存在
const existing = db.prepare('SELECT id FROM customers WHERE customer_code = ?').get(finalCustomerCode)
if (existing) {
  return res.status(400).json({
    success: false,
    message: '客户编号已存在'
  })
}
    
    // 生成UUID
    const { v4: uuidv4 } = require('uuid')
    const id = uuidv4()
    
    // 插入数据
    const stmt = db.prepare(`
      INSERT INTO customers (
        id, customer_code, customer_name, customer_type, status,
        contact_person, contact_phone, contact_email, contact_address,
        company, company_address, industry, region, tax_number,
        credit_level, credit_limit, sales_person, source,
        tags, remark, created_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `)
    
    const result = stmt.run(
      id, finalCustomerCode, customerName, customerType, status,
      contactPerson, contactPhone, contactEmail, contactAddress,
      company, companyAddress, industry, region, taxNumber,
      creditLevel, creditLimit, salesPerson, source,
      tags ? JSON.stringify(tags) : null, remark, createdBy
    )
    
    // 获取创建的客户
    const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id)
    
    console.log('✅ 创建成功，ID:', id)
    
    res.json({
      success: true,
      message: '创建客户成功',
      data: newCustomer
    })
  } catch (error) {
    console.error('❌ 创建客户失败:', error)
    res.status(500).json({
      success: false,
      message: '创建客户失败',
      error: error.message
    })
  }
})

/**
 * 更新客户信息
 * PUT /api/customers/:id
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    console.log('=== 更新客户 ===', id)
    console.log('请求数据:', req.body)
    
    // 检查客户是否存在
    const existing = db.prepare('SELECT id FROM customers WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      })
    }
    
    const {
      customerCode,
      customerName,
      customerType,
      status,
      contactPerson,
      contactPhone,
      contactEmail,
      contactAddress,
      company,
      companyAddress,
      industry,
      region,
      taxNumber,
      creditLevel,
      creditLimit,
      salesPerson,
      source,
      tags,
      remark,
      updatedBy = 'admin'
    } = req.body
    
    // 如果修改了客户编号，检查是否重复
    if (customerCode) {
      const duplicate = db.prepare('SELECT id FROM customers WHERE customer_code = ? AND id != ?').get(customerCode, id)
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: '客户编号已存在'
        })
      }
    }
    
    // 更新数据
    const stmt = db.prepare(`
      UPDATE customers SET
        customer_code = COALESCE(?, customer_code),
        customer_name = COALESCE(?, customer_name),
        customer_type = COALESCE(?, customer_type),
        status = COALESCE(?, status),
        contact_person = ?,
        contact_phone = ?,
        contact_email = ?,
        contact_address = ?,
        company = ?,
        company_address = ?,
        industry = ?,
        region = ?,
        tax_number = ?,
        credit_level = ?,
        credit_limit = ?,
        sales_person = ?,
        source = ?,
        tags = ?,
        remark = ?,
        updated_by = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `)
    
    stmt.run(
      customerCode, customerName, customerType, status,
      contactPerson, contactPhone, contactEmail, contactAddress,
      company, companyAddress, industry, region, taxNumber,
      creditLevel, creditLimit, salesPerson, source,
      tags ? JSON.stringify(tags) : null, remark, updatedBy,
      id
    )
    
    // 获取更新后的客户
    const updatedCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id)
    
    console.log('✅ 更新成功')
    
    res.json({
      success: true,
      message: '更新客户成功',
      data: updatedCustomer
    })
  } catch (error) {
    console.error('❌ 更新客户失败:', error)
    res.status(500).json({
      success: false,
      message: '更新客户失败',
      error: error.message
    })
  }
})

/**
 * 删除客户
 * DELETE /api/customers/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    console.log('=== 删除客户 ===', id)
    
    // 检查客户是否存在
    const existing = db.prepare('SELECT id FROM customers WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      })
    }
    
    // TODO: 检查是否有关联的订单，如果有则不允许删除
    
    // 删除客户
    db.prepare('DELETE FROM customers WHERE id = ?').run(id)
    
    console.log('✅ 删除成功')
    
    res.json({
      success: true,
      message: '删除客户成功'
    })
  } catch (error) {
    console.error('❌ 删除客户失败:', error)
    res.status(500).json({
      success: false,
      message: '删除客户失败',
      error: error.message
    })
  }
})

/**
 * 批量删除客户
 * POST /api/customers/batch-delete
 */
router.post('/batch-delete', (req, res) => {
  try {
    const { ids } = req.body
    console.log('=== 批量删除客户 ===', ids)
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的客户ID列表'
      })
    }
    
    const placeholders = ids.map(() => '?').join(',')
    const stmt = db.prepare(`DELETE FROM customers WHERE id IN (${placeholders})`)
    const result = stmt.run(...ids)
    
    console.log('✅ 批量删除成功，删除数量:', result.changes)
    
    res.json({
      success: true,
      message: `成功删除 ${result.changes} 个客户`,
      data: {
        deletedCount: result.changes
      }
    })
  } catch (error) {
    console.error('❌ 批量删除客户失败:', error)
    res.status(500).json({
      success: false,
      message: '批量删除客户失败',
      error: error.message
    })
  }
})

/**
 * 获取客户统计信息
 * GET /api/customers/stats
 */
router.get('/statistics/overview', (req, res) => {
  try {
    console.log('=== 获取客户统计信息 ===')
    
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM customers').get().count,
      vip: db.prepare("SELECT COUNT(*) as count FROM customers WHERE customer_type = 'vip'").get().count,
      active: db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'active'").get().count,
      totalRevenue: db.prepare('SELECT SUM(total_amount) as total FROM customers').get().total || 0
    }
    
    console.log('✅ 统计成功:', stats)
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('❌ 获取统计信息失败:', error)
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    })
  }
})

module.exports = router
