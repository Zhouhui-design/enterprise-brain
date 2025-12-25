import request from '@/utils/request'

// 统一使用全局request工具，确保响应拦截器一致

/**
 * 客户管理API服务
 */
export const customerApi = {
  /**
   * 获取客户列表
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  getCustomers(params = {}) {
    return request.get('/customers', params)
  },

  /**
   * 获取客户详情
   * @param {string} id - 客户ID
   * @returns {Promise}
   */
  getCustomerById(id) {
    return request.get(`/customers/${id}`)
  },

  /**
   * 创建客户
   * @param {Object} data - 客户数据
   * @returns {Promise}
   */
  createCustomer(data) {
    return request.post('/customers', data)
  },

  /**
   * 更新客户
   * @param {string} id - 客户ID
   * @param {Object} data - 客户数据
   * @returns {Promise}
   */
  updateCustomer(id, data) {
    return request.put(`/customers/${id}`, data)
  },

  /**
   * 删除客户
   * @param {string} id - 客户ID
   * @returns {Promise}
   */
  deleteCustomer(id) {
    return request.delete(`/customers/${id}`)
  },

  /**
   * 批量删除客户
   * @param {Array} ids - 客户ID数组
   * @returns {Promise}
   */
  batchDeleteCustomers(ids) {
    return request.post('/customers/batch-delete', { ids })
  },

  /**
   * 获取客户统计信息
   * @returns {Promise}
   */
  getCustomerStats() {
    return request.get('/customers/statistics/overview')
  }
}

export default customerApi
