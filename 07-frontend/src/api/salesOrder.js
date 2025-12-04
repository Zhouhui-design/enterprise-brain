import axios from 'axios'

// 使用环境变量或默认使用本机IP，支持局域网访问
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.2.229:3005/api'

export const salesOrderApi = {
  // 获取销售订单列表
  getSalesOrders(params = {}) {
    return axios.get(`${API_BASE_URL}/sales-orders`, { params })
  },

  // 获取订单详情
  getSalesOrderById(id) {
    return axios.get(`${API_BASE_URL}/sales-orders/${id}`)
  },

  // 创建销售订单
  createSalesOrder(data) {
    return axios.post(`${API_BASE_URL}/sales-orders`, data)
  },

  // 更新销售订单
  updateSalesOrder(id, data) {
    return axios.put(`${API_BASE_URL}/sales-orders/${id}`, data)
  },

  // 删除销售订单
  deleteSalesOrder(id) {
    return axios.delete(`${API_BASE_URL}/sales-orders/${id}`)
  },

  // 批量删除销售订单
  batchDeleteSalesOrders(ids) {
    return axios.post(`${API_BASE_URL}/sales-orders/batch-delete`, { ids })
  }
}

export default salesOrderApi
