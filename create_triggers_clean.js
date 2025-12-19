const { pool } = require('./backend/config/database');

async function createTriggers() {
  try {
    console.log('🔧 创建主生产计划计划数量自动计算触发器...\n');
    
    // 删除旧触发器
    try {
      await pool.query('DROP TRIGGER IF EXISTS before_insert_master_production_plans_calc_plan_quantity');
      await pool.query('DROP TRIGGER IF EXISTS before_update_master_production_plans_calc_plan_quantity');
      console.log('✅ 已删除旧触发器\n');
    } catch (e) {
      // 忽略错误
    }
    
    // 创建INSERT触发器
    await pool.query(`
      CREATE TRIGGER before_insert_master_production_plans_calc_plan_quantity
      BEFORE INSERT ON master_production_plans
      FOR EACH ROW
      BEGIN
        IF NEW.order_quantity IS NOT NULL AND NEW.available_stock IS NOT NULL THEN
          SET NEW.plan_quantity = IF(
            NEW.available_stock >= NEW.order_quantity,
            0,
            NEW.order_quantity - NEW.available_stock
          );
        END IF;
      END
    `);
    console.log('✅ INSERT触发器创建成功');
    
    // 创建UPDATE触发器
    await pool.query(`
      CREATE TRIGGER before_update_master_production_plans_calc_plan_quantity
      BEFORE UPDATE ON master_production_plans
      FOR EACH ROW
      BEGIN
        IF (NEW.order_quantity != OLD.order_quantity OR NEW.available_stock != OLD.available_stock) 
           AND NEW.order_quantity IS NOT NULL 
           AND NEW.available_stock IS NOT NULL THEN
          SET NEW.plan_quantity = IF(
            NEW.available_stock >= NEW.order_quantity,
            0,
            NEW.order_quantity - NEW.available_stock
          );
        END IF;
      END
    `);
    console.log('✅ UPDATE触发器创建成功\n');
    
    // 验证触发器
    const [triggers] = await pool.execute(`
      SHOW TRIGGERS FROM enterprise_brain 
      WHERE \`Table\` = 'master_production_plans'
    `);
    
    console.log('📋 已创建的触发器:');
    triggers.forEach(t => {
      console.log(`  ✅ ${t.Trigger}`);
      console.log(`     时机: ${t.Timing} ${t.Event}`);
    });
    
    // 更新现有数据
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
    
    // 验证结果
    const [rows] = await pool.execute(`
      SELECT 
        plan_code, order_quantity, available_stock, plan_quantity
      FROM master_production_plans 
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    console.log('📊 数据验证:');
    rows.forEach((row, index) => {
      const expected = Math.max(0, row.order_quantity - row.available_stock);
      const match = Math.abs(row.plan_quantity - expected) < 0.01 ? '✅' : '❌';
      console.log(`\n${match} ${row.plan_code}`);
      console.log(`  订单数量: ${row.order_quantity}`);
      console.log(`  可用库存: ${row.available_stock}`);
      console.log(`  计划数量: ${row.plan_quantity} (预期: ${expected})`);
    });
    
    console.log('\n✅ 触发器部署完成！');
    console.log('\n📝 说明：');
    console.log('  - 新增主生产计划时，会自动计算 plan_quantity = order_quantity - available_stock');
    console.log('  - 更新订单数量或可用库存时，会自动重新计算 plan_quantity');
    console.log('  - 如果可用库存 >= 订单数量，则 plan_quantity = 0');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建触发器失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createTriggers();
