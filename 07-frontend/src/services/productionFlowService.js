/**
 * 生产流程数据联动服务
 * 实现：排程 → 派工 → 报工 数据流转
 */

import { ElMessage } from 'element-plus'

/**
 * 生产流程状态
 */
export const ProductionFlowStatus = {
  SCHEDULED: 'scheduled',      // 已排程
  DISPATCHED: 'dispatched',    // 已派工
  IN_PROGRESS: 'in_progress',  // 进行中
  COMPLETED: 'completed',      // 已完成
  PAUSED: 'paused',            // 已暂停
  CANCELLED: 'cancelled'       // 已取消
}

/**
 * 生产流程数据联动服务
 */
class ProductionFlowService {
  constructor() {
    this.scheduleData = []    // 排程数据
    this.dispatchData = []    // 派工数据
    this.reportData = []      // 报工数据
    this.listeners = []       // 事件监听器
  }

  /**
   * 1. 排程 → 派工
   * 将排程结果推送到派工系统
   */
  async pushScheduleToDispatch(scheduleResult) {
    console.log('推送排程数据到派工系统', scheduleResult)
    
    try {
      const dispatchTasks = []
      
      // 将排程结果转换为派工任务
      for (const task of scheduleResult.scheduledTasks) {
        const dispatchTask = {
          id: `DIS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          scheduleId: task.taskId,
          processId: task.processId,
          processName: task.processName,
          machineId: task.machineId,
          machineName: task.machineName,
          scheduledStartTime: task.startTime,
          scheduledEndTime: task.endTime,
          estimatedDuration: task.duration,
          status: ProductionFlowStatus.SCHEDULED,
          priority: this._calculatePriority(task),
          createTime: new Date().toISOString(),
          // 默认未分配工人
          assignedWorkers: [],
          // 工单信息
          workOrderCode: `WO-${Date.now()}`,
          // 待派工状态
          dispatchStatus: 'pending'
        }
        
        dispatchTasks.push(dispatchTask)
      }
      
      // 保存派工任务
      this.dispatchData.push(...dispatchTasks)
      
      // 触发派工数据更新事件
      this._emit('dispatch:updated', dispatchTasks)
      
      ElMessage.success(`成功推送 ${dispatchTasks.length} 个派工任务`)
      
      return {
        success: true,
        data: dispatchTasks,
        count: dispatchTasks.length
      }
      
    } catch (error) {
      console.error('推送排程数据失败:', error)
      ElMessage.error('推送排程数据失败')
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 2. 派工 → 报工
   * 将派工任务推送到报工系统
   */
  async pushDispatchToReport(dispatchTask) {
    console.log('推送派工数据到报工系统', dispatchTask)
    
    try {
      // 更新派工状态为已派工
      dispatchTask.status = ProductionFlowStatus.DISPATCHED
      dispatchTask.dispatchStatus = 'dispatched'
      dispatchTask.dispatchTime = new Date().toISOString()
      
      // 创建报工记录
      const reportRecord = {
        id: `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dispatchId: dispatchTask.id,
        scheduleId: dispatchTask.scheduleId,
        processId: dispatchTask.processId,
        processName: dispatchTask.processName,
        machineId: dispatchTask.machineId,
        machineName: dispatchTask.machineName,
        workOrderCode: dispatchTask.workOrderCode,
        assignedWorkers: dispatchTask.assignedWorkers,
        
        // 计划时间
        plannedStartTime: dispatchTask.scheduledStartTime,
        plannedEndTime: dispatchTask.scheduledEndTime,
        plannedDuration: dispatchTask.estimatedDuration,
        
        // 实际时间（初始为空）
        actualStartTime: null,
        actualEndTime: null,
        actualDuration: null,
        
        // 生产数量
        plannedQuantity: dispatchTask.quantity || 0,
        completedQuantity: 0,
        qualifiedQuantity: 0,
        defectQuantity: 0,
        
        // 报工状态
        reportStatus: 'not_started',
        status: ProductionFlowStatus.DISPATCHED,
        
        // 质量信息
        qualityCheckStatus: 'pending',
        qualityRemarks: '',
        
        // 异常信息
        hasException: false,
        exceptionRemarks: '',
        
        createTime: new Date().toISOString()
      }
      
      // 保存报工记录
      this.reportData.push(reportRecord)
      
      // 触发报工数据更新事件
      this._emit('report:created', reportRecord)
      
      ElMessage.success('派工任务已推送到报工系统')
      
      return {
        success: true,
        data: reportRecord
      }
      
    } catch (error) {
      console.error('推送派工数据失败:', error)
      ElMessage.error('推送派工数据失败')
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 3. 报工 → 反馈更新
   * 报工完成后更新排程和派工状态
   */
  async completeReport(reportId, reportData) {
    console.log('完成报工并更新状态', { reportId, reportData })
    
    try {
      // 查找报工记录
      const report = this.reportData.find(r => r.id === reportId)
      if (!report) {
        throw new Error('报工记录不存在')
      }
      
      // 更新报工数据
      Object.assign(report, {
        actualStartTime: reportData.actualStartTime || report.actualStartTime,
        actualEndTime: reportData.actualEndTime || new Date().toISOString(),
        actualDuration: reportData.actualDuration,
        completedQuantity: reportData.completedQuantity,
        qualifiedQuantity: reportData.qualifiedQuantity,
        defectQuantity: reportData.defectQuantity,
        reportStatus: 'completed',
        status: ProductionFlowStatus.COMPLETED,
        qualityCheckStatus: reportData.qualityCheckStatus || 'passed',
        qualityRemarks: reportData.qualityRemarks || '',
        updateTime: new Date().toISOString()
      })
      
      // 更新派工状态
      const dispatch = this.dispatchData.find(d => d.id === report.dispatchId)
      if (dispatch) {
        dispatch.status = ProductionFlowStatus.COMPLETED
        dispatch.completeTime = new Date().toISOString()
        dispatch.actualDuration = report.actualDuration
        dispatch.completedQuantity = report.completedQuantity
      }
      
      // 触发完成事件
      this._emit('report:completed', report)
      this._emit('dispatch:completed', dispatch)
      
      ElMessage.success('报工完成，状态已更新')
      
      return {
        success: true,
        report,
        dispatch
      }
      
    } catch (error) {
      console.error('完成报工失败:', error)
      ElMessage.error('完成报工失败: ' + error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 4. 开始报工
   */
  async startReport(reportId) {
    try {
      const report = this.reportData.find(r => r.id === reportId)
      if (!report) {
        throw new Error('报工记录不存在')
      }
      
      // 更新报工状态为进行中
      report.actualStartTime = new Date().toISOString()
      report.reportStatus = 'in_progress'
      report.status = ProductionFlowStatus.IN_PROGRESS
      
      // 更新派工状态
      const dispatch = this.dispatchData.find(d => d.id === report.dispatchId)
      if (dispatch) {
        dispatch.status = ProductionFlowStatus.IN_PROGRESS
        dispatch.startTime = report.actualStartTime
      }
      
      this._emit('report:started', report)
      
      ElMessage.success('报工已开始')
      
      return { success: true, report }
      
    } catch (error) {
      console.error('开始报工失败:', error)
      ElMessage.error('开始报工失败')
      return { success: false, error: error.message }
    }
  }

  /**
   * 5. 暂停报工
   */
  async pauseReport(reportId) {
    try {
      const report = this.reportData.find(r => r.id === reportId)
      if (!report) {
        throw new Error('报工记录不存在')
      }
      
      report.reportStatus = 'paused'
      report.status = ProductionFlowStatus.PAUSED
      report.pauseTime = new Date().toISOString()
      
      const dispatch = this.dispatchData.find(d => d.id === report.dispatchId)
      if (dispatch) {
        dispatch.status = ProductionFlowStatus.PAUSED
      }
      
      this._emit('report:paused', report)
      
      ElMessage.warning('报工已暂停')
      
      return { success: true, report }
      
    } catch (error) {
      console.error('暂停报工失败:', error)
      ElMessage.error('暂停报工失败')
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取排程数据
   */
  getScheduleData() {
    return this.scheduleData
  }

  /**
   * 获取派工数据
   */
  getDispatchData(filters = {}) {
    let data = [...this.dispatchData]
    
    // 按状态筛选
    if (filters.status) {
      data = data.filter(d => d.status === filters.status)
    }
    
    // 按机器筛选
    if (filters.machineId) {
      data = data.filter(d => d.machineId === filters.machineId)
    }
    
    return data
  }

  /**
   * 获取报工数据
   */
  getReportData(filters = {}) {
    let data = [...this.reportData]
    
    // 按状态筛选
    if (filters.status) {
      data = data.filter(r => r.reportStatus === filters.status)
    }
    
    // 按日期筛选
    if (filters.dateRange) {
      const [start, end] = filters.dateRange
      data = data.filter(r => {
        const createTime = new Date(r.createTime)
        return createTime >= start && createTime <= end
      })
    }
    
    return data
  }

  /**
   * 获取生产进度统计
   */
  getProductionProgress() {
    const total = this.dispatchData.length
    const completed = this.dispatchData.filter(d => d.status === ProductionFlowStatus.COMPLETED).length
    const inProgress = this.dispatchData.filter(d => d.status === ProductionFlowStatus.IN_PROGRESS).length
    const pending = this.dispatchData.filter(d => d.status === ProductionFlowStatus.SCHEDULED).length
    
    return {
      total,
      completed,
      inProgress,
      pending,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0
    }
  }

  /**
   * 计算任务优先级
   */
  _calculatePriority(task) {
    // 根据交期和当前时间计算优先级
    if (task.dueDate) {
      const now = new Date().getTime()
      const due = new Date(task.dueDate).getTime()
      const daysLeft = (due - now) / (1000 * 60 * 60 * 24)
      
      if (daysLeft < 1) return 10  // 极高优先级
      if (daysLeft < 3) return 8   // 高优先级
      if (daysLeft < 7) return 6   // 中优先级
      return 4  // 正常优先级
    }
    
    return 5  // 默认优先级
  }

  /**
   * 事件监听
   */
  on(event, callback) {
    this.listeners.push({ event, callback })
  }

  /**
   * 触发事件
   */
  _emit(event, data) {
    this.listeners
      .filter(l => l.event === event)
      .forEach(l => l.callback(data))
  }

  /**
   * 清除所有数据
   */
  clearAll() {
    this.scheduleData = []
    this.dispatchData = []
    this.reportData = []
    ElMessage.info('所有数据已清除')
  }

  /**
   * 导出数据（用于调试）
   */
  exportData() {
    return {
      schedule: this.scheduleData,
      dispatch: this.dispatchData,
      report: this.reportData
    }
  }
}

// 创建单例
const productionFlowService = new ProductionFlowService()

export default productionFlowService
export { ProductionFlowService, ProductionFlowStatus }
