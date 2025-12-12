const { pool } = require('./backend/config/database');

async function cleanupInvalidDates() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    console.log('🧹 清理无效的日期数据...');
    
    // 1. 清理无效的计划开始日期
    const [result1] = await connection.execute(`
      UPDATE real_process_plans 
      SET plan_start_date = NULL,
          updated_at = NOW()
      WHERE plan_start_date = '0000-00-00' 
         OR plan_start_date = ''
         OR DATE(plan_start_date) = '1970-01-01'
    `);
    console.log(`✅ 清理了 ${result1.affectedRows} 条无效的计划开始日期`);
    
    // 2. 清理无效的计划排程日期
    const [result2] = await connection.execute(`
      UPDATE real_process_plans 
      SET schedule_date = NULL,
          updated_at = NOW()
      WHERE schedule_date = '0000-00-00' 
         OR schedule_date = ''
         OR DATE(schedule_date) = '1970-01-01'
    `);
    console.log(`✅ 清理了 ${result2.affectedRows} 条无效的计划排程日期`);
    
    // 3. 清理无效的计划结束日期
    const [result3] = await connection.execute(`
      UPDATE real_process_plans 
      SET plan_end_date = NULL,
          updated_at = NOW()
      WHERE plan_end_date = '0000-00-00' 
         OR plan_end_date = ''
         OR DATE(plan_end_date) = '1970-01-01'
    `);
    console.log(`✅ 清理了 ${result3.affectedRows} 条无效的计划结束日期`);
    
    // 4. 清理无效的计划完工日期
    const [result4] = await connection.execute(`
      UPDATE real_process_plans 
      SET completion_date = NULL,
          updated_at = NOW()
      WHERE completion_date = '0000-00-00' 
         OR completion_date = ''
         OR DATE(completion_date) = '1970-01-01'
    `);
    console.log(`✅ 清理了 ${result4.affectedRows} 条无效的计划完工日期`);
    
    // 5. 清理无效的下一个排程日期
    const [result5] = await connection.execute(`
      UPDATE real_process_plans 
      SET next_schedule_date = NULL,
          updated_at = NOW()
      WHERE next_schedule_date = '0000-00-00' 
         OR next_schedule_date = ''
         OR DATE(next_schedule_date) = '1970-01-01'
    `);
    console.log(`✅ 清理了 ${result5.affectedRows} 条无效的下一个排程日期`);
    
    await connection.commit();
    console.log('🎉 无效日期清理完成！');
    
  } catch (error) {
    await connection.rollback();
    console.error('❗ 清理无效日期失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

cleanupInvalidDates().then(() => {
  console.log('✅ 清理完成');
  process.exit(0);
}).catch(error => {
  console.error('❗ 清理失败:', error);
  process.exit(1);
});