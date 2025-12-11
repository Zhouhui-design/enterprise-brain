/**
 * 测试级联删除功能
 * 验证备料计划和工序计划的字段名
 */

const { pool } = require('./config/database');

async function testCascadeDelete() {
  try {
    console.log('=== 开始测试级联删除功能 ===\n');
    
    // 1. 检查备料计划表结构
    console.log('1. 检查备料计划表结构:');
    const [materialColumns] = await pool.execute(
      'SHOW COLUMNS FROM material_preparation_plans WHERE Field LIKE "%order%"'
    );
    console.log('备料计划表中包含order的字段:');
    materialColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    // 2. 检查工序计划表结构
    console.log('\n2. 检查工序计划表结构:');
    const [processColumns] = await pool.execute(
      'SHOW COLUMNS FROM process_plans WHERE Field LIKE "%order%"'
    );
    console.log('工序计划表中包含order的字段:');
    processColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    // 3. 查询现有备料计划数据
    console.log('\n3. 查询现有备料计划数据:');
    const [materialPlans] = await pool.execute(
      'SELECT id, plan_no, sales_order_no FROM material_preparation_plans LIMIT 5'
    );
    console.log('备料计划示例数据:');
    materialPlans.forEach(plan => {
      console.log(`  - 编号: ${plan.plan_no}, 销售订单编号: ${plan.sales_order_no || 'NULL'}`);
    });
    
    // 4. 查询现有工序计划数据
    console.log('\n4. 查询现有工序计划数据:');
    const [processPlans] = await pool.execute(
      'SELECT id, plan_no, sales_order_no FROM process_plans LIMIT 5'
    );
    console.log('工序计划示例数据:');
    processPlans.forEach(plan => {
      console.log(`  - 编号: ${plan.plan_no}, 销售订单编号: ${plan.sales_order_no || 'NULL'}`);
    });
    
    // 5. 测试删除SQL语句（不实际执行）
    console.log('\n5. 测试删除SQL语句:');
    const testOrderNo = 'SO2025000001';
    console.log(`\n假设删除订单: ${testOrderNo}`);
    
    const [materialCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM material_preparation_plans WHERE sales_order_no = ?',
      [testOrderNo]
    );
    console.log(`  - 符合条件的备料计划: ${materialCount[0].count} 条`);
    
    const [processCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM process_plans WHERE sales_order_no = ?',
      [testOrderNo]
    );
    console.log(`  - 符合条件的工序计划: ${processCount[0].count} 条`);
    
    // 6. 显示符合条件的具体数据
    if (materialCount[0].count > 0) {
      console.log('\n符合条件的备料计划详情:');
      const [materials] = await pool.execute(
        'SELECT id, plan_no, sales_order_no, material_code, material_name FROM material_preparation_plans WHERE sales_order_no = ?',
        [testOrderNo]
      );
      materials.forEach(m => {
        console.log(`  - ${m.plan_no}: ${m.material_code} - ${m.material_name}`);
      });
    }
    
    if (processCount[0].count > 0) {
      console.log('\n符合条件的工序计划详情:');
      const [processes] = await pool.execute(
        'SELECT id, plan_no, sales_order_no, product_code, product_name FROM process_plans WHERE sales_order_no = ?',
        [testOrderNo]
      );
      processes.forEach(p => {
        console.log(`  - ${p.plan_no}: ${p.product_code} - ${p.product_name}`);
      });
    }
    
    console.log('\n=== 测试完成 ===');
    process.exit(0);
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testCascadeDelete();
