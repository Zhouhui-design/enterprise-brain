import request from '@/utils/request';

/**
 * 应收账款管理API
 */
export default {
  /**
   * 获取应收账款列表
   * @param {Object} params 查询参数
   * @returns {Promise}
   */
  getAccountsReceivableList(params) {
    return request({
      url: '/api/finance/accounts-receivable/list',
      method: 'get',
      params
    });
  },

  /**
   * 获取账龄分析数据
   * @param {Object} params 查询参数（包含asOfDate等）
   * @returns {Promise}
   */
  getAgingAnalysis(params) {
    return request({
      url: '/api/finance/accounts-receivable/aging-analysis',
      method: 'get',
      params
    });
  },

  /**
   * 导出账龄分析报告
   * @param {Object} params 导出参数
   * @returns {Promise}
   */
  exportAgingReport(params) {
    return request({
      url: '/api/finance/accounts-receivable/aging-analysis/export',
      method: 'get',
      params,
      responseType: 'blob'
    });
  },

  /**
   * 获取回款提醒列表
   * @param {Object} params 查询参数
   * @returns {Promise}
   */
  getPaymentReminderList(params) {
    return request({
      url: '/api/finance/accounts-receivable/payment-reminders',
      method: 'get',
      params
    });
  },

  /**
   * 创建回款提醒
   * @param {Object} reminderData 提醒数据
   * @returns {Promise}
   */
  createPaymentReminder(reminderData) {
    return request({
      url: '/api/finance/accounts-receivable/payment-reminders',
      method: 'post',
      data: reminderData
    });
  },

  /**
   * 更新回款提醒
   * @param {Object} reminderData 提醒数据
   * @returns {Promise}
   */
  updatePaymentReminder(reminderData) {
    return request({
      url: '/api/finance/accounts-receivable/payment-reminders',
      method: 'put',
      data: reminderData
    });
  },

  /**
   * 发送回款提醒
   * @param {number} reminderId 提醒ID
   * @returns {Promise}
   */
  sendPaymentReminder(reminderId) {
    return request({
      url: `/api/finance/accounts-receivable/payment-reminders/${reminderId}/send`,
      method: 'post'
    });
  },

  /**
   * 取消回款提醒
   * @param {number} reminderId 提醒ID
   * @returns {Promise}
   */
  cancelPaymentReminder(reminderId) {
    return request({
      url: `/api/finance/accounts-receivable/payment-reminders/${reminderId}/cancel`,
      method: 'post'
    });
  },

  /**
   * 添加付款跟进记录
   * @param {Object} followUpData 跟进数据
   * @returns {Promise}
   */
  addPaymentFollowUp(followUpData) {
    return request({
      url: '/api/finance/accounts-receivable/payment-follow-ups',
      method: 'post',
      data: followUpData
    });
  },

  /**
   * 获取付款跟进记录
   * @param {number} reminderId 提醒ID
   * @returns {Promise}
   */
  getPaymentFollowUpRecords(reminderId) {
    return request({
      url: '/api/finance/accounts-receivable/payment-follow-ups',
      method: 'get',
      params: { reminderId }
    });
  }
};