/**
 * 生产调度工具
 * 提供生产计划和调度相关的计算功能
 */
class ProductionScheduler {
  /**
   * 计算生产能力
   * @param {Object} resourceData - 资源数据
   * @param {Object} options - 计算选项
   * @returns {Object} 生产能力计算结果
   */
  calculateProductionCapacity(resourceData, options = {}) {
    const {
      decimals = 2
    } = options;

    const {
      machines,
      labor,
      availableTime,
      efficiencyRate = 0.85
    } = resourceData;

    if (!machines || !labor || !availableTime) {
      throw new Error('资源数据不完整');
    }

    // 计算各资源的生产能力
    const machineCapacity = machines.reduce((total, machine) => {
      return total + (machine.quantity * machine.outputRate * availableTime * efficiencyRate);
    }, 0);

    const laborCapacity = labor.reduce((total, laborType) => {
      return total + (laborType.headcount * laborType.outputRate * availableTime * efficiencyRate);
    }, 0);

    // 确定瓶颈资源和理论最大产能
    const bottleneckCapacity = Math.min(machineCapacity, laborCapacity);
    const bottleneckResource = machineCapacity < laborCapacity ? 'machines' : 'labor';

    return {
      machineCapacity: Number(machineCapacity.toFixed(decimals)),
      laborCapacity: Number(laborCapacity.toFixed(decimals)),
      bottleneckCapacity: Number(bottleneckCapacity.toFixed(decimals)),
      bottleneckResource,
      efficiencyRate: Number((efficiencyRate * 100).toFixed(decimals)),
      availableTime: Number(availableTime.toFixed(decimals))
    };
  }

  /**
   * 计算生产排期（基于最短作业优先算法）
   * @param {Array} jobs - 作业列表
   * @param {number} numberOfMachines - 机器数量
   * @param {Object} options - 排期选项
   * @returns {Object} 生产排期结果
   */
  scheduleProduction(jobs, numberOfMachines = 1, options = {}) {
    const {
      algorithm = 'shortest-job-first', // 'shortest-job-first', 'earliest-due-date'
      decimals = 2
    } = options;

    if (!Array.isArray(jobs) || jobs.length === 0) {
      throw new Error('作业列表不能为空');
    }

    if (numberOfMachines <= 0) {
      throw new Error('机器数量必须大于零');
    }

    // 复制作业列表以避免修改原始数据
    const jobsToSchedule = [...jobs];

    // 根据选择的算法排序作业
    switch (algorithm) {
      case 'shortest-job-first':
        // 最短作业优先
        jobsToSchedule.sort((a, b) => a.processingTime - b.processingTime);
        break;
      case 'earliest-due-date':
        // 最早到期日优先
        jobsToSchedule.sort((a, b) => a.dueDate - b.dueDate);
        break;
      default:
        throw new Error(`不支持的排期算法: ${algorithm}`);
    }

    // 初始化机器
    const machines = [];
    for (let i = 0; i < numberOfMachines; i++) {
      machines.push({
        id: i + 1,
        jobs: [],
        completionTime: 0
      });
    }

    // 分配作业到机器
    jobsToSchedule.forEach(job => {
      // 找到当前完成时间最早的机器
      const selectedMachine = machines.reduce((earliest, machine) => {
        return machine.completionTime < earliest.completionTime ? machine : earliest;
      });

      // 分配作业
      const startTime = selectedMachine.completionTime;
      const completionTime = startTime + job.processingTime;
      const tardiness = Math.max(0, completionTime - (job.dueDate || Infinity));

      selectedMachine.jobs.push({
        ...job,
        machineId: selectedMachine.id,
        startTime: Number(startTime.toFixed(decimals)),
        completionTime: Number(completionTime.toFixed(decimals)),
        tardiness: Number(tardiness.toFixed(decimals)),
        isTardy: tardiness > 0
      });

      selectedMachine.completionTime = completionTime;
    });

    // 计算整体指标
    const totalJobs = jobsToSchedule.length;
    let totalMakespan = 0;
    let totalFlowTime = 0;
    let totalTardiness = 0;
    let numberOfTardyJobs = 0;

    machines.forEach(machine => {
      totalMakespan = Math.max(totalMakespan, machine.completionTime);
      
      machine.jobs.forEach(job => {
        totalFlowTime += job.completionTime;
        totalTardiness += job.tardiness;
        if (job.isTardy) {
          numberOfTardyJobs++;
        }
      });
    });

    const averageFlowTime = totalJobs > 0 ? totalFlowTime / totalJobs : 0;
    const averageTardiness = totalJobs > 0 ? totalTardiness / totalJobs : 0;
    const tardinessRatio = totalJobs > 0 ? numberOfTardyJobs / totalJobs : 0;

    return {
      scheduleAlgorithm: algorithm,
      numberOfMachines,
      totalJobs,
      makespan: Number(totalMakespan.toFixed(decimals)),
      averageFlowTime: Number(averageFlowTime.toFixed(decimals)),
      totalTardiness: Number(totalTardiness.toFixed(decimals)),
      averageTardiness: Number(averageTardiness.toFixed(decimals)),
      numberOfTardyJobs,
      tardinessRatio: Number((tardinessRatio * 100).toFixed(decimals)),
      machineSchedules: machines.map(machine => ({
        ...machine,
        completionTime: Number(machine.completionTime.toFixed(decimals))
      }))
    };
  }

