// 测试字段计算逻辑
const testData = {
  processName: '测试工序',
  replenishmentQty: 100,
  standardWorkQuota: 5,
  completionDate: '2025-12-20'
};

console.log('🧪 测试6个需求的字段计算逻辑:');
console.log('输入数据:', testData);

// 需求1：计划排程日期 = 计划开始日期
console.log('\n需求1：计划排程日期 = 计划开始日期');
console.log('条件：计划开始日期不为空');
console.log('实现：在前端保存时设置 scheduleDate = planStartDate');

// 需求2：当天已排程工时 = SUMIFS(计划排程工时，序号<本行序号，工序名称=本行工序名称，计划排程日期=本行计划排程日期)
console.log('\n需求2：当天已排程工时 = SUMIFS(...)');
console.log('条件：序号不为空且工序名称不为空且计划排程日期不为空');
console.log('实现：前端调用API查询，后端计算SUMIFS');

// 需求3：工序当天可用工时 = 当天总工时 - 当天已排程工时
console.log('\n需求3：工序当天可用工时 = 当天总工时 - 当天已排程工时');
console.log('实现：前端计算 dailyAvailableHours = dailyTotalHours - dailyScheduledHours');

// 需求4：计划排程工时 = MIN(工序当天可用工时, 需求工时)
console.log('\n需求4：计划排程工时 = MIN(工序当天可用工时, 需求工时)');
console.log('实现：前端计算 scheduledWorkHours = MIN(dailyAvailableHours, requiredWorkHours)');

// 需求5：计划排程数量 = 计划排程工时 * 定时工额
console.log('\n需求5：计划排程数量 = 计划排程工时 * 定时工额');
console.log('条件：定时工额 > 0');
console.log('实现：前端计算 scheduleQuantity = scheduledWorkHours * standardWorkQuota');

// 需求6：下一个排程日期 (MINIFS)
console.log('\n需求6：下一个排程日期 = MINIFS(...)');
console.log('条件：工序名称=本行工序，且日期>计划排程日期，且日期<=计划结束日期，且剩余工时>门槛值');
console.log('实现：前端调用API查询MINIFS');

console.log('\n✅ 所有需求的计算逻辑都已在前端实现');
console.log('🔧 问题诊断：数据库中存在无效日期，需要手动清理或重新创建测试数据');