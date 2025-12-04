const express = require('express')
const router = express.Router()
const db = require('../config/database')
const { v4: uuidv4 } = require('uuid')

// 获取预计结存列表
router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, salesOrderNo, productCode, productName, startDate, endDate } = req.query
    
    let sql = 'SELECT * FROM projected_balances WHERE 1=1'
    const params = []
    
    if (salesOrderNo) {
      sql += ' AND sales_order_no LIKE ?'
      params.push(`%${salesOrderNo}%`)
    }
    if (productCode) {
      sql += ' AND product_code LIKE ?'
      params.push(`%${productCode}%`)
    }
    if (productName) {
      sql += ' AND product_name LIKE ?'
      params.push(`%${productName}%`)
    }
    if (startDate) {
      sql += ' AND projected_date >= ?'
      params.push(startDate)
    }
    if (endDate) {
      sql += ' AND projected_date <= ?'
      params.push(endDate)
    }
    
    sql += ' ORDER BY submit_time DESC'
    
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total')
    const total = db.prepare(countSql).get(...params).total
    
    sql += ' LIMIT ? OFFSET ?'
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize))
    
    const list = db.prepare(sql).all(...params)
    
    res.json({
      success: true,
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    })
  } catch (error) {
    console.error('获取预计结存列表失败:', error)
    res.status(500).json({ success: false, message: '获取列表失败', error: error.message })
  }
})

// 根据ID获取预计结存
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const balance = db.prepare('SELECT * FROM projected_balances WHERE id = ?').get(id)
    
    if (!balance) {
      return res.status(404).json({ success: false, message: '记录不存在' })
    }
    
    res.json({ success: true, data: balance })
  } catch (error) {
    console.error('获取预计结存失败:', error)
    res.status(500).json({ success: false, message: '获取失败', error: error.message })
  }
})

// 创建预计结存
router.post('/', (req, res) => {
  try {
    const {
      projectedDate, salesOrderNo, productCode, productName,
      quantity, baseUnit = '个', currentInventory = 0
    } = req.body
    
    if (!projectedDate || !productCode || !productName) {
      return res.status(400).json({ success: false, message: '预计发生日期、产品编码和产品名称为必填项' })
    }
    
    const id = uuidv4()
    const year = new Date().getFullYear()
    const count = db.prepare('SELECT COUNT(*) as count FROM projected_balances').get().count
    const transactionNo = `TXN${year}${String(count + 1).padStart(8, '0')}`
    
    // 自动计算
    const projectedBalance = currentInventory - (quantity || 0)
    const availableInventory = currentInventory
    
    const stmt = db.prepare(`
      INSERT INTO projected_balances (
        id, projected_date, sales_order_no, product_code, product_name,
        transaction_no, quantity, base_unit, current_inventory,
        projected_balance, available_inventory, create_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      id, projectedDate, salesOrderNo, productCode, productName,
      transactionNo, quantity || 0, baseUnit, currentInventory,
      projectedBalance, availableInventory, 'admin'
    )
    
    const newBalance = db.prepare('SELECT * FROM projected_balances WHERE id = ?').get(id)
    
    res.json({
      success: true,
      message: '创建预计结存成功',
      data: newBalance
    })
  } catch (error) {
    console.error('创建预计结存失败:', error)
    res.status(500).json({ success: false, message: '创建失败', error: error.message })
  }
})

// 更新预计结存
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    const {
      projectedDate, salesOrderNo, productCode, productName,
      quantity, baseUnit, currentInventory
    } = req.body
    
    const existing = db.prepare('SELECT * FROM projected_balances WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: '记录不存在' })
    }
    
    // 重新计算
    const projectedBalance = currentInventory - (quantity || 0)
    const availableInventory = currentInventory
    
    const stmt = db.prepare(`
      UPDATE projected_balances SET
        projected_date = ?, sales_order_no = ?, product_code = ?,
        product_name = ?, quantity = ?, base_unit = ?,
        current_inventory = ?, projected_balance = ?, available_inventory = ?,
        update_by = ?, update_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    stmt.run(
      projectedDate, salesOrderNo, productCode, productName,
      quantity || 0, baseUnit, currentInventory,
      projectedBalance, availableInventory, 'admin', id
    )
    
    const updatedBalance = db.prepare('SELECT * FROM projected_balances WHERE id = ?').get(id)
    
    res.json({
      success: true,
      message: '更新预计结存成功',
      data: updatedBalance
    })
  } catch (error) {
    console.error('更新预计结存失败:', error)
    res.status(500).json({ success: false, message: '更新失败', error: error.message })
  }
})

// 删除预计结存
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    
    const existing = db.prepare('SELECT * FROM projected_balances WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: '记录不存在' })
    }
    
    db.prepare('DELETE FROM projected_balances WHERE id = ?').run(id)
    
    res.json({
      success: true,
      message: '删除预计结存成功'
    })
  } catch (error) {
    console.error('删除预计结存失败:', error)
    res.status(500).json({ success: false, message: '删除失败', error: error.message })
  }
})

// 批量删除
router.post('/batch-delete', (req, res) => {
  try {
    const { ids } = req.body
    
    if (!ids || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ID列表不能为空' })
    }
    
    const placeholders = ids.map(() => '?').join(',')
    const sql = `DELETE FROM projected_balances WHERE id IN (${placeholders})`
    
    const result = db.prepare(sql).run(...ids)
    
    res.json({
      success: true,
      message: `成功删除${result.changes}条记录`
    })
  } catch (error) {
    console.error('批量删除失败:', error)
    res.status(500).json({ success: false, message: '批量删除失败', error: error.message })
  }
})

module.exports = router
