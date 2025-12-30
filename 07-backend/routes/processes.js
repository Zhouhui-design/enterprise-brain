const express = require('express');
const router = express.Router();
// 暂时注释数据库连接，使用模拟数据
// const db = require('../database/mysql');

// 获取工序列表
router.get('/list', async (req, res) => {
  try {
    // 使用模拟数据，不依赖数据库
    const mockProcesses = [
      {
        id: 1,
        process_code: 'P20250001',
        process_name: '切割',
        responsible_person: '张三',
        dispatch_method: 'auto',
        self_or_outsource: '自制',
        available_workstations: 5,
        is_warehousing: 1,
        completion_warehouse: '成品仓',
        workshop_name: '生产车间',
        process_wage: 100.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        process_code: 'P20250002',
        process_name: '焊接',
        responsible_person: '李四',
        dispatch_method: 'manual',
        self_or_outsource: '自制',
        available_workstations: 3,
        is_warehousing: 0,
        completion_warehouse: '',
        workshop_name: '生产车间',
        process_wage: 150.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        process_code: 'P20250003',
        process_name: '组装',
        responsible_person: '王五',
        dispatch_method: 'auto',
        self_or_outsource: '自制',
        available_workstations: 8,
        is_warehousing: 1,
        completion_warehouse: '半成品仓',
        workshop_name: '装配车间',
        process_wage: 120.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 4,
        process_code: 'P20250004',
        process_name: '喷涂',
        responsible_person: '赵六',
        dispatch_method: 'manual',
        self_or_outsource: '外协',
        available_workstations: 2,
        is_warehousing: 1,
        completion_warehouse: '外协仓',
        workshop_name: '喷涂车间',
        process_wage: 200.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 5,
        process_code: 'P20250005',
        process_name: '包装',
        responsible_person: '钱七',
        dispatch_method: 'auto',
        self_or_outsource: '自制',
        available_workstations: 4,
        is_warehousing: 1,
        completion_warehouse: '成品仓',
        workshop_name: '包装车间',
        process_wage: 80.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    console.log('📋 返回模拟工序数据:', mockProcesses.length, '条');
    
    res.json({
      code: 200,
      message: '获取工序列表成功',
      data: mockProcesses
    });
  } catch (error) {
    console.error('获取工序列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取工序列表失败',
      error: error.message
    });
  }
});

// 根据ID获取工序
router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'SELECT * FROM processes WHERE id = ?';
    const processes = await db.query(sql, [id]);
    
    if (processes.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '工序不存在'
      });
    }
    
    res.json({
      code: 200,
      message: '获取工序详情成功',
      data: processes[0]
    });
  } catch (error) {
    console.error('获取工序详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取工序详情失败',
      error: error.message
    });
  }
});

// 创建工序
router.post('/create', async (req, res) => {
  try {
    const {
      process_code,
      process_name,
      responsible_person,
      dispatch_method,
      self_or_outsource,
      available_workstations,
      is_warehousing,
      completion_warehouse,
      workshop_name,
      process_wage
    } = req.body;
    
    const sql = `
      INSERT INTO processes (
        process_code, process_name, responsible_person, dispatch_method,
        self_or_outsource, available_workstations, is_warehousing,
        completion_warehouse, workshop_name, process_wage, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const params = [
      process_code,
      process_name,
      responsible_person,
      dispatch_method,
      self_or_outsource,
      available_workstations,
      is_warehousing,
      completion_warehouse,
      workshop_name,
      process_wage
    ];
    
    const result = await db.query(sql, params);
    
    res.json({
      code: 200,
      message: '创建工序成功',
      data: {
        id: result.insertId,
        ...req.body
      }
    });
  } catch (error) {
    console.error('创建工序失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建工序失败',
      error: error.message
    });
  }
});

// 更新工序
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      process_code,
      process_name,
      responsible_person,
      dispatch_method,
      self_or_outsource,
      available_workstations,
      is_warehousing,
      completion_warehouse,
      workshop_name,
      process_wage
    } = req.body;
    
    const sql = `
      UPDATE processes SET
        process_code = ?, process_name = ?, responsible_person = ?, dispatch_method = ?,
        self_or_outsource = ?, available_workstations = ?, is_warehousing = ?,
        completion_warehouse = ?, workshop_name = ?, process_wage = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    const params = [
      process_code,
      process_name,
      responsible_person,
      dispatch_method,
      self_or_outsource,
      available_workstations,
      is_warehousing,
      completion_warehouse,
      workshop_name,
      process_wage,
      id
    ];
    
    const result = await db.query(sql, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: '工序不存在'
      });
    }
    
    res.json({
      code: 200,
      message: '更新工序成功'
    });
  } catch (error) {
    console.error('更新工序失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新工序失败',
      error: error.message
    });
  }
});

// 删除工序
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM processes WHERE id = ?';
    const result = await db.query(sql, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: '工序不存在'
      });
    }
    
    res.json({
      code: 200,
      message: '删除工序成功'
    });
  } catch (error) {
    console.error('删除工序失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除工序失败',
      error: error.message
    });
  }
});

// 批量删除工序
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供要删除的工序ID列表'
      });
    }
    
    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM processes WHERE id IN (${placeholders})`;
    const result = await db.query(sql, ids);
    
    res.json({
      code: 200,
      message: '批量删除工序成功',
      data: {
        deletedCount: result.affectedRows
      }
    });
  } catch (error) {
    console.error('批量删除工序失败:', error);
    res.status(500).json({
      code: 500,
      message: '批量删除工序失败',
      error: error.message
    });
  }
});

// 批量创建工序
router.post('/batch-create', async (req, res) => {
  try {
    const processes = req.body;
    
    if (!processes || processes.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供工序数据'
      });
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const process of processes) {
      try {
        const sql = `
          INSERT INTO processes (
            process_code, process_name, responsible_person, dispatch_method,
            self_or_outsource, available_workstations, is_warehousing,
            completion_warehouse, workshop_name, process_wage, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        const params = [
          process.process_code,
          process.process_name,
          process.responsible_person,
          process.dispatch_method,
          process.self_or_outsource,
          process.available_workstations,
          process.is_warehousing,
          process.completion_warehouse,
          process.workshop_name,
          process.process_wage
        ];
        
        await db.query(sql, params);
        successCount++;
      } catch (error) {
        console.error('创建工序失败:', error);
        errorCount++;
      }
    }
    
    res.json({
      code: 200,
      message: '批量创建工序完成',
      data: {
        successCount,
        errorCount
      }
    });
  } catch (error) {
    console.error('批量创建工序失败:', error);
    res.status(500).json({
      code: 500,
      message: '批量创建工序失败',
      error: error.message
    });
  }
});

module.exports = router;