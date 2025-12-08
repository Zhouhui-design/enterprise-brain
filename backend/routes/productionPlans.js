const express = require('express')
const router = express.Router()
const { pool } = require('../config/database')
const { v4: uuidv4 } = require('uuid')

// 获取生产计划列表
router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, planNumber, productCode, productName, status } = req.query
    
    let sql = 'SELECT * FROM production_plans WHERE 1=1'
    const params = []
    
    if (planNumber) {
      sql += ' AND plan_number LIKE ?'
      params.push(`%${planNumber}%`)
    }
    if (productCode) {
      sql += ' AND product_code LIKE ?'
      params.push(`%${productCode}%`)
    }
    if (productName) {
      sql += ' AND product_name LIKE ?'
      params.push(`%${productName}%`)
    }
    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }
    
    sql += ' ORDER BY create_time DESC'
    
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total')
    const total = pool.prepare(countSql).get(...params).total
    
    sql += ' LIMIT ? OFFSET ?'
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize))
    
    const list = pool.prepare(sql).all(...params)
    
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
    console.error('获取生产计划列表失败:', error)
    res.status(500).json({ success: false, message: '获取列表失败', error: error.message })
  }
})

// 根据ID获取生产计划
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const plan = pool.prepare('SELECT * FROM production_plans WHERE id = ?').get(id)
    
    if (!plan) {
      return res.status(404).json({ success: false, message: '生产计划不存在' })
    }
    
    // 获取工序
    const processes = pool.prepare('SELECT * FROM production_plan_processes WHERE plan_id = ? ORDER BY sequence_no').all(id)
    plan.processes = processes
    
    res.json({ success: true, data: plan })
  } catch (error) {
    console.error('获取生产计划失败:', error)
    res.status(500).json({ success: false, message: '获取失败', error: error.message })
  }
})

// 创建生产计划
router.post('/', (req, res) => {
  try {
    const {
      planName, productCode, productName, planQuantity, unit = '个',
      planStartDate, planEndDate, status = 'DRAFT', priority = 'NORMAL',
      workshop, productionLine, remark, processes = []
    } = req.body
    
    if (!productCode || !productName) {
      return res.status(400).json({ success: false, message: '产品编码和产品名称为必填项' })
    }
    
    const id = uuidv4()
    const year = new Date().getFullYear()
    const count = pool.prepare('SELECT COUNT(*) as count FROM production_plans').get().count
    const planNumber = `PP${year}${String(count + 1).padStart(6, '0')}`
    
    const stmt = pool.prepare(`
      INSERT INTO production_plans (
        id, plan_number, plan_name, product_code, product_name,
        plan_quantity, unit, plan_start_date, plan_end_date,
        status, priority, workshop, production_line, create_by, remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      id, planNumber, planName, productCode, productName,
      planQuantity || 0, unit, planStartDate, planEndDate,
      status, priority, workshop, productionLine, 'admin', remark
    )
    
    // 插入工序
    if (processes && processes.length > 0) {
      const processStmt = pool.prepare(`
        INSERT INTO production_plan_processes (
          plan_id, process_code, process_name, sequence_no, plan_hours, status
        ) VALUES (?, ?, ?, ?, ?, ?)
      `)
      
      for (const process of processes) {
        processStmt.run(
          id, process.processCode, process.processName,
          process.sequenceNo || 0, process.planHours || 0,
          process.status || 'PENDING'
        )
      }
    }
    
    const newPlan = pool.prepare('SELECT * FROM production_plans WHERE id = ?').get(id)
    
    res.json({
      success: true,
      message: '创建生产计划成功',
      data: newPlan
    })
  } catch (error) {
    console.error('创建生产计划失败:', error)
    res.status(500).json({ success: false, message: '创建失败', error: error.message })
  }
})

// 更新生产计划
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    const {
      planName, productCode, productName, planQuantity, completedQuantity, unit,
      planStartDate, planEndDate, actualStartDate, actualEndDate,
      status, priority, workshop, productionLine, remark, processes = []
    } = req.body
    
    const existing = pool.prepare('SELECT * FROM production_plans WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: '生产计划不存在' })
    }
    
    const stmt = pool.prepare(`
      UPDATE production_plans SET
        plan_name = ?, product_code = ?, product_name = ?,
        plan_quantity = ?, completed_quantity = ?, unit = ?,
        plan_start_date = ?, plan_end_date = ?,
        actual_start_date = ?, actual_end_date = ?,
        status = ?, priority = ?, workshop = ?, production_line = ?,
        update_by = ?, update_time = CURRENT_TIMESTAMP, remark = ?
      WHERE id = ?
    `)
    
    stmt.run(
      planName, productCode, productName, planQuantity, completedQuantity, unit,
      planStartDate, planEndDate, actualStartDate, actualEndDate,
      status, priority, workshop, productionLine, 'admin', remark, id
    )
    
    // 更新工序
    pool.prepare('DELETE FROM production_plan_processes WHERE plan_id = ?').run(id)
    
    if (processes && processes.length > 0) {
      const processStmt = pool.prepare(`
        INSERT INTO production_plan_processes (
          plan_id, process_code, process_name, sequence_no, plan_hours, actual_hours, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      
      for (const process of processes) {
        processStmt.run(
          id, process.processCode, process.processName,
          process.sequenceNo || 0, process.planHours || 0,
          process.actualHours || 0, process.status || 'PENDING'
        )
      }
    }
    
    const updatedPlan = pool.prepare('SELECT * FROM production_plans WHERE id = ?').get(id)
    
    res.json({
      success: true,
      message: '更新生产计划成功',
      data: updatedPlan
    })
  } catch (error) {
    console.error('更新生产计划失败:', error)
    res.status(500).json({ success: false, message: '更新失败', error: error.message })
  }
})

// 删除生产计划
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    
    const existing = pool.prepare('SELECT * FROM production_plans WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: '生产计划不存在' })
    }
    
    pool.prepare('DELETE FROM production_plans WHERE id = ?').run(id)
    
    res.json({
      success: true,
      message: '删除生产计划成功'
    })
  } catch (error) {
    console.error('删除生产计划失败:', error)
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
    const sql = `DELETE FROM production_plans WHERE id IN (${placeholders})`
    
    const result = pool.prepare(sql).run(...ids)
    
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
