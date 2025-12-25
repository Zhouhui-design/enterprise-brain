const { pool } = require('./config/database');

async function checkMaterialPlans() {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        plan_no as 备料计划编号,
        source_process_plan_no as 来源工序计划编号,
        parent_code as 父件编号,
        parent_name as 父件名称,
        parent_schedule_quantity as 父件排程数量,
        material_code as 备料物料编号,
        material_name as 备料物料名称,
        parent_process_name as 父件工序名称,
        process_interval_hours as 工序间隔工时,
        process_interval_unit as 工序间隔单位,
        process_schedule_date as 工序计划排程日期,
        demand_date as 需求日期
      FROM material_preparation_plans
      WHERE source_process_plan_no LIKE 'RPP%'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('\n=== 最新生成的备料计划（来自真工序计划） ===\n');
    console.table(rows);

    await pool.end();
  } catch (error) {
    console.error('查询失败:', error);
    process.exit(1);
  }
}

checkMaterialPlans();
