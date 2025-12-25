const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('尝试连接MySQL数据库...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'zH754277289hUi~197547',
      database: 'enterprise_brain',
    });

    console.log('✅ 数据库连接成功');

    // 测试查询
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM materials');
    console.log('物料表记录数:', rows[0].count);

    await connection.end();
    console.log('连接已关闭');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('错误代码:', error.code);
    console.error('错误详情:', error);
  }
}

testConnection();
