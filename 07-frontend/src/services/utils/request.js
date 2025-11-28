/**
 * HTTP请求工具
 * 封装fetch API，提供统一的请求处理、拦截器、错误处理等功能
 */
class Request {
  constructor() {
    // 默认配置
    this.defaultConfig = {
      baseURL: '',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'json',
      withCredentials: false,
      retryCount: 0,
      retryDelay: 1000,
      retryableStatuses: [408, 429, 500, 502, 503, 504],
      cache: 'default',
      mode: 'cors'
    };
    
    // 请求拦截器
    this.requestInterceptors = [];
    // 响应拦截器
    this.responseInterceptors = [];
    // 错误拦截器
    this.errorInterceptors = [];
    
    // 取消控制器映射
    this.abortControllers = new Map();
    // 请求缓存
    this.requestCache = new Map();
  }

  /**
   * 设置默认配置
   * @param {Object} config - 配置对象
   * @returns {Request} 实例自身
   */
  setDefaults(config) {
    this.defaultConfig = { ...this.defaultConfig, ...config };
    return this;
  }

  /**
   * 添加请求拦截器
   * @param {Function} interceptor - 请求拦截器函数
   * @returns {Request} 实例自身
   */
  addRequestInterceptor(interceptor) {
    if (typeof interceptor === 'function') {
      this.requestInterceptors.push(interceptor);
    }
    return this;
  }

  /**
   * 添加响应拦截器
   * @param {Function} interceptor - 响应拦截器函数
   * @returns {Request} 实例自身
   */
  addResponseInterceptor(interceptor) {
    if (typeof interceptor === 'function') {
      this.responseInterceptors.push(interceptor);
    }
    return this;
  }

  /**
   * 添加错误拦截器
   * @param {Function} interceptor - 错误拦截器函数
   * @returns {Request} 实例自身
   */
  addErrorInterceptor(interceptor) {
    if (typeof interceptor === 'function') {
      this.errorInterceptors.push(interceptor);
    }
    return this;
  }

  /**
   * 清除所有拦截器
   * @returns {Request} 实例自身
   */
  clearInterceptors() {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorInterceptors = [];
    return this;
  }

