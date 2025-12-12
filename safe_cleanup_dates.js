const { pool } = require('./backend/config/database');

async function safeCleanupDates() {
  try {
    console.log('🔍 检查数据问题...');
    
    // 先查看具体有哪些问题数据
    const [problemData] = await pool.execute(`
      SELECT id, plan_no, plan_start_date, schedule_date, plan_end_date, completion_date, next_schedule_date
      FROM real_process_plans 
      WHERE plan_start_date = '0000-00-00' 
         OR schedule_date = '0000-00-00' 
         OR plan_end_date = '0000-00-00'
         OR completion_date = '0000-00-00'
         OR next_schedule_date = '0000-00-00'
      LIMIT 10
    `);
    
    if (problemData.length > 0) {
      console.log('⚠️ 发现问题数据:');
      problemData.forEach(row => {
        console.log(`  ID: ${row.id}, 编号: ${row.plan_no}, 开始日期: ${row.plan_start_date}, 排程日期: ${row.schedule_date}`);
      });
    } else {
      console.log('✅ 没有发现明显的无效日期');
    }
    
    // 直接删除有问题的数据
    const [deleteResult] = await pool.execute(`
      DELETE FROM real_process_plans 
      WHERE plan_start_date = '0000-00-00' 
         OR schedule_date = '0000-00-00' 
         OR plan_end_date = '0000-00-00'
         OR completion_date = '0000-00-00'
         OR next_schedule_date = '0000-00-00'
    `);
    
    console.log(`🗑️ 删除了 ${deleteResult.affectedRows} 条有无效日期的记录`);
    
    console.log('✅ 安全清理完成');
    
  } catch (error) {
    console.error('❗ 清理失败:', error);
    throw error;
  }
}

safeCleanupDates().then(() => {
  console.log('✅ 处理完成');
  process.exit(0);
}).catch(error => {
  console.error('❗ 处理失败:', error);
  process.exit(1);
});