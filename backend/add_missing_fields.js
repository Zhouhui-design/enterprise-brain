/**
 * 为所有工序表添加缺失的字段
 */

const { pool } = require('./config/database');
const { getEnabledProcesses } = require('./config/processTypes');

// 需要添加的字段列表
const missingFields = [
  { name: 'product_image', type: 'TEXT NULL', comment: '产品图片', after: 'product_name' },
  { name: 'process_manager', type: 'VARCHAR(50) NULL', comment: '工序负责人', after: 'product_image' },
  { name: 'order_promise_delivery_date', type: 'DATE NULL', comment: '订单承诺交期', after: 'process_name' },
  { name: 'workshop_name', type: 'VARCHAR(100) NULL', comment: '车间名称', after: 'order_promise_delivery_date' },
  { name: 'source_page_name', type: 'VARCHAR(100) NULL', comment: '来源页面名称', after: 'workshop_name' },
  { name: 'level0_product_name', type: 'VARCHAR(200) NULL', comment: '0级产品名称', after: 'source_page_name' },
  { name: 'level0_product_code', type: 'VARCHAR(50) NULL', comment: '0级产品编号', after: 'level0_product_name' },
  { name: 'level0_production_qty', type: 'INT DEFAULT 0', comment: '0级生产数量', after: 'level0_product_code' },
  { name: 'product_source', type: 'VARCHAR(50) NULL', comment: '产品来源', after: 'level0_production_qty' },
  { name: 'bom_no', type: 'VARCHAR(50) NULL', comment: 'BOM编号', after: 'product_source' },
  { name: 'previous_schedule_no', type: 'VARCHAR(50) NULL', comment: '上一个排程编号', after: 'bom_no' },
];

async function addMissingFieldsToTable(tableName) {
  const connection = await pool.getConnection();

  try {
    for (const field of missingFields) {
      try {
        await connection.execute(
          `ALTER TABLE ${tableName} 
           ADD COLUMN ${field.name} ${field.type} COMMENT '${field.comment}' ${field.after ? `AFTER ${field.after}` : ''}`,
        );
        console.log(`✅ ${tableName}表添加${field.name}字段成功`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⏭️ ${tableName}表已包含${field.name}字段，跳过`);
        } else {
          console.error(`❌ ${tableName}表添加${field.name}字段失败:`, error.message);
        }
      }
    }
  } finally {
    connection.release();
  }
}

async function addAllMissingFields() {
  console.log('🔧 开始为所有工序表添加缺失的字段...\n');

  // 1. 先为real_process_plans表添加字段
  console.log('🔧 为real_process_plans表添加缺失字段...');
  await addMissingFieldsToTable('real_process_plans');

  // 2. 获取所有启用的工序表
  const enabledProcesses = getEnabledProcesses();

  for (const process of enabledProcesses) {
    const { tableName, displayName } = process;

    console.log(`\n🔧 为${displayName}表(${tableName})添加缺失字段...`);
    await addMissingFieldsToTable(tableName);
  }

  console.log('\n🎉 所有表字段添加完成！');
}

// 执行脚本
addAllMissingFields();
