const { pool } = require('./backend/config/database');

(async () => {
  try {
    console.log('📊 检查企业日历的真日期映射:\n');
    
    const [rows] = await pool.execute(`
      SELECT 
        DATE_FORMAT(calendar_date, '%Y-%m-%d') as calendar_date,
        DATE_FORMAT(actual_date, '%Y-%m-%d') as actual_date,
        weekday,
        is_workday,
        standard_work_hours
      FROM company_calendar
      WHERE DATE_FORMAT(actual_date, '%Y-%m-%d') IN ('2025-12-22', '2025-12-23')
      ORDER BY actual_date
    `);
    
    console.log('企业日历查询结果:');
    rows.forEach(r => {
      console.log(`  真日期=${r.actual_date}, ${r.weekday}, 工作日=${r.is_workday}, 标准工时=${r.standard_work_hours}`);
    });
    
    if (rows.length === 0) {
      console.log('\n⚠️ 未找到真日期为2025-12-22和2025-12-23的记录');
      console.log('\n查看原始日历数据（前10条）:');
      
      const [all] = await pool.execute(`
        SELECT 
          DATE_FORMAT(calendar_date, '%Y-%m-%d') as calendar_date,
          DATE_FORMAT(actual_date, '%Y-%m-%d') as actual_date,
          weekday,
          is_workday
        FROM company_calendar
        ORDER BY calendar_date
        LIMIT 10
      `);
      
      all.forEach(r => {
        console.log(`  日历日期=${r.calendar_date}, 真日期=${r.actual_date}, ${r.weekday}, 工作日=${r.is_workday}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
})();
