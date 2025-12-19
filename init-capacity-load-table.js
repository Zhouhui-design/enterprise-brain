/**
 * 初始化工序能力负荷表
 */

const { pool } = require('./backend/config/database');
const fs = require('fs');

async function initCapacityLoadTable() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('🔧 开始初始化工序能力负荷表...');
    console.log('='.repeat(60));
    
    // 1. 读取并执行SQL脚本
    console.log('\n📝 步骤1: 创建表结构...');
    const sqlScript = fs.readFileSync('./db/migration/create_capacity_load_table.sql', 'utf8');
    
    // 分割SQL语句（按分号）
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      try {
        await connection.execute(statement);
        console.log('  ✅ 执行成功');
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
          console.log('  ⚪ 表已存在，跳过');
        } else {
          console.error('  ❌ 执行失败:', error.message);
        }
      }
    }
    
    // 2. 验证表是否创建成功
    console.log('\n📝 步骤2: 验证表结构...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'process_capacity_load'"
    );
    
    if (tables.length === 0) {
      console.log('❌ process_capacity_load 表未创建成功');
      return;
    }
    
    console.log('✅ process_capacity_load 表已存在');
    
    // 3. 检查表结构
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM process_capacity_load"
    );
    
    console.log(`\n📋 表结构（共 ${columns.length} 个字段）：`);
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // 4. 检查 overtime_shift 字段
    const hasOvertimeShift = columns.some(col => col.Field === 'overtime_shift');
    console.log(`\n🔍 overtime_shift 字段: ${hasOvertimeShift ? '✅ 存在' : '❌ 不存在'}`);
    
    // 5. 检查数据量
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM process_capacity_load'
    );
    const total = countResult[0].total;
    console.log(`\n📊 数据量: ${total} 条`);
    
    if (total === 0) {
      console.log('\n💡 提示: 表中没有数据。请在前端页面使用"从工序加载"功能生成数据。');
      console.log('   路径: http://localhost:3003/mrp/capacity-load');
      console.log('   操作: 点击"加载工序"按钮，选择工序，生成能力负荷数据');
    } else {
      console.log('\n📝 示例数据（前5条）：');
      const [sampleData] = await connection.execute(
        'SELECT * FROM process_capacity_load ORDER BY process_name, date LIMIT 5'
      );
      
      sampleData.forEach((row, index) => {
        console.log(`\n  ${index + 1}. 工序: ${row.process_name}`);
        console.log(`     日期: ${row.date ? row.date.toISOString().split('T')[0] : '未知'}`);
        console.log(`     可用工位: ${row.available_workstations || 0}`);
        console.log(`     上班时段: ${row.work_shift || 'NULL'}`);
        console.log(`     已占用工时: ${row.occupied_hours || 0}`);
        console.log(`     剩余工时: ${row.remaining_hours || 0}`);
        console.log(`     加班时段: ${row.overtime_shift || 'NULL'}`);
      });
    }
    
    console.log('\n✅ 工序能力负荷表初始化完成！');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

initCapacityLoadTable();
