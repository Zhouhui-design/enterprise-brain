import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.2.229:3005/api'

/**
 * 产品手册API
 */
const productManualAPI = {
  /**
   * 获取所有产品手册
   */
  getAll: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/product-manual`)
      return response.data
    } catch (error) {
      console.error('获取产品手册列表失败:', error)
      throw error
    }
  },

  /**
   * 根据ID获取产品手册
   */
  getById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/product-manual/${id}`)
      return response.data
    } catch (error) {
      console.error('获取产品手册详情失败:', error)
      throw error
    }
  },

  /**
   * 创建产品手册
   */
  create: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/product-manual`, data)
      return response.data
    } catch (error) {
      console.error('创建产品手册失败:', error)
      throw error
    }
  },

  /**
   * 更新产品手册
   */
  update: async (id, data) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/product-manual/${id}`, data)
      return response.data
    } catch (error) {
      console.error('更新产品手册失败:', error)
      throw error
    }
  },

  /**
   * 删除产品手册
   */
  delete: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/product-manual/${id}`)
      return response.data
    } catch (error) {
      console.error('删除产品手册失败:', error)
      throw error
    }
  },

  /**
   * 批量删除产品手册
   */
  batchDelete: async (ids) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/product-manual/batch-delete`, { ids })
      return response.data
    } catch (error) {
      console.error('批量删除产品手册失败:', error)
      throw error
    }
  }
}

export default productManualAPI
