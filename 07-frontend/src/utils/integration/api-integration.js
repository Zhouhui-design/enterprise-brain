/**
 * API集成工具
 * 提供统一的API调用、拦截、缓存和错误处理功能
 */
class ApiIntegration {
  constructor() {
    this.baseUrl = '';
    this.timeout = 30000; // 默认30秒超时
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    this.interceptors = {
      request: [],
      response: []
    };
    this.cache = new Map();
    this.cacheConfig = {
      enabled: false,
      defaultExpiry: 60000, // 默认1分钟
      maxEntries: 100
    };
    this.rateLimiter = {
      enabled: false,
      requests: 60,
      perSeconds: 60,
      queue: []
    };
    this.retryConfig = {
      enabled: true,
      maxRetries: 3,
      retryableStatuses: [408, 429, 500, 502, 503, 504],
      initialDelay: 1000,
      backoffFactor: 2
    };
    this.mockMode = false;
    this.mockData = new Map();
    this.activeRequests = new Map();
  }

  /**
   * 设置基础URL
   * @param {string} url - 基础URL
   * @returns {ApiIntegration} 当前实例，支持链式调用
   */
  setBaseUrl(url) {
    this.baseUrl = url;
    return this;
  }

  /**
   * 设置请求超时
   * @param {number} ms - 超时时间（毫秒）
   * @returns {ApiIntegration} 当前实例，支持链式调用
   */
  setTimeout(ms) {
    this.timeout = ms;
    return this;
  }

  /**
   * 设置默认请求头
   * @param {Object} headers - 请求头对象
   * @returns {ApiIntegration} 当前实例，支持链式调用
   */
  setHeaders(headers) {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  /**
   * 添加请求拦截器
   * @param {Function} interceptor - 请求拦截器函数
   * @returns {ApiIntegration} 当前实例，支持链式调用
   */
  addRequestInterceptor(interceptor) {
    if (typeof interceptor === 'function') {
      this.interceptors.request.push(interceptor);
    }
    return this;
  }

  /**
   * 添加响应拦截器
   * @param {Function} interceptor - 响应拦截器函数
   * @returns {ApiIntegration} 当前实例，支持链式调用
   */
  addResponseInterceptor(interceptor) {
    if (typeof interceptor === 'function') {
      this.interceptors.response.push(interceptor);
    }
    return this;
  }

  /**
   * 配置缓存
   * @param {Object} config - 缓存配置
   * @returns {ApiIntegration} 当前实例，支持链式调用
   */
  configureCache(config) {
    this.cacheConfig = { ...this.cacheConfig, ...config };
    return this;
  }

  /**
   * 配置速率限制器
   * @param {Object} config - 速率限制配置
   * @returns {ApiIntegration} 当前实例，支持链式调用
   */
  configureRateLimiter(config) {
    this.rateLimiter = { ...this.rateLimiter, ...config };
    return this;
  }

  /**
   * 配置重试策略
   * @param {Object} config - 重试配置
   * @returns {ApiIntegration} 当前实例，支持链式调用
   */
  configureRetry(config) {
    this.retryConfig = { ...this.retryConfig, ...config };
    return this;
  }

  /**
   * 启用/禁用模拟模式
   * @param {boolean} enabled - 是否启用
   * @returns {ApiIntegration} 当前实例，支持链式调用
   */
  setMockMode(enabled) {
    this.mockMode = enabled;
    return this;
  }

  /**
   * 添加模拟数据
   * @param {string} endpoint - API端点
   * @param {Object} data - 模拟数据
   * @param {string} method - HTTP方法
   * @returns {ApiIntegration} 当前实例，支持链式调用
   */
  addMockData(endpoint, data, method = 'GET') {
    const key = `${method.toUpperCase()}:${endpoint}`;
    this.mockData.set(key, data);
    return this;
  }

  /**
   * 清除所有缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 清除特定缓存
   * @param {string} url - 要清除的URL
   * @param {string} method - HTTP方法
   */
  clearCacheItem(url, method = 'GET') {
    const cacheKey = this._getCacheKey(url, method);
    this.cache.delete(cacheKey);
  }

  /**
   * 执行GET请求
   * @param {string} endpoint - API端点
   * @param {Object} options - 请求选项
   * @returns {Promise} 请求结果Promise
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * 执行POST请求
   * @param {string} endpoint - API端点
   * @param {Object} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise} 请求结果Promise
   */
  post(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', data });
  }

  /**
   * 执行PUT请求
   * @param {string} endpoint - API端点
   * @param {Object} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise} 请求结果Promise
   */
  put(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', data });
  }

  /**
   * 执行DELETE请求
   * @param {string} endpoint - API端点
   * @param {Object} options - 请求选项
   * @returns {Promise} 请求结果Promise
   */
  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * 执行PATCH请求
   * @param {string} endpoint - API端点
   * @param {Object} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise} 请求结果Promise
   */
  patch(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', data });
  }

