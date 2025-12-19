const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

console.log('✅ capacityLoad路由模块已加载');





// 获取工序能力负荷表列表
router.get('/list', async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      processName,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'ASC'
    } = req.query;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    
    if (processName) {
      whereClause += ' AND process_name LIKE ?';
      queryParams.push(`%${processName}%`);
    }
    
    if (startDate) {
      whereClause += ' AND date >= ?';
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND date <= ?';
      queryParams.push(endDate);
    }

    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM process_capacity_load ${whereClause}`;
    const [countResult] = await pool.execute(countSql, queryParams);
    const total = countResult[0].total;

    // 计算分页
    const pageNum = parseInt(page);
    const size = parseInt(pageSize);
    const offset = (pageNum - 1) * size;

    // 获取数据 - 使用字符串拼接而不是参数绑定LIMIT/OFFSET
    const dataSql = `
      SELECT 
        id,
        process_name as processName,
        date,
        available_workstations as availableWorkstations,
        work_shift as workShift,
        occupied_hours as occupiedHours,
        remaining_shift as remainingShift,
        remaining_hours as remainingHours,
        overtime_shift as overtimeShift,
        created_at as createdAt,
        updated_at as updatedAt
      FROM process_capacity_load 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder === 'DESC' ? 'DESC' : 'ASC'}
      LIMIT ${size} OFFSET ${offset}
    `;
    
    const [data] = await pool.execute(dataSql, queryParams);

    res.json({
      code: 200,
      data: {
        records: data,
        total,
        page: pageNum,
        pageSize: size
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取工序能力负荷表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取失败: ' + error.message
    });
  }
});

// ✅ 查询计划结束日期：根据工序名称、计划完工日期、剩余工时条件查询
router.post('/query-plan-end-date', async (req, res) => {
  console.log('📡 接收到计划结束日期POST请求');
  try {
    const { processName, completionDate, minRemainingHours } = req.body;
    
    console.log('🔍 查询计划结束日期参数:', { processName, completionDate, minRemainingHours });
    
    if (!processName || !completionDate) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：processName 和 completionDate'
      });
    }
    
    // ✅ 使用传入的minRemainingHours，默认0.5
    const minHours = parseFloat(minRemainingHours) || 0.5;
    
    // 获取系统当前日期
    const currentDate = new Date().toISOString().split('T')[0];
    
    // 🔍 修正日期范围：查询所有小于等于计划完工日期的记录
    console.log(`📊 查询日期范围: 从开始日期到 ${completionDate}`);
    
    // 查询规则：
    // 1. 工序名称相同
    // 2. 日期条件：date <= 计划完工日期
    // 3. ✅ 剩余工时 >= minHours（包含等于，确保产能充足）
    // 4. 按日期降序排列，取第一条（即最大日期）
    const sql = `
      SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, remaining_hours 
      FROM process_capacity_load 
      WHERE process_name = ? 
        AND date <= ? 
        AND remaining_hours >= ? 
      ORDER BY date DESC 
      LIMIT 1
    `;
    
    console.log('🔍 SQL:', sql);
    console.log('🔍 参数:', [processName, completionDate, minHours]);
    
    const [rows] = await pool.execute(sql, [processName, completionDate, minHours]);
    
    if (rows.length > 0) {
      const result = rows[0];
      const formattedDate = result.date;  // ✅ 直接使用DATE_FORMAT格式化后的日期
      
      console.log(`✅ 找到结束日期: ${formattedDate}, 剩余工时: ${result.remaining_hours}`);
      
      res.json({
        code: 200,
        data: {
          planEndDate: formattedDate,
          remainingHours: result.remaining_hours
        },
        message: '查询成功'
      });
    } else {
      console.log('⚠️ 未找到符合条件的日期');
      
      res.json({
        code: 200,
        data: {
          planEndDate: null,
          remainingHours: null
        },
        message: '未找到符合条件的日期'
      });
    }
  } catch (error) {
    console.error('查询计划结束日期失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// ✅ 查询计划开始日期：从计划结束日期向前累加剩余工时，直到累计和 >= 需求工时
router.post('/query-plan-start-date', async (req, res) => {
  console.log('📡 接收到计划开始日期POST请求');
  try {
    const { processName, planEndDate, requiredWorkHours, minRemainingHours } = req.body;
    
    console.log('🔍 查询计划开始日期参数:', { processName, planEndDate, requiredWorkHours, minRemainingHours });
    
    if (!processName || !planEndDate || !requiredWorkHours) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：processName、planEndDate 和 requiredWorkHours'
      });
    }
    
    const minHours = parseFloat(minRemainingHours) || 0.5;
    const required = parseFloat(requiredWorkHours);
    
    if (required <= 0) {
      return res.json({
        code: 200,
        data: {
          planStartDate: planEndDate,
          accumulatedHours: 0
        },
        message: '需求工时为0，开始日期等于结束日期'
      });
    }
    
    // 获取系统当前日期
    const currentDate = new Date().toISOString().split('T')[0];
    
    console.log(`📊 查询日期范围: 从开始日期到计划结束日期 ${planEndDate}`);
    
    const sql = `
      SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, remaining_hours 
      FROM process_capacity_load 
      WHERE process_name = ? 
        AND date <= ?
        AND remaining_hours >= ? 
      ORDER BY date DESC
    `;
    
    console.log('🔍 SQL:', sql);
    console.log('🔍 参数:', [processName, planEndDate, minHours]);
    
    const [rows] = await pool.execute(sql, [processName, planEndDate, minHours]);
    
    console.log(`📊 查询结果: 找到${rows.length}条符合条件的记录`);
    
    if (rows.length === 0) {
      console.log('⚠️ 未找到符合条件的日期');
      
      // ✅ 增强诊断信息: 查询该工序所有记录
      const [allRows] = await pool.execute(
        'SELECT DATE_FORMAT(date, \'%Y-%m-%d\') as date, remaining_hours, occupied_hours FROM process_capacity_load WHERE process_name = ? ORDER BY date',
        [processName]
      );
      
      console.log(`🔍 诊断信息: 工序能力负荷表中工序"${processName}"共有${allRows.length}条记录`);
      if (allRows.length > 0) {
        console.log(`   日期范围: ${allRows[0].date} 至 ${allRows[allRows.length-1].date}`);
        const qualifiedRows = allRows.filter(r => parseFloat(r.remaining_hours) >= minHours);
        console.log(`   其中剩余工时>=${minHours}的记录: ${qualifiedRows.length}条`);
        if (qualifiedRows.length > 0) {
          console.log(`   最近的符合条件的日期: ${qualifiedRows[0].date} (剩余工时=${qualifiedRows[0].remaining_hours})`);
        }
      } else {
        console.log(`   ⚠️ 工序能力负荷表中没有工序"${processName}"的任何记录!`);
        console.log(`   请检查: 1)工序名称是否正确; 2)是否已同步上班时段数据`);
      }
      
      return res.json({
        code: 200,
        data: {
          planStartDate: null,
          accumulatedHours: 0
        },
        message: '未找到符合条件的日期'
      });
    }
    
    // 从计划结束日期向前累加剩余工时，找到满足需求工时的最小日期范围
    let accumulatedHours = 0;
    let planStartDate = null;
    
    console.log(`🔍 开始累加计算，需求工时: ${required}`);
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const dateStr = row.date;  // ✅ 已经是YYYY-MM-DD格式
      const hours = parseFloat(row.remaining_hours) || 0;
      
      accumulatedHours += hours;
      
      console.log(`  日期: ${dateStr}, 剩余工时: ${hours}, 累计: ${accumulatedHours.toFixed(2)}`);
      
      // ✅ 如果累计工时已经 >= 需求工时，则当前日期就是开始日期
      if (accumulatedHours >= required) {
        planStartDate = dateStr;
        console.log(`✅ 找到开始日期: ${planStartDate}, 累计工时: ${accumulatedHours.toFixed(2)}`);
        break;
      }
    }
    
    if (planStartDate) {
      res.json({
        code: 200,
        data: {
          planStartDate,
          accumulatedHours: parseFloat(accumulatedHours.toFixed(2))
        },
        message: '查询成功'
      });
    } else {
      console.log('⚠️ 累计工时不足，无法确定开始日期');
      res.json({
        code: 200,
        data: {
          planStartDate: null,
          accumulatedHours: parseFloat(accumulatedHours.toFixed(2))
        },
        message: '累计工时不足，无法确定开始日期'
      });
    }
  } catch (error) {
    console.error('查询计划开始日期失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// ✅ 查询当天总工时：可用工位数量 * 上班时段
router.post('/query-daily-total-hours', async (req, res) => {
  console.log('📡 接收到当天总工时POST请求');
  try {
    const { processName, date } = req.body;
    
    console.log('🔍 查询当天总工时参数:', { processName, date });
    
    if (!processName || !date) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：processName 和 date'
      });
    }
    
    const sql = `
      SELECT 
        available_workstations,
        work_shift,
        (available_workstations * work_shift) as daily_total_work_hours
      FROM process_capacity_load 
      WHERE process_name = ? 
        AND date = ?
      LIMIT 1
    `;
    
    console.log('🔍 SQL:', sql);
    console.log('🔍 参数:', [processName, date]);
    
    const [rows] = await pool.execute(sql, [processName, date]);
    
    if (rows.length > 0) {
      const result = rows[0];
      const dailyTotalHours = parseFloat(result.daily_total_hours || 0).toFixed(2);
      
      console.log(`✅ 找到当天总工时: ${dailyTotalHours} (可用工位=${result.available_workstations}, 上班时段=${result.work_shift})`);
      
      res.json({
        code: 200,
        data: {
          dailyTotalHours: parseFloat(dailyTotalHours),
          availableWorkstations: result.available_workstations,
          workShift: result.work_shift
        },
        message: '查询成功'
      });
    } else {
      console.log('⚠️ 未找到符合条件的记录');
      
      res.json({
        code: 200,
        data: {
          dailyTotalHours: 0
        },
        message: '未找到符合条件的记录'
      });
    }
  } catch (error) {
    console.error('查询当天总工时失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// ✅ 需求2：查询当天已排程工时 (SUMIFS)
router.post('/query-daily-scheduled-hours', async (req, res) => {
  try {
    const { processName, scheduleDate, currentRowIndex = 0 } = req.body;
    
    console.log('📡 查询当天已排程工时:', { processName, scheduleDate, currentRowIndex });
    
    if (!processName || !scheduleDate) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：processName 和 scheduleDate'
      });
    }
    
    // SUMIFS: 求和条件1 - 工序名称匹配
    // SUMIFS: 求和条件2 - 计划排程日期匹配
    // SUMIFS: 求和条件3 - 序号 < 当前行序号（不包含当前行）
    const sql = `
      SELECT COALESCE(SUM(scheduled_work_hours), 0) as total
      FROM (
        SELECT 
          scheduled_work_hours,
          ROW_NUMBER() OVER (ORDER BY schedule_date ASC, created_at ASC) as row_num
        FROM real_process_plans
        WHERE process_name = ?
          AND DATE_FORMAT(schedule_date, '%Y-%m-%d') = ?
      ) as ranked
      WHERE row_num < ?
    `;
    
    // currentRowIndex是从0开始，序号 = currentRowIndex + 1
    const currentRowNumber = parseInt(currentRowIndex) + 1;
    const [rows] = await pool.execute(sql, [processName, scheduleDate, currentRowNumber]);
    const total = parseFloat(rows[0]?.total || 0);
    
    console.log(`✅ 当天已排程工时: ${total.toFixed(2)}`);
    
    res.json({
      code: 200,
      data: {
        dailyScheduledHours: parseFloat(total.toFixed(2))
      },
      message: '查询成功'
    });
  } catch (error) {
    console.error('查询当天已排程工时失败:', error);
    res.status(500).json({ code: 500, message: error.message });
  }
});

// ✅ 新增：更新已占用工时（工序计划 → 工序能力负荷表）
router.post('/update-occupied-hours', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { processName, date, scheduledWorkHours } = req.body;
    
    console.log('✅ 更新已占用工时请求:', { processName, date, scheduledWorkHours });
    
    // ✅ 验证参数
    if (!processName || !date) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：processName 和 date'
      });
    }
    
    // ✅ 解析计划排程工时
    const addedHours = parseFloat(scheduledWorkHours || 0);
    
    if (addedHours === 0) {
      console.log('⚠️ 计划排程工时为0，跳过更新');
      await connection.commit();
      return res.json({
        code: 200,
        data: { updated: false, reason: '计划排程工时为0' },
        message: '计划排程工时为0，无需更新'
      });
    }
    
    // ✅ 查询当前记录
    const [rows] = await connection.execute(
      'SELECT id, occupied_hours, work_shift, available_workstations FROM process_capacity_load WHERE process_name = ? AND date = ?',
      [processName, date]
    );
    
    if (rows.length === 0) {
      console.log(`⚠️ 未找到匹配记录: 工序=${processName}, 日期=${date}`);
      await connection.commit();
      return res.json({
        code: 200,
        data: { 
          updated: false, 
          reason: '未找到匹配的工序能力负荷记录',
          processName,
          date
        },
        message: `未找到匹配记录，跳过更新：工序=${processName}, 日期=${date}`
      });
    }
    
    const record = rows[0];
    const currentOccupiedHours = parseFloat(record.occupied_hours || 0);
    const workShift = parseFloat(record.work_shift || 0);
    const availableWorkstations = parseFloat(record.available_workstations || 0);
    
    // ✅ 计算新的已占用工时 = 原已占用工时 + 计划排程工时
    const newOccupiedHours = parseFloat((currentOccupiedHours + addedHours).toFixed(2));
    
    // ✅ 重新计算剩余工时 = (上班时段 × 可用工位数量) - 新已占用工时
    const newRemainingHours = parseFloat(
      (workShift * availableWorkstations - newOccupiedHours).toFixed(2)
    );
    
    // ✅ 重新计算剩余时段 = 剩余工时 ÷ 可用工位数量
    let newRemainingShift = null;
    if (availableWorkstations > 0) {
      newRemainingShift = parseFloat(
        (newRemainingHours / availableWorkstations).toFixed(2)
      );
    }
    
    console.log(`📊 计算结果:`);
    console.log(`   原已占用工时: ${currentOccupiedHours}`);
    console.log(`   计划排程工时: ${addedHours}`);
    console.log(`   新已占用工时: ${newOccupiedHours}`);
    console.log(`   新剩余工时: ${newRemainingHours}`);
    console.log(`   新剩余时段: ${newRemainingShift}`);
    
    // ✅ 更新数据库
    await connection.execute(
      `UPDATE process_capacity_load 
       SET occupied_hours = ?, 
           remaining_hours = ?, 
           remaining_shift = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [newOccupiedHours, newRemainingHours, newRemainingShift, record.id]
    );
    
    await connection.commit();
    
    console.log(`✅ 更新成功: ID=${record.id}`);
    
    res.json({
      code: 200,
      data: {
        updated: true,
        processName,
        date,
        previousOccupiedHours: currentOccupiedHours,
        addedHours,
        newOccupiedHours,
        newRemainingHours,
        newRemainingShift
      },
      message: `已占用工时更新成功: ${currentOccupiedHours} + ${addedHours} = ${newOccupiedHours}`
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('⚠️ 更新已占用工时失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新失败: ' + error.message
    });
  } finally {
    connection.release();
  }
});

