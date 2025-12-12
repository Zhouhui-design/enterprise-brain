const { pool } = require('./backend/config/database');

async function testSimpleInsert() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🧪 测试简单INSERT...');
    
    // 最小化INSERT，只包含必要的字段
    const sql = `
      INSERT INTO real_process_plans (
        plan_no, process_name, product_code, product_name, 
        plan_start_date, schedule_date, workshop_name, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const [result] = await connection.execute(sql, [
      'TEST-SIMPLE',  // plan_no
      '测试工序',      // process_name
      'TEST-CODE',    // product_code
      '测试产品',      // product_name
      '2025-01-10',   // plan_start_date
      '2025-01-10',   // schedule_date
      '测试车间'       // workshop_name
    ]);
    
    console.log('✅ 插入成功，ID:', result.insertId);
    
    // 查询验证
    const [rows] = await connection.execute('SELECT * FROM real_process_plans WHERE id = ?', [result.insertId]);
    console.log('📋 插入的数据:', rows[0]);
    
  } catch (error) {
    console.error('❗ 测试失败:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

testSimpleInsert().catch(error => {
  console.error('❗ 测试执行失败:', error);
  process.exit(1);
});