const { pool } = require('./config/database');

/**
 * 修复后的创建工序计划服务函数
 */
async function fixedCreate(data) {
  console.log('=== 使用修复后的创建函数 ===');

  try {
    // ✅ 计算需求工时：需补货数量 / 定时工额，保留2位小数
    let requiredWorkHours = 0;
    if (
      data.replenishmentQty &&
      data.standardWorkQuota &&
      parseFloat(data.replenishmentQty) > 0 &&
      parseFloat(data.standardWorkQuota) > 0
    ) {
      requiredWorkHours = parseFloat(
        (parseFloat(data.replenishmentQty) / parseFloat(data.standardWorkQuota)).toFixed(2),
      );
      console.log(`✅ 计算需求工时: ${data.replenishmentQty} / ${data.standardWorkQuota} = ${requiredWorkHours}`);
    }

    // 直接指定字段列表，确保顺序正确
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.planNo, // 1. plan_no
      data.scheduleDate || null, // 2. schedule_date
      data.salesOrderNo || null, // 3. sales_order_no
      data.masterPlanNo || null, // 4. master_plan_no
      data.shippingPlanNo || null, // 5. shipping_plan_no
      data.productCode || null, // 6. product_code
      data.productName || null, // 7. product_name
      data.productImage || null, // 8. product_image
      data.processManager || null, // 9. process_manager
      data.processName || null, // 10. process_name
      data.scheduleQuantity || 0, // 11. schedule_quantity
      data.usedWorkHours || 0, // 12. used_work_hours
      data.productUnit || null, // 13. product_unit
      data.level0Demand || 0, // 14. level0_demand
      data.completionDate || null, // 15. completion_date
      data.planStartDate || null, // 16. plan_start_date
      data.planEndDate || null, // 17. plan_end_date
      data.workshopName || null, // 18. workshop_name
      data.dailyAvailableHours || 0, // 19. daily_available_hours
      data.remainingScheduleHours || 0, // 20. remaining_schedule_hours
      data.scheduleCount || 0, // 21. schedule_count
      data.standardWorkHours || 0, // 22. standard_work_hours
      data.standardWorkQuota || 0, // 23. standard_work_quota
      data.scheduledHours || 0, // 24. scheduled_hours
      data.unscheduledHours || 0, // 25. unscheduled_hours
      data.sourcePageName || null, // 26. source_page_name
      data.sourceNo || null, // 27. source_no
      data.previousScheduleNo || null, // 28. previous_schedule_no
      data.customerName || null, // 29. customer_name
      data.level0ProductName || null, // 30. level0_product_name
      data.level0ProductCode || null, // 31. level0_product_code
      data.level0ProductionQty || 0, // 32. level0_production_qty
      data.productSource || null, // 33. product_source
      data.bomNo || null, // 34. bom_no
      data.submittedBy || null, // 35. submitted_by
      data.submittedAt || null, // 36. submitted_at
      data.replenishmentQty || 0, // 37. replenishment_qty
      requiredWorkHours, // 38. required_work_hours
    ];

    console.log(`字段数量: ${params.length}`);

    const [result] = await pool.execute(sql, params);

    console.log(`✅ 修复后创建成功, ID: ${result.insertId}, 编号: ${data.planNo}, 需求工时: ${requiredWorkHours}`);
    return { id: result.insertId };
  } catch (error) {
    console.error('❌ 修复后创建工序计划失败:', error);
    throw error;
  }
}

/**
 * 测试修复后的创建函数
 */
