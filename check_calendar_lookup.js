const { pool } = require('./backend/config/database');

(async () => {
  try {
    console.log('📊 查询企业日历前5条数据:');
    const [calendar] = await pool.execute(
      'SELECT id, calendar_date, actual_date, week_name, is_workday, standard_work_hours FROM company_calendar ORDER BY calendar_date LIMIT 5'
    );
    calendar.forEach(r => {
      const calDate = r.calendar_date instanceof Date ? r.calendar_date.toISOString().split('T')[0] : r.calendar_date;
      const actDate = r.actual_date instanceof Date ? r.actual_date.toISOString().split('T')[0] : r.actual_date;
      console.log(`  日历日期=${calDate}, 真日期=${actDate}, ${r.week_name}, 工作日=${r.is_workday}, 标准工时=${r.standard_work_hours}`);
    });
    
    console.log('\n📊 查询工序能力负荷表前5条数据:');
    const [capacity] = await pool.execute(
      'SELECT id, process_name, date, work_shift, available_workstations FROM process_capacity_load ORDER BY process_name, date LIMIT 5'
    );
    capacity.forEach(r => {
      const dateStr = r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date;
      console.log(`  工序=${r.process_name}, 日期=${dateStr}, 上班时段=${r.work_shift}, 工位=${r.available_workstations}`);
    });
    
    console.log('\n🔍 测试Lookup匹配逻辑:');
    console.log('预期: 工序能力负荷表.日期 = 企业日历.真日期');
    
    // 查询一个具体日期进行匹配测试
    const testDate = '2025-12-19';
    console.log(`\n测试日期: ${testDate}`);
    
    const [calMatch] = await pool.execute(
      'SELECT actual_date, standard_work_hours, is_workday FROM company_calendar WHERE actual_date = ?',
      [testDate]
    );
    
    if (calMatch.length > 0) {
      console.log(`✅ 企业日历找到匹配: 真日期=${testDate}, 标准工时=${calMatch[0].standard_work_hours}, 工作日=${calMatch[0].is_workday}`);
    } else {
      console.log(`❌ 企业日历未找到真日期=${testDate}的记录`);
      
      // 尝试查找calendar_date
      const [calMatch2] = await pool.execute(
        'SELECT calendar_date, actual_date, standard_work_hours FROM company_calendar WHERE calendar_date = ?',
        [testDate]
      );
      if (calMatch2.length > 0) {
        const actDate = calMatch2[0].actual_date instanceof Date ? 
          calMatch2[0].actual_date.toISOString().split('T')[0] : calMatch2[0].actual_date;
        console.log(`  但找到日历日期=${testDate}, 其真日期=${actDate}, 标准工时=${calMatch2[0].standard_work_hours}`);
      }
    }
    
    const [capMatch] = await pool.execute(
      'SELECT process_name, date, work_shift FROM process_capacity_load WHERE date = ? LIMIT 3',
      [testDate]
    );
    
    if (capMatch.length > 0) {
      console.log(`✅ 工序能力负荷表找到${capMatch.length}条匹配记录:`);
      capMatch.forEach(r => {
        console.log(`  工序=${r.process_name}, 日期=${testDate}, 上班时段=${r.work_shift}`);
      });
    } else {
      console.log(`❌ 工序能力负荷表未找到日期=${testDate}的记录`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
})();
