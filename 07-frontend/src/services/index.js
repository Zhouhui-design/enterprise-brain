// API服务入口文件

// 导出所有API服务
export { systemApi } from './api/system-api.js'
export { commonApi } from './api/common-api.js'
export { financeApi } from './api/finance-api.js'
export { salesApi } from './api/sales-api.js'
export { aiApi } from './api/ai-api.js'
export { dashboardApi } from './api/dashboard-api.js'
export { themeApi } from './api/theme-api.js'

// 导出其他API服务（如果存在）
export { auditService } from './api/auditService'

// 导出通用服务
export { 
  initializationService, 
  storageService, 
  appInitializationService 
} from './initialization-service.js'

export { 
  themeService, 
  themeUtils 
} from './theme-service.js'

export { 
  validationService, 
  FormValidator, 
  validationPresets, 
  asyncValidationService 
} from './validation-service.js'

export { 
  errorHandlingService, 
  promiseErrorHandler, 
  formErrorHandler 
} from './error-handling-service.js'

export { 
  guideService 
} from './guide-service.js'

// API服务统一管理器
class ApiServiceManager {
  constructor() {
    this.apis = new Map()
    this.interceptors = []
    this.config = {
      baseURL: process.env.VUE_APP_BASE_API || '/api',
      timeout: 15000,
      retries: 3
    }
  }

  // 注册API服务
  register(name, apiService) {
    this.apis.set(name, apiService)
  }

  // 获取API服务
  get(name) {
    return this.apis.get(name)
  }

  // 获取所有API服务
  getAll() {
    const result = {}
    this.apis.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  // 添加请求拦截器
  addRequestInterceptor(interceptor) {
    this.interceptors.push({
      type: 'request',
      handler: interceptor
    })
  }

  // 添加响应拦截器
  addResponseInterceptor(interceptor) {
    this.interceptors.push({
      type: 'response',
      handler: interceptor
    })
  }

  // 执行拦截器
  executeInterceptors(type, config) {
    this.interceptors
      .filter(interceptor => interceptor.type === type)
      .forEach(interceptor => {
        config = interceptor.handler(config)
      })
    return config
  }

  // 批量API调用
  async batch(calls) {
    const promises = calls.map(call => {
      const { api, method, params, data } = call
      const apiService = this.get(api)
      if (!apiService || !apiService[method]) {
        throw new Error(`API ${api}.${method} not found`)
      }
      return apiService[method](params || data)
    })

    try {
      return await Promise.all(promises)
    } catch (error) {
      throw error
    }
  }

  // 并发API调用（最多成功的）
  async race(calls) {
    const promises = calls.map(call => {
      const { api, method, params, data } = call
      const apiService = this.get(api)
      if (!apiService || !apiService[method]) {
        throw new Error(`API ${api}.${method} not found`)
      }
      return apiService[method](params || data)
    })

    try {
      return await Promise.race(promises)
    } catch (error) {
      throw error
    }
  }

  // 条件API调用
  async conditional(condition, trueCall, falseCall) {
    if (condition) {
      const { api, method, params, data } = trueCall
      const apiService = this.get(api)
      if (apiService && apiService[method]) {
        return await apiService[method](params || data)
      }
    } else if (falseCall) {
      const { api, method, params, data } = falseCall
      const apiService = this.get(api)
      if (apiService && apiService[method]) {
        return await apiService[method](params || data)
      }
    }
  }

  // 缓存API调用结果
  async cached(cacheKey, apiCall, ttl = 300000) { // 默认5分钟
    const cacheData = localStorage.getItem(`api-cache-${cacheKey}`)
    
    if (cacheData) {
      const { data, timestamp } = JSON.parse(cacheData)
      if (Date.now() - timestamp < ttl) {
        return data
      }
    }

    try {
      const { api, method, params, data } = apiCall
      const apiService = this.get(api)
      if (!apiService || !apiService[method]) {
        throw new Error(`API ${api}.${method} not found`)
      }
      
      const result = await apiService[method](params || data)
      
      // 缓存结果
      localStorage.setItem(`api-cache-${cacheKey}`, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }))
      
      return result
    } catch (error) {
      throw error
    }
  }

  // 清除API缓存
  clearCache(pattern = null) {
    const keys = Object.keys(localStorage)
    
    if (pattern) {
      const regex = new RegExp(pattern)
      keys.forEach(key => {
        if (key.startsWith('api-cache-') && regex.test(key)) {
          localStorage.removeItem(key)
        }
      })
    } else {
      keys.forEach(key => {
        if (key.startsWith('api-cache-')) {
          localStorage.removeItem(key)
        }
      })
    }
  }

  // API性能监控
  monitor(apiCall) {
    const startTime = performance.now()
    
    return apiCall
      .then(result => {
        const endTime = performance.now()
        const duration = endTime - startTime
        
        console.log(`API Call Performance: ${duration.toFixed(2)}ms`, apiCall)
        
        // 记录性能数据
        this.recordPerformance(apiCall, duration, true)
        
        return result
      })
      .catch(error => {
        const endTime = performance.now()
        const duration = endTime - startTime
        
        console.error(`API Call Failed: ${duration.toFixed(2)}ms`, apiCall, error)
        
        // 记录性能数据
        this.recordPerformance(apiCall, duration, false)
        
        throw error
      })
  }

  // 记录性能数据
  recordPerformance(apiCall, duration, success) {
    const performanceData = {
      api: apiCall.api,
      method: apiCall.method,
      duration,
      success,
      timestamp: new Date().toISOString()
    }

    // 存储性能数据
    const existingData = localStorage.getItem('api-performance')
    const performanceLogs = existingData ? JSON.parse(existingData) : []
    
    performanceLogs.push(performanceData)
    
    // 限制日志数量
    if (performanceLogs.length > 1000) {
      performanceLogs.splice(0, performanceLogs.length - 1000)
    }
    
    localStorage.setItem('api-performance', JSON.stringify(performanceLogs))
  }

  // 获取性能报告
  getPerformanceReport() {
    const performanceLogs = JSON.parse(localStorage.getItem('api-performance') || '[]')
    
    if (performanceLogs.length === 0) {
      return null
    }

    const totalCalls = performanceLogs.length
    const successfulCalls = performanceLogs.filter(log => log.success).length
    const failedCalls = totalCalls - successfulCalls
    
    const avgDuration = performanceLogs.reduce((sum, log) => sum + log.duration, 0) / totalCalls
    const maxDuration = Math.max(...performanceLogs.map(log => log.duration))
    const minDuration = Math.min(...performanceLogs.map(log => log.duration))

    // API调用次数统计
    const apiStats = {}
    performanceLogs.forEach(log => {
      const key = `${log.api}.${log.method}`
      if (!apiStats[key]) {
        apiStats[key] = { count: 0, totalDuration: 0, successCount: 0 }
      }
      apiStats[key].count++
      apiStats[key].totalDuration += log.duration
      if (log.success) {
        apiStats[key].successCount++
      }
    })

    // 计算每个API的平均耗时
    Object.keys(apiStats).forEach(key => {
      const stats = apiStats[key]
      stats.avgDuration = stats.totalDuration / stats.count
      stats.successRate = (stats.successCount / stats.count * 100).toFixed(1)
    })

    return {
      summary: {
        totalCalls,
        successfulCalls,
        failedCalls,
        successRate: (successfulCalls / totalCalls * 100).toFixed(1),
        avgDuration: avgDuration.toFixed(2),
        maxDuration: maxDuration.toFixed(2),
        minDuration: minDuration.toFixed(2)
      },
      apiStats
    }
  }

  // 清除性能数据
  clearPerformanceData() {
    localStorage.removeItem('api-performance')
  }
}

