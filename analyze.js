// 列名（40个，不包括id）
const columns = [
  'plan_no', // 1
  'source_plan_no', // 2  
  'source_process_plan_no', // 3
  'parent_code', // 4
  'parent_name', // 5
  'parent_schedule_quantity', // 6
  'material_code', // 7
  'material_name', // 8
  'material_source', // 9
  'material_unit', // 10
  'demand_quantity', // 11
  'need_mrp', // 12
  'realtime_stock', // 13
  'projected_balance', // 14
  'available_stock', // 15
  'replenishment_quantity', // 16
  'source_process', // 17
  'workshop_name', // 18
  'parent_process_name', // 19
  'process_interval_hours', // 20
  'process_interval_unit', // 21
  'process_schedule_date', // 22
  'demand_date', // 23
  'push_to_purchase', // 24
  'push_to_process', // 25
  'sales_order_no', // 26
  'customer_order_no', // 27
  'main_plan_product_code', // 28
  'main_plan_product_name', // 29
  'main_plan_quantity', // 30
  'promise_delivery_date', // 31
  'remark', // 32
  'created_by', // 33
  'created_at', // 34 (NOW())
  'updated_by', // 35
  'updated_at', // 36 (NOW())
  'product_image', // 37
  'customer_name', // 38
  'submitter', // 39
  'submit_time' // 40
];

// 当前参数（需要40个，但只有37个）
const currentParams = [
  'data.planNo', // 1
  'data.sourcePlanNo || null', // 2
  'data.sourceProcessPlanNo || null', // 3
  'data.parentCode || null', // 4
  'data.parentName || null', // 5
  'data.parentScheduleQuantity || null', // 6
  'data.materialCode', // 7
  'data.materialName', // 8
  'data.materialSource || null', // 9
  'data.materialUnit || null', // 10
  'data.demandQuantity || 0', // 11
  'data.needMrp ? 1 : 0', // 12
  'data.realtimeStock || 0', // 13
  'data.projectedBalance || 0', // 14
  'data.availableStock || 0', // 15
  '(data.demandQuantity || 0) - (data.availableStock || 0)', // 16
  'data.sourceProcess || null', // 17
  'data.workshopName || null', // 18
  'data.parentProcessName || null', // 19
  'data.processIntervalHours || null', // 20
  'data.processIntervalUnit || null', // 21
  'data.processScheduleDate || null', // 22
  'data.demandDate || null', // 23
  'data.pushToPurchase ? 1 : 0', // 24
  'data.pushToProcess ? 1 : 0', // 25
  'data.salesOrderNo || null', // 26
  'data.customerOrderNo || null', // 27
  'data.mainPlanProductCode || null', // 28
  'data.mainPlanProductName || null', // 29
  'data.mainPlanQuantity || 0', // 30
  'data.promiseDeliveryDate || null', // 31
  'data.remark || null', // 32
  'data.createdBy || null', // 33
  'data.createdBy || null', // 35 (updated_by)
  'data.productImage || null', // 37
  'data.customerName || null', // 38
  'data.submitter || null' // 39
];

console.log('期望参数数量:', columns.length);
console.log('当前参数数量:', currentParams.length);
console.log('缺失参数数量:', columns.length - currentParams.length);

// 找出缺失的参数位置
const currentIndices = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,35,37,38,39];
const missingIndices = [];

for (let i = 1; i <= columns.length; i++) {
  if (!currentIndices.includes(i)) {
    missingIndices.push(i);
    console.log(`缺失位置 ${i}: ${columns[i-1]}`);
  }
}

console.log('缺失的索引:', missingIndices);