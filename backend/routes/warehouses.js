/**
 * 仓库管理API路由
 * 提供仓库的增删改查功能
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// 获取仓库列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, name, code, status, type, manager, region } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    // 动态构建查询条件
    if (name) {
      whereClause += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }
    if (code) {
      whereClause += ' AND code LIKE ?';
      params.push(`%${code}%`);
    }
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }
    if (manager) {
      whereClause += ' AND manager LIKE ?';
      params.push(`%${manager}%`);
    }
    if (region) {
      whereClause += ' AND region = ?';
      params.push(region);
    }

    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM warehouses ${whereClause}`;
    const [countResult] = await query(countSql, params);
    const total = countResult[0].total;

    // 获取分页数据
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const dataSql = `
      SELECT 
        id, code, name, type, status, capacity, locations, region, 
        manager, contact_phone, address, description, 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i') as updated_at
      FROM warehouses 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, parseInt(pageSize), offset];
    const data = await query(dataSql, dataParams);

    res.json({
      success: true,
      data: data,
      total: total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('❌ 获取仓库列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取仓库列表失败',
      error: error.message,
    });
  }
});

// 获取仓库详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        id, code, name, type, status, capacity, locations, region, 
        manager, contact_phone, address, description, 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i') as updated_at
      FROM warehouses 
      WHERE id = ?
    `;
    const result = await query(sql, [id]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: '仓库不存在',
      });
    }

    res.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error('❌ 获取仓库详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取仓库详情失败',
      error: error.message,
    });
  }
});

// 创建仓库
router.post('/', async (req, res) => {
  try {
    const {
      code,
      name,
      type,
      status = 'enabled',
      capacity,
      locations,
      region,
      manager,
      contact_phone,
      address,
      description,
    } = req.body;

    // 检查仓库编码是否已存在
    const checkSql = 'SELECT id FROM warehouses WHERE code = ?';
    const existing = await query(checkSql, [code]);

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: '仓库编码已存在',
      });
    }

    const sql = `
      INSERT INTO warehouses (
        code, name, type, status, capacity, locations, region,
        manager, contact_phone, address, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      code,
      name,
      type,
      status,
      capacity,
      locations,
      region,
      manager,
      contact_phone,
      address,
      description,
    ];

    const result = await query(sql, params);

    res.json({
      success: true,
      data: {
        id: result.insertId,
        code,
        name,
        type,
        status,
        capacity,
        locations,
        region,
        manager,
        contact_phone,
        address,
        description,
      },
    });
  } catch (error) {
    console.error('❌ 创建仓库失败:', error);
    res.status(500).json({
      success: false,
      message: '创建仓库失败',
      error: error.message,
    });
  }
});

// 更新仓库
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, type, status, capacity, locations, region, manager, contact_phone, address, description } =
      req.body;

    // 检查仓库是否存在
    const checkSql = 'SELECT id FROM warehouses WHERE id = ?';
    const existing = await query(checkSql, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '仓库不存在',
      });
    }

    // 检查仓库编码是否被其他仓库使用
    const codeCheckSql = 'SELECT id FROM warehouses WHERE code = ? AND id != ?';
    const codeExisting = await query(codeCheckSql, [code, id]);

    if (codeExisting.length > 0) {
      return res.status(400).json({
        success: false,
        message: '仓库编码已被其他仓库使用',
      });
    }

    const sql = `
      UPDATE warehouses SET
        code = ?, name = ?, type = ?, status = ?, capacity = ?, locations = ?,
        region = ?, manager = ?, contact_phone = ?, address = ?, description = ?
      WHERE id = ?
    `;

    const params = [
      code,
      name,
      type,
      status,
      capacity,
      locations,
      region,
      manager,
      contact_phone,
      address,
      description,
      id,
    ];

    await query(sql, params);

    res.json({
      success: true,
      message: '仓库更新成功',
    });
  } catch (error) {
    console.error('❌ 更新仓库失败:', error);
    res.status(500).json({
      success: false,
      message: '更新仓库失败',
      error: error.message,
    });
  }
});

// 删除仓库
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 检查仓库是否存在
    const checkSql = 'SELECT id, name FROM warehouses WHERE id = ?';
    const existing = await query(checkSql, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '仓库不存在',
      });
    }

    const sql = 'DELETE FROM warehouses WHERE id = ?';
    await query(sql, [id]);

    res.json({
      success: true,
      message: `仓库「${existing[0].name}」删除成功`,
    });
  } catch (error) {
    console.error('❌ 删除仓库失败:', error);
    res.status(500).json({
      success: false,
      message: '删除仓库失败',
      error: error.message,
    });
  }
});

// 批量删除仓库
router.delete('/batch/:ids', async (req, res) => {
  try {
    const { ids } = req.params;
    const idArray = ids
      .split(',')
      .map(id => parseInt(id))
      .filter(id => !isNaN(id));

    if (idArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: '无效的ID列表',
      });
    }

    // 获取要删除的仓库名称
    const namesSql = `SELECT name FROM warehouses WHERE id IN (${idArray.map(() => '?').join(',')})`;
    const warehouses = await query(namesSql, idArray);

    if (warehouses.length === 0) {
      return res.status(404).json({
        success: false,
        message: '没有找到要删除的仓库',
      });
    }

    // 执行删除
    const deleteSql = `DELETE FROM warehouses WHERE id IN (${idArray.map(() => '?').join(',')})`;
    const result = await query(deleteSql, idArray);

    res.json({
      success: true,
      message: `成功删除 ${result.affectedRows} 个仓库`,
      deleted: result.affectedRows,
      names: warehouses.map(w => w.name),
    });
  } catch (error) {
    console.error('❌ 批量删除仓库失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除仓库失败',
      error: error.message,
    });
  }
});

module.exports = router;
