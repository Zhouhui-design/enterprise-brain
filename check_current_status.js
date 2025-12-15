const mysql = require('mysql2/promise');
const config = {
  host: 'localhost',
  user: 'root',
  password: 'sardenesy',
  database: 'enterprise_brain',
  charset: 'utf8mb4'
};

async function checkCurrentStatus() {
  try {
    const connection = await mysql.createConnection(config);
    
    console.log('=== 📋 当前备料计划状态 ===');
    const [materialPlans] = await connection.execute(`
      SELECT plan_no, product_code, product_name, material_source, source_process, 
             replenishment_quantity, status, created_at
      FROM material_preparation_plans 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    materialPlans.forEach(plan => {
      console.log(`- ${plan.plan_no}: ${plan.product_code} (${plan.material_source}, ${plan.source_process}, ${plan.replenishment_quantity})`);
    });
    
    console.log('\n=== 📦 当前打包工序计划状态 ===');
    const [realProcessPlans] = await connection.execute(`
      SELECT plan_no, main_plan_product_code, process_name, replenishment_qty, 
             source_no, created_at
      FROM real_process_plans 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    realProcessPlans.forEach(plan => {
      console.log(`- ${plan.plan_no}: ${plan.main_plan_product_code} (${plan.process_name}, 来源: ${plan.source_no}, 数量: ${plan.replenishment_qty})`);
    });
    
    console.log('\n=== 🔧 当前组装工序计划状态 ===');
    const [assemblyProcessPlans] = await connection.execute(`
      SELECT plan_no, master_plan_product_code, process_name, replenishment_qty, 
             source_no, created_at
      FROM assembly_process_plans 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    assemblyProcessPlans.forEach(plan => {
      console.log(`- ${plan.plan_no}: ${plan.master_plan_product_code} (${plan.process_name}, 来源: ${plan.source_no}, 数量: ${plan.replenishment_qty})`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkCurrentStatus();