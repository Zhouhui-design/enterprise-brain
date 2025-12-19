const { pool } = require('./backend/config/database');

(async () => {
  try {
    console.log('📋 查询company_calendar表结构:');
    const [columns] = await pool.execute("SHOW COLUMNS FROM company_calendar");
    columns.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key}`);
    });
    
    console.log('\n📊 查询企业日历前3条数据:');
    const [calendar] = await pool.execute('SELECT * FROM company_calendar ORDER BY calendar_date LIMIT 3');
    console.log(JSON.stringify(calendar, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
})();
