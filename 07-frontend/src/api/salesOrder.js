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
  
  // 获取订单详情(别名,与查看页面兼容)
  getOrderDetail(id) {
    return axios.get(`${API_BASE_URL}/sales-orders/${id}`).then(res => res.data)
  },
  
  // 获取订单产品明细
  getOrderProducts(orderId) {
    return axios.get(`${API_BASE_URL}/sales-orders/${orderId}/products`).then(res => res.data)
  },
  
  // 获取订单回款计划
  getOrderPayments(orderId) {
    return axios.get(`${API_BASE_URL}/sales-orders/${orderId}/payments`).then(res => res.data)
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
  },

  // 确认下单（推送到主生产计划或采购计划）
  confirmOrder(ids) {
    return axios.post(`${API_BASE_URL}/sales-orders/confirm-order`, { ids })
  }
}

export default salesOrderApi
