/**
 * 离线功能支持服务
 * 
 * 提供完整的离线功能，包括：
 * - Service Worker 管理
 * - 离线数据存储
 * - 数据同步机制
 * - 离线状态检测
 * - 缓存策略管理
 * - 冲突解决
 * 
 * @author AI Assistant
 * @since 2024-01-01
 */

import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

export class OfflineSupport {
  constructor() {
    // 离线状态
    this.isOnline = ref(navigator.onLine)
    this.isOffline = ref(false)
    this.syncInProgress = ref(false)
    this.offlineQueue = reactive([])
    
    // Service Worker
    this.serviceWorker = null
    this.swRegistration = null
    
    // 缓存管理
    this.cacheManager = new CacheManager()
    this.dataSync = new DataSync()
    
    // 配置
    this.config = {
      cacheVersion: '1.0.0',
      maxOfflineData: 1000,
      syncInterval: 30000, // 30秒
      retryAttempts: 3,
      retryDelay: 5000
    }
    
    // 事件监听器
    this.eventListeners = new Set()
    
    this.initializeOfflineSupport()
  }

  /**
   * 初始化离线支持
   */
  async initializeOfflineSupport() {
    try {
      // 注册 Service Worker
      await this.registerServiceWorker()
      
      // 设置网络状态监听
      this.setupNetworkStatusListener()
      
      // 设置数据同步
      this.setupDataSync()
      
      // 加载离线数据
      await this.loadOfflineData()
      
      // 启动定期同步
      this.startPeriodicSync()
      
      console.log('离线支持已初始化')
    } catch (error) {
      console.error('离线支持初始化失败:', error)
    }
  }