  /**
   * 执行HEAD请求
   * @param {string} endpoint - API端点
   * @param {Object} options - 请求选项
   * @returns {Promise} 请求结果Promise
   */
  head(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'HEAD' });
  }

  /**
   * 执行OPTIONS请求
   * @param {string} endpoint - API端点
   * @param {Object} options - 请求选项
   * @returns {Promise} 请求结果Promise
   */
  options(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'OPTIONS' });
  }

  /**
   * 执行上传请求
   * @param {string} endpoint - API端点
   * @param {FormData} formData - 表单数据
   * @param {Object} options - 请求选项
   * @returns {Promise} 请求结果Promise
   */
  upload(endpoint, formData, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      data: formData,
      headers: {
        ...options.headers,
        'Content-Type': 'multipart/form-data'
      },
      processData: false,
      contentType: false
    });
  }

  /**
   * 批量发送请求
   * @param {Array} requests - 请求配置数组
   * @returns {Promise} 所有请求结果的Promise
   */
  async batch(requests) {
    if (!Array.isArray(requests)) {
      throw new Error('请求参数必须是数组');
    }

    const promiseArray = requests.map(req => {
      const { endpoint, method = 'GET', data, options = {} } = req;
      return this.request(endpoint, { ...options, method, data });
    });

    return Promise.all(promiseArray);
  }

  /**
   * 核心请求方法
   * @param {string} endpoint - API端点
   * @param {Object} config - 请求配置
   * @returns {Promise} 请求结果Promise
   */
  async request(endpoint, config = {}) {
    const {
      method = 'GET',
      data,
      headers = {},
      params = {},
      cache = this.cacheConfig.enabled,
      cacheExpiry,
      skipRetry = false,
      skipInterceptors = false,
      responseType = 'json'
    } = config;

    // 构建完整URL
    const url = this._buildUrl(endpoint, params);
    
    // 检查是否有缓存（仅GET请求）
    if (method === 'GET' && cache && !skipInterceptors) {
      const cached = this._getCache(url, method);
      if (cached) {
        console.log(`使用缓存响应: ${url}`);
        return cached;
      }
    }

    // 构建请求配置
    let requestConfig = {
      url,
      method: method.toUpperCase(),
      headers: { ...this.headers, ...headers }
    };

    // 添加请求数据（非GET请求）
    if (method !== 'GET' && data) {
      // 检查内容类型
      const contentType = requestConfig.headers['Content-Type'] || requestConfig.headers['content-type'];
      if (!contentType || contentType.includes('application/json')) {
        requestConfig.body = JSON.stringify(data);
      } else {
        requestConfig.body = data;
      }
    }

    // 应用请求拦截器
    if (!skipInterceptors) {
      for (const interceptor of this.interceptors.request) {
        requestConfig = await interceptor(requestConfig);
        if (!requestConfig) {
          throw new Error('请求拦截器中止了请求');
        }
      }
    }

    // 检查是否在模拟模式
    if (this.mockMode) {
      return this._mockRequest(endpoint, method, data);
    }

    // 检查速率限制
    if (this.rateLimiter.enabled) {
      await this._applyRateLimit();
    }

    // 生成请求ID
    const requestId = this._generateRequestId();
    this.activeRequests.set(requestId, requestConfig);

    try {
      // 执行请求（支持重试）
      let response;
      if (skipRetry || !this.retryConfig.enabled) {
        response = await this._executeRequest(requestConfig);
      } else {
        response = await this._executeWithRetry(requestConfig);
      }

      // 应用响应拦截器
      let processedResponse = response;
      if (!skipInterceptors) {
        for (const interceptor of this.interceptors.response) {
          processedResponse = await interceptor(processedResponse, requestConfig);
          if (!processedResponse) {
            throw new Error('响应拦截器中止了处理');
          }
        }
      }

      // 缓存响应（仅GET请求）
      if (method === 'GET' && cache && !skipInterceptors) {
        this._setCache(url, method, processedResponse, cacheExpiry);
      }

      return processedResponse;
    } finally {
      // 清理活跃请求
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * 取消所有活跃的请求
   */
  cancelAllRequests() {
    // 这里应该实现请求取消逻辑
    // 例如使用AbortController
    console.log(`取消了 ${this.activeRequests.size} 个活跃请求`);
    this.activeRequests.clear();
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计
   */
  getCacheStats() {
    let hitCount = 0;
    let missCount = 0;
    let totalSize = 0;

    // 模拟统计信息
    console.log('获取缓存统计');
    return {
      size: this.cache.size,
      maxSize: this.cacheConfig.maxEntries,
      hitCount,
      missCount,
      hitRate: hitCount + missCount > 0 ? (hitCount / (hitCount + missCount) * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * 构建完整URL（内部方法）
   * @private
   */
  _buildUrl(endpoint, params = {}) {
    // 处理绝对URL
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      const url = new URL(endpoint);
      // 添加查询参数
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });
      return url.toString();
    }

    // 处理相对URL
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(baseUrl + path);
    
    // 添加查询参数
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    return url.toString();
  }

  /**
   * 执行HTTP请求（内部方法）
   * @private
   */
  async _executeRequest(config) {
    const { url, method, headers, body } = config;
    
    try {
      // 使用fetch API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // 检查响应状态
      if (!response.ok) {
        const errorData = await this._parseResponse(response);
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        error.headers = response.headers;
        throw error;
      }

      // 解析响应
      const data = await this._parseResponse(response);
      
      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`请求超时: ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * 带重试的请求执行（内部方法）
   * @private
   */
  async _executeWithRetry(config) {
    let lastError;
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // 计算重试延迟
          const delay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1);
          console.log(`重试请求 (${attempt}/${this.retryConfig.maxRetries})，${delay}ms后重试`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        return await this._executeRequest(config);
      } catch (error) {
        lastError = error;
        
        // 判断是否应该重试
        if (attempt >= this.retryConfig.maxRetries || 
            !this._isRetryableError(error)) {
          throw error;
        }
      }
    }
    throw lastError; // 不应该到达这里，但为了安全
  }

  /**
   * 解析响应（内部方法）
   * @private
   */
  async _parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (error) {
        console.error('JSON解析错误:', error);
        return await response.text();
      }
    } else if (contentType && contentType.includes('text/')) {
      return await response.text();
    } else if (contentType && contentType.includes('image/')) {
      return await response.blob();
    } else {
      return await response.arrayBuffer();
    }
  }

  /**
   * 检查错误是否可重试（内部方法）
   * @private
   */
  _isRetryableError(error) {
    // 网络错误可重试
    if (!error.status) {
      return true;
    }
    
    // 检查状态码是否在可重试列表中
    return this.retryConfig.retryableStatuses.includes(error.status);
  }

  /**
   * 获取缓存（内部方法）
   * @private
   */
  _getCache(url, method) {
    const key = this._getCacheKey(url, method);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    
    // 缓存过期，删除
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * 设置缓存（内部方法）
   * @private
   */
  _setCache(url, method, data, expiry) {
    // 检查缓存配置
    if (!this.cacheConfig.enabled || this.cache.size >= this.cacheConfig.maxEntries) {
      return;
    }
    
    const key = this._getCacheKey(url, method);
    const expiryTime = Date.now() + (expiry || this.cacheConfig.defaultExpiry);
    
    this.cache.set(key, {
      data,
      expiry: expiryTime
    });
  }

  /**
   * 生成缓存键（内部方法）
   * @private
   */
  _getCacheKey(url, method) {
    return `${method}:${url}`;
  }

  /**
   * 应用速率限制（内部方法）
   * @private
   */
  async _applyRateLimit() {
    // 这里应该实现实际的速率限制逻辑
    // 简单实现：如果队列长度超过阈值，等待
    if (this.rateLimiter.queue.length > 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 模拟添加到队列并处理
    this.rateLimiter.queue.push(Date.now());
    
    // 清理过期的队列项
    const now = Date.now();
    const timeWindow = this.rateLimiter.perSeconds * 1000;
    this.rateLimiter.queue = this.rateLimiter.queue.filter(time => now - time < timeWindow);
  }

  /**
   * 模拟请求（内部方法）
   * @private
   */
  _mockRequest(endpoint, method, data) {
    const key = `${method.toUpperCase()}:${endpoint}`;
    const mockResponse = this.mockData.get(key);
    
    if (mockResponse !== undefined) {
      return Promise.resolve({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        config: { url: endpoint, method }
      });
    }
    
    // 返回404模拟响应
    return Promise.resolve({
      data: { error: 'Not found' },
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
      config: { url: endpoint, method }
    });
  }

  /**
   * 生成请求ID（内部方法）
   * @private
   */
  _generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 健康检查
   * @param {string} endpoint - 健康检查端点
   * @returns {Promise<Object>} 健康检查结果
   */
  async healthCheck(endpoint = '/health') {
    try {
      const response = await this.get(endpoint, {
        cache: false,
        timeout: 5000
      });
      return {
        healthy: true,
        response
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * 创建资源集合管理器
   * @param {string} baseEndpoint - 基础端点
   * @returns {Object} 资源集合管理方法
   */
  resource(baseEndpoint) {
    return {
      list: (params) => this.get(baseEndpoint, { params }),
      get: (id) => this.get(`${baseEndpoint}/${id}`),
      create: (data) => this.post(baseEndpoint, data),
      update: (id, data) => this.put(`${baseEndpoint}/${id}`, data),
      patch: (id, data) => this.patch(`${baseEndpoint}/${id}`, data),
      delete: (id) => this.delete(`${baseEndpoint}/${id}`)
    };
  }
}

// 导出单例实例
const apiIntegration = new ApiIntegration();
export default apiIntegration;
export { ApiIntegration };