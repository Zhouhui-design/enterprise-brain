/**
 * 模拟排程服务
 * 用于销售订单的模拟排程计算
 */

import { FiniteCapacityScheduler, SchedulingTask, ProcessStep } from '@/utils/schedulingEngine.js'
import resourceDataService from './resourceDataService.js'

/**
 * 执行模拟排程
 * @param {Object} options - 排程选项
 * @param {string} options.orderId - 订单ID
 * @param {Object} options.orderData - 订单数据
 * @param {boolean} options.excludeSimulatedOrders - 是否排除其他模拟排程订单
 * @returns {Promise<Object>} 排程结果
 */
export async function simulateScheduling(options) {
  const {
    orderId,
    orderData,
    excludeSimulatedOrders = true
  } = options

  try {
    console.log('🔄 开始模拟排程:', orderId)

    // 1. 创建排程引擎实例
    const scheduler = new FiniteCapacityScheduler({
      workingHours: { start: 8, end: 20 },
      workingDays: [1, 2, 3, 4, 5, 6],
      shifts: [
        { id: 'day', name: '白班', start: 8, end: 20 },
        { id: 'night', name: '夜班', start: 20, end: 8 }
      ]
    })

    // 2. 加载所有可用资源
    const equipment = resourceDataService.getAllEquipment() || []
    const workers = resourceDataService.getAllWorkers() || []
    const materials = resourceDataService.getAllMaterials() || []
    const molds = resourceDataService.getAllMolds() || []
    const fixtures = resourceDataService.getAllFixtures() || []

    equipment.forEach(eq => scheduler.addResource(eq))
    workers.forEach(w => scheduler.addWorker(w))
    materials.forEach(m => scheduler.addMaterial(m))
    molds.forEach(mold => scheduler.addMold(mold))
    fixtures.forEach(f => scheduler.addFixture(f))

    console.log('✅ 资源加载完成:', {
      设备: equipment.length,
      人员: workers.length,
      物料: materials.length,
      模具: molds.length,
      夹具: fixtures.length
    })

    // 3. 加载已确认订单（如果排除模拟订单）
    if (excludeSimulatedOrders) {
      const confirmedOrders = await loadConfirmedOrders()
      console.log('✅ 已加载确认订单:', confirmedOrders.length)
      
      // 将已确认订单添加到排程引擎
      for (const order of confirmedOrders) {
        const processes = await convertOrderToProcesses(order)
        processes.forEach(proc => scheduler.addProcess(proc))
      }
    }

    // 4. 根据订单数据生成工序
    const taskProcesses = await generateProcessesFromOrder(orderData)
    
    if (!taskProcesses || taskProcesses.length === 0) {
      throw new Error('无法生成工序，订单数据可能不完整')
    }

    console.log('✅ 生成工序:', taskProcesses.length)

    // 5. 创建排程任务
    const task = new SchedulingTask({
      id: `SIM-${orderId}`,
      orderId: orderId,
      productCode: orderData.productCode || 'UNKNOWN',
      productName: orderData.productName || '未知产品',
      quantity: orderData.orderQuantity || 1,
      dueDate: orderData.promisedDelivery ? new Date(orderData.promisedDelivery) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: calculatePriority(orderData)
    })

    scheduler.addTask(task)
    taskProcesses.forEach(proc => scheduler.addProcess(proc))

    // 6. 执行排程
    console.log('🚀 开始执行排程...')
    const result = await scheduler.schedule('priority')

    if (!result.success) {
      throw new Error(result.message || '排程失败')
    }

    // 7. 计算预计完成日期（最后一道工序的结束时间）
    const lastProcess = result.scheduledTasks.reduce((last, current) => {
      return (!last || current.endTime > last.endTime) ? current : last
    }, null)

    const estimatedCompletionDate = lastProcess 
      ? formatDateTime(new Date(lastProcess.endTime))
      : formatDateTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))

    console.log('✅ 模拟排程完成:', {
      任务数: result.scheduledTasks.length,
      预计完成: estimatedCompletionDate,
      总耗时: result.metrics?.makespan
    })

    // 8. 检查是否超期
    const isOverdue = orderData.promisedDelivery && 
                     new Date(lastProcess.endTime) > new Date(orderData.promisedDelivery)

    return {
      success: true,
      orderId: orderId,
      estimatedCompletionDate: estimatedCompletionDate,
      isOverdue: isOverdue,
      overdueMessage: isOverdue ? '预计完成日期晚于客户交期，可能无法按时交货' : null,
      scheduledTasks: result.scheduledTasks,
      metrics: result.metrics,
      resourceUtilization: result.resourceUtilization,
      warnings: result.warnings || []
    }

  } catch (error) {
    console.error('❌ 模拟排程失败:', error)
    return {
      success: false,
      message: error.message || '模拟排程失败',
      error: error
    }
  }
}

