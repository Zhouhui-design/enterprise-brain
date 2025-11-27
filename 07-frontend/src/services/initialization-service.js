import request from '@/utils/request'

// 系统初始化服务
export const initializationService = {
  // 系统初始化检查
  checkStatus: () => {
    return request.get('/system/initialization/status')
  },

  // 初始化系统配置
  initialize: (data) => {
    return request.post('/system/initialization/init', data)
  },

  // 数据库初始化
  initDatabase: (data) => {
    return request.post('/system/initialization/database', data)
  },

  // 管理员账户设置
  setupAdmin: (data) => {
    return request.post('/system/initialization/admin', data)
  },

  // 基础数据导入
  importBasicData: (data) => {
    return request.post('/system/initialization/basic-data', data)
  },

  // 系统配置验证
  validateConfig: (data) => {
    return request.post('/system/initialization/validate', data)
  },

  // 完成初始化
  complete: () => {
    return request.post('/system/initialization/complete')
  },

  // 重置系统
  reset: (confirmToken) => {
    return request.post('/system/initialization/reset', { confirmToken })
  }
}

// 本地存储服务
export const storageService = {
  // 设置数据
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('存储失败:', error)
      return false
    }
  },

  // 获取数据
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('读取失败:', error)
      return defaultValue
    }
  },

  // 删除数据
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('删除失败:', error)
      return false
    }
  },

  // 清空存储
  clear: () => {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('清空失败:', error)
      return false
    }
  },

  // 获取存储大小
  getSize: () => {
    let total = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
    return (total / 1024).toFixed(2) + ' KB'
  }
}

// 应用初始化服务
export const appInitializationService = {
  // 初始化应用配置
  initAppConfig: async () => {
    try {
      const config = await request.get('/system/config')
      storageService.setItem('app-config', config)
      return config
    } catch (error) {
      console.error('应用配置初始化失败:', error)
      return null
    }
  },

  // 初始化用户权限
  initUserPermissions: async () => {
    try {
      const permissions = await request.get('/user/permissions')
      storageService.setItem('user-permissions', permissions)
      return permissions
    } catch (error) {
      console.error('用户权限初始化失败:', error)
      return []
    }
  },

  // 初始化路由配置
  initRoutes: async () => {
    try {
      const routes = await request.get('/system/routes')
      storageService.setItem('dynamic-routes', routes)
      return routes
    } catch (error) {
      console.error('路由初始化失败:', error)
      return []
    }
  },

  // 初始化字典数据
  initDictionaries: async () => {
    try {
      const dicts = await request.get('/system/dictionaries/all')
      storageService.setItem('dictionaries', dicts)
      return dicts
    } catch (error) {
      console.error('字典数据初始化失败:', error)
      return {}
    }
  },

  // 执行完整初始化
  initAll: async () => {
    const results = {
      config: null,
      permissions: [],
      routes: [],
      dictionaries: {}
    }

    try {
      results.config = await appInitializationService.initAppConfig()
      results.permissions = await appInitializationService.initUserPermissions()
      results.routes = await appInitializationService.initRoutes()
      results.dictionaries = await appInitializationService.initDictionaries()
    } catch (error) {
      console.error('应用初始化失败:', error)
    }

    return results
  }
}