const mysql = require('mysql2/promise');

(async () => {
  const db = require('./backend/config/database');
  const conn = await db.pool.getConnection();
  
  console.log('✅ 验证page_settings表和工序数据:\n');
  
  // 1. 验证page_settings
  const [settings] = await conn.query('SELECT * FROM page_settings ORDER BY id');
  console.log('📋 page_settings配置:');
  settings.forEach(s => console.log('  -', s.page_key, '/', s.setting_key, '=', s.setting_value));
  console.log('');
  
  // 2. 验证自制工序
  const [processes] = await conn.query("SELECT process_code, process_name, self_or_outsource, available_workstations FROM processes WHERE self_or_outsource = '自制' LIMIT 5");
  console.log('🏭 自制工序示例(前5个):');
  processes.forEach(p => console.log('  -', p.process_code, p.process_name, '工位:' + p.available_workstations));
  console.log('');
  
  // 3. 统计工序数量
  const [count] = await conn.query("SELECT self_or_outsource, COUNT(*) as count FROM processes GROUP BY self_or_outsource");
  console.log('📊 工序统计:');
  count.forEach(c => console.log('  -', c.self_or_outsource || '未设置', ':', c.count, '个'));
  
  conn.release();
  process.exit(0);
})();
