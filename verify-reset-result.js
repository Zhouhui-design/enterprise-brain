const { pool } = require('./backend/config/database');

(async () => {
  try {
    console.log('📊 验证重置后的数据:\n');
    
    // 统计更新后的状态
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN work_shift IS NULL THEN 1 ELSE 0 END) as null_count,
        SUM(CASE WHEN work_shift IS NOT NULL THEN 1 ELSE 0 END) as not_null_count,
        SUM(CASE WHEN work_shift = '8.00' THEN 1 ELSE 0 END) as work_8h_count,
        SUM(CASE WHEN work_shift = '0.00' THEN 1 ELSE 0 END) as work_0h_count
      FROM process_capacity_load
    `);
    
    console.log('总记录数:', stats[0].total);
    console.log('上班时段为NULL:', stats[0].null_count, `(${(stats[0].null_count / stats[0].total * 100).toFixed(2)}%)`);
    console.log('上班时段有值:', stats[0].not_null_count, `(${(stats[0].not_null_count / stats[0].total * 100).toFixed(2)}%)`);
    console.log('  - 8.00小时:', stats[0].work_8h_count);
    console.log('  - 0.00小时:', stats[0].work_0h_count);
    
    // 查看2025-12-23的数据
    console.log('\n📝 查看2025-12-23（用户示例日期）的数据:');
    const [sample] = await pool.execute(`
      SELECT 
        process_name,
        DATE_FORMAT(date, '%Y-%m-%d') as date,
        work_shift,
        available_workstations
      FROM process_capacity_load
      WHERE DATE_FORMAT(date, '%Y-%m-%d') = '2025-12-23'
      LIMIT 5
    `);
    
    sample.forEach(r => {
      console.log(`  工序=${r.process_name}, 日期=${r.date}, 上班时段=${r.work_shift}, 工位=${r.available_workstations}`);
    });
    
    // 查看休息日（2025-12-22，星期日）
    console.log('\n📝 查看2025-12-22（星期日，休息日）的数据:');
    const [restDay] = await pool.execute(`
      SELECT 
        process_name,
        DATE_FORMAT(date, '%Y-%m-%d') as date,
        work_shift,
        available_workstations
      FROM process_capacity_load
      WHERE DATE_FORMAT(date, '%Y-%m-%d') = '2025-12-22'
      LIMIT 5
    `);
    
    restDay.forEach(r => {
      console.log(`  工序=${r.process_name}, 日期=${r.date}, 上班时段=${r.work_shift || 'NULL'}, 工位=${r.available_workstations}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  }
})();