/**
 * 从订单数据生成工序列表
 * @param {Object} orderData - 订单数据
 * @returns {Promise<Array>} 工序列表
 */
async function generateProcessesFromOrder(orderData) {
  try {
    // 尝试从产品编码查找生产BOM
    const productCode = orderData.productCode
    if (!productCode) {
      // 如果没有产品编码，生成默认工序
      return generateDefaultProcesses(orderData)
    }

    // 从生产BOM获取工序信息
    const bomData = await loadProductionBOM(productCode)
    if (bomData && bomData.childItems && bomData.childItems.length > 0) {
      return convertBOMToProcesses(orderData, bomData)
    }

    // 如果没有BOM数据，生成默认工序
    return generateDefaultProcesses(orderData)

  } catch (error) {
    console.error('生成工序失败:', error)
    return generateDefaultProcesses(orderData)
  }
}

/**
 * 生成默认工序（当没有BOM数据时）
 * @param {Object} orderData - 订单数据
 * @returns {Array} 默认工序列表
 */
function generateDefaultProcesses(orderData) {
  const orderId = orderData.id || orderData.internalOrderNo
  const quantity = orderData.orderQuantity || 1

  return [
    new ProcessStep({
      id: `${orderId}-P01`,
      taskId: `SIM-${orderId}`,
      processName: '原料准备',
      processCode: 'P01',
      sequence: 1,
      standardTime: 1.0, // 1分钟/件
      setupTime: 10,
      requiredWorkers: 1,
      requiredSkills: ['物料管理'],
      requiredMachine: [],
      predecessors: []
    }),
    new ProcessStep({
      id: `${orderId}-P02`,
      taskId: `SIM-${orderId}`,
      processName: '生产加工',
      processCode: 'P02',
      sequence: 2,
      standardTime: 5.0, // 5分钟/件
      setupTime: 30,
      requiredWorkers: 1,
      requiredSkills: ['生产'],
      requiredMachine: [],
      predecessors: [`${orderId}-P01`]
    }),
    new ProcessStep({
      id: `${orderId}-P03`,
      taskId: `SIM-${orderId}`,
      processName: '质量检验',
      processCode: 'P03',
      sequence: 3,
      standardTime: 0.5, // 0.5分钟/件
      setupTime: 5,
      requiredWorkers: 1,
      requiredSkills: ['质检'],
      requiredMachine: [],
      predecessors: [`${orderId}-P02`]
    }),
    new ProcessStep({
      id: `${orderId}-P04`,
      taskId: `SIM-${orderId}`,
      processName: '包装入库',
      processCode: 'P04',
      sequence: 4,
      standardTime: 0.5, // 0.5分钟/件
      setupTime: 10,
      requiredWorkers: 1,
      requiredSkills: ['包装'],
      requiredMachine: [],
      predecessors: [`${orderId}-P03`]
    })
  ]
}

/**
 * 从生产BOM转换为工序列表
 * @param {Object} orderData - 订单数据
 * @param {Object} bomData - BOM数据
 * @returns {Array} 工序列表
 */
