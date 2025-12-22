const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// 模拟数据库存储
let materialPreparationPlans = [];

// 生成备料计划编号
function generatePlanNo() {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
  return `MPP${year}${random}`;
}

// 获取备料计划列表
router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, planNo, sourcePlanNo, materialCode, demandDateStart, demandDateEnd } = req.query;
  
  let filteredPlans = [...materialPreparationPlans];
  
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
  
  if (demandDateStart && demandDateEnd) {
    filteredPlans = filteredPlans.filter(plan => 
      new Date(plan.demandDate) >= new Date(demandDateStart) && 
      new Date(plan.demandDate) <= new Date(demandDateEnd)
    );
  }
  
  // 分页
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + parseInt(pageSize);
  const paginatedPlans = filteredPlans.slice(startIndex, endIndex);
  
  res.json({
    list: paginatedPlans,
    total: filteredPlans.length
  });
});

// 获取单个备料计划
router.get('/:id', (req, res) => {
  const plan = materialPreparationPlans.find(p => p.id === req.params.id);
  if (plan) {
    res.json(plan);
  } else {
    res.status(404).json({ message: '备料计划不存在' });
  }
});

// 创建备料计划
router.post('/', (req, res) => {
  const newPlan = {
    id: uuidv4(),
    planNo: req.body.planNo || generatePlanNo(),
    sourcePlanNo: req.body.sourcePlanNo || '',
    sourceProcessPlanNo: req.body.sourceProcessPlanNo || '',
    parentCode: req.body.parentCode || '',
    parentName: req.body.parentName || '',
    parentScheduleQuantity: req.body.parentScheduleQuantity || 0,
    materialCode: req.body.materialCode,
    materialName: req.body.materialName,
    materialSource: req.body.materialSource || '外购',
    materialUnit: req.body.materialUnit || '',
    demandQuantity: req.body.demandQuantity || 0,
    needMrp: req.body.needMrp || false,
    realtimeStock: req.body.realtimeStock || 0,
    projectedBalance: req.body.projectedBalance || 0,
    availableStock: req.body.availableStock || 0,
    sourceProcess: req.body.sourceProcess || '',
    workshopName: req.body.workshopName || '',
    parentProcessName: req.body.parentProcessName || '',
    processIntervalHours: req.body.processIntervalHours || 0,
    processIntervalUnit: req.body.processIntervalUnit || '小时',
    processScheduleDate: req.body.processScheduleDate || null,
    demandDate: req.body.demandDate || new Date().toISOString(),
    pushToPurchase: req.body.pushToPurchase || false,
    pushToProcess: req.body.pushToProcess || false,
    salesOrderNo: req.body.salesOrderNo || '',
    customerOrderNo: req.body.customerOrderNo || '',
    mainPlanProductCode: req.body.mainPlanProductCode || '',
    mainPlanProductName: req.body.mainPlanProductName || '',
    mainPlanQuantity: req.body.mainPlanQuantity || 0,
    promiseDeliveryDate: req.body.promiseDeliveryDate || null,
    remark: req.body.remark || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  materialPreparationPlans.push(newPlan);
  
  // 检查是否需要自动推送打包工序计划
  if (newPlan.sourceProcess === '打包' && newPlan.demandQuantity > 0 && newPlan.availableStock < newPlan.demandQuantity) {
    newPlan.pushToProcess = true;
    // 这里可以添加自动推送逻辑
  }
  
  res.status(201).json(newPlan);
});

// 更新备料计划
router.put('/:id', (req, res) => {
  const index = materialPreparationPlans.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    // 更新备料计划
    materialPreparationPlans[index] = {
      ...materialPreparationPlans[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    const updatedPlan = materialPreparationPlans[index];
    
    // 检查是否需要自动推送打包工序计划
    if (updatedPlan.sourceProcess === '打包' && updatedPlan.demandQuantity > 0 && updatedPlan.demandQuantity > updatedPlan.availableStock) {
      updatedPlan.pushToProcess = true;
    }
    
    res.json(updatedPlan);
  } else {
    res.status(404).json({ message: '备料计划不存在' });
  }
});

// 删除备料计划
router.delete('/:id', (req, res) => {
  const index = materialPreparationPlans.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    const deletedPlan = materialPreparationPlans.splice(index, 1);
    res.json(deletedPlan[0]);
  } else {
    res.status(404).json({ message: '备料计划不存在' });
  }
});

// 批量删除备料计划
router.delete('/batch/delete', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return res.status(400).json({ message: 'ids必须是数组' });
  }
  
  const deletedPlans = [];
  ids.forEach(id => {
    const index = materialPreparationPlans.findIndex(p => p.id === id);
    if (index !== -1) {
      deletedPlans.push(materialPreparationPlans.splice(index, 1)[0]);
    }
  });
  
  res.json(deletedPlans);
});

