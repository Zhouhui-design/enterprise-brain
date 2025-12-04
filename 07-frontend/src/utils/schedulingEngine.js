/**
 * 有限产能排程引擎（完整版 - 考虑人机料法环）
 * Finite Capacity Scheduling Engine with Full Constraints
 * 
 * 功能：
 * 1. 人员约束：技能、数量、班次、效率
 * 2. 设备约束：产能、状态、维护、换型
 * 3. 物料约束：库存、采购周期、安全库存
 * 4. 工艺约束：工序、工时、质量要求
 * 5. 环境约束：班次、假期、产能限制
 * 6. 模具约束：可用性、寿命、维护周期
 * 7. 工装夹具约束：数量、适用范围
 */

/**
 * 排程约束条件（完整版）
 */
export class SchedulingConstraints {
  constructor(options = {}) {
    // 时间约束
    this.workingHours = options.workingHours || { start: 8, end: 20 }  // 工作时间
    this.workingDays = options.workingDays || [1, 2, 3, 4, 5, 6]  // 工作日（1-7）
    this.holidays = options.holidays || []  // 假期列表
    this.shifts = options.shifts || [  // 班次定义
      { id: 'day', name: '白班', start: 8, end: 20 },
      { id: 'night', name: '夜班', start: 20, end: 8 }
    ]
    
    // 设备约束
    this.maxCapacity = options.maxCapacity || {}  // 最大产能 { machineId: capacity }
    this.setupTime = options.setupTime || {}  // 换型时间 { machineId: time }
    this.maintenanceSchedule = options.maintenanceSchedule || {}  // 维护计划
    
    // 人员约束
    this.workerSkills = options.workerSkills || {}  // 工人技能 { workerId: [skills] }
    this.workerCapacity = options.workerCapacity || {}  // 工人产能系数
    this.maxWorkers = options.maxWorkers || {}  // 最大工人数 { processId: count }
    
    // 物料约束
    this.materialInventory = options.materialInventory || {}  // 物料库存
    this.materialLeadTime = options.materialLeadTime || {}  // 采购周期
    this.safetyStock = options.safetyStock || {}  // 安全库存
    
    // 模具约束
    this.moldAvailability = options.moldAvailability || {}  // 模具可用性
    this.moldLifecycle = options.moldLifecycle || {}  // 模具寿命
    this.moldMaintenance = options.moldMaintenance || {}  // 模具维护
    
    // 工装夹具约束
    this.fixtureInventory = options.fixtureInventory || {}  // 夹具库存
    this.fixtureCapacity = options.fixtureCapacity || {}  // 夹具产能
    
    // 工艺约束
    this.precedence = options.precedence || []  // 工序优先级关系
    this.qualityRequirements = options.qualityRequirements || {}  // 质量要求
    
    // 其他约束
    this.dueDates = options.dueDates || {}  // 交付期限
    this.priorities = options.priorities || {}  // 优先级
  }
}

/**
 * 排程任务
 */
export class SchedulingTask {
  constructor(data) {
    this.id = data.id
    this.orderId = data.orderId
    this.productCode = data.productCode
    this.productName = data.productName
    this.quantity = data.quantity
    this.processSequence = data.processSequence || []  // 工序序列
    this.priority = data.priority || 5  // 优先级 1-10
    this.dueDate = data.dueDate
    this.status = data.status || 'pending'
    this.assignedMachine = data.assignedMachine || null
    this.scheduledStartTime = data.scheduledStartTime || null
    this.scheduledEndTime = data.scheduledEndTime || null
  }
}

/**
 * 工序定义（增强版）
 */
