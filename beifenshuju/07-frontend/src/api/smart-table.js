// 07-frontend/src/api/smart-table.js
import request from '@/utils/request'

export default {
  /**
   * 获取表格列表
   */
  getTableList(params) {
    return request({
      url: '/api/smart-table/list',
      method: 'get',
      params
    })
  },
  
  /**
   * 获取表格配置
   * @param id 表格ID
   */
  getTableConfig(id) {
    return request({
      url: `/api/smart-table/config/${id}`,
      method: 'get'
    })
  },
  
  /**
   * 保存表格配置
   */
  saveTableConfig(data) {
    return request({
      url: '/api/smart-table/config',
      method: 'post',
      data
    })
  },
  
  /**
   * 删除表格
   * @param id 表格ID
   */
  deleteTable(id) {
    return request({
      url: `/api/smart-table/${id}`,
      method: 'delete'
    })
  }
}
