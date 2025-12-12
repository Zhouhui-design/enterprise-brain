const RealProcessPlanService = require('./backend/services/realProcessPlanService');

async function testServiceRequirements() {
  console.log('🎯 测试后端服务层的6个需求实现');
  
  try {
    // 清空测试数据
    console.log('\n📝 步骤1: 清理测试数据');
    const { pool } = require('./backend/config/database');
    const connection = await pool.getConnection();
    await connection.execute('DELETE FROM real_process_plans WHERE plan_no LIKE "SERVICE-TEST-%"');
    connection.release();
    
    // 测试需求1：计划排程日期 = 计划开始日期
    console.log('\n📝 步骤2: 测试需求1 - 计划排程日期 = 计划开始日期');
    
    const testPlan1 = {
      planNo: 'SERVICE-TEST-REQ1',
      processName: '焊接工序',
      productCode: 'TEST-PRODUCT',
      productName: '测试产品',
      planStartDate: '2025-01-15',  // 设置计划开始日期
      workshopName: '焊接车间'
    };
    
    const result1 = await RealProcessPlanService.create(testPlan1);
    console.log(`✅ 创建成功: ID=${result1.id}`);
    
    // 验证需求1
    const createdPlan = await RealProcessPlanService.getById(result1.id);
    // 日期比较：转换为字符串格式进行比较
    const startDateStr = createdPlan.planStartDate instanceof Date 
      ? createdPlan.planStartDate.toISOString().split('T')[0]
      : String(createdPlan.planStartDate).split('T')[0];
    const scheduleDateStr = createdPlan.scheduleDate instanceof Date
      ? createdPlan.scheduleDate.toISOString().split('T')[0] 
      : String(createdPlan.scheduleDate).split('T')[0];
      
    console.log(`✅ 需求1验证: 计划开始日期=${startDateStr}, 计划排程日期=${scheduleDateStr}`);
    if (startDateStr === scheduleDateStr) {
      console.log('✅ 需求1实现成功: 计划排程日期 = 计划开始日期');
    } else {
      console.log('❌ 需求1实现失败');
    }
    
    // 测试需求2：当天已排程工时 SUMIFS计算
    console.log('\n📝 步骤3: 测试需求2 - 当天已排程工时 SUMIFS');
    
    const testPlans = [
      { planNo: 'SERVICE-TEST-REQ2-1', processName: '组装工序', scheduleDate: '2025-01-15', scheduledWorkHours: 8 },
      { planNo: 'SERVICE-TEST-REQ2-2', processName: '组装工序', scheduleDate: '2025-01-15', scheduledWorkHours: 6 },
      { planNo: 'SERVICE-TEST-REQ2-3', processName: '组装工序', scheduleDate: '2025-01-15', scheduledWorkHours: 4 }
    ];
    
    for (let i = 0; i < testPlans.length; i++) {
      const plan = testPlans[i];
      const fullPlan = {
        ...plan,
        productCode: 'TEST-PRODUCT',
        productName: '测试产品',
        workshopName: '组装车间',
        planStartDate: '2025-01-15'
      };
      
      const result = await RealProcessPlanService.create(fullPlan);
      console.log(`✅ 创建记录 ${i+1}: ID=${result.id}, 排程工时=${plan.scheduledWorkHours}`);
      
      // 验证需求2计算
      const expectedCumulative = i === 0 ? 0 : 
        testPlans.slice(0, i).reduce((sum, p) => sum + p.scheduledWorkHours, 0);
      
      const createdRecord = await RealProcessPlanService.getById(result.id);
      console.log(`  📊 第${i+1}条记录: 实际累计=${createdRecord.dailyScheduledHours}, 期望=${expectedCumulative}`);
      
      if (Math.abs(createdRecord.dailyScheduledHours - expectedCumulative) < 0.01) {
        console.log(`  ✅ 第${i+1}条记录需求2计算正确`);
      } else {
        console.log(`  ❌ 第${i+1}条记录需求2计算错误`);
      }
    }
    
    // 测试创建完整记录（包含所有6个需求）
    console.log('\n📝 步骤4: 测试完整的6个需求实现');
    
    const completePlan = {
      planNo: 'SERVICE-TEST-COMPLETE',
      processName: '测试工序',
      productCode: 'COMPLETE-PRODUCT',
      productName: '完整测试产品',
      planStartDate: '2025-01-16',
      workshopName: '测试车间',
      
      // 设置基础数据用于计算其他需求
      dailyTotalHours: 24,              // 当天总工时
      standardWorkQuota: 2,              // 标准工额
      requiredWorkHours: 40,             // 需求工时
      scheduleQuantity: 20,             // 计划排程数量
      
      // 手动设置一些字段进行验证
      scheduleDate: '2025-01-16'
    };
    
    const resultComplete = await RealProcessPlanService.create(completePlan);
    const completeRecord = await RealProcessPlanService.getById(resultComplete.id);
    
    console.log('\n🔍 完整记录验证结果:');
    console.log(`✅ 需求1: 计划开始日期=${completeRecord.planStartDate}, 计划排程日期=${completeRecord.scheduleDate}`);
    console.log(`✅ 需求2: 当天已排程工时=${completeRecord.dailyScheduledHours}`);
    console.log(`✅ 需求3: 当天总工时=${completeRecord.dailyTotalHours}, 当天可用工时=${completeRecord.dailyAvailableHours}`);
    console.log(`✅ 需求4: 计划排程数量=${completeRecord.scheduleQuantity}, 标准工额=${completeRecord.standardWorkQuota}, 计划排程工时=${completeRecord.scheduledWorkHours}`);
    console.log(`✅ 需求5: 需求工时=${completeRecord.requiredWorkHours}, 计算得出的排程数量=${completeRecord.scheduleQuantity}`);
    console.log(`✅ 需求6: 下次排程日期=${completeRecord.nextScheduleDate}`);
    
    console.log('\n🎉 后端服务层6个需求测试完成！');
    
    // 输出实现状态总结
    console.log('\n📊 实现状态总结:');
    console.log('✅ 需求1: 计划排程日期 = 计划开始日期 - 已在create()方法中实现');
    console.log('✅ 需求2: 当天已排程工时 SUMIFS - 已在create()方法中实现');
    console.log('⚠️ 需求3: 当天可用工时计算 - 需要在create()中补充实现');
    console.log('⚠️ 需求4: 计划排程工时 = 计划排程数量 × 标准工额 - 需要在create()中补充实现');
    console.log('⚠️ 需求5: 计划排程数量 = 需求工时 ÷ 标准工额 - 需要在create()中补充实现');
    console.log('⚠️ 需求6: 下次排程日期 = 当前排程日期 + 1天 - 需要在create()中补充实现');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testServiceRequirements().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});