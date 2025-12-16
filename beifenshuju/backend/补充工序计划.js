/**
 * 为现有备料计划补充工序计划
 * 只处理还没有工序计划的备料计划
 */

const { pool } = require('./config/database');

async function fillProcessPlans() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    console.log('=== 开始补充工序计划 ===\n');
    
    // 1. 查询所有备料计划
    const [materialPlans] = await connection.execute(`
      SELECT * FROM material_preparation_plans
      WHERE plan_no IS NOT NULL
    `);
    
    console.log(`找到 ${materialPlans.length} 条备料计划`);
    
    let created = 0;
    let skipped = 0;
    
    for (const plan of materialPlans) {
      // 检查是否已有工序计划
      const [existingProcess] = await connection.execute(`
        SELECT COUNT(*) as count FROM process_plans
        WHERE master_plan_no = ? AND product_code = ?
      `, [plan.source_plan_no, plan.material_code]);
      
      if (existingProcess[0].count > 0) {
        console.log(`跳过: ${plan.plan_no} (已有工序计划)`);
        skipped++;
        continue;
      }
      
      // 生成工序计划编号
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const processPlanNo = `PP${year}${timestamp}${random}`;
      
      // 计算计划完工日期 = 需求日期 - 1天
      let completionDate = null;
      if (plan.demand_date) {
        const demandDate = new Date(plan.demand_date);
        demandDate.setDate(demandDate.getDate() - 1);
        const year = demandDate.getFullYear();
        const month = String(demandDate.getMonth() + 1).padStart(2, '0');
        const day = String(demandDate.getDate()).padStart(2, '0');
        completionDate = `${year}-${month}-${day}`;
      }
      
      // 创建工序计划
      await connection.execute(`
        INSERT INTO process_plans (
          plan_no,
          sales_order_no,
          master_plan_no,
          product_code,
          product_name,
          process_name,
          product_unit,
          level0_demand,
          completion_date,
          submitted_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
      `, [
        processPlanNo,
        plan.sales_order_no,
        plan.source_plan_no,
        plan.material_code,
        plan.material_name,
        plan.source_process,
        plan.material_unit,
        plan.main_plan_quantity,
        completionDate
      ]);
      
      console.log(`✅ 创建: ${plan.plan_no} -> ${processPlanNo}`);
      created++;
      
      // 避免编号冲突，稍微延迟
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    await connection.commit();
    
    console.log(`\n=== 补充完成 ===`);
    console.log(`创建: ${created} 条`);
    console.log(`跳过: ${skipped} 条`);
    
    process.exit(0);
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ 补充失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

fillProcessPlans();
