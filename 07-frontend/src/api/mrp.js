import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.2.229:3005/api';

/**
 * MRP运算API
 */
const mrpAPI = {
  /**
   * 执行MRP运算
   * @param {Array<number>} orderIds - 销售订单ID列表
   * @returns {Promise} MRP运算结果
   */
  calculate: async (orderIds) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/mrp/calculate`, {
        orderIds
      });
      return response.data;
    } catch (error) {
      console.error('MRP运算失败:', error);
      throw error;
    }
  },

  /**
   * ✅ 保存物料需求明细到MySQL
   * @param {Array} demands - 需求明细列表
   * @returns {Promise}
   */
  saveMaterialDemands: async (demands) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/mrp/material-demands/save`, {
        demands
      });
      return response.data;
    } catch (error) {
      console.error('保存物料需求明细失败:', error);
      throw error;
    }
  },

  /**
   * ✅ 从 MySQL 查询物料需求明细
   * @param {Object} params - 查询参数 { sourceNo, materialCode, page, pageSize }
   * @returns {Promise}
   */
  getMaterialDemands: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/mrp/material-demands`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('查询物料需求明细失败:', error);
      throw error;
    }
  }
};

export default mrpAPI;
