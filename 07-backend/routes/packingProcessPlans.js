const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// 模拟数据库存储
let packingProcessPlans = [];

// 导出存储，供其他模块使用
module.exports.packingProcessPlans = packingProcessPlans;

// 生成打包工序计划编号
function generatePlanNo() {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
  return `PPP${year}${random}`;
}

// 获取打包工序计划列表
router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, planNo, sourcePlanNo, materialCode, scheduleDateStart, scheduleDateEnd } = req.query;
  
  let filteredPlans = [...packingProcessPlans];
  
  // 过滤条件
  if (planNo) {
    filteredPlans = filteredPlans.filter(plan => plan.planNo.includes(planNo));
  }
  
  if (sourcePlanNo) {
    filteredPlans = filteredPlans.filter(plan => plan.sourcePlanNo.includes(sourcePlanNo));
  }
  
  if (materialCode) {
    filteredPlans = filteredPlans.filter(plan => plan.materialCode.includes(materialCode));
  }
  
  if (scheduleDateStart && scheduleDateEnd) {
    filteredPlans = filteredPlans.filter(plan => 
      new Date(plan.scheduleDate) >= new Date(scheduleDateStart) && 
      new Date(plan.scheduleDate) <= new Date(scheduleDateEnd)
    );
  }
  
  // 分页
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + parseInt(pageSize);
  const paginatedPlans = filteredPlans.slice(startIndex, endIndex);
  
  // 处理响应，移除不需要的字段
  const responsePlans = paginatedPlans.map(plan => {
    const responsePlan = { ...plan };
    delete responsePlan.scheduleQuantity;
    delete responsePlan.cumulativeScheduleQty;
    return responsePlan;
  });
  
  res.json({
    list: responsePlans,
    total: filteredPlans.length
  });
});

// 根据ID获取打包工序计划
router.get('/:id', (req, res) => {
  const plan = packingProcessPlans.find(p => p.id === req.params.id);
  if (plan) {
    // 创建响应副本，排除不需要的字段
    const responsePlan = { ...plan };
    delete responsePlan.scheduleQuantity;
    delete responsePlan.cumulativeScheduleQty;
    res.json(responsePlan);
  } else {
    res.status(404).json({ message: '打包工序计划不存在' });
  }
});

