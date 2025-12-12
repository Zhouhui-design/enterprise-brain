const { pool } = require('./backend/config/database');

async function checkTableStructure() {
  try {
    console.log('🔍 检查 real_process_plans 表结构');
    
    const [rows] = await pool.execute('DESCRIBE real_process_plans');
    
    console.log(`\n📊 表字段列表 (共${rows.length}个字段):`);
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.Field} - ${row.Type} - ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n📝 生成简化INSERT语句的字段列表:');
    const essentialFields = rows.filter(row => 
      !['created_at', 'updated_at'].includes(row.Field)
    ).map(row => row.Field);
    
    console.log('字段:', essentialFields.join(', '));
    console.log(`字段数量: ${essentialFields.length}`);
    
    // 生成对应的VALUES占位符
    const placeholders = essentialFields.map(() => '?').join(', ');
    console.log('VALUES:', placeholders);
    console.log('占位符数量:', essentialFields.length);
    
  } catch (error) {
    console.error('❌ 检查表结构失败:', error);
  } finally {
    process.exit(0);
  }
}

checkTableStructure();