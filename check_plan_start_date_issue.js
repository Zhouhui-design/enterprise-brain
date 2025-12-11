const mysql = require('mysql2/promise');

async function diagnosePlanStartDateIssue() {
  console.log('🔍 开始诊断计划开始日期问题...\n');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'erp_db'
  });
  
  try {
    // 检查1：查看最近的真工序计划记录
    console.log('📋 检查1：查看最近的真工序计划记录');
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
      LIMIT 5
    `);
    console.table(plans);
    
    if (plans.length === 0) {
      console.log('⚠️ 没有真工序计划记录');
      return;
    }
    
    // 检查2：查看工序能力负荷表数据
    const testProcess = plans[0].process_name;
    console.log(`\n📋 检查2：工序"${testProcess}"的能力负荷数据`);
    const [capacity] = await connection.execute(`
      SELECT 
        process_name,
        date,
        remaining_hours,
        occupied_hours,
        work_shift,
        available_workstations
      FROM process_capacity_load
      WHERE process_name = ?
        AND date BETWEEN '2025-12-01' AND '2026-01-31'
      ORDER BY date DESC
      LIMIT 20
    `, [testProcess]);
    console.table(capacity);
    
    // 检查3：手动计算累加工时
    const requiredHours = parseFloat(plans[0].required_work_hours || 0);
    const planEndDate = plans[0].plan_end_date;
    
    console.log(`\n📋 检查3：手动计算累加工时`);
    console.log(`需求工时: ${requiredHours}`);
    console.log(`计划结束日期: ${planEndDate}`);
    
    if (requiredHours > 0 && planEndDate) {
      const [validRows] = await connection.execute(`
        SELECT date, remaining_hours
        FROM process_capacity_load
        WHERE process_name = ?
          AND date <= ?
          AND remaining_hours >= 0.5
        ORDER BY date DESC
      `, [testProcess, planEndDate]);
      
      console.log(`\n符合条件的记录（剩余工时>=0.5）：${validRows.length}条`);
      
      let accumulated = 0;
      let startDate = null;
      
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        const dateStr = row.date instanceof Date 
          ? row.date.toISOString().split('T')[0]
          : String(row.date).split('T')[0];
        const hours = parseFloat(row.remaining_hours);
        
        accumulated += hours;
        console.log(`  日期: ${dateStr}, 剩余工时: ${hours.toFixed(2)}, 累计: ${accumulated.toFixed(2)}`);
        
        if (accumulated >= requiredHours) {
          startDate = dateStr;
          console.log(`\n✅ 找到计划开始日期: ${startDate}`);
          console.log(`   累计工时: ${accumulated.toFixed(2)} >= ${requiredHours}`);
          break;
        }
      }
      
      if (!startDate) {
        console.log(`\n❌ 累计工时不足: ${accumulated.toFixed(2)} < ${requiredHours}`);
        console.log('💡 建议：增加工位数量或扩大日期范围');
      } else if (startDate !== plans[0].plan_start_date) {
        console.log(`\n⚠️ 计算结果与数据库不一致:`);
        console.log(`   计算结果: ${startDate}`);
        console.log(`   数据库值: ${plans[0].plan_start_date}`);
      }
    }
    
    // 检查4：检查业务变量配置
    console.log('\n📋 检查4：业务变量配置');
    const [settings] = await connection.execute(`
      SELECT setting_key, setting_value
      FROM page_settings
      WHERE page_key = 'real-process-plan'
    `);
    console.table(settings);
    
  } finally {
    await connection.end();
  }
  
  console.log('\n🎉 诊断完成！');
}

diagnosePlanStartDateIssue().catch(console.error);