  /**
   * 生成请求缓存键
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {string} 缓存键
   */
  _generateCacheKey(url, options) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    const headers = JSON.stringify(options.headers || {});
    return `${method}:${url}:${body}:${headers}`;
  }

  /**
   * 检查是否可缓存的请求
   * @param {string} method - 请求方法
   * @param {Object} options - 请求选项
   * @returns {boolean} 是否可缓存
   */
  _isCacheable(method, options) {
    return method === 'GET' && options.cache === 'force-cache';
  }

  /**
   * 执行请求拦截器
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 处理后的请求选项
   */
  async _applyRequestInterceptors(options) {
    let processedOptions = { ...options };
    
    for (const interceptor of this.requestInterceptors) {
      processedOptions = await interceptor(processedOptions) || processedOptions;
    }
    
    return processedOptions;
  }

  /**
   * 执行响应拦截器
   * @param {Response} response - 响应对象
   * @returns {Promise<any>} 处理后的响应数据
   */
  async _applyResponseInterceptors(response) {
    let processedResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse) || processedResponse;
    }
    
    return processedResponse;
  }

  /**
   * 执行错误拦截器
   * @param {Error} error - 错误对象
   * @returns {Promise<Error>} 处理后的错误
   */
  async _applyErrorInterceptors(error) {
    let processedError = error;
    
    for (const interceptor of this.errorInterceptors) {
      const result = await interceptor(processedError);
      if (result !== undefined) {
        processedError = result;
      }
    }
    
    return processedError;
  }

  /**
   * 构建完整URL
   * @param {string} url - 请求URL
   * @param {string} baseURL - 基础URL
   * @returns {string} 完整URL
   */
  _buildURL(url, baseURL) {
    if (!url) return baseURL;
    
    // 如果是完整URL，直接返回
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    
    // 合并基础URL和相对URL
    const base = baseURL.replace(/\/$/, '');
    const relative = url.replace(/^\//, '');
    return `${base}/${relative}`;
  }

  /**
   * 格式化查询参数
   * @param {Object} params - 查询参数对象
   * @returns {string} 查询参数字符串
   */
  _formatQueryParams(params) {
    if (!params || typeof params !== 'object') return '';
    
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(key, item));
        } else if (typeof value === 'object') {
          queryParams.append(key, JSON.stringify(value));
        } else {
          queryParams.append(key, value);
        }
      }
    });
    
    const paramsString = queryParams.toString();
    return paramsString ? `?${paramsString}` : '';
  }

  /**
   * 处理请求超时
   * @param {Promise} fetchPromise - fetch请求Promise
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise<any>} 带超时处理的Promise
   */
  _withTimeout(fetchPromise, timeout) {
    const timeoutPromise = new Promise((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);
      
      // 清理超时定时器
      fetchPromise.finally(() => clearTimeout(timeoutId));
    });
    
    return Promise.race([fetchPromise, timeoutPromise]);
  }

  /**
   * 解析响应数据
   * @param {Response} response - 响应对象
   * @param {string} responseType - 响应类型
   * @returns {Promise<any>} 解析后的数据
   */
  async _parseResponse(response, responseType) {
    switch (responseType.toLowerCase()) {
      case 'json':
        try {
          return await response.json();
        } catch (e) {
          throw new Error('Invalid JSON response');
        }
      case 'text':
        return await response.text();
      case 'blob':
        return await response.blob();
      case 'arraybuffer':
        return await response.arrayBuffer();
      case 'formdata':
        return await response.formData();
      default:
        return await response.json();
    }
  }

  /**
   * 检查响应是否成功
   * @param {Response} response - 响应对象
   * @returns {boolean} 是否成功
   */
  _isResponseOk(response) {
    return response.ok || response.status === 304;
  }

  /**
   * 生成请求错误对象
   * @param {Response} response - 响应对象
   * @param {any} data - 响应数据
   * @returns {Error} 错误对象
   */
  _createRequestError(response, data) {
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    error.statusText = response.statusText;
    error.data = data;
    error.response = response;
    return error;
  }

  /**
   * 重试请求
   * @param {Function} requestFn - 请求函数
   * @param {number} retryCount - 重试次数
   * @param {number} retryDelay - 重试延迟
   * @param {Array<number>} retryableStatuses - 可重试的状态码
   * @returns {Promise<any>} 请求结果
   */
  async _retryRequest(requestFn, retryCount, retryDelay, retryableStatuses) {
    let lastError;
    
    for (let i = 0; i <= retryCount; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // 检查是否需要重试
        if (i < retryCount && 
            error.response && 
            retryableStatuses.includes(error.response.status)) {
          // 指数退避延迟
          const delay = retryDelay * Math.pow(2, i);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw lastError;
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 准备请求选项
   * @param {string} method - 请求方法
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Object} 处理后的请求选项
   */
  _prepareOptions(method, url, options = {}) {
    const mergedOptions = { ...this.defaultConfig, ...options };
    const { baseURL, params, ...restOptions } = mergedOptions;
    
    // 构建完整URL
    const fullURL = this._buildURL(url, baseURL);
    // 添加查询参数
    const queryString = this._formatQueryParams(params);
    const finalURL = `${fullURL}${queryString}`;
    
    // 准备fetch选项
    const fetchOptions = {
      method: method.toUpperCase(),
      ...restOptions
    };
    
    // 处理请求体
    if (fetchOptions.body && typeof fetchOptions.body === 'object' && 
        !(fetchOptions.body instanceof FormData || 
          fetchOptions.body instanceof Blob || 
          fetchOptions.body instanceof URLSearchParams)) {
      // 如果不是FormData等类型，转换为JSON字符串
      if (fetchOptions.headers && fetchOptions.headers['Content-Type'] === 'application/json') {
        fetchOptions.body = JSON.stringify(fetchOptions.body);
      }
    }
    
    return { finalURL, fetchOptions };
  }

  /**
   * 创建取消控制器
   * @param {string} url - 请求URL
   * @returns {AbortController} 取消控制器
   */
  _createAbortController(url) {
    const controller = new AbortController();
    this.abortControllers.set(url, controller);
    
    // 清理过期的控制器
    return controller;
  }

  /**
   * 取消请求
   * @param {string} url - 请求URL
   * @returns {boolean} 是否成功取消
   */
  cancel(url) {
    const controller = this.abortControllers.get(url);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(url);
      return true;
    }
    return false;
  }

  /**
   * 取消所有请求
   */
  cancelAll() {
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();
  }

  /**
   * 清除请求缓存
   */
  clearCache() {
    this.requestCache.clear();
  }

  /**
   * 执行HTTP请求
   * @param {string} method - 请求方法
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<any>} 请求结果
   */
  async request(method, url, options = {}) {
    try {
      const { finalURL, fetchOptions } = this._prepareOptions(method, url, options);
      
      // 检查缓存
      const cacheKey = this._generateCacheKey(finalURL, fetchOptions);
      if (this._isCacheable(method, fetchOptions) && this.requestCache.has(cacheKey)) {
        return this.requestCache.get(cacheKey);
      }
      
      // 应用请求拦截器
      const interceptedOptions = await this._applyRequestInterceptors({
        ...fetchOptions,
        url: finalURL
      });
      
      // 处理取消功能
      if (options.signal) {
        interceptedOptions.signal = options.signal;
      } else if (options.cancelable !== false) {
        const controller = this._createAbortController(finalURL);
        interceptedOptions.signal = controller.signal;
      }
      
      // 移除url属性，fetch不支持
      const { url: _, ...fetchParams } = interceptedOptions;
      
      // 创建请求函数
      const requestFn = async () => {
        // 执行fetch请求，带超时处理
        const response = await this._withTimeout(
          fetch(finalURL, fetchParams),
          interceptedOptions.timeout
        );
        
        // 解析响应数据
        const data = await this._parseResponse(response, interceptedOptions.responseType);
        
        // 检查响应状态
        if (!this._isResponseOk(response)) {
          throw this._createRequestError(response, data);
        }
        
        // 应用响应拦截器
        const result = await this._applyResponseInterceptors({
          ...response,
          data
        });
        
        // 缓存GET请求
        if (this._isCacheable(method, fetchOptions)) {
          this.requestCache.set(cacheKey, result);
        }
        
        return result;
      };
      
      // 执行请求，支持重试
      const result = await this._retryRequest(
        requestFn,
        interceptedOptions.retryCount,
        interceptedOptions.retryDelay,
        interceptedOptions.retryableStatuses
      );
      
      // 清理取消控制器
      this.abortControllers.delete(finalURL);
      
      return result;
    } catch (error) {
      // 应用错误拦截器
      const processedError = await this._applyErrorInterceptors(error);
      throw processedError;
    }
  }

  // 快捷方法
  
  /**
   * GET请求
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<any>} 请求结果
   */
  get(url, options = {}) {
    return this.request('GET', url, options);
  }

  /**
   * POST请求
   * @param {string} url - 请求URL
   * @param {any} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<any>} 请求结果
   */
  post(url, data, options = {}) {
    return this.request('POST', url, { ...options, body: data });
  }

  /**
   * PUT请求
   * @param {string} url - 请求URL
   * @param {any} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<any>} 请求结果
   */
  put(url, data, options = {}) {
    return this.request('PUT', url, { ...options, body: data });
  }

  /**
   * PATCH请求
   * @param {string} url - 请求URL
   * @param {any} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<any>} 请求结果
   */
  patch(url, data, options = {}) {
    return this.request('PATCH', url, { ...options, body: data });
  }

  /**
   * DELETE请求
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<any>} 请求结果
   */
  delete(url, options = {}) {
    return this.request('DELETE', url, options);
  }

  /**
   * HEAD请求
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<any>} 请求结果
   */
  head(url, options = {}) {
    return this.request('HEAD', url, options);
  }

  /**
   * OPTIONS请求
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<any>} 请求结果
   */
  options(url, options = {}) {
    return this.request('OPTIONS', url, options);
  }

  /**
   * 上传文件
   * @param {string} url - 请求URL
   * @param {FormData|Object} formData - 表单数据
   * @param {Object} options - 请求选项
   * @returns {Promise<any>} 请求结果
   */
  upload(url, formData, options = {}) {
    const uploadOptions = {
      ...options,
      headers: {
        ...options.headers,
        // 移除Content-Type，让浏览器自动设置带边界的multipart/form-data
        'Content-Type': undefined
      },
      body: formData instanceof FormData ? formData : this._createFormData(formData)
    };
    
    // 添加上传进度监听
    if (options.onProgress && typeof XMLHttpRequest !== 'undefined') {
      return this._uploadWithProgress(url, uploadOptions);
    }
    
    return this.post(url, uploadOptions.body, uploadOptions);
  }

  /**
   * 使用XMLHttpRequest上传文件（支持进度监听）
   * @private
   */
  _uploadWithProgress(url, options) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(options.method || 'POST', url, true);
      
      // 设置超时
      xhr.timeout = options.timeout || this.defaultConfig.timeout;
      
      // 设置请求头
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          if (value !== undefined) {
            xhr.setRequestHeader(key, value);
          }
        });
      }
      
      // 监听上传进度
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          options.onProgress({ loaded: event.loaded, total: event.total, percent: percentComplete });
        }
      });
      
      // 监听完成
      xhr.addEventListener('load', () => {
        let responseData;
        try {
          responseData = JSON.parse(xhr.responseText);
        } catch (e) {
          responseData = xhr.responseText;
        }
        
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(responseData);
        } else {
          reject(this._createRequestError(
            { status: xhr.status, statusText: xhr.statusText },
            responseData
          ));
        }
      });
      
      // 监听错误
      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred'));
      });
      
      // 监听超时
      xhr.addEventListener('timeout', () => {
        reject(new Error('Request timeout'));
      });
      
      // 发送请求
      xhr.send(options.body);
    });
  }

  /**
   * 下载文件
   * @param {string} url - 请求URL
   * @param {string} filename - 文件名
   * @param {Object} options - 请求选项
   * @returns {Promise<void>}
   */
  async download(url, filename, options = {}) {
    const response = await this.get(url, {
      ...options,
      responseType: 'blob'
    });
    
    // 获取blob数据
    const blob = response.data instanceof Blob ? response.data : response;
    
    // 创建下载链接
    const urlObj = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = urlObj;
    link.download = filename;
    link.style.display = 'none';
    
    // 添加到DOM并触发点击
    document.body.appendChild(link);
    link.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(urlObj);
    }, 100);
  }

  /**
   * 创建FormData对象
   * @param {Object} data - 表单数据对象
   * @returns {FormData} FormData实例
   */
  _createFormData(data) {
    const formData = new FormData();
    
    const appendToFormData = (obj, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const name = prefix ? `${prefix}[${key}]` : key;
        
        if (value instanceof File || value instanceof Blob) {
          formData.append(name, value, value.name || key);
        } else if (value instanceof Date) {
          formData.append(name, value.toISOString());
        } else if (value instanceof Object && value !== null) {
          appendToFormData(value, name);
        } else {
          formData.append(name, value !== null && value !== undefined ? value : '');
        }
      });
    };
    
    appendToFormData(data);
    return formData;
  }

  /**
   * 批量发送请求
   * @param {Array<Function>} requests - 请求函数数组
   * @param {boolean} failFast - 是否快速失败
   * @returns {Promise<Array<any>>} 请求结果数组
   */
  async batch(requests, failFast = true) {
    if (failFast) {
      return Promise.all(requests);
    } else {
      // 允许部分请求失败
      const results = await Promise.allSettled(requests);
      return results.map(result => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        return result.reason;
      });
    }
  }

  /**
   * 链式请求（串行）
   * @param {Array<Function>} requestChain - 请求函数链
   * @returns {Promise<any>} 最终请求结果
   */
  async chain(requestChain) {
    let result;
    
    for (const requestFn of requestChain) {
      result = await requestFn(result);
    }
    
    return result;
  }

  /**
   * 获取请求统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      activeRequests: this.abortControllers.size,
      cachedRequests: this.requestCache.size,
      requestInterceptors: this.requestInterceptors.length,
      responseInterceptors: this.responseInterceptors.length,
      errorInterceptors: this.errorInterceptors.length
    };
  }

  /**
   * 克隆实例
   * @returns {Request} 新的实例
   */
  clone() {
    const newInstance = new Request();
    newInstance.defaultConfig = { ...this.defaultConfig };
    newInstance.requestInterceptors = [...this.requestInterceptors];
    newInstance.responseInterceptors = [...this.responseInterceptors];
    newInstance.errorInterceptors = [...this.errorInterceptors];
    return newInstance;
  }

  /**
   * 模拟响应（用于开发测试）
   * @param {Object} mockResponse - 模拟响应数据
   * @returns {Request} 实例自身
   */
  mock(mockResponse) {
    this.mockResponse = mockResponse;
    return this;
  }

  /**
   * 禁用模拟
   * @returns {Request} 实例自身
   */
  disableMock() {
    this.mockResponse = null;
    return this;
  }

  /**
   * 生成唯一请求ID
   * @returns {string} 请求ID
   */
  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

// 导出单例实例
const request = new Request();
export default request;
export { Request };