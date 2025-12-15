const mysql = require('mysql2/promise');
const config = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'zH754277289hUi~197547',
  database: 'enterprise_brain',
  charset: 'utf8mb4'
};

async function checkAssemblyPlans() {
  try {
    const connection = await mysql.createConnection(config);
    
    console.log('=== 🔧 组装工序计划状态 ===');
    const [assemblyPlans] = await connection.execute(`
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
    
    await connection.end();
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkAssemblyPlans();