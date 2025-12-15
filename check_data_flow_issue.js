const { pool } = require('./backend/config/database');

async function checkDataFlow() {
  try {
    console.log('🔍 检查备料计划数据...');
    const [materialPlans] = await pool.execute(`
      SELECT plan_no, material_code, material_name, source_process, material_source, replenishment_quantity
      FROM material_preparation_plans 
      WHERE source_process = '组装' AND material_source = '自制'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('备料计划中来源工序=组装的数据:');
    materialPlans.forEach(plan => {
      console.log(`  ${plan.plan_no}: ${plan.material_code} (${plan.material_name}) - 来源工序:${plan.source_process}, 需补货:${plan.replenishment_quantity}`);
    });
    
    console.log('\n🔍 检查产品物料库中这些物料的产出工序...');
    for (const plan of materialPlans) {
      const [materials] = await pool.execute(
        'SELECT material_code, material_name, process_name FROM materials WHERE material_code = ?',
        [plan.material_code]
      );
      
      if (materials.length > 0) {
        const material = materials[0];
        console.log(`  ${material.material_code}: 产出工序=${material.process_name || '未设置'}`);
      } else {
        console.log(`  ${plan.material_code}: 未在产品物料库中找到`);
      }
    }
    
    console.log('\n🔍 检查组装工序计划数据...');
    const [assemblyPlans] = await pool.execute(`
      SELECT plan_no, product_code, product_name, source_no, process_name
      FROM assembly_process_plans 
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('组装工序计划数据:');
    assemblyPlans.forEach(plan => {
      console.log(`  ${plan.plan_no}: ${plan.product_code} (${plan.product_name}) - 来源:${plan.source_no}, 工序:${plan.process_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('检查失败:', error);
    process.exit(1);
  }
}

checkDataFlow();