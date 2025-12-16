import request from '@/utils/request'

/**
 * 采购计划API
 */
export const procurementPlanApi = {
  /**
   * 获取采购计划列表（分页+搜索）
   * @param {Object} params - 查询参数
   * @param {Number} params.page - 页码
   * @param {Number} params.pageSize - 每页数量
   * @param {String} params.procurementPlanNo - 采购计划编号
   * @param {String} params.purchaseOrderNo - 采购订单编号
   * @param {String} params.procurementStatus - 采购状态
   * @param {String} params.supplierName - 供应商名称
   */
  getList(params) {
    return request.get('/procurement-plans', { params })
  },

  /**
   * 获取单条采购计划详情
   * @param {Number} id - 采购计划ID
   */
  getById(id) {
    return request.get(`/procurement-plans/${id}`)
  },

  /**
   * 新增采购计划
   * @param {Object} data - 采购计划数据
   */
  create(data) {
    return request.post('/procurement-plans', data)
  },

  /**
   * 更新采购计划
   * @param {Number} id - 采购计划ID
   * @param {Object} data - 更新的数据
   */
  update(id, data) {
    return request.put(`/procurement-plans/${id}`, data)
  },

  /**
   * 删除单条采购计划
   * @param {Number} id - 采购计划ID
   */
  delete(id) {
    return request.delete(`/procurement-plans/${id}`)
  },

  /**
   * 批量删除采购计划
   * @param {Array<Number>} ids - 采购计划ID数组
   */
  batchDelete(ids) {
    return request.post('/procurement-plans/batch-delete', { ids })
  },

  /**
   * 批量终止采购计划
   * @param {Array<Number>} ids - 采购计划ID数组
   */
  batchTerminate(ids) {
    return request.post('/procurement-plans/batch-terminate', { ids })
  },

  /**
   * 批量撤回采购计划
   * @param {Array<Number>} ids - 采购计划ID数组
   */
  batchRecall(ids) {
    return request.post('/procurement-plans/batch-recall', { ids })
  }
}
