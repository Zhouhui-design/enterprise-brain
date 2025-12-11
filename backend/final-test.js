const ProcessPlanService = require('./services/processPlanService');

/**
 * 最终测试：验证修复后的需求工时计算功能
 */
async function finalTest() {
  console.log('=== 最终测试：验证修复后的需求工时计算功能 ===');
  
  try {
    // 测试数据：replenishmentQty=500, standardWorkQuota=6
    const testData = {
      planNo: 'TEST-FINAL-500-6',
      processName: '最终测试工序',
      replenishmentQty: 500,  // 需补货数量
      standardWorkQuota: 6,   // 定时工额
      expectedRequiredHours: 83.33 // 预期结果：500/6 ≈ 83.33
    };
    
    console.log('测试数据:');
    console.log(`- 需补货数量: ${testData.replenishmentQty}`);
    console.log(`- 定时工额: ${testData.standardWorkQuota}`);
    console.log(`- 预期需求工时: ${testData.expectedRequiredHours}`);
    
    // 创建工序计划
    console.log('\n=== 创建工序计划 ===');
    const result = await ProcessPlanService.create(testData);
    console.log(`✅ 创建成功, ID: ${result.id}`);
    
    // 查询验证
    console.log('\n=== 查询验证 ===');
    const createdPlan = await ProcessPlanService.getById(result.id);
    
    console.log('数据库查询结果:');
    console.log(`- plan_no: ${createdPlan.planNo}`);
    console.log(`- process_name: ${createdPlan.processName}`);
    console.log(`- replenishment_qty: ${createdPlan.replenishmentQty}`);
    console.log(`- standard_work_quota: ${createdPlan.standardWorkQuota}`);
    console.log(`- required_work_hours: ${createdPlan.requiredWorkHours}`);
    
    const dbRequiredHours = parseFloat(createdPlan.requiredWorkHours);
    console.log(`\n结果验证:`);
    console.log(`- 预期需求工时: ${testData.expectedRequiredHours}`);
    console.log(`- 数据库需求工时: ${dbRequiredHours}`);
    console.log(`- 结果匹配: ${dbRequiredHours == testData.expectedRequiredHours ? '✅ 通过' : '❌ 失败'}`);
    
    // 测试场景2：更新功能
    console.log('\n=== 测试更新功能 ===');
    const updateData = {
      replenishmentQty: 120,  // 更新需补货数量
      standardWorkQuota: 8   // 更新定时工额
    };
    
    const expectedUpdateHours = 15.00; // 预期结果：120/8 = 15
    console.log(`更新数据: 需补货数量=${updateData.replenishmentQty}, 定时工额=${updateData.standardWorkQuota}`);
    console.log(`预期结果: ${expectedUpdateHours}`);
    
    await ProcessPlanService.update(result.id, updateData);
    const updatedPlan = await ProcessPlanService.getById(result.id);
    
    const updatedRequiredHours = parseFloat(updatedPlan.requiredWorkHours);
    console.log(`更新后实际结果: requiredWorkHours=${updatedRequiredHours}`);
    console.log(`更新结果验证: ${updatedRequiredHours == expectedUpdateHours ? '✅ 通过' : '❌ 失败'}`);
    
    // 清理测试数据
    console.log('\n=== 清理测试数据 ===');
    await ProcessPlanService.delete(result.id);
    console.log('✅ 测试数据清理完成');
    
    console.log('\n=== 最终测试完成 ===');
    const allTestsPassed = (
      dbRequiredHours == testData.expectedRequiredHours && 
      updatedRequiredHours == expectedUpdateHours
    );
    
    console.log(allTestsPassed ? '✅ 所有测试通过！需求工时计算功能已修复！' : '❌ 部分测试失败');
    
    return allTestsPassed;
  } catch (error) {
    console.error('❌ 最终测试失败:', error);
    return false;
  }
}

// 执行最终测试
finalTest()
  .then((success) => {
    console.log(`\n=== 测试总结 ===`);
    console.log(success ? '✅ 需求工时计算功能修复成功！' : '❌ 需求工时计算功能仍有问题');
    console.log('\n修复说明:');
    console.log('1. ✅ 修复了SQL插入语句的字段数量匹配问题');
    console.log('2. ✅ 修复了需求工时计算逻辑：replenishmentQty / standardWorkQuota');
    console.log('3. ✅ 修复了字段名映射问题，确保requiredWorkHours正确保存到数据库');
    console.log('4. ✅ 修复了更新操作中的需求工时重新计算');
    console.log('\n现在前端输入 replenishmentQty=500, standardWorkQuota=6 时，');
    console.log('需求工时应该正确计算为 83.33，而不是 0');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });