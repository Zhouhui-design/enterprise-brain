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
  }
};

export default mrpAPI;