async function testFixedCreate() {
  console.log('=== 测试修复后的创建函数 ===');

  try {
    const testData = {
      planNo: 'TEST-FIXED-CREATE-500-6',
      processName: '修复后测试工序',
      replenishmentQty: 500, // 需补货数量
      standardWorkQuota: 6, // 定时工额
      expectedRequiredHours: 83.33, // 预期结果：500/6 ≈ 83.33
    };

    console.log('测试数据:');
    console.log(`- 需补货数量: ${testData.replenishmentQty}`);
    console.log(`- 定时工额: ${testData.standardWorkQuota}`);
    console.log(`- 预期需求工时: ${testData.expectedRequiredHours}`);

    // 使用修复后的创建函数
    const result = await fixedCreate(testData);

    // 查询验证
    const [rows] = await pool.execute('SELECT * FROM process_plans WHERE id = ?', [result.id]);
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
      await pool.execute('DELETE FROM process_plans WHERE id = ?', [result.id]);
      console.log('\n✅ 清理测试数据完成');

      return dbRequiredHours == testData.expectedRequiredHours;
    }

    return false;
  } catch (error) {
    console.error('❌ 测试修复后创建函数失败:', error);
    return false;
  }
}

// 执行测试
testFixedCreate()
  .then(success => {
    console.log('\n=== 修复后创建函数测试完成 ===');
    console.log(success ? '✅ 需求工时计算和保存验证成功！' : '❌ 需求工时计算和保存验证失败！');

    if (success) {
      // 更新原始的 ProcessPlanService
      console.log('\n现在更新原始的 ProcessPlanService...');

      const fs = require('fs');
      const path = require('path');

      // 读取原始文件
      const originalFile = path.join(__dirname, 'services/processPlanService.js');
      let content = fs.readFileSync(originalFile, 'utf8');

      // 替换创建函数
      const fixedCreateFunction = `
  /**
   * 创建工序计划
   */
  static async create(data) {
    try {
      // ✅ 计算需求工时：需补货数量 / 定时工额，保留2位小数
      let requiredWorkHours = 0;
      if (data.replenishmentQty && data.standardWorkQuota && 
          parseFloat(data.replenishmentQty) > 0 && parseFloat(data.standardWorkQuota) > 0) {
        requiredWorkHours = parseFloat((parseFloat(data.replenishmentQty) / parseFloat(data.standardWorkQuota)).toFixed(2));
        console.log(\`✅ 计算需求工时: \${data.replenishmentQty} / \${data.standardWorkQuota} = \${requiredWorkHours}\`);
      }
      
      const sql = \`
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      \`;
      
      const [result] = await pool.execute(sql, [
        data.planNo,
        data.scheduleDate || null,
        data.salesOrderNo || null,
        data.masterPlanNo || null,
        data.shippingPlanNo || null,
        data.productCode || null,
        data.productName || null,
        data.productImage || null,
        data.processManager || null,
        data.processName || null,
        data.scheduleQuantity || 0,
        data.usedWorkHours || 0,
        data.productUnit || null,
        data.level0Demand || 0,
        data.completionDate || null,
        data.planStartDate || null,
        data.planEndDate || null,
        data.workshopName || null,
        data.dailyAvailableHours || 0,
        data.remainingScheduleHours || 0,
        data.scheduleCount || 0,
        data.standardWorkHours || 0,
        data.standardWorkQuota || 0,
        data.scheduledHours || 0,
        data.unscheduledHours || 0,
        data.sourcePageName || null,
        data.sourceNo || null,
        data.previousScheduleNo || null,
        data.customerName || null,
        data.level0ProductName || null,
        data.level0ProductCode || null,
        data.level0ProductionQty || 0,
        data.productSource || null,
        data.bomNo || null,
        data.submittedBy || null,
        data.submittedAt || null,
        data.replenishmentQty || 0,
        requiredWorkHours
      ]);
      
      console.log(\`工序计划创建成功, ID: \${result.insertId}, 编号: \${data.planNo}, 需求工时: \${requiredWorkHours}\`);
      return { id: result.insertId };
    } catch (error) {
      console.error('创建工序计划失败:', error);
      throw error;
    }
  }`;

      // 更新文件内容
      content = content.replace(/ {2}static async create\(data\) \{[\s\S]*?\n {2}\}/, fixedCreateFunction);

      // 写回文件
      fs.writeFileSync(originalFile, content, 'utf8');
      console.log('✅ ProcessPlanService.js 已更新');
    }

    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
