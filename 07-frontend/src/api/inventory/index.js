/**
 * 库存管理相关API
 */
import request from '@/services/utils/request'

/**
 * 库存列表API
 */
export const inventoryApi = {
  /**
   * 获取库存列表
   * @param {Object} params - 查询参数
   */
  getInventoryList(params) {
    return request({
      url: '/api/inventory/list',
      method: 'get',
      params
    })
  },

  /**
   * 获取库存详情
   * @param {String} id - 库存ID
   */
  getInventoryDetail(id) {
    return request({
      url: `/api/inventory/${id}`,
      method: 'get'
    })
  },

  /**
   * 更新库存
   * @param {Object} data - 库存数据
   */
  updateInventory(data) {
    return request({
      url: '/api/inventory/update',
      method: 'put',
      data
    })
  },

  /**
   * 批量更新库存
   * @param {Array} data - 库存数据列表
   */
  batchUpdateInventory(data) {
    return request({
      url: '/api/inventory/batch-update',
      method: 'put',
      data
    })
  },

  /**
   * 获取库存统计
   */
  getInventoryStats() {
    return request({
      url: '/api/inventory/stats',
      method: 'get'
    })
  },

  /**
   * 导出库存数据
   * @param {Object} params - 查询参数
   */
  exportInventory(params) {
    return request({
      url: '/api/inventory/export',
      method: 'get',
      params
    })
  },

  /**
   * 导入库存数据
   * @param {Array} data - 库存数据列表
   */
  importInventory(data) {
    return request({
      url: '/api/inventory/import',
      method: 'post',
      data
    })
  },

  /**
   * 清空库存列表
   * @param {Object} params - 查询参数
   */
  clearInventory(params) {
    return request({
      url: '/api/inventory/clear',
      method: 'delete',
      params
    })
  }
}

/**
 * 库存调拨API
 */
export const stockTransferApi = {
  /**
   * 创建调拨单
   * @param {Object} data - 调拨单数据
   */
  createTransfer(data) {
    return request({
      url: '/api/inventory/transfer/create',
      method: 'post',
      data
    })
  },

  /**
   * 获取调拨单列表
   * @param {Object} params - 查询参数
   */
  getTransferList(params) {
    return request({
      url: '/api/inventory/transfer/list',
      method: 'get',
      params
    })
  },

  /**
   * 获取调拨单详情
   * @param {String} id - 调拨单ID
   */
  getTransferDetail(id) {
    return request({
      url: `/api/inventory/transfer/${id}`,
      method: 'get'
    })
  },

  /**
   * 审核调拨单
   * @param {Object} data - 审核数据
   */
  approveTransfer(data) {
    return request({
      url: '/api/inventory/transfer/approve',
      method: 'post',
      data
    })
  },

  /**
   * 执行调拨
   * @param {String} id - 调拨单ID
   */
  executeTransfer(id) {
    return request({
      url: `/api/inventory/transfer/execute/${id}`,
      method: 'post'
    })
  }
}

/**
 * 盘点API
 */
export const stockTakingApi = {
  /**
   * 创建盘点任务
   * @param {Object} data - 盘点任务数据
   */
  createStockTaking(data) {
    return request({
      url: '/api/inventory/stock-taking/create',
      method: 'post',
      data
    })
  },

  /**
   * 获取盘点任务列表
   * @param {Object} params - 查询参数
   */
  getStockTakingList(params) {
    return request({
      url: '/api/inventory/stock-taking/list',
      method: 'get',
      params
    })
  },

  /**
   * 获取盘点任务详情
   * @param {String} id - 盘点任务ID
   */
  getStockTakingDetail(id) {
    return request({
      url: `/api/inventory/stock-taking/${id}`,
      method: 'get'
    })
  },

  /**
   * 提交盘点数据
   * @param {Object} data - 盘点数据
   */
  submitStockTaking(data) {
    return request({
      url: '/api/inventory/stock-taking/submit',
      method: 'post',
      data
    })
  },

  /**
   * 完成盘点
   * @param {String} id - 盘点任务ID
   */
  completeStockTaking(id) {
    return request({
      url: `/api/inventory/stock-taking/complete/${id}`,
      method: 'post'
    })
  }
}

/**
 * 库存预警API
 */
export const inventoryAlertApi = {
  /**
   * 获取预警列表
   * @param {Object} params - 查询参数
   */
  getAlertList(params) {
    return request({
      url: '/api/inventory/alert/list',
      method: 'get',
      params
    })
  },

  /**
   * 获取预警配置
   */
  getAlertConfig() {
    return request({
      url: '/api/inventory/alert/config',
      method: 'get'
    })
  },

  /**
   * 更新预警配置
   * @param {Object} data - 配置数据
   */
  updateAlertConfig(data) {
    return request({
      url: '/api/inventory/alert/config',
      method: 'put',
      data
    })
  },

  /**
   * 处理预警
   * @param {Object} data - 处理数据
   */
  handleAlert(data) {
    return request({
      url: '/api/inventory/alert/handle',
      method: 'post',
      data
    })
  }
}

/**
 * 库存报表API
 */
export const inventoryReportApi = {
  /**
   * 获取库存报表
   * @param {Object} params - 查询参数
   */
  getInventoryReport(params) {
    return request({
      url: '/api/inventory/report/inventory',
      method: 'get',
      params
    })
  },

  /**
   * 获取出入库报表
   * @param {Object} params - 查询参数
   */
  getInOutReport(params) {
    return request({
      url: '/api/inventory/report/in-out',
      method: 'get',
      params
    })
  },

  /**
   * 获取库存周转率报表
   * @param {Object} params - 查询参数
   */
  getTurnoverReport(params) {
    return request({
      url: '/api/inventory/report/turnover',
      method: 'get',
      params
    })
  },

  /**
   * 导出报表
   * @param {Object} params - 导出参数
   */
  exportReport(params) {
    return request({
      url: '/api/inventory/report/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  }
}

/**
 * 库存流水API
 */
export const stockMovementApi = {
  /**
   * 获取库存流水
   * @param {Object} params - 查询参数
   */
  getMovementList(params) {
    return request({
      url: '/api/inventory/movement/list',
      method: 'get',
      params
    })
  },

  /**
   * 获取流水详情
   * @param {String} id - 流水ID
   */
  getMovementDetail(id) {
    return request({
      url: `/api/inventory/movement/${id}`,
      method: 'get'
    })
  }
}

/**
 * 库存调整API
 */
export const inventoryAdjustmentApi = {
  /**
   * 创建调整单
   * @param {Object} data - 调整单数据
   */
  createAdjustment(data) {
    return request({
      url: '/api/inventory/adjustment/create',
      method: 'post',
      data
    })
  },

  /**
   * 获取调整单列表
   * @param {Object} params - 查询参数
   */
  getAdjustmentList(params) {
    return request({
      url: '/api/inventory/adjustment/list',
      method: 'get',
      params
    })
  },

  /**
   * 获取调整单详情
   * @param {String} id - 调整单ID
   */
  getAdjustmentDetail(id) {
    return request({
      url: `/api/inventory/adjustment/${id}`,
      method: 'get'
    })
  },

  /**
   * 审核调整单
   * @param {Object} data - 审核数据
   */
  approveAdjustment(data) {
    return request({
      url: '/api/inventory/adjustment/approve',
      method: 'post',
      data
    })
  }
}

/**
 * 库位管理API
 */
export const locationApi = {
  /**
   * 获取库位列表
   * @param {Object} params - 查询参数
   */
  getLocationList(params) {
    return request({
      url: '/api/inventory/location/list',
      method: 'get',
      params
    })
  },

  /**
   * 创建库位
   * @param {Object} data - 库位数据
   */
  createLocation(data) {
    return request({
      url: '/api/inventory/location/create',
      method: 'post',
      data
    })
  },

  /**
   * 更新库位
   * @param {Object} data - 库位数据
   */
  updateLocation(data) {
    return request({
      url: '/api/inventory/location/update',
      method: 'put',
      data
    })
  },

  /**
   * 删除库位
   * @param {String} id - 库位ID
   */
  deleteLocation(id) {
    return request({
      url: `/api/inventory/location/${id}`,
      method: 'delete'
    })
  }
}