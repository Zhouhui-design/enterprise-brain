/**
 * 客户数据管理器
 * 实现智能数据同步，解决前端与后端数据一致性问题
 */

import customerApi from '@/api/customer'

class CustomerDataManager {
  constructor() {
    this.apiData = [];
    this.localData = [];
    this.lastSyncTime = null;
    this.syncInProgress = false;
    this.offlineMode = false;
    this.syncQueue = [];
    this.conflictResolver = null;
    
    // 事件监听器
    this.eventListeners = {
      'sync:start': [],
      'sync:complete': [],
      'sync:error': [],
      'conflict:detected': [],
      'offline:enabled': [],
      'offline:disabled': []
    };
    
    // 初始化
    this.init();
  }
  
  /**
   * 初始化数据管理器
   */
  async init() {
    console.log('🚀 初始化客户数据管理器');
    
    // 检测网络状态
    this.setupNetworkMonitoring();
    
    // 从localStorage恢复数据
    this.loadFromLocalStorage();
    
    // 启动数据同步
    await this.syncData();
    
    // 启动定期同步
    this.startPeriodicSync();
  }
  
  /**
   * 设置网络状态监测
   */
  setupNetworkMonitoring() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('🌐 网络已连接');
        this.offlineMode = false;
        this.emit('offline:disabled');
        // 网络恢复时立即同步
        if (!this.syncInProgress) {
          this.syncData();
        }
      });
      
      window.addEventListener('offline', () => {
        console.log('📡 网络已断开');
        this.offlineMode = true;
        this.emit('offline:enabled');
      });
      
      // 初始网络状态
      this.offlineMode = !navigator.onLine;
    }
  }
  
  /**
   * 智能数据同步策略
   */
  async syncData() {
    if (this.syncInProgress) {
      console.log('⏳ 同步正在进行中，跳过本次同步');
      return;
    }
    
    this.syncInProgress = true;
    this.emit('sync:start');
    
    try {
      // 1. 优先从API获取最新数据
      const apiResponse = await this.fetchWithRetry(() => 
        customerApi.getCustomers({
          page: 1,
          pageSize: 1000 // 获取更多数据以检测冲突
        })
      );
      
      if (apiResponse.success) {
        this.apiData = apiResponse.data.data.list;
        console.log(`✅ 从API获取 ${this.apiData.length} 条数据`);
        
        // 2. 与本地数据对比，检测冲突
        const conflicts = this.detectConflicts();
        
        // 3. 处理冲突和数据合并
        if (conflicts.length > 0) {
          console.log(`⚠️ 检测到 ${conflicts.length} 个数据冲突`);
          this.emit('conflict:detected', conflicts);
          await this.resolveConflicts(conflicts);
        }
        
        // 4. 更新本地存储
        this.updateLocalData();
        
        this.lastSyncTime = new Date();
        console.log('✅ 数据同步完成');
        this.emit('sync:complete', {
          apiData: this.apiData.length,
          conflicts: conflicts.length,
          timestamp: this.lastSyncTime
        });
      }
    } catch (error) {
      console.error('❌ 数据同步失败:', error);
      this.emit('sync:error', error);
      
      // 降级到本地数据
      if (this.localData.length === 0) {
        this.loadFromLocalStorage();
      }
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * 检测数据冲突
   */
  detectConflicts() {
    const conflicts = [];
    
    // 创建本地数据映射
    const localMap = new Map();
    this.localData.forEach(item => {
      localMap.set(item.id, item);
    });
    
    // 检查每个API数据项
    this.apiData.forEach(apiItem => {
      const localItem = localMap.get(apiItem.id);
      
      if (localItem) {
        const conflict = this.compareItems(apiItem, localItem);
        if (conflict) {
          conflicts.push({
            id: apiItem.id,
            customerCode: apiItem.customerCode,
            apiItem,
            localItem,
            conflict,
            resolution: null
          });
        }
      }
    });
    
    return conflicts;
  }
  
  /**
   * 比较两个数据项
   */
  compareItems(apiItem, localItem) {
    const conflicts = [];
    
    // 检查关键字段
    const fieldsToCheck = ['customerName', 'customerType', 'status', 'contactPerson', 'contactPhone'];
    
    fieldsToCheck.forEach(field => {
      const apiValue = apiItem[field];
      const localValue = localItem[field];
      
      if (apiValue !== localValue) {
        conflicts.push({
          field,
          apiValue,
          localValue,
          timestamp: {
            api: apiItem.updateTime || apiItem.createTime,
            local: localItem.updateTime || localItem.createTime
          }
        });
      }
    });
    
    return conflicts.length > 0 ? conflicts : null;
  }
  
  /**
   * 解决数据冲突
   */
  async resolveConflicts(conflicts) {
    console.log('🔧 开始解决数据冲突');
    
    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict);
      conflict.resolution = resolution;
      
      if (resolution.action === 'use_api') {
        // 使用API数据，更新本地数据
        const index = this.localData.findIndex(item => item.id === conflict.id);
        if (index !== -1) {
          this.localData[index] = { ...conflict.apiItem };
        }
      } else if (resolution.action === 'use_local') {
        // 使用本地数据，需要同步到服务器
        try {
          await this.syncLocalToServer(conflict.localItem);
        } catch (error) {
          console.error('❌ 同步本地数据到服务器失败:', error);
          // 失败时记录到队列，稍后重试
          this.syncQueue.push({
            type: 'update',
            data: conflict.localItem,
            timestamp: new Date()
          });
        }
      } else if (resolution.action === 'merge') {
        // 合并数据
        const mergedItem = this.mergeItems(conflict.apiItem, conflict.localItem, resolution.mergeStrategy);
        const index = this.localData.findIndex(item => item.id === conflict.id);
        if (index !== -1) {
          this.localData[index] = mergedItem;
        }
        
        try {
          await this.syncLocalToServer(mergedItem);
        } catch (error) {
          console.error('❌ 同步合并数据到服务器失败:', error);
          this.syncQueue.push({
            type: 'update',
            data: mergedItem,
            timestamp: new Date()
          });
        }
      }
    }
  }
  
  /**
   * 解决单个冲突
   */
  async resolveConflict(conflict) {
    // 如果有自定义冲突解决器，使用自定义逻辑
    if (this.conflictResolver) {
      return await this.conflictResolver(conflict);
    }
    
    // 默认解决策略：优先使用最新时间戳的数据
    const apiTime = new Date(conflict.apiItem.updateTime || conflict.apiItem.createTime);
    const localTime = new Date(conflict.localItem.updateTime || conflict.localItem.createTime);
    
    if (apiTime >= localTime) {
      return { action: 'use_api', reason: 'API数据更新时间较新' };
    } else {
      return { action: 'use_local', reason: '本地数据更新时间较新' };
    }
  }
  
  /**
   * 合并两个数据项
   */
  mergeItems(apiItem, localItem, strategy = 'latest') {
    if (strategy === 'api_priority') {
      return { ...apiItem };
    } else if (strategy === 'local_priority') {
      return { ...localItem };
    } else if (strategy === 'merge') {
      // 智能合并：优先API数据，但保留本地数据中的非空字段
      const merged = { ...apiItem };
      
      Object.keys(localItem).forEach(key => {
        if (localItem[key] && !apiItem[key]) {
          merged[key] = localItem[key];
        }
      });
      
      return merged;
    }
    
    return { ...apiItem };
  }
  
  /**
   * 同步本地数据到服务器
   */
  async syncLocalToServer(localItem) {
    try {
      const response = await customerApi.updateCustomer(localItem.id, localItem);
      if (response.success) {
        console.log(`✅ 客户 ${localItem.customerName} 同步成功`);
        return true;
      }
    } catch (error) {
      console.error('❌ 同步失败:', error);
      throw error;
    }
    return false;
  }
  
  /**
   * 从localStorage加载数据
   */
  loadFromLocalStorage() {
    try {
      const cached = localStorage.getItem('customerDataCache');
      const syncTime = localStorage.getItem('customerDataSyncTime');
      
      if (cached) {
        this.localData = JSON.parse(cached);
        console.log(`✅ 从localStorage加载 ${this.localData.length} 条数据`);
      }
      
      if (syncTime) {
        this.lastSyncTime = new Date(syncTime);
      }
    } catch (error) {
      console.error('❌ 从localStorage加载数据失败:', error);
      this.localData = [];
    }
  }
  
  /**
   * 更新本地存储
   */
  updateLocalData() {
    try {
      // 合并API和本地数据，取最新版本
      const mergedData = this.mergeAllData();
      
      localStorage.setItem('customerDataCache', JSON.stringify(mergedData));
      localStorage.setItem('customerDataSyncTime', this.lastSyncTime.toISOString());
      
      this.localData = mergedData;
      console.log('✅ 本地数据已更新');
    } catch (error) {
      console.error('❌ 更新本地存储失败:', error);
    }
  }
  
  /**
   * 合并所有数据
   */
  mergeAllData() {
    const mergedMap = new Map();
    
    // 首先添加本地数据
    this.localData.forEach(item => {
      mergedMap.set(item.id, { ...item });
    });
    
    // 然后用API数据更新
    this.apiData.forEach(apiItem => {
      const existing = mergedMap.get(apiItem.id);
      if (!existing) {
        mergedMap.set(apiItem.id, { ...apiItem });
      } else {
        // 比较更新时间，选择最新版本
        const apiTime = new Date(apiItem.updateTime || apiItem.createTime);
        const localTime = new Date(existing.updateTime || existing.createTime);
        
        if (apiTime > localTime) {
          mergedMap.set(apiItem.id, { ...apiItem });
        }
      }
    });
    
    return Array.from(mergedMap.values());
  }
  
  /**
   * 启动定期同步
   */
  startPeriodicSync() {
    // 每5分钟检查一次是否需要同步
    setInterval(() => {
      if (!this.offlineMode && !this.syncInProgress) {
        const timeSinceLastSync = Date.now() - (this.lastSyncTime?.getTime() || 0);
        
        // 如果超过5分钟没有同步，则自动同步
        if (timeSinceLastSync > 5 * 60 * 1000) {
          console.log('🔄 启动定期数据同步');
          this.syncData();
        }
      }
    }, 60 * 1000); // 每分钟检查一次
  }
  
  /**
   * 带重试的API调用
   */
  async fetchWithRetry(apiCall, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await apiCall();
        console.log(`✅ API请求成功，尝试次数: ${i + 1}`);
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ API请求失败，第 ${i + 1} 次重试:`, error.message);
        
        // 网络错误时延长重试间隔
        const delay = error.code === 'ECONNREFUSED' ? 5000 : Math.pow(2, i) * 1000;
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // 最后一次重试失败时，提供更详细的错误信息
          throw new Error(`API请求失败，已重试 ${maxRetries} 次: ${error.message}`);
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * 获取当前数据
   */
  getCurrentData() {
    // 优先返回合并后的数据
    return this.mergeAllData();
  }
  
  /**
   * 添加数据
   */
  async addData(customerData) {
    try {
      const response = await customerApi.createCustomer(customerData);
      
      if (response.success) {
        const newItem = response.data.data;
        
        // 更新API数据
        this.apiData.push(newItem);
        
        // 更新本地数据
        this.updateLocalData();
        
        console.log(`✅ 客户 ${newItem.customerName} 添加成功`);
        return newItem;
      }
    } catch (error) {
      console.error('❌ 添加客户失败:', error);
      
      // 离线时添加到本地队列
      if (this.offlineMode) {
        this.syncQueue.push({
          type: 'create',
          data: customerData,
          timestamp: new Date()
        });
        console.log('📝 离线模式：添加到同步队列');
      }
      
      throw error;
    }
  }
  
  /**
   * 更新数据
   */
  async updateData(id, customerData) {
    try {
      const response = await customerApi.updateCustomer(id, customerData);
      
      if (response.success) {
        const updatedItem = response.data.data;
        
        // 更新API数据
        const index = this.apiData.findIndex(item => item.id === id);
        if (index !== -1) {
          this.apiData[index] = updatedItem;
        }
        
        // 更新本地数据
        this.updateLocalData();
        
        console.log(`✅ 客户 ${updatedItem.customerName} 更新成功`);
        return updatedItem;
      }
    } catch (error) {
      console.error('❌ 更新客户失败:', error);
      
      // 离线时添加到本地队列
      if (this.offlineMode) {
        this.syncQueue.push({
          type: 'update',
          data: { id, ...customerData },
          timestamp: new Date()
        });
        console.log('📝 离线模式：添加到同步队列');
      }
      
      throw error;
    }
  }
  
  /**
   * 删除数据
   */
  async deleteData(id) {
    try {
      const response = await customerApi.deleteCustomer(id);
      
      if (response.success) {
        // 更新API数据
        this.apiData = this.apiData.filter(item => item.id !== id);
        
        // 更新本地数据
        this.updateLocalData();
        
        console.log(`✅ 客户删除成功`);
        return true;
      }
    } catch (error) {
      console.error('❌ 删除客户失败:', error);
      
      // 离线时添加到本地队列
      if (this.offlineMode) {
        this.syncQueue.push({
          type: 'delete',
          data: { id },
          timestamp: new Date()
        });
        console.log('📝 离线模式：添加到同步队列');
      }
      
      throw error;
    }
  }
  
  /**
   * 处理同步队列
   */
  async processSyncQueue() {
    if (this.syncQueue.length === 0 || this.offlineMode) {
      return;
    }
    
    console.log(`🔄 处理同步队列，共 ${this.syncQueue.length} 项`);
    
    const queue = [...this.syncQueue];
    this.syncQueue = [];
    
    for (const item of queue) {
      try {
        if (item.type === 'create') {
          await this.addData(item.data);
        } else if (item.type === 'update') {
          await this.updateData(item.data.id, item.data);
        } else if (item.type === 'delete') {
          await this.deleteData(item.data.id);
        }
      } catch (error) {
        console.error('❌ 处理队列项失败:', error);
        // 失败的项重新加入队列
        this.syncQueue.push(item);
      }
    }
  }
  
  /**
   * 设置自定义冲突解决器
   */
  setConflictResolver(resolver) {
    this.conflictResolver = resolver;
  }
  
  /**
   * 事件监听器管理
   */
  on(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
  }
  
  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ 事件监听器执行失败:', error);
        }
      });
    }
  }
  
  /**
   * 获取系统状态
   */
  getStatus() {
    return {
      offlineMode: this.offlineMode,
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      queueSize: this.syncQueue.length,
      apiDataCount: this.apiData.length,
      localDataCount: this.localData.length
    };
  }
}

// 导出单例实例
export const customerDataManager = new CustomerDataManager();

export default CustomerDataManager;