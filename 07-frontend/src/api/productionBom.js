import request from '@/utils/request'

// 生产BOM API
export default {
  // 获取所有生产BOM
  getAllBOMs() {
    return request.get('/production-boms/list')
  },

  // 获取单个BOM详情
  getBOMDetail(id) {
    return request.get(`/production-boms/detail/${id}`)
  },

  // ✅ 根据产品编码获取BOM（用于MRP加载）
  getBOMByProductCode(productCode) {
    return request.get(`/production-boms/by-product/${productCode}`)
  },

  // 创建生产BOM
  createBOM(bomData) {
    return request.post('/production-boms/create', bomData)
  },

  // 更新生产BOM
  updateBOM(id, bomData) {
    return request.put(`/production-boms/update/${id}`, bomData)
  },

  // 删除生产BOM
  deleteBOM(id) {
    return request.delete(`/production-boms/delete/${id}`)
  },

  // 批量删除生产BOM
  batchDeleteBOMs(ids) {
    return request.delete('/production-boms/batch-delete', { ids })
  }
}
