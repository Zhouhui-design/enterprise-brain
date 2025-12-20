const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'zH754277289hUi~197547',
  database: 'enterprise_brain',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

(async () => {
  const pool = mysql.createPool(dbConfig);
  
  console.log('📊 检查所有表的 standard_work_quota 字段:\n');
  
  // 获取所有表
  const [tables] = await pool.execute("SHOW TABLES");
  
  for (const table of tables) {
    const tableName = Object.values(table)[0];
    
    // 检查是否有 standard_work_quota 或 standard_time 字段
    const [columns] = await pool.execute(`SHOW COLUMNS FROM \`${tableName}\` LIKE '%standard%'`);
    
    if (columns.length > 0) {
      console.log(`✅ 表: ${tableName}`);
      columns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type})`);
      });
      
      // 查询数据
      try {
        const [rows] = await pool.execute(`SELECT * FROM \`${tableName}\` WHERE ${columns[0].Field} IS NOT NULL LIMIT 5`);
        if (rows.length > 0) {
          console.log(`   📝 示例数据:`);
          rows.forEach((row, i) => {
            console.log(`      [${i+1}]`, JSON.stringify(row).substring(0, 150));
          });
        }
      } catch (e) {
        console.log(`   ⚠️ 查询错误: ${e.message}`);
      }
      console.log('');
    }
  }
  
  await pool.end();
})();
