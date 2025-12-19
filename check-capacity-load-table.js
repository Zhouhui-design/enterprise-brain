/**
 * 检查工序能力负荷表数据和结构
 */

const { pool } = require('./backend/config/database');

async function checkCapacityLoadTable() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('🔍 工序能力负荷表检查');
    console.log('='.repeat(60));
    
    // 1. 检查表是否存在
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'capacity_load'"
    );
    
    if (tables.length === 0) {
      console.log('❌ capacity_load 表不存在');
      return;
    }
    
    console.log('✅ capacity_load 表存在');
    
    // 2. 检查表结构
    console.log('\n📋 表结构：');
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM capacity_load"
    );
    
    console.log(`   字段数量: ${columns.length}`);
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    // 3. 检查是否有 overtime_shift 字段
    const hasOvertimeShift = columns.some(col => col.Field === 'overtime_shift');
    console.log(`\n🔍 overtime_shift 字段: ${hasOvertimeShift ? '✅ 存在' : '❌ 不存在'}`);
    
    // 4. 检查数据量
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM capacity_load'
    );
    const total = countResult[0].total;
    console.log(`\n📊 数据量: ${total} 条`);
    
    // 5. 查看示例数据（前5条）
    if (total > 0) {
      console.log('\n📝 示例数据（前5条）：');
      const [sampleData] = await connection.execute(
        'SELECT * FROM capacity_load LIMIT 5'
      );
      
      sampleData.forEach((row, index) => {
        console.log(`\n  ${index + 1}. 工序: ${row.process_name || '未知'}`);
        console.log(`     日期: ${row.date ? row.date.toISOString().split('T')[0] : '未知'}`);
        console.log(`     已占用工时: ${row.occupied_work_hours || 0}`);
        console.log(`     剩余工时: ${row.remaining_work_hours || 0}`);
      });
    } else {
      console.log('\n⚠️  表中没有数据');
    }
    
    // 6. 检查后端路由
    console.log('\n🔍 检查后端API文件...');
    const fs = require('fs');
    const capacityLoadRoutePath = './backend/routes/capacityLoad.js';
    
    if (fs.existsSync(capacityLoadRoutePath)) {
      console.log('✅ backend/routes/capacityLoad.js 存在');
      
      const routeContent = fs.readFileSync(capacityLoadRoutePath, 'utf8');
      
      // 检查是否使用了 overtime_shift 字段
      if (routeContent.includes('overtime_shift')) {
        console.log('⚠️  代码中使用了 overtime_shift 字段');
        
        // 找出使用位置
        const lines = routeContent.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('overtime_shift')) {
            console.log(`   第 ${index + 1} 行: ${line.trim().substring(0, 80)}`);
          }
        });
      } else {
        console.log('✅ 代码中未使用 overtime_shift 字段');
      }
    } else {
      console.log('❌ backend/routes/capacityLoad.js 不存在');
    }
    
    // 7. 建议修复方案
    console.log('\n💡 修复建议：');
    if (!hasOvertimeShift) {
      console.log('   1. 添加 overtime_shift 字段到数据库表');
      console.log('   2. 或者从代码中移除 overtime_shift 字段的引用');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    console.error('   错误详情:', error);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

checkCapacityLoadTable();