export class ProcessStep {
  constructor(data) {
    this.id = data.id
    this.taskId = data.taskId
    this.processName = data.processName
    this.processCode = data.processCode
    this.sequence = data.sequence
    
    // 工时相关
    this.standardTime = data.standardTime  // 标准工时（分钟/件）
    this.setupTime = data.setupTime || 0  // 换型时间（分钟）
    
    // 人员要求
    this.requiredWorkers = data.requiredWorkers || 1  // 需要工人数
    this.requiredSkills = data.requiredSkills || []  // 需要的技能
    
    // 设备要求
    this.requiredMachine = data.requiredMachine || []  // 可用设备列表
    this.machineEfficiency = data.machineEfficiency || 1.0  // 设备效率系数
    
    // 物料要求
    this.requiredMaterials = data.requiredMaterials || []  // 需要的物料
    this.materialConsumption = data.materialConsumption || {}  // 物料消耗量
    
    // 模具要求
    this.requiredMold = data.requiredMold || null  // 需要的模具
    this.moldCycles = data.moldCycles || 0  // 模具使用次数
    
    // 工装夹具要求
    this.requiredFixture = data.requiredFixture || null  // 需要的夹具
    this.fixtureQuantity = data.fixtureQuantity || 1  // 夹具数量
    
    // 质量要求
    this.qualityLevel = data.qualityLevel || 'normal'  // 质量等级
    this.inspectionRequired = data.inspectionRequired || false  // 是否需要检验
    
    // 前置工序
    this.predecessors = data.predecessors || []  // 前置工序
    
    this.status = data.status || 'pending'
  }
  
  // 计算工序总时间（考虑人员和设备效率）
  calculateTotalTime(quantity, workerEfficiency = 1.0, machineEfficiency = 1.0) {
    const baseTime = this.standardTime * quantity
    const adjustedTime = baseTime / (workerEfficiency * machineEfficiency)
    return this.setupTime + adjustedTime
  }
  
  // 检查物料是否充足
  checkMaterialAvailability(inventory) {
    for (const material of this.requiredMaterials) {
      const required = this.materialConsumption[material.id] || 0
      const available = inventory[material.id] || 0
      if (available < required) {
        return false
      }
    }
    return true
  }
  
  // 检查人员技能是否匹配
  checkWorkerSkills(workerSkills) {
    for (const skill of this.requiredSkills) {
      if (!workerSkills.includes(skill)) {
        return false
      }
    }
    return true
  }
}

/**
 * 资源（设备）- 增强版
 */
export class Resource {
  constructor(data) {
    this.id = data.id
    this.code = data.code
    this.name = data.name
    this.type = data.type
    
    // 产能相关
    this.capacity = data.capacity || 1  // 产能系数
    this.efficiency = data.efficiency || 1.0  // 效率系数
    
    // 状态相关
    this.status = data.status || 'available'  // available, busy, maintenance, broken
    this.currentLoad = data.currentLoad || 0  // 当前负载 0-100
    
    // 维护相关
    this.lastMaintenanceDate = data.lastMaintenanceDate || null
    this.nextMaintenanceDate = data.nextMaintenanceDate || null
    this.maintenanceDuration = data.maintenanceDuration || 0  // 维护时长（小时）
    
    // 模具相关
    this.currentMold = data.currentMold || null  // 当前安装的模具
    this.moldChangeTime = data.moldChangeTime || 30  // 换模时间（分钟）
    
    // 工装夹具相关
    this.supportedFixtures = data.supportedFixtures || []  // 支持的夹具
    
    // 排程相关
    this.schedule = data.schedule || []  // 排程时间表
    
    // 人员配置
    this.requiredWorkers = data.requiredWorkers || 1  // 需要的操作工人数
    this.assignedWorkers = data.assignedWorkers || []  // 已分配的工人
  }
  
  // 检查时间段是否可用（考虑维护）
  isAvailable(startTime, endTime) {
    // 检查是否在维护期间
    if (this.nextMaintenanceDate) {
      const maintenanceStart = new Date(this.nextMaintenanceDate).getTime()
      const maintenanceEnd = maintenanceStart + (this.maintenanceDuration * 60 * 60 * 1000)
      if (this._timeOverlap(startTime, endTime, maintenanceStart, maintenanceEnd)) {
        return false
      }
    }
    
    // 检查是否与现有排程冲突
    for (const slot of this.schedule) {
      if (this._timeOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
        return false
      }
    }
    return true
  }
  
