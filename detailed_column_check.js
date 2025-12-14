const mysql = require('mysql2/promise');

async function detailedColumnCheck() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'zH754277289hUi~197547',
    database: 'enterprise_brain'
  });

  try {
    const [rows] = await connection.execute("DESCRIBE material_preparation_plans");
    
    // 我的SQL列定义（不包括id）
    const myColumns = [
      'plan_no', 'source_plan_no', 'source_process_plan_no', 
      'parent_code', 'parent_name', 'parent_schedule_quantity',
      'material_code', 'material_name',
      'material_source', 'material_unit', 'demand_quantity', 'need_mrp', 'realtime_stock',
      'projected_balance', 'available_stock', 'replenishment_quantity', 'source_process', 
      'parent_process_name', 'process_interval_hours', 'process_interval_unit',
      'process_schedule_date', 'workshop_name',
      'demand_date',
      'push_to_purchase', 'push_to_process', 'sales_order_no', 'customer_order_no',
      'main_plan_product_code', 'main_plan_product_name', 'main_plan_quantity',
      'promise_delivery_date', 'remark', 'created_by', 'created_at', 'updated_by', 'updated_at',
      'product_image', 'customer_name', 'submitter', 'submit_time'
    ];
    
    console.log('数据库列（不包括id）:');
    rows.slice(1).forEach((row, index) => {
      console.log(`${index + 1}: ${row.Field}`);
    });
    
    console.log('\n我的列定义:');
    myColumns.forEach((col, index) => {
      console.log(`${index + 1}: ${col}`);
    });
    
    console.log('\n对比:');
    rows.slice(1).forEach((row, index) => {
      const myCol = myColumns[index];
      const match = row.Field === myCol ? '✅' : '❌';
      console.log(`${index + 1}: ${row.Field} | ${myCol} | ${match}`);
    });
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await connection.end();
  }
}

detailedColumnCheck();