const { pool } = require('./config/database');

// 测试简单查询
async function testSimpleQuery() {
  try {
    console.log('测试基本查询...');
    
    // 测试1: 不带参数的查询
    const sql1 = 'SELECT COUNT(*) as total FROM material_preparation_plans';
    const [result1] = await pool.execute(sql1);
    console.log('测试1结果:', result1[0].total);
    
    // 测试2: 使用字符串拼接的方式（不安全，但用于测试）
    const limit = 10;
    const offset = 0;
    const sql2 = `SELECT * FROM material_preparation_plans LIMIT ${limit} OFFSET ${offset}`;
    const [result2] = await pool.execute(sql2);
    console.log('测试2结果数量:', result2.length);
    
    // 测试3: 使用named parameters（如果支持）
    try {
      const sql3 = 'SELECT * FROM material_preparation_plans WHERE id = :id';
      const [result3] = await pool.execute(sql3, { id: 1 });
      console.log('测试3结果数量:', result3.length);
    } catch (e) {
      console.log('测试3失败（named parameters可能不支持）:', e.message);
    }
    
    console.log('✅ 部分测试通过！');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

testSimpleQuery();