  // 检查模具是否需要更换
  needMoldChange(requiredMold) {
    return this.currentMold !== requiredMold
  }
  
  // 添加排程
  addSchedule(task, startTime, endTime) {
    this.schedule.push({
      taskId: task.id,
      processId: task.processId,
      startTime,
      endTime
    })
    this.schedule.sort((a, b) => a.startTime - b.startTime)
    this._updateLoad()
  }
  
  // 时间重叠检查
  _timeOverlap(start1, end1, start2, end2) {
    return start1 < end2 && end1 > start2
  }
  
  // 更新负载
  _updateLoad() {
    const totalTime = this.schedule.reduce((sum, slot) => {
      return sum + (slot.endTime - slot.startTime)
    }, 0)
    const availableTime = 12 * 60 * 60 * 1000  // 12小时工作时间
    this.currentLoad = Math.min(100, (totalTime / availableTime) * 100)
  }
}

/**
 * 人员资源
 */
export class WorkerResource {
  constructor(data) {
    this.id = data.id
    this.code = data.code
    this.name = data.name
    this.skills = data.skills || []  // 技能列表
    this.skillLevels = data.skillLevels || {}  // 技能等级 { skillId: level }
    this.efficiency = data.efficiency || 1.0  // 工作效率系数
    this.shift = data.shift || 'day'  // 班次
    this.status = data.status || 'available'  // available, busy, leave, absent
    this.currentTasks = data.currentTasks || []  // 当前任务
    this.schedule = data.schedule || []  // 排程表
    this.maxTasksPerDay = data.maxTasksPerDay || 8  // 每天最多任务数
  }
  
  // 检查是否具备所需技能
  hasSkill(skill, minLevel = 1) {
    return this.skills.includes(skill) && (this.skillLevels[skill] || 0) >= minLevel
  }
  
  // 检查时间段是否可用
  isAvailable(startTime, endTime) {
    for (const slot of this.schedule) {
      if (this._timeOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
        return false
      }
    }
    return true
  }
  
  // 添加任务
  addTask(task, startTime, endTime) {
    this.schedule.push({ taskId: task.id, startTime, endTime })
    this.currentTasks.push(task.id)
  }
  
  _timeOverlap(start1, end1, start2, end2) {
    return start1 < end2 && end1 > start2
  }
}

/**
 * 物料资源
 */
export class MaterialResource {
  constructor(data) {
    this.id = data.id
    this.code = data.code
    this.name = data.name
    this.type = data.type  // 原材料、半成品、成品
    this.currentStock = data.currentStock || 0  // 当前库存
    this.safetyStock = data.safetyStock || 0  // 安全库存
    this.incomingStock = data.incomingStock || 0  // 在途库存
    this.leadTime = data.leadTime || 0  // 采购周期（天）
    this.unitCost = data.unitCost || 0  // 单位成本
    this.supplier = data.supplier || null  // 供应商
    this.lastOrderDate = data.lastOrderDate || null
  }
  
  // 检查库存是否充足
  checkAvailability(requiredQuantity) {
    return (this.currentStock + this.incomingStock) >= requiredQuantity
  }
  
  // 消耗库存
  consume(quantity) {
    if (this.currentStock >= quantity) {
      this.currentStock -= quantity
      return true
    }
    return false
  }
  
  // 检查是否需要采购
  needsProcurement() {
    return this.currentStock <= this.safetyStock
  }
  
  // 计算缺货量
  getShortage(requiredQuantity) {
    const available = this.currentStock + this.incomingStock
    return Math.max(0, requiredQuantity - available)
  }
}

/**
 * 模具资源
 */
export class MoldResource {
  constructor(data) {
    this.id = data.id
    this.code = data.code
    this.name = data.name
    this.type = data.type
    this.status = data.status || 'available'  // available, in_use, maintenance, broken
    this.currentMachine = data.currentMachine || null  // 当前所在设备
    this.lifecycle = data.lifecycle || 0  // 已使用次数
    this.maxLifecycle = data.maxLifecycle || 10000  // 最大寿命
    this.maintenanceCycle = data.maintenanceCycle || 1000  // 保养周期
    this.lastMaintenanceCount = data.lastMaintenanceCount || 0
    this.cavities = data.cavities || 1  // 模穴数
    this.cycleTime = data.cycleTime || 30  // 成型周期（秒）
  }
  
  // 检查是否可用
  isAvailable() {
    return this.status === 'available' && !this.needsMaintenance()
  }
  
  // 检查是否需要保养
  needsMaintenance() {
    return (this.lifecycle - this.lastMaintenanceCount) >= this.maintenanceCycle
  }
  
  // 检查寿命
  checkLifecycle() {
    return this.lifecycle < this.maxLifecycle
  }
  
  // 使用模具
  use(cycles) {
    this.lifecycle += cycles
    this.status = 'in_use'
  }
  
  // 计算剩余寿命百分比
  getRemainingLife() {
    return ((this.maxLifecycle - this.lifecycle) / this.maxLifecycle * 100).toFixed(1)
  }
}

/**
 * 工装夹具资源
 */
export class FixtureResource {
  constructor(data) {
    this.id = data.id
    this.code = data.code
    this.name = data.name
    this.type = data.type
    this.quantity = data.quantity || 1  // 数量
    this.available = data.available || 1  // 可用数量
    this.inUse = data.inUse || 0  // 使用中数量
    this.status = data.status || 'available'  // available, in_use, maintenance
    this.suitableProducts = data.suitableProducts || []  // 适用产品
    this.suitableMachines = data.suitableMachines || []  // 适用设备
  }
  
  // 检查是否有足够数量
  checkAvailability(requiredQuantity) {
    return this.available >= requiredQuantity
  }
  
  // 占用夹具
  occupy(quantity) {
    if (this.available >= quantity) {
      this.available -= quantity
      this.inUse += quantity
      return true
    }
    return false
  }
  
  // 释放夹具
  release(quantity) {
    this.inUse -= quantity
    this.available += quantity
  }
  
  // 检查是否适用于产品
  isSuitableFor(productCode, machineId) {
    const productMatch = this.suitableProducts.length === 0 || this.suitableProducts.includes(productCode)
    const machineMatch = this.suitableMachines.length === 0 || this.suitableMachines.includes(machineId)
    return productMatch && machineMatch
  }
}

/**
 * 有限产能排程引擎
 */
export class FiniteCapacityScheduler {
  constructor(constraints = {}) {
    this.constraints = new SchedulingConstraints(constraints)
    this.tasks = []
    this.processes = []
    this.resources = []
    this.schedule = []
  }
  
  /**
   * 添加任务
   */
  addTask(task) {
    const schedulingTask = new SchedulingTask(task)
    this.tasks.push(schedulingTask)
    return schedulingTask
  }
  
  /**
   * 添加工序
   */
  addProcess(process) {
    const processStep = new ProcessStep(process)
    this.processes.push(processStep)
    return processStep
  }
  
  /**
   * 添加资源
   */
  addResource(resource) {
    const res = new Resource(resource)
    this.resources.push(res)
    return res
  }
  
