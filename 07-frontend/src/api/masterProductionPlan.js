import request from '@/utils/request'

/**
 * 获取主生产计划列表
 */
export const getList = (params) => {
  return request.get('/master-production-plans', params)
}

/**
 * 根据ID获取主生产计划详情
 */
export const getById = (id) => {
  return request.get(`/master-production-plans/${id}`)
}

/**
 * 创建主生产计划
 */
export const create = (data) => {
  return request.post('/master-production-plans', data)
}

/**
 * 更新主生产计划
 */
export const update = (id, data) => {
  return request.put(`/master-production-plans/${id}`, data)
}

/**
 * 删除主生产计划
 */
export const deleteById = (id) => {
  return request.delete(`/master-production-plans/${id}`)
}

/**
 * 批量删除主生产计划
 */
export const batchDelete = (ids) => {
  return request.post('/master-production-plans/batch-delete', { ids })
}

/**
 * 执行排程
 */
export const executeSchedule = (id, data = {}) => {
  return request.post(`/master-production-plans/${id}/execute-schedule`, data)
}

export default {
  getList,
  getById,
  create,
  update,
  deleteById,
  batchDelete,
  executeSchedule
}
