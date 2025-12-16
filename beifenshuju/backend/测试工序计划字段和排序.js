const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'zH754277289hUi~197547',
    database: 'enterprise_brain',
    waitForConnections: true,
    connectionLimit: 10
  });

  try {
    console.log('\n=== 测试工序计划字段和排序 ===\n');
    
    // 1. 查询所有工序计划（新排序规则）
    const [plans] = await pool.execute(`
      SELECT 
        plan_no,
        schedule_date,
        process_name,
        source_page_name,
        source_no,
        created_at,
        submitted_at
      FROM process_plans
      ORDER BY schedule_date ASC, created_at ASC
      LIMIT 5
    `);
    
    console.log(`查询到 ${plans.length} 条工序计划（按计划排程日期和提交时间升序）:\n`);
    
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. 工序计划编号: ${plan.plan_no}`);
      console.log(`   计划排程日期: ${plan.schedule_date || '未设置'}`);
      console.log(`   工序名称: ${plan.process_name || '-'}`);
      console.log(`   ✅ 来源表单: ${plan.source_page_name || '未设置'}`);
      console.log(`   ✅ 来源编号: ${plan.source_no || '未设置'}`);
      console.log(`   创建时间: ${plan.created_at}`);
      console.log(`   提交时间: ${plan.submitted_at || '未设置'}`);
      console.log('');
    });
    
    // 2. 统计有来源信息的工序计划
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN source_page_name IS NOT NULL THEN 1 ELSE 0 END) as with_source
      FROM process_plans
    `);
    
    console.log('\n=== 统计信息 ===');
    console.log(`总工序计划数: ${stats[0].total}`);
    console.log(`有来源信息的: ${stats[0].with_source}`);
    console.log(`无来源信息的: ${stats[0].total - stats[0].with_source}`);
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await pool.end();
  }
}

test();
