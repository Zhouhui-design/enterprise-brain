const MaterialPreparationPlanService = require('./backend/services/materialPreparationPlanService');

async function testAutoTriggerPush() {
  try {
    console.log('🧪 开始测试自动触发推送...');
    const result = await MaterialPreparationPlanService.autoTriggerPush();
    console.log('✅ 自动触发推送完成:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('❌ 自动触发推送失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

testAutoTriggerPush();