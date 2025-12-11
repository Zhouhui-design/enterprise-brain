const { pool } = require('./config/database');

async function checkProcessPlans() {
  try {
    // 查询所有工序计划
    const [rows] = await pool.execute(`
      SELECT 
        id, plan_no, sales_order_no, master_plan_no,
        product_code, product_name, process_name,
        level0_demand, completion_date,
        created_at
      FROM process_plans
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('=== 最新的工序计划 ===');
    console.log(`总数: ${rows.length} 条\n`);
    
    if (rows.length > 0) {
      rows.forEach((row, index) => {
        console.log(`${index + 1}. 工序计划编号: ${row.plan_no}`);
        console.log(`   主生产计划: ${row.master_plan_no}`);
        console.log(`   产品: ${row.product_code} - ${row.product_name}`);
        console.log(`   工序: ${row.process_name}`);
        console.log(`   数量: ${row.level0_demand}`);
        console.log(`   完工日期: ${row.completion_date}`);
        console.log(`   创建时间: ${row.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ 没有找到任何工序计划数据');
    }
    
    // 查询最新生成的备料计划对应的工序计划
    const [latestMaterial] = await pool.execute(`
      SELECT plan_no, source_plan_no 
      FROM material_preparation_plans 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (latestMaterial.length > 0) {
      console.log('=== 最新备料计划对应的工序计划 ===');
      console.log(`备料计划: ${latestMaterial[0].plan_no}`);
      console.log(`主计划: ${latestMaterial[0].source_plan_no}\n`);
      
      const [relatedProcess] = await pool.execute(`
        SELECT plan_no, process_name, created_at
        FROM process_plans
        WHERE master_plan_no = ?
      `, [latestMaterial[0].source_plan_no]);
      
      if (relatedProcess.length > 0) {
        console.log('✅ 找到对应的工序计划:');
        relatedProcess.forEach(p => {
          console.log(`   - ${p.plan_no} (${p.process_name}) - ${p.created_at}`);
        });
      } else {
        console.log('❌ 没有找到对应的工序计划');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

checkProcessPlans();
