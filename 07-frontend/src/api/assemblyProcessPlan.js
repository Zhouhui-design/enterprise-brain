import request from '@/utils/request'

// 获取组装工序计划列表
export function getList(params) {
  return request.get('/assembly-process-plans', { params })
}

// 根据ID获取组装工序计划
export function getById(id) {
  return request.get(`/assembly-process-plans/${id}`)
}

// 创建组装工序计划
export function create(data) {
  return request.post('/assembly-process-plans', data)
}

// 更新组装工序计划
export function update(id, data) {
  return request.put(`/assembly-process-plans/${id}`, data)
}

// 根据ID更新组装工序计划（别名）
export function updateById(id, data) {
  return update(id, data)
}

// 删除组装工序计划
export function deleteById(id) {
  return request.delete(`/assembly-process-plans/${id}`)
}

// 批量删除组装工序计划
export function batchDelete(ids) {
  return request.post('/assembly-process-plans/batch-delete', { ids })
}
