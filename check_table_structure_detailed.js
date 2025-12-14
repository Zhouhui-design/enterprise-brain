const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'zH754277289hUi~197547',
  database: 'enterprise_brain',
  charset: 'utf8mb4'
};

async function checkTableStructure() {
  console.log('🔍 检查material_preparation_plans表结构...\n');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 查询表结构
    const [columns] = await connection.execute(`
      DESCRIBE material_preparation_plans
    `);
    
    console.log('📋 表结构:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field} - ${col.Type} - ${col.Null} - ${col.Default}`);
    });
    
    // 统计字段数量
    console.log(`\n📊 总字段数: ${columns.length}`);
    
    // 查询INSERT语句中的字段
    console.log('\n🔍 检查INSERT语句中的字段...');
    const sql = `
      INSERT INTO material_preparation_plans (
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // 提取字段名
    const fieldMatch = sql.match(/INSERT INTO \w+ \((.*?)\) VALUES/s);
    if (fieldMatch) {
      const fields = fieldMatch[1].split(',').map(f => f.trim());
      console.log(`INSERT语句字段数: ${fields.length}`);
      console.log('字段列表:');
      fields.forEach((field, index) => {
        console.log(`${index + 1}. ${field}`);
      });
    }
    
    // 提取占位符数量
    const placeholderMatch = sql.match(/VALUES \((.*?)\)/s);
    if (placeholderMatch) {
      const placeholders = placeholderMatch[1].split(',').map(p => p.trim());
      console.log(`\nVALUES占位符数量: ${placeholders.length}`);
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTableStructure();