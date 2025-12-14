const mysql = require('mysql2/promise');

async function testFreshInsert() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'zH754277289hUi~197547',
    database: 'enterprise_brain'
  });

  try {
    // 重新构建完全对齐的INSERT语句
    const columns = [
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
    
    const placeholders = Array(40).fill('?').join(', ');
    // 替换created_at, updated_at, submit_time为NOW()
    const finalPlaceholders = placeholders.replace('?, ?, ?', 'NOW(), ?, NOW()');
    
    const sql = `INSERT INTO material_preparation_plans (${columns.join(', ')}) VALUES (${finalPlaceholders})`;
    
    console.log('列数量:', columns.length);
    console.log('SQL语句:', sql);
    
    // 生成对应数量的参数
    const params = [
      'TEST002', null, null, 
      null, null, null,
      'MAT001', 'Test Material',
      null, null, 0, 0, 0,
      0, 0, 0, null, 
      null, null, null,
      null, null,
      null,
      0, 0, null, null,
      null, null, 0,
      null, null, null, null, null, null,
      null, null, null, null
    ];
    
    console.log('参数数量:', params.length);
    
    const [result] = await connection.execute(sql, params);
    console.log('插入成功:', result.insertId);
    
  } catch (error) {
    console.error('错误:', error.message);
    console.error('SQL状态:', error.sqlState);
  } finally {
    await connection.end();
  }
}

testFreshInsert();