  /**
   * 计算物料需求计划(MRP)
   * @param {Array} products - 产品需求
   * @param {Object} billOfMaterials - 物料清单
   * @param {Object} inventoryLevels - 当前库存水平
   * @param {Object} options - 计算选项
   * @returns {Object} MRP计算结果
   */
  calculateMRP(products, billOfMaterials, inventoryLevels, options = {}) {
    const {
      decimals = 2,
      safetyStockLevels = {}
    } = options;

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('产品需求不能为空');
    }

    if (!billOfMaterials) {
      throw new Error('物料清单不能为空');
    }

    // 存储所有物料的需求
    const materialRequirements = {};
    
    // 递归展开物料需求
    const explodeBillOfMaterials = (productId, quantityRequired, level = 0) => {
      const productBOM = billOfMaterials[productId];
      
      if (!productBOM) {
        // 基础物料，无进一步展开
        return;
      }

      // 展开每个组件的需求
      productBOM.components.forEach(component => {
        const componentId = component.id;
        const quantityPerParent = component.quantity;
        const componentQuantityRequired = quantityRequired * quantityPerParent;
        
        // 初始化组件需求记录
        if (!materialRequirements[componentId]) {
          materialRequirements[componentId] = {
            id: componentId,
           需求量: 0,
           现有库存: inventoryLevels[componentId] || 0,
           安全库存: safetyStockLevels[componentId] || 0,
            净需求: 0,
            计划订单: 0,
            level
          };
        }
        
        // 累加需求量
        materialRequirements[componentId].需求量 += componentQuantityRequired;
        
        // 递归展开下一级
        explodeBillOfMaterials(componentId, componentQuantityRequired, level + 1);
      });
    };

    // 处理所有产品的需求
    products.forEach(product => {
      explodeBillOfMaterials(product.id, product.quantity, 0);
    });

    // 计算净需求和计划订单
    Object.values(materialRequirements).forEach(material => {
      // 计算净需求
      const availableInventory = material.现有库存 - material.安全库存;
      material.净需求 = Math.max(0, material.需求量 - availableInventory);
      
      // 计算计划订单（简化版，不考虑批量规则和前置时间）
      material.计划订单 = material.净需求;
    });

    // 计算总需求金额（如果有成本信息）
    let totalRequiredValue = 0;
    Object.values(materialRequirements).forEach(material => {
      if (material.cost) {
        totalRequiredValue += material.计划订单 * material.cost;
      }
    });

