import request from '@/utils/request'

/**
 * 获取工序计划列表
 */
export const getList = (params) => {
  return request.get('/process-plans', params)
}

/**
 * 根据ID获取工序计划详情
 */
export const getById = (id) => {
  return request.get(`/process-plans/${id}`)
}

/**
 * 创建工序计划
 */
export const create = (data) => {
  return request.post('/process-plans', data)
}

/**
 * 更新工序计划
 */
export const update = (id, data) => {
  return request.put(`/process-plans/${id}`, data)
}

/**
 * 删除工序计划
 */
export const deleteById = (id) => {
  return request.delete(`/process-plans/${id}`)
}

/**
 * 批量删除工序计划
 */
export const batchDelete = (ids) => {
  return request.post('/process-plans/batch-delete', { ids })
}

export default {
  getList,
  getById,
  create,
  update,
  deleteById,
  batchDelete
}