// 创建打包工序计划
router.post('/', (req, res) => {
  const newPlan = {
    id: uuidv4(),
    planNo: req.body.planNo || generatePlanNo(),
    sourcePlanNo: req.body.sourcePlanNo || '',
    sourceMaterialPlanNo: req.body.sourceMaterialPlanNo || '',
    salesOrderNo: req.body.salesOrderNo || '',
    customerOrderNo: req.body.customerOrderNo || '',
    productCode: req.body.productCode || '',
    productName: req.body.productName || '',
    processName: '打包', // 打包工序固定名称
    materialCode: req.body.materialCode || '',
    materialName: req.body.materialName || '',
    standardWorkQuota: req.body.standardWorkQuota || 100, // 定时工额，默认100
    demandQuantity: req.body.demandQuantity || 0,
    requiredWorkHours: req.body.requiredWorkHours || 0,
    scheduleDate: req.body.scheduleDate || new Date().toISOString(),
    totalHours: req.body.totalHours || 8, // 当天总工时，默认8小时
    dailyScheduledHours: req.body.dailyScheduledHours || 0,
    availableHours: req.body.availableHours || req.body.totalHours || 8,
    scheduledWorkHours: req.body.scheduledWorkHours || 0,
    planStartDate: req.body.planStartDate || null,
    planEndDate: req.body.planEndDate || null,
    remainingHoursThreshold: req.body.remainingHoursThreshold || 0.5, // 剩余工时小于，默认0.5
    progressStatus: req.body.progressStatus || 'inProgress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // ✅ 根据需求，后端不再进行任何计算，所有计算由前端完成
  // 仅使用前端传递的数据，不做任何自动计算
  newPlan.requiredWorkHours = req.body.requiredWorkHours || 0;
  newPlan.availableHours = req.body.availableHours || 0;
  newPlan.scheduledWorkHours = req.body.scheduledWorkHours || 0;
  
  packingProcessPlans.push(newPlan);
  
  res.status(201).json(newPlan);
});

// 更新打包工序计划
router.put('/:id', (req, res) => {
  const index = packingProcessPlans.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    // 创建更新副本，排除不需要的字段
    const updateData = { ...req.body };
    delete updateData.scheduleQuantity;
    delete updateData.cumulativeScheduleQty;
    
    const updatedPlan = {
      ...packingProcessPlans[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // ✅ 根据需求，后端不再进行任何计算，所有计算由前端完成
    // 仅使用前端传递的数据，不做任何自动计算
    if (req.body.requiredWorkHours !== undefined) {
      updatedPlan.requiredWorkHours = req.body.requiredWorkHours;
    }
    if (req.body.availableHours !== undefined) {
      updatedPlan.availableHours = req.body.availableHours;
    }
    if (req.body.scheduledWorkHours !== undefined) {
      updatedPlan.scheduledWorkHours = req.body.scheduledWorkHours;
    }
    
    packingProcessPlans[index] = updatedPlan;
    res.json(updatedPlan);
  } else {
    res.status(404).json({ message: '打包工序计划不存在' });
  }
});

// 删除打包工序计划
router.delete('/:id', (req, res) => {
  const index = packingProcessPlans.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    const deletedPlan = packingProcessPlans.splice(index, 1);
    res.json(deletedPlan[0]);
  } else {
    res.status(404).json({ message: '打包工序计划不存在' });
  }
});

// 批量删除打包工序计划
router.post('/batch-delete', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return res.status(400).json({ message: 'ids必须是数组' });
  }
  
  const deletedPlans = [];
  ids.forEach(id => {
    const index = packingProcessPlans.findIndex(p => p.id === id);
    if (index !== -1) {
      deletedPlans.push(packingProcessPlans.splice(index, 1)[0]);
    }
  });
  
  res.json(deletedPlans);
});

// 查询当天已排程工时
// SUMIFS(计划排程工时, 工序名称=当前工序, 计划排程日期=当前日期, ID<>当前ID)
router.get('/query-daily-scheduled-hours', (req, res) => {
  const { processName, scheduleDate, excludeId } = req.query;
  
  if (!processName || !scheduleDate) {
    return res.status(400).json({ message: '工序名称和计划排程日期不能为空' });
  }
  
  const filteredPlans = packingProcessPlans.filter(plan => 
    plan.processName === processName && 
    new Date(plan.scheduleDate).toDateString() === new Date(scheduleDate).toDateString() && 
    plan.id !== excludeId
  );
  
  const totalScheduledHours = filteredPlans.reduce((sum, plan) => sum + (plan.scheduledWorkHours || 0), 0);
  
  res.json({
    dailyScheduledHours: parseFloat(totalScheduledHours.toFixed(2))
  });
});

// 修复字段计算
router.post('/fix-field-calculations', (req, res) => {
  // 遍历所有打包工序计划，重新计算自动字段
  packingProcessPlans.forEach((plan, index) => {
    // 重新计算需求工时
    if (plan.demandQuantity > 0 && plan.standardWorkQuota > 0) {
      plan.requiredWorkHours = parseFloat((plan.demandQuantity / plan.standardWorkQuota).toFixed(2));
    }
    
    // 重新计算当天可用工时
    plan.availableHours = plan.totalHours - plan.dailyScheduledHours;
    
    // 重新计算计划排程工时
    plan.scheduledWorkHours = Math.min(plan.availableHours, plan.requiredWorkHours);
    
    plan.updatedAt = new Date().toISOString();
  });
  
  res.json({
    success: true,
    message: '所有字段计算已修复',
    totalFixed: packingProcessPlans.length
  });
});

module.exports = router;