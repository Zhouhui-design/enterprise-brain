const { pool } = require('./config/database');

/**
 * 使用完整的字段列表进行测试
 */
async function completeFieldTest() {
  console.log('=== 完整字段测试：验证需求工时计算 ===');
  
  try {
    // 构建包含所有字段的INSERT语句
    const sql = `
      INSERT INTO process_plans (
        id, plan_no, schedule_date, sales_order_no, master_plan_no, shipping_plan_no,
        product_code, product_name, product_image, process_manager, process_name,
        schedule_quantity, used_work_hours, product_unit, level0_demand, completion_date,
        plan_start_date, plan_end_date,
        workshop_name, daily_available_hours, remaining_schedule_hours, schedule_count,
        standard_work_hours, standard_work_quota, scheduled_hours, unscheduled_hours,
        source_page_name, source_no, previous_schedule_no, customer_name,
        level0_product_name, level0_product_code, level0_production_qty,
        product_source, bom_no, submitted_by, submitted_at, replenishment_qty,
        required_work_hours
      ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const testData = {
      planNo: 'TEST-COMPLETE-500-6',
      processName: '完整字段测试工序',
      replenishmentQty: 500,  // 需补货数量
      standardWorkQuota: 6,   // 定时工额
      expectedRequiredHours: 83.33 // 预期结果：500/6 ≈ 83.33
    };
    
    console.log('测试数据:');
    console.log(`- 需补货数量: ${testData.replenishmentQty}`);
    console.log(`- 定时工额: ${testData.standardWorkQuota}`);
    console.log(`- 预期需求工时: ${testData.expectedRequiredHours}`);
    
    // 计算需求工时
    const calculatedRequiredHours = parseFloat((testData.replenishmentQty / testData.standardWorkQuota).toFixed(2));
    console.log(`- 实际计算需求工时: ${calculatedRequiredHours}`);
    
    const [result] = await pool.execute(sql, [
      testData.planNo,                           // 1. plan_no
      null,                                       // 2. schedule_date
      null,                                       // 3. sales_order_no
      null,                                       // 4. master_plan_no
      null,                                       // 5. shipping_plan_no
      null,                                       // 6. product_code
      null,                                       // 7. product_name
      null,                                       // 8. product_image
      null,                                       // 9. process_manager
      testData.processName,                        // 10. process_name
      0,                                          // 11. schedule_quantity
      0,                                          // 12. used_work_hours
      null,                                       // 13. product_unit
      0,                                          // 14. level0_demand
      null,                                       // 15. completion_date
      null,                                       // 16. plan_start_date
      null,                                       // 17. plan_end_date
      null,                                       // 18. workshop_name
      0,                                          // 19. daily_available_hours
      0,                                          // 20. remaining_schedule_hours
      0,                                          // 21. schedule_count
      0,                                          // 22. standard_work_hours
      testData.standardWorkQuota,                  // 23. standard_work_quota
      0,                                          // 24. scheduled_hours
      0,                                          // 25. unscheduled_hours
      null,                                       // 26. source_page_name
      null,                                       // 27. source_no
      null,                                       // 28. previous_schedule_no
      null,                                       // 29. customer_name
      null,                                       // 30. level0_product_name
      null,                                       // 31. level0_product_code
      0,                                          // 32. level0_production_qty
      null,                                       // 33. product_source
      null,                                       // 34. bom_no
      null,                                       // 35. submitted_by
      new Date(),                                 // 36. submitted_at
      testData.replenishmentQty,                   // 37. replenishment_qty
      calculatedRequiredHours                      // 38. required_work_hours
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
      
      return dbRequiredHours == testData.expectedRequiredHours;
    }
    
    return false;
  } catch (error) {
    console.error('❌ 完整字段测试失败:', error);
    return false;
  }
}

// 执行测试
completeFieldTest()
  .then((success) => {
    console.log('\n=== 完整字段测试完成 ===');
    console.log(success ? '✅ 需求工时计算和保存验证成功！' : '❌ 需求工时计算和保存验证失败！');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });