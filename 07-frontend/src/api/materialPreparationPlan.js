import request from '@/utils/request'

/**
 * 备料计划API
 */

// 获取备料计划列表
export const getList = (params) => {
  return request.get('/material-preparation-plans', params)
}

// 获取单个备料计划
export const getById = (id) => {
  return request.get(`/material-preparation-plans/${id}`)
}

// 创建备料计划
export const create = (data) => {
  return request.post('/material-preparation-plans', data)
}

// 更新备料计划
export const update = (id, data) => {
  return request.put(`/material-preparation-plans/${id}`, data)
}

// 删除备料计划
export const deleteById = (id) => {
  return request.delete(`/material-preparation-plans/${id}`)
}

// 批量删除备料计划
export const batchDelete = (ids) => {
  return request.delete('/material-preparation-plans/batch/delete', {}, {
    data: { ids }
  })
}

// 推送到工序计划
export const pushToProcess = (id) => {
  return request.post(`/material-preparation-plans/${id}/push-to-process`)
}

export default {
  getList,
  getById,
  create,
  update,
  deleteById,
  batchDelete,
  pushToProcess
}
