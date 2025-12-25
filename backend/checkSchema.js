const { pool } = require('./config/database');

async function checkTableSchema() {
  try {
    // 获取production_boms表结构
    const [productionBomsSchema] = await pool.execute(
      `DESCRIBE production_boms`
    );
    
    // 获取bom_components表结构  
    const [bomComponentsSchema] = await pool.execute(
      `DESCRIBE bom_components`
    );
    
    console.log('=== production_boms表结构 ===');
    productionBomsSchema.forEach(column => {
      console.log(`${column.Field}: ${column.Type} (${column.Null}, ${column.Key}, ${column.Default}, ${column.Extra})`);
    });
    
    console.log('\n=== bom_components表结构 ===');
    bomComponentsSchema.forEach(column => {
      console.log(`${column.Field}: ${column.Type} (${column.Null}, ${column.Key}, ${column.Default}, ${column.Extra})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('查询表结构失败:', error);
    process.exit(1);
  }
}

checkTableSchema();