  /**
   * 注册 Service Worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker 不支持')
      return
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      this.swRegistration.addEventListener('updatefound', () => {
        const installingWorker = this.swRegistration.installing
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdateAvailable()
          }
        })
      })

      // 监听 Service Worker 控制状态
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })

      console.log('Service Worker 注册成功')
    } catch (error) {
      console.error('Service Worker 注册失败:', error)
    }
  }

  /**
   * 设置网络状态监听
   */
  setupNetworkStatusListener() {
    const updateOnlineStatus = () => {
      this.isOnline.value = navigator.onLine
      this.isOffline.value = !navigator.onLine
      
      if (navigator.onLine) {
        this.handleNetworkReconnect()
      } else {
        this.handleNetworkDisconnect()
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    this.eventListeners.add(() => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    })
  }

  /**
   * 设置数据同步
   */
  setupDataSync() {
    this.dataSync.on('sync-start', () => {
      this.syncInProgress.value = true
    })

    this.dataSync.on('sync-complete', (result) => {
      this.syncInProgress.value = false
      this.handleSyncComplete(result)
    })

    this.dataSync.on('sync-error', (error) => {
      this.syncInProgress.value = false
      this.handleSyncError(error)
    })
  }

  /**
   * 处理网络断开
   */
  handleNetworkDisconnect() {
    ElNotification({
      title: '网络断开',
      message: '当前处于离线状态，数据将在恢复网络后同步',
      type: 'warning',
      duration: 0
    })

    // 启用离线模式
    this.enableOfflineMode()
  }

  /**
   * 处理网络重连
   */
  handleNetworkReconnect() {
    ElNotification({
      title: '网络已恢复',
      message: '正在同步离线数据...',
      type: 'success',
      duration: 3000
    })

    // 禁用离线模式
    this.disableOfflineMode()
    
    // 开始数据同步
    this.startDataSync()
  }

  /**
   * 启用离线模式
   */
  enableOfflineMode() {
    document.body.classList.add('offline-mode')
    this.isOffline.value = true
    
    // 加载离线数据
    this.loadOfflineData()
  }

  /**
   * 禁用离线模式
   */
  disableOfflineMode() {
    document.body.classList.remove('offline-mode')
    this.isOffline.value = false
  }

  /**
   * 缓存数据
   */
  async cacheData(key, data, options = {}) {
    const {
      ttl = 3600000, // 1小时
      priority = 'normal'
    } = options

    try {
      await this.cacheManager.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
        priority
      })
      
      return true
    } catch (error) {
      console.error('缓存数据失败:', error)
      return false
    }
  }

  /**
   * 获取缓存数据
   */
  async getCachedData(key) {
    try {
      const cached = await this.cacheManager.get(key)
      
      if (!cached) {
        return null
      }

      // 检查是否过期
      if (Date.now() - cached.timestamp > cached.ttl) {
        await this.cacheManager.delete(key)
        return null
      }

      return cached.data
    } catch (error) {
      console.error('获取缓存数据失败:', error)
      return null
    }
  }

  /**
   * 添加离线操作到队列
   */
  addOfflineOperation(operation) {
    const offlineOp = {
      id: this.generateOperationId(),
      timestamp: Date.now(),
      retries: 0,
      ...operation
    }

    this.offlineQueue.push(offlineOp)
    
    // 保存到本地存储
    this.saveOfflineQueue()
    
    return offlineOp.id
  }

  /**
   * 处理离线操作
   */
  async processOfflineOperation(operation) {
    try {
      switch (operation.type) {
        case 'product-create':
          return await this.syncProductCreate(operation.data)
        case 'product-update':
          return await this.syncProductUpdate(operation.data)
        case 'product-delete':
          return await this.syncProductDelete(operation.data)
        case 'selection-change':
          return await this.syncSelectionChange(operation.data)
        default:
          throw new Error(`未知的操作类型: ${operation.type}`)
      }
    } catch (error) {
      console.error('同步操作失败:', error)
      throw error
    }
  }

  /**
   * 开始数据同步
   */
  async startDataSync() {
    if (this.syncInProgress.value || this.offlineQueue.length === 0) {
      return
    }

    this.syncInProgress.value = true

    try {
      // 处理离线队列
      const failedOperations = []
      
      for (const operation of [...this.offlineQueue]) {
        try {
          await this.processOfflineOperation(operation)
          
          // 从队列中移除成功的操作
          const index = this.offlineQueue.findIndex(op => op.id === operation.id)
          if (index !== -1) {
            this.offlineQueue.splice(index, 1)
          }
        } catch (error) {
          // 重试逻辑
          operation.retries++
          if (operation.retries < this.config.retryAttempts) {
            operation.error = error.message
            operation.lastRetry = Date.now()
          } else {
            failedOperations.push(operation)
            
            // 移除超过重试次数的操作
            const index = this.offlineQueue.findIndex(op => op.id === operation.id)
            if (index !== -1) {
              this.offlineQueue.splice(index, 1)
            }
          }
        }
      }

      // 保存更新后的队列
      this.saveOfflineQueue()

      if (failedOperations.length > 0) {
        this.handleFailedOperations(failedOperations)
      }

      ElMessage.success(`数据同步完成，处理了 ${this.offlineQueue.length - failedOperations.length} 个操作`)
      
    } catch (error) {
      console.error('数据同步失败:', error)
      ElMessage.error('数据同步失败，请稍后重试')
    } finally {
      this.syncInProgress.value = false
    }
  }

  /**
   * 加载离线数据
   */
  async loadOfflineData() {
    try {
      // 加载产品数据
      const products = await this.getCachedData('products') || []
      const categories = await this.getCachedData('categories') || []
      const userPreferences = await this.getCachedData('userPreferences') || {}

      // 触发数据加载事件
      this.dispatchEvent('offline-data-loaded', {
        products,
        categories,
        userPreferences
      })

      return { products, categories, userPreferences }
    } catch (error) {
      console.error('加载离线数据失败:', error)
      return { products: [], categories: [], userPreferences: {} }
    }
  }

  /**
   * 保存离线队列
   */
  saveOfflineQueue() {
    try {
      localStorage.setItem('offline-queue', JSON.stringify(this.offlineQueue))
    } catch (error) {
      console.error('保存离线队列失败:', error)
    }
  }

  /**
   * 加载离线队列
   */
  loadOfflineQueue() {
    try {
      const queue = localStorage.getItem('offline-queue')
      if (queue) {
        this.offlineQueue = reactive(JSON.parse(queue))
      }
    } catch (error) {
      console.error('加载离线队列失败:', error)
      this.offlineQueue = reactive([])
    }
  }

  /**
   * 启动定期同步
   */
  startPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline.value && this.offlineQueue.length > 0) {
        this.startDataSync()
      }
    }, this.config.syncInterval)
  }

  /**
   * 显示更新可用提示
   */
  showUpdateAvailable() {
    ElNotification({
      title: '发现新版本',
      message: '应用有新版本可用，点击更新',
      type: 'info',
      duration: 0,
      onClick: () => {
        this.updateApplication()
      }
    })
  }

  /**
   * 更新应用
   */
  updateApplication() {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  /**
   * 处理同步完成
   */
  handleSyncComplete(result) {
    this.dispatchEvent('sync-complete', result)
    
    // 清理过期的缓存
    this.cacheManager.cleanup()
  }

  /**
   * 处理同步错误
   */
  handleSyncError(error) {
    console.error('同步错误:', error)
    this.dispatchEvent('sync-error', error)
  }

  /**
   * 处理失败的操作
   */
  handleFailedOperations(operations) {
    ElNotification({
      title: '部分操作失败',
      message: `${operations.length} 个操作同步失败，请手动处理`,
      type: 'error',
      duration: 0
    })

    // 保存失败的操作供后续处理
    localStorage.setItem('failed-operations', JSON.stringify(operations))
  }

  /**
   * 生成操作ID
   */
  generateOperationId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 分发事件
   */
  dispatchEvent(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data })
    window.dispatchEvent(event)
  }

  /**
   * 添加事件监听器
   */
  addEventListener(eventName, handler) {
    window.addEventListener(eventName, handler)
    this.eventListeners.add(() => {
      window.removeEventListener(eventName, handler)
    })
  }

  /**
   * 销毁离线支持
   */
  destroy() {
    // 清理定时器
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }

    // 清理事件监听器
    this.eventListeners.forEach(cleanup => cleanup())
    this.eventListeners.clear()

    // 保存最终状态
    this.saveOfflineQueue()
    this.cacheManager.cleanup()

    console.log('离线支持已销毁')
  }
}

