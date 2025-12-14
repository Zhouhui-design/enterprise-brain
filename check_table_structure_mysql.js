const { pool } = require('./backend/config/database');

async function checkTableStructure() {
  try {
    console.log('🔍 检查 material_preparation_plans 表结构...');
    
    const [rows] = await pool.execute("DESCRIBE material_preparation_plans");
    
    console.log('\n📋 表结构信息:');
    console.log('列数:', rows.length);
    console.log('\n字段列表:');
    
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.Field} (${row.Type}) - ${row.Null === 'NO' ? 'NOT NULL' : 'NULL'} - ${row.Key ? row.Key : ''}`);
    });
    
    console.log('\n📝 不包含id字段的INSERT列名:');
    const insertColumns = rows
      .filter(row => row.Field !== 'id')
      .map(row => row.Field)
      .join(', ');
    console.log(insertColumns);
    
    console.log('\n📊 占位符数量:');
    const placeholderCount = rows.filter(row => row.Field !== 'id').length;
    console.log('?', '?'.repeat(placeholderCount - 1).split('').join(', '));
    console.log('总计:', placeholderCount, '个?');
    
    // 检查当前服务中的INSERT语句
    console.log('\n🔍 当前服务中的INSERT语句列数:');
    const serviceContent = require('fs').readFileSync('./backend/services/materialPreparationPlanService.js', 'utf8');
    const insertMatch = serviceContent.match(/INSERT INTO material_preparation_plans\s*\(\s*([^)]+)\s*\)/s);
    if (insertMatch) {
      const columns = insertMatch[1].split(',').map(col => col.trim());
      console.log('INSERT列数:', columns.length);
      console.log('列名:', columns);
    }
    
    // 检查VALUES占位符
    const valuesMatch = serviceContent.match(/VALUES\s*\(\s*([^)]+)\s*\)/s);
    if (valuesMatch) {
      const placeholders = valuesMatch[1].split(',').map(ph => ph.trim());
      console.log('VALUES占位符数:', placeholders.length);
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    process.exit(0);
  }
}

checkTableStructure();