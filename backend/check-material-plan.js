const { pool } = require('./config/database');

async function checkMaterialPlan() {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        id, plan_no, sales_order_no, source_plan_no, 
        material_code, material_name,
        created_at, updated_at
      FROM material_preparation_plans 
      WHERE plan_no = 'MPP2025009313122'
    `);

    if (rows.length > 0) {
      console.log('备料计划详情:');
      console.log(rows[0]);
      console.log('\n创建时间:', rows[0].created_at);
    } else {
      console.log('未找到备料计划 MPP2025009313122');
    }

    // 检查是否有对应的工序计划
    const [processRows] = await pool.execute(
      `
      SELECT * FROM process_plans 
      WHERE sales_order_no = ?
    `,
      [rows[0].sales_order_no],
    );

    console.log('\n对应的工序计划数量:', processRows.length);

    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

checkMaterialPlan();
