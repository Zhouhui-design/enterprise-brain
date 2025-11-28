import request from '@/utils/request'

// 主题管理API服务
export const themeApi = {
  // 主题配置
  config: {
    // 获取主题列表
    getList: (params) => {
      return request.get('/theme/configs', params)
    },
    
    // 获取主题详情
    getDetail: (id) => {
      return request.get(`/theme/configs/${id}`)
    },
    
    // 创建主题配置
    create: (data) => {
      return request.post('/theme/configs', data)
    },
    
    // 更新主题配置
    update: (id, data) => {
      return request.put(`/theme/configs/${id}`, data)
    },
    
    // 删除主题配置
    delete: (id) => {
      return request.delete(`/theme/configs/${id}`)
    },
    
    // 复制主题配置
    copy: (id, data) => {
      return request.post(`/theme/configs/${id}/copy`, data)
    }
  },

  // 预设主题
  preset: {
    // 获取预设主题列表
    getList: () => {
      return request.get('/theme/presets')
    },
    
    // 获取预设主题详情
    getDetail: (name) => {
      return request.get(`/theme/presets/${name}`)
    },
    
    // 应用预设主题
    apply: (name, customization = {}) => {
      return request.post(`/theme/presets/${name}/apply`, customization)
    },
    
    // 预览预设主题
    preview: (name) => {
      return request.get(`/theme/presets/${name}/preview`)
    }
  },

  // 颜色管理
  color: {
    // 获取颜色方案
    getSchemes: () => {
      return request.get('/theme/colors/schemes')
    },
    
    // 生成颜色变体
    generateVariants: (baseColor) => {
      return request.post('/theme/colors/variants', { baseColor })
    },
    
    // 颜色和谐度分析
    analyzeHarmony: (colors) => {
      return request.post('/theme/colors/harmony', { colors })
    },
    
    // 获取颜色趋势
    getTrends: () => {
      return request.get('/theme/colors/trends')
    }
  },

  // 布局配置
  layout: {
    // 获取布局模板
    getTemplates: () => {
      return request.get('/theme/layouts/templates')
    },
    
    // 保存布局配置
    saveConfig: (data) => {
      return request.post('/theme/layouts/config', data)
    },
    
    // 获取布局配置
    getConfig: (userId) => {
      return request.get(`/theme/layouts/config/${userId}`)
    },
    
    // 重置布局配置
    resetConfig: (userId) => {
      return request.delete(`/theme/layouts/config/${userId}`)
    }
  },

  // 组件主题
  component: {
    // 获取组件主题列表
    getList: (params) => {
      return request.get('/theme/components', params)
    },
    
    // 获取组件主题详情
    getDetail: (componentType) => {
      return request.get(`/theme/components/${componentType}`)
    },
    
    // 创建组件主题
    create: (data) => {
      return request.post('/theme/components', data)
    },
    
    // 更新组件主题
    update: (componentType, data) => {
      return request.put(`/theme/components/${componentType}`, data)
    },
    
    // 删除组件主题
    delete: (componentType) => {
      return request.delete(`/theme/components/${componentType}`)
    }
  },

  // 主题发布
  publish: {
    // 发布主题
    publish: (themeId, data) => {
      return request.post(`/theme/publish/${themeId}`, data)
    },
    
    // 获取发布历史
    getHistory: (themeId) => {
      return request.get(`/theme/publish/${themeId}/history`)
    },
    
    // 回滚版本
    rollback: (themeId, version) => {
      return request.post(`/theme/publish/${themeId}/rollback`, { version })
    },
    
    // 获取预览链接
    getPreviewUrl: (themeId) => {
      return request.get(`/theme/publish/${themeId}/preview`)
    }
  },

  // 主题市场
  marketplace: {
    // 获取市场主题列表
    getList: (params) => {
      return request.get('/theme/marketplace', params)
    },
    
    // 获取主题详情
    getDetail: (themeId) => {
      return request.get(`/theme/marketplace/${themeId}`)
    },
    
    // 购买主题
    purchase: (themeId, data) => {
      return request.post(`/theme/marketplace/${themeId}/purchase`, data)
    },
    
    // 评价主题
    rate: (themeId, data) => {
      return request.post(`/theme/marketplace/${themeId}/rate`, data)
    },
    
    // 获取我的购买记录
    getPurchases: (params) => {
      return request.get('/theme/marketplace/purchases', params)
    }
  },

  // 主题统计
  statistics: {
    // 获取使用统计
    getUsageStats: (themeId) => {
      return request.get(`/theme/statistics/usage/${themeId}`)
    },
    
    // 获取下载统计
    getDownloadStats: (themeId) => {
      return request.get(`/theme/statistics/downloads/${themeId}`)
    },
    
    // 获取评价统计
    getRatingStats: (themeId) => {
      return request.get(`/theme/statistics/ratings/${themeId}`)
    },
    
    // 获取热门主题
    getPopular: (params) => {
      return request.get('/theme/statistics/popular', params)
    }
  },

  // 主题同步
  sync: {
    // 同步主题配置
    syncConfig: (data) => {
      return request.post('/theme/sync/config', data)
    },
    
    // 获取同步状态
    getSyncStatus: () => {
      return request.get('/theme/sync/status')
    },
    
    // 强制同步
    forceSync: () => {
      return request.post('/theme/sync/force')
    }
  },

  // 主题导入导出
  importExport: {
    // 导出主题
    export: (themeId, format = 'json') => {
      return request.download(`/theme/export/${themeId}`, { format }, `theme-${themeId}.${format}`)
    },
    
    // 导入主题
    import: (data) => {
      return request.upload('/theme/import', data)
    },
    
    // 验证主题文件
    validate: (data) => {
      return request.upload('/theme/validate', data)
    },
    
    // 获取导入历史
    getImportHistory: (params) => {
      return request.get('/theme/import/history', params)
    }
  },

  // 主题缓存
  cache: {
    // 清除主题缓存
    clear: (themeId) => {
      return request.delete(`/theme/cache/${themeId}`)
    },
    
    // 清除所有主题缓存
    clearAll: () => {
      return request.delete('/theme/cache/all')
    },
    
    // 预热主题缓存
    warmup: (themeId) => {
      return request.post(`/theme/cache/warmup/${themeId}`)
    },
    
    // 获取缓存状态
    getStatus: () => {
      return request.get('/theme/cache/status')
    }
  }
}