const { pool } = require('./backend/config/database');

(async () => {
  try {
    const [count] = await pool.execute('SELECT COUNT(*) as count FROM company_calendar');
    console.log('企业日历记录数:', count[0].count);
    
    const [range] = await pool.execute(`
      SELECT 
        MIN(DATE_FORMAT(actual_date, '%Y-%m-%d')) as min_date,
        MAX(DATE_FORMAT(actual_date, '%Y-%m-%d')) as max_date,
        DATEDIFF(MAX(actual_date), MIN(actual_date)) + 1 as days
      FROM company_calendar
    `);
    console.log('真日期范围:', range[0].min_date, '至', range[0].max_date, '，共', range[0].days, '天');
    
    const [capacityRange] = await pool.execute(`
      SELECT 
        MIN(DATE_FORMAT(date, '%Y-%m-%d')) as min_date,
        MAX(DATE_FORMAT(date, '%Y-%m-%d')) as max_date,
        DATEDIFF(MAX(date), MIN(date)) + 1 as days
      FROM process_capacity_load
    `);
    console.log('工序能力负荷表日期范围:', capacityRange[0].min_date, '至', capacityRange[0].max_date, '，共', capacityRange[0].days, '天');
    
    process.exit(0);
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
})();
