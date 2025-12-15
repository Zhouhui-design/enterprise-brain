const { pool } = require('./backend/config/database');

async function investigateOrder() {
  try {
    console.log('\n=== 调查销售订单 SO2025000002 ===\n');
    
    // 查询这个订单的所有备料计划
    const [plans] = await pool.execute(`
      SELECT 
        plan_no,
        sales_order_no,
        material_code,
        material_name,
        source_process,
        created_at
      FROM material_preparation_plans
      WHERE sales_order_no = 'SO2025000002'
      ORDER BY created_at
    `);
    
    console.log(`找到 ${plans.length} 条备料计划：\n`);
    
    for (const plan of plans) {
      // 查询物料库的产出工序
      const [materials] = await pool.execute(`
        SELECT process_name
        FROM materials
        WHERE material_code = ?
      `, [plan.material_code]);
      
      const outputProcess = materials.length > 0 ? materials[0].process_name : null;
      const isConsistent = plan.source_process === outputProcess;
      
      console.log(`备料计划: ${plan.plan_no}`);
      console.log(`  物料编号: ${plan.material_code}`);
      console.log(`  物料名称: ${plan.material_name}`);
      console.log(`  来源工序: ${plan.source_process}`);
      console.log(`  产出工序: ${outputProcess}`);
      console.log(`  是否一致: ${isConsistent ? '✅' : '❌'}`);
      console.log(`  创建时间: ${plan.created_at}`);
      console.log('');
    }
    
    // 检查SO2025000001的数据
    console.log('\n=== 对比：销售订单 SO2025000001 ===\n');
    
    const [plans2] = await pool.execute(`
      SELECT 
        plan_no,
        material_code,
        source_process,
        created_at
      FROM material_preparation_plans
      WHERE sales_order_no = 'SO2025000001'
      ORDER BY created_at
      LIMIT 3
    `);
    
    console.log(`找到 ${plans2.length} 条备料计划（仅显示前3条）：\n`);
    
    for (const plan of plans2) {
      const [materials] = await pool.execute(`
        SELECT process_name
        FROM materials
        WHERE material_code = ?
      `, [plan.material_code]);
      
      const outputProcess = materials.length > 0 ? materials[0].process_name : null;
      const isConsistent = plan.source_process === outputProcess;
      
      console.log(`备料计划: ${plan.plan_no}`);
      console.log(`  物料: ${plan.material_code}`);
      console.log(`  来源工序: ${plan.source_process}, 产出工序: ${outputProcess}`);
      console.log(`  是否一致: ${isConsistent ? '✅' : '❌'}`);
      console.log(`  创建时间: ${plan.created_at}`);
      console.log('');
    }
    
    console.log('\n=== 结论 ===');
    console.log('如果SO2025000002的创建时间早于修复时间，可能是旧版本代码生成的数据');
    console.log('如果SO2025000001的创建时间晚于修复时间，且数据一致，说明修复生效');
    console.log('建议：删除SO2025000002的订单重新生成，或手动修正来源工序字段');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

investigateOrder();