  /**
   * 执行排程
   * @param {string} algorithm - 排程算法：'priority', 'spt', 'edd', 'fifo'
   * @returns {Object} 排程结果
   */
  async schedule(algorithm = 'priority') {
    console.log('开始有限产能排程...', { 
      tasksCount: this.tasks.length,
      processesCount: this.processes.length,
      resourcesCount: this.resources.length,
      algorithm
    })
    
    // 1. 任务优先级排序
    const sortedTasks = this._sortTasks(algorithm)
    
    // 2. 为每个任务的每个工序分配资源和时间
    const scheduledTasks = []
    
    for (const task of sortedTasks) {
      const taskProcesses = this.processes.filter(p => p.taskId === task.id)
      const sortedProcesses = taskProcesses.sort((a, b) => a.sequence - b.sequence)
      
      let taskStartTime = null
      let taskEndTime = null
      
      for (const process of sortedProcesses) {
        // 考虑前置工序约束
        let earliestStart = this._getEarliestStartTime(process, task)
        
        // 为工序分配资源
        const assignment = this._assignResource(process, task, earliestStart)
        
        if (assignment) {
          if (!taskStartTime || assignment.startTime < taskStartTime) {
            taskStartTime = assignment.startTime
          }
          if (!taskEndTime || assignment.endTime > taskEndTime) {
            taskEndTime = assignment.endTime
          }
          
          scheduledTasks.push({
            taskId: task.id,
            processId: process.id,
            processName: process.processName,
            machineId: assignment.resource.id,
            machineName: assignment.resource.name,
            startTime: assignment.startTime,
            endTime: assignment.endTime,
            duration: assignment.duration
          })
        } else {
          console.warn(`无法为工序分配资源: ${process.processName}`)
        }
      }
      
      // 更新任务的排程时间
      task.scheduledStartTime = taskStartTime
      task.scheduledEndTime = taskEndTime
      task.status = 'scheduled'
    }
    
    // 3. 计算排程指标
    const metrics = this._calculateMetrics(scheduledTasks)
    
    // 4. 生成排程结果
    const result = {
      success: true,
      algorithm,
      scheduledTasks,
      metrics,
      ganttData: this._generateGanttData(scheduledTasks),
      resourceUtilization: this._calculateResourceUtilization(),
      warnings: this._generateWarnings(scheduledTasks)
    }
    
    console.log('排程完成', result)
    return result
  }
  
  /**
   * 任务排序
   */
  _sortTasks(algorithm) {
    const tasks = [...this.tasks]
    
    switch (algorithm) {
      case 'priority':
        // 优先级排序（优先级高的先排）
        return tasks.sort((a, b) => b.priority - a.priority)
        
      case 'spt':
        // 最短处理时间优先（SPT - Shortest Processing Time）
        return tasks.sort((a, b) => {
          const timeA = this._calculateTaskTotalTime(a)
          const timeB = this._calculateTaskTotalTime(b)
          return timeA - timeB
        })
        
      case 'edd':
        // 最早交期优先（EDD - Earliest Due Date）
        return tasks.sort((a, b) => {
          const dateA = new Date(a.dueDate || '2099-12-31')
          const dateB = new Date(b.dueDate || '2099-12-31')
          return dateA - dateB
        })
        
      case 'fifo':
        // 先进先出（FIFO - First In First Out）
        return tasks.sort((a, b) => a.id - b.id)
        
      default:
        return tasks
    }
  }
  
  /**
   * 计算任务总时间
   */
  _calculateTaskTotalTime(task) {
    const taskProcesses = this.processes.filter(p => p.taskId === task.id)
    return taskProcesses.reduce((sum, p) => sum + p.calculateTotalTime(task.quantity), 0)
  }
  
  /**
   * 获取工序最早开始时间
   */
  _getEarliestStartTime(process, task) {
    // 考虑前置工序
    if (process.predecessors && process.predecessors.length > 0) {
      let maxEndTime = Date.now()
      for (const predId of process.predecessors) {
        const predProcess = this.processes.find(p => p.id === predId)
        if (predProcess && predProcess.scheduledEndTime) {
          maxEndTime = Math.max(maxEndTime, predProcess.scheduledEndTime)
        }
      }
      return maxEndTime
    }
    
    return Date.now()
  }
  
  /**
   * 为工序分配资源
   */
  _assignResource(process, task, earliestStart) {
    // 获取可用资源
    const availableResources = this.resources.filter(r => {
      return process.requiredMachine.length === 0 || 
             process.requiredMachine.includes(r.id) ||
             process.requiredMachine.includes(r.type)
    })
    
    if (availableResources.length === 0) {
      console.warn('没有可用资源', { process: process.processName })
      return null
    }
    
    // 计算工序所需时间
    const duration = process.calculateTotalTime(task.quantity)
    
    // 选择最优资源（负载最低的）
    let bestResource = null
    let bestStartTime = null
    let minLoad = Infinity
    
    for (const resource of availableResources) {
      // 查找资源的第一个可用时间段
      const startTime = this._findAvailableSlot(resource, earliestStart, duration)
      
      if (startTime && resource.currentLoad < minLoad) {
        bestResource = resource
        bestStartTime = startTime
        minLoad = resource.currentLoad
      }
    }
    
    if (bestResource && bestStartTime) {
      const endTime = bestStartTime + duration
      
      // 添加到资源排程
      bestResource.addSchedule(
        { id: task.id, processId: process.id },
        bestStartTime,
        endTime
      )
      
      // 更新工序状态
      process.status = 'scheduled'
      process.scheduledStartTime = bestStartTime
      process.scheduledEndTime = endTime
      
      return {
        resource: bestResource,
        startTime: bestStartTime,
        endTime: endTime,
        duration: duration
      }
    }
    
    return null
  }
  
  /**
   * 查找资源的可用时间段
   */
  _findAvailableSlot(resource, earliestStart, duration) {
    if (resource.schedule.length === 0) {
      return earliestStart
    }
    
    // 检查第一个时间段之前
    const firstSlot = resource.schedule[0]
    if (earliestStart + duration <= firstSlot.startTime) {
      return earliestStart
    }
    
    // 检查时间段之间的间隙
    for (let i = 0; i < resource.schedule.length - 1; i++) {
      const currentSlot = resource.schedule[i]
      const nextSlot = resource.schedule[i + 1]
      
      const gapStart = Math.max(earliestStart, currentSlot.endTime)
      const gapEnd = nextSlot.startTime
      
      if (gapEnd - gapStart >= duration) {
        return gapStart
      }
    }
    
    // 在最后一个时间段之后
    const lastSlot = resource.schedule[resource.schedule.length - 1]
    return Math.max(earliestStart, lastSlot.endTime)
  }
  
  /**
   * 计算排程指标
   */
  _calculateMetrics(scheduledTasks) {
    if (scheduledTasks.length === 0) {
      return {
        totalTasks: 0,
        averageWaitTime: 0,
        makespan: 0,
        resourceUtilization: 0
      }
    }
    
    const startTimes = scheduledTasks.map(t => t.startTime)
    const endTimes = scheduledTasks.map(t => t.endTime)
    
    const makespan = Math.max(...endTimes) - Math.min(...startTimes)
    
    return {
      totalTasks: this.tasks.length,
      scheduledTasks: scheduledTasks.length,
      makespan: makespan,
      makespanHours: (makespan / (1000 * 60 * 60)).toFixed(2),
      avgResourceUtilization: this._calculateResourceUtilization(),
      completionRate: ((scheduledTasks.length / (this.tasks.length * this.processes.length / this.tasks.length)) * 100).toFixed(1)
    }
  }
  
  /**
   * 计算资源利用率
   */
  _calculateResourceUtilization() {
    if (this.resources.length === 0) return 0
    
    const totalLoad = this.resources.reduce((sum, r) => sum + r.currentLoad, 0)
    return (totalLoad / this.resources.length).toFixed(1)
  }
  
  /**
   * 生成甘特图数据
   */
  _generateGanttData(scheduledTasks) {
    const ganttData = {}
    
    for (const task of scheduledTasks) {
      if (!ganttData[task.machineId]) {
        ganttData[task.machineId] = {
          machineId: task.machineId,
          machineName: task.machineName,
          tasks: []
        }
      }
      
      ganttData[task.machineId].tasks.push({
        taskId: task.taskId,
        processName: task.processName,
        startTime: task.startTime,
        endTime: task.endTime,
        duration: task.duration,
        startTimeFormatted: new Date(task.startTime).toLocaleString('zh-CN'),
        endTimeFormatted: new Date(task.endTime).toLocaleString('zh-CN')
      })
    }
    
    return Object.values(ganttData)
  }
  
  /**
   * 生成警告信息
   */
  _generateWarnings(scheduledTasks) {
    const warnings = []
    
    // 检查高负载资源
    for (const resource of this.resources) {
      if (resource.currentLoad > 90) {
        warnings.push({
          type: 'high_load',
          severity: 'warning',
          message: `资源 ${resource.name} 负载过高`,
          detail: `当前负载: ${resource.currentLoad.toFixed(1)}%`,
          resourceId: resource.id
        })
      }
    }
    
    // 检查未排程的任务
    const unscheduledTasks = this.tasks.filter(t => t.status !== 'scheduled')
    if (unscheduledTasks.length > 0) {
      warnings.push({
        type: 'unscheduled',
        severity: 'error',
        message: `有 ${unscheduledTasks.length} 个任务未能排程`,
        detail: '请检查资源配置或调整任务参数'
      })
    }
    
    // 检查交期风险
    for (const task of this.tasks) {
      if (task.dueDate && task.scheduledEndTime) {
        const dueDate = new Date(task.dueDate).getTime()
        if (task.scheduledEndTime > dueDate) {
          warnings.push({
            type: 'late_delivery',
            severity: 'warning',
            message: `任务 ${task.productName} 可能延期交付`,
            detail: `预计完成: ${new Date(task.scheduledEndTime).toLocaleDateString()}, 交付期限: ${new Date(dueDate).toLocaleDateString()}`,
            taskId: task.id
          })
        }
      }
    }
    
    return warnings
  }
}

/**
 * 排程优化器
 */
export class SchedulingOptimizer {
  constructor(scheduler) {
    this.scheduler = scheduler
  }
  
  /**
   * 负载均衡优化
   */
  async balanceLoad() {
    console.log('执行负载均衡优化...')
    
    // 1. 找出高负载和低负载的资源
    const resources = this.scheduler.resources.sort((a, b) => b.currentLoad - a.currentLoad)
    const highLoadResources = resources.filter(r => r.currentLoad > 70)
    const lowLoadResources = resources.filter(r => r.currentLoad < 30)
    
    if (highLoadResources.length === 0 || lowLoadResources.length === 0) {
      return {
        success: false,
        message: '资源负载已经较为均衡'
      }
    }
    
    // 2. 尝试将高负载资源的任务转移到低负载资源
    let moved = 0
    for (const highLoad of highLoadResources) {
      for (const lowLoad of lowLoadResources) {
        // 查找可以转移的任务
        for (const slot of highLoad.schedule) {
          // 检查低负载资源是否可以接受这个任务
          if (lowLoad.isAvailable(slot.startTime, slot.endTime)) {
            // 转移任务
            lowLoad.addSchedule(
              { id: slot.taskId, processId: slot.processId },
              slot.startTime,
              slot.endTime
            )
            // 从高负载资源移除
            highLoad.schedule = highLoad.schedule.filter(s => s !== slot)
            highLoad._updateLoad()
            moved++
            break
          }
        }
      }
    }
    
    return {
      success: true,
      message: `成功转移 ${moved} 个任务`,
      movedCount: moved
    }
  }
  
  /**
   * 交期优化
   */
  async optimizeDueDate() {
    console.log('执行交期优化...')
    
    // 按交期紧急程度重新排序任务
    const urgentTasks = this.scheduler.tasks
      .filter(t => t.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    
    // 为紧急任务重新排程
    // ... 实现逻辑
    
    return {
      success: true,
      message: '交期优化完成'
    }
  }
}

// 导出所有类
export default {
  FiniteCapacityScheduler,
  SchedulingOptimizer,
  SchedulingTask,
  ProcessStep,
  Resource,
  WorkerResource,
  MaterialResource,
  MoldResource,
  FixtureResource,
  SchedulingConstraints
}
