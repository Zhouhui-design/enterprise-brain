const mysql = require('mysql2/promise');

async function updateExistingPlans() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'zH754277289hUi~197547',
    database: 'enterprise_brain',
  });

  try {
    console.log('🔄 开始更新现有的真工序计划...\n');

    // 查询所有计划开始日期为null的记录
    const [plans] = await connection.execute(`
      SELECT 
        id,
        plan_no,
        process_name,
        required_work_hours,
        plan_end_date
      FROM real_process_plans
      WHERE plan_start_date IS NULL
        AND plan_end_date IS NOT NULL
        AND required_work_hours > 0
        AND process_name IS NOT NULL
    `);

    console.log(`📊 找到${plans.length}条需要更新的记录\n`);

    let updated = 0;
    let failed = 0;

    for (const plan of plans) {
      try {
        console.log(`处理: ${plan.plan_no} (工序: ${plan.process_name})`);

        const minRemainingHours = 0.5;
        const requiredWorkHours = parseFloat(plan.required_work_hours);
        const planEndDate =
          plan.plan_end_date instanceof Date
            ? plan.plan_end_date.toISOString().split('T')[0]
            : String(plan.plan_end_date).split('T')[0];

        // 查询符合条件的记录
        const [validRows] = await connection.execute(
          `
          SELECT date, remaining_hours
          FROM process_capacity_load
          WHERE process_name = ?
            AND date <= ?
            AND remaining_hours >= ?
          ORDER BY date DESC
        `,
          [plan.process_name, planEndDate, minRemainingHours],
        );

        if (validRows.length === 0) {
          console.log(`  ⚠️ 无符合条件的数据，跳过`);
          failed++;
          continue;
        }

        // 累加计算
        let accumulated = 0;
        let planStartDate = null;

        for (const row of validRows) {
          const dateStr =
            row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date).split('T')[0];
          const hours = parseFloat(row.remaining_hours) || 0;

          accumulated += hours;

          if (accumulated >= requiredWorkHours) {
            planStartDate = dateStr;
            break;
          }
        }

        if (planStartDate) {
          // 更新数据库
          await connection.execute(
            `
            UPDATE real_process_plans
            SET plan_start_date = ?
            WHERE id = ?
          `,
            [planStartDate, plan.id],
          );

          console.log(`  ✅ 已更新: 计划开始日期 = ${planStartDate}`);
          updated++;
        } else {
          console.log(`  ⚠️ 累计工时不足: ${accumulated.toFixed(2)} < ${requiredWorkHours}`);
          failed++;
        }
      } catch (error) {
        console.error(`  ❌ 更新失败: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 更新完成：`);
    console.log(`   ✅ 成功: ${updated}条`);
    console.log(`   ❌ 失败: ${failed}条`);
    console.log(`   📝 总计: ${plans.length}条`);
  } finally {
    await connection.end();
  }
}

updateExistingPlans().catch(console.error);
