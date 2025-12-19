const { pool } = require('./backend/config/database');

(async () => {
  try {
    console.log('🔍 验证2025-12-19的匹配结果\n');
    
    // 1. 查看企业日历中的2025-12-19
    console.log('1️⃣ 企业日历中calendar_date=2025-12-19的数据:');
    const [calendar] = await pool.execute(`
      SELECT 
        DATE_FORMAT(calendar_date, '%Y-%m-%d') as calendar_date,
        DATE_FORMAT(actual_date, '%Y-%m-%d') as actual_date,
        weekday,
        is_workday,
        standard_work_hours
      FROM company_calendar
      WHERE DATE_FORMAT(calendar_date, '%Y-%m-%d') = '2025-12-19'
    `);
    
    if (calendar.length > 0) {
      console.log(`✅ 找到匹配记录:`);
      console.log(`  日历日期: ${calendar[0].calendar_date}`);
      console.log(`  真日期: ${calendar[0].actual_date}`);
      console.log(`  星期: ${calendar[0].weekday}`);
      console.log(`  是否工作日: ${calendar[0].is_workday}`);
      console.log(`  标准工时: ${calendar[0].standard_work_hours}`);
    } else {
      console.log(`❌ 未找到匹配记录`);
    }
    
    // 2. 查看工序能力负荷表中date=2025-12-19的数据
    console.log('\n2️⃣ 工序能力负荷表中date=2025-12-19的数据（前5条）:');
    const [capacity] = await pool.execute(`
      SELECT 
        process_name,
        DATE_FORMAT(date, '%Y-%m-%d') as date_str,
        work_shift,
        available_workstations
      FROM process_capacity_load
      WHERE DATE_FORMAT(date, '%Y-%m-%d') = '2025-12-19'
      LIMIT 5
    `);
    
    console.log('工序 | 日期 | 上班时段 | 工位');
    console.log('-----|------|----------|------');
    capacity.forEach(r => {
      console.log(`${r.process_name} | ${r.date_str} | ${r.work_shift || 'NULL'} | ${r.available_workstations}`);
    });
    
    // 3. 统计2025-12-19的上班时段值分布
    const [stats] = await pool.execute(`
      SELECT 
        work_shift,
        COUNT(*) as count
      FROM process_capacity_load
      WHERE DATE_FORMAT(date, '%Y-%m-%d') = '2025-12-19'
      GROUP BY work_shift
    `);
    
    console.log('\n3️⃣ 2025-12-19的上班时段值分布:');
    stats.forEach(r => {
      console.log(`  上班时段=${r.work_shift || 'NULL'}: ${r.count}条`);
    });
    
    // 4. 验证匹配是否正确
    console.log('\n4️⃣ 验证结果:');
    if (calendar.length > 0 && capacity.length > 0) {
      const expectedWorkShift = calendar[0].is_workday === 1 && calendar[0].standard_work_hours > 0
        ? parseFloat(calendar[0].standard_work_hours).toFixed(2)
        : null;
      
      const actualWorkShift = capacity[0].work_shift;
      
      if (expectedWorkShift === actualWorkShift) {
        console.log(`✅ 匹配正确！`);
        console.log(`  企业日历标准工时: ${calendar[0].standard_work_hours}`);
        console.log(`  工序能力负荷表上班时段: ${actualWorkShift}`);
      } else {
        console.log(`❌ 匹配错误！`);
        console.log(`  预期上班时段: ${expectedWorkShift}`);
        console.log(`  实际上班时段: ${actualWorkShift}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  }
})();
