const mysql = require('mysql2/promise');

async function testFix() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'zH754277289hUi~197547',
    database: 'enterprise_brain'
  });
  
  try {
    console.log('🧪 测试修复效果\n');
    
    // 删除测试数据
    console.log('📋 清理旧的测试数据...');
    await connection.execute(`DELETE FROM real_process_plans WHERE plan_no LIKE 'TEST%'`);
    await connection.execute(`DELETE FROM material_preparation_plans WHERE plan_no LIKE 'TEST%'`);
    
    // 创建测试备料计划
    console.log('\n📋 创建测试备料计划...');
    const testPlanNo = `TEST${Date.now()}`;
    
    await connection.execute(`
      INSERT INTO material_preparation_plans (
        plan_no,
        source_plan_no,
        material_code,
        material_name,
        material_source,
        material_unit,
        demand_quantity,
        available_stock,
        source_process,
        promise_delivery_date,
        customer_name,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testPlanNo,
      'MPS001',
      'PROD001',
      '测试产品',
      '自制',
      '个',
      1000,
      0,
      '打包',
      '2026-01-05',
      '测试客户',
      'admin'
    ]);
    
    console.log(`✅ 创建备料计划: ${testPlanNo}`);
    
    // 等待异步推送
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 查询真工序计划
    console.log('\n📋 查询生成的真工序计划...');
    const [plans] = await connection.execute(`
      SELECT 
        plan_no,
        process_name,
        required_work_hours,
        plan_end_date,
        plan_start_date
      FROM real_process_plans
      WHERE source_no = ?
    `, [testPlanNo]);
    
    if (plans.length > 0) {
      console.log('\n✅ 找到生成的真工序计划:');
      console.table(plans);
      
      const plan = plans[0];
      if (plan.plan_start_date) {
        console.log(`\n🎉 修复成功！计划开始日期已生成: ${plan.plan_start_date}`);
      } else {
        console.log('\n❌ 修复失败：计划开始日期仍为null');
      }
    } else {
      console.log('\n❌ 未找到生成的真工序计划');
    }
    
    // 清理测试数据
    console.log('\n📋 清理测试数据...');
    await connection.execute(`DELETE FROM real_process_plans WHERE source_no = ?`, [testPlanNo]);
    await connection.execute(`DELETE FROM material_preparation_plans WHERE plan_no = ?`, [testPlanNo]);
    console.log('✅ 清理完成');
    
  } finally {
    await connection.end();
  }
}

testFix().catch(console.error);
