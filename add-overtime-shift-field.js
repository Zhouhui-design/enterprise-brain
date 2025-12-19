/**
 * 添加 overtime_shift 字段到 process_capacity_load 表
 */

const { pool } = require('./backend/config/database');

async function addOvertimeShiftField() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('🔧 添加 overtime_shift 字段到 process_capacity_load 表');
    console.log('='.repeat(60));
    
    // 1. 检查字段是否已存在
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM process_capacity_load WHERE Field = 'overtime_shift'"
    );
    
    if (columns.length > 0) {
      console.log('⚪ overtime_shift 字段已存在，无需添加');
      return;
    }
    
    console.log('📝 开始添加 overtime_shift 字段...');
    
    // 2. 添加字段
    await connection.execute(`
      ALTER TABLE process_capacity_load 
      ADD COLUMN overtime_shift VARCHAR(255) DEFAULT NULL COMMENT '加班时段' 
      AFTER remaining_hours
    `);
    
    console.log('✅ overtime_shift 字段添加成功');
    
    // 3. 验证字段
    const [newColumns] = await connection.execute(
      "SHOW COLUMNS FROM process_capacity_load WHERE Field = 'overtime_shift'"
    );
    
    if (newColumns.length > 0) {
      console.log('\n📋 字段信息：');
      console.log(`   字段名: ${newColumns[0].Field}`);
      console.log(`   类型: ${newColumns[0].Type}`);
      console.log(`   允许NULL: ${newColumns[0].Null}`);
      console.log(`   默认值: ${newColumns[0].Default}`);
    }
    
    // 4. 显示完整表结构
    console.log('\n📋 完整表结构：');
    const [allColumns] = await connection.execute(
      "SHOW COLUMNS FROM process_capacity_load"
    );
    
    allColumns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    console.log('\n✅ 修复完成！');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ 添加字段失败:', error);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

addOvertimeShiftField();
