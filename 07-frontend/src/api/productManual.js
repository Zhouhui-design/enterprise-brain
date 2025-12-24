import request from '@/utils/request'

/**
 * 产品手册API
 */
const productManualAPI = {
  /**
   * 获取所有产品手册
   */
  getAll: () => {
    return request.get('/product-manual')
  },

  /**
   * 根据ID获取产品手册
   */
  getById: (id) => {
    return request.get(`/product-manual/${id}`)
  },

  /**
   * 创建产品手册
   */
  create: (data) => {
    return request.post('/product-manual', data)
  },

  /**
   * 更新产品手册
   */
  update: (id, data) => {
    return request.put(`/product-manual/${id}`, data)
  },

  /**
   * 删除产品手册
   */
  delete: (id) => {
    return request.delete(`/product-manual/${id}`)
  },

  /**
   * 批量删除产品手册
   */
  batchDelete: (ids) => {
    return request.post('/product-manual/batch-delete', { ids })
  }
}

export default productManualAPI
