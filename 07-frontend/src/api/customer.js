import axios from 'axios'

// 使用环境变量或默认使用本机IP，支持局域网访问
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.2.229:3005/api'

// 创建axios实例，添加超时配置
const axiosInstance = axios.create({
  timeout: 5000, // 5秒超时
  baseURL: API_BASE_URL
})

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
    return axiosInstance.get('/customers', { params })
  },

  /**
   * 获取客户详情
   * @param {string} id - 客户ID
   * @returns {Promise}
   */
  getCustomerById(id) {
    return axiosInstance.get(`/customers/${id}`)
  },

  /**
   * 创建客户
   * @param {Object} data - 客户数据
   * @returns {Promise}
   */
  createCustomer(data) {
    return axiosInstance.post('/customers', data)
  },

  /**
   * 更新客户
   * @param {string} id - 客户ID
   * @param {Object} data - 客户数据
   * @returns {Promise}
   */
  updateCustomer(id, data) {
    return axiosInstance.put(`/customers/${id}`, data)
  },

  /**
   * 删除客户
   * @param {string} id - 客户ID
   * @returns {Promise}
   */
  deleteCustomer(id) {
    return axiosInstance.delete(`/customers/${id}`)
  },

  /**
   * 批量删除客户
   * @param {Array} ids - 客户ID数组
   * @returns {Promise}
   */
  batchDeleteCustomers(ids) {
    return axiosInstance.post('/customers/batch-delete', { ids })
  },

  /**
   * 获取客户统计信息
   * @returns {Promise}
   */
  getCustomerStats() {
    return axiosInstance.get('/customers/statistics/overview')
  }
}

export default customerApi
