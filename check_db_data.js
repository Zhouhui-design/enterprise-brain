const mysql = require('mysql2/promise');

async function checkCapacityLoadData() {
  let connection;
  try {
    // 连接数据库
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'zH754277289hUi~197547',
      database: 'enterprise_brain'
    });
    
    console.log('=== 检查工序能力负落数据 ===');
    
    // 查询"组装"工序在2026-01-01到2026-01-10期间的数据
    const sql = `
      SELECT 
        id,
        process_name,
        DATE_FORMAT(date, '%Y-%m-%d') as formatted_date,
        date,
        remaining_hours,
        available_workstations,
        work_shift,
        occupied_hours,
        remaining_shift
      FROM process_capacity_load 
      WHERE process_name = '组装' 
        AND date >= '2026-01-01' 
        AND date <= '2026-01-10'
      ORDER BY date ASC
    `;
    
    console.log('执行SQL:', sql);
    const [rows] = await connection.execute(sql);
    
    console.log(`\n找到 ${rows.length} 条记录:`);
    rows.forEach((row, index) => {
      const remainingHours = parseFloat(row.remaining_hours || 0);
      const condition = remainingHours > 0.5 ? '✅符合>0.5' : '❌不符合≤0.5';
      console.log(`${index + 1}. 日期: ${row.formatted_date}, 剩余工时: ${remainingHours} ${condition}`);
    });
    
    // 专门查询2026-01-03和2026-01-04的数据
    console.log('\n=== 重点检查问题日期 ===');
    const specificSql = `
      SELECT 
        process_name,
        DATE_FORMAT(date, '%Y-%m-%d') as formatted_date,
        remaining_hours,
        available_workstations,
        work_shift
      FROM process_capacity_load 
      WHERE process_name = '组装' 
        AND date IN ('2026-01-03', '2026-01-04')
      ORDER BY date ASC
    `;
    
    console.log('执行特定查询SQL:', specificSql);
    const [specificRows] = await connection.execute(specificSql);
    
    specificRows.forEach(row => {
      const remainingHours = parseFloat(row.remaining_hours || 0);
      console.log(`日期: ${row.formatted_date}, 剩余工时: ${remainingHours}, 可用工位: ${row.available_workstations}, 上班时段: ${row.work_shift}`);
    });
    
    // 模拟查询下一个排程日期的SQL
    console.log('\n=== 模拟查询下一个排程日期的SQL ===');
    const simulateSql = `
      SELECT 
        DATE_FORMAT(date, '%Y-%m-%d') as formatted_date,
        remaining_hours 
      FROM process_capacity_load 
      WHERE process_name = '组装' 
        AND date > '2026-01-02' 
        AND remaining_hours > 0.5 
      ORDER BY date ASC 
      LIMIT 1
    `;
    
    console.log('执行模拟SQL:', simulateSql);
    const [simulateRows] = await connection.execute(simulateSql);
    
    if (simulateRows.length > 0) {
      console.log(`找到下一个排程日期: ${simulateRows[0].formatted_date}, 剩余工时: ${simulateRows[0].remaining_hours}`);
    } else {
      console.log('未找到符合条件的日期');
    }
    
  } catch (error) {
    console.error('查询数据库失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkCapacityLoadData();