const mysql = require('mysql2/promise');

async function fixPlanEndDate() {
  console.log('🔧 开始修复计划结束日期计算问题...\n');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'zH754277289hUi~197547',
    database: 'enterprise_brain'
  });
  
  try {
    // 查询所有需要修复的真工序计划记录
    console.log('📋 查询所有需要修复的真工序计划记录');
    const [plans] = await connection.execute(`
      SELECT 
        plan_no,
        process_name,
        completion_date,
        required_work_hours,
        plan_end_date,
        plan_start_date
      FROM real_process_plans
      WHERE plan_end_date IS NOT NULL
    `);
    
    console.log(`找到 ${plans.length} 条记录需要检查`);
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const plan of plans) {
      try {
        // 查询正确的计划结束日期
        const [correctDates] = await connection.execute(`
          SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, remaining_hours 
          FROM process_capacity_load 
          WHERE process_name = ? 
            AND date <= ? 
            AND remaining_hours >= 0.5
          ORDER BY date DESC
          LIMIT 1
        `, [plan.process_name, plan.completion_date]);
        
        if (correctDates.length > 0) {
          const correctEndDate = correctDates[0].date;
          const currentEndDate = plan.plan_end_date instanceof Date 
            ? plan.plan_end_date.toISOString().split('T')[0]
            : String(plan.plan_end_date).split('T')[0];
          
          if (correctEndDate !== currentEndDate) {
            console.log(`\n🔧 修复计划 ${plan.plan_no}:`);
            console.log(`   工序: ${plan.process_name}`);
            console.log(`   计划完工日期: ${plan.completion_date}`);
            console.log(`   当前计划结束日期: ${currentEndDate}`);
            console.log(`   正确计划结束日期: ${correctEndDate}`);
            
            // 更新数据库
            await connection.execute(`
              UPDATE real_process_plans 
              SET plan_end_date = ? 
              WHERE plan_no = ?
            `, [correctEndDate, plan.plan_no]);
            
            fixedCount++;
            console.log(`   ✅ 已修复`);
          }
        }
      } catch (error) {
        console.error(`❌ 修复计划 ${plan.plan_no} 时出错:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 修复完成统计:`);
    console.log(`   ✅ 成功修复: ${fixedCount}条`);
    console.log(`   ❌ 修复失败: ${errorCount}条`);
    console.log(`   📝 总计检查: ${plans.length}条`);
    
  } finally {
    await connection.end();
  }
  
  console.log('\n🎉 修复完成！');
}

fixPlanEndDate().catch(console.error);