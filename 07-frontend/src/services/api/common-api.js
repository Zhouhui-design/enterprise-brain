import request from '@/utils/request'

// 通用API服务
export const commonApi = {
  // 文件上传
  upload: {
    // 单文件上传
    single: (file, type = 'common') => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      
      return request.upload('/common/upload/single', formData)
    },
    
    // 多文件上传
    multiple: (files, type = 'common') => {
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append(`files[${index}]`, file)
      })
      formData.append('type', type)
      
      return request.upload('/common/upload/multiple', formData)
    },
    
    // 图片上传（带压缩）
    image: (file, options = {}) => {
      const formData = new FormData()
      formData.append('file', file)
      Object.keys(options).forEach(key => {
        formData.append(key, options[key])
      })
      
      return request.upload('/common/upload/image', formData)
    },
    
    // 获取上传进度
    getProgress: (uploadId) => {
      return request.get(`/common/upload/progress/${uploadId}`)
    }
  },

  // 文件下载
  download: {
    // 下载文件
    file: (fileId, filename) => {
      return request.download(`/common/download/${fileId}`, {}, filename)
    },
    
    // 批量下载（zip）
    batch: (fileIds, filename) => {
      return request.download('/common/download/batch', { fileIds }, filename)
    },
    
    // 导出数据
    export: (type, params, filename) => {
      return request.download(`/common/export/${type}`, params, filename)
    }
  },

  // 地区管理
  region: {
    // 获取省份列表
    getProvinces: () => {
      return request.get('/common/regions/provinces')
    },
    
    // 获取城市列表
    getCities: (provinceCode) => {
      return request.get(`/common/regions/cities/${provinceCode}`)
    },
    
    // 获取区县列表
    getDistricts: (cityCode) => {
      return request.get(`/common/regions/districts/${cityCode}`)
    },
    
    // 获取完整地区树
    getTree: () => {
      return request.get('/common/regions/tree')
    },
    
    // 搜索地区
    search: (keyword) => {
      return request.get('/common/regions/search', { keyword })
    }
  },

  // 字典数据
  dict: {
    // 获取字典数据
    getData: (dictType) => {
      return request.get(`/common/dict/${dictType}`)
    },
    
    // 获取多个字典数据
    getBatchData: (dictTypes) => {
      return request.post('/common/dict/batch', { dictTypes })
    },
    
    // 刷新字典缓存
    refresh: (dictType) => {
      return request.post(`/common/dict/refresh/${dictType}`)
    }
  },

  // 消息通知
  notification: {
    // 获取通知列表
    getList: (params) => {
      return request.get('/common/notifications', params)
    },
    
    // 获取未读数量
    getUnreadCount: () => {
      return request.get('/common/notifications/unread-count')
    },
    
    // 标记已读
    markRead: (id) => {
      return request.put(`/common/notifications/${id}/read`)
    },
    
    // 批量标记已读
    markBatchRead: (ids) => {
      return request.put('/common/notifications/batch-read', { ids })
    },
    
    // 删除通知
    delete: (id) => {
      return request.delete(`/common/notifications/${id}`)
    },
    
    // 发送通知
    send: (data) => {
      return request.post('/common/notifications', data)
    }
  },

  // 搜索功能
  search: {
    // 全局搜索
    global: (keyword, params) => {
      return request.get('/common/search/global', { keyword, ...params })
    },
    
    // 搜索建议
    suggestions: (keyword) => {
      return request.get('/common/search/suggestions', { keyword })
    },
    
    // 高级搜索
    advanced: (params) => {
      return request.get('/common/search/advanced', params)
    }
  },

  // 验证码
  captcha: {
    // 获取图片验证码
    getImage: () => {
      return request.get('/common/captcha/image')
    },
    
    // 获取短信验证码
    getSmsCode: (phone, type = 'login') => {
      return request.post('/common/captcha/sms', { phone, type })
    },
    
    // 获取邮箱验证码
    getEmailCode: (email, type = 'login') => {
      return request.post('/common/captcha/email', { email, type })
    },
    
    // 验证验证码
    verify: (code, key, type = 'image') => {
      return request.post('/common/captcha/verify', { code, key, type })
    }
  },

  // 系统信息
  system: {
    // 获取系统配置
    getConfig: () => {
      return request.get('/common/system/config')
    },
    
    // 获取当前时间
    getCurrentTime: () => {
      return request.get('/common/system/time')
    },
    
    // 健康检查
    healthCheck: () => {
      return request.get('/common/system/health')
    },
    
    // 获取版本信息
    getVersion: () => {
      return request.get('/common/system/version')
    }
  },

  // 统计分析
  statistics: {
    // 获取首页统计
    getHomeStats: () => {
      return request.get('/common/statistics/home')
    },
    
    // 获取图表数据
    getChartData: (type, params) => {
      return request.get(`/common/statistics/chart/${type}`, params)
    },
    
    // 获取趋势数据
    getTrendData: (type, params) => {
      return request.get(`/common/statistics/trend/${type}`, params)
    }
  },

  // 缓存管理
  cache: {
    // 获取缓存信息
    getInfo: () => {
      return request.get('/common/cache/info')
    },
    
    // 清除指定缓存
    clear: (key) => {
      return request.delete(`/common/cache/${key}`)
    },
    
    // 清除所有缓存
    clearAll: () => {
      return request.delete('/common/cache/all')
    }
  }
}