// 推送到工序计划
router.post('/:id/push-to-process', (req, res) => {
  const plan = materialPreparationPlans.find(p => p.id === req.params.id);
  if (plan) {
    // 更新备料计划状态
    plan.pushToProcess = true;
    plan.updatedAt = new Date().toISOString();
    
    // 计算需补货数量（假设需求数量大于可用库存时需要补货）
    const replenishmentQty = plan.demandQuantity > plan.availableStock ? plan.demandQuantity - plan.availableStock : 0;
    
    // 推送到打包工序计划
    if (plan.sourceProcess === '打包' && replenishmentQty > 0) {
      // 导入打包工序计划模块
      const packingProcessModule = require('./packingProcessPlans');
      const packingProcessPlans = packingProcessModule.packingProcessPlans;
      
      // 准备打包工序计划数据
      const packingPlanData = {
        sourcePlanNo: plan.sourcePlanNo,
        sourceMaterialPlanNo: plan.planNo, // 来源备料计划编号
        salesOrderNo: plan.salesOrderNo,
        customerOrderNo: plan.customerOrderNo,
        productCode: plan.parentCode || plan.materialCode,
        productName: plan.parentName || plan.materialName,
        materialCode: plan.materialCode,
        materialName: plan.materialName,
        standardWorkQuota: 100, // 默认定时工额，实际应该从产品物料库获取
        demandQuantity: replenishmentQty,
        scheduleDate: plan.demandDate, // 使用备料计划的需求日期作为排程日期
        totalHours: 8, // 默认当天总工时8小时
        remainingHoursThreshold: 0.5 // 默认剩余工时小于0.5
      };
      
      // 计算需求工时
      const requiredWorkHours = parseFloat((packingPlanData.demandQuantity / packingPlanData.standardWorkQuota).toFixed(2));
      
      // 创建打包工序计划
      const packingPlan = {
        id: uuidv4(),
        planNo: `PPP${new Date().getFullYear()}${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`,
        ...packingPlanData,
        processName: '打包',
        requiredWorkHours: requiredWorkHours,
        dailyScheduledHours: 0, // 初始当天已排程工时为0
        availableHours: 8, // 默认当天可用工时8小时
        scheduledWorkHours: Math.min(8, requiredWorkHours), // 初始计划排程工时
        // ✅ 根据需求，后端不再计算计划排程数量，由前端完成
        progressStatus: 'inProgress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 将打包工序计划添加到存储中
      packingProcessPlans.push(packingPlan);
      
      res.json({
        success: true,
        message: '已成功推送到打包工序计划',
        data: plan,
        packingPlan: packingPlan
      });
    } else {
      res.json({
        success: true,
        message: '已成功推送到工序计划',
        data: plan
      });
    }
  } else {
    res.status(404).json({ message: '备料计划不存在' });
  }
});

// 自动生成备料计划（根据用户需求）
router.post('/auto-generate', (req, res) => {
  const { materialCode, materialName, demandQuantity, sourceProcess } = req.body;
  
  // 模拟库存查询
  const realtimeStock = 100; // 模拟当前库存
  const projectedBalance = 50; // 模拟预计可用库存
  const availableStock = realtimeStock + projectedBalance;
  const needReplenishment = demandQuantity > availableStock;
  const replenishmentQty = needReplenishment ? demandQuantity - availableStock : 0;
  
  const newPlan = {
    id: uuidv4(),
    planNo: generatePlanNo(),
    materialCode,
    materialName,
    materialSource: '外购',
    materialUnit: '个',
    demandQuantity,
    needMrp: needReplenishment,
    realtimeStock,
    projectedBalance,
    availableStock,
    sourceProcess: sourceProcess || '打包',
    workshopName: '包装车间',
    demandDate: new Date().toISOString(),
    pushToProcess: needReplenishment && (sourceProcess === '打包' || !sourceProcess), // 满足条件自动推送
    salesOrderNo: 'SO2025001',
    customerOrderNo: 'CO2025001',
    mainPlanProductCode: 'PROD001',
    mainPlanProductName: '产品A',
    mainPlanQuantity: 1000,
    promiseDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    remark: '自动生成的备料计划',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  materialPreparationPlans.push(newPlan);
  
  // 如果满足推送条件且是打包工序，直接推送
  if (newPlan.pushToProcess && newPlan.sourceProcess === '打包' && replenishmentQty > 0) {
    // 导入打包工序计划模块
    const packingProcessModule = require('./packingProcessPlans');
    const packingProcessPlans = packingProcessModule.packingProcessPlans;
    
    // 准备打包工序计划数据
    const packingPlanData = {
      sourcePlanNo: newPlan.sourcePlanNo,
      sourceMaterialPlanNo: newPlan.planNo, // 来源备料计划编号
      salesOrderNo: newPlan.salesOrderNo,
      customerOrderNo: newPlan.customerOrderNo,
      productCode: newPlan.parentCode || newPlan.materialCode,
      productName: newPlan.parentName || newPlan.materialName,
      materialCode: newPlan.materialCode,
      materialName: newPlan.materialName,
      standardWorkQuota: 100, // 默认定时工额，实际应该从产品物料库获取
      demandQuantity: replenishmentQty,
      scheduleDate: newPlan.demandDate, // 使用备料计划的需求日期作为排程日期
      totalHours: 8, // 默认当天总工时8小时
      remainingHoursThreshold: 0.5 // 默认剩余工时小于0.5
    };
    
    // 计算需求工时
    const requiredWorkHours = parseFloat((packingPlanData.demandQuantity / packingPlanData.standardWorkQuota).toFixed(2));
    
    // 创建打包工序计划
    const packingPlan = {
      id: uuidv4(),
      planNo: `PPP${new Date().getFullYear()}${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`,
      ...packingPlanData,
      processName: '打包',
      requiredWorkHours: requiredWorkHours,
      dailyScheduledHours: 0, // 初始当天已排程工时为0
      availableHours: 8, // 默认当天可用工时8小时
      scheduledWorkHours: Math.min(8, requiredWorkHours), // 初始计划排程工时
      scheduleQuantity: Math.ceil(Math.min(8, requiredWorkHours) * packingPlanData.standardWorkQuota), // 初始计划排程数量
      progressStatus: 'inProgress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 将打包工序计划添加到存储中
    packingProcessPlans.push(packingPlan);
    
    res.status(201).json({
      success: true,
      message: '备料计划已自动生成并推送到打包工序计划',
      data: newPlan,
      packingPlan: packingPlan,
      replenishmentInfo: {
        needReplenishment,
        replenishmentQty
      }
    });
  } else {
    res.status(201).json({
      success: true,
      message: '备料计划已自动生成',
      data: newPlan,
      replenishmentInfo: {
        needReplenishment,
        replenishmentQty
      }
    });
  }
});

module.exports = router;