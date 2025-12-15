import request from '@/utils/request'

// 获取缝纫工序计划列表
export function getList(params) {
  return request.get('/sewing-process-plans', { params })
}

// 根据ID获取缝纫工序计划
export function getById(id) {
  return request.get(`/sewing-process-plans/${id}`)
}

// 创建缝纫工序计划
export function create(data) {
  return request.post('/sewing-process-plans', data)
}

// 更新缝纫工序计划
export function update(id, data) {
  return request.put(`/sewing-process-plans/${id}`, data)
}

// 根据ID更新缝纫工序计划（别名）
export function updateById(id, data) {
  return update(id, data)
}

// 删除缝纫工序计划
export function deleteById(id) {
  return request.delete(`/sewing-process-plans/${id}`)
}

// 批量删除缝纫工序计划
export function batchDelete(ids) {
  return request.post('/sewing-process-plans/batch-delete', { ids })
}
