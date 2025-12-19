const { pool } = require('./backend/config/database');

async function checkMPSTableStructure() {
  try {
    console.log('🔍 检查主生产计划表结构...\n');
    
    // 查看表结构
    const [columns] = await pool.execute(`
      SHOW FULL COLUMNS FROM master_production_plans
    `);
    
    console.log('主生产计划表字段:');
    columns.forEach(col => {
      const extra = col.Extra ? ` [${col.Extra}]` : '';
      console.log(`  - ${col.Field} (${col.Type})${extra}`);
      if (col.Field === 'plan_quantity') {
        console.log(`    ↳ 默认值: ${col.Default}`);
        console.log(`    ↳ Extra: ${col.Extra}`);
        console.log(`    ↳ Comment: ${col.Comment}`);
      }
    });
    
    // 检查触发器
    console.log('\n🔍 检查触发器:');
    const [triggers] = await pool.execute(`
      SHOW TRIGGERS FROM enterprise_brain
      WHERE \`Table\` = 'master_production_plans'
    `);
    
    if (triggers.length === 0) {
      console.log('  ❌ 未找到相关触发器');
    } else {
      triggers.forEach(t => {
        console.log(`  ✅ ${t.Trigger} (${t.Timing} ${t.Event})`);
      });
    }
    
    // 检查实际数据
    console.log('\n🔍 检查最新数据:');
    const [rows] = await pool.execute(`
      SELECT 
        plan_code, order_quantity, available_stock, plan_quantity
      FROM master_production_plans 
      ORDER BY id DESC 
      LIMIT 3
    `);
    
    rows.forEach((row, index) => {
      console.log(`\n记录 ${index + 1}:`);
      console.log(`  计划编号: ${row.plan_code}`);
      console.log(`  订单数量: ${row.order_quantity}`);
      console.log(`  可用库存: ${row.available_stock}`);
      console.log(`  计划数量: ${row.plan_quantity}`);
      console.log(`  预期计划数量: ${row.order_quantity - row.available_stock}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
}

checkMPSTableStructure();
