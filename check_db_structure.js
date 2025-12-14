const mysql = require('mysql2/promise');

async function checkTableStructure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'zH754277289hUi~197547',
    database: 'enterprise_brain'
  });

  try {
    const [rows] = await connection.execute("DESCRIBE material_preparation_plans");
    console.log('表结构列数:', rows.length);
    console.log('列名:');
    rows.forEach((row, index) => {
      console.log(`${index + 1}: ${row.Field}`);
    });
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await connection.end();
  }
}

checkTableStructure();