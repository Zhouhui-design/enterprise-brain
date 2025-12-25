const mysql = require('mysql2/promise');

async function diagnose() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'zH754277289hUi~197547',
    database: 'enterprise_brain',
  });

  try {
    console.log('🔍 诊断计划开始日期问题\n');

    // 1. 查看最新的真工序计划
    console.log('📋 1. 最新的真工序计划记录：');
    const [plans] = await connection.execute(`
      SELECT 
        plan_no,
        process_name,
        completion_date,
        required_work_hours,
        plan_end_date,
        plan_start_date,
        created_at
      FROM real_process_plans
      ORDER BY created_at DESC
      LIMIT 3
    `);
    console.table(plans);

    if (plans.length === 0) {
      console.log('❌ 没有真工序计划记录');
      return;
    }

    const testPlan = plans[0];
    console.log(`\n📊 分析计划: ${testPlan.plan_no}`);
    console.log(`   工序名称: ${testPlan.process_name}`);
    console.log(`   需求工时: ${testPlan.required_work_hours}`);
    console.log(`   计划结束日期: ${testPlan.plan_end_date}`);
    console.log(`   计划开始日期: ${testPlan.plan_start_date} ${!testPlan.plan_start_date ? '❌ 未生成' : '✅'}`);

    // 2. 查看工序能力负荷表数据
    if (testPlan.process_name) {
      console.log(`\n📋 2. 工序"${testPlan.process_name}"的能力负荷数据：`);
      const [capacity] = await connection.execute(
        `
        SELECT 
          date,
          remaining_hours,
          occupied_hours,
          work_shift
        FROM process_capacity_load
        WHERE process_name = ?
          AND date BETWEEN '2025-12-01' AND '2026-01-31'
        ORDER BY date DESC
        LIMIT 10
      `,
        [testPlan.process_name],
      );
      console.table(capacity);

      // 3. 手动计算
      if (testPlan.required_work_hours > 0 && testPlan.plan_end_date) {
        console.log(`\n📋 3. 手动计算累加工时：`);
        const planEndDate =
          testPlan.plan_end_date instanceof Date
            ? testPlan.plan_end_date.toISOString().split('T')[0]
            : String(testPlan.plan_end_date).split('T')[0];

        const [validRows] = await connection.execute(
          `
          SELECT date, remaining_hours
          FROM process_capacity_load
          WHERE process_name = ?
            AND date <= ?
            AND remaining_hours >= 0.5
          ORDER BY date DESC
        `,
          [testPlan.process_name, planEndDate],
        );

        console.log(`符合条件的记录数: ${validRows.length}条`);

        let accumulated = 0;
        let startDate = null;

        for (const row of validRows) {
          const dateStr =
            row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date).split('T')[0];
          const hours = parseFloat(row.remaining_hours);

          accumulated += hours;
          console.log(`  ${dateStr}: 剩余${hours.toFixed(2)}h, 累计${accumulated.toFixed(2)}h`);

          if (accumulated >= testPlan.required_work_hours) {
            startDate = dateStr;
            console.log(`\n✅ 找到计划开始日期: ${startDate}`);
            console.log(`   累计工时: ${accumulated.toFixed(2)} >= 需求工时: ${testPlan.required_work_hours}`);
            break;
          }
        }

        if (!startDate) {
          console.log(`\n❌ 累计工时不足: ${accumulated.toFixed(2)} < ${testPlan.required_work_hours}`);
        }
      }
    }
  } finally {
    await connection.end();
  }
}

diagnose().catch(console.error);
