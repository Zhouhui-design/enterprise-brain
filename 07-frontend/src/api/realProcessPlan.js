import request from '@/utils/request'

// 获取真工序计划列表
export function getList(params) {
  return request.get('/real-process-plans', { params })
}

// 根据ID获取真工序计划
export function getById(id) {
  return request.get(`/real-process-plans/${id}`)
}

// 创建真工序计划
export function create(data) {
  return request.post('/real-process-plans', data)
}

// 更新真工序计划
export function update(id, data) {
  return request.put(`/real-process-plans/${id}`, data)
}

// 删除真工序计划
export function deleteById(id) {
  return request.delete(`/real-process-plans/${id}`)
}

// 批量删除真工序计划
export function batchDelete(ids) {
  return request.post('/real-process-plans/batch-delete', { ids })
}
