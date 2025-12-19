const { pool } = require('./backend/config/database');

async function checkMPSFields() {
  try {
    console.log('🔍 检查主生产计划字段数据...\n');
    
    const [rows] = await pool.execute(`
      SELECT 
        id, plan_code, product_name, 
        salesperson, sales_unit, product_source,
        customer_name, internal_order_no
      FROM master_production_plans 
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    console.log(`找到 ${rows.length} 条记录\n`);
    
    rows.forEach((row, index) => {
      console.log(`记录 ${index + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  计划编号: ${row.plan_code}`);
      console.log(`  产品名称: ${row.product_name}`);
      console.log(`  销售员: ${row.salesperson || '(空)'}`);
      console.log(`  销售单位: ${row.sales_unit || '(空)'}`);
      console.log(`  产品来源: ${row.product_source || '(空)'}`);
      console.log(`  客户名称: ${row.customer_name || '(空)'}`);
      console.log(`  内部订单号: ${row.internal_order_no || '(空)'}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error);
    process.exit(1);
  }
}

checkMPSFields();
