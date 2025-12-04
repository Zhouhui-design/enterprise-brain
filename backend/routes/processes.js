const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 获取所有工序
router.get('/list', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM processes ORDER BY created_at DESC');
    res.json({
      code: 200,
      data: rows,
      message: '获取工序列表成功'
    });
  } catch (error) {
    console.error('获取工序列表失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 创建工序
router.post('/create', async (req, res) => {
  try {
    const processData = req.body;
    
    const sql = `
      INSERT INTO processes (
        process_code, process_name, responsible_person, dispatch_method,
        is_warehousing, completion_warehouse, workshop_name, process_wage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(sql, [
      processData.process_code || processData.processCode,
      processData.process_name || processData.processName,
      processData.responsible_person || processData.responsiblePerson,
      processData.dispatch_method || processData.dispatchMethod,
      processData.is_warehousing || processData.isWarehousing || 0,
      processData.completion_warehouse || processData.completionWarehouse || '',
      processData.workshop_name || processData.workshopName,
      processData.process_wage || processData.processWage || 0
    ]);
    
    res.json({
      code: 200,
      data: { id: result.insertId },
      message: '创建工序成功'
    });
  } catch (error) {
    console.error('创建工序失败:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        code: 400,
        message: '工序编号已存在'
      });
    } else {
      res.status(500).json({
        code: 500,
        message: error.message
      });
    }
  }
});

// 批量创建工序
router.post('/batch-create', async (req, res) => {
  const connection = await db.getConnection();
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  try {
    await connection.beginTransaction();
    
    const processesData = req.body;
    
    for (const processData of processesData) {
      try {
        const processCode = processData.process_code || processData.processCode;
        
        // 检查是否存在
        const [existing] = await connection.execute(
          'SELECT id FROM processes WHERE process_code = ?',
          [processCode]
        );
        
        if (existing.length > 0) {
          // 更新
          const updateSql = `
            UPDATE processes SET
              process_name = ?, responsible_person = ?, dispatch_method = ?,
              is_warehousing = ?, completion_warehouse = ?, workshop_name = ?, process_wage = ?
            WHERE process_code = ?
          `;
          
          await connection.execute(updateSql, [
            processData.process_name || processData.processName,
            processData.responsible_person || processData.responsiblePerson,
            processData.dispatch_method || processData.dispatchMethod,
            processData.is_warehousing || processData.isWarehousing || 0,
            processData.completion_warehouse || processData.completionWarehouse || '',
            processData.workshop_name || processData.workshopName,
            processData.process_wage || processData.processWage || 0,
            processCode
          ]);
        } else {
          // 插入
          const insertSql = `
            INSERT INTO processes (
              process_code, process_name, responsible_person, dispatch_method,
              is_warehousing, completion_warehouse, workshop_name, process_wage
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          await connection.execute(insertSql, [
            processCode,
            processData.process_name || processData.processName,
            processData.responsible_person || processData.responsiblePerson,
            processData.dispatch_method || processData.dispatchMethod,
            processData.is_warehousing || processData.isWarehousing || 0,
            processData.completion_warehouse || processData.completionWarehouse || '',
            processData.workshop_name || processData.workshopName,
            processData.process_wage || processData.processWage || 0
          ]);
        }
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          processCode: processData.process_code || processData.processCode,
          error: error.message
        });
      }
    }
    
    await connection.commit();
    
    res.json({
      code: 200,
      data: { successCount, errorCount, errors },
      message: '批量创建工序成功'
    });
  } catch (error) {
    await connection.rollback();
    console.error('批量创建工序失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  } finally {
    connection.release();
  }
});

// 更新工序
router.put('/update/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const processData = req.body;
    
    const sql = `
      UPDATE processes SET
        process_code = ?, process_name = ?, responsible_person = ?, dispatch_method = ?,
        is_warehousing = ?, completion_warehouse = ?, workshop_name = ?, process_wage = ?
      WHERE id = ?
    `;
    
    const [result] = await db.execute(sql, [
      processData.process_code || processData.processCode,
      processData.process_name || processData.processName,
      processData.responsible_person || processData.responsiblePerson,
      processData.dispatch_method || processData.dispatchMethod,
      processData.is_warehousing || processData.isWarehousing || 0,
      processData.completion_warehouse || processData.completionWarehouse || '',
      processData.workshop_name || processData.workshopName,
      processData.process_wage || processData.processWage || 0,
      id
    ]);
    
    if (result.affectedRows === 0) {
      res.status(404).json({
        code: 404,
        message: '工序不存在'
      });
    } else {
      res.json({
        code: 200,
        data: { id },
        message: '更新工序成功'
      });
    }
  } catch (error) {
    console.error('更新工序失败:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        code: 400,
        message: '工序编号已存在'
      });
    } else {
      res.status(500).json({
        code: 500,
        message: error.message
      });
    }
  }
});

// 删除工序
router.delete('/delete/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [result] = await db.execute('DELETE FROM processes WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      res.status(404).json({
        code: 404,
        message: '工序不存在'
      });
    } else {
      res.json({
        code: 200,
        data: { success: true },
        message: '删除工序成功'
      });
    }
  } catch (error) {
    console.error('删除工序失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 批量删除工序
router.post('/batch-delete', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { ids } = req.body;
    let successCount = 0;
    
    for (const id of ids) {
      const [result] = await connection.execute('DELETE FROM processes WHERE id = ?', [id]);
      successCount += result.affectedRows;
    }
    
    await connection.commit();
    
    res.json({
      code: 200,
      data: { successCount, totalCount: ids.length },
      message: '批量删除工序成功'
    });
  } catch (error) {
    await connection.rollback();
    console.error('批量删除工序失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
