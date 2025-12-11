const { pool } = require('./config/database');

/**
 * 检查工序计划表结构
 */
async function checkProcessPlansTableStructure() {
  const connection = await pool.getConnection();
  
  try {
    console.log('=== 检查工序计划表结构 ===');
    
    // 检查表结构
    const [columns] = await connection.execute(`
      DESCRIBE process_plans
    `);
    
    console.log('表字段列表:');
    columns.forEach((column, index) => {
      console.log(`${index + 1}. ${column.Field} - ${column.Type} - ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} - ${column.Default || 'NULL'}`);
    });
    
    // 检查是否包含 required_work_hours 字段
    const hasRequiredWorkHours = columns.some(column => column.Field === 'required_work_hours');
    console.log(`\nrequired_work_hours 字段存在: ${hasRequiredWorkHours ? '✅ 是' : '❌ 否'}`);
    
    // 检查最后几列的结构
    console.log('\n最后5个字段:');
    columns.slice(-5).forEach((column, index) => {
      console.log(`${columns.length - 4 + index}. ${column.Field} - ${column.Type}`);
    });
    
  } catch (error) {
    console.error('❌ 检查表结构失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 执行检查
checkProcessPlansTableStructure()
  .then(() => {
    console.log('\n表结构检查完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('检查失败:', error);
    process.exit(1);
  });