function convertBOMToProcesses(orderData, bomData) {
  const orderId = orderData.id || orderData.internalOrderNo
  const processes = []
  
  // 根据BOM子件的产出工序生成工序
  const uniqueProcesses = new Map()
  
  bomData.childItems.forEach((item, index) => {
    const processName = item.outputProcess || '生产加工'
    if (!uniqueProcesses.has(processName)) {
      uniqueProcesses.set(processName, {
        name: processName,
        level: item.level || 1,
        standardTime: item.quotaTime || 1.0,
        items: []
      })
    }
    uniqueProcesses.get(processName).items.push(item)
  })

  // 转换为ProcessStep数组
  let sequence = 1
  const processArray = Array.from(uniqueProcesses.values()).sort((a, b) => a.level - b.level)
  
  processArray.forEach((proc, index) => {
    const predecessors = index > 0 ? [`${orderId}-P${String(index).padStart(2, '0')}`] : []
    
    processes.push(new ProcessStep({
      id: `${orderId}-P${String(sequence).padStart(2, '0')}`,
      taskId: `SIM-${orderId}`,
      processName: proc.name,
      processCode: `P${String(sequence).padStart(2, '0')}`,
      sequence: sequence,
      standardTime: proc.standardTime,
      setupTime: 10,
      requiredWorkers: 1,
      requiredSkills: [proc.name],
      requiredMachine: [],
      predecessors: predecessors
    }))
    
    sequence++
  })

  return processes
}

/**
 * 加载已确认订单
 * @returns {Promise<Array>} 已确认订单列表
 */
async function loadConfirmedOrders() {
  try {
    // 从localStorage或API加载已确认订单
    const storedOrders = localStorage.getItem('salesOrderData')
    if (!storedOrders) {
      return []
    }

    const allOrders = JSON.parse(storedOrders)
    // 只返回已确认下单的订单（排除草稿、待下单、已模拟排程待下单）
    return allOrders.filter(order => {
      const status = order.orderStatus || order.status
      return status !== '草稿' && 
             status !== '待下单' && 
             status !== '已模拟排程待下单' &&
             status !== 'draft'
    })
  } catch (error) {
    console.error('加载已确认订单失败:', error)
    return []
  }
}

/**
 * 将订单转换为工序
 * @param {Object} order - 订单数据
 * @returns {Promise<Array>} 工序列表
 */
async function convertOrderToProcesses(order) {
  return generateProcessesFromOrder(order)
}

/**
 * 加载生产BOM
 * @param {string} productCode - 产品编码
 * @returns {Promise<Object>} BOM数据
 */
async function loadProductionBOM(productCode) {
  try {
    // 从localStorage加载生产BOM数据
    const storedBOMs = localStorage.getItem('productionBoms')
    if (!storedBOMs) {
      return null
    }

    const allBOMs = JSON.parse(storedBOMs)
    return allBOMs.find(bom => bom.productCode === productCode)
  } catch (error) {
    console.error('加载生产BOM失败:', error)
    return null
  }
}

/**
 * 计算订单优先级
 * @param {Object} orderData - 订单数据
 * @returns {number} 优先级 (1-10, 1最高)
 */
function calculatePriority(orderData) {
  // 根据客户交期计算优先级
  if (!orderData.promisedDelivery) {
    return 5 // 默认中等优先级
  }

  const dueDate = new Date(orderData.promisedDelivery)
  const now = new Date()
  const daysUntilDue = Math.floor((dueDate - now) / (24 * 60 * 60 * 1000))

  if (daysUntilDue <= 3) return 1  // 3天内 - 最高优先级
  if (daysUntilDue <= 7) return 2  // 7天内 - 高优先级
  if (daysUntilDue <= 14) return 3 // 14天内 - 较高优先级
  if (daysUntilDue <= 30) return 5 // 30天内 - 中等优先级
  return 7 // 30天以上 - 较低优先级
}

/**
 * 格式化日期时间
 * @param {Date} date - 日期对象
 * @returns {string} 格式化的日期时间字符串
 */
function formatDateTime(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export default {
  simulateScheduling
}
