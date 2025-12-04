import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.2.229:3005/api'

export const projectedBalanceApi = {
  // 获取预计结存列表
  getProjectedBalances(params = {}) {
    return axios.get(`${API_BASE_URL}/projected-balances`, { params })
  },
  
  // 根据ID获取预计结存
  getProjectedBalanceById(id) {
    return axios.get(`${API_BASE_URL}/projected-balances/${id}`)
  },
  
  // 创建预计结存
  createProjectedBalance(data) {
    return axios.post(`${API_BASE_URL}/projected-balances`, data)
  },
  
  // 更新预计结存
  updateProjectedBalance(id, data) {
    return axios.put(`${API_BASE_URL}/projected-balances/${id}`, data)
  },
  
  // 删除预计结存
  deleteProjectedBalance(id) {
    return axios.delete(`${API_BASE_URL}/projected-balances/${id}`)
  },
  
  // 批量删除预计结存
  batchDeleteProjectedBalances(ids) {
    return axios.post(`${API_BASE_URL}/projected-balances/batch-delete`, { ids })
  }
}
