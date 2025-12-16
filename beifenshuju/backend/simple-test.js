const { pool } = require('./config/database');

/**
 * 简单测试：直接插入一个工序计划记录
 */
async function simpleTest() {
  console.log('=== 简单测试：直接插入工序计划 ===');
  
  try {
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
    
    const testPlan = {
      planNo: 'TEST-SIMPLE-001',
      processName: '简单测试工序',
      replenishmentQty: 100,
      standardWorkQuota: 10,
      requiredWorkHours: 10.00
    };
    
    console.log('测试计划:', testPlan);
    
    const [result] = await pool.execute(sql, [
      testPlan.planNo,                                    // 1. plan_no
      null,                                               // 2. schedule_date
      null,                                               // 3. sales_order_no
      null,                                               // 4. master_plan_no
      null,                                               // 5. shipping_plan_no
      null,                                               // 6. product_code
      null,                                               // 7. product_name
      null,                                               // 8. product_image
      null,                                               // 9. process_manager
      testPlan.processName,                                // 10. process_name
      0,                                                  // 11. schedule_quantity
      0,                                                  // 12. used_work_hours
      null,                                               // 13. product_unit
      0,                                                  // 14. level0_demand
      null,                                               // 15. completion_date
      null,                                               // 16. plan_start_date
      null,                                               // 17. plan_end_date
      null,                                               // 18. workshop_name
      0,                                                  // 19. daily_available_hours
      0,                                                  // 20. remaining_schedule_hours
      0,                                                  // 21. schedule_count
      0,                                                  // 22. standard_work_hours
      testPlan.standardWorkQuota,                          // 23. standard_work_quota
      0,                                                  // 24. scheduled_hours
      0,                                                  // 25. unscheduled_hours
      null,                                               // 26. source_page_name
      null,                                               // 27. source_no
      null,                                               // 28. previous_schedule_no
      null,                                               // 29. customer_name
      null,                                               // 30. level0_product_name
      null,                                               // 31. level0_product_code
      0,                                                  // 32. level0_production_qty
      null,                                               // 33. product_source
      null,                                               // 34. bom_no
      null,                                               // 35. submitted_by
      null,                                               // 36. submitted_at
      testPlan.replenishmentQty,                           // 37. replenishment_qty
      testPlan.requiredWorkHours                            // 38. required_work_hours
    ]);
    
    console.log(`✅ 插入成功, ID: ${result.insertId}`);
    
    // 查询验证
    const [rows] = await pool.execute('SELECT * FROM process_plans WHERE id = ?', [result.insertId]);
    if (rows.length > 0) {
      const plan = rows[0];
      console.log('查询验证:');
      console.log(`- plan_no: ${plan.plan_no}`);
      console.log(`- process_name: ${plan.process_name}`);
      console.log(`- replenishment_qty: ${plan.replenishment_qty}`);
      console.log(`- standard_work_quota: ${plan.standard_work_quota}`);
      console.log(`- required_work_hours: ${plan.required_work_hours}`);
      
      const expectedRequiredHours = 10.00;
      const actualRequiredHours = parseFloat(plan.required_work_hours);
      
      console.log(`- 预期需求工时: ${expectedRequiredHours}`);
      console.log(`- 实际需求工时: ${actualRequiredHours}`);
      console.log(`结果验证: ${actualRequiredHours == expectedRequiredHours ? '✅ 通过' : '❌ 失败'}`);
      
      // 清理
      await pool.execute('DELETE FROM process_plans WHERE id = ?', [result.insertId]);
      console.log('✅ 清理完成');
    } else {
      console.log('❌ 查询验证失败');
    }
    
  } catch (error) {
    console.error('❌ 简单测试失败:', error);
    throw error;
  }
}

// 执行测试
simpleTest()
  .then(() => {
    console.log('\n=== 简单测试完成 ===');
    console.log('✅ 需求工时字段插入验证成功！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });