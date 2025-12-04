import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.2.229:3005/api'

export const productionPlanApi = {
  // 获取生产计划列表
  getProductionPlans(params = {}) {
    return axios.get(`${API_BASE_URL}/production-plans`, { params })
  },
  
  // 根据ID获取生产计划
  getProductionPlanById(id) {
    return axios.get(`${API_BASE_URL}/production-plans/${id}`)
  },
  
  // 创建生产计划
  createProductionPlan(data) {
    return axios.post(`${API_BASE_URL}/production-plans`, data)
  },
  
  // 更新生产计划
  updateProductionPlan(id, data) {
    return axios.put(`${API_BASE_URL}/production-plans/${id}`, data)
  },
  
  // 删除生产计划
  deleteProductionPlan(id) {
    return axios.delete(`${API_BASE_URL}/production-plans/${id}`)
  },
  
  // 批量删除生产计划
  batchDeleteProductionPlans(ids) {
    return axios.post(`${API_BASE_URL}/production-plans/batch-delete`, { ids })
  }
}
