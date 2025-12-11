import request from '@/utils/request'

export default {
  // 查询计划结束日期
  queryPlanEndDate(processName, completionDate, minRemainingHours = 0.5) {
    return request.post('/capacity-load/query-plan-end-date', {
      processName,
      completionDate,
      minRemainingHours  // ✅ 新增参数：剩余工时门槛值
    })
  },

  // ✅ 查询计划开始日期：从计划结束日期向前累加工时
  queryPlanStartDate(processName, planEndDate, requiredWorkHours, minRemainingHours = 0.5) {
    return request.post('/capacity-load/query-plan-start-date', {
      processName,
      planEndDate,
      requiredWorkHours,
      minRemainingHours
    })
  },

  // 获取工序能力负荷表列表
  getList(params) {
    return request.get('/capacity-load/list', { params })
  },

  // ✅ 查询指定日期和工序的能力负荷信息
  queryCapacityByDate(processName, date) {
    return request.get('/capacity-load/query-by-date', {
      processName, 
      date
    })
  },

  // ✅ 需求 6：查询下一个排程日期（MINIFS：工序名称=本行工序，且日期>计划排程日期，且日期<=计划结束日期，且剩余工时>门槛值）
  queryNextScheduleDate(processName, scheduleDate, planEndDate, minRemainingHours = 0.5) {
    return request.post('/capacity-load/query-next-schedule-date', {
      processName,
      scheduleDate,
      planEndDate,
      minRemainingHours
    })
  },

  // ✅ 新增：更新已占用工时（工序计划 → 工序能力负荷表）
  updateOccupiedHours(processName, date, scheduledWorkHours) {
    return request.post('/capacity-load/update-occupied-hours', {
      processName,
      date,
      scheduledWorkHours
    })
  },

  // ✅ 新增：释放已占用工时（工序计划删除 → 工序能力负荷表） - 减法逻辑
  releaseOccupiedHours(processName, date, scheduledWorkHours) {
    return request.post('/capacity-load/release-occupied-hours', {
      processName,
      date,
      scheduledWorkHours
    })
  },

  // ✅ 新增：重新计算已占用工时（工序计划删除 → 工序能力负荷表） - SUMIF逻辑(备用)
  recalculateOccupiedHours(processName, date) {
    return request.post('/capacity-load/recalculate-occupied-hours', {
      processName,
      date
    })
  },

  // ✅ 新增：批量重置所有已占用工时（工序能力负荷表 - 手动触发）
  resetAllOccupiedHours() {
    return request.post('/capacity-load/reset-all-occupied-hours')
  },

  // ✅ 查询当天总工时：可用工位数量 * 上班时段
  queryDailyTotalWorkHours(processName, date) {
    return request.post('/capacity-load/query-daily-total-hours', {
      processName,
      date
    })
  },

  // ✅ 需求2：查询当天已排程工时 (SUMIFS)
  queryDailyScheduledHours(processName, scheduleDate, currentRowIndex = 0) {
    return request.post('/capacity-load/query-daily-scheduled-hours', {
      processName,
      scheduleDate,
      currentRowIndex
    })
  }
}