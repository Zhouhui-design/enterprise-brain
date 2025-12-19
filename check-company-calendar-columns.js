const { pool } = require('./backend/config/database');

(async () => {
  try {
    console.log('📊 查询company_calendar表结构:\n');
    
    const [columns] = await pool.execute(`
      SHOW COLUMNS FROM company_calendar
    `);
    
    console.log('列名 | 类型 | 允许NULL | 键 | 默认值');
    console.log('-----|------|----------|-----|-------');
    columns.forEach(col => {
      console.log(`${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default || 'NULL'}`);
    });
    
    console.log('\n📝 查询前3条数据:');
    const [rows] = await pool.execute(`
      SELECT * FROM company_calendar ORDER BY calendar_date LIMIT 3
    `);
    
    console.log(JSON.stringify(rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
})();
