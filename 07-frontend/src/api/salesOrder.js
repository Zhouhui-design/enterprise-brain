import request from '@/utils/request'

export const salesOrderApi = {
  // 获取销售订单列表
  getSalesOrders(params = {}) {
    return request.get('/sales-orders', params)
  },

  // 获取订单详情
  getSalesOrderById(id) {
    return request.get(`/sales-orders/${id}`)
  },
  
  // 获取订单详情(别名,与查看页面兼容)
  getOrderDetail(id) {
    return request.get(`/sales-orders/${id}`)
  },
  
  // 获取订单产品明细
  getOrderProducts(orderId) {
    return request.get(`/sales-orders/${orderId}/products`)
  },
  
  // 获取订单回款计划
  getOrderPayments(orderId) {
    return request.get(`/sales-orders/${orderId}/payments`)
  },

  // 创建销售订单
  createSalesOrder(data) {
    return request.post('/sales-orders', data)
  },

  // 更新销售订单
  updateSalesOrder(id, data) {
    return request.put(`/sales-orders/${id}`, data)
  },

  // 删除销售订单
  deleteSalesOrder(id) {
    console.log('🔄 发起删除请求:', `/sales-orders/${id}`)
    return request.delete(`/sales-orders/${id}`)
  },

  // 批量删除销售订单
  batchDeleteSalesOrders(ids) {
    console.log('🔄 发起批量删除请求:', `/sales-orders/batch-delete`, { ids })
    return request.post('/sales-orders/batch-delete', { ids })
  },

  // 确认下单（推送到主生产计划或采购计划）
  confirmOrder(ids) {
    return request.post('/sales-orders/confirm-order', { ids })
  }
}

export default salesOrderApi
