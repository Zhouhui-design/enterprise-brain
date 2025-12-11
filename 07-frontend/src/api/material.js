import request from '@/utils/request'

// 物料API
export default {
  // 获取所有物料
  getAllMaterials() {
    return request.get('/materials/list')
  },

  // 创建物料
  createMaterial(materialData) {
    return request.post('/materials/create', materialData)
  },

  // 批量创建物料
  batchCreateMaterials(materialsData) {
    return request.post('/materials/batch-create', materialsData)
  },

  // 更新物料
  updateMaterial(id, materialData) {
    return request.put(`/materials/update/${id}`, materialData)
  },

  // 删除物料
  deleteMaterial(id) {
    return request.delete(`/materials/delete/${id}`)
  },

  // 批量删除物料
  batchDeleteMaterials(ids) {
    return request.delete('/materials/batch-delete', { ids })
  },

  // 搜索物料
  searchMaterials(keyword) {
    return request.get('/materials/search', { params: { keyword } })
  },

  // 根据物料编码获取物料
  getMaterialByCode(materialCode) {
    return request.get(`/materials/by-code/${materialCode}`, {}, {
      silent404: true  // ✅ 静默处理04错误，不显示“请求地址不存在”提示
    })
  }
}