// ✅ 新增：释放已占用工时（工序计划删除 → 工序能力负荷表） - 减法逻辑
router.post('/release-occupied-hours', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { processName, date, scheduledWorkHours } = req.body;
    
    console.log('✅ 释放已占用工时请求:', { processName, date, scheduledWorkHours });
    
    // ✅ 验证参数
    if (!processName || !date) {
      await connection.rollback();
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：processName 和 date'
      });
    }
    
    // ✅ 解析要释放的工时
    const releasedHours = parseFloat(scheduledWorkHours || 0);
    
    if (releasedHours === 0) {
      console.log('⚠️ 计划排程工时为0，无需释放');
      await connection.commit();
      return res.json({
        code: 200,
        data: { updated: false, reason: '计划排程工时为0' },
        message: '计划排程工时为0，无需释放'
      });
    }
    
    // ✅ 步骤1：查询工序能力负荷表记录
    const [rows] = await connection.execute(
      'SELECT id, occupied_hours, work_shift, available_workstations FROM process_capacity_load WHERE process_name = ? AND date = ?',
      [processName, date]
    );
    
    if (rows.length === 0) {
      console.log(`⚠️ 未找到匹配记录: 工序=${processName}, 日期=${date}`);
      await connection.commit();
      return res.json({
        code: 200,
        data: { 
          updated: false, 
          reason: '未找到匹配的工序能力负荷记录',
          processName,
          date
        },
        message: `未找到匹配记录，跳过释放：工序=${processName}, 日期=${date}`
      });
    }
    
    const record = rows[0];
    const currentOccupiedHours = parseFloat(record.occupied_hours || 0);
    const workShift = parseFloat(record.work_shift || 0);
    const availableWorkstations = parseFloat(record.available_workstations || 0);
    
    // ✅ 步骤2：减法 - 已占用工时 - 被删除的计划排程工时
    const newOccupiedHours = parseFloat(Math.max(0, currentOccupiedHours - releasedHours).toFixed(2));
    
    console.log(`📊 减法计算:`);
    console.log(`   原已占用工时: ${currentOccupiedHours}`);
    console.log(`   释放工时: ${releasedHours}`);
    console.log(`   新已占用工时: ${newOccupiedHours}`);
    
    // ✅ 步骤3：重新计算剩余工时和剩余时段
    const newRemainingHours = parseFloat(
      (workShift * availableWorkstations - newOccupiedHours).toFixed(2)
    );
    
    let newRemainingShift = null;
    if (availableWorkstations > 0) {
      newRemainingShift = parseFloat(
        (newRemainingHours / availableWorkstations).toFixed(2)
      );
    }
    
    console.log(`📊 联动计算:`);
    console.log(`   新剩余工时: ${newRemainingHours}`);
    console.log(`   新剩余时段: ${newRemainingShift}`);
    
    // ✅ 步骤4：更新数据库
    await connection.execute(
      `UPDATE process_capacity_load 
       SET occupied_hours = ?, 
           remaining_hours = ?, 
           remaining_shift = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [newOccupiedHours, newRemainingHours, newRemainingShift, record.id]
    );
    
    await connection.commit();
    
    console.log(`✅ 释放成功: ID=${record.id}`);
    
    res.json({
      code: 200,
      data: {
        updated: true,
        processName,
        date,
        previousOccupiedHours: currentOccupiedHours,
        releasedHours,
        newOccupiedHours,
        newRemainingHours,
        newRemainingShift
      },
      message: `已占用工时释放成功: ${currentOccupiedHours} - ${releasedHours} = ${newOccupiedHours}`
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('⚠️ 释放已占用工时失败:', error);
    res.status(500).json({
      code: 500,
      message: '释放失败: ' + error.message
    });
  } finally {
    connection.release();
  }
});

// ✅ 新增：重新计算已占用工时（工序计划删除 → 工序能力负荷表） - SUMIF逻辑(备用)
router.post('/recalculate-occupied-hours', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { processName, date } = req.body;
    
    console.log('✅ 重新计算已占用工时请求:', { processName, date });
    
    // ✅ 验证参数
    if (!processName || !date) {
      await connection.rollback();
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：processName 和 date'
      });
    }
    
    // ✅ 步骤1：查询工序能力负荷表记录
    const [capacityRows] = await connection.execute(
      'SELECT id, work_shift, available_workstations, occupied_hours FROM process_capacity_load WHERE process_name = ? AND date = ?',
      [processName, date]
    );
    
    if (capacityRows.length === 0) {
      console.log(`⚠️ 未找到匹配记录: 工序=${processName}, 日期=${date}`);
      await connection.commit();
      return res.json({
        code: 200,
        data: { 
          updated: false, 
          reason: '未找到匹配的工序能力负荷记录',
          processName,
          date
        },
        message: `未找到匹配记录，跳过更新：工序=${processName}, 日期=${date}`
      });
    }
    
    const capacityRecord = capacityRows[0];
    const workShift = parseFloat(capacityRecord.work_shift || 0);
    const availableWorkstations = parseFloat(capacityRecord.available_workstations || 0);
    const previousOccupiedHours = parseFloat(capacityRecord.occupied_hours || 0);
    
    // ✅ 步骤2：SUMIF - 重新统计该工序+日期下所有工序计划的计划排程工时总和
    const [sumRows] = await connection.execute(
      `SELECT COALESCE(SUM(scheduled_work_hours), 0) as total_hours 
       FROM process_plans 
       WHERE process_name = ? 
         AND schedule_date = ?`,
      [processName, date]
    );
    
    const newOccupiedHours = parseFloat((sumRows[0].total_hours || 0).toFixed(2));
    
    console.log(`📊 SUMIF计算结果:`);
    console.log(`   工序名称: ${processName}`);
    console.log(`   日期: ${date}`);
    console.log(`   原已占用工时: ${previousOccupiedHours}`);
    console.log(`   重新计算后: ${newOccupiedHours}`);
    console.log(`   释放工时: ${previousOccupiedHours - newOccupiedHours}`);
    
    // ✅ 步骤3：重新计算剩余工时和剩余时段
    const newRemainingHours = parseFloat(
      (workShift * availableWorkstations - newOccupiedHours).toFixed(2)
    );
    
    let newRemainingShift = null;
    if (availableWorkstations > 0) {
      newRemainingShift = parseFloat(
        (newRemainingHours / availableWorkstations).toFixed(2)
      );
    }
    
    console.log(`📊 联动计算:`);
    console.log(`   新剩余工时: ${newRemainingHours}`);
    console.log(`   新剩余时段: ${newRemainingShift}`);
    
    // ✅ 步骤4：更新数据库
    await connection.execute(
      `UPDATE process_capacity_load 
       SET occupied_hours = ?, 
           remaining_hours = ?, 
           remaining_shift = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [newOccupiedHours, newRemainingHours, newRemainingShift, capacityRecord.id]
    );
    
    await connection.commit();
    
    console.log(`✅ 重新计算成功: ID=${capacityRecord.id}`);
    
    res.json({
      code: 200,
      data: {
        updated: true,
        processName,
        date,
        previousOccupiedHours,
        newOccupiedHours,
        releasedHours: parseFloat((previousOccupiedHours - newOccupiedHours).toFixed(2)),
        newRemainingHours,
        newRemainingShift
      },
      message: `已占用工时重新计算成功: ${previousOccupiedHours} → ${newOccupiedHours} (释放${(previousOccupiedHours - newOccupiedHours).toFixed(2)}小时)`
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('⚠️ 重新计算已占用工时失败:', error);
    res.status(500).json({
      code: 500,
      message: '重新计算失败: ' + error.message
    });
  } finally {
    connection.release();
  }
});

