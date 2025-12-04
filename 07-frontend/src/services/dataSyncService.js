/**
 * 数据同步服务 - 确保所有终端数据一致
 * Data Synchronization Service
 * 
 * 功能:
 * - 实时数据同步
 * - 冲突检测和解决
 * - 离线缓存
 * - 同步状态监控
 */

import { ref, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { syncAPI } from '@/api/resourcesAPI.js'

class DataSyncService {
  constructor() {
    // 同步状态
    this.syncStatus = ref('idle') // idle, syncing, success, error
    this.lastSyncTime = ref(null)
    this.syncProgress = ref(0)
    
    // 同步配置
    this.autoSyncInterval = 5 * 60 * 1000 // 5分钟自动同步一次
    this.syncTimer = null
    
    // 待同步队列
    this.pendingQueue = ref([])
    
    // 冲突记录
    this.conflicts = ref([])
    
    // 离线缓存
    this.offlineCache = ref([])
    
    // 初始化
    this._init()
  }
  
  /**
   * 初始化同步服务
   */
  _init() {
    // 监听在线状态
    window.addEventListener('online', () => {
      console.log('网络已连接，开始同步离线数据')
      this._syncOfflineData()
    })
    
    window.addEventListener('offline', () => {
      console.log('网络已断开，数据将缓存本地')
      ElMessage.warning('网络已断开，修改将暂存本地')
    })
    
    // 页面关闭前同步
    window.addEventListener('beforeunload', () => {
      this._savePendingQueue()
    })
    
    // 启动自动同步
    this.startAutoSync()
    
    // 从本地恢复待同步队列
    this._loadPendingQueue()
  }
  
  /**
   * 启动自动同步
   */
  startAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }
    
    this.syncTimer = setInterval(() => {
      if (navigator.onLine && this.syncStatus.value !== 'syncing') {
        this.syncAll()
      }
    }, this.autoSyncInterval)
    
    console.log(`自动同步已启动，间隔: ${this.autoSyncInterval / 1000}秒`)
  }
  
  /**
   * 停止自动同步
   */
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
      console.log('自动同步已停止')
    }
  }
  
  /**
   * 同步所有模块
   */
  async syncAll() {
    if (!navigator.onLine) {
      ElMessage.warning('当前网络不可用，无法同步')
      return false
    }
    
    this.syncStatus.value = 'syncing'
    this.syncProgress.value = 0
    
    const modules = [
      'equipment',
      'workers',
      'materials',
      'molds',
      'fixtures',
      'tooling',
      'scheduling'
    ]
    
    try {
      const totalModules = modules.length
      let completedModules = 0
      
      for (const module of modules) {
        await this.syncModule(module)
        completedModules++
        this.syncProgress.value = Math.round((completedModules / totalModules) * 100)
      }
      
      this.syncStatus.value = 'success'
      this.lastSyncTime.value = new Date()
      
      ElNotification({
        title: '同步成功',
        message: `已同步 ${modules.length} 个模块`,
        type: 'success',
        duration: 3000
      })
      
      return true
    } catch (error) {
      this.syncStatus.value = 'error'
      console.error('同步失败:', error)
      
      ElNotification({
        title: '同步失败',
        message: error.message || '数据同步出错',
        type: 'error',
        duration: 5000
      })
      
      return false
    }
  }
  
  /**
   * 同步单个模块
   */
  async syncModule(module) {
    try {
      const result = await syncAPI.trigger([module])
      
      if (result.conflicts && result.conflicts.length > 0) {
        this.conflicts.value.push(...result.conflicts)
        ElNotification({
          title: '发现同步冲突',
          message: `模块 ${module} 有 ${result.conflicts.length} 个冲突需要解决`,
          type: 'warning',
          duration: 5000
        })
      }
      
      return result
    } catch (error) {
      console.error(`同步模块 ${module} 失败:`, error)
      throw error
    }
  }
  
  /**
   * 添加到待同步队列
   */
  addToPendingQueue(item) {
    const existingIndex = this.pendingQueue.value.findIndex(
      i => i.module === item.module && i.id === item.id
    )
    
    if (existingIndex >= 0) {
      // 更新已存在的项
      this.pendingQueue.value[existingIndex] = {
        ...this.pendingQueue.value[existingIndex],
        ...item,
        timestamp: new Date().getTime()
      }
    } else {
      // 添加新项
      this.pendingQueue.value.push({
        ...item,
        timestamp: new Date().getTime()
      })
    }
    
    // 如果在线，立即同步
    if (navigator.onLine) {
      this._processPendingQueue()
    } else {
      // 离线时保存到本地
      this._savePendingQueue()
    }
  }
  
  /**
   * 处理待同步队列
   */
  async _processPendingQueue() {
    if (this.pendingQueue.value.length === 0) return
    
    const queue = [...this.pendingQueue.value]
    this.pendingQueue.value = []
    
    for (const item of queue) {
      try {
        await this.syncModule(item.module)
        console.log(`已同步: ${item.module} - ${item.id}`)
      } catch (error) {
        console.error(`同步失败: ${item.module} - ${item.id}`, error)
        // 失败的重新加入队列
        this.pendingQueue.value.push(item)
      }
    }
    
    this._savePendingQueue()
  }
  
  /**
   * 同步离线数据
   */
  async _syncOfflineData() {
    this._loadPendingQueue()
    
    if (this.pendingQueue.value.length > 0) {
      ElMessage.info(`正在同步 ${this.pendingQueue.value.length} 条离线数据...`)
      await this._processPendingQueue()
      
      if (this.pendingQueue.value.length === 0) {
        ElMessage.success('离线数据同步完成')
      } else {
        ElMessage.warning(`还有 ${this.pendingQueue.value.length} 条数据同步失败`)
      }
    }
  }
  
  /**
   * 保存待同步队列到本地
   */
  _savePendingQueue() {
    try {
      localStorage.setItem('pendingQueue', JSON.stringify(this.pendingQueue.value))
    } catch (error) {
      console.error('保存待同步队列失败:', error)
    }
  }
  
  /**
   * 从本地加载待同步队列
   */
  _loadPendingQueue() {
    try {
      const saved = localStorage.getItem('pendingQueue')
      if (saved) {
        this.pendingQueue.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载待同步队列失败:', error)
      this.pendingQueue.value = []
    }
  }
  
  /**
   * 获取同步状态
   */
  async getSyncStatus() {
    try {
      const status = await syncAPI.getStatus()
      return status
    } catch (error) {
      console.error('获取同步状态失败:', error)
      return null
    }
  }
  
  /**
   * 获取同步历史
   */
  async getSyncHistory(params = {}) {
    try {
      const history = await syncAPI.getHistory(params)
      return history
    } catch (error) {
      console.error('获取同步历史失败:', error)
      return []
    }
  }
  
  /**
   * 获取冲突列表
   */
  async getConflicts() {
    try {
      const conflicts = await syncAPI.getConflicts()
      this.conflicts.value = conflicts || []
      return this.conflicts.value
    } catch (error) {
      console.error('获取冲突列表失败:', error)
      return []
    }
  }
  
  /**
   * 解决冲突
   */
  async resolveConflict(conflictId, resolution) {
    try {
      await syncAPI.resolveConflict(conflictId, resolution)
      
      // 从冲突列表中移除
      this.conflicts.value = this.conflicts.value.filter(c => c.id !== conflictId)
      
      ElMessage.success('冲突已解决')
      return true
    } catch (error) {
      console.error('解决冲突失败:', error)
      ElMessage.error('解决冲突失败')
      return false
    }
  }
  
  /**
   * 格式化同步时间
   */
  getFormattedLastSyncTime() {
    if (!this.lastSyncTime.value) return '从未同步'
    
    const now = new Date()
    const syncTime = new Date(this.lastSyncTime.value)
    const diffMs = now - syncTime
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}小时前`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}天前`
  }
  
  /**
   * 获取同步状态文本
   */
  getSyncStatusText() {
    const statusMap = {
      idle: '空闲',
      syncing: '同步中...',
      success: '同步成功',
      error: '同步失败'
    }
    return statusMap[this.syncStatus.value] || '未知'
  }
  
  /**
   * 获取同步状态颜色
   */
  getSyncStatusColor() {
    const colorMap = {
      idle: '#909399',
      syncing: '#409EFF',
      success: '#67C23A',
      error: '#F56C6C'
    }
    return colorMap[this.syncStatus.value] || '#909399'
  }
  
  /**
   * 清除同步缓存
   */
  clearCache() {
    this.pendingQueue.value = []
    this.offlineCache.value = []
    localStorage.removeItem('pendingQueue')
    ElMessage.success('同步缓存已清除')
  }
}

// 创建单例
const dataSyncService = new DataSyncService()

// 导出
export default dataSyncService

// 导出便捷方法
export const {
  syncAll,
  syncModule,
  addToPendingQueue,
  getSyncStatus,
  getSyncHistory,
  getConflicts,
  resolveConflict,
  startAutoSync,
  stopAutoSync,
  clearCache
} = dataSyncService