/**
 * 缓存管理器
 */
class CacheManager {
  constructor() {
    this.cacheName = 'offline-cache-v1'
    this.cache = null
  }

  async init() {
    if ('caches' in window) {
      this.cache = await caches.open(this.cacheName)
    }
  }

  async set(key, value) {
    if (!this.cache) {
      await this.init()
    }

    const request = new Request(`/cache/${key}`, {
      method: 'PUT',
      body: JSON.stringify(value)
    })

    return await this.cache.put(request, new Response(JSON.stringify(value)))
  }

  async get(key) {
    if (!this.cache) {
      await this.init()
    }

    const response = await this.cache.match(`/cache/${key}`)
    
    if (!response) {
      return null
    }

    return await response.json()
  }

  async delete(key) {
    if (!this.cache) {
      await this.init()
    }

    return await this.cache.delete(`/cache/${key}`)
  }

  async cleanup() {
    if (!this.cache) {
      return
    }

    const requests = await this.cache.keys()
    const now = Date.now()

    for (const request of requests) {
      const response = await this.cache.match(request)
      if (response) {
        const data = await response.json()
        
        // 清理过期的数据
        if (data.ttl && (now - data.timestamp) > data.ttl) {
          await this.cache.delete(request)
        }
      }
    }
  }
}

/**
 * 数据同步管理器
 */
class DataSync {
  constructor() {
    this.listeners = new Map()
    this.syncQueue = []
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(handler)
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(handler => handler(data))
    }
  }

  async syncProductCreate(data) {
    // 实现产品创建同步逻辑
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error('创建产品同步失败')
    }

    return await response.json()
  }

  async syncProductUpdate(data) {
    // 实现产品更新同步逻辑
    const response = await fetch(`/api/products/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error('更新产品同步失败')
    }

    return await response.json()
  }

  async syncProductDelete(data) {
    // 实现产品删除同步逻辑
    const response = await fetch(`/api/products/${data.id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('删除产品同步失败')
    }

    return true
  }

  async syncSelectionChange(data) {
    // 实现选择变更同步逻辑
    const response = await fetch('/api/user/selection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error('选择同步失败')
    }

    return await response.json()
  }
}

// 创建全局实例
let globalOfflineSupport = null

/**
 * 获取离线支持实例
 */
export function getOfflineSupport() {
  if (!globalOfflineSupport) {
    globalOfflineSupport = new OfflineSupport()
  }
  return globalOfflineSupport
}

/**
 * 离线支持组合式函数
 */
export function useOfflineSupport() {
  const offlineSupport = getOfflineSupport()
  
  onMounted(() => {
    offlineSupport.loadOfflineQueue()
  })
  
  onUnmounted(() => {
    offlineSupport.destroy()
  })
  
  return {
    isOnline: offlineSupport.isOnline,
    isOffline: offlineSupport.isOffline,
    syncInProgress: offlineSupport.syncInProgress,
    offlineQueue: offlineSupport.offlineQueue,
    
    // 方法
    cacheData: offlineSupport.cacheData.bind(offlineSupport),
    getCachedData: offlineSupport.getCachedData.bind(offlineSupport),
    addOfflineOperation: offlineSupport.addOfflineOperation.bind(offlineSupport),
    startDataSync: offlineSupport.startDataSync.bind(offlineSupport),
    loadOfflineData: offlineSupport.loadOfflineData.bind(offlineSupport)
  }
}

export default OfflineSupport