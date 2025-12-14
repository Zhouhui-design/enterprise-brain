const MaterialPreparationPlanService = require('/home/sardenesy/ai_workspaces/ai_desktop_3/backend/services/materialPreparationPlanService');

async function debugServiceCall() {
  try {
    // 构建测试数据，模拟实际的调用
    const testData = {
      planNo: `MPP${Date.now()}`,
      sourcePlanNo: 'MPS2025887745143',
      sourceProcessPlanNo: '/',
      sourceProcess: '打包',
      materialCode: '6001A0306',
      materialName: '6001A0306，铁质方向盘款，嘉博',
      materialSource: '自制',
      materialUnit: '个',
      demandQuantity: 100,
      demandDate: '2026-01-06',
      salesOrderNo: 'SO2025000002',
      customerOrderNo: '',
      mainPlanProductCode: '6001A0306',
      mainPlanProductName: '6001A0306，铁质方向盘款，嘉博',
      mainPlanQuantity: 100,
      promiseDeliveryDate: '2026-01-09',
      customerName: null,
      submitter: 'admin'
    };
    
    console.log('测试数据:', testData);
    
    const result = await MaterialPreparationPlanService.create(testData);
    console.log('创建成功:', result.insertId);
    
  } catch (error) {
    console.error('调试错误:', error.message);
    console.error('SQL状态:', error.sqlState);
    console.error('SQL消息:', error.sqlMessage);
  }
}

debugServiceCall();