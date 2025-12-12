/**
 * 临时脚本：手动触发真工序计划的自增行
 */

const RealProcessPlanService = require('../services/realProcessPlanService');

async function triggerIncremental() {
  try {
    const recordId = 183; // 要触发自增的记录ID
    
    console.log(`🔁 开始为记录 ID=${recordId} 触发自增行...`);
    
    await RealProcessPlanService.checkAndCreateIncremental(recordId);
    
    console.log(`✅ 自增行触发完成`);
    process.exit(0);
  } catch (error) {
    console.error('❌ 触发自增失败:', error);
    process.exit(1);
  }
}

triggerIncremental();
