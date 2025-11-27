/**
 * 数据同步工具
 * 提供客户端与服务器之间的数据同步功能，支持增量同步、冲突解决等
 */
class DataSync {
  constructor() {
    this.syncEndpoints = new Map();
    this.localStores = new Map();
    this.syncHistory = [];
    this.syncConfig = {
      autoSync: false,
      syncInterval: 300000, // 默认5分钟
      batchSize: 100,
      maxRetries: 3,
      conflictStrategy: 'server_wins', // server_wins, client_wins, merge
      debounceTime: 1000,
      offlineMode: false
    };
    this.syncTimers = new Map();
    this.pendingChanges = new Map();
    this.isSyncing = false;
    this.listeners = new Map();
  }

  /**
   * 配置同步设置
   * @param {Object} config - 同步配置
   * @returns {DataSync} 当前实例，支持链式调用
   */
  configure(config) {
    this.syncConfig = { ...this.syncConfig, ...config };
    
    // 如果启用了自动同步，重新设置定时器
    if (this.syncConfig.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
    
    return this;
  }

  /**
   * 注册数据同步端点
   * @param {string} resourceName - 资源名称
   * @param {Object} options - 端点配置
   * @returns {DataSync} 当前实例，支持链式调用
   */
  registerSyncEndpoint(resourceName, options = {}) {
    const {
      syncUrl,
      pullUrl,
      pushUrl,
      primaryKey = 'id',
      lastModifiedField = 'updatedAt',
      fields = [],
      transformRequest = null,
      transformResponse = null,
      conflictResolver = null
    } = options;

    if (!syncUrl && !pullUrl && !pushUrl) {
      throw new Error('必须提供syncUrl或pullUrl/pushUrl');
    }

    this.syncEndpoints.set(resourceName, {
      syncUrl,
      pullUrl: pullUrl || syncUrl,
      pushUrl: pushUrl || syncUrl,
      primaryKey,
      lastModifiedField,
      fields,
      transformRequest,
      transformResponse,
      conflictResolver
    });

    // 初始化待处理更改队列
    if (!this.pendingChanges.has(resourceName)) {
      this.pendingChanges.set(resourceName, []);
    }

    return this;
  }

  /**
   * 注册本地数据存储
   * @param {string} resourceName - 资源名称
   * @param {Object} store - 存储对象，必须包含get, set, update, delete, getAll等方法
   * @returns {DataSync} 当前实例，支持链式调用
   */
  registerLocalStore(resourceName, store) {
    const requiredMethods = ['get', 'set', 'update', 'delete', 'getAll', 'clear', 'count'];
    const missingMethods = requiredMethods.filter(method => typeof store[method] !== 'function');

    if (missingMethods.length > 0) {
      throw new Error(`存储对象缺少必需的方法: ${missingMethods.join(', ')}`);
    }

    this.localStores.set(resourceName, store);
    return this;
  }

  /**
   * 开始自动同步
   * @param {string} resourceName - 可选，特定资源名称
   * @returns {DataSync} 当前实例，支持链式调用
   */
  startAutoSync(resourceName = null) {
    // 清除已有的定时器
    if (resourceName) {
      if (this.syncTimers.has(resourceName)) {
        clearInterval(this.syncTimers.get(resourceName));
      }
      
      // 为特定资源设置定时器
      const timer = setInterval(() => {
        this.sync(resourceName);
      }, this.syncConfig.syncInterval);
      
      this.syncTimers.set(resourceName, timer);
    } else {
      // 为所有资源设置定时器
      for (const [name] of this.syncEndpoints.entries()) {
        if (this.syncTimers.has(name)) {
          clearInterval(this.syncTimers.get(name));
        }
        
        const timer = setInterval(() => {
          this.sync(name);
        }, this.syncConfig.syncInterval);
        
        this.syncTimers.set(name, timer);
      }
    }
    
    return this;
  }

  /**
   * 停止自动同步
   * @param {string} resourceName - 可选，特定资源名称
   * @returns {DataSync} 当前实例，支持链式调用
   */
  stopAutoSync(resourceName = null) {
    if (resourceName) {
      if (this.syncTimers.has(resourceName)) {
        clearInterval(this.syncTimers.get(resourceName));
        this.syncTimers.delete(resourceName);
      }
    } else {
      // 清除所有定时器
      for (const timer of this.syncTimers.values()) {
        clearInterval(timer);
      }
      this.syncTimers.clear();
    }
    
    return this;
  }

  /**
   * 执行数据同步
   * @param {string} resourceName - 可选，特定资源名称
   * @returns {Promise<Object>} 同步结果
   */
  async sync(resourceName = null) {
    if (this.isSyncing) {
      console.log('同步已在进行中，跳过此次请求');
      return { status: 'skipped', reason: 'sync_in_progress' };
    }

    this.isSyncing = true;
    const results = {};

    try {
      const resourcesToSync = resourceName 
        ? [resourceName]
        : Array.from(this.syncEndpoints.keys());

      for (const name of resourcesToSync) {
        if (!this._validateResource(name)) {
          results[name] = { status: 'error', error: 'resource_not_registered' };
          continue;
        }

        try {
          const result = await this._syncResource(name);
          results[name] = result;
          this._triggerSyncComplete(name, result);
        } catch (error) {
          console.error(`同步资源 ${name} 失败:`, error);
          results[name] = { status: 'error', error: error.message };
          this._triggerSyncError(name, error);
        }
      }

      return {
        status: 'completed',
        results
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 推送本地更改到服务器
   * @param {string} resourceName - 资源名称
   * @returns {Promise<Object>} 推送结果
   */
  async pushChanges(resourceName) {
    if (!this._validateResource(resourceName)) {
      throw new Error(`资源 ${resourceName} 未注册`);
    }

    const endpoint = this.syncEndpoints.get(resourceName);
    const pending = this.pendingChanges.get(resourceName) || [];
    
    if (pending.length === 0) {
      return { status: 'no_changes', pushed: 0 };
    }

    try {
      // 批量发送更改
      const batches = this._createBatches(pending, this.syncConfig.batchSize);
      let totalPushed = 0;

      for (const batch of batches) {
        const response = await this._sendChanges(resourceName, batch);
        totalPushed += response.pushed;
      }

      // 清除已推送的更改
      this.pendingChanges.set(resourceName, []);
      
      return {
        status: 'success',
        pushed: totalPushed
      };
    } catch (error) {
      console.error(`推送更改失败:`, error);
      throw error;
    }
  }

  /**
   * 从服务器拉取最新数据
   * @param {string} resourceName - 资源名称
   * @param {Object} options - 拉取选项
   * @returns {Promise<Object>} 拉取结果
   */
  async pullChanges(resourceName, options = {}) {
    if (!this._validateResource(resourceName)) {
      throw new Error(`资源 ${resourceName} 未注册`);
    }

    const endpoint = this.syncEndpoints.get(resourceName);
    const store = this.localStores.get(resourceName);
    const { forceFullSync = false } = options;

    try {
      // 获取最后同步时间
      let lastSyncTime = null;
      if (!forceFullSync) {
        const lastSync = this._getLastSync(resourceName);
        lastSyncTime = lastSync ? lastSync.timestamp : null;
      }

      // 拉取数据
      const data = await this._fetchChanges(resourceName, lastSyncTime);
      const { items = [], deleted = [] } = data;

      // 保存到本地存储
      let updated = 0;
      let created = 0;
      let conflicts = 0;

      for (const item of items) {
        const processedItem = endpoint.transformResponse 
          ? endpoint.transformResponse(item) 
          : item;

        const existingItem = await store.get(processedItem[endpoint.primaryKey]);
        if (existingItem) {
          // 检查冲突
          const result = await this._resolveConflict(
            resourceName,
            existingItem,
            processedItem
          );

          if (result.conflict) {
            conflicts++;
          } else {
            await store.update(processedItem[endpoint.primaryKey], processedItem);
            updated++;
          }
        } else {
          await store.set(processedItem[endpoint.primaryKey], processedItem);
          created++;
        }
      }

      // 删除标记为已删除的项目
      for (const id of deleted) {
        await store.delete(id);
      }

      // 更新同步历史
      this._updateSyncHistory(resourceName, {
        pulled: items.length,
        deleted: deleted.length,
        updated,
        created,
        conflicts,
        timestamp: new Date().toISOString()
      });

      return {
        status: 'success',
        pulled: items.length,
        deleted: deleted.length,
        updated,
        created,
        conflicts
      };
    } catch (error) {
      console.error(`拉取更改失败:`, error);
      throw error;
    }
  }

  /**
   * 标记本地数据已更改
   * @param {string} resourceName - 资源名称
   * @param {string|number} id - 项目ID
   * @param {Object} change - 更改数据
   * @param {string} operation - 操作类型: 'create', 'update', 'delete'
   */
  markChange(resourceName, id, change = {}, operation = 'update') {
    if (!this._validateResource(resourceName)) {
      throw new Error(`资源 ${resourceName} 未注册`);
    }

    if (!this.pendingChanges.has(resourceName)) {
      this.pendingChanges.set(resourceName, []);
    }

    const changeRecord = {
      id,
      change,
      operation,
      timestamp: Date.now(),
      syncStatus: 'pending'
    };

    this.pendingChanges.get(resourceName).push(changeRecord);
    
    // 如果启用了自动同步，触发debounce同步
    if (this.syncConfig.autoSync) {
      this._debounceSync(resourceName);
    }

    // 触发更改事件
    this._triggerChange(resourceName, changeRecord);
  }

  /**
   * 获取待同步的更改数量
   * @param {string} resourceName - 可选，资源名称
   * @returns {number} 待同步的更改数量
   */
  getPendingChangesCount(resourceName = null) {
    if (resourceName) {
      const pending = this.pendingChanges.get(resourceName) || [];
      return pending.length;
    }

    let total = 0;
    for (const pending of this.pendingChanges.values()) {
      total += pending.length;
    }
    return total;
  }

  /**
   * 手动解决冲突
   * @param {string} resourceName - 资源名称
   * @param {Object} localItem - 本地项目
   * @param {Object} serverItem - 服务器项目
   * @param {string} strategy - 解决策略
   * @returns {Promise<Object>} 解决结果
   */
  async resolveConflict(resourceName, localItem, serverItem, strategy = 'merge') {
    const endpoint = this.syncEndpoints.get(resourceName);
    const store = this.localStores.get(resourceName);

    let resolvedItem;
    if (endpoint.conflictResolver) {
      resolvedItem = await endpoint.conflictResolver(localItem, serverItem, strategy);
    } else {
      resolvedItem = this._defaultConflictResolver(localItem, serverItem, strategy);
    }

    // 保存解决后的项目
    await store.update(resolvedItem[endpoint.primaryKey], resolvedItem);

    return {
      status: 'resolved',
      resolvedItem
    };
  }

  /**
   * 获取同步历史
   * @param {Object} options - 查询选项
   * @returns {Array} 同步历史记录
   */
  getSyncHistory(options = {}) {
    const {
      limit = 50,
      resource = null,
      startDate = null,
      endDate = null
    } = options;

    let history = [...this.syncHistory];

    // 按资源过滤
    if (resource) {
      history = history.filter(entry => entry.resource === resource);
    }

    // 按日期过滤
    if (startDate) {
      history = history.filter(entry => new Date(entry.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      history = history.filter(entry => new Date(entry.timestamp) <= new Date(endDate));
    }

    // 按时间倒序排序
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 限制数量
    return history.slice(0, limit);
  }

  /**
   * 清除同步历史
   * @param {string} resourceName - 可选，资源名称
   */
  clearSyncHistory(resourceName = null) {
    if (resourceName) {
      this.syncHistory = this.syncHistory.filter(entry => entry.resource !== resourceName);
    } else {
      this.syncHistory = [];
    }
  }

  /**
   * 添加事件监听器
   * @param {string} event - 事件名称: 'sync', 'sync_error', 'change', 'sync_complete'
   * @param {Function} listener - 监听器函数
   * @param {string} resourceName - 可选，特定资源名称
   */
  on(event, listener, resourceName = null) {
    const eventKey = resourceName ? `${event}:${resourceName}` : event;
    
    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, []);
    }
    
    this.listeners.get(eventKey).push(listener);
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听器函数
   * @param {string} resourceName - 可选，特定资源名称
   */
  off(event, listener, resourceName = null) {
    const eventKey = resourceName ? `${event}:${resourceName}` : event;
    
    if (!this.listeners.has(eventKey)) {
      return;
    }
    
    const listeners = this.listeners.get(eventKey);
    const index = listeners.indexOf(listener);
    
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * 触发事件
   * @private
   */
  _trigger(event, data, resourceName = null) {
    // 触发特定资源的事件
    if (resourceName) {
      const resourceEventKey = `${event}:${resourceName}`;
      if (this.listeners.has(resourceEventKey)) {
        for (const listener of this.listeners.get(resourceEventKey)) {
          try {
            listener(data, resourceName);
          } catch (error) {
            console.error(`事件监听器错误:`, error);
          }
        }
      }
    }
    
    // 触发全局事件
    if (this.listeners.has(event)) {
      for (const listener of this.listeners.get(event)) {
        try {
          listener(data, resourceName);
        } catch (error) {
          console.error(`事件监听器错误:`, error);
        }
      }
    }
  }

  /**
   * 验证资源是否已注册
   * @private
   */
  _validateResource(resourceName) {
    return this.syncEndpoints.has(resourceName) && 
           this.localStores.has(resourceName);
  }

  /**
   * 同步单个资源
   * @private
   */
  async _syncResource(resourceName) {
    try {
      // 1. 先推送本地更改
      const pushResult = await this.pushChanges(resourceName);
      
      // 2. 然后拉取服务器更改
      const pullResult = await this.pullChanges(resourceName);

      return {
        status: 'success',
        push: pushResult,
        pull: pullResult,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`同步资源 ${resourceName} 失败:`, error);
      throw error;
    }
  }

  /**
   * 发送更改到服务器
   * @private
   */
  async _sendChanges(resourceName, changes) {
    const endpoint = this.syncEndpoints.get(resourceName);
    const store = this.localStores.get(resourceName);
    
    // 构建完整的更改对象
    const completeChanges = [];
    for (const change of changes) {
      let fullItem;
      
      if (change.operation === 'create' || change.operation === 'update') {
        // 获取完整的项目数据
        fullItem = await store.get(change.id);
        if (fullItem) {
          // 应用转换器
          if (endpoint.transformRequest) {
            fullItem = endpoint.transformRequest(fullItem);
          }
          
          completeChanges.push({
            ...fullItem,
            __operation: change.operation
          });
        }
      } else if (change.operation === 'delete') {
        completeChanges.push({
          [endpoint.primaryKey]: change.id,
          __operation: 'delete'
        });
      }
    }

    // 发送到服务器（这里需要实现实际的API调用）
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      status: 'success',
      pushed: completeChanges.length
    };
  }

  /**
   * 从服务器获取更改
   * @private
   */
  async _fetchChanges(resourceName, lastSyncTime) {
    const endpoint = this.syncEndpoints.get(resourceName);
    
    // 构建查询参数
    const params = {};
    if (lastSyncTime) {
      params.since = lastSyncTime;
    }
    
    if (endpoint.fields && endpoint.fields.length > 0) {
      params.fields = endpoint.fields.join(',');
    }

    // 发送请求（这里需要实现实际的API调用）
    // 模拟API调用和数据返回
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 返回模拟数据
    return {
      items: [], // 模拟没有新数据
      deleted: []
    };
  }

  /**
   * 解决冲突
   * @private
   */
  async _resolveConflict(resourceName, localItem, serverItem) {
    const endpoint = this.syncEndpoints.get(resourceName);
    const conflictStrategy = endpoint.conflictStrategy || this.syncConfig.conflictStrategy;
    
    let result = { conflict: false, resolvedItem: null };
    
    // 检查是否真的有冲突
    const localModified = localItem[endpoint.lastModifiedField];
    const serverModified = serverItem[endpoint.lastModifiedField];
    
    if (localModified && serverModified && 
        new Date(localModified) > new Date(serverModified)) {
      // 有冲突
      result.conflict = true;
      
      // 应用冲突解决策略
      if (endpoint.conflictResolver) {
        result.resolvedItem = await endpoint.conflictResolver(localItem, serverItem, conflictStrategy);
      } else {
        result.resolvedItem = this._defaultConflictResolver(localItem, serverItem, conflictStrategy);
      }
    } else {
      // 无冲突，使用服务器版本
      result.resolvedItem = serverItem;
    }
    
    return result;
  }

  /**
   * 默认冲突解决器
   * @private
   */
  _defaultConflictResolver(localItem, serverItem, strategy) {
    switch (strategy) {
      case 'client_wins':
        return { ...serverItem, ...localItem };
        
      case 'merge':
        // 合并策略：如果本地字段有值且不同于服务器，则使用本地值
        const merged = { ...serverItem };
        for (const key in localItem) {
          if (key !== '__operation' && localItem[key] !== undefined && 
              localItem[key] !== null && localItem[key] !== serverItem[key]) {
            merged[key] = localItem[key];
          }
        }
        return merged;
        
      case 'server_wins':
      default:
        return serverItem;
    }
  }

  /**
   * 创建批次
   * @private
   */
  _createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * 获取最后同步记录
   * @private
   */
  _getLastSync(resourceName) {
    const history = this.syncHistory
      .filter(entry => entry.resource === resourceName)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return history.length > 0 ? history[0] : null;
  }

  /**
   * 更新同步历史
   * @private
   */
  _updateSyncHistory(resourceName, data) {
    const historyEntry = {
      resource: resourceName,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    this.syncHistory.push(historyEntry);
    
    // 限制历史记录数量
    const MAX_HISTORY = 1000;
    if (this.syncHistory.length > MAX_HISTORY) {
      this.syncHistory = this.syncHistory.slice(-MAX_HISTORY);
    }
  }

  /**
   * Debounce同步
   * @private
   */
  _debounceSync(resourceName) {
    // 这里实现debounce逻辑
    const debounceKey = `debounce_${resourceName}`;
    
    if (this[debounceKey]) {
      clearTimeout(this[debounceKey]);
    }
    
    this[debounceKey] = setTimeout(() => {
      this.sync(resourceName);
    }, this.syncConfig.debounceTime);
  }

  /**
   * 触发同步完成事件
   * @private
   */
  _triggerSyncComplete(resourceName, result) {
    this._trigger('sync_complete', result, resourceName);
  }

  /**
   * 触发同步错误事件
   * @private
   */
  _triggerSyncError(resourceName, error) {
    this._trigger('sync_error', { error: error.message }, resourceName);
  }

  /**
   * 触发数据更改事件
   * @private
   */
  _triggerChange(resourceName, change) {
    this._trigger('change', change, resourceName);
  }

  /**
   * 导出同步状态
   * @returns {Object} 同步状态
   */
  exportState() {
    return {
      syncConfig: this.syncConfig,
      pendingChanges: Array.from(this.pendingChanges.entries()).reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {}),
      syncHistory: this.syncHistory,
      registeredResources: Array.from(this.syncEndpoints.keys())
    };
  }

  /**
   * 导入同步状态
   * @param {Object} state - 同步状态
   */
  importState(state) {
    if (state.syncConfig) {
      this.syncConfig = { ...this.syncConfig, ...state.syncConfig };
    }
    
    if (state.pendingChanges) {
      Object.entries(state.pendingChanges).forEach(([key, value]) => {
        this.pendingChanges.set(key, value);
      });
    }
    
    if (state.syncHistory) {
      this.syncHistory = state.syncHistory;
    }
  }
}

// 导出单例实例
const dataSync = new DataSync();
export default dataSync;
export { DataSync };