/**
 * 为所有工序表添加shipping_plan_no字段
 */

const { pool } = require('./config/database');
const { getEnabledProcesses } = require('./config/processTypes');

async function addShippingPlanNoField() {
  const connection = await pool.getConnection();

  try {
    // 1. 先为real_process_plans表添加字段
    console.log('🔧 为real_process_plans表添加shipping_plan_no字段...');
    await connection.execute(
      `ALTER TABLE real_process_plans 
       ADD COLUMN shipping_plan_no VARCHAR(50) NULL COMMENT '发运计划编号' AFTER main_plan_product_name`,
    );
    console.log('✅ real_process_plans表字段添加成功');

    // 2. 获取所有启用的工序表
    const enabledProcesses = getEnabledProcesses();

    for (const process of enabledProcesses) {
      const { tableName, displayName } = process;

      try {
        console.log(`\n🔧 为${displayName}表(${tableName})添加shipping_plan_no字段...`);
        await connection.execute(
          `ALTER TABLE ${tableName} 
           ADD COLUMN shipping_plan_no VARCHAR(50) NULL COMMENT '发运计划编号' AFTER main_plan_product_name`,
        );
        console.log(`✅ ${displayName}表字段添加成功`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⏭️ ${displayName}表(${tableName})已包含shipping_plan_no字段，跳过`);
        } else {
          console.error(`❌ 为${displayName}表(${tableName})添加字段失败:`, error.message);
        }
      }
    }

    console.log('\n🎉 所有表字段添加完成！');
  } catch (error) {
    console.error('❌ 执行过程中出错:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

// 执行脚本
addShippingPlanNoField();
