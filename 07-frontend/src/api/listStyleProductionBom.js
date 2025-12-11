import request from '@/utils/request'

// 列表式生产BOM API
export default {
  // 获取列表式生产BOM列表
  getListStyleBomList(params) {
    return request.get('/list-style-production-boms/list', { params })
  },

  // 获取列表式生产BOM详情
  getListStyleBomDetail(id) {
    return request.get(`/list-style-production-boms/detail/${id}`)
  },

  // 从生产BOM生成列表式BOM
  generateFromProductionBom(productionBomId, mode = 'check') {
    return request.post(`/list-style-production-boms/generate-from-production-bom/${productionBomId}`, { mode })
  },

  // 创建列表式生产BOM
  createListStyleBom(bomData) {
    return request.post('/list-style-production-boms/create', bomData)
  },

  // 更新列表式生产BOM
  updateListStyleBom(id, bomData) {
    return request.put(`/list-style-production-boms/update/${id}`, bomData)
  },

  // 删除列表式生产BOM
  deleteListStyleBom(id) {
    return request.delete(`/list-style-production-boms/delete/${id}`)
  },

  // 批量删除列表式生产BOM
  batchDeleteListStyleBoms(ids) {
    return request.delete('/list-style-production-boms/batch-delete', { ids })
  },

  // ✅ 根据父件编号查询BOM子件
  getChildrenByParentCode(parentCode) {
    console.log('🔍 API调用 - 查询BOM子件，父件编号:', parentCode)
    return request.get('/list-style-production-boms/children-by-parent', { parentCode })
  }
}