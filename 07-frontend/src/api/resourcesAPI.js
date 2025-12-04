import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ==================== 设备资源API ====================
export const equipmentAPI = {
  // 获取设备列表
  getList: (params) => api.get('/resources/equipment', { params }),
  
  // 获取设备详情
  getById: (id) => api.get(`/resources/equipment/${id}`),
  
  // 创建设备
  create: (data) => api.post('/resources/equipment', data),
  
  // 更新设备
  update: (id, data) => api.put(`/resources/equipment/${id}`, data),
  
  // 删除设备
  delete: (id) => api.delete(`/resources/equipment/${id}`),
  
  // 批量删除
  batchDelete: (ids) => api.post('/resources/equipment/batch-delete', { ids }),
  
  // 获取设备状态
  getStatus: (id) => api.get(`/resources/equipment/${id}/status`),
  
  // 更新设备状态
  updateStatus: (id, status) => api.put(`/resources/equipment/${id}/status`, { status }),
  
  // 获取设备维护记录
  getMaintenanceRecords: (id) => api.get(`/resources/equipment/${id}/maintenance`),
  
  // 创建维护记录
  createMaintenanceRecord: (id, data) => api.post(`/resources/equipment/${id}/maintenance`, data),
  
  // 获取设备利用率
  getUtilization: (params) => api.get('/resources/equipment/utilization', { params }),
  
  // 导出设备数据
  export: (params) => api.get('/resources/equipment/export', { 
    params, 
    responseType: 'blob' 
  }),
  
  // 导入设备数据
  import: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/resources/equipment/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

// ==================== 人员资源API ====================
export const workerAPI = {
  // 获取人员列表
  getList: (params) => api.get('/resources/workers', { params }),
  
  // 获取人员详情
  getById: (id) => api.get(`/resources/workers/${id}`),
  
  // 创建人员
  create: (data) => api.post('/resources/workers', data),
  
  // 更新人员
  update: (id, data) => api.put(`/resources/workers/${id}`, data),
  
  // 删除人员
  delete: (id) => api.delete(`/resources/workers/${id}`),
  
  // 获取人员技能
  getSkills: (id) => api.get(`/resources/workers/${id}/skills`),
  
  // 更新人员技能
  updateSkills: (id, skills) => api.put(`/resources/workers/${id}/skills`, { skills }),
  
  // 获取班次信息
  getShifts: () => api.get('/resources/workers/shifts'),
  
  // 获取人员排程
  getSchedule: (id, params) => api.get(`/resources/workers/${id}/schedule`, { params }),
  
  // 导出人员数据
  export: (params) => api.get('/resources/workers/export', { 
    params, 
    responseType: 'blob' 
  }),
  
  // 导入人员数据
  import: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/resources/workers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

// ==================== 物料资源API ====================
export const materialAPI = {
  // 获取物料列表
  getList: (params) => api.get('/resources/materials', { params }),
  
  // 获取物料详情
  getById: (id) => api.get(`/resources/materials/${id}`),
  
  // 创建物料
  create: (data) => api.post('/resources/materials', data),
  
  // 更新物料
  update: (id, data) => api.put(`/resources/materials/${id}`, data),
  
  // 删除物料
  delete: (id) => api.delete(`/resources/materials/${id}`),
  
  // 获取库存信息
  getStock: (id) => api.get(`/resources/materials/${id}/stock`),
  
  // 更新库存
  updateStock: (id, data) => api.put(`/resources/materials/${id}/stock`, data),
  
  // 获取低库存物料
  getLowStock: () => api.get('/resources/materials/low-stock'),
  
  // 获取物料消耗记录
  getConsumptionRecords: (id, params) => api.get(`/resources/materials/${id}/consumption`, { params }),
  
  // 记录物料消耗
  recordConsumption: (id, data) => api.post(`/resources/materials/${id}/consumption`, data),
  
  // 导出物料数据
  export: (params) => api.get('/resources/materials/export', { 
    params, 
    responseType: 'blob' 
  }),
  
  // 导入物料数据
  import: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/resources/materials/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

// ==================== 模具资源API ====================
export const moldAPI = {
  // 获取模具列表
  getList: (params) => api.get('/resources/molds', { params }),
  
  // 获取模具详情
  getById: (id) => api.get(`/resources/molds/${id}`),
  
  // 创建模具
  create: (data) => api.post('/resources/molds', data),
  
  // 更新模具
  update: (id, data) => api.put(`/resources/molds/${id}`, data),
  
  // 删除模具
  delete: (id) => api.delete(`/resources/molds/${id}`),
  
  // 获取模具寿命信息
  getLifecycle: (id) => api.get(`/resources/molds/${id}/lifecycle`),
  
  // 更新模具使用次数
  updateUsage: (id, cycles) => api.put(`/resources/molds/${id}/usage`, { cycles }),
  
  // 获取保养记录
  getMaintenanceRecords: (id) => api.get(`/resources/molds/${id}/maintenance`),
  
  // 创建保养记录
  createMaintenanceRecord: (id, data) => api.post(`/resources/molds/${id}/maintenance`, data),
  
  // 获取需要保养的模具
  getNeedMaintenance: () => api.get('/resources/molds/need-maintenance'),
  
  // 导出模具数据
  export: (params) => api.get('/resources/molds/export', { 
    params, 
    responseType: 'blob' 
  }),
  
  // 导入模具数据
  import: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/resources/molds/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

// ==================== 夹具资源API ====================
export const fixtureAPI = {
  // 获取夹具列表
  getList: (params) => api.get('/resources/fixtures', { params }),
  
  // 获取夹具详情
  getById: (id) => api.get(`/resources/fixtures/${id}`),
  
  // 创建夹具
  create: (data) => api.post('/resources/fixtures', data),
  
  // 更新夹具
  update: (id, data) => api.put(`/resources/fixtures/${id}`, data),
  
  // 删除夹具
  delete: (id) => api.delete(`/resources/fixtures/${id}`),
  
  // 占用夹具
  occupy: (id, quantity) => api.post(`/resources/fixtures/${id}/occupy`, { quantity }),
  
  // 释放夹具
  release: (id, quantity) => api.post(`/resources/fixtures/${id}/release`, { quantity }),
  
  // 获取夹具使用记录
  getUsageRecords: (id, params) => api.get(`/resources/fixtures/${id}/usage`, { params }),
  
  // 导出夹具数据
  export: (params) => api.get('/resources/fixtures/export', { 
    params, 
    responseType: 'blob' 
  }),
  
  // 导入夹具数据
  import: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/resources/fixtures/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

// ==================== 刀具资源API ====================
export const toolingAPI = {
  // 获取刀具列表
  getList: (params) => api.get('/resources/tooling', { params }),
  
  // 获取刀具详情
  getById: (id) => api.get(`/resources/tooling/${id}`),
  
  // 创建刀具
  create: (data) => api.post('/resources/tooling', data),
  
  // 更新刀具
  update: (id, data) => api.put(`/resources/tooling/${id}`, data),
  
  // 删除刀具
  delete: (id) => api.delete(`/resources/tooling/${id}`),
  
  // 刀具领用
  issue: (id, data) => api.post(`/resources/tooling/${id}/issue`, data),
  
  // 刀具归还
  return: (id, data) => api.post(`/resources/tooling/${id}/return`, data),
  
  // 获取刀具寿命信息
  getLifecycle: (id) => api.get(`/resources/tooling/${id}/lifecycle`),
  
  // 导出刀具数据
  export: (params) => api.get('/resources/tooling/export', { 
    params, 
    responseType: 'blob' 
  }),
  
  // 导入刀具数据
  import: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/resources/tooling/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

// ==================== 排程API ====================
export const schedulingAPI = {
  // 获取排程列表
  getList: (params) => api.get('/scheduling', { params }),
  
  // 获取排程详情
  getById: (id) => api.get(`/scheduling/${id}`),
  
  // 创建排程
  create: (data) => api.post('/scheduling', data),
  
  // 执行排程
  execute: (id, algorithm = 'priority') => api.post(`/scheduling/${id}/execute`, { algorithm }),
  
  // 优化排程
  optimize: (id) => api.post(`/scheduling/${id}/optimize`),
  
  // 获取排程结果
  getResult: (id) => api.get(`/scheduling/${id}/result`),
  
  // 推送到派工
  pushToDispatch: (id) => api.post(`/scheduling/${id}/push-to-dispatch`),
  
  // 获取甘特图数据
  getGanttData: (id) => api.get(`/scheduling/${id}/gantt`),
  
  // 获取资源利用率
  getResourceUtilization: (id) => api.get(`/scheduling/${id}/resource-utilization`),
  
  // 导出排程
  export: (id) => api.get(`/scheduling/${id}/export`, { responseType: 'blob' })
}

// ==================== 数据同步API ====================
export const syncAPI = {
  // 获取同步状态
  getStatus: () => api.get('/sync/status'),
  
  // 手动触发同步
  trigger: (modules = []) => api.post('/sync/trigger', { modules }),
  
  // 获取同步历史
  getHistory: (params) => api.get('/sync/history', { params }),
  
  // 获取冲突记录
  getConflicts: () => api.get('/sync/conflicts'),
  
  // 解决冲突
  resolveConflict: (id, resolution) => api.post(`/sync/conflicts/${id}/resolve`, { resolution })
}

// ==================== 综合资源API ====================
export const resourceSummaryAPI = {
  // 获取资源概览
  getSummary: () => api.get('/resources/summary'),
  
  // 获取资源统计
  getStatistics: (params) => api.get('/resources/statistics', { params }),
  
  // 检查资源可用性
  checkAvailability: (requirements) => api.post('/resources/check-availability', requirements),
  
  // 获取资源预警
  getAlerts: () => api.get('/resources/alerts'),
  
  // 标记预警已读
  markAlertRead: (id) => api.put(`/resources/alerts/${id}/read`)
}

export default {
  equipmentAPI,
  workerAPI,
  materialAPI,
  moldAPI,
  fixtureAPI,
  toolingAPI,
  schedulingAPI,
  syncAPI,
  resourceSummaryAPI
}
