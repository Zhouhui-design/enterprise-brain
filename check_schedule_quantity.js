const { pool } = require('./backend/config/database');

pool.getConnection().then(async connection => {
  try {
    const [columns] = await connection.execute('SHOW COLUMNS FROM real_process_plans');
    const hasScheduleQuantity = columns.some(col => col.Field === 'schedule_quantity');
    console.log('schedule_quantity 字段存在:', hasScheduleQuantity);
    
    if (!hasScheduleQuantity) {
      console.log('❗ 缺少 schedule_quantity 字段，需要添加');
    }
    
    console.log('\n📋 所有字段列表:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}`);
    });
    
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