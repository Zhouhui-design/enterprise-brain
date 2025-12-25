const { pool } = require('./config/database');

async function checkTableStructure() {
  try {
    // 查询production_boms表结构
    const [columns] = await pool.execute('DESCRIBE production_boms');
    console.log('=== production_boms表结构 ===');
    columns.forEach(col => {
      console.log(`${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key} ${col.Default || ''}`);
    });

    // 查询bom_components表结构
    const [componentsColumns] = await pool.execute('DESCRIBE bom_components');
    console.log('\n=== bom_components表结构 ===');
    componentsColumns.forEach(col => {
      console.log(`${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key} ${col.Default || ''}`);
    });
  } catch (error) {
    console.error('查询表结构失败:', error);
  } finally {
    pool.end();
  }
}

checkTableStructure();
