const { pool } = require('./config/database');

async function checkData() {
  try {
    const [rows] = await pool.execute(`
      SELECT id, plan_no, product_code, schedule_quantity, scheduled_work_hours, 
             daily_total_hours, daily_scheduled_hours, daily_available_hours, 
             standard_work_quota, required_work_hours
      FROM packing_process_plans 
      ORDER BY id DESC 
      LIMIT 3
    `);
    
    console.log('\n打包工序计划数据:');
    rows.forEach(row => {
      console.log('\n---------------------------');
      console.log(`ID: ${row.id}`);
      console.log(`编号: ${row.plan_no}`);
      console.log(`产品: ${row.product_code}`);
      console.log(`排程数量: ${row.schedule_quantity}`);
      console.log(`排程工时: ${row.scheduled_work_hours}`);
      console.log(`当天总工时: ${row.daily_total_hours}`);
      console.log(`当天已排程工时: ${row.daily_scheduled_hours}`);
      console.log(`当天可用工时: ${row.daily_available_hours}`);
      console.log(`定时工额: ${row.standard_work_quota}`);
      console.log(`需求工时: ${row.required_work_hours}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
