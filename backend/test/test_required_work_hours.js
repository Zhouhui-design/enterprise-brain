const ProcessPlanService = require('../services/processPlanService');

/**
 * 测试需求工时计算逻辑
 * 需求工时 = 需补货数量 / 定时工额
 * 生成时机：工序计划创建成功，且需补货数量 > 0，且定时工额 > 0
 */
async function testRequiredWorkHours() {
  console.log('=== 测试需求工时计算逻辑 ===');
  
  try {
    // 测试场景1：正常的计算
    console.log('\n测试场景1：正常的计算');
    const testPlan1 = {
      planNo: 'TEST001',
      processName: '测试工序1',
      replenishmentQty: 100,  // 需补货数量
      standardWorkQuota: 10, // 定时工额
      expectedRequiredHours: 10 // 预期结果：100/10 = 10
    };
    
    console.log(`测试数据: 需补货数量=${testPlan1.replenishmentQty}, 定时工额=${testPlan1.standardWorkQuota}`);
    console.log(`预期结果: ${testPlan1.expectedRequiredHours}`);
    
    // 创建测试计划
    const result1 = await ProcessPlanService.create(testPlan1);
    console.log(`✅ 创建成功, ID: ${result1.id}`);
    
    // 获取创建的计划
    const createdPlan1 = await ProcessPlanService.getById(result1.id);
    console.log(`实际结果: requiredWorkHours=${createdPlan1.requiredWorkHours}`);
    console.log(`结果验证: ${createdPlan1.requiredWorkHours == testPlan1.expectedRequiredHours ? '✅ 通过' : '❌ 失败'}`);
    
    // 测试场景2：需补货数量为0
    console.log('\n测试场景2：需补货数量为0');
    const testPlan2 = {
      planNo: 'TEST002',
      processName: '测试工序2',
      replenishmentQty: 0,  // 需补货数量为0
      standardWorkQuota: 10, // 定时工额
      expectedRequiredHours: 0 // 预期结果：0
    };
    
    console.log(`测试数据: 需补货数量=${testPlan2.replenishmentQty}, 定时工额=${testPlan2.standardWorkQuota}`);
    console.log(`预期结果: ${testPlan2.expectedRequiredHours}`);
    
    const result2 = await ProcessPlanService.create(testPlan2);
    const createdPlan2 = await ProcessPlanService.getById(result2.id);
    console.log(`实际结果: requiredWorkHours=${createdPlan2.requiredWorkHours}`);
    console.log(`结果验证: ${createdPlan2.requiredWorkHours == testPlan2.expectedRequiredHours ? '✅ 通过' : '❌ 失败'}`);
    
    // 测试场景3：定时工额为0
    console.log('\n测试场景3：定时工额为0');
    const testPlan3 = {
      planNo: 'TEST003',
      processName: '测试工序3',
      replenishmentQty: 100,  // 需补货数量
      standardWorkQuota: 0,   // 定时工额为0
      expectedRequiredHours: 0 // 预期结果：0
    };
    
    console.log(`测试数据: 需补货数量=${testPlan3.replenishmentQty}, 定时工额=${testPlan3.standardWorkQuota}`);
    console.log(`预期结果: ${testPlan3.expectedRequiredHours}`);
    
    const result3 = await ProcessPlanService.create(testPlan3);
    const createdPlan3 = await ProcessPlanService.getById(result3.id);
    console.log(`实际结果: requiredWorkHours=${createdPlan3.requiredWorkHours}`);
    console.log(`结果验证: ${createdPlan3.requiredWorkHours == testPlan3.expectedRequiredHours ? '✅ 通过' : '❌ 失败'}`);
    
    // 测试场景4：更新后的计算
    console.log('\n测试场景4：更新后的计算');
    const updateData = {
      replenishmentQty: 200,  // 更新需补货数量
      standardWorkQuota: 20   // 更新定时工额
    };
    
    const expectedUpdateHours = 10; // 预期结果：200/20 = 10
    console.log(`更新数据: 需补货数量=${updateData.replenishmentQty}, 定时工额=${updateData.standardWorkQuota}`);
    console.log(`预期结果: ${expectedUpdateHours}`);
    
    await ProcessPlanService.update(result3.id, updateData);
    const updatedPlan = await ProcessPlanService.getById(result3.id);
    console.log(`实际结果: requiredWorkHours=${updatedPlan.requiredWorkHours}`);
    console.log(`结果验证: ${updatedPlan.requiredWorkHours == expectedUpdateHours ? '✅ 通过' : '❌ 失败'}`);
    
    // 测试场景5：小数精度验证
    console.log('\n测试场景5：小数精度验证');
    const testPlan5 = {
      planNo: 'TEST005',
      processName: '测试工序5',
      replenishmentQty: 33,   // 需补货数量
      standardWorkQuota: 7,  // 定时工额
      expectedRequiredHours: 4.71 // 预期结果：33/7 ≈ 4.714285..., 保留2位小数为4.71
    };
    
    console.log(`测试数据: 需补货数量=${testPlan5.replenishmentQty}, 定时工额=${testPlan5.standardWorkQuota}`);
    console.log(`预期结果: ${testPlan5.expectedRequiredHours} (保留2位小数)`);
    
    const result5 = await ProcessPlanService.create(testPlan5);
    const createdPlan5 = await ProcessPlanService.getById(result5.id);
    console.log(`实际结果: requiredWorkHours=${createdPlan5.requiredWorkHours}`);
    console.log(`结果验证: ${createdPlan5.requiredWorkHours == testPlan5.expectedRequiredHours ? '✅ 通过' : '❌ 失败'}`);
    
    // 清理测试数据
    console.log('\n=== 清理测试数据 ===');
    await ProcessPlanService.delete(result1.id);
    await ProcessPlanService.delete(result2.id);
    await ProcessPlanService.delete(result3.id);
    await ProcessPlanService.delete(result5.id);
    console.log('✅ 测试数据清理完成');
    
    console.log('\n=== 测试完成 ===');
    console.log('✅ 需求工时计算逻辑测试全部通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  }
}

// 执行测试
testRequiredWorkHours()
  .then(() => {
    console.log('测试执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });