const axios = require('axios');

(async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/packing-process-plans', {
      params: { page: 1, pageSize: 10 }
    });
    
    console.log('📊 API响应数据示例：\n');
    const firstRow = response.data.data[0];
    
    console.log('工序计划编号:', firstRow.planNo);
    console.log('主计划产品编号 (masterPlanProductCode):', firstRow.masterPlanProductCode);
    console.log('主计划产品名称 (masterPlanProductName):', firstRow.masterPlanProductName);
    console.log('订单承诺交期 (orderPromiseDeliveryDate):', firstRow.orderPromiseDeliveryDate);
    console.log('\n🔍 完整字段列表：');
    console.log(Object.keys(firstRow).filter(k => k.includes('master') || k.includes('main') || k.includes('promise') || k.includes('order')));
    
  } catch (error) {
    console.error('❌ API调用失败:', error.message);
  }
})();
