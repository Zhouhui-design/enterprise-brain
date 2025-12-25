/**
 * 自动创建所有工序计划表
 * 根据processTypes.js配置动态生成所有工序计划表
 */

const { pool } = require('../config/database');
const { getEnabledProcesses } = require('../config/processTypes');

/**
 * 生成工序计划表的CREATE TABLE SQL
 * @param {string} tableName - 表名
 * @param {string} displayName - 显示名称
 * @returns {string} SQL语句
 */
function generateCreateTableSQL(tableName, displayName) {
  return `
CREATE TABLE IF NOT EXISTS \`${tableName}\` (
  \`id\` INT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  \`plan_no\` VARCHAR(50) NOT NULL COMMENT '工序计划编号',
  \`schedule_date\` DATE NULL COMMENT '计划排程日期',
  \`sales_order_no\` VARCHAR(50) NULL COMMENT '销售订单编号',
  \`customer_order_no\` VARCHAR(100) NULL COMMENT '客户订单编号',
  \`master_plan_no\` VARCHAR(50) NULL COMMENT '主生产计划编号',
  \`master_plan_product_code\` VARCHAR(50) NULL COMMENT '主计划产品编号',
  \`master_plan_product_name\` VARCHAR(200) NULL COMMENT '主计划产品名称',
  \`shipping_plan_no\` VARCHAR(50) NULL COMMENT '发运计划编号',
  \`product_code\` VARCHAR(50) NULL COMMENT '产品编号',
  \`product_name\` VARCHAR(200) NULL COMMENT '产品名称',
  \`product_image\` TEXT NULL COMMENT '产品图片',
  \`process_manager\` VARCHAR(50) NULL COMMENT '工序负责人',
  \`process_name\` VARCHAR(50) NULL COMMENT '工序名称',
  \`schedule_quantity\` DECIMAL(15,4) DEFAULT 0 COMMENT '计划排程数量',
  \`product_unit\` VARCHAR(20) NULL COMMENT '产品单位',
  \`level0_demand\` INT DEFAULT 0 COMMENT '0级需求',
  \`completion_date\` DATE NULL COMMENT '完工日期',
  \`order_promise_delivery_date\` DATE NULL COMMENT '订单承诺交期',
  \`plan_start_date\` DATE NULL COMMENT '计划开始日期',
  \`real_plan_start_date\` DATE NULL COMMENT '真计划开始日期',
  \`plan_end_date\` DATE NULL COMMENT '计划结束日期',
  \`workshop_name\` VARCHAR(100) NULL COMMENT '车间名称',
  \`daily_available_hours\` DECIMAL(10,2) DEFAULT 0 COMMENT '当天可用工时',
  \`remaining_required_hours\` DECIMAL(10,2) DEFAULT 0 COMMENT '剩余需求工时',
  \`schedule_count\` INT DEFAULT 1 COMMENT '排程次数',
  \`standard_work_hours\` DECIMAL(10,4) DEFAULT 0 COMMENT '定时工时',
  \`standard_work_quota\` DECIMAL(10,4) DEFAULT 0 COMMENT '定时工额',
  \`cumulative_schedule_qty\` DECIMAL(15,4) DEFAULT 0 COMMENT '累积排程数量',
  \`unscheduled_qty\` DECIMAL(15,4) DEFAULT 0 COMMENT '未排数量',
  \`source_page_name\` VARCHAR(100) NULL COMMENT '来源页面名称',
  \`source_no\` VARCHAR(50) NULL COMMENT '来源编号',
  \`previous_schedule_no\` VARCHAR(50) NULL COMMENT '上一个排程编号',
  \`customer_name\` VARCHAR(200) NULL COMMENT '客户名称',
  \`level0_product_name\` VARCHAR(200) NULL COMMENT '0级产品名称',
  \`level0_product_code\` VARCHAR(50) NULL COMMENT '0级产品编号',
  \`level0_production_qty\` INT DEFAULT 0 COMMENT '0级生产数量',
  \`product_source\` VARCHAR(50) NULL COMMENT '产品来源',
  \`bom_no\` VARCHAR(50) NULL COMMENT 'BOM编号',
  \`submitted_by\` VARCHAR(50) NULL COMMENT '提交人',
  \`submitted_at\` DATETIME NULL COMMENT '提交时间',
  \`replenishment_qty\` DECIMAL(15,4) DEFAULT 0 COMMENT '需补货数量',
  \`required_work_hours\` DECIMAL(10,2) DEFAULT 0 COMMENT '需求工时',
  \`daily_total_hours\` DECIMAL(10,2) DEFAULT 0 COMMENT '当天总工时',
  \`daily_scheduled_hours\` DECIMAL(10,2) DEFAULT 0 COMMENT '当天已排程工时',
  \`scheduled_work_hours\` DECIMAL(10,2) DEFAULT 0 COMMENT '已排程工时',
  \`next_schedule_date\` DATE NULL COMMENT '下一个排程日期',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  INDEX \`idx_plan_no\` (\`plan_no\`),
  INDEX \`idx_schedule_date\` (\`schedule_date\`),
  INDEX \`idx_source_no\` (\`source_no\`),
  INDEX \`idx_process_name\` (\`process_name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='${displayName}';
  `;
}

/**
 * 创建所有工序计划表
 */
async function createAllProcessPlanTables() {
  const connection = await pool.getConnection();

  try {
    console.log('\n🚀 开始创建工序计划表...\n');

    const enabledProcesses = getEnabledProcesses();
    let createdCount = 0;
    let skippedCount = 0;

    for (const process of enabledProcesses) {
      const { tableName, displayName, processName } = process;

      try {
        // 检查表是否已存在
        const [tables] = await connection.execute(`SHOW TABLES LIKE '${tableName}'`);

        if (tables.length > 0) {
          console.log(`⏭️  跳过：${displayName}表(${tableName})已存在`);
          skippedCount++;
          continue;
        }

        // 创建表
        const sql = generateCreateTableSQL(tableName, displayName);
        await connection.execute(sql);

        console.log(`✅ 创建成功：${displayName}表(${tableName})`);
        createdCount++;
      } catch (error) {
        console.error(`❌ 创建失败：${displayName}表(${tableName})`);
        console.error(`   错误信息：${error.message}`);
      }
    }

    console.log(`\n📊 统计结果：`);
    console.log(`   - 总计工序类型：${enabledProcesses.length} 个`);
    console.log(`   - 成功创建表：${createdCount} 个`);
    console.log(`   - 已存在跳过：${skippedCount} 个`);
    console.log(`\n✅ 工序计划表创建完成！\n`);
  } catch (error) {
    console.error('\n❌ 创建工序计划表时发生错误：', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createAllProcessPlanTables()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 脚本执行失败：', error);
      process.exit(1);
    });
}

module.exports = {
  createAllProcessPlanTables,
  generateCreateTableSQL,
};
