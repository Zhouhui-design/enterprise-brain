const { pool } = require('./backend/config/database');
const fs = require('fs');

async function applyTrigger() {
  try {
    console.log('🔧 应用主生产计划计划数量自动计算触发器...\n');
    
    // 读取SQL文件
    const sql = fs.readFileSync('./create_plan_quantity_trigger.sql', 'utf8');
    
    // 分割SQL语句（按分号分割，但要保留DELIMITER块）
    const statements = sql.split('$$').filter(s => s.trim());
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed || trimmed === 'DELIMITER' || trimmed.startsWith('--')) {
        continue;
      }
      
      try {
        await pool.query(trimmed);
      } catch (error) {
        if (error.code !== 'ER_TRG_DOES_NOT_EXIST') {
          console.error('执行SQL失败:', error.message);
        }
      }
    }
    
    console.log('✅ 触发器应用成功！\n');
    
    // 验证触发器
    const [triggers] = await pool.execute(`
      SHOW TRIGGERS FROM enterprise_brain 
      WHERE \`Table\` = 'master_production_plans'
    `);
    
    console.log('📋 已创建的触发器:');
    triggers.forEach(t => {
      console.log(`  ✅ ${t.Trigger} (${t.Timing} ${t.Event})`);
    });
    
    // 更新现有数据的计划数量
    console.log('\n🔄 更新现有记录的计划数量...');
    const [result] = await pool.execute(`
      UPDATE master_production_plans
      SET plan_quantity = IF(
        available_stock >= order_quantity,
        0,
        order_quantity - available_stock
      )
      WHERE order_quantity IS NOT NULL 
        AND available_stock IS NOT NULL
    `);
    
    console.log(`✅ 已更新 ${result.affectedRows} 条记录\n`);
    
    // 验证更新结果
    const [rows] = await pool.execute(`
      SELECT 
        plan_code, order_quantity, available_stock, plan_quantity
      FROM master_production_plans 
      ORDER BY id DESC 
      LIMIT 3
    `);
    
    console.log('📊 最新数据验证:');
    rows.forEach((row, index) => {
      const expected = row.order_quantity - row.available_stock;
      const match = row.plan_quantity == expected ? '✅' : '❌';
      console.log(`\n${match} 记录 ${index + 1}: ${row.plan_code}`);
      console.log(`  订单数量: ${row.order_quantity}`);
      console.log(`  可用库存: ${row.available_stock}`);
      console.log(`  计划数量: ${row.plan_quantity} (预期: ${expected})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 应用触发器失败:', error);
    process.exit(1);
  }
}

applyTrigger();
