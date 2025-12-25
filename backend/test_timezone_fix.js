/**
 * 测试时区修复效果
 */
const { pool } = require('./config/database');

async function testTimezoneFix() {
  try {
    console.log('🔍 测试时区修复效果\n');

    // 1. 测试真工序计划查询
    console.log('1. 测试真工序计划列表查询:');
    const [realPlans] = await pool.execute(`
      SELECT 
        plan_no, 
        schedule_date, 
        DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date_formatted 
      FROM real_process_plans 
      WHERE schedule_quantity > 0 
      LIMIT 3
    `);

    realPlans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.plan_no}`);
      console.log(`      原始 schedule_date: ${plan.schedule_date}`);
      console.log(`      格式化后: ${plan.schedule_date_formatted}`);
      console.log('');
    });

    // 2. 测试备料计划查询
    console.log('2. 测试备料计划列表查询:');
    const [materialPlans] = await pool.execute(`
      SELECT 
        plan_no, 
        process_schedule_date,
        DATE_FORMAT(process_schedule_date, '%Y-%m-%d') as process_schedule_date_formatted
      FROM material_preparation_plans 
      WHERE source_process_plan_no IS NOT NULL 
      LIMIT 3
    `);

    materialPlans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.plan_no}`);
      console.log(`      原始 process_schedule_date: ${plan.process_schedule_date}`);
      console.log(`      格式化后: ${plan.process_schedule_date_formatted}`);
      console.log('');
    });

    // 3. 验证对应的真工序计划和备料计划日期是否一致
    console.log('3. 验证真工序计划与备料计划的日期一致性:');
    for (let i = 0; i < Math.min(realPlans.length, materialPlans.length); i++) {
      const realPlan = realPlans[i];
      const materialPlan = materialPlans[i];

      console.log(`   真工序计划 ${realPlan.plan_no}: ${realPlan.schedule_date_formatted}`);
      console.log(`   备料计划 ${materialPlan.plan_no}: ${materialPlan.process_schedule_date_formatted}`);

      if (realPlan.schedule_date_formatted === materialPlan.process_schedule_date_formatted) {
        console.log(`   ✅ 日期一致！\n`);
      } else {
        console.log(`   ❌ 日期不一致！\n`);
      }
    }

    // 4. 测试API返回格式
    console.log('4. 测试API返回格式:');
    const [apiTestPlans] = await pool.execute(`
      SELECT 
        id, plan_no, schedule_date, DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date_formatted,
        process_name, schedule_quantity
      FROM real_process_plans 
      WHERE schedule_quantity > 0 
      LIMIT 1
    `);

    if (apiTestPlans.length > 0) {
      const apiPlan = apiTestPlans[0];
      const convertedPlan = {};
      Object.keys(apiPlan).forEach(key => {
        const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
        convertedPlan[camelKey] = apiPlan[key];
      });
      convertedPlan.scheduleDate = apiPlan.schedule_date_formatted;

      console.log('   API返回格式:', {
        planNo: convertedPlan.planNo,
        scheduleDate: convertedPlan.scheduleDate,
        processName: convertedPlan.processName,
        scheduleQuantity: convertedPlan.scheduleQuantity,
      });
    }

    await pool.end();
    console.log('✅ 测试完成');
  } catch (error) {
    console.error('❌ 测试失败:', error);
    await pool.end();
  }
}

testTimezoneFix();
