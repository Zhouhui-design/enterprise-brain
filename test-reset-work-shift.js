const { pool } = require('./backend/config/database');

(async () => {
  try {
    console.log('🧪 测试"重置上班时段"逻辑\n');
    
    // 1. 查询企业日历样本数据
    console.log('1️⃣ 查询企业日历前5条数据:');
    const [calendar] = await pool.execute(`
      SELECT 
        DATE_FORMAT(calendar_date, '%Y-%m-%d') as calendar_date,
        DATE_FORMAT(actual_date, '%Y-%m-%d') as actual_date,
        weekday,
        is_workday,
        standard_work_hours
      FROM company_calendar
      ORDER BY actual_date
      LIMIT 5
    `);
    
    calendar.forEach(r => {
      console.log(`  日历日期=${r.calendar_date}, 真日期=${r.actual_date}, ${r.weekday}, 工作日=${r.is_workday}, 标准工时=${r.standard_work_hours}`);
    });
    
    // 2. 查询工序能力负荷表样本数据（重置前）
    console.log('\n2️⃣ 查询工序能力负荷表前5条数据（重置前）:');
    const [capacityBefore] = await pool.execute(`
      SELECT 
        process_name,
        DATE_FORMAT(date, '%Y-%m-%d') as date,
        work_shift,
        available_workstations
      FROM process_capacity_load
      ORDER BY date, process_name
      LIMIT 5
    `);
    
    capacityBefore.forEach(r => {
      console.log(`  工序=${r.process_name}, 日期=${r.date}, 上班时段=${r.work_shift}, 工位=${r.available_workstations}`);
    });
    
    // 3. 模拟"重置上班时段"逻辑
    console.log('\n3️⃣ 模拟匹配逻辑:');
    const actualDate = '2025-12-23';  // 用户示例日期
    
    const [matchResult] = await pool.execute(`
      SELECT 
        DATE_FORMAT(actual_date, '%Y-%m-%d') as actual_date,
        weekday,
        is_workday,
        standard_work_hours
      FROM company_calendar
      WHERE DATE_FORMAT(actual_date, '%Y-%m-%d') = ?
    `, [actualDate]);
    
    if (matchResult.length > 0) {
      const match = matchResult[0];
      console.log(`  ✅ 找到匹配: 真日期=${match.actual_date}, ${match.weekday}, 工作日=${match.is_workday}, 标准工时=${match.standard_work_hours}`);
      
      const workShift = match.is_workday === 1 && match.standard_work_hours > 0 
        ? parseFloat(match.standard_work_hours).toFixed(2) 
        : null;
      
      console.log(`  📊 计算结果: 上班时段=${workShift || 'NULL'}`);
      
      // 查询该日期在工序能力负荷表中的记录数
      const [countResult] = await pool.execute(`
        SELECT COUNT(*) as count
        FROM process_capacity_load
        WHERE DATE_FORMAT(date, '%Y-%m-%d') = ?
      `, [actualDate]);
      
      console.log(`  📝 该日期在工序能力负荷表中有 ${countResult[0].count} 条记录`);
    } else {
      console.log(`  ❌ 未找到匹配: 真日期=${actualDate} 在企业日历中不存在`);
    }
    
    // 4. 统计当前work_shift为NULL的记录数
    console.log('\n4️⃣ 统计工序能力负荷表中上班时段状态:');
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN work_shift IS NULL THEN 1 ELSE 0 END) as null_count,
        SUM(CASE WHEN work_shift IS NOT NULL THEN 1 ELSE 0 END) as not_null_count
      FROM process_capacity_load
    `);
    
    console.log(`  总记录数: ${stats[0].total}`);
    console.log(`  上班时段为NULL: ${stats[0].null_count} (${(stats[0].null_count / stats[0].total * 100).toFixed(2)}%)`);
    console.log(`  上班时段有值: ${stats[0].not_null_count} (${(stats[0].not_null_count / stats[0].total * 100).toFixed(2)}%)`);
    
    console.log('\n✅ 测试完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
})();
