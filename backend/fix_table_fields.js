const { pool } = require('./config/database');

async function fixTableFields() {
  try {
    console.log('🔧 开始修复process_capacity_load表字段名...');
    
    // 执行SQL语句修复字段名
    await pool.execute(`
      ALTER TABLE process_capacity_load 
      RENAME COLUMN processName TO process_name, 
      RENAME COLUMN workshopName TO workshop_name, 
      RENAME COLUMN equipmentName TO equipment_name, 
      RENAME COLUMN utilizationRate TO utilization_rate, 
      RENAME COLUMN plannedProduction TO planned_production, 
      RENAME COLUMN actualProduction TO actual_production, 
      RENAME COLUMN createdAt TO created_at, 
      RENAME COLUMN updatedAt TO updated_at
    `);
    
    console.log('✅ process_capacity_load表字段名修复成功！');
    
    // 关闭数据库连接
    await pool.end();
  } catch (error) {
    console.error('❌ 修复表字段名失败:', error.message);
    process.exit(1);
  }
}

// 执行修复操作
fixTableFields();
