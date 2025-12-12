const { pool } = require('./backend/config/database');

pool.getConnection().then(async connection => {
  try {
    console.log('🔍 检查数据库表结构...');
    const [columns] = await connection.execute('SHOW COLUMNS FROM real_process_plans');
    console.log('📋 字段列表:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    console.log('\n🔍 检查数据量...');
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM real_process_plans');
    console.log(`📊 表中记录数: ${count[0].total}`);
    
    if (count[0].total > 0) {
      console.log('\n📋 查看前5条数据:');
      const [rows] = await connection.execute('SELECT id, plan_no, process_name, plan_start_date, schedule_date FROM real_process_plans LIMIT 5');
      rows.forEach(row => {
        console.log(`  ID: ${row.id}, 计划号: ${row.plan_no}, 工序: ${row.process_name}, 开始日期: ${row.plan_start_date}, 排程日期: ${row.schedule_date}`);
      });
    }
    
  } catch (error) {
    console.error('❗ 检查失败:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}).catch(error => {
  console.error('❗ 连接失败:', error);
  process.exit(1);
});