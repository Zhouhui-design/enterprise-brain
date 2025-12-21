/**
 * 库存管理API
 */
import axios from 'axios'

// 使用局域网IP确保跨设备访问
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.2.229:3005/api'

const inventoryAPI = {
  /**
   * 获取库存列表
   */
  getList: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory`, { params })
      return response.data
    } catch (error) {
      console.error('获取库存列表失败:', error)
      throw error
    }
  },

  /**
   * 获取库存详情
   */
  getById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory/${id}`)
      return response.data
    } catch (error) {
      console.error('获取库存详情失败:', error)
      throw error
    }
  },

  /**
   * 创建库存记录
   */
  create: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/inventory`, data)
      return response.data
    } catch (error) {
      console.error('创建库存记录失败:', error)
      throw error
    }
  },

  /**
   * 更新库存记录
   */
  update: async (id, data) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/inventory/${id}`, data)
      return response.data
    } catch (error) {
      console.error('更新库存记录失败:', error)
      throw error
    }
  },

  /**
   * 删除库存记录
   */
  delete: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/inventory/${id}`)
      return response.data
    } catch (error) {
      console.error('删除库存记录失败:', error)
      throw error
    }
  },

  /**
   * 批量删除
   */
  batchDelete: async (ids) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/inventory/batch-delete`, { ids })
      return response.data
    } catch (error) {
      console.error('批量删除失败:', error)
      throw error
    }
  },

  /**
   * 获取库存明细（流水记录）
   */
  getDetails: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory/details/list`, { params })
      return response.data
    } catch (error) {
      console.error('获取库存明细失败:', error)
      throw error
    }
  },

  /**
   * 获取库存报表
   */
  getReport: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory/report/summary`, { params })
      return response.data
    } catch (error) {
      console.error('获取库存报表失败:', error)
      throw error
    }
  },

  /**
   * 库存入库
   */
  inventoryIn: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/inventory/in`, data)
      return response.data
    } catch (error) {
      console.error('库存入库失败:', error)
      throw error
    }
  },

  /**
   * 库存出库
   */
  inventoryOut: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/inventory/out`, data)
      return response.data
    } catch (error) {
      console.error('库存出库失败:', error)
      throw error
    }
  },

  /**
   * 导出库存数据
   */
  exportInventory: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory/export`, { params })
      return response.data
    } catch (error) {
      console.error('导出库存数据失败:', error)
      throw error
    }
  },

  /**
   * 导入库存数据
   */
  importInventory: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/inventory/import`, data)
      return response.data
    } catch (error) {
      console.error('导入库存数据失败:', error)
      throw error
    }
  },

  /**
   * 清空库存列表
   */
  clearInventory: async (params = {}) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/inventory/clear`, { params })
      return response.data
    } catch (error) {
      console.error('清空库存列表失败:', error)
      throw error
    }
  }
}

// 默认导出
export default inventoryAPI

// 命名导出（为了兼容不同的导入方式）
export { inventoryAPI }
export { inventoryAPI as inventoryApi }
export { inventoryAPI as inventoryAlertApi }
export { inventoryAPI as inventoryReportApi }
export { inventoryAPI as inventoryDetailApi }
export { inventoryAPI as inventoryListApi }
export { inventoryAPI as stockMovementApi }
export { inventoryAPI as warehouseApi }
export { inventoryAPI as stockTransferApi }