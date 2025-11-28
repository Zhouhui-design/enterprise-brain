import request from '@/utils/request'

// 销售管理API服务
export const salesApi = {
  // 客户管理
  customer: {
    // 获取客户列表
    getList: (params) => {
      return request.get('/sales/customers', params)
    },
    
    // 获取客户详情
    getDetail: (id) => {
      return request.get(`/sales/customers/${id}`)
    },
    
    // 创建客户
    create: (data) => {
      return request.post('/sales/customers', data)
    },
    
    // 更新客户
    update: (id, data) => {
      return request.put(`/sales/customers/${id}`, data)
    },
    
    // 删除客户
    delete: (id) => {
      return request.delete(`/sales/customers/${id}`)
    },
    
    // 获取客户联系人
    getContacts: (customerId) => {
      return request.get(`/sales/customers/${customerId}/contacts`)
    },
    
    // 添加联系人
    addContact: (customerId, data) => {
      return request.post(`/sales/customers/${customerId}/contacts`, data)
    },
    
    // 获取客户订单历史
    getOrderHistory: (customerId, params) => {
      return request.get(`/sales/customers/${customerId}/orders`, params)
    }
  },

  // 销售订单
  order: {
    // 获取订单列表
    getList: (params) => {
      return request.get('/sales/orders', params)
    },
    
    // 获取订单详情
    getDetail: (id) => {
      return request.get(`/sales/orders/${id}`)
    },
    
    // 创建订单
    create: (data) => {
      return request.post('/sales/orders', data)
    },
    
    // 更新订单
    update: (id, data) => {
      return request.put(`/sales/orders/${id}`, data)
    },
    
    // 删除订单
    delete: (id) => {
      return request.delete(`/sales/orders/${id}`)
    },
    
    // 订单审核
    approve: (id, data) => {
      return request.put(`/sales/orders/${id}/approve`, data)
    },
    
    // 订单发货
    ship: (id, data) => {
      return request.put(`/sales/orders/${id}/ship`, data)
    },
    
    // 订单完成
    complete: (id, data) => {
      return request.put(`/sales/orders/${id}/complete`, data)
    },
    
    // 取消订单
    cancel: (id, data) => {
      return request.put(`/sales/orders/${id}/cancel`, data)
    },
    
    // 导出订单
    export: (params) => {
      return request.download('/sales/orders/export', params, 'sales-orders.xlsx')
    }
  },

  // 销售报价
  quotation: {
    // 获取报价列表
    getList: (params) => {
      return request.get('/sales/quotations', params)
    },
    
    // 获取报价详情
    getDetail: (id) => {
      return request.get(`/sales/quotations/${id}`)
    },
    
    // 创建报价
    create: (data) => {
      return request.post('/sales/quotations', data)
    },
    
    // 更新报价
    update: (id, data) => {
      return request.put(`/sales/quotations/${id}`, data)
    },
    
    // 删除报价
    delete: (id) => {
      return request.delete(`/sales/quotations/${id}`)
    },
    
    // 转为订单
    convertToOrder: (id, data) => {
      return request.post(`/sales/quotations/${id}/convert`, data)
    },
    
    // 发送报价
    send: (id, data) => {
      return request.post(`/sales/quotations/${id}/send`, data)
    }
  },

  // 销售合同
  contract: {
    // 获取合同列表
    getList: (params) => {
      return request.get('/sales/contracts', params)
    },
    
    // 获取合同详情
    getDetail: (id) => {
      return request.get(`/sales/contracts/${id}`)
    },
    
    // 创建合同
    create: (data) => {
      return request.post('/sales/contracts', data)
    },
    
    // 更新合同
    update: (id, data) => {
      return request.put(`/sales/contracts/${id}`, data)
    },
    
    // 删除合同
    delete: (id) => {
      return request.delete(`/sales/contracts/${id}`)
    },
    
    // 合同签署
    sign: (id, data) => {
      return request.put(`/sales/contracts/${id}/sign`, data)
    },
    
    // 合同终止
    terminate: (id, data) => {
      return request.put(`/sales/contracts/${id}/terminate`, data)
    }
  },

  // 销售机会
  opportunity: {
    // 获取机会列表
    getList: (params) => {
      return request.get('/sales/opportunities', params)
    },
    
    // 获取机会详情
    getDetail: (id) => {
      return request.get(`/sales/opportunities/${id}`)
    },
    
    // 创建机会
    create: (data) => {
      return request.post('/sales/opportunities', data)
    },
    
    // 更新机会
    update: (id, data) => {
      return request.put(`/sales/opportunities/${id}`, data)
    },
    
    // 删除机会
    delete: (id) => {
      return request.delete(`/sales/opportunities/${id}`)
    },
    
    // 推进阶段
    advanceStage: (id, data) => {
      return request.put(`/sales/opportunities/${id}/advance`, data)
    },
    
    // 赢单
    win: (id, data) => {
      return request.put(`/sales/opportunities/${id}/win`, data)
    },
    
    // 输单
    lose: (id, data) => {
      return request.put(`/sales/opportunities/${id}/lose`, data)
    }
  },

  // 销售目标
  target: {
    // 获取目标列表
    getList: (params) => {
      return request.get('/sales/targets', params)
    },
    
    // 获取目标详情
    getDetail: (id) => {
      return request.get(`/sales/targets/${id}`)
    },
    
    // 创建目标
    create: (data) => {
      return request.post('/sales/targets', data)
    },
    
    // 更新目标
    update: (id, data) => {
      return request.put(`/sales/targets/${id}`, data)
    },
    
    // 删除目标
    delete: (id) => {
      return request.delete(`/sales/targets/${id}`)
    },
    
    // 获取目标完成情况
    getProgress: (id) => {
      return request.get(`/sales/targets/${id}/progress`)
    }
  },

  // 销售统计
  statistics: {
    // 获取销售概览
    getOverview: (params) => {
      return request.get('/sales/statistics/overview', params)
    },
    
    // 获取销售趋势
    getTrend: (params) => {
      return request.get('/sales/statistics/trend', params)
    },
    
    // 获取销售排行
    getRanking: (params) => {
      return request.get('/sales/statistics/ranking', params)
    },
    
    // 获取客户分析
    getCustomerAnalysis: (params) => {
      return request.get('/sales/statistics/customer-analysis', params)
    },
    
    // 获取产品分析
    getProductAnalysis: (params) => {
      return request.get('/sales/statistics/product-analysis', params)
    },
    
    // 导出统计报表
    export: (type, params) => {
      return request.download(`/sales/statistics/export/${type}`, params, `${type}-report.xlsx`)
    }
  },

  // 销售团队
  team: {
    // 获取团队列表
    getList: (params) => {
      return request.get('/sales/teams', params)
    },
    
    // 获取团队成员
    getMembers: (teamId) => {
      return request.get(`/sales/teams/${teamId}/members`)
    },
    
    // 创建团队
    create: (data) => {
      return request.post('/sales/teams', data)
    },
    
    // 更新团队
    update: (id, data) => {
      return request.put(`/sales/teams/${id}`, data)
    },
    
    // 删除团队
    delete: (id) => {
      return request.delete(`/sales/teams/${id}`)
    },
    
    // 分配成员
    assignMembers: (teamId, members) => {
      return request.put(`/sales/teams/${teamId}/members`, { members })
    }
  },

  // 销售活动
  activity: {
    // 获取活动列表
    getList: (params) => {
      return request.get('/sales/activities', params)
    },
    
    // 创建活动
    create: (data) => {
      return request.post('/sales/activities', data)
    },
    
    // 更新活动
    update: (id, data) => {
      return request.put(`/sales/activities/${id}`, data)
    },
    
    // 删除活动
    delete: (id) => {
      return request.delete(`/sales/activities/${id}`)
    },
    
    // 完成活动
    complete: (id, data) => {
      return request.put(`/sales/activities/${id}/complete`, data)
    }
  }
}