// 创建API服务管理器实例
const apiManager = new ApiServiceManager()

// 自动注册所有API服务
const apiModules = {
  system: systemApi,
  common: commonApi,
  finance: financeApi,
  sales: salesApi,
  ai: aiApi,
  dashboard: dashboardApi,
  theme: themeApi
}

Object.entries(apiModules).forEach(([name, api]) => {
  if (api) {
    apiManager.register(name, api)
  }
})

// 添加默认请求拦截器
apiManager.addRequestInterceptor((config) => {
  // 添加时间戳防止缓存
  if (config.method === 'get' && !config.params) {
    config.params = { _t: Date.now() }
  } else if (config.method === 'get' && config.params) {
    config.params._t = Date.now()
  }
  
  return config
})

// 添加默认响应拦截器
apiManager.addResponseInterceptor((response) => {
  // 统一处理响应数据
  if (response.data && response.data.code !== undefined) {
    if (response.data.code === 200) {
      return response.data.data || response.data
    } else {
      throw new Error(response.data.message || '请求失败')
    }
  }
  
  return response
})

// 导出管理器实例和工具函数
export { apiManager, ApiServiceManager }

// 导出便捷方法
export const api = {
  // 获取API服务
  get: (name) => apiManager.get(name),
  
  // 批量调用
  batch: (calls) => apiManager.batch(calls),
  
  // 并发调用
  race: (calls) => apiManager.race(calls),
  
  // 条件调用
  conditional: (condition, trueCall, falseCall) => 
    apiManager.conditional(condition, trueCall, falseCall),
  
  // 缓存调用
  cached: (cacheKey, apiCall, ttl) => apiManager.cached(cacheKey, apiCall, ttl),
  
  // 性能监控调用
  monitor: (apiCall) => apiManager.monitor(apiCall),
  
  // 获取所有API
  all: () => apiManager.getAll()
}

// 默认导出
export default {
  ...apiModules,
  apiManager,
  api,
  // 通用服务
  initializationService,
  storageService,
  appInitializationService,
  themeService,
  themeUtils,
  validationService,
  FormValidator,
  validationPresets,
  asyncValidationService,
  errorHandlingService,
  promiseErrorHandler,
  formErrorHandler,
  guideService
}