const { pool } = require('./backend/config/database');

async function testDatabase() {
  try {
    console.log('🔍 测试数据库连接...');
    
    console.log('\n=== 🔧 组装工序计划状态 ===');
    const [assemblyPlans] = await pool.execute(`
      SELECT plan_no, master_plan_product_code, process_name, replenishment_qty, 
             source_no, created_at
      FROM assembly_process_plans 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    assemblyPlans.forEach(plan => {
      console.log(`- ${plan.plan_no}: ${plan.master_plan_product_code} (${plan.process_name}, 来源: ${plan.source_no}, 数量: ${plan.replenishment_qty})`);
    });
    
    if (assemblyPlans.length === 0) {
      console.log('暂无组装工序计划');
    }
    
    console.log('\n=== 📦 打包工序计划状态 ===');
    const [realProcessPlans] = await pool.execute(`
      SELECT plan_no, main_plan_product_code, process_name, replenishment_qty, 
             source_no, created_at
      FROM real_process_plans 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    realProcessPlans.forEach(plan => {
      console.log(`- ${plan.plan_no}: ${plan.main_plan_product_code} (${plan.process_name}, 来源: ${plan.source_no}, 数量: ${plan.replenishment_qty})`);
    });
    
    console.log('\n=== 📋 备料计划推送状态 ===');
    const [materialPlans] = await pool.execute(`
      SELECT plan_no, material_code, source_process, replenishment_quantity, push_to_process
      FROM material_preparation_plans 
      WHERE material_source = '自制'
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    materialPlans.forEach(plan => {
      const pushStatus = plan.push_to_process ? '✅ 已推送' : '⏳ 待推送';
      console.log(`- ${plan.plan_no}: ${plan.material_code} (${plan.source_process}, ${plan.replenishment_quantity}) - ${pushStatus}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库测试失败:', error.message);
    process.exit(1);
  }
}

testDatabase();