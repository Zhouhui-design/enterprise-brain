/**
 * 仓库管理API服务
 * 与后端MySQL数据库交互
 */

import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3005/api',
  timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    console.log('🚀 API请求:', config.method?.toUpperCase(), config.url)
    return config
  },
  error => {
    console.error('❌ API请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    console.log('✅ API响应:', response.config.url, response.data)
    return response.data
  },
  error => {
    console.error('❌ API响应错误:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const warehouseApi = {
  // 获取仓库列表
  async getWarehouseList(params = {}) {
    try {
      const response = await api.get('/warehouses', { params })
      return response
    } catch (error) {
      console.error('❌ 获取仓库列表失败:', error)
      throw error
    }
  },

  // 获取仓库详情
  async getWarehouseDetail(id) {
    try {
      const response = await api.get(`/warehouses/${id}`)
      return response
    } catch (error) {
      console.error('❌ 获取仓库详情失败:', error)
      throw error
    }
  },

  // 创建仓库
  async createWarehouse(data) {
    try {
      const response = await api.post('/warehouses', data)
      return response
    } catch (error) {
      console.error('❌ 创建仓库失败:', error)
      throw error
    }
  },

  // 更新仓库
  async updateWarehouse(id, data) {
    try {
      const response = await api.put(`/warehouses/${id}`, data)
      return response
    } catch (error) {
      console.error('❌ 更新仓库失败:', error)
      throw error
    }
  },

  // 删除仓库
  async deleteWarehouse(id) {
    try {
      const response = await api.delete(`/warehouses/${id}`)
      return response
    } catch (error) {
      console.error('❌ 删除仓库失败:', error)
      throw error
    }
  },

  // 批量删除仓库
  async batchDeleteWarehouses(ids) {
    try {
      const response = await api.delete(`/warehouses/batch/${ids.join(',')}`)
      return response
    } catch (error) {
      console.error('❌ 批量删除仓库失败:', error)
      throw error
    }
  }
}

export default warehouseApi