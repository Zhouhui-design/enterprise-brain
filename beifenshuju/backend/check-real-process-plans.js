const { pool } = require('./config/database');

async function checkRealProcessPlans() {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        id,
        plan_no,
        product_name,
        schedule_quantity,
        created_at
      FROM real_process_plans
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('=== 最近5条真工序计划 ===');
    rows.forEach(row => {
      console.log(`ID: ${row.id}, 编号: ${row.plan_no}, 产品: ${row.product_name}, 排程数量: ${row.schedule_quantity}, 创建时间: ${row.created_at}`);
    });
    
    // 检查备料计划
    const [materialPlans] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM material_preparation_plans
      WHERE source_process_plan_no IN (SELECT plan_no FROM real_process_plans)
    `);
    
    console.log(`\n=== 备料计划中来自真工序计划的记录数: ${materialPlans[0].total} ===`);
    
    await pool.end();
  } catch (error) {
    console.error('查询失败:', error);
    process.exit(1);
  }
}

checkRealProcessPlans();
