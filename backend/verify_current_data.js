const mysql = require('mysql2/promise');

async function verify() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'zH754277289hUi~197547',
    database: 'enterprise_brain',
  });

  try {
    console.log('🔍 验证当前数据状态\n');

    // 查看最新的真工序计划
    const [plans] = await connection.execute(`
      SELECT 
        plan_no,
        process_name,
        required_work_hours,
        plan_end_date,
        plan_start_date,
        created_at
      FROM real_process_plans
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('📋 最新的5条真工序计划：');
    console.table(plans);

    const nullStartDateCount = plans.filter(p => !p.plan_start_date).length;
    const hasStartDateCount = plans.filter(p => p.plan_start_date).length;

    console.log(`\n📊 统计：`);
    console.log(`   ✅ 有计划开始日期: ${hasStartDateCount}条`);
    console.log(`   ❌ 无计划开始日期: ${nullStartDateCount}条`);

    if (nullStartDateCount > 0) {
      console.log(`\n💡 提示：修复已部署，但现有数据未更新`);
      console.log(`   解决方案：重新执行排程或创建新的备料计划来测试`);
    }
  } finally {
    await connection.end();
  }
}

verify().catch(console.error);
