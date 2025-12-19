const { pool } = require('./backend/config/database');

(async () => {
  try {
    console.log('🔍 验证数据库中的上班时段数据\n');
    
    // 1. 查看前10条原始数据（不同工序）
    console.log('1️⃣ 数据库原始数据（前10条）:');
    const [rawData] = await pool.execute(`
      SELECT 
        id,
        process_name,
        date,
        work_shift,
        available_workstations,
        occupied_hours,
        remaining_hours
      FROM process_capacity_load
      ORDER BY date, process_name
      LIMIT 10
    `);
    
    console.log('ID | 工序 | 日期 | 上班时段 | 工位 | 占用工时 | 剩余工时');
    console.log('---|------|------|----------|------|----------|----------');
    rawData.forEach(r => {
      const dateStr = r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date;
      console.log(`${r.id} | ${r.process_name} | ${dateStr} | ${r.work_shift || 'NULL'} | ${r.available_workstations} | ${r.occupied_hours} | ${r.remaining_hours}`);
    });
    
    // 2. 查看特定日期的数据（用户关注的2025-12-23）
    console.log('\n2️⃣ 查看2025-12-23的数据（前5条）:');
    const [date23] = await pool.execute(`
      SELECT 
        process_name,
        DATE_FORMAT(date, '%Y-%m-%d') as date_str,
        work_shift,
        available_workstations
      FROM process_capacity_load
      WHERE DATE_FORMAT(date, '%Y-%m-%d') = '2025-12-23'
      LIMIT 5
    `);
    
    date23.forEach(r => {
      console.log(`  ${r.process_name} | ${r.date_str} | ${r.work_shift || 'NULL'} | ${r.available_workstations}`);
    });
    
    // 3. 统计上班时段的值分布
    console.log('\n3️⃣ 上班时段值分布统计:');
    const [distribution] = await pool.execute(`
      SELECT 
        work_shift,
        COUNT(*) as count
      FROM process_capacity_load
      GROUP BY work_shift
      ORDER BY work_shift
    `);
    
    distribution.forEach(r => {
      console.log(`  上班时段=${r.work_shift || 'NULL'}: ${r.count}条`);
    });
    
    // 4. 查看work_shift字段的数据类型
    console.log('\n4️⃣ 查看work_shift字段定义:');
    const [columns] = await pool.execute(`
      SHOW COLUMNS FROM process_capacity_load WHERE Field = 'work_shift'
    `);
    
    console.log(`  字段: ${columns[0].Field}`);
    console.log(`  类型: ${columns[0].Type}`);
    console.log(`  允许NULL: ${columns[0].Null}`);
    console.log(`  默认值: ${columns[0].Default || 'NULL'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
