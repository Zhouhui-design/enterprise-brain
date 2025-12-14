const mysql = require('mysql2/promise');

async function verifyColumnMapping() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'zH754277289hUi~197547',
    database: 'enterprise_brain'
  });

  try {
    // 获取表结构
    const [rows] = await connection.execute("DESCRIBE material_preparation_plans");
    
    // 我的列定义（不包括id）
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
    
    console.log('数据库列（排除id）:');
    const dbColumns = rows.slice(1).map(row => row.Field);
    dbColumns.forEach((col, index) => {
      console.log(`${index + 1}: ${col}`);
    });
    
    console.log('\n我的列:');
    myColumns.forEach((col, index) => {
      console.log(`${index + 1}: ${col}`);
    });
    
    console.log('\n比较结果:');
    let mismatchFound = false;
    dbColumns.forEach((dbCol, index) => {
      const myCol = myColumns[index];
      const match = dbCol === myCol ? '✅' : '❌';
      console.log(`${index + 1}: ${dbCol} | ${myCol || 'MISSING'} | ${match}`);
      if (dbCol !== myCol) {
        mismatchFound = true;
        console.log(`  不匹配! 数据库: ${dbCol}, 我的: ${myCol}`);
      }
    });
    
    if (!mismatchFound) {
      console.log('\n✅ 所有列都匹配!');
      
      // 尝试创建一个测试表来验证SQL语法
      console.log('\n尝试创建测试表...');
      const testSQL = `
        CREATE TEMPORARY TABLE test_material_preparation_plans AS 
        SELECT * FROM material_preparation_plans WHERE 1=0
      `;
      await connection.execute(testSQL);
      
      // 然后尝试插入到测试表
      const insertSQL = `
        INSERT INTO test_material_preparation_plans (
          plan_no, source_plan_no, source_process_plan_no, 
          parent_code, parent_name, parent_schedule_quantity,
          material_code, material_name,
          material_source, material_unit, demand_quantity, need_mrp, realtime_stock,
          projected_balance, available_stock, replenishment_quantity, source_process, 
          parent_process_name, process_interval_hours, process_interval_unit,
          process_schedule_date, workshop_name,
          demand_date,
          push_to_purchase, push_to_process, sales_order_no, customer_order_no,
          main_plan_product_code, main_plan_product_name, main_plan_quantity,
          promise_delivery_date, remark, created_by, created_at, updated_by, updated_at,
          product_image, customer_name, submitter, submit_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        'TEST004', null, null, 
        null, null, null,
        'MAT001', 'Test Material',
        null, null, 0, 0, 0,
        0, 0, 0, null, 
        null, null, null,
        null, null,
        null,
        0, 0, null, null,
        null, null, 0,
        null, null, null,
        new Date(), null, new Date(), null, null, null, new Date()
      ];
      
      const [result] = await connection.execute(insertSQL, params);
      console.log('测试插入成功:', result.insertId);
      
      // 清理测试表
      await connection.execute("DROP TEMPORARY TABLE test_material_preparation_plans");
    }
    
  } catch (error) {
    console.error('错误:', error.message);
    console.error('SQL状态:', error.sqlState);
  } finally {
    await connection.end();
  }
}

verifyColumnMapping();