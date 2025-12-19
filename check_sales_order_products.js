const { pool } = require('./backend/config/database');

async function checkSalesOrderProducts() {
  try {
    console.log('🔍 检查销售订单和产品数据...\n');
    
    // 查询销售订单
    const [orders] = await pool.execute(`
      SELECT id, internal_order_no, salesperson, customer_name
      FROM sales_orders 
      WHERE internal_order_no = 'SO2025000001'
      LIMIT 1
    `);
    
    if (orders.length === 0) {
      console.log('❌ 未找到订单 SO2025000001');
      process.exit(0);
    }
    
    const order = orders[0];
    console.log('销售订单信息:');
    console.log(`  ID: ${order.id}`);
    console.log(`  内部订单号: ${order.internal_order_no}`);
    console.log(`  销售员: ${order.salesperson || '(空)'}`);
    console.log(`  客户名称: ${order.customer_name}`);
    
    // 查询销售订单产品表
    const [products] = await pool.execute(`
      SELECT 
        product_code, product_name, product_unit,
        product_source, output_process, order_quantity
      FROM sales_order_products 
      WHERE order_id = ?
    `, [order.id]);
    
    console.log(`\n产品列表 (${products.length} 个):`);
    products.forEach((p, index) => {
      console.log(`\n产品 ${index + 1}:`);
      console.log(`  产品编号: ${p.product_code || '(空)'}`);
      console.log(`  产品名称: ${p.product_name || '(空)'}`);
      console.log(`  产品单位: ${p.product_unit || '(空)'}`);
      console.log(`  产品来源: ${p.product_source || '(空)'}`);
      console.log(`  产出工序: ${p.output_process || '(空)'}`);
      console.log(`  订单数量: ${p.order_quantity || '(空)'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
}

checkSalesOrderProducts();
