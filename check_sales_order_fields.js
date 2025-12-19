const { pool } = require('./backend/config/database');

async function checkSalesOrderFields() {
  try {
    console.log('🔍 检查销售订单字段数据...\n');
    
    // 先查看表结构
    const [columns] = await pool.execute(`
      SHOW COLUMNS FROM sales_orders
    `);
    
    console.log('销售订单表字段:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error);
    process.exit(1);
  }
}

checkSalesOrderFields();
