import api from '../index';

/**
 * 销售订单API服务
 */
const orderApi = {
  /**
   * 获取订单列表
   * @param {Object} params - 查询参数
   * @param {string} params.orderCode - 订单编号
   * @param {string} params.customerName - 客户名称
   * @param {string} params.status - 订单状态
   * @param {Array} params.createDateRange - 创建日期范围
   * @param {number} params.page - 页码
   * @param {number} params.size - 每页条数
   * @returns {Promise} 订单列表数据
   */
  getOrderList: (params) => {
    return api.get('/sales/orders', { params });
  },

  /**
   * 获取订单详情
   * @param {number} id - 订单ID
   * @returns {Promise} 订单详情数据
   */
  getOrderDetail: (id) => {
    return api.get(`/sales/orders/${id}`);
  },

  /**
   * 创建订单
   * @param {Object} orderData - 订单数据
   * @returns {Promise} 创建结果
   */
  createOrder: (orderData) => {
    return api.post('/sales/orders', orderData);
  },

  /**
   * 更新订单
   * @param {number} id - 订单ID
   * @param {Object} orderData - 订单数据
   * @returns {Promise} 更新结果
   */
  updateOrder: (id, orderData) => {
    return api.put(`/sales/orders/${id}`, orderData);
  },

  /**
   * 删除订单
   * @param {number} id - 订单ID
   * @returns {Promise} 删除结果
   */
  deleteOrder: (id) => {
    return api.delete(`/sales/orders/${id}`);
  },

  /**
   * 批量删除订单
   * @param {Array} ids - 订单ID数组
   * @returns {Promise} 删除结果
   */
  batchDeleteOrders: (ids) => {
    return api.delete('/sales/orders/batch', { data: { ids } });
  },

  /**
   * 提交订单
   * @param {number} id - 订单ID
   * @returns {Promise} 提交结果
   */
  submitOrder: (id) => {
    return api.post(`/sales/orders/${id}/submit`);
  },

  /**
   * 批量提交订单
   * @param {Array} ids - 订单ID数组
   * @returns {Promise} 提交结果
   */
  batchSubmitOrders: (ids) => {
    return api.post('/sales/orders/batch/submit', { ids });
  }
};

export default orderApi;