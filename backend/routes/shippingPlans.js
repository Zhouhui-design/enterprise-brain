const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// 获取发货计划列表
router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, planNumber, customerName, orderNumber, status } = req.query;

    let sql = 'SELECT * FROM shipping_plans WHERE 1=1';
    const params = [];

    if (planNumber) {
      sql += ' AND plan_number LIKE ?';
      params.push(`%${planNumber}%`);
    }
    if (customerName) {
      sql += ' AND customer_name LIKE ?';
      params.push(`%${customerName}%`);
    }
    if (orderNumber) {
      sql += ' AND order_number LIKE ?';
      params.push(`%${orderNumber}%`);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY create_time DESC';

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const total = pool.prepare(countSql).get(...params).total;

    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

    const list = pool.prepare(sql).all(...params);

    res.json({
      success: true,
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    console.error('获取发货计划列表失败:', error);
    res.status(500).json({ success: false, message: '获取列表失败', error: error.message });
  }
});

// 根据ID获取发货计划
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const plan = pool.prepare('SELECT * FROM shipping_plans WHERE id = ?').get(id);

    if (!plan) {
      return res.status(404).json({ success: false, message: '发货计划不存在' });
    }

    // 获取明细
    const items = pool.prepare('SELECT * FROM shipping_plan_items WHERE plan_id = ?').all(id);
    plan.items = items;

    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('获取发货计划失败:', error);
    res.status(500).json({ success: false, message: '获取失败', error: error.message });
  }
});

// 创建发货计划
router.post('/', (req, res) => {
  try {
    const {
      orderNumber,
      customerName,
      customerContact,
      customerPhone,
      shipToAddress,
      planShipDate,
      actualShipDate,
      totalAmount,
      status = 'DRAFT',
      remark,
      items = [],
    } = req.body;

    if (!customerName) {
      return res.status(400).json({ success: false, message: '客户名称为必填项' });
    }

    const id = uuidv4();
    const year = new Date().getFullYear();
    const count = pool.prepare('SELECT COUNT(*) as count FROM shipping_plans').get().count;
    const planNumber = `SP${year}${String(count + 1).padStart(6, '0')}`;

    const stmt = pool.prepare(`
      INSERT INTO shipping_plans (
        id, plan_number, order_number, customer_name, customer_contact,
        customer_phone, ship_to_address, plan_ship_date, actual_ship_date,
        total_amount, status, create_by, remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      planNumber,
      orderNumber,
      customerName,
      customerContact,
      customerPhone,
      shipToAddress,
      planShipDate,
      actualShipDate,
      totalAmount || 0,
      status,
      'admin',
      remark,
    );

    // 插入明细
    if (items && items.length > 0) {
      const itemStmt = pool.prepare(`
        INSERT INTO shipping_plan_items (
          plan_id, product_code, product_name, quantity, unit, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        itemStmt.run(
          id,
          item.productCode,
          item.productName,
          item.quantity || 0,
          item.unit,
          item.unitPrice || 0,
          item.totalPrice || 0,
        );
      }
    }

    const newPlan = pool.prepare('SELECT * FROM shipping_plans WHERE id = ?').get(id);

    res.json({
      success: true,
      message: '创建发货计划成功',
      data: newPlan,
    });
  } catch (error) {
    console.error('创建发货计划失败:', error);
    res.status(500).json({ success: false, message: '创建失败', error: error.message });
  }
});

// 更新发货计划
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      orderNumber,
      customerName,
      customerContact,
      customerPhone,
      shipToAddress,
      planShipDate,
      actualShipDate,
      totalAmount,
      status,
      remark,
      items = [],
    } = req.body;

    const existing = pool.prepare('SELECT * FROM shipping_plans WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '发货计划不存在' });
    }

    const stmt = pool.prepare(`
      UPDATE shipping_plans SET
        order_number = ?, customer_name = ?, customer_contact = ?,
        customer_phone = ?, ship_to_address = ?, plan_ship_date = ?,
        actual_ship_date = ?, total_amount = ?, status = ?,
        update_by = ?, update_time = CURRENT_TIMESTAMP, remark = ?
      WHERE id = ?
    `);

    stmt.run(
      orderNumber,
      customerName,
      customerContact,
      customerPhone,
      shipToAddress,
      planShipDate,
      actualShipDate,
      totalAmount,
      status,
      'admin',
      remark,
      id,
    );

    // 更新明细：先删除后插入
    pool.prepare('DELETE FROM shipping_plan_items WHERE plan_id = ?').run(id);

    if (items && items.length > 0) {
      const itemStmt = pool.prepare(`
        INSERT INTO shipping_plan_items (
          plan_id, product_code, product_name, quantity, unit, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        itemStmt.run(
          id,
          item.productCode,
          item.productName,
          item.quantity || 0,
          item.unit,
          item.unitPrice || 0,
          item.totalPrice || 0,
        );
      }
    }

    const updatedPlan = pool.prepare('SELECT * FROM shipping_plans WHERE id = ?').get(id);

    res.json({
      success: true,
      message: '更新发货计划成功',
      data: updatedPlan,
    });
  } catch (error) {
    console.error('更新发货计划失败:', error);
    res.status(500).json({ success: false, message: '更新失败', error: error.message });
  }
});

// 删除发货计划
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = pool.prepare('SELECT * FROM shipping_plans WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '发货计划不存在' });
    }

    pool.prepare('DELETE FROM shipping_plans WHERE id = ?').run(id);

    res.json({
      success: true,
      message: '删除发货计划成功',
    });
  } catch (error) {
    console.error('删除发货计划失败:', error);
    res.status(500).json({ success: false, message: '删除失败', error: error.message });
  }
});

// 批量删除
router.post('/batch-delete', (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ID列表不能为空' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM shipping_plans WHERE id IN (${placeholders})`;

    const result = pool.prepare(sql).run(...ids);

    res.json({
      success: true,
      message: `成功删除${result.changes}条记录`,
    });
  } catch (error) {
    console.error('批量删除失败:', error);
    res.status(500).json({ success: false, message: '批量删除失败', error: error.message });
  }
});

module.exports = router;
