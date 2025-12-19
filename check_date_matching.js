const { pool } = require('./backend/config/database');

(async () => {
  try {
    console.log('🔍 检查日期匹配逻辑\n');
    
    // 查询企业日历
    console.log('📅 企业日历数据（前5条）:');
    const [calendar] = await pool.execute(
      "SELECT DATE_FORMAT(calendar_date, '%Y-%m-%d') as cal_date, DATE_FORMAT(actual_date, '%Y-%m-%d') as act_date, weekday, is_workday, standard_work_hours FROM company_calendar ORDER BY calendar_date LIMIT 5"
    );
    calendar.forEach(r => {
      console.log(`  日历日期=${r.cal_date}, 真日期=${r.act_date}, ${r.weekday}, 工作日=${r.is_workday}, 标准工时=${r.standard_work_hours}`);
    });
    
    // 查询工序能力负荷表
    console.log('\n📊 工序能力负荷表数据（前5条）:');
    const [capacity] = await pool.execute(
      "SELECT process_name, DATE_FORMAT(date, '%Y-%m-%d') as date_str, work_shift, available_workstations FROM process_capacity_load ORDER BY process_name, date LIMIT 5"
    );
    capacity.forEach(r => {
      console.log(`  工序=${r.process_name}, 日期=${r.date_str}, 上班时段=${r.work_shift}, 工位=${r.available_workstations}`);
    });
    
    // 测试匹配
    console.log('\n🔍 测试Lookup匹配:');
    console.log('预期规则: 工序能力负荷表.日期 = 企业日历.真日期 → 取标准上班时长\n');
    
    // 查找匹配的记录
    const [matched] = await pool.execute(`
      SELECT 
        pcl.process_name,
        DATE_FORMAT(pcl.date, '%Y-%m-%d') as capacity_date,
        pcl.work_shift as current_work_shift,
        DATE_FORMAT(cc.actual_date, '%Y-%m-%d') as calendar_actual_date,
        cc.standard_work_hours as should_be_work_shift,
        cc.is_workday
      FROM process_capacity_load pcl
      LEFT JOIN company_calendar cc ON DATE_FORMAT(pcl.date, '%Y-%m-%d') = DATE_FORMAT(cc.actual_date, '%Y-%m-%d')
      WHERE pcl.process_name = '人工焊接'
      ORDER BY pcl.date
      LIMIT 10
    `);
    
    console.log('工序"人工焊接"的前10天匹配结果:');
    matched.forEach(r => {
      const match = r.current_work_shift === r.should_be_work_shift ? '✅' : '❌';
      console.log(`  ${match} 能力负荷日期=${r.capacity_date}, 当前上班时段=${r.current_work_shift}, 企业日历真日期=${r.calendar_actual_date}, 应为=${r.should_be_work_shift}, 工作日=${r.is_workday}`);
    });
    
    // 统计匹配情况
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN pcl.work_shift = cc.standard_work_hours THEN 1 ELSE 0 END) as matched,
        SUM(CASE WHEN pcl.work_shift IS NULL AND cc.standard_work_hours IS NOT NULL THEN 1 ELSE 0 END) as null_but_should_have,
        SUM(CASE WHEN pcl.work_shift != cc.standard_work_hours THEN 1 ELSE 0 END) as mismatched
      FROM process_capacity_load pcl
      LEFT JOIN company_calendar cc ON DATE_FORMAT(pcl.date, '%Y-%m-%d') = DATE_FORMAT(cc.actual_date, '%Y-%m-%d')
    `);
    
    console.log('\n📊 全局匹配统计:');
    console.log(`  总记录数: ${stats[0].total}`);
    console.log(`  匹配正确: ${stats[0].matched}`);
    console.log(`  应有值但为NULL: ${stats[0].null_but_should_have}`);
    console.log(`  值不匹配: ${stats[0].mismatched}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
