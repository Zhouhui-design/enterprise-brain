import request from '@/utils/request'

// 获取喷塑工序计划列表
export function getList(params) {
  return request.get('/spray-painting-process-plans', { params })
}

// 根据ID获取喷塑工序计划
export function getById(id) {
  return request.get(`/spray-painting-process-plans/${id}`)
}

// 创建喷塑工序计划
export function create(data) {
  return request.post('/spray-painting-process-plans', data)
}

// 更新喷塑工序计划
export function update(id, data) {
  return request.put(`/spray-painting-process-plans/${id}`, data)
}

// 根据ID更新喷塑工序计划（别名）
export function updateById(id, data) {
  return update(id, data)
}

// 删除喷塑工序计划
export function deleteById(id) {
  return request.delete(`/spray-painting-process-plans/${id}`)
}

// 批量删除喷塑工序计划
export function batchDelete(ids) {
  return request.post('/spray-painting-process-plans/batch-delete', { ids })
}
