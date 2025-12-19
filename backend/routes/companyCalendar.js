const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// 中国法定节假日配置（2025年）
const HOLIDAYS_2025 = {
  '2025-01-01': '元旦',
  '2025-01-28': '春节',
  '2025-01-29': '春节',
  '2025-01-30': '春节',
  '2025-01-31': '春节',
  '2025-02-01': '春节',
  '2025-02-02': '春节',
  '2025-02-03': '春节',
  '2025-04-04': '清明节',
  '2025-04-05': '清明节',
  '2025-04-06': '清明节',
  '2025-05-01': '劳动节',
  '2025-05-02': '劳动节',
  '2025-05-03': '劳动节',
  '2025-05-31': '端午节',
  '2025-06-01': '端午节',
  '2025-06-02': '端午节',
  '2025-10-01': '国庆节',
  '2025-10-02': '国庆节',
  '2025-10-03': '国庆节',
  '2025-10-04': '国庆节',
  '2025-10-05': '国庆节',
  '2025-10-06': '国庆节',
  '2025-10-07': '国庆节',
  '2025-10-08': '国庆节'
};

// 获取星期几
function getWeekday(date) {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return weekdays[date.getDay()];
}

// 判断是否为工作日
function isWorkday(date, weekendMode) {
  const day = date.getDay();
  
  // ✅ 使用本地时区格式化日期
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${dayOfMonth}`;
  
  // 如果是法定节假日，不是工作日
  if (HOLIDAYS_2025[dateStr]) {
    return false;
  }
  
  // 根据单休/双休判断
  if (weekendMode === 'single') {
    // 单休：周日休息
    return day !== 0;
  } else {
    // 双休：周六周日休息
    return day !== 0 && day !== 6;
  }
}

// 获取企业日历列表
router.get('/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 50, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    // 获取页面设置
    const [settings] = await pool.query(
      "SELECT setting_key, setting_value FROM page_settings WHERE page_key = 'company-calendar'"
    );
    
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.setting_key] = s.setting_value;
    });
    
    const daysAfterToday = parseInt(settingsMap.daysAfterToday) || 365;
    
    // 计算默认日期范围（从今天到未来N天）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // ✅ 使用本地时区格式化日期
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + daysAfterToday);
    
    // ✅ 使用本地时区格式化日期
    const futureYear = futureDate.getFullYear();
    const futureMonth = String(futureDate.getMonth() + 1).padStart(2, '0');
    const futureDay = String(futureDate.getDate()).padStart(2, '0');
    const futureDateStr = `${futureYear}-${futureMonth}-${futureDay}`;
    
    // 构建WHERE条件
    let whereConditions = [];
    let queryParams = [];
    
    if (startDate && endDate) {
      // 用户筛选日期范围
      whereConditions.push('calendar_date BETWEEN ? AND ?');
      queryParams.push(startDate, endDate);
    } else {
      // 默认显示从今天到未来N天
      whereConditions.push('calendar_date BETWEEN ? AND ?');
      queryParams.push(todayStr, futureDateStr);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';
    
    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM company_calendar ${whereClause}`;
    const [countResult] = await pool.query(countSql, queryParams);
    const total = countResult[0].total;
    
    // 分页查询数据
    const dataSql = `SELECT * FROM company_calendar ${whereClause} ORDER BY calendar_date ASC LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;
    const [rows] = await pool.query(dataSql, queryParams);
    
    res.json({
      code: 200,
      data: {
        records: rows.map(row => ({
          id: row.id,
          calendarDate: row.calendar_date,
          actualDate: row.actual_date,
          weekday: row.weekday,
          isWorkday: row.is_workday,
          standardWorkHours: row.standard_work_hours,
          adjustedWorkHours: row.adjusted_work_hours,
          isAdjusted: row.is_adjusted,
          holidayName: row.holiday_name,
          remark: row.remark,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        })),
        total: total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取企业日历失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// ✅ 批量查询企业日历(为工序能力负荷表lookup提供支持)
router.post('/batch-query', async (req, res) => {
  try {
    const { dates } = req.body;
    
    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供有效的日期数组'
      });
    }
    
    console.log(`[Batch Query] 查询 ${dates.length} 个日期的企业日历数据`);
    
    // ✅ 修复：使用actual_date匹配工序能力负荷表的date
    // 构建 IN 查询
    const placeholders = dates.map(() => '?').join(',');
    const sql = `
      SELECT 
        DATE_FORMAT(calendar_date, '%Y-%m-%d') as calendar_date,
        DATE_FORMAT(actual_date, '%Y-%m-%d') as actual_date,
        is_workday, 
        standard_work_hours, 
        adjusted_work_hours, 
        is_adjusted
      FROM company_calendar
      WHERE DATE_FORMAT(actual_date, '%Y-%m-%d') IN (${placeholders})
    `;
    
    const [rows] = await pool.query(sql, dates);
    
    console.log(`[Batch Query] 找到 ${rows.length} 条匹配记录`);
    
    res.json({
      code: 200,
      data: rows,
      message: '查询成功'
    });
  } catch (error) {
    console.error('批量查询企业日历失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 更新企业日历（支持批量更新调整工时）
router.put('/update/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { adjustedWorkHours, isAdjusted, remark } = req.body;
    
    await connection.execute(
      `UPDATE company_calendar 
       SET adjusted_work_hours = ?, 
           is_adjusted = ?, 
           remark = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [adjustedWorkHours, isAdjusted ? 1 : 0, remark, id]
    );
    
    await connection.commit();
    
    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    await connection.rollback();
    console.error('更新企业日历失败:', error);
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
    
    const [rows] = await pool.query(
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
      await connection.execute(
        `INSERT INTO page_settings (page_key, setting_key, setting_value) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [pageKey, key, value.toString()]
      );
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

// 初始化日历数据（手动触发）
router.post('/init', async (req, res) => {
  try {
    await dailyUpdateCalendar();
    res.json({
      code: 200,
      message: '初始化成功'
    });
  } catch (error) {
    console.error('初始化日历失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 获取自定义节日列表
router.get('/custom-holidays', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM custom_holidays ORDER BY month, day'
    );
    
    const holidays = rows.map(row => ({
      id: row.id,
      name: row.name,
      dateType: row.date_type,  // 'solar' or 'lunar'
      month: row.month,
      day: row.day,
      remark: row.remark
    }));
    
    res.json({
      code: 200,
      data: { holidays },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取自定义节日失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 保存自定义节日列表
router.post('/custom-holidays', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { holidays } = req.body;
    
    // 清空现有数据
    await connection.execute('DELETE FROM custom_holidays');
    
    // 插入新数据
    if (holidays && holidays.length > 0) {
      for (const holiday of holidays) {
        await connection.execute(
          `INSERT INTO custom_holidays (name, date_type, month, day, remark) 
           VALUES (?, ?, ?, ?, ?)`,
          [holiday.name, holiday.dateType, holiday.month, holiday.day, holiday.remark || null]
        );
      }
    }
    
    await connection.commit();
    
    res.json({
      code: 200,
      message: '保存成功'
    });
  } catch (error) {
    await connection.rollback();
    console.error('保存自定义节日失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  } finally {
    connection.release();
  }
});

// 每日自动更新日历数据
async function dailyUpdateCalendar() {
  const connection = await pool.getConnection();
  try {
    console.log('[定时任务] 开始更新企业日历...');
    
    await connection.beginTransaction();
    
    // 获取页面设置
    const [settings] = await connection.query(
      "SELECT setting_key, setting_value FROM page_settings WHERE page_key = 'company-calendar'"
    );
    
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.setting_key] = s.setting_value;
    });
    
    const daysBeforeToday = parseInt(settingsMap.daysBeforeToday) || 90;
    const daysAfterToday = parseInt(settingsMap.daysAfterToday) || 365;
    const standardWorkHours = parseFloat(settingsMap.standardWorkHours) || 8;
    const weekendMode = settingsMap.weekendMode || 'double';
    
    console.log(`[定时任务] 业务变量: 休息模式=${weekendMode}, 标准工时=${standardWorkHours}`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 删除超出范围的旧数据
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - daysBeforeToday - 1);
    
    // ✅ 使用本地时区格式化日期
    const cutoffYear = cutoffDate.getFullYear();
    const cutoffMonth = String(cutoffDate.getMonth() + 1).padStart(2, '0');
    const cutoffDay = String(cutoffDate.getDate()).padStart(2, '0');
    const cutoffDateStr = `${cutoffYear}-${cutoffMonth}-${cutoffDay}`;
    
    const [deleteResult] = await connection.execute(
      'DELETE FROM company_calendar WHERE calendar_date < ?',
      [cutoffDateStr]
    );
    console.log(`[定时任务] 删除了 ${deleteResult.affectedRows} 条过期数据`);
    
    // ✅ 生成未来数据（使用 ON DUPLICATE KEY UPDATE 以支持更新现有数据）
    let insertedCount = 0;
    let updatedCount = 0;
    
    for (let i = -daysBeforeToday; i <= daysAfterToday; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      
      // ✅ 使用本地时区格式化日期（避免时区问题）
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const weekday = getWeekday(currentDate);
      const isWork = isWorkday(currentDate, weekendMode);  // ✅ 根据新的 weekendMode 重新计算
      const holidayName = HOLIDAYS_2025[dateStr] || null;
      
      // ✅ 使用 ON DUPLICATE KEY UPDATE 更新已存在的记录，强制重新计算工作日状态
      const [result] = await connection.execute(
        `INSERT INTO company_calendar 
         (calendar_date, weekday, is_workday, standard_work_hours, holiday_name) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           weekday = VALUES(weekday),
           is_workday = VALUES(is_workday),
           standard_work_hours = CASE 
             WHEN is_adjusted = 1 THEN standard_work_hours  -- 如果已调整工时，保持调整后的工时
             ELSE VALUES(standard_work_hours)  -- 否则使用新的标准工时
           END,
           holiday_name = VALUES(holiday_name),
           updated_at = CURRENT_TIMESTAMP`,
        [dateStr, weekday, isWork ? 1 : 0, isWork ? standardWorkHours : 0, holidayName]
      );
      
      if (result.affectedRows === 1) {
        insertedCount++;
      } else if (result.affectedRows === 2) {
        updatedCount++;
        console.log(`[定时任务] 更新日期 ${dateStr}: 休息模式=${weekendMode}, 是否工作日=${isWork}, 星期=${weekday}`);
      }
    }
    
    console.log(`[定时任务] 新增了 ${insertedCount} 条日历数据，更新了 ${updatedCount} 条日历数据`);
    
    // ✅ 规则2：同步更新工序能力负荷表的上班时段
    console.log('[定时任务] 开始同步更新工序能力负荷表...');
    
    // 查询所有需要更新的日期和对应的标准工时
    const [calendarData] = await connection.execute(`
      SELECT calendar_date, standard_work_hours 
      FROM company_calendar 
      WHERE calendar_date >= ? AND is_workday = 1
    `, [cutoffDateStr]);
    
    let capacitySyncCount = 0;
    
    // 批量更新工序能力负荷表
    for (const calendar of calendarData) {
      // 正确处理日期格式 - calendar.calendar_date 可能是 Date 对象或字符串
      let dateStr;
      if (calendar.calendar_date instanceof Date) {
        dateStr = calendar.calendar_date.toISOString().split('T')[0];
      } else {
        dateStr = calendar.calendar_date.toString().split('T')[0];
      }
      
      const hours = calendar.standard_work_hours;
      
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
      
      capacitySyncCount += updateResult.affectedRows;
      
      // 记录详细信息用于调试
      if (dateStr.startsWith('2025-12-1') || dateStr.startsWith('2025-12-2')) {
        console.log(`[定时任务] 同步 ${dateStr}: 标准工时=${hours}, 上班时段=${workShift}, 更新记录数=${updateResult.affectedRows}`);
      }
    }
    
    console.log(`[定时任务] 同步更新了 ${capacitySyncCount} 条工序能力负荷记录`);
    
    await connection.commit();
    console.log('[定时任务] 企业日历更新完成');
    
  } catch (error) {
    await connection.rollback();
    console.error('[定时任务] 企业日历更新失败:', error);
    throw error;  // ✅ 抛出错误以便前端知道初始化失败
  } finally {
    connection.release();
  }
}

// 导出每日更新函数供定时任务使用
module.exports = router;
module.exports.dailyUpdateCalendar = dailyUpdateCalendar;
