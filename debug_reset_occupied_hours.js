const mysql = require('mysql2/promise');

async function debugResetOccupiedHours() {
  let connection;
  try {
    // 连接数据库
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'zH754277289hUi~197547',
      database: 'enterprise_brain'
    });

    console.log('=== 调试重置占用工时功能 ===');

    // 1. 检查工序能力负荷表的数据
    console.log('\n1. 检查工序能力负荷表的数据:');
    const [capacityRecords] = await connection.execute(
      `SELECT process_name, date, occupied_hours, remaining_hours, work_shift
       FROM process_capacity_load 
       WHERE process_name = '打包' 
         AND date BETWEEN '2025-12-31' AND '2026-01-06'
       ORDER BY date`
    );
    
    console.log('打包工序 2025-12-31～2026-01-06 的数据:');
    capacityRecords.forEach((row, index) => {
      console.log(`  ${index + 1}. 日期: ${row.date}, 已占用工时: ${row.occupied_hours}, 剩余工时: ${row.remaining_hours}, 工作时段: ${row.work_shift}`);
    });

    // 2. 检查工序计划表中对应的数据
    console.log('\n2. 检查工序计划表中对应的数据:');
    const [planRecords] = await connection.execute(
      `SELECT process_name, schedule_date, used_work_hours 
       FROM process_plans 
       WHERE process_name = '打包' 
         AND schedule_date BETWEEN '2025-12-31' AND '2026-01-06'
       ORDER BY schedule_date`
    );
    
    console.log('打包工序计划数据:');
    if (planRecords.length === 0) {
      console.log('  ✅ 无数据（符合预期，工序计划已删除）');
    } else {
      planRecords.forEach((row, index) => {
        console.log(`  ${index + 1}. 日期: ${row.schedule_date}, 使用工时: ${row.used_work_hours}`);
      });
    }

    // 3. 手动执行SUMIF查询
    console.log('\n3. 手动执行SUMIF查询:');
    for (const capacityRecord of capacityRecords) {
      // 格式化日期
      const formattedDate = capacityRecord.date instanceof Date 
        ? capacityRecord.date.toISOString().split('T')[0]
        : String(capacityRecord.date).split('T')[0];
      
      const [sumRows] = await connection.execute(
        `SELECT COALESCE(SUM(used_work_hours), 0) as total_hours 
         FROM process_plans 
         WHERE process_name = ? 
           AND schedule_date = ?`,
        [capacityRecord.process_name, formattedDate]
      );
      
      const sumResult = sumRows[0].total_hours;
      const validResult = sumResult !== null && sumResult !== undefined ? parseFloat(sumResult) : 0;
      const newOccupiedHours = parseFloat(validResult.toFixed(2));
      
      console.log(`  日期: ${formattedDate}, SUMIF结果: ${sumResult}, 新占用工时: ${newOccupiedHours}`);
      
      // 检查是否需要更新
      if (parseFloat(capacityRecord.occupied_hours || 0) !== newOccupiedHours) {
        console.log(`    ⚠️ 需要更新: ${capacityRecord.occupied_hours} → ${newOccupiedHours}`);
      } else {
        console.log(`    ✅ 无需更新: ${capacityRecord.occupied_hours} = ${newOccupiedHours}`);
      }
    }

    // 4. 检查是否有其他工序的数据
    console.log('\n4. 检查其他工序的数据:');
    const [otherProcesses] = await connection.execute(
      `SELECT DISTINCT process_name, COUNT(*) as record_count,
              SUM(CASE WHEN occupied_hours > 0 THEN 1 ELSE 0 END) as occupied_count
       FROM process_capacity_load 
       GROUP BY process_name
       ORDER BY process_name`
    );
    
    console.log('各工序统计:');
    otherProcesses.forEach((row) => {
      console.log(`  ${row.process_name}: ${row.record_count}条记录, ${row.occupied_count}条有占用`);
    });

  } catch (error) {
    console.error('调试失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugResetOccupiedHours();