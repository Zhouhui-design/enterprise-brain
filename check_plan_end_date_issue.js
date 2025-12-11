const mysql = require('mysql2/promise');

async function checkPlanEndDateIssue() {
  console.log('🔍 开始检查计划结束日期计算问题...\n');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'zH754277289hUi~197547',
    database: 'enterprise_brain'
  });
  
  try {
    // 检查1：查看最近的真工序计划记录
    console.log('📋 检查1：查看最近的真工序计划记录');
    const [plans] = await connection.execute(`
      SELECT 
        plan_no,
        process_name,
        completion_date,
        required_work_hours,
        plan_end_date,
        plan_start_date,
        created_at
      FROM real_process_plans
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.table(plans);
    
    if (plans.length === 0) {
      console.log('⚠️ 没有真工序计划记录');
      return;
    }
    
    // 获取第一个计划的数据进行分析
    const testPlan = plans[0];
    console.log(`\n📋 分析计划: ${testPlan.plan_no}`);
    console.log(`工序名称: ${testPlan.process_name}`);
    console.log(`计划完工日期: ${testPlan.completion_date}`);
    console.log(`需求工时: ${testPlan.required_work_hours}`);
    console.log(`当前计划结束日期: ${testPlan.plan_end_date}`);
    
    // 检查2：查看该工序在工序能力负荷表中的数据
    console.log(`\n📋 检查2：工序"${testPlan.process_name}"的能力负荷数据`);
    const [capacity] = await connection.execute(`
      SELECT 
        process_name,
        date,
        remaining_hours,
        occupied_hours,
        work_shift
      FROM process_capacity_load
      WHERE process_name = ?
        AND date <= ?
      ORDER BY date DESC
      LIMIT 10
    `, [testPlan.process_name, testPlan.completion_date]);
    console.table(capacity);
    
    // 检查3：手动计算计划结束日期
    const minRemainingHours = 0.5;
    console.log(`\n📋 检查3：手动计算计划结束日期`);
    console.log(`规则：查找 <= ${testPlan.completion_date} 且 剩余工时 >= ${minRemainingHours} 的最大日期`);
    
    const [validDates] = await connection.execute(`
      SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, remaining_hours 
      FROM process_capacity_load 
      WHERE process_name = ? 
        AND date <= ? 
        AND remaining_hours >= ?
      ORDER BY date DESC
      LIMIT 1
    `, [testPlan.process_name, testPlan.completion_date, minRemainingHours]);
    
    if (validDates.length > 0) {
      const correctEndDate = validDates[0].date;
      console.log(`\n✅ 正确的计划结束日期应该是: ${correctEndDate}`);
      console.log(`   剩余工时: ${validDates[0].remaining_hours}`);
      
      if (correctEndDate !== testPlan.plan_end_date) {
        console.log(`\n⚠️ 发现问题！`);
        console.log(`   当前系统值: ${testPlan.plan_end_date}`);
        console.log(`   正确计算值: ${correctEndDate}`);
        
        // 检查4：查看计划结束日期当天的具体数据
        console.log(`\n📋 检查4：查看当前错误日期${testPlan.plan_end_date}的具体数据`);
        const [wrongDateData] = await connection.execute(`
          SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, remaining_hours 
          FROM process_capacity_load 
          WHERE process_name = ? 
            AND date = ?
        `, [testPlan.process_name, testPlan.plan_end_date]);
        
        console.table(wrongDateData);
        
        // 检查5：查看正确日期当天的具体数据
        console.log(`\n📋 检查5：查看正确日期${correctEndDate}的具体数据`);
        const [correctDateData] = await connection.execute(`
          SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, remaining_hours 
          FROM process_capacity_load 
          WHERE process_name = ? 
            AND date = ?
        `, [testPlan.process_name, correctEndDate]);
        
        console.table(correctDateData);
        
        // 提供修复建议
        console.log(`\n🔧 修复建议:`);
        console.log(`1. 更新该条记录的计划结束日期`);
        console.log(`   UPDATE real_process_plans SET plan_end_date = '${correctEndDate}' WHERE plan_no = '${testPlan.plan_no}';`);
        console.log(`2. 检查计划结束日期的计算逻辑`);
        console.log(`3. 确认是否所有记录都需要修复`);
        
      } else {
        console.log(`\n✅ 计划结束日期计算正确！`);
      }
    } else {
      console.log(`\n❌ 没有找到符合条件的日期`);
    }
    
  } finally {
    await connection.end();
  }
  
  console.log('\n🎉 检查完成！');
}

checkPlanEndDateIssue().catch(console.error);