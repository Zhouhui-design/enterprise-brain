import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.2.229:3005/api'

export const shippingPlanApi = {
  // 获取发货计划列表
  getShippingPlans(params = {}) {
    return axios.get(`${API_BASE_URL}/shipping-plans`, { params })
  },
  
  // 根据ID获取发货计划
  getShippingPlanById(id) {
    return axios.get(`${API_BASE_URL}/shipping-plans/${id}`)
  },
  
  // 创建发货计划
  createShippingPlan(data) {
    return axios.post(`${API_BASE_URL}/shipping-plans`, data)
  },
  
  // 更新发货计划
  updateShippingPlan(id, data) {
    return axios.put(`${API_BASE_URL}/shipping-plans/${id}`, data)
  },
  
  // 删除发货计划
  deleteShippingPlan(id) {
    return axios.delete(`${API_BASE_URL}/shipping-plans/${id}`)
  },
  
  // 批量删除发货计划
  batchDeleteShippingPlans(ids) {
    return axios.post(`${API_BASE_URL}/shipping-plans/batch-delete`, { ids })
  }
}
