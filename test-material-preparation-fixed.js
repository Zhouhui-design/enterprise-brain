const { pool } = require('./backend/config/database');

async function testMaterialPreparationFixed() {
  try {
    console.log('开始测试修复后的备料计划查询...');
    
    // 测试修复后的分页查询（使用字符串拼接）
    console.log('测试修复后的分页查询...');
    const pageSize = 10;
    const offset = 0;
    
    const dataSql = `
      SELECT 
        id,
        plan_no,
        material_code,
        material_name,
        created_at
      FROM material_preparation_plans 
      ORDER BY created_at DESC
      LIMIT ${Math.max(0, parseInt(pageSize))} OFFSET ${Math.max(0, parseInt(offset))}
    `;
    
    console.log('SQL:', dataSql);
    
    const [data] = await pool.execute(dataSql);
    console.log('修复后分页查询成功，返回', data.length, '条记录');
    
    console.log('所有测试通过！');
    
  } catch (error) {
    console.error('测试失败:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
  } finally {
    await pool.end();
  }
}

testMaterialPreparationFixed();