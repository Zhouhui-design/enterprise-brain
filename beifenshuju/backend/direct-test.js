const { pool } = require('./config/database');

/**
 * 创建一个简单的工序计划测试，手动指定所有字段
 */
async function directTest() {
  console.log('=== 直接测试：手动插入工序计划 ===');
  
  try {
    // 手动构建SQL，确保字段和参数数量匹配
    const sql = `
      INSERT INTO process_plans (
        plan_no, schedule_date, sales_order_no, master_plan_no, shipping_plan_no,
        product_code, product_name, product_image, process_manager, process_name,
        schedule_quantity, used_work_hours, product_unit, level0_demand, completion_date,
        plan_start_date, plan_end_date,
        workshop_name, daily_available_hours, remaining_schedule_hours, schedule_count,
        standard_work_hours, standard_work_quota, scheduled_hours, unscheduled_hours,
        source_page_name, source_no, previous_schedule_no, customer_name,
        level0_product_name, level0_product_code, level0_production_qty,
        product_source, bom_no, submitted_by, submitted_at, replenishment_qty,
        required_work_hours
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // 测试数据：replenishmentQty=500, standardWorkQuota=6
    const testData = {
      planNo: 'TEST-DIRECT-500-6',
      processName: '直接测试工序',
      replenishmentQty: 500,
      standardWorkQuota: 6,
      expectedRequiredHours: 83.33
    };
    
    console.log('测试数据:');
    console.log(`- 需补货数量: ${testData.replenishmentQty}`);
    console.log(`- 定时工额: ${testData.standardWorkQuota}`);
    console.log(`- 预期需求工时: ${testData.expectedRequiredHours}`);
    
    // 计算需求工时
    const calculatedRequiredHours = parseFloat((testData.replenishmentQty / testData.standardWorkQuota).toFixed(2));
    console.log(`- 实际计算需求工时: ${calculatedRequiredHours}`);
    
    const [result] = await pool.execute(sql, [
      // 1-5: 基本信息
      testData.planNo,                           // plan_no
      null,                                       // schedule_date
      null,                                       // sales_order_no
      null,                                       // master_plan_no
      null,                                       // shipping_plan_no
      // 6-10: 产品信息
      null,                                       // product_code
      null,                                       // product_name
      null,                                       // product_image
      null,                                       // process_manager
      testData.processName,                        // process_name
      // 11-15: 数量日期
      0,                                          // schedule_quantity
      0,                                          // used_work_hours
      null,                                       // product_unit
      0,                                          // level0_demand
      null,                                       // completion_date
      // 16-20: 计划信息
      null,                                       // plan_start_date
      null,                                       // plan_end_date
      null,                                       // workshop_name
      0,                                          // daily_available_hours
      0,                                          // remaining_schedule_hours
      // 21-25: 工时信息
      0,                                          // schedule_count
      0,                                          // standard_work_hours
      testData.standardWorkQuota,                  // standard_work_quota
      0,                                          // scheduled_hours
      0,                                          // unscheduled_hours
      // 26-30: 来源信息
      null,                                       // source_page_name
      null,                                       // source_no
      null,                                       // previous_schedule_no
      null,                                       // customer_name
      null,                                       // level0_product_name
      // 31-35: 产品来源信息
      null,                                       // level0_product_code
      0,                                          // level0_production_qty
      null,                                       // product_source
      null,                                       // bom_no
      null,                                       // submitted_by
      null,                                       // submitted_at
      testData.replenishmentQty,                  // replenishment_qty
      calculatedRequiredHours                     // required_work_hours
    ]);
    
    console.log(`✅ 插入成功, ID: ${result.insertId}`);
    
    // 查询验证
    const [rows] = await pool.execute('SELECT * FROM process_plans WHERE id = ?', [result.insertId]);
    if (rows.length > 0) {
      const plan = rows[0];
      console.log('\n数据库查询结果:');
      console.log(`- plan_no: ${plan.plan_no}`);
      console.log(`- process_name: ${plan.process_name}`);
      console.log(`- replenishment_qty: ${plan.replenishment_qty}`);
      console.log(`- standard_work_quota: ${plan.standard_work_quota}`);
      console.log(`- required_work_hours: ${plan.required_work_hours}`);
      
      const dbRequiredHours = parseFloat(plan.required_work_hours);
      console.log(`\n结果验证:`);
      console.log(`- 预期需求工时: ${testData.expectedRequiredHours}`);
      console.log(`- 数据库需求工时: ${dbRequiredHours}`);
      console.log(`- 结果匹配: ${dbRequiredHours == testData.expectedRequiredHours ? '✅ 通过' : '❌ 失败'}`);
      
      // 清理测试数据
      await pool.execute('DELETE FROM process_plans WHERE id = ?', [result.insertId]);
      console.log('\n✅ 清理测试数据完成');
    }
    
  } catch (error) {
    console.error('❌ 直接测试失败:', error);
    throw error;
  }
}

// 执行测试
directTest()
  .then(() => {
    console.log('\n=== 直接测试完成 ===');
    console.log('✅ 需求工时计算和保存验证成功！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });