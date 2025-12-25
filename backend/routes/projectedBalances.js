const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * 获取预计结存列表
 * GET /api/projected-balances
 */
router.get('/', async (req, res) => {
  let connection;
  try {
    const { page = 1, pageSize = 20, salesOrderNo, productCode, productName, startDate, endDate } = req.query;

    console.log('=== 获取预计结存列表 ===', { page, pageSize });

    connection = await pool.getConnection();

    // 构建WHERE条件
    const conditions = [];
    const params = [];

    if (salesOrderNo) {
      conditions.push('sales_order_no LIKE ?');
      params.push(`%${salesOrderNo}%`);
    }

    if (productCode) {
      conditions.push('product_code LIKE ?');
      params.push(`%${productCode}%`);
    }

    if (productName) {
      conditions.push('product_name LIKE ?');
      params.push(`%${productName}%`);
    }

    if (startDate && endDate) {
      conditions.push('projected_date BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询总数
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM projected_balances ${whereClause}`,
      params,
    );
    const total = countResult[0].total;

    // 查询数据
    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 20;
    const offset = (pageNum - 1) * pageSizeNum;

    const [rows] = await connection.execute(
      `SELECT * FROM projected_balances ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, pageSizeNum, offset],
    );

    console.log(`✅ 查询成功，共 ${total} 条记录，当前页 ${rows.length} 条`);

    res.json({
      success: true,
      data: {
        list: rows,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
      },
    });
  } catch (error) {
    console.error('❌ 获取预计结存列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取列表失败',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 根据ID获取预计结存
 * GET /api/projected-balances/:id
 */
router.get('/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    console.log('=== 获取预计结存详情 ===', id);

    connection = await pool.getConnection();

    const [rows] = await connection.execute('SELECT * FROM projected_balances WHERE id = ?', [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '预计结存不存在',
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('❌ 获取预计结存详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取详情失败',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 创建预计结存
 * POST /api/projected-balances
 */
router.post('/', async (req, res) => {
  let connection;
  try {
    const { projectedDate, salesOrderNo, productCode, productName, quantity, baseUnit, currentInventory } = req.body;

    console.log('=== 创建预计结存 ===', req.body);

    // 验证必填字段
    if (!projectedDate || !salesOrderNo || !productCode || !productName || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    connection = await pool.getConnection();

    // 生成预计发生编号
    const transactionNo = `TXN${Date.now()}`;

    // 计算预计结存和可用库存
    const projectedBalance = currentInventory - quantity;
    const availableInventory = currentInventory;

    const [result] = await connection.execute(
      `INSERT INTO projected_balances (
        projected_date, sales_order_no, product_code, product_name,
        transaction_no, quantity, base_unit, current_inventory,
        projected_balance, available_inventory, submit_time, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [
        projectedDate,
        salesOrderNo,
        productCode,
        productName,
        transactionNo,
        quantity,
        baseUnit || '个',
        currentInventory || 0,
        projectedBalance,
        availableInventory,
      ],
    );

    console.log('✅ 预计结存创建成功，ID:', result.insertId);

    res.json({
      success: true,
      message: '创建成功',
      data: {
        id: result.insertId,
        transactionNo,
      },
    });
  } catch (error) {
    console.error('❌ 创建预计结存失败:', error);
    res.status(500).json({
      success: false,
      message: '创建失败',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 更新预计结存
 * PUT /api/projected-balances/:id
 */
router.put('/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { projectedDate, salesOrderNo, productCode, productName, quantity, baseUnit, currentInventory } = req.body;

    console.log('=== 更新预计结存 ===', id, req.body);

    connection = await pool.getConnection();

    // 计算预计结存和可用库存
    const projectedBalance = currentInventory - quantity;
    const availableInventory = currentInventory;

    const [result] = await connection.execute(
      `UPDATE projected_balances SET
        projected_date = ?, sales_order_no = ?, product_code = ?,
        product_name = ?, quantity = ?, base_unit = ?,
        current_inventory = ?, projected_balance = ?,
        available_inventory = ?, updated_at = NOW()
      WHERE id = ?`,
      [
        projectedDate,
        salesOrderNo,
        productCode,
        productName,
        quantity,
        baseUnit,
        currentInventory,
        projectedBalance,
        availableInventory,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '预计结存不存在',
      });
    }

    console.log('✅ 预计结存更新成功');

    res.json({
      success: true,
      message: '更新成功',
    });
  } catch (error) {
    console.error('❌ 更新预计结存失败:', error);
    res.status(500).json({
      success: false,
      message: '更新失败',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 删除预计结存
 * DELETE /api/projected-balances/:id
 */
router.delete('/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    console.log('=== 删除预计结存 ===', id);

    connection = await pool.getConnection();

    const [result] = await connection.execute('DELETE FROM projected_balances WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '预计结存不存在',
      });
    }

    console.log('✅ 预计结存删除成功');

    res.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('❌ 删除预计结存失败:', error);
    res.status(500).json({
      success: false,
      message: '删除失败',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 批量删除预计结存
 * POST /api/projected-balances/batch-delete
 */
router.post('/batch-delete', async (req, res) => {
  let connection;
  try {
    const { ids } = req.body;
    console.log('=== 批量删除预计结存 ===', ids);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请至少选择一条记录',
      });
    }

    connection = await pool.getConnection();

    const placeholders = ids.map(() => '?').join(',');
    const [result] = await connection.execute(`DELETE FROM projected_balances WHERE id IN (${placeholders})`, ids);

    console.log(`✅ 批量删除成功，删除 ${result.affectedRows} 条记录`);

    res.json({
      success: true,
      message: `删除成功，共删除 ${result.affectedRows} 条记录`,
    });
  } catch (error) {
    console.error('❌ 批量删除预计结存失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除失败',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
