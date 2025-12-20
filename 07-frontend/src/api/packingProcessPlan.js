import request from '@/utils/request'

// 获取打包工序计划列表
export function getList(params) {
  return request.get('/packing-process-plans', { params })
}

// 根据ID获取打包工序计划
export function getById(id) {
  return request.get(`/packing-process-plans/${id}`)
}

// 创建打包工序计划
export function create(data) {
  return request.post('/packing-process-plans', data)
}

// 更新打包工序计划
export function update(id, data) {
  return request.put(`/packing-process-plans/${id}`, data)
}

// 根据ID更新打包工序计划（别名）
export function updateById(id, data) {
  return update(id, data)
}

// 删除打包工序计划
export function deleteById(id) {
  return request.delete(`/packing-process-plans/${id}`)
}

// 批量删除打包工序计划
export function batchDelete(ids) {
  return request.post('/packing-process-plans/batch-delete', { ids })
}

// ✅ 查询当天已排程工时
// SUMIFS(计划排程工时, 工序名称=当前工序, 计划排程日期=当前日期, ID<>当前ID)
export function queryDailyScheduledHours(params) {
  return request.get('/packing-process-plans/query-daily-scheduled-hours', { params })
}

// ✅ 修复字段计算
export function fixFieldCalculations() {
  return request.post('/packing-process-plans/fix-field-calculations')
}