import request from '@/utils/request'

// 仪表盘API服务
export const dashboardApi = {
  // 仪表盘配置
  config: {
    // 获取仪表盘列表
    getList: (params) => {
      return request.get('/dashboard/configs', params)
    },
    
    // 获取仪表盘详情
    getDetail: (id) => {
      return request.get(`/dashboard/configs/${id}`)
    },
    
    // 创建仪表盘
    create: (data) => {
      return request.post('/dashboard/configs', data)
    },
    
    // 更新仪表盘
    update: (id, data) => {
      return request.put(`/dashboard/configs/${id}`, data)
    },
    
    // 删除仪表盘
    delete: (id) => {
      return request.delete(`/dashboard/configs/${id}`)
    },
    
    // 复制仪表盘
    copy: (id, data) => {
      return request.post(`/dashboard/configs/${id}/copy`, data)
    }
  },

  // 图表组件
  chart: {
    // 获取图表数据
    getData: (chartId, params) => {
      return request.get(`/dashboard/charts/${chartId}/data`, params)
    },
    
    // 获取图表配置
    getConfig: (chartId) => {
      return request.get(`/dashboard/charts/${chartId}/config`)
    },
    
    // 更新图表配置
    updateConfig: (chartId, data) => {
      return request.put(`/dashboard/charts/${chartId}/config`, data)
    },
    
    // 刷新图表数据
    refresh: (chartId) => {
      return request.post(`/dashboard/charts/${chartId}/refresh`)
    }
  },

  // 首页数据
  home: {
    // 获取首页概览数据
    getOverview: () => {
      return request.get('/dashboard/home/overview')
    },
    
    // 获取快捷入口
    getQuickLinks: () => {
      return request.get('/dashboard/home/quick-links')
    },
    
    // 获取待办事项
    getTodos: (params) => {
      return request.get('/dashboard/home/todos', params)
    },
    
    // 获取最新动态
    getActivities: (params) => {
      return request.get('/dashboard/home/activities', params)
    },
    
    // 获取系统通知
    getNotices: (params) => {
      return request.get('/dashboard/home/notices', params)
    }
  },

  // 实时数据
  realtime: {
    // 获取实时指标
    getMetrics: (keys) => {
      return request.get('/dashboard/realtime/metrics', { keys })
    },
    
    // 获取实时图表数据
    getChartData: (chartId, params) => {
      return request.get(`/dashboard/realtime/charts/${chartId}`, params)
    },
    
    // 获取系统状态
    getSystemStatus: () => {
      return request.get('/dashboard/realtime/system-status')
    },
    
    // 订阅实时数据
    subscribe: (data) => {
      return request.post('/dashboard/realtime/subscribe', data)
    }
  },

  // 报表数据
  report: {
    // 获取业务统计
    getBusinessStats: (params) => {
      return request.get('/dashboard/reports/business', params)
    },
    
    // 获取销售趋势
    getSalesTrend: (params) => {
      return request.get('/dashboard/reports/sales-trend', params)
    },
    
    // 获取用户分析
    getUserAnalysis: (params) => {
      return request.get('/dashboard/reports/user-analysis', params)
    },
    
    // 获取产品分析
    getProductAnalysis: (params) => {
      return request.get('/dashboard/reports/product-analysis', params)
    },
    
    // 获取财务分析
    getFinanceAnalysis: (params) => {
      return request.get('/dashboard/reports/finance-analysis', params)
    }
  },

  // 数据导出
  export: {
    // 导出仪表盘
    exportDashboard: (id, format = 'pdf') => {
      return request.download(`/dashboard/export/dashboard/${id}`, { format }, `dashboard-${id}.${format}`)
    },
    
    // 导出图表
    exportChart: (chartId, format = 'png') => {
      return request.download(`/dashboard/export/chart/${chartId}`, { format }, `chart-${chartId}.${format}`)
    },
    
    // 导出报表数据
    exportData: (reportType, params) => {
      return request.download(`/dashboard/export/data/${reportType}`, params, `${reportType}-data.xlsx`)
    }
  },

  // 个性化设置
  personalization: {
    // 获取用户偏好设置
    getPreferences: () => {
      return request.get('/dashboard/personalization/preferences')
    },
    
    // 更新偏好设置
    updatePreferences: (data) => {
      return request.put('/dashboard/personalization/preferences', data)
    },
    
    // 获取自定义布局
    getLayout: (dashboardId) => {
      return request.get(`/dashboard/personalization/layout/${dashboardId}`)
    },
    
    // 保存自定义布局
    saveLayout: (dashboardId, data) => {
      return request.put(`/dashboard/personalization/layout/${dashboardId}`, data)
    },
    
    // 重置为默认布局
    resetLayout: (dashboardId) => {
      return request.delete(`/dashboard/personalization/layout/${dashboardId}`)
    }
  },

  // 权限管理
  permission: {
    // 获取仪表盘权限
    getPermissions: (dashboardId) => {
      return request.get(`/dashboard/permissions/${dashboardId}`)
    },
    
    // 设置仪表盘权限
    setPermissions: (dashboardId, data) => {
      return request.put(`/dashboard/permissions/${dashboardId}`, data)
    },
    
    // 获取共享设置
    getSharing: (dashboardId) => {
      return request.get(`/dashboard/sharing/${dashboardId}`)
    },
    
    // 设置共享
    setSharing: (dashboardId, data) => {
      return request.put(`/dashboard/sharing/${dashboardId}`, data)
    }
  },

  // 模板管理
  template: {
    // 获取模板列表
    getList: (params) => {
      return request.get('/dashboard/templates', params)
    },
    
    // 获取模板详情
    getDetail: (id) => {
      return request.get(`/dashboard/templates/${id}`)
    },
    
    // 创建模板
    create: (data) => {
      return request.post('/dashboard/templates', data)
    },
    
    // 应用模板
    apply: (templateId, data) => {
      return request.post(`/dashboard/templates/${templateId}/apply`, data)
    },
    
    // 删除模板
    delete: (id) => {
      return request.delete(`/dashboard/templates/${id}`)
    }
  },

  // 数据源管理
  dataSource: {
    // 获取数据源列表
    getList: (params) => {
      return request.get('/dashboard/data-sources', params)
    },
    
    // 测试数据源连接
    testConnection: (data) => {
      return request.post('/dashboard/data-sources/test', data)
    },
    
    // 获取数据源字段
    getFields: (sourceId) => {
      return request.get(`/dashboard/data-sources/${sourceId}/fields`)
    },
    
    // 执行数据查询
    executeQuery: (data) => {
      return request.post('/dashboard/data-sources/query', data)
    }
  }
}