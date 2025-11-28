/**
 * 存储管理工具
 * 提供统一的存储接口，支持localStorage、sessionStorage、IndexedDB、Cookie等多种存储方式
 */
class Storage {
  constructor() {
    // 默认配置
    this.config = {
      defaultDriver: 'localStorage',
      prefix: '',
      encryption: {
        enabled: false,
        key: null,
        algorithms: {
          encrypt: 'AES-CBC',
          hash: 'SHA-256'
        }
      },
      fallbackDriver: 'cookie',
      quotaWarningThreshold: 0.8,
      debug: false
    };
    
    // 驱动映射
    this.drivers = {
      localStorage: this._createLocalStorageDriver(),
      sessionStorage: this._createSessionStorageDriver(),
      cookie: this._createCookieDriver(),
      indexedDB: this._createIndexedDBDriver(),
      memory: this._createMemoryDriver()
    };
    
    // 当前使用的驱动
    this.currentDriver = this._resolveDriver(this.config.defaultDriver);
    
    // 初始化事件系统
    this._initEventSystem();
    
    // 检查存储配额
    this._checkStorageQuota();
  }

  /**
   * 设置配置
   * @param {Object} config - 配置对象
   * @returns {Storage} 实例自身
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
    
    // 如果切换了默认驱动，重新初始化
    if (config.defaultDriver && config.defaultDriver !== this.config.defaultDriver) {
      this.currentDriver = this._resolveDriver(config.defaultDriver);
    }
    
    return this;
  }

  /**
   * 获取配置
   * @returns {Object} 配置对象
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 切换存储驱动
   * @param {string} driverName - 驱动名称
   * @returns {Storage} 实例自身
   */
  use(driverName) {
    const driver = this._resolveDriver(driverName);
    if (driver) {
      this.currentDriver = driver;
      this._log(`Switched to ${driverName} driver`);
    }
    return this;
  }

  /**
   * 解析并获取驱动
   * @private
   */
  _resolveDriver(driverName) {
    if (this.drivers[driverName] && this._isDriverAvailable(driverName)) {
      return this.drivers[driverName];
    }
    
    // 回退到默认驱动
    this._log(`Driver ${driverName} not available, falling back to ${this.config.fallbackDriver}`);
    return this.drivers[this.config.fallbackDriver];
  }

  /**
   * 检查驱动是否可用
   * @private
   */
  _isDriverAvailable(driverName) {
    switch (driverName) {
      case 'localStorage':
        return this._isLocalStorageAvailable();
      case 'sessionStorage':
        return this._isSessionStorageAvailable();
      case 'cookie':
        return typeof document !== 'undefined';
      case 'indexedDB':
        return this._isIndexedDBAvailable();
      case 'memory':
        return true;
      default:
        return false;
    }
  }

