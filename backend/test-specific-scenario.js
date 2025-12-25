const ProcessPlanService = require('./services/processPlanService');

/**
 * 测试特定场景：replenishmentQty=500, standardWorkQuota=6
 * 预期结果：requiredWorkHours=83.33
 */
async function testSpecificScenario() {
  console.log('=== 测试特定场景：replenishmentQty=500, standardWorkQuota=6 ===');

  try {
    // 创建测试数据
    const testData = {
      planNo: 'TEST-REQ-500-6',
      processName: '测试工序500/6',
      replenishmentQty: 500, // 需补货数量
      standardWorkQuota: 6, // 定时工额
      expectedRequiredHours: 83.33, // 预期结果：500/6 ≈ 83.33
    };

    console.log('测试数据:');
    console.log(`- 需补货数量: ${testData.replenishmentQty}`);
    console.log(`- 定时工额: ${testData.standardWorkQuota}`);
    console.log(`- 预期需求工时: ${testData.expectedRequiredHours}`);

    // 1. 前端计算逻辑验证
    console.log('\n=== 验证前端计算逻辑 ===');
    if (testData.replenishmentQty > 0 && testData.standardWorkQuota > 0) {
      const calculated = testData.replenishmentQty / testData.standardWorkQuota;
      const frontendResult = parseFloat(calculated.toFixed(2));
      console.log(`前端计算: ${testData.replenishmentQty} / ${testData.standardWorkQuota} = ${calculated}`);
      console.log(`保留2位小数: ${frontendResult}`);
      console.log(`前端结果验证: ${frontendResult == testData.expectedRequiredHours ? '✅ 正确' : '❌ 错误'}`);
    }

    // 2. 后端计算逻辑验证
    console.log('\n=== 验证后端计算逻辑 ===');
    const ProcessPlanService = require('./services/processPlanService');

    // 创建工序计划
    const result = await ProcessPlanService.create(testData);
    console.log(`✅ 创建成功, ID: ${result.id}`);

    // 查询验证
    const createdPlan = await ProcessPlanService.getById(result.id);
    console.log('查询结果:');
    console.log(`- replenishment_qty: ${createdPlan.replenishmentQty}`);
    console.log(`- standard_work_quota: ${createdPlan.standardWorkQuota}`);
    console.log(`- required_work_hours: ${createdPlan.requiredWorkHours}`);

    const backendResult = parseFloat(createdPlan.requiredWorkHours);
    console.log(`后端结果验证: ${backendResult == testData.expectedRequiredHours ? '✅ 正确' : '❌ 错误'}`);

    // 3. 数据库直接查询验证
    console.log('\n=== 数据库直接查询验证 ===');
    const { pool } = require('./config/database');
    const [rows] = await pool.execute(
      'SELECT replenishment_qty, standard_work_quota, required_work_hours FROM process_plans WHERE id = ?',
      [result.id],
    );

    if (rows.length > 0) {
      const dbRow = rows[0];
      console.log('数据库字段:');
      console.log(`- replenishment_qty: ${dbRow.replenishment_qty}`);
      console.log(`- standard_work_quota: ${dbRow.standard_work_quota}`);
      console.log(`- required_work_hours: ${dbRow.required_work_hours}`);

      const dbResult = parseFloat(dbRow.required_work_hours);
      console.log(`数据库结果验证: ${dbResult == testData.expectedRequiredHours ? '✅ 正确' : '❌ 错误'}`);
    }

    // 清理测试数据
    await ProcessPlanService.delete(result.id);
    console.log('\n✅ 清理测试数据完成');
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  }
}

// 执行测试
testSpecificScenario()
  .then(() => {
    console.log('\n=== 特定场景测试完成 ===');
    console.log('✅ 需求工时计算逻辑测试完成！');
    process.exit(0);
  })
  .catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
