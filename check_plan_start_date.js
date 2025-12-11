const mysql = require('mysql2/promise');

async function checkPlanStartDate() {
  const pool = mysql.createPool({
    host: '192.168.2.229',
    user: 'root',
    password: 'ZHzy2024@8301#',
    database: 'zhzy_erp',
    waitForConnections: true,
    connectionLimit: 10
  });

  try {
    console.log('🔍 检查工序计划的计划开始日期数据...\n');

    // 查询最新的几条工序计划记录
    const [rows] = await pool.execute(`
      SELECT 
        plan_no,
        process_name,
        completion_date,
        plan_start_date,
        plan_end_date,
        required_work_hours,
        schedule_date,
        real_plan_start_date
      FROM process_plans 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log(`📊 最新的5条工序计划记录:\n`);
    rows.forEach((row, index) => {
      console.log(`[${index + 1}] 工序计划编号: ${row.plan_no}`);
      console.log(`    工序名称: ${row.process_name}`);
      console.log(`    计划完工日期: ${row.completion_date ? row.completion_date.toISOString().split('T')[0] : 'null'}`);
      console.log(`    需求工时: ${row.required_work_hours}`);
      console.log(`    计划结束日期: ${row.plan_end_date ? row.plan_end_date.toISOString().split('T')[0] : 'null'}`);
      console.log(`    计划开始日期: ${row.plan_start_date ? row.plan_start_date.toISOString().split('T')[0] : 'null'} ⬅️ 检查这个字段`);
      console.log(`    真计划开始日期: ${row.real_plan_start_date ? row.real_plan_start_date.toISOString().split('T')[0] : 'null'}`);
      console.log(`    计划排程日期: ${row.schedule_date ? row.schedule_date.toISOString().split('T')[0] : 'null'}`);
      console.log('');
    });

    // 检查工序能力负荷表数据
    console.log('\n🔍 检查工序能力负荷表中的剩余工时数据...\n');
    
    const testProcessName = rows[0]?.process_name;
    const testCompletionDate = rows[0]?.completion_date?.toISOString().split('T')[0];
    
    if (testProcessName && testCompletionDate) {
      console.log(`测试工序: ${testProcessName}`);
      console.log(`测试完工日期: ${testCompletionDate}\n`);

      const currentDate = new Date().toISOString().split('T')[0];
      const startDate = testCompletionDate < currentDate ? testCompletionDate : currentDate;
      const endDate = testCompletionDate > currentDate ? testCompletionDate : currentDate;

      const [capacityRows] = await pool.execute(`
        SELECT date, remaining_hours 
        FROM process_capacity_load 
        WHERE process_name = ? 
          AND date BETWEEN ? AND ? 
          AND date <= ?
          AND remaining_hours >= 0.5
        ORDER BY date DESC
        LIMIT 10
      `, [testProcessName, startDate, endDate, testCompletionDate]);

      console.log(`📊 找到${capacityRows.length}条符合条件的工序能力负荷记录:`);
      capacityRows.forEach((row, index) => {
        console.log(`  [${index + 1}] 日期: ${row.date.toISOString().split('T')[0]}, 剩余工时: ${row.remaining_hours}`);
      });

      if (capacityRows.length === 0) {
        console.log('\n⚠️ 未找到符合条件的记录!');
        console.log('可能原因:');
        console.log('1. 工序能力负荷表中该工序没有数据');
        console.log('2. 所有记录的剩余工时都 < 0.5');
        console.log('3. 日期范围不匹配');
      }
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await pool.end();
  }
}

checkPlanStartDate();
