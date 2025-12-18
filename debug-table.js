const { pool } = require('./backend/config/database');

async function debugTableStructure() {
  try {
    console.log('🔍 调试备料计划表结构...');
    
    // 1. 查看表结构
    const [structure] = await pool.execute('DESCRIBE material_preparation_plans');
    console.log('\n📋 表结构:');
    structure.forEach((field, index) => {
      console.log(`${index + 1}: ${field.Field} - ${field.Type}`);
    });
    
    // 2. 查看INSERT语句的字段数量
    console.log('\n🔍 INSERT语句字段:');
    const insertFields = [
      'plan_no', 'source_plan_no', 'material_code', 'material_name', 
      'material_source', 'material_unit', 'demand_quantity', 'replenishment_quantity', 
      'source_process', 'demand_date', 'push_to_purchase', 'push_to_process', 
      'sales_order_no', 'customer_order_no', 'main_plan_product_code', 
      'main_plan_product_name', 'main_plan_quantity', 'promise_delivery_date', 
      'customer_name', 'created_by', 'created_at', 'updated_at'
    ];
    console.log(`字段数量: ${insertFields.length}`);
    insertFields.forEach((field, index) => {
      console.log(`${index + 1}: ${field}`);
    });
    
    // 3. 查看实际表中的字段
    console.log('\n📊 实际表字段:');
    const actualFields = structure.map(f => f.Field);
    console.log(`实际字段数量: ${actualFields.length}`);
    actualFields.forEach((field, index) => {
      console.log(`${index + 1}: ${field}`);
    });
    
    // 4. 检查不匹配的字段
    console.log('\n⚠️ 字段匹配检查:');
    insertFields.forEach(field => {
      if (!actualFields.includes(field)) {
        console.log(`❌ INSERT语句中的字段 ${field} 在表中不存在`);
      }
    });
    
    actualFields.forEach(field => {
      if (!insertFields.includes(field)) {
        console.log(`⚠️ 表中的字段 ${field} 未在INSERT语句中使用`);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 调试失败:', error);
    process.exit(1);
  }
}

debugTableStructure();