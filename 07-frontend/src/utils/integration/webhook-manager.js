/**
 * Webhook管理器
 * 提供Webhook注册、触发和管理功能
 */
class WebhookManager {
  constructor() {
    this.webhooks = new Map();
    this.history = new Map();
    this.retryConfig = {
      maxRetries: 3,
      initialDelay: 1000, // 1秒
      backoffFactor: 2
    };
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Webhook-Source': '工装管理系统'
    };
  }

  /**
   * 注册一个新的Webhook
   * @param {string} eventName - 事件名称
   * @param {string} url - Webhook URL
   * @param {Object} options - Webhook选项
   * @returns {string} Webhook ID
   */
  registerWebhook(eventName, url, options = {}) {
    const {
      headers = {},
      method = 'POST',
      enabled = true,
      secret = null,
      filter = null,
      retryEnabled = true
    } = options;

    if (!eventName || !url) {
      throw new Error('事件名称和URL不能为空');
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch (error) {
      throw new Error('无效的URL格式');
    }

    const webhookId = this._generateId();
    const webhook = {
      id: webhookId,
      eventName,
      url,
      method,
      headers: { ...this.defaultHeaders, ...headers },
      enabled,
      secret,
      filter,
      retryEnabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 按事件名称组织Webhooks
    if (!this.webhooks.has(eventName)) {
      this.webhooks.set(eventName, new Map());
    }

    this.webhooks.get(eventName).set(webhookId, webhook);
    return webhookId;
  }

  /**
   * 更新现有Webhook
   * @param {string} eventName - 事件名称
   * @param {string} webhookId - Webhook ID
   * @param {Object} updates - 更新内容
   * @returns {boolean} 更新是否成功
   */
  updateWebhook(eventName, webhookId, updates = {}) {
    if (!this._webhookExists(eventName, webhookId)) {
      return false;
    }

    const webhook = this.webhooks.get(eventName).get(webhookId);
    const updatedWebhook = {
      ...webhook,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.webhooks.get(eventName).set(webhookId, updatedWebhook);
    return true;
  }

  /**
   * 删除Webhook
   * @param {string} eventName - 事件名称
   * @param {string} webhookId - Webhook ID
   * @returns {boolean} 删除是否成功
   */
  deleteWebhook(eventName, webhookId) {
    if (!this._webhookExists(eventName, webhookId)) {
      return false;
    }

    const eventWebhooks = this.webhooks.get(eventName);
    eventWebhooks.delete(webhookId);

    // 如果事件没有Webhooks了，移除该事件
    if (eventWebhooks.size === 0) {
      this.webhooks.delete(eventName);
    }

    // 同时清理历史记录
    if (this.history.has(webhookId)) {
      this.history.delete(webhookId);
    }

    return true;
  }

  /**
   * 获取Webhook信息
   * @param {string} eventName - 事件名称
   * @param {string} webhookId - Webhook ID
   * @returns {Object|null} Webhook信息
   */
  getWebhook(eventName, webhookId) {
    if (!this._webhookExists(eventName, webhookId)) {
      return null;
    }

    return this.webhooks.get(eventName).get(webhookId);
  }

  /**
   * 获取事件的所有Webhooks
   * @param {string} eventName - 事件名称
   * @returns {Array} Webhook数组
   */
  getWebhooksByEvent(eventName) {
    if (!this.webhooks.has(eventName)) {
      return [];
    }

    return Array.from(this.webhooks.get(eventName).values());
  }

  /**
   * 获取所有Webhooks
   * @returns {Array} 所有Webhook数组
   */
  getAllWebhooks() {
    const allWebhooks = [];
    
    for (const [eventName, webhookMap] of this.webhooks.entries()) {
      for (const webhook of webhookMap.values()) {
        allWebhooks.push(webhook);
      }
    }

    return allWebhooks;
  }

  /**
   * 启用/禁用Webhook
   * @param {string} eventName - 事件名称
   * @param {string} webhookId - Webhook ID
   * @param {boolean} enabled - 是否启用
   * @returns {boolean} 操作是否成功
   */
  toggleWebhook(eventName, webhookId, enabled) {
    return this.updateWebhook(eventName, webhookId, { enabled });
  }

  /**
   * 触发Webhook事件
   * @param {string} eventName - 事件名称
   * @param {Object} payload - 事件数据
   * @returns {Promise<Array>} 触发结果数组
   */
  async triggerEvent(eventName, payload) {
    const results = [];
    const eventWebhooks = this.getWebhooksByEvent(eventName);

    if (eventWebhooks.length === 0) {
      console.log(`没有为事件 ${eventName} 注册的Webhooks`);
      return results;
    }

    // 并发触发所有启用的Webhooks
    const triggerPromises = eventWebhooks
      .filter(webhook => webhook.enabled)
      .map(async (webhook) => {
        try {
          // 应用过滤器
          if (webhook.filter && typeof webhook.filter === 'function') {
            if (!webhook.filter(payload)) {
              console.log(`Webhook ${webhook.id} 过滤了事件 ${eventName}`);
              return {
                webhookId: webhook.id,
                eventName,
                status: 'filtered',
                timestamp: new Date().toISOString()
              };
            }
          }

          const result = await this._sendWebhook(webhook, payload);
          results.push(result);
          
          // 保存历史记录
          this._saveHistory(webhook.id, {
            eventName,
            payload,
            result,
            timestamp: new Date().toISOString()
          });

          return result;
        } catch (error) {
          const errorResult = {
            webhookId: webhook.id,
            eventName,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          };
          results.push(errorResult);
          
          // 保存错误历史
          this._saveHistory(webhook.id, {
            eventName,
            payload,
            result: errorResult,
            timestamp: new Date().toISOString()
          });

          return errorResult;
        }
      });

    await Promise.all(triggerPromises);
    return results;
  }

  /**
   * 获取Webhook的历史记录
   * @param {string} webhookId - Webhook ID
   * @param {Object} options - 查询选项
   * @returns {Array} 历史记录数组
   */
  getWebhookHistory(webhookId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      status = null
    } = options;

    if (!this.history.has(webhookId)) {
      return [];
    }

    let history = Array.from(this.history.get(webhookId));
    
    // 按状态过滤
    if (status) {
      history = history.filter(entry => entry.result.status === status);
    }

    // 按时间倒序排序
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 分页
    return history.slice(offset, offset + limit);
  }

  /**
   * 重试失败的Webhook调用
   * @param {string} webhookId - Webhook ID
   * @param {string} historyId - 历史记录ID
   * @returns {Promise<Object>} 重试结果
   */
  async retryWebhook(webhookId, historyId) {
    // 查找历史记录
    if (!this.history.has(webhookId)) {
      throw new Error('找不到Webhook历史记录');
    }

    const historyEntry = this.history.get(webhookId).find(entry => entry.id === historyId);
    if (!historyEntry) {
      throw new Error('找不到指定的历史记录');
    }

    // 查找对应的Webhook
    let targetWebhook = null;
    for (const [eventName, webhookMap] of this.webhooks.entries()) {
      if (webhookMap.has(webhookId)) {
        targetWebhook = webhookMap.get(webhookId);
        break;
      }
    }

    if (!targetWebhook) {
      throw new Error('找不到对应的Webhook');
    }

    // 重新发送Webhook
    const result = await this._sendWebhook(targetWebhook, historyEntry.payload);
    
    // 保存新的历史记录
    this._saveHistory(webhookId, {
      eventName: historyEntry.eventName,
      payload: historyEntry.payload,
      result,
      timestamp: new Date().toISOString(),
      isRetry: true,
      originalHistoryId: historyId
    });

    return result;
  }

  /**
   * 批量触发多个事件
   * @param {Array} events - 事件数组 [{eventName, payload}]
   * @returns {Promise<Object>} 批量触发结果
   */
  async batchTriggerEvents(events) {
    if (!Array.isArray(events)) {
      throw new Error('事件参数必须是数组');
    }

    const batchResults = {};

    for (const event of events) {
      const { eventName, payload } = event;
      if (!eventName || !payload) {
        continue;
      }

      batchResults[eventName] = await this.triggerEvent(eventName, payload);
    }

    return batchResults;
  }

  /**
   * 设置重试配置
   * @param {Object} config - 重试配置
   */
  setRetryConfig(config) {
    this.retryConfig = {
      ...this.retryConfig,
      ...config
    };
  }

  /**
   * 设置默认请求头
   * @param {Object} headers - 默认请求头
   */
  setDefaultHeaders(headers) {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      ...headers
    };
  }

  /**
   * 验证Webhook签名
   * @param {string} signature - 接收到的签名
   * @param {Object} payload - 请求体
   * @param {string} secret - 密钥
   * @returns {boolean} 签名是否有效
   */
  verifyWebhookSignature(signature, payload, secret) {
    if (!signature || !payload || !secret) {
      return false;
    }

    try {
      // 在Node.js环境中可以使用crypto模块
      // 这里提供一个占位实现
      const payloadString = JSON.stringify(payload);
      // 注意：实际生产环境中需要使用安全的签名算法
      console.log('验证Webhook签名', { signature, payloadString, secret });
      return true; // 占位返回值
    } catch (error) {
      console.error('验证签名时出错:', error);
      return false;
    }
  }

  /**
   * 发送Webhook请求（内部方法）
   * @private
   */
  async _sendWebhook(webhook, payload) {
    const { url, method, headers, secret, retryEnabled } = webhook;
    let retries = 0;
    let lastError = null;

    // 添加请求头
    const requestHeaders = { ...headers };
    
    // 如果有密钥，生成签名
    if (secret) {
      requestHeaders['X-Webhook-Signature'] = this._generateSignature(payload, secret);
    }

    // 发送请求，支持重试
    while (retries <= (retryEnabled ? this.retryConfig.maxRetries : 0)) {
      try {
        // 在实际环境中，这里应该使用fetch或axios等发送HTTP请求
        // 这里提供一个模拟实现
        await this._mockHttpRequest(url, { method, headers: requestHeaders, body: payload });
        
        return {
          webhookId: webhook.id,
          eventName: webhook.eventName,
          status: 'success',
          retries,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        lastError = error;
        retries++;
        
        if (retries <= (retryEnabled ? this.retryConfig.maxRetries : 0)) {
          // 计算重试延迟（指数退避）
          const delay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffFactor, retries - 1);
          console.log(`Webhook请求失败，${delay}ms后重试 (${retries}/${this.retryConfig.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // 所有重试都失败
    return {
      webhookId: webhook.id,
      eventName: webhook.eventName,
      status: 'failed',
      retries,
      error: lastError.message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 生成Webhook签名（内部方法）
   * @private
   */
  _generateSignature(payload, secret) {
    // 占位实现，实际应使用安全的哈希算法
    const payloadString = JSON.stringify(payload);
    console.log('生成签名', { payloadString, secret });
    return 'signature_placeholder';
  }

  /**
   * 模拟HTTP请求（内部方法）
   * @private
   */
  async _mockHttpRequest(url, options) {
    // 模拟HTTP请求延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 模拟随机失败（用于测试）
    const random = Math.random();
    if (random < 0.1) { // 10%的失败率
      throw new Error('模拟HTTP请求失败');
    }
    
    console.log(`模拟发送${options.method}请求到${url}`, {
      headers: options.headers,
      body: options.body
    });
  }

  /**
   * 生成唯一ID（内部方法）
   * @private
   */
  _generateId() {
    return `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 检查Webhook是否存在（内部方法）
   * @private
   */
  _webhookExists(eventName, webhookId) {
    return this.webhooks.has(eventName) && 
           this.webhooks.get(eventName).has(webhookId);
  }

  /**
   * 保存历史记录（内部方法）
   * @private
   */
  _saveHistory(webhookId, entry) {
    if (!this.history.has(webhookId)) {
      this.history.set(webhookId, []);
    }

    const history = this.history.get(webhookId);
    history.push({
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...entry
    });

    // 限制历史记录数量
    const MAX_HISTORY = 1000;
    if (history.length > MAX_HISTORY) {
      this.history.set(webhookId, history.slice(-MAX_HISTORY));
    }
  }

  /**
   * 清理过期的历史记录
   * @param {number} days - 保留天数
   */
  cleanupHistory(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    for (const [webhookId, history] of this.history.entries()) {
      const filteredHistory = history.filter(entry => 
        new Date(entry.timestamp) > cutoffDate
      );
      
      if (filteredHistory.length === 0) {
        this.history.delete(webhookId);
      } else {
        this.history.set(webhookId, filteredHistory);
      }
    }
  }

  /**
   * 导出Webhook配置
   * @returns {string} JSON格式的配置字符串
   */
  exportConfiguration() {
    const webhooks = this.getAllWebhooks();
    const config = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      webhooks,
      retryConfig: this.retryConfig,
      defaultHeaders: this.defaultHeaders
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * 导入Webhook配置
   * @param {string} jsonConfig - JSON格式的配置字符串
   * @param {boolean} overwrite - 是否覆盖现有配置
   * @returns {Object} 导入结果
   */
  importConfiguration(jsonConfig, overwrite = false) {
    try {
      const config = JSON.parse(jsonConfig);
      const importedWebhooks = config.webhooks || [];
      let importedCount = 0;
      let skippedCount = 0;

      if (!overwrite) {
        // 清除现有配置
        this.webhooks.clear();
        this.history.clear();
      }

      // 导入Webhooks
      importedWebhooks.forEach(webhook => {
        try {
          // 如果不覆盖且已存在，则跳过
          if (!overwrite && this._webhookExists(webhook.eventName, webhook.id)) {
            skippedCount++;
            return;
          }

          if (!this.webhooks.has(webhook.eventName)) {
            this.webhooks.set(webhook.eventName, new Map());
          }

          // 确保包含默认字段
          const importedWebhook = {
            ...webhook,
            headers: { ...this.defaultHeaders, ...(webhook.headers || {}) }
          };

          this.webhooks.get(webhook.eventName).set(webhook.id, importedWebhook);
          importedCount++;
        } catch (error) {
          console.error(`导入Webhook ${webhook.id} 失败:`, error);
          skippedCount++;
        }
      });

      // 导入其他配置
      if (config.retryConfig) {
        this.retryConfig = { ...this.retryConfig, ...config.retryConfig };
      }

      if (config.defaultHeaders) {
        this.defaultHeaders = { ...this.defaultHeaders, ...config.defaultHeaders };
      }

      return {
        success: true,
        imported: importedCount,
        skipped: skippedCount,
        total: importedWebhooks.length
      };
    } catch (error) {
      console.error('导入配置失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 导出单例实例
const webhookManager = new WebhookManager();
export default webhookManager;
export { WebhookManager };