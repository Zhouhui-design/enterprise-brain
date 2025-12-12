const { pool } = require('./backend/config/database');

async function checkTableFields() {
  try {
    console.log('🔍 检查 real_process_plans 表结构...');
    
    // 获取表结构
    const [columns] = await pool.execute(`
      DESCRIBE real_process_plans
    `);
    
    console.log('📋 表字段列表:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key || ''}`);
    });
    
    // 检查是否有数据
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM real_process_plans');
    console.log(`\n📊 表中记录数: ${countResult[0].total}`);
    
    if (countResult[0].total > 0) {
      // 获取前几条记录的字段样本
      const [sampleRows] = await pool.execute(`
        SELECT * FROM real_process_plans LIMIT 2
      `);
      
      console.log('\n📝 字段数据样本:');
      Object.keys(sampleRows[0]).forEach(field => {
        console.log(`  ${field}: ${sampleRows[0][field]}`);
      });
    }
    
  } catch (error) {
    console.error('❗ 检查表结构失败:', error);
  } finally {
    process.exit(0);
  }
}

checkTableFields();