  /**
   * 检查localStorage是否可用
   * @private
   */
  _isLocalStorageAvailable() {
    try {
      if (typeof localStorage === 'undefined') return false;
      
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 检查sessionStorage是否可用
   * @private
   */
  _isSessionStorageAvailable() {
    try {
      if (typeof sessionStorage === 'undefined') return false;
      
      const testKey = '__test__';
      sessionStorage.setItem(testKey, testKey);
      sessionStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 检查IndexedDB是否可用
   * @private
   */
  _isIndexedDBAvailable() {
    return 'indexedDB' in window;
  }

  /**
   * 初始化事件系统
   * @private
   */
  _initEventSystem() {
    this.listeners = {};
    
    // 监听存储事件
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        this._handleStorageEvent(event);
      });
    }
  }

  /**
   * 处理存储事件
   * @private
   */
  _handleStorageEvent(event) {
    const { key, oldValue, newValue } = event;
    if (key && key.startsWith(this.config.prefix)) {
      const actualKey = key.replace(this.config.prefix, '');
      this._emit('change', { key: actualKey, oldValue, newValue });
      this._emit(`change:${actualKey}`, { oldValue, newValue });
    }
  }

  /**
   * 触发事件
   * @private
   */
  _emit(event, data) {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  /**
   * 检查存储配额
   * @private
   */
  _checkStorageQuota() {
    // 对于localStorage和sessionStorage，可以估算使用量
    if (this.currentDriver.name === 'localStorage' || this.currentDriver.name === 'sessionStorage') {
      const storage = this.currentDriver.name === 'localStorage' ? localStorage : sessionStorage;
      let totalSize = 0;
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        const value = storage.getItem(key);
        totalSize += key.length + value.length;
      }
      
      // 估算localStorage的总大小（通常为5MB）
      const estimatedQuota = 5 * 1024 * 1024;
      const usagePercentage = totalSize / estimatedQuota;
      
      if (usagePercentage > this.config.quotaWarningThreshold) {
        this._emit('quota_warning', { 
          usagePercentage,
          totalSize,
          estimatedQuota
        });
      }
    }
  }

  /**
   * 创建localStorage驱动
   * @private
   */
  _createLocalStorageDriver() {
    return {
      name: 'localStorage',
      set: (key, value) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          localStorage.setItem(prefixedKey, this._serialize(value));
          this._checkStorageQuota();
          return true;
        } catch (e) {
          this._handleStorageError(e, 'set');
          return false;
        }
      },
      get: (key) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          const value = localStorage.getItem(prefixedKey);
          return this._deserialize(value);
        } catch (e) {
          this._handleStorageError(e, 'get');
          return null;
        }
      },
      remove: (key) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          localStorage.removeItem(prefixedKey);
          return true;
        } catch (e) {
          this._handleStorageError(e, 'remove');
          return false;
        }
      },
      clear: () => {
        try {
          // 只清除带有前缀的项目
          if (this.config.prefix) {
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key && key.startsWith(this.config.prefix)) {
                localStorage.removeItem(key);
              }
            }
          } else {
            localStorage.clear();
          }
          return true;
        } catch (e) {
          this._handleStorageError(e, 'clear');
          return false;
        }
      },
      has: (key) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          return localStorage.getItem(prefixedKey) !== null;
        } catch (e) {
          this._handleStorageError(e, 'has');
          return false;
        }
      },
      getAllKeys: () => {
        try {
          const keys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.config.prefix)) {
              keys.push(this._getActualKey(key));
            }
          }
          return keys;
        } catch (e) {
          this._handleStorageError(e, 'getAllKeys');
          return [];
        }
      },
      length: () => {
        return this.getAllKeys().length;
      }
    };
  }

  /**
   * 创建sessionStorage驱动
   * @private
   */
  _createSessionStorageDriver() {
    return {
      name: 'sessionStorage',
      set: (key, value) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          sessionStorage.setItem(prefixedKey, this._serialize(value));
          return true;
        } catch (e) {
          this._handleStorageError(e, 'set');
          return false;
        }
      },
      get: (key) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          const value = sessionStorage.getItem(prefixedKey);
          return this._deserialize(value);
        } catch (e) {
          this._handleStorageError(e, 'get');
          return null;
        }
      },
      remove: (key) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          sessionStorage.removeItem(prefixedKey);
          return true;
        } catch (e) {
          this._handleStorageError(e, 'remove');
          return false;
        }
      },
      clear: () => {
        try {
          // 只清除带有前缀的项目
          if (this.config.prefix) {
            for (let i = sessionStorage.length - 1; i >= 0; i--) {
              const key = sessionStorage.key(i);
              if (key && key.startsWith(this.config.prefix)) {
                sessionStorage.removeItem(key);
              }
            }
          } else {
            sessionStorage.clear();
          }
          return true;
        } catch (e) {
          this._handleStorageError(e, 'clear');
          return false;
        }
      },
      has: (key) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          return sessionStorage.getItem(prefixedKey) !== null;
        } catch (e) {
          this._handleStorageError(e, 'has');
          return false;
        }
      },
      getAllKeys: () => {
        try {
          const keys = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(this.config.prefix)) {
              keys.push(this._getActualKey(key));
            }
          }
          return keys;
        } catch (e) {
          this._handleStorageError(e, 'getAllKeys');
          return [];
        }
      },
      length: () => {
        return this.getAllKeys().length;
      }
    };
  }

  /**
   * 创建Cookie驱动
   * @private
   */
  _createCookieDriver() {
    return {
      name: 'cookie',
      set: (key, value, options = {}) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          const serializedValue = this._serialize(value);
          
          let cookieString = `${prefixedKey}=${encodeURIComponent(serializedValue)}`;
          
          // 合并默认选项
          const cookieOptions = { ...this.config.cookieOptions, ...options };
          
          if (cookieOptions.path) cookieString += `; path=${cookieOptions.path}`;
          if (cookieOptions.domain) cookieString += `; domain=${cookieOptions.domain}`;
          if (cookieOptions.expires) cookieString += `; expires=${cookieOptions.expires.toUTCString()}`;
          if (cookieOptions.maxAge) cookieString += `; max-age=${cookieOptions.maxAge}`;
          if (cookieOptions.secure) cookieString += '; secure';
          if (cookieOptions.httpOnly) cookieString += '; HttpOnly';
          if (cookieOptions.sameSite) cookieString += `; SameSite=${cookieOptions.sameSite}`;
          
          document.cookie = cookieString;
          return true;
        } catch (e) {
          this._handleStorageError(e, 'set');
          return false;
        }
      },
      get: (key) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          const cookieName = `${prefixedKey}=`;
          const decodedCookie = decodeURIComponent(document.cookie);
          const cookieParts = decodedCookie.split(';');
          
          for (let i = 0; i < cookieParts.length; i++) {
            let part = cookieParts[i].trim();
            if (part.indexOf(cookieName) === 0) {
              const value = part.substring(cookieName.length, part.length);
              return this._deserialize(value);
            }
          }
          
          return null;
        } catch (e) {
          this._handleStorageError(e, 'get');
          return null;
        }
      },
      remove: (key, options = {}) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          const cookieOptions = { 
            ...this.config.cookieOptions, 
            ...options,
            expires: new Date(0) // 设置为过去的时间
          };
          
          this._createCookieDriver().set(prefixedKey, '', cookieOptions);
          return true;
        } catch (e) {
          this._handleStorageError(e, 'remove');
          return false;
        }
      },
      clear: () => {
        try {
          const cookieOptions = {
            ...this.config.cookieOptions,
            expires: new Date(0)
          };
          
          const cookies = document.cookie.split(';');
          for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            const cookieName = cookie.substring(0, cookie.indexOf('=')).trim();
            
            if (cookieName.startsWith(this.config.prefix)) {
              this._createCookieDriver().set(cookieName, '', cookieOptions);
            }
          }
          return true;
        } catch (e) {
          this._handleStorageError(e, 'clear');
          return false;
        }
      },
      has: (key) => {
        return this._createCookieDriver().get(key) !== null;
      },
      getAllKeys: () => {
        try {
          const keys = [];
          const cookies = document.cookie.split(';');
          
          for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie) {
              const cookieName = cookie.substring(0, cookie.indexOf('=')).trim();
              if (cookieName.startsWith(this.config.prefix)) {
                keys.push(this._getActualKey(cookieName));
              }
            }
          }
          
          return keys;
        } catch (e) {
          this._handleStorageError(e, 'getAllKeys');
          return [];
        }
      },
      length: () => {
        return this.getAllKeys().length;
      }
    };
  }

  /**
   * 创建IndexedDB驱动
   * @private
   */
  _createIndexedDBDriver() {
    const DB_NAME = 'StorageDB';
    const STORE_NAME = 'storage';
    const DB_VERSION = 1;
    let db = null;
    
    const openDB = () => {
      return new Promise((resolve, reject) => {
        if (db) {
          resolve(db);
          return;
        }
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          db = request.result;
          resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
          db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
      });
    };
    
    return {
      name: 'indexedDB',
      set: async (key, value) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          const database = await openDB();
          const transaction = database.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          
          store.put(this._serialize(value), prefixedKey);
          await transactionComplete(transaction);
          return true;
        } catch (e) {
          this._handleStorageError(e, 'set');
          return false;
        }
      },
      get: async (key) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          const database = await openDB();
          const transaction = database.transaction(STORE_NAME, 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          
          const value = await requestToPromise(store.get(prefixedKey));
          return this._deserialize(value);
        } catch (e) {
          this._handleStorageError(e, 'get');
          return null;
        }
      },
      remove: async (key) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          const database = await openDB();
          const transaction = database.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          
          store.delete(prefixedKey);
          await transactionComplete(transaction);
          return true;
        } catch (e) {
          this._handleStorageError(e, 'remove');
          return false;
        }
      },
      clear: async () => {
        try {
          const database = await openDB();
          const transaction = database.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          
          if (this.config.prefix) {
            // 只删除带有前缀的键
            const keys = await requestToPromise(store.getAllKeys());
            for (const key of keys) {
              if (key && key.startsWith(this.config.prefix)) {
                store.delete(key);
              }
            }
          } else {
            store.clear();
          }
          
          await transactionComplete(transaction);
          return true;
        } catch (e) {
          this._handleStorageError(e, 'clear');
          return false;
        }
      },
      has: async (key) => {
        try {
          const value = await this._createIndexedDBDriver().get(key);
          return value !== null;
        } catch (e) {
          this._handleStorageError(e, 'has');
          return false;
        }
      },
      getAllKeys: async () => {
        try {
          const database = await openDB();
          const transaction = database.transaction(STORE_NAME, 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          
          const keys = await requestToPromise(store.getAllKeys());
          return keys
            .filter(key => key && key.startsWith(this.config.prefix))
            .map(key => this._getActualKey(key));
        } catch (e) {
          this._handleStorageError(e, 'getAllKeys');
          return [];
        }
      },
      length: async () => {
        const keys = await this._createIndexedDBDriver().getAllKeys();
        return keys.length;
      }
    };
    
    // 辅助函数
    function requestToPromise(request) {
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    
    function transactionComplete(transaction) {
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
  }

  /**
   * 创建内存驱动
   * @private
   */
  _createMemoryDriver() {
    const store = new Map();
    
    return {
      name: 'memory',
      set: (key, value) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          store.set(prefixedKey, this._serialize(value));
          return true;
        } catch (e) {
          this._handleStorageError(e, 'set');
          return false;
        }
      },
      get: (key) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          const value = store.get(prefixedKey);
          return this._deserialize(value);
        } catch (e) {
          this._handleStorageError(e, 'get');
          return null;
        }
      },
      remove: (key) => {
        try {
          const prefixedKey = this._getPrefixedKey(key);
          return store.delete(prefixedKey);
        } catch (e) {
          this._handleStorageError(e, 'remove');
          return false;
        }
      },
      clear: () => {
        try {
          if (this.config.prefix) {
            // 只清除带有前缀的键
            for (const key of store.keys()) {
              if (key && key.startsWith(this.config.prefix)) {
                store.delete(key);
              }
            }
          } else {
            store.clear();
          }
          return true;
        } catch (e) {
          this._handleStorageError(e, 'clear');
          return false;
        }
      },
      has: (key) => {
        const prefixedKey = this._getPrefixedKey(key);
        return store.has(prefixedKey);
      },
      getAllKeys: () => {
        const keys = [];
        for (const key of store.keys()) {
          if (key && key.startsWith(this.config.prefix)) {
            keys.push(this._getActualKey(key));
          }
        }
        return keys;
      },
      length: () => {
        return this.getAllKeys().length;
      }
    };
  }

  // 核心方法
  
  /**
   * 设置存储项
   * @param {string} key - 键名
   * @param {any} value - 值
   * @param {Object} options - 选项（如适用）
   * @returns {boolean} 是否成功
   */
  set(key, value, options = {}) {
    const oldValue = this.get(key);
    const result = this.currentDriver.set(key, value, options);
    
    if (result) {
      this._emit('change', { key, oldValue, newValue: value });
      this._emit(`change:${key}`, { oldValue, newValue: value });
    }
    
    return result;
  }

  /**
   * 获取存储项
   * @param {string} key - 键名
   * @returns {any} 存储的值
   */
  get(key) {
    return this.currentDriver.get(key);
  }

  /**
   * 移除存储项
   * @param {string} key - 键名
   * @param {Object} options - 选项（如适用）
   * @returns {boolean} 是否成功
   */
  remove(key, options = {}) {
    const oldValue = this.get(key);
    const result = this.currentDriver.remove(key, options);
    
    if (result) {
      this._emit('remove', { key, oldValue });
      this._emit(`remove:${key}`, { oldValue });
    }
    
    return result;
  }

  /**
   * 清除所有存储项
   * @returns {boolean} 是否成功
   */
  clear() {
    const keys = this.getAllKeys();
    const result = this.currentDriver.clear();
    
    if (result) {
      this._emit('clear', { keys });
    }
    
    return result;
  }

  /**
   * 检查键是否存在
   * @param {string} key - 键名
   * @returns {boolean} 是否存在
   */
  has(key) {
    return this.currentDriver.has(key);
  }

  /**
   * 获取所有键
   * @returns {Array<string>} 键名数组
   */
  getAllKeys() {
    return this.currentDriver.getAllKeys();
  }

  /**
   * 获取存储项数量
   * @returns {number} 数量
   */
  length() {
    return this.currentDriver.length();
  }

  /**
   * 批量设置
   * @param {Object} items - 键值对对象
   * @param {Object} options - 选项
   * @returns {Array<string>} 设置失败的键名数组
   */
  setMultiple(items, options = {}) {
    const failedKeys = [];
    
    Object.entries(items).forEach(([key, value]) => {
      if (!this.set(key, value, options)) {
        failedKeys.push(key);
      }
    });
    
    return failedKeys;
  }

  /**
   * 批量获取
   * @param {Array<string>} keys - 键名数组
   * @returns {Object} 键值对对象
   */
  getMultiple(keys) {
    const result = {};
    
    keys.forEach(key => {
      result[key] = this.get(key);
    });
    
    return result;
  }

  /**
   * 批量移除
   * @param {Array<string>} keys - 键名数组
   * @param {Object} options - 选项
   * @returns {Array<string>} 移除失败的键名数组
   */
  removeMultiple(keys, options = {}) {
    const failedKeys = [];
    
    keys.forEach(key => {
      if (!this.remove(key, options)) {
        failedKeys.push(key);
      }
    });
    
    return failedKeys;
  }

  /**
   * 获取所有存储项
   * @returns {Object} 所有键值对
   */
  getAll() {
    const keys = this.getAllKeys();
    const result = {};
    
    keys.forEach(key => {
      result[key] = this.get(key);
    });
    
    return result;
  }

  /**
   * 存储带有过期时间的项
   * @param {string} key - 键名
   * @param {any} value - 值
   * @param {number} ttl - 过期时间（毫秒）
   * @returns {boolean} 是否成功
   */
  setWithExpiry(key, value, ttl) {
    const now = Date.now();
    const item = {
      value,
      expiry: now + ttl
    };
    
    return this.set(key, item);
  }

  /**
   * 获取带有过期时间的项
   * @param {string} key - 键名
   * @returns {any|null} 值或null（如果已过期）
   */
  getWithExpiry(key) {
    const item = this.get(key);
    if (!item || !item.expiry) return null;
    
    const now = Date.now();
    if (now > item.expiry) {
      this.remove(key);
      return null;
    }
    
    return item.value;
  }

  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {Function} 移除监听器的函数
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event].push(callback);
    
    // 返回移除函数
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  /**
   * 订阅特定键的变化
   * @param {string} key - 键名
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅的函数
   */
  subscribe(key, callback) {
    return this.on(`change:${key}`, callback);
  }

  /**
   * 导入数据
   * @param {Object} data - 要导入的数据
   * @returns {boolean} 是否成功
   */
  importData(data) {
    try {
      Object.entries(data).forEach(([key, value]) => {
        this.set(key, value);
      });
      return true;
    } catch (e) {
      this._handleStorageError(e, 'importData');
      return false;
    }
  }

  /**
   * 导出数据
   * @returns {Object} 导出的数据
   */
  exportData() {
    return this.getAll();
  }

  // 辅助方法
  
  /**
   * 获取带前缀的键名
   * @private
   */
  _getPrefixedKey(key) {
    return this.config.prefix ? `${this.config.prefix}${key}` : key;
  }

  /**
   * 获取实际键名（移除前缀）
   * @private
   */
  _getActualKey(prefixedKey) {
    return this.config.prefix 
      ? prefixedKey.substring(this.config.prefix.length)
      : prefixedKey;
  }

  /**
   * 序列化数据
   * @private
   */
  _serialize(value) {
    if (this.config.encryption.enabled && this.config.encryption.key) {
      // 这里可以添加加密逻辑
      // return this._encrypt(JSON.stringify(value));
    }
    
    try {
      return JSON.stringify(value);
    } catch (e) {
      console.error('Failed to serialize value:', e);
      return '';
    }
  }

  /**
   * 反序列化数据
   * @private
   */
  _deserialize(value) {
    if (value === null || value === undefined) return null;
    
    try {
      const parsedValue = JSON.parse(value);
      
      if (this.config.encryption.enabled && this.config.encryption.key) {
        // 这里可以添加解密逻辑
        // return this._decrypt(parsedValue);
      }
      
      return parsedValue;
    } catch (e) {
      // 如果不是有效的JSON，返回原始值
      return value;
    }
  }

  /**
   * 处理存储错误
   * @private
   */
  _handleStorageError(error, operation) {
    this._log(`Storage error during ${operation}:`, error);
    this._emit('error', { error, operation });
  }

  /**
   * 日志记录
   * @private
   */
  _log(...args) {
    if (this.config.debug) {
      console.log('[Storage]', ...args);
    }
  }

  /**
   * 获取存储使用统计
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      driver: this.currentDriver.name,
      itemCount: this.length(),
      keys: this.getAllKeys(),
      config: this.getConfig()
    };
  }

  /**
   * 克隆实例
   * @returns {Storage} 新的实例
   */
  clone() {
    const newInstance = new Storage();
    newInstance.setConfig(this.getConfig());
    return newInstance;
  }

  /**
   * 销毁实例
   */
  destroy() {
    this.listeners = {};
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', null);
    }
  }
}

// 导出单例实例
const storage = new Storage();
export default storage;
export { Storage };