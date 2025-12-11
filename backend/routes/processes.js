const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// 获取所有工序
router.get('/list', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM processes ORDER BY created_at DESC');
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
        self_or_outsource, available_workstations, is_warehousing, completion_warehouse, workshop_name, process_wage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(sql, [
      processData.process_code || processData.processCode,
      processData.process_name || processData.processName,
      processData.responsible_person || processData.responsiblePerson,
      processData.dispatch_method || processData.dispatchMethod,
      processData.self_or_outsource || processData.selfOrOutsource || null,
      processData.available_workstations || processData.availableWorkstations || null,
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
  const connection = await pool.getConnection();
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
              self_or_outsource = ?, is_warehousing = ?, completion_warehouse = ?, workshop_name = ?, process_wage = ?
            WHERE process_code = ?
          `;
          
          await connection.execute(updateSql, [
            processData.process_name || processData.processName,
            processData.responsible_person || processData.responsiblePerson,
            processData.dispatch_method || processData.dispatchMethod,
            processData.self_or_outsource || processData.selfOrOutsource || null,
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
              self_or_outsource, is_warehousing, completion_warehouse, workshop_name, process_wage
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          await connection.execute(insertSql, [
            processCode,
            processData.process_name || processData.processName,
            processData.responsible_person || processData.responsiblePerson,
            processData.dispatch_method || processData.dispatchMethod,
            processData.self_or_outsource || processData.selfOrOutsource || null,
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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const id = req.params.id;
    const processData = req.body;
    
    // 🔍 获取更新前的数据
    const [oldData] = await connection.execute('SELECT * FROM processes WHERE id = ?', [id]);
    
    if (oldData.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        code: 404,
        message: '工序不存在'
      });
    }
    
    const oldProcess = oldData[0];
    const newProcessName = processData.process_name || processData.processName;
    const newSelfOrOutsource = processData.self_or_outsource || processData.selfOrOutsource || null;
    const newAvailableWorkstations = processData.available_workstations || processData.availableWorkstations || null;
    
    console.log('🔄 工序更新触发:', {
      id,
      oldName: oldProcess.process_name,
      newName: newProcessName,
      oldSelfOrOutsource: oldProcess.self_or_outsource,
      newSelfOrOutsource: newSelfOrOutsource,
      oldWorkstations: oldProcess.available_workstations,
      newWorkstations: newAvailableWorkstations
    });
    
    // 更新工序表
    const sql = `
      UPDATE processes SET
        process_code = ?, process_name = ?, responsible_person = ?, dispatch_method = ?,
        self_or_outsource = ?, available_workstations = ?, is_warehousing = ?, completion_warehouse = ?, workshop_name = ?, process_wage = ?
      WHERE id = ?
    `;
    
    await connection.execute(sql, [
      processData.process_code || processData.processCode,
      newProcessName,
      processData.responsible_person || processData.responsiblePerson,
      processData.dispatch_method || processData.dispatchMethod,
      newSelfOrOutsource,
      newAvailableWorkstations,
      processData.is_warehousing || processData.isWarehousing || 0,
      processData.completion_warehouse || processData.completionWarehouse || '',
      processData.workshop_name || processData.workshopName,
      processData.process_wage || processData.processWage || 0,
      id
    ]);
    
    // ✅ 同步更新工序能力负荷表
    let capacityUpdateMsg = '';
    
    // 规则1：自制/外协变化
    if (oldProcess.self_or_outsource !== newSelfOrOutsource) {
      if (oldProcess.self_or_outsource === '自制' && newSelfOrOutsource === '外协') {
        // 自制 → 外协：删除能力负荷表中该工序的所有记录
        const [deleteResult] = await connection.execute(
          'DELETE FROM process_capacity_load WHERE process_name = ?',
          [oldProcess.process_name]
        );
        capacityUpdateMsg += `删除能力负荷表记录${deleteResult.affectedRows}条；`;
        console.log(`✅ 自制→外协：删除能力负荷表中工序"${oldProcess.process_name}"的${deleteResult.affectedRows}条记录`);
      } else if (oldProcess.self_or_outsource === '外协' && newSelfOrOutsource === '自制') {
        // 外协 → 自制：需要在能力负荷表中新增该工序（通过前端"加载到工序能力负荷表"按钮操作）
        capacityUpdateMsg += '已从外协改为自制，请使用"加载到工序能力负荷表"按钮生成数据；';
        console.log(`⚠️ 外协→自制：工序"${newProcessName}"需手动加载到能力负荷表`);
      }
    }
    
    // 规则2：工序名称变化（只针对自制工序）
    if (newSelfOrOutsource === '自制' && oldProcess.process_name !== newProcessName) {
      const [updateNameResult] = await connection.execute(
        'UPDATE process_capacity_load SET process_name = ? WHERE process_name = ?',
        [newProcessName, oldProcess.process_name]
      );
      if (updateNameResult.affectedRows > 0) {
        capacityUpdateMsg += `更新工序名称${updateNameResult.affectedRows}条记录；`;
        console.log(`✅ 工序名称变化：能力负荷表中"${oldProcess.process_name}"→"${newProcessName}"，更新${updateNameResult.affectedRows}条`);
      }
    }
    
    // 规则3：可用工位数量变化（只针对自制工序）
    if (newSelfOrOutsource === '自制' && oldProcess.available_workstations !== newAvailableWorkstations) {
      // 使用更新后的工序名称
      const targetProcessName = (oldProcess.process_name !== newProcessName) ? newProcessName : oldProcess.process_name;
      
      const [updateWorkstationsResult] = await connection.execute(
        'UPDATE process_capacity_load SET available_workstations = ? WHERE process_name = ?',
        [newAvailableWorkstations || 0, targetProcessName]
      );
      if (updateWorkstationsResult.affectedRows > 0) {
        capacityUpdateMsg += `更新可用工位数量${updateWorkstationsResult.affectedRows}条记录；`;
        console.log(`✅ 可用工位数量变化：能力负荷表中"${targetProcessName}"的可用工位数量→${newAvailableWorkstations}，更新${updateWorkstationsResult.affectedRows}条`);
        
        // ✅ 规列4：重新计算剩余工时（可用工位数量变化后自动触发）
        console.log(`📊 开始重新计算工序"${targetProcessName}"的剩余工时...`);
        
        // 查询该工序的所有记录
        const [capacityRecords] = await connection.execute(`
          SELECT id, work_shift, available_workstations, occupied_hours 
          FROM process_capacity_load 
          WHERE process_name = ?
        `, [targetProcessName]);
        
        let recalcCount = 0;
        for (const record of capacityRecords) {
          const workShift = parseFloat(record.work_shift) || 0;
          const availableWorkstations = record.available_workstations || 0;
          const occupiedHours = parseFloat(record.occupied_hours) || 0;
          
          // 计算剩余工时 = (上班时段 × 可用工位数量) - 已占用工时
          const remainingHours = parseFloat(
            (workShift * availableWorkstations - occupiedHours).toFixed(2)
          );
          
          // 计算剩余时段 = 剩余工时 ÷ 可用工位数量
          let remainingShift = '0.00';
          if (availableWorkstations > 0) {
            remainingShift = parseFloat(
              (remainingHours / availableWorkstations).toFixed(2)
            ).toString();
          }
          
          // 更新记录
          await connection.execute(`
            UPDATE process_capacity_load 
            SET remaining_hours = ?, remaining_shift = ?
            WHERE id = ?
          `, [remainingHours, remainingShift, record.id]);
          
          recalcCount++;
        }
        
        if (recalcCount > 0) {
          capacityUpdateMsg += `重新计算剩余工时${recalcCount}条记录；`;
          console.log(`✅ 重新计算完成：工序"${targetProcessName}"的剩余工时，更新${recalcCount}条`);
        }
      }
    }
    
    await connection.commit();
    
    res.json({
      code: 200,
      data: { id, capacityUpdateMsg },
      message: '更新工序成功' + (capacityUpdateMsg ? '；' + capacityUpdateMsg : '')
    });
  } catch (error) {
    await connection.rollback();
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
  } finally {
    connection.release();
  }
});

// 删除工序
router.delete('/delete/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const id = req.params.id;
    
    // 🔍 获取工序信息
    const [processData] = await connection.execute('SELECT * FROM processes WHERE id = ?', [id]);
    
    if (processData.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        code: 404,
        message: '工序不存在'
      });
    }
    
    const process = processData[0];
    console.log(`🗑️ 删除工序: ${process.process_name} (自制/外协: ${process.self_or_outsource})`);
    
    // ✅ 删除工序能力负荷表中的相关记录
    const [deleteCapacityResult] = await connection.execute(
      'DELETE FROM process_capacity_load WHERE process_name = ?',
      [process.process_name]
    );
    
    if (deleteCapacityResult.affectedRows > 0) {
      console.log(`✅ 同步删除能力负荷表中工序"${process.process_name}"的${deleteCapacityResult.affectedRows}条记录`);
    }
    
    // 删除工序
    const [result] = await connection.execute('DELETE FROM processes WHERE id = ?', [id]);
    
    await connection.commit();
    
    res.json({
      code: 200,
      data: { 
        success: true,
        deletedCapacityRecords: deleteCapacityResult.affectedRows
      },
      message: `删除工序成功，同步删除能力负荷表${deleteCapacityResult.affectedRows}条记录`
    });
  } catch (error) {
    await connection.rollback();
    console.error('删除工序失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  } finally {
    connection.release();
  }
});

// 批量删除工序
router.post('/batch-delete', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { ids } = req.body;
    let successCount = 0;
    let totalCapacityDeleted = 0;
    
    for (const id of ids) {
      // 🔍 获取工序信息
      const [processData] = await connection.execute('SELECT * FROM processes WHERE id = ?', [id]);
      
      if (processData.length > 0) {
        const process = processData[0];
        
        // ✅ 删除工序能力负荷表中的相关记录
        const [deleteCapacityResult] = await connection.execute(
          'DELETE FROM process_capacity_load WHERE process_name = ?',
          [process.process_name]
        );
        totalCapacityDeleted += deleteCapacityResult.affectedRows;
        
        if (deleteCapacityResult.affectedRows > 0) {
          console.log(`✅ 同步删除能力负荷表中工序"${process.process_name}"的${deleteCapacityResult.affectedRows}条记录`);
        }
      }
      
      // 删除工序
      const [result] = await connection.execute('DELETE FROM processes WHERE id = ?', [id]);
      successCount += result.affectedRows;
    }
    
    await connection.commit();
    
    res.json({
      code: 200,
      data: { 
        successCount, 
        totalCount: ids.length,
        deletedCapacityRecords: totalCapacityDeleted
      },
      message: `批量删除工序成功，同步删除能力负荷表${totalCapacityDeleted}条记录`
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
