const { pool } = require('./backend/config/database');

async function testMaterialPreparationQuery() {
  try {
    console.log('开始测试备料计划查询...');
    
    // 测试简单计数查询
    console.log('测试计数查询...');
    const countSql = 'SELECT COUNT(*) as total FROM material_preparation_plans';
    const [countResult] = await pool.execute(countSql);
    console.log('计数查询成功:', countResult[0]);
    
    // 测试分页查询
    console.log('测试分页查询...');
    const dataSql = `
      SELECT 
        id,
        plan_no,
        material_code,
        material_name,
        created_at
      FROM material_preparation_plans 
      ORDER BY created_at DESC
      LIMIT 10 OFFSET 0
    `;
    
    console.log('SQL:', dataSql);
    console.log('参数: 无参数');
    
    const [data] = await pool.execute(dataSql);
    console.log('分页查询成功，返回', data.length, '条记录');
    
    // 测试带参数的分页查询
    console.log('测试带参数的分页查询...');
    const dataSql2 = `
      SELECT 
        id,
        plan_no,
        material_code,
        material_name,
        created_at
      FROM material_preparation_plans 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const pageSize = 10;
    const offset = 0;
    
    console.log('SQL:', dataSql2);
    console.log('参数:', [pageSize, offset]);
    
    const [data2] = await pool.execute(dataSql2, [pageSize, offset]);
    console.log('带参数分页查询成功，返回', data2.length, '条记录');
    
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

testMaterialPreparationQuery();