import request from '@/utils/request';

/**
 * 回款计划管理API
 */
export default {
  /**
   * 获取回款计划列表
   * @param {Object} params 查询参数
   * @returns {Promise}
   */
  getCollectionPlanList(params) {
    return request({
      url: '/api/finance/collection/plans/list',
      method: 'get',
      params
    });
  },

  /**
   * 获取回款计划详情
   * @param {number} planId 计划ID
   * @returns {Promise}
   */
  getCollectionPlanDetail(planId) {
    return request({
      url: `/api/finance/collection/plans/${planId}`,
      method: 'get'
    });
  },

  /**
   * 创建回款计划
   * @param {Object} planData 计划数据
   * @returns {Promise}
   */
  createCollectionPlan(planData) {
    return request({
      url: '/api/finance/collection/plans',
      method: 'post',
      data: planData
    });
  },

  /**
   * 更新回款计划
   * @param {Object} planData 计划数据
   * @returns {Promise}
   */
  updateCollectionPlan(planData) {
    return request({
      url: '/api/finance/collection/plans',
      method: 'put',
      data: planData
    });
  },

  /**
   * 确认回款计划
   * @param {number} planId 计划ID
   * @returns {Promise}
   */
  confirmCollectionPlan(planId) {
    return request({
      url: `/api/finance/collection/plans/${planId}/confirm`,
      method: 'post'
    });
  },

  /**
   * 执行回款计划
   * @param {number} planId 计划ID
   * @returns {Promise}
   */
  executeCollectionPlan(planId) {
    return request({
      url: `/api/finance/collection/plans/${planId}/execute`,
      method: 'post'
    });
  },

  /**
   * 完成回款计划
   * @param {number} planId 计划ID
   * @returns {Promise}
   */
  completeCollectionPlan(planId) {
    return request({
      url: `/api/finance/collection/plans/${planId}/complete`,
      method: 'post'
    });
  },

  /**
   * 终止回款计划
   * @param {number} planId 计划ID
   * @returns {Promise}
   */
  terminateCollectionPlan(planId) {
    return request({
      url: `/api/finance/collection/plans/${planId}/terminate`,
      method: 'post'
    });
  },

  /**
   * 记录回款
   * @param {Object} paymentData 回款数据
   * @returns {Promise}
   */
  recordPayment(paymentData) {
    return request({
      url: '/api/finance/collection/payments',
      method: 'post',
      data: paymentData
    });
  },

  /**
   * 获取回款计划执行记录
   * @param {number} planId 计划ID
   * @returns {Promise}
   */
  getCollectionPlanExecutionRecords(planId) {
    return request({
      url: `/api/finance/collection/plans/${planId}/execution-records`,
      method: 'get'
    });
  },

  /**
   * 导出回款计划
   * @param {Object} params 导出参数
   * @returns {Promise}
   */
  exportCollectionPlans(params) {
    return request({
      url: '/api/finance/collection/plans/export',
      method: 'get',
      params,
      responseType: 'blob'
    });
  }
};