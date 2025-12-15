const { pool } = require('./backend/config/database');

async function checkDataConsistency() {
  try {
    console.log('\n=== 检查备料计划数据一致性 ===\n');
    
    // 查询备料计划数据
    const [plans] = await pool.execute(`
      SELECT 
        plan_no,
        material_code,
        material_name,
        source_process,
        material_source
      FROM material_preparation_plans
      WHERE material_source = '自制'
      LIMIT 10
    `);
    
    console.log(`找到 ${plans.length} 条自制物料的备料计划\n`);
    
    // 对每条记录，查询产品物料库的产出工序
    for (const plan of plans) {
      const [materials] = await pool.execute(`
        SELECT process_name
        FROM materials
        WHERE material_code = ?
      `, [plan.material_code]);
      
      const outputProcess = materials.length > 0 ? materials[0].process_name : null;
      const isEqual = plan.source_process === outputProcess;
      
      console.log(`备料计划编号: ${plan.plan_no}`);
      console.log(`  物料编号: ${plan.material_code}`);
      console.log(`  物料名称: ${plan.material_name}`);
      console.log(`  备料计划.来源工序: ${plan.source_process}`);
      console.log(`  物料库.产出工序: ${outputProcess}`);
      console.log(`  是否相等: ${isEqual ? '✅ 相等' : '❌ 不相等'}`);
      console.log('');
    }
    
    // 统计不相等的情况
    let mismatchCount = 0;
    for (const plan of plans) {
      const [materials] = await pool.execute(`
        SELECT process_name
        FROM materials
        WHERE material_code = ?
      `, [plan.material_code]);
      
      const outputProcess = materials.length > 0 ? materials[0].process_name : null;
      if (plan.source_process !== outputProcess) {
        mismatchCount++;
      }
    }
    
    console.log(`\n=== 统计结果 ===`);
    console.log(`总记录数: ${plans.length}`);
    console.log(`相等记录: ${plans.length - mismatchCount}`);
    console.log(`不相等记录: ${mismatchCount}`);
    
    if (mismatchCount === 0) {
      console.log('\n✅ 结论：所有备料计划的"来源工序"都等于产品物料库的"产出工序"');
      console.log('💡 这意味着：');
      console.log('   1. 前面的数据流（主生产计划→备料计划）是正确的');
      console.log('   2. 理论上使用sourceProcess和outputProcess效果相同');
      console.log('   3. 但使用outputProcess是更规范的做法（直接从源头查询）');
    } else {
      console.log('\n⚠️ 警告：发现数据不一致的情况！');
      console.log('需要检查主生产计划到备料计划的数据流');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDataConsistency();