    return {
      materialRequirements,
      totalRequiredItems: Object.keys(materialRequirements).length,
      totalRequiredValue: Number(totalRequiredValue.toFixed(decimals)),
      products
    };
  }

  /**
   * 计算生产提前期
   * @param {Array} operations - 工序列表
   * @param {Object} options - 计算选项
   * @returns {Object} 生产提前期计算结果
   */
  calculateLeadTime(operations, options = {}) {
    const {
      decimals = 2,
      waitingTimeFactor = 1.5 // 等待时间系数
    } = options;

    if (!Array.isArray(operations) || operations.length === 0) {
      throw new Error('工序列表不能为空');
    }

    let setupTime = 0;
    let processingTime = 0;
    let waitingTime = 0;
    let moveTime = 0;
    let inspectionTime = 0;

    // 计算各项时间
    operations.forEach(operation => {
      setupTime += operation.setupTime || 0;
      processingTime += operation.processingTime || 0;
      waitingTime += (operation.waitingTime || 0) + 
                    ((operation.processingTime || 0) * (waitingTimeFactor - 1));
      moveTime += operation.moveTime || 0;
      inspectionTime += operation.inspectionTime || 0;
    });

    // 计算总提前期
    const totalLeadTime = setupTime + processingTime + waitingTime + moveTime + inspectionTime;
    
    // 计算各部分占比
    const setupTimePercentage = totalLeadTime > 0 ? (setupTime / totalLeadTime) * 100 : 0;
    const processingTimePercentage = totalLeadTime > 0 ? (processingTime / totalLeadTime) * 100 : 0;
    const waitingTimePercentage = totalLeadTime > 0 ? (waitingTime / totalLeadTime) * 100 : 0;
    const moveTimePercentage = totalLeadTime > 0 ? (moveTime / totalLeadTime) * 100 : 0;
    const inspectionTimePercentage = totalLeadTime > 0 ? (inspectionTime / totalLeadTime) * 100 : 0;

    return {
      setupTime: Number(setupTime.toFixed(decimals)),
      processingTime: Number(processingTime.toFixed(decimals)),
      waitingTime: Number(waitingTime.toFixed(decimals)),
      moveTime: Number(moveTime.toFixed(decimals)),
      inspectionTime: Number(inspectionTime.toFixed(decimals)),
      totalLeadTime: Number(totalLeadTime.toFixed(decimals)),
      setupTimePercentage: Number(setupTimePercentage.toFixed(decimals)),
      processingTimePercentage: Number(processingTimePercentage.toFixed(decimals)),
      waitingTimePercentage: Number(waitingTimePercentage.toFixed(decimals)),
      moveTimePercentage: Number(moveTimePercentage.toFixed(decimals)),
      inspectionTimePercentage: Number(inspectionTimePercentage.toFixed(decimals)),
      operationsCount: operations.length
    };
  }

  /**
   * 计算设备综合效率(OEE)
   * @param {Object} availabilityData - 可用性数据
   * @param {Object} performanceData - 性能数据
   * @param {Object} qualityData - 质量数据
   * @param {Object} options - 计算选项
   * @returns {Object} OEE计算结果
   */
  calculateOEE(availabilityData, performanceData, qualityData, options = {}) {
    const {
      decimals = 2
    } = options;

    // 计算可用性
    const { plannedProductionTime, unplannedDowntime } = availabilityData;
    const operatingTime = plannedProductionTime - unplannedDowntime;
    const availability = (operatingTime / plannedProductionTime) * 100;

    // 计算性能效率
    const { idealCycleTime, totalPiecesProduced } = performanceData;
    const idealProductionTime = totalPiecesProduced * idealCycleTime;
    const performanceEfficiency = (idealProductionTime / operatingTime) * 100;

    // 计算质量率
    const { goodPieces, totalPiecesProduced: totalPieces } = qualityData;
    const qualityRate = (goodPieces / totalPieces) * 100;

    // 计算OEE
    const oee = (availability / 100) * (performanceEfficiency / 100) * (qualityRate / 100) * 100;

    // 计算损失分析
    const availabilityLoss = 100 - availability;
    const performanceLoss = 100 - performanceEfficiency;
    const qualityLoss = 100 - qualityRate;

    // OEE评级
    let oeeRating;
    if (oee >= 85) {
      oeeRating = '世界级';
    } else if (oee >= 60) {
      oeeRating = '良好';
    } else if (oee >= 40) {
      oeeRating = '一般';
    } else {
      oeeRating = '需要改进';
    }

    return {
      availability: Number(availability.toFixed(decimals)),
      performanceEfficiency: Number(performanceEfficiency.toFixed(decimals)),
      qualityRate: Number(qualityRate.toFixed(decimals)),
      oee: Number(oee.toFixed(decimals)),
      oeeRating,
      availabilityLoss: Number(availabilityLoss.toFixed(decimals)),
      performanceLoss: Number(performanceLoss.toFixed(decimals)),
      qualityLoss: Number(qualityLoss.toFixed(decimals)),
      plannedProductionTime: Number(plannedProductionTime.toFixed(decimals)),
      operatingTime: Number(operatingTime.toFixed(decimals)),
      unplannedDowntime: Number(unplannedDowntime.toFixed(decimals)),
      totalPiecesProduced,
      goodPieces
    };
  }

  /**
   * 计算生产计划的资源利用率
   * @param {Object} productionPlan - 生产计划
   * @param {Object} resourceCapacities - 资源容量
   * @param {Object} options - 计算选项
   * @returns {Object} 资源利用率计算结果
   */
  calculateResourceUtilization(productionPlan, resourceCapacities, options = {}) {
    const {
      decimals = 2
    } = options;

    const utilizationResults = {};
    let overallUtilization = 0;
    let resourceCount = 0;

    // 计算每种资源的利用率
    Object.keys(resourceCapacities).forEach(resourceType => {
      const capacity = resourceCapacities[resourceType];
      const usage = productionPlan[resourceType] || 0;
      
      const utilization = capacity > 0 ? (usage / capacity) * 100 : 0;
      
      utilizationResults[resourceType] = {
        usage: Number(usage.toFixed(decimals)),
        capacity: Number(capacity.toFixed(decimals)),
        utilization: Number(utilization.toFixed(decimals)),
        isOverUtilized: utilization > 100
      };
      
      overallUtilization += utilization;
      resourceCount++;
    });

    // 计算整体平均利用率
    overallUtilization = resourceCount > 0 ? overallUtilization / resourceCount : 0;

    // 识别瓶颈资源
    let bottleneckResource = null;
    let highestUtilization = 0;
    
    Object.entries(utilizationResults).forEach(([resource, data]) => {
      if (data.utilization > highestUtilization) {
        highestUtilization = data.utilization;
        bottleneckResource = resource;
      }
    });

    return {
      resourceUtilization: utilizationResults,
      overallUtilization: Number(overallUtilization.toFixed(decimals)),
      bottleneckResource,
      highestUtilization: Number(highestUtilization.toFixed(decimals)),
      resourceCount
    };
  }

  /**
   * 计算生产批量
   * @param {Object} productionData - 生产数据
   * @param {Object} options - 计算选项
   * @returns {Object} 生产批量计算结果
   */
  calculateProductionBatchSize(productionData, options = {}) {
    const {
      decimals = 2
    } = options;

    const {
      annualDemand,
      setupCost,
      holdingCostPerUnit,
      dailyProductionRate,
      dailyDemandRate
    } = productionData;

    if (annualDemand <= 0 || setupCost <= 0 || holdingCostPerUnit <= 0) {
      throw new Error('年需求量、设置成本和持有成本必须大于零');
    }

    // 计算经济生产批量(EPL)
    // 公式: √(2 * 年需求量 * 设置成本 / (持有成本 * (1 - 日需求率/日生产率)))
    const productionRatio = 1 - (dailyDemandRate / dailyProductionRate);
    const optimalBatchSize = Math.sqrt((2 * annualDemand * setupCost) / (holdingCostPerUnit * productionRatio));
    
    // 计算相关指标
    const numberofProductionRuns = annualDemand / optimalBatchSize;
    const runTimePerBatch = optimalBatchSize / dailyProductionRate;
    const cycleTime = optimalBatchSize / dailyDemandRate;
    const maxInventory = optimalBatchSize * (1 - dailyDemandRate / dailyProductionRate);
    const averageInventory = maxInventory / 2;
    const totalAnnualSetupCost = numberofProductionRuns * setupCost;
    const totalAnnualHoldingCost = averageInventory * holdingCostPerUnit;
    const totalAnnualCost = totalAnnualSetupCost + totalAnnualHoldingCost;

    return {
      optimalBatchSize: Number(optimalBatchSize.toFixed(decimals)),
      roundedBatchSize: Math.ceil(optimalBatchSize),
      annualDemand: Number(annualDemand.toFixed(decimals)),
      setupCost: Number(setupCost.toFixed(decimals)),
      holdingCostPerUnit: Number(holdingCostPerUnit.toFixed(decimals)),
      dailyProductionRate: Number(dailyProductionRate.toFixed(decimals)),
      dailyDemandRate: Number(dailyDemandRate.toFixed(decimals)),
      numberofProductionRuns: Number(numberofProductionRuns.toFixed(decimals)),
      runTimePerBatch: Number(runTimePerBatch.toFixed(decimals)),
      cycleTime: Number(cycleTime.toFixed(decimals)),
      maxInventory: Number(maxInventory.toFixed(decimals)),
      averageInventory: Number(averageInventory.toFixed(decimals)),
      totalAnnualSetupCost: Number(totalAnnualSetupCost.toFixed(decimals)),
      totalAnnualHoldingCost: Number(totalAnnualHoldingCost.toFixed(decimals)),
      totalAnnualCost: Number(totalAnnualCost.toFixed(decimals))
    };
  }

  /**
   * 计算生产计划的可行性
   * @param {Object} productionPlan - 生产计划
   * @param {Object} resourceConstraints - 资源约束
   * @param {Object} options - 计算选项
   * @returns {Object} 可行性分析结果
   */
  analyzePlanFeasibility(productionPlan, resourceConstraints, options = {}) {
    const {
      decimals = 2,
      criticalThreshold = 90 // 关键资源利用率阈值
    } = options;

    const feasibilityResults = {
      isFeasible: true,
      resourceConflicts: [],
      overallResourceStatus: {},
      criticalResources: []
    };

    // 分析每种资源的约束
    Object.keys(resourceConstraints).forEach(resourceType => {
      const constraint = resourceConstraints[resourceType];
      const plannedUsage = productionPlan[resourceType] || {};
      
      const resourceStatus = {
        type: resourceType,
        constraints: {},
        conflicts: 0
      };

      // 分析时间区间约束
      Object.keys(constraint.timeSlots || {}).forEach(timeSlot => {
        const availableCapacity = constraint.timeSlots[timeSlot];
        const plannedUsageInSlot = plannedUsage[timeSlot] || 0;
        
        const utilization = availableCapacity > 0 ? (plannedUsageInSlot / availableCapacity) * 100 : 0;
        const isOverCapacity = utilization > 100;
        const isCritical = utilization >= criticalThreshold;
        
        if (isOverCapacity) {
          feasibilityResults.isFeasible = false;
          feasibilityResults.resourceConflicts.push({
            resourceType,
            timeSlot,
            availableCapacity,
            plannedUsage: plannedUsageInSlot,
            overCapacity: plannedUsageInSlot - availableCapacity,
            utilization
          });
          
          resourceStatus.conflicts++;
        }
        
        if (isCritical) {
          feasibilityResults.criticalResources.push({
            resourceType,
            timeSlot,
            utilization
          });
        }
        
        resourceStatus.constraints[timeSlot] = {
          availableCapacity: Number(availableCapacity.toFixed(decimals)),
          plannedUsage: Number(plannedUsageInSlot.toFixed(decimals)),
          utilization: Number(utilization.toFixed(decimals)),
          isOverCapacity,
          isCritical
        };
      });

      feasibilityResults.overallResourceStatus[resourceType] = resourceStatus;
    });

    return feasibilityResults;
  }

  /**
   * 计算甘特图数据
   * @param {Array} tasks - 任务列表
   * @param {Object} dependencies - 依赖关系
   * @param {Object} options - 计算选项
   * @returns {Object} 甘特图数据
   */
  calculateGanttData(tasks, dependencies = {}, options = {}) {
    const {
      decimals = 2
    } = options;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error('任务列表不能为空');
    }

    // 构建任务ID映射
    const taskMap = {};
    tasks.forEach(task => {
      taskMap[task.id] = { ...task, start: null, end: null, duration: task.duration || 0 };
    });

    // 计算任务的最早开始时间和最早结束时间
    const calculateEarlyStart = (taskId) => {
      const task = taskMap[taskId];
      if (!task) return 0;
      
      // 如果已经计算过，直接返回
      if (task.start !== null) return task.start;
      
      // 找到所有前置任务
      let earliestStart = 0;
      const predecessors = dependencies[taskId] || [];
      
      predecessors.forEach(predecessorId => {
        const predecessorEnd = calculateEarlyStart(predecessorId) + taskMap[predecessorId].duration;
        earliestStart = Math.max(earliestStart, predecessorEnd);
      });
      
      task.start = earliestStart;
      task.end = earliestStart + task.duration;
      
      return earliestStart;
    };

    // 计算所有任务的开始和结束时间
    Object.keys(taskMap).forEach(taskId => {
      calculateEarlyStart(taskId);
    });

    // 找出项目完成时间
    let projectEndTime = 0;
    Object.values(taskMap).forEach(task => {
      projectEndTime = Math.max(projectEndTime, task.end);
    });

    // 格式化输出
    const ganttTasks = Object.values(taskMap).map(task => ({
      id: task.id,
      name: task.name,
      start: Number(task.start.toFixed(decimals)),
      end: Number(task.end.toFixed(decimals)),
      duration: Number(task.duration.toFixed(decimals)),
      dependencies: dependencies[task.id] || []
    }));

    return {
      tasks: ganttTasks,
      projectDuration: Number(projectEndTime.toFixed(decimals)),
      taskCount: tasks.length
    };
  }

  /**
   * 计算生产效率指标
   * @param {Object} productionMetrics - 生产指标数据
   * @param {Object} options - 计算选项
   * @returns {Object} 生产效率计算结果
   */
  calculateProductionEfficiency(productionMetrics, options = {}) {
    const {
      decimals = 2
    } = options;

    const {
      actualOutput,
      standardOutput,
      actualHours,
      standardHours,
      totalInput,
      totalOutput,
      scrapQuantity
    } = productionMetrics;

    // 计算各种效率指标
    const productivityRate = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0;
    const efficiencyRatio = standardHours > 0 ? (standardHours / actualHours) * 100 : 0;
    const utilizationRatio = standardOutput > 0 ? (actualOutput / standardOutput) * 100 : 0;
    const overallEfficiency = (efficiencyRatio * utilizationRatio) / 100;
    const yieldRate = totalOutput > 0 ? ((totalOutput - scrapQuantity) / totalOutput) * 100 : 0;
    const scrapRate = totalOutput > 0 ? (scrapQuantity / totalOutput) * 100 : 0;

    return {
      productivityRate: Number(productivityRate.toFixed(decimals)),
      efficiencyRatio: Number(efficiencyRatio.toFixed(decimals)),
      utilizationRatio: Number(utilizationRatio.toFixed(decimals)),
      overallEfficiency: Number(overallEfficiency.toFixed(decimals)),
      yieldRate: Number(yieldRate.toFixed(decimals)),
      scrapRate: Number(scrapRate.toFixed(decimals)),
      actualOutput: Number(actualOutput.toFixed(decimals)),
      standardOutput: Number(standardOutput.toFixed(decimals)),
      actualHours: Number(actualHours.toFixed(decimals)),
      standardHours: Number(standardHours.toFixed(decimals)),
      totalInput: Number(totalInput.toFixed(decimals)),
      totalOutput: Number(totalOutput.toFixed(decimals)),
      scrapQuantity: Number(scrapQuantity.toFixed(decimals))
    };
  }
}

// 导出单例实例
const productionScheduler = new ProductionScheduler();
export default productionScheduler;
export { ProductionScheduler };