import request from '@/utils/request'

/**
 * MRP需求API
 */
export default {
  /**
   * 保存产品需求数据
   */
  saveProductDemands(demands) {
    return request.post('/mrp-demands/product-demands', { demands })
  },

  /**
   * 获取所有产品需求数据
   */
  getProductDemands() {
    return request.get('/mrp-demands/product-demands')
  },

  /**
   * 保存物料需求数据
   */
  saveMaterialDemands(demands) {
    return request.post('/mrp-demands/material-demands', { demands })
  },

  /**
   * 获取所有物料需求数据
   */
  getMaterialDemands() {
    return request.get('/mrp-demands/material-demands')
  },

  /**
   * 删除产品需求
   */
  deleteProductDemand(mrpCode) {
    return request.delete(`/mrp-demands/product-demands/${mrpCode}`)
  },

  /**
   * 删除物料需求
   */
  deleteMaterialDemand(id) {
    return request.delete(`/mrp-demands/material-demands/${id}`)
  }
}