// ✅ 新增：批量重置所有已占用工时（工序能力负荷表 - 手动触发）
router.post('/reset-all-occupied-hours', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    console.log('✅ 开始批量重置所有已占用工时...');
    
    // ✅ 步骤1：查询所有工序能力负荷记录
    const [capacityRecords] = await connection.execute(
      'SELECT id, process_name, date, work_shift, available_workstations, occupied_hours FROM process_capacity_load ORDER BY process_name, date'
    );
    
    console.log(`📊 查询到 ${capacityRecords.length} 条工序能力负荷记录`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let totalReleasedHours = 0;
    
    // ✅ 步骤2：逐条重新计算已占用工时
    for (const record of capacityRecords) {
      try {
        const processName = record.process_name;
        const date = record.date;
        const workShift = parseFloat(record.work_shift || 0);
        const availableWorkstations = parseFloat(record.available_workstations || 0);
        const previousOccupiedHours = parseFloat(record.occupied_hours || 0);
        
        // ✅ 格式化日期以确保正确匹配 (修复时区问题)
        let formattedDate;
        if (date instanceof Date) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`;
        } else {
          formattedDate = String(date).split('T')[0];
        }
        
        console.log(`🔍 处理记录: 工序=${processName}, 原始日期=${date}, 格式化日期=${formattedDate}, 当前占用工时=${previousOccupiedHours}`);
        
        // ✅ SUMIF - 重新统计该工序+日期下所有工序计划的计划排程工时总和
        // ✅ 修复：从所有工序计划表中统计，不仅仅是打包工序计划
        let totalScheduledHours = 0;
        
        // 1. 打包工序计划 (real_process_plans)
        const [realRows] = await connection.execute(
          `SELECT COALESCE(SUM(scheduled_work_hours), 0) as total_hours 
           FROM real_process_plans 
           WHERE process_name = ? 
             AND schedule_date = ?`,
          [processName, formattedDate]
        );
        totalScheduledHours += parseFloat(realRows[0].total_hours || 0);
        console.log(`  1️⃣ 打包工序计划: ${realRows[0].total_hours || 0}`);
        
        // 2. 组装工序计划 (assembly_process_plans)
        const [assemblyRows] = await connection.execute(
          `SELECT COALESCE(SUM(scheduled_work_hours), 0) as total_hours 
           FROM assembly_process_plans 
           WHERE process_name = ? 
             AND schedule_date = ?`,
          [processName, formattedDate]
        );
        totalScheduledHours += parseFloat(assemblyRows[0].total_hours || 0);
        console.log(`  2️⃣ 组装工序计划: ${assemblyRows[0].total_hours || 0}`);
        
        // 3. 喷塑/打包工序计划 (packing_process_plans - 包含喷塑和打包两种工序)
        const [packingRows] = await connection.execute(
          `SELECT COALESCE(SUM(scheduled_work_hours), 0) as total_hours 
           FROM packing_process_plans 
           WHERE process_name = ? 
             AND schedule_date = ?`,
          [processName, formattedDate]
        );
        totalScheduledHours += parseFloat(packingRows[0].total_hours || 0);
        console.log(`  3️⃣ 喷塑/打包工序计划: ${packingRows[0].total_hours || 0}`);
        
        // 4. 缝纫工序计划 (sewing_process_plans)
        const [sewingRows] = await connection.execute(
          `SELECT COALESCE(SUM(scheduled_work_hours), 0) as total_hours 
           FROM sewing_process_plans 
           WHERE process_name = ? 
             AND schedule_date = ?`,
          [processName, formattedDate]
        );
        totalScheduledHours += parseFloat(sewingRows[0].total_hours || 0);
        console.log(`  4️⃣ 缝纫工序计划: ${sewingRows[0].total_hours || 0}`);
        
        // ✅ 汇总所有工序计划的工时
        const newOccupiedHours = parseFloat(totalScheduledHours.toFixed(2));
        
        console.log(`  📊 汇总: ${newOccupiedHours}小时 (原 ${previousOccupiedHours}小时)`);
        
        // ✅ 重新计算剩余工时和剩余时段
        const newRemainingHours = parseFloat(
          (workShift * availableWorkstations - newOccupiedHours).toFixed(2)
        );
        
        let newRemainingShift = null;
        if (availableWorkstations > 0) {
          newRemainingShift = parseFloat(
            (newRemainingHours / availableWorkstations).toFixed(2)
          );
        }
        
        // ✅ 只有当占用工时实际发生变化时才更新
        const hoursChanged = Math.abs(previousOccupiedHours - newOccupiedHours) > 0.01;
        
        if (hoursChanged) {
          await connection.execute(
            `UPDATE process_capacity_load 
             SET occupied_hours = ?, 
                 remaining_hours = ?, 
                 remaining_shift = ?,
                 updated_at = NOW()
             WHERE id = ?`,
            [newOccupiedHours, newRemainingHours, newRemainingShift, record.id]
          );
          
          updatedCount++;
          const releasedHours = previousOccupiedHours - newOccupiedHours;
          totalReleasedHours += releasedHours;
          
          console.log(`✅ [工序=${processName}, 日期=${formattedDate}] ${previousOccupiedHours} → ${newOccupiedHours} (释放${releasedHours.toFixed(2)}小时)`);
        } else {
          console.log(`⚪ [工序=${processName}, 日期=${formattedDate}] 无需更新: ${previousOccupiedHours} = ${newOccupiedHours}`);
        }
        
      } catch (error) {
        console.error(`⚠️ [工序=${record.process_name}, 日期=${record.date}] 重置失败:`, error);
        // 继续处理其他记录
      }
    }
    
    await connection.commit();
    
    console.log(`✅ 批量重置完成:`);
    console.log(`   总记录数: ${capacityRecords.length}`);
    console.log(`   更新记录: ${updatedCount}`);
    console.log(`   跳过记录: ${skippedCount}`);
    console.log(`   释放总工时: ${totalReleasedHours.toFixed(2)}小时`);
    
    res.json({
      code: 200,
      data: {
        totalRecords: capacityRecords.length,
        updatedCount,
        skippedCount,
        totalReleasedHours: parseFloat(totalReleasedHours.toFixed(2))
      },
      message: `批量重置成功：总计${capacityRecords.length}条记录，更新${updatedCount}条，释放${totalReleasedHours.toFixed(2)}小时`
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('⚠️ 批量重置失败:', error);
    res.status(500).json({
      code: 500,
      message: '批量重置失败: ' + error.message
    });
  } finally {
    connection.release();
  }
});

// 从工序加载数据到工序能力负荷表
router.post('/load-from-processes', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { processes } = req.body; // processes: [{processName, availableWorkstations}]
    
    if (!processes || processes.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请至少选择一个工序'
      });
    }
    
    // 获取显示天数配置
    const [settingRows] = await connection.execute(
      "SELECT setting_value FROM page_settings WHERE page_key = 'capacity-load' AND setting_key = 'displayDays'"
    );
    
    const displayDays = settingRows.length > 0 ? parseInt(settingRows[0].setting_value) : 120;
    
    // 系统当天日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let insertedCount = 0;
    let updatedCount = 0;
    
    // ✅ 为每个工序生成未来N天的数据，并根据企业日历计算上班时段
    for (const process of processes) {
      const { processName, availableWorkstations } = process;
      
      for (let i = 0; i < displayDays; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        
        // ✅ 使用本地时区格式化日期（避免时区问题）
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        // ✅ 规则1：查询企业日历的标准上班时长
        const [calendarRows] = await connection.execute(
          'SELECT standard_work_hours FROM company_calendar WHERE calendar_date = ?',
          [dateStr]
        );
        
        // ✅ 上班时段直接使用标准上班时长（小时数，保留2位小数）
        let workShift = null;
        if (calendarRows.length > 0 && calendarRows[0].standard_work_hours > 0) {
          workShift = parseFloat(calendarRows[0].standard_work_hours).toFixed(2);
        }
        
        // ✅ 计算初始剩余工时和剩余时段
        const workShiftValue = parseFloat(workShift) || 0;
        const availableWorkstationsValue = availableWorkstations || 0;
        const occupiedHoursValue = 0; // 初始已占用工时为0
        
        // 剩余工时 = (上班时段 × 可用工位数量) - 已占用工时
        const remainingHours = parseFloat(
          (workShiftValue * availableWorkstationsValue - occupiedHoursValue).toFixed(2)
        );
        
        // 剩余时段 = 剩余工时 ÷ 可用工位数量
        let remainingShift = null;
        if (availableWorkstationsValue > 0) {
          remainingShift = parseFloat(
            (remainingHours / availableWorkstationsValue).toFixed(2)
          ).toString();
        }
        
        // 使用 INSERT ... ON DUPLICATE KEY UPDATE
        const [result] = await connection.execute(`
          INSERT INTO process_capacity_load (
            process_name, date, available_workstations,
            work_shift, occupied_hours, remaining_shift, remaining_hours, overtime_shift
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
          ON DUPLICATE KEY UPDATE
            available_workstations = VALUES(available_workstations),
            work_shift = VALUES(work_shift),
            remaining_hours = VALUES(remaining_hours),
            remaining_shift = VALUES(remaining_shift)
        `, [processName, dateStr, availableWorkstationsValue, workShift, occupiedHoursValue, remainingShift, remainingHours]);
        
        if (result.affectedRows === 1) {
          insertedCount++;
        } else if (result.affectedRows === 2) {
          updatedCount++;
        }
      }
    }
    
    await connection.commit();
    
    res.json({
      code: 200,
      data: {
        insertedCount,
        updatedCount,
        totalProcesses: processes.length,
        displayDays
      },
      message: `成功加载${processes.length}个工序，生成${insertedCount}条新记录，更新${updatedCount}条记录`
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('加载工序到能力负荷表失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  } finally {
    connection.release();
  }
});

// 获取页面设置
router.get('/settings/:pageKey', async (req, res) => {
  try {
    const { pageKey } = req.params;
    
    const [rows] = await pool.execute(
      'SELECT setting_key, setting_value FROM page_settings WHERE page_key = ?',
      [pageKey]
    );
    
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    res.json({
      code: 200,
      data: settings,
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取页面设置失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 保存页面设置
router.post('/settings/:pageKey', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { pageKey } = req.params;
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      await connection.execute(`
        INSERT INTO page_settings (page_key, setting_key, setting_value)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
      `, [pageKey, key, String(value)]);
    }
    
    await connection.commit();
    
    res.json({
      code: 200,
      message: '保存成功'
    });
  } catch (error) {
    await connection.rollback();
    console.error('保存页面设置失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  } finally {
    connection.release();
  }
});

// 更新单条记录
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const [result] = await pool.execute(`
      UPDATE process_capacity_load SET
        overtime_shift = ?,
        work_shift = ?,
        occupied_hours = ?,
        remaining_shift = ?,
        remaining_hours = ?
      WHERE id = ?
    `, [
      data.overtime_shift || data.overtimeShift || null,
      data.work_shift || data.workShift || null,
      data.occupied_hours || data.occupiedHours || 0,
      data.remaining_shift || data.remainingShift || null,
      data.remaining_hours || data.remainingHours || 0,
      id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: '记录不存在'
      });
    }
    
    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 重置上班时段（根据企业日历重新计算）
router.post('/reset-work-shift', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    console.log('[重置上班时段] 开始重新计算...');
    
    // 查询企业日历的所有工作日数据
    const [calendarData] = await connection.execute(`
      SELECT calendar_date, standard_work_hours 
      FROM company_calendar 
      WHERE is_workday = 1
    `);
    
    let updatedCount = 0;
    
    // 批量更新工序能力负荷表
    for (const calendar of calendarData) {
      // ✅ 修复日期格式化问题:使用本地时区格式化,避免UTC转换导致日期错位
      const date = new Date(calendar.calendar_date);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const hours = calendar.standard_work_hours;
      
      console.log(`  处理日期: ${dateStr}, 标准工时: ${hours}`);
      
      // ✅ 上班时段直接使用标准上班时长（小时数，保留2位小数）
      let workShift = null;
      if (hours > 0) {
        workShift = parseFloat(hours).toFixed(2);
      }
      
      // 更新该日期所有工序的上班时段
      const [updateResult] = await connection.execute(`
        UPDATE process_capacity_load 
        SET work_shift = ? 
        WHERE date = ?
      `, [workShift, dateStr]);
      
      console.log(`  更新 ${updateResult.affectedRows} 条记录`);
      updatedCount += updateResult.affectedRows;
    }
    
    // 将休息日的上班时段设为 NULL
    const [restDayResult] = await connection.execute(`
      UPDATE process_capacity_load pcl
      LEFT JOIN company_calendar cc ON pcl.date = cc.calendar_date
      SET pcl.work_shift = NULL
      WHERE cc.is_workday = 0 OR cc.calendar_date IS NULL
    `);
    
    updatedCount += restDayResult.affectedRows;
    
    await connection.commit();
    
    console.log(`[重置上班时段] 完成，共更新 ${updatedCount} 条记录`);
    
    res.json({
      code: 200,
      data: {
        updatedCount
      },
      message: `重置成功，共更新 ${updatedCount} 条记录`
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('重置上班时段失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  } finally {
    connection.release();
  }
});

// 删除过期数据（每天凌晨0:00执行）
router.delete('/cleanup', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    const [result] = await pool.execute(
      'DELETE FROM process_capacity_load WHERE date < ?',
      [todayStr]
    );
    
    res.json({
      code: 200,
      data: { deletedCount: result.affectedRows },
      message: `清理了${result.affectedRows}条过期数据`
    });
  } catch (error) {
    console.error('清理过期数据失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 重置剩余工时（批量重新计算所有记录）
router.post('/reset-remaining-hours', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    console.log('[重置剩余工时] 开始重新计算...');
    
    // 查询所有工序能力负荷表数据
    const [records] = await connection.execute(`
      SELECT id, work_shift, available_workstations, occupied_hours 
      FROM process_capacity_load
    `);
    
    let updatedCount = 0;
    
    // 逐条计算并更新
    for (const record of records) {
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
      const [updateResult] = await connection.execute(`
        UPDATE process_capacity_load 
        SET remaining_hours = ?, remaining_shift = ?
        WHERE id = ?
      `, [remainingHours, remainingShift, record.id]);
      
      updatedCount += updateResult.affectedRows;
    }
    
    await connection.commit();
    
    console.log(`[重置剩余工时] 完成，共更新 ${updatedCount} 条记录`);
    
    res.json({
      code: 200,
      data: { updatedCount },
      message: `重置成功，共更新 ${updatedCount} 条记录`
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('重置剩余工时失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  } finally {
    connection.release();
  }
});

// ✅ 查询指定日期和工序的能力负荷信息（用于计算当天总工时）
router.get('/query-by-date', async (req, res) => {
  console.log('📡 接收到查询指定日期能力负荷GET请求')
  try {
    const { processName, date } = req.query
    
    if (!processName || !date) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：processName和date'
      })
    }
    
    console.log(`🔍 查询参数: 工序=${processName}, 日期=${date}`)
    
    const sql = `
      SELECT available_workstations, work_shift
      FROM process_capacity_load
      WHERE process_name = ? AND date = ?
      LIMIT 1
    `
    
    const [rows] = await pool.execute(sql, [processName, date])
    
    if (rows.length > 0) {
      const capacity = rows[0]
      console.log(`✅ 找到能力负荷信息: 可用工位=${capacity.available_workstations}, 上班时段=${capacity.work_shift}`)
      
      res.json({
        code: 200,
        data: {
          availableWorkstations: parseFloat(capacity.available_workstations) || 0,
          workShift: parseFloat(capacity.work_shift) || 0
        },
        message: '查询成功'
      })
    } else {
      console.log(`⚠️ 未找到能力负荷信息`)
      res.json({
        code: 200,
        data: {
          availableWorkstations: 0,
          workShift: 0
        },
        message: '未找到对应记录'
      })
    }
  } catch (error) {
    console.error('查询能力负荷失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message
    })
  }
})

// ✅ 需求1：查询下一个排程日期（MINIFS：工序名称=本行工序，且日期>计划排程日期，且日期<=计划结束日期，且剩余工时>门槛值）
router.post('/query-next-schedule-date', async (req, res) => {
  console.log('📡 接收到下一个排程日期POST请求')
  try {
    const { processName, scheduleDate, planEndDate, minRemainingHours } = req.body
    
    console.log('🔍 查询下一个排程日期参数:', { processName, scheduleDate, planEndDate, minRemainingHours })
    
    // ✅ 生成条件：计划排程日期不为空 且 计划结束日期不为空
    if (!processName || !scheduleDate || !planEndDate) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：processName、scheduleDate 和 planEndDate'
      })
    }
    
    // ✅ 使用传入的minRemainingHours，默认0.5
    const minHours = parseFloat(minRemainingHours) || 0.5
    
    console.log(`🔍 MINIFS查询条件:`, {
      '工序名称': processName,
      '日期>': scheduleDate,
      '日期<=': planEndDate,  // ✅ 必填
      '剩余工时>': minHours
    })
    
    // ✅ 查询规则：MINIFS - 多条件查询数组中最小的值
    // 1. 工序名称相同
    // 2. 日期 > 计划排程日期
    // 3. 日期 <= 计划结束日期 (必填)
    // 4. 剩余工时 > minHours
    // 5. 按日期升序排列，取第一条（即最小日期）
    
    // ✅ 构建SQL - 计划结束日期为必填条件
    const sql = `
      SELECT DATE_FORMAT(date, '%Y-%m-%d') as formatted_date, remaining_hours 
      FROM process_capacity_load 
      WHERE process_name = ? 
        AND DATE_FORMAT(date, '%Y-%m-%d') > ?
        AND DATE_FORMAT(date, '%Y-%m-%d') <= ?
        AND remaining_hours > ? 
      ORDER BY date ASC 
      LIMIT 1`
    
    const params = [processName, scheduleDate, planEndDate, minHours]
    
    console.log('🔍 SQL:', sql)
    console.log('🔍 参数:', params)
    
    const [rows] = await pool.execute(sql, params)
    
    if (rows.length > 0) {
      const result = rows[0]
      const nextDate = result.formatted_date
      console.log(`✅ 找到下一个排程日期: ${nextDate}, 剩余工时: ${result.remaining_hours}`)
      
      res.json({
        code: 200,
        data: {
          nextScheduleDate: nextDate,
          remainingHours: result.remaining_hours
        },
        message: '查询成功'
      })
    } else {
      console.log('⚠️ 未找到符合条件的日期，使用默认计算方式')
      
      // ✅ 如果没有找到符合条件的日期，使用默认计算方式：计划排程日期+1天
      const nextDate = new Date(scheduleDate)
      nextDate.setDate(nextDate.getDate() + 1)
      const defaultNextDate = nextDate.toISOString().split('T')[0]
      
      res.json({
        code: 200,
        data: {
          nextScheduleDate: defaultNextDate,
          remainingHours: null
        },
        message: '未找到符合条件的日期，使用默认计算方式'
      })
    }
  } catch (error) {
    console.error('查询下一个排程日期失败:', error)
    // ✅ 出错时也使用默认计算方式
    const { scheduleDate } = req.body
    if (scheduleDate) {
      const nextDate = new Date(scheduleDate)
      nextDate.setDate(nextDate.getDate() + 1)
      const defaultNextDate = nextDate.toISOString().split('T')[0]
      
      res.json({
        code: 200,
        data: {
          nextScheduleDate: defaultNextDate,
          remainingHours: null
        },
        message: '查询出错，使用默认计算方式'
      })
    } else {
      res.status(500).json({
        code: 500,
        message: error.message
      })
    }
  }
})

module.exports = router;
