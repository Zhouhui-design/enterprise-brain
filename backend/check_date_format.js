const mysql = require('mysql2/promise');

async function checkDateFormat() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'zH754277289hUi~197547',
    database: 'enterprise_brain',
  });

  try {
    console.log('检查工序能力负荷表日期格式:\n');

    const [rows] = await connection.execute(`
      SELECT 
        process_name,
        date,
        DATE_FORMAT(date, '%Y-%m-%d') as formatted_date,
        remaining_hours
      FROM process_capacity_load
      WHERE process_name = '打包' AND date = '2026-01-06'
      LIMIT 1
    `);

    console.table(rows);

    if (rows.length > 0) {
      const row = rows[0];
      console.log('\n详细信息:');
      console.log('date字段值:', row.date);
      console.log('date字段类型:', typeof row.date);
      console.log('date instanceof Date:', row.date instanceof Date);

      if (row.date instanceof Date) {
        console.log('toISOString():', row.date.toISOString());
        console.log('split()[0]:', row.date.toISOString().split('T')[0]);
      }
    }
  } finally {
    await connection.end();
  }
}

checkDateFormat().catch(console.error);
