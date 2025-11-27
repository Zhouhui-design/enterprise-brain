/**
 * 认证管理工具
 * 提供用户认证、授权、会话管理等功能
 */
class Auth {
  constructor() {
    // 配置
    this.config = {
      tokenKey: 'auth_token',
      refreshTokenKey: 'refresh_token',
      userDataKey: 'user_data',
      sessionKey: 'session_info',
      expiryKey: 'token_expiry',
      storageType: 'localStorage', // localStorage, sessionStorage, cookie
      tokenPrefix: 'Bearer ',
      refreshBeforeExpiry: 300000, // 提前5分钟刷新
      cookieOptions: {
        path: '/',
        domain: '',
        secure: true,
        httpOnly: false,
        sameSite: 'lax'
      },
      autoRefresh: true,
      maxTokenLifetime: null // 最大令牌生命周期（毫秒）
    };
    
    // 存储实例
    this.storage = this._createStorage();
    
    // 刷新令牌锁
    this.refreshTokenLock = false;
    // 刷新令牌队列
    this.refreshTokenQueue = [];
    // 登录状态监听器
    this.authStateListeners = new Set();
    
    // 初始化过期检测
    this._initExpiryCheck();
  }

  /**
   * 设置配置
   * @param {Object} config - 配置对象
   * @returns {Auth} 实例自身
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
    // 重新创建存储实例
    this.storage = this._createStorage();
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
   * 创建存储实例
   * @private
   */
  _createStorage() {
    const { storageType, cookieOptions } = this.config;
    
    switch (storageType) {
      case 'sessionStorage':
        return {
          set: (key, value) => sessionStorage.setItem(key, JSON.stringify(value)),
          get: (key) => {
            try {
              const value = sessionStorage.getItem(key);
              return value ? JSON.parse(value) : null;
            } catch (e) {
              return null;
            }
          },
          remove: (key) => sessionStorage.removeItem(key),
          clear: () => sessionStorage.clear(),
          has: (key) => sessionStorage.getItem(key) !== null
        };
      
      case 'cookie':
        return {
          set: (key, value) => this._setCookie(key, JSON.stringify(value), cookieOptions),
          get: (key) => {
            try {
              const value = this._getCookie(key);
              return value ? JSON.parse(value) : null;
            } catch (e) {
              return null;
            }
          },
          remove: (key) => this._removeCookie(key, cookieOptions),
          clear: () => {
            // 清除所有相关的cookie
            this._removeCookie(this.config.tokenKey, cookieOptions);
            this._removeCookie(this.config.refreshTokenKey, cookieOptions);
            this._removeCookie(this.config.userDataKey, cookieOptions);
            this._removeCookie(this.config.sessionKey, cookieOptions);
            this._removeCookie(this.config.expiryKey, cookieOptions);
          },
          has: (key) => this._getCookie(key) !== null
        };
      
      case 'localStorage':
      default:
        return {
          set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
          get: (key) => {
            try {
              const value = localStorage.getItem(key);
              return value ? JSON.parse(value) : null;
            } catch (e) {
              return null;
            }
          },
          remove: (key) => localStorage.removeItem(key),
          clear: () => localStorage.clear(),
          has: (key) => localStorage.getItem(key) !== null
        };
    }
  }

  /**
   * 设置Cookie
   * @private
   */
  _setCookie(name, value, options = {}) {
    let cookieString = `${name}=${encodeURIComponent(value)}`;
    
    if (options.path) cookieString += `; path=${options.path}`;
    if (options.domain) cookieString += `; domain=${options.domain}`;
    if (options.expires) cookieString += `; expires=${options.expires.toUTCString()}`;
    if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
    if (options.secure) cookieString += '; secure';
    if (options.httpOnly) cookieString += '; HttpOnly';
    if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;
    
    document.cookie = cookieString;
  }

  /**
   * 获取Cookie
   * @private
   */
  _getCookie(name) {
    const cookieName = `${name}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieParts = decodedCookie.split(';');
    
    for (let i = 0; i < cookieParts.length; i++) {
      let part = cookieParts[i].trim();
      if (part.indexOf(cookieName) === 0) {
        return part.substring(cookieName.length, part.length);
      }
    }
    
    return null;
  }

  /**
   * 移除Cookie
   * @private
   */
  _removeCookie(name, options = {}) {
    const expiryOptions = { ...options, expires: new Date(0) };
    this._setCookie(name, '', expiryOptions);
  }

  /**
   * 初始化过期检测
   * @private
   */
  _initExpiryCheck() {
    // 每分钟检查一次令牌是否即将过期
    this.expiryCheckInterval = setInterval(() => {
      if (this.config.autoRefresh && this.isAuthenticated()) {
        const expiryTime = this.getTokenExpiry();
        if (expiryTime) {
          const timeUntilExpiry = expiryTime - Date.now();
          if (timeUntilExpiry > 0 && timeUntilExpiry < this.config.refreshBeforeExpiry) {
            this.refreshToken().catch(() => {
              // 刷新失败可以在这里处理
            });
          }
        }
      }
    }, 60000);
  }

  /**
   * 停止过期检测
   */
  stopExpiryCheck() {
    if (this.expiryCheckInterval) {
      clearInterval(this.expiryCheckInterval);
      this.expiryCheckInterval = null;
    }
  }

  /**
   * 登录
   * @param {Object} credentials - 登录凭据
   * @param {Function} loginFn - 登录函数
   * @returns {Promise<Object>} 登录结果
   */
  async login(credentials, loginFn) {
    try {
      // 调用登录函数获取结果
      const result = await loginFn(credentials);
      
      // 存储认证信息
      this.setAuthData(result);
      
      // 触发登录成功事件
      this._notifyAuthStateChange('login', result);
      
      return result;
    } catch (error) {
      // 触发登录失败事件
      this._notifyAuthStateChange('login_failed', error);
      throw error;
    }
  }

  /**
   * 登出
   * @param {boolean} clearServerSession - 是否清除服务器会话
   * @param {Function} logoutFn - 服务器登出函数（可选）
   * @returns {Promise<void>}
   */
  async logout(clearServerSession = false, logoutFn) {
    try {
      // 如果需要清除服务器会话
      if (clearServerSession && logoutFn) {
        await logoutFn();
      }
    } finally {
      // 无论服务器登出是否成功，都清除本地数据
      this.clearAuthData();
      
      // 触发登出事件
      this._notifyAuthStateChange('logout');
    }
  }

  /**
   * 检查是否已认证
   * @returns {boolean} 是否已认证
   */
  isAuthenticated() {
    const token = this.getToken();
    const expiryTime = this.getTokenExpiry();
    
    // 检查令牌是否存在且未过期
    if (!token) return false;
    
    // 如果设置了过期时间，检查是否过期
    if (expiryTime && expiryTime < Date.now()) {
      return false;
    }
    
    // 检查最大令牌生命周期
    if (this.config.maxTokenLifetime) {
      const tokenData = this.decodeToken(token);
      if (tokenData && tokenData.iat) {
        const tokenAge = Date.now() - (tokenData.iat * 1000);
        if (tokenAge > this.config.maxTokenLifetime) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * 设置认证数据
   * @param {Object} authData - 认证数据
   */
  setAuthData(authData) {
    if (!authData) return;
    
    // 存储令牌
    if (authData.token) {
      this.setToken(authData.token);
    }
    
    // 存储刷新令牌
    if (authData.refreshToken) {
      this.setRefreshToken(authData.refreshToken);
    }
    
    // 存储用户数据
    if (authData.user || authData.userData) {
      this.setUserData(authData.user || authData.userData);
    }
    
    // 存储会话信息
    if (authData.session) {
      this.setSessionData(authData.session);
    }
    
    // 计算并存储过期时间
    if (authData.expiresIn || authData.expiryTime) {
      let expiryTime;
      if (authData.expiryTime) {
        expiryTime = typeof authData.expiryTime === 'number' 
          ? authData.expiryTime 
          : new Date(authData.expiryTime).getTime();
      } else {
        expiryTime = Date.now() + (authData.expiresIn * 1000);
      }
      this.setTokenExpiry(expiryTime);
    } else if (authData.token) {
      // 尝试从令牌中解析过期时间
      const tokenData = this.decodeToken(authData.token);
      if (tokenData && tokenData.exp) {
        this.setTokenExpiry(tokenData.exp * 1000);
      }
    }
  }

  /**
   * 清除认证数据
   */
  clearAuthData() {
    this.removeToken();
    this.removeRefreshToken();
    this.removeUserData();
    this.removeSessionData();
    this.removeTokenExpiry();
    
    // 清空刷新令牌队列
    this.refreshTokenQueue = [];
  }

  /**
   * 设置令牌
   * @param {string} token - 认证令牌
   */
  setToken(token) {
    this.storage.set(this.config.tokenKey, token);
  }

  /**
   * 获取令牌
   * @param {boolean} withPrefix - 是否包含前缀
   * @returns {string|null} 令牌
   */
  getToken(withPrefix = false) {
    const token = this.storage.get(this.config.tokenKey);
    return withPrefix && token ? `${this.config.tokenPrefix}${token}` : token;
  }

  /**
   * 移除令牌
   */
  removeToken() {
    this.storage.remove(this.config.tokenKey);
  }

  /**
   * 设置刷新令牌
   * @param {string} refreshToken - 刷新令牌
   */
  setRefreshToken(refreshToken) {
    this.storage.set(this.config.refreshTokenKey, refreshToken);
  }

  /**
   * 获取刷新令牌
   * @returns {string|null} 刷新令牌
   */
  getRefreshToken() {
    return this.storage.get(this.config.refreshTokenKey);
  }

  /**
   * 移除刷新令牌
   */
  removeRefreshToken() {
    this.storage.remove(this.config.refreshTokenKey);
  }

  /**
   * 设置用户数据
   * @param {Object} userData - 用户数据
   */
  setUserData(userData) {
    this.storage.set(this.config.userDataKey, userData);
  }

  /**
   * 获取用户数据
   * @returns {Object|null} 用户数据
   */
  getUserData() {
    return this.storage.get(this.config.userDataKey);
  }

  /**
   * 移除用户数据
   */
  removeUserData() {
    this.storage.remove(this.config.userDataKey);
  }

  /**
   * 更新用户数据
   * @param {Object} userData - 部分用户数据
   */
  updateUserData(userData) {
    const currentData = this.getUserData() || {};
    this.setUserData({ ...currentData, ...userData });
  }

  /**
   * 设置会话数据
   * @param {Object} sessionData - 会话数据
   */
  setSessionData(sessionData) {
    this.storage.set(this.config.sessionKey, sessionData);
  }

  /**
   * 获取会话数据
   * @returns {Object|null} 会话数据
   */
  getSessionData() {
    return this.storage.get(this.config.sessionKey);
  }

  /**
   * 移除会话数据
   */
  removeSessionData() {
    this.storage.remove(this.config.sessionKey);
  }

  /**
   * 设置令牌过期时间
   * @param {number} expiryTime - 过期时间戳
   */
  setTokenExpiry(expiryTime) {
    this.storage.set(this.config.expiryKey, expiryTime);
  }

  /**
   * 获取令牌过期时间
   * @returns {number|null} 过期时间戳
   */
  getTokenExpiry() {
    return this.storage.get(this.config.expiryKey);
  }

  /**
   * 移除令牌过期时间
   */
  removeTokenExpiry() {
    this.storage.remove(this.config.expiryKey);
  }

  /**
   * 获取令牌剩余有效期
   * @returns {number} 剩余毫秒数（负数表示已过期）
   */
  getTokenRemainingTime() {
    const expiryTime = this.getTokenExpiry();
    if (!expiryTime) return -1;
    return expiryTime - Date.now();
  }

  /**
   * 解码JWT令牌
   * @param {string} token - JWT令牌
   * @returns {Object|null} 解码后的数据
   */
  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to decode token:', e);
      return null;
    }
  }

  /**
   * 刷新令牌
   * @param {Function} refreshFn - 刷新令牌的函数
   * @returns {Promise<Object>} 刷新结果
   */
  async refreshToken(refreshFn) {
    // 如果已经有刷新操作在进行中，加入队列等待
    if (this.refreshTokenLock) {
      return new Promise((resolve, reject) => {
        this.refreshTokenQueue.push({ resolve, reject });
      });
    }
    
    try {
      this.refreshTokenLock = true;
      
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      // 调用刷新函数
      const result = await refreshFn(refreshToken);
      
      // 更新认证数据
      this.setAuthData(result);
      
      // 触发令牌刷新事件
      this._notifyAuthStateChange('token_refreshed', result);
      
      // 解析队列中的等待请求
      this.refreshTokenQueue.forEach(({ resolve }) => resolve(result));
      this.refreshTokenQueue = [];
      
      return result;
    } catch (error) {
      // 解析队列中的错误
      this.refreshTokenQueue.forEach(({ reject }) => reject(error));
      this.refreshTokenQueue = [];
      
      // 触发刷新失败事件
      this._notifyAuthStateChange('token_refresh_failed', error);
      
      // 如果刷新失败，可以选择自动登出
      this.clearAuthData();
      
      throw error;
    } finally {
      this.refreshTokenLock = false;
    }
  }

  /**
   * 验证令牌是否有效
   * @param {Function} validateFn - 验证函数
   * @returns {Promise<boolean>} 是否有效
   */
  async validateToken(validateFn) {
    try {
      const token = this.getToken(true);
      if (!token) return false;
      
      const result = await validateFn(token);
      return result.valid !== false;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  /**
   * 获取认证头
   * @returns {Object} 认证头
   */
  getAuthHeader() {
    const token = this.getToken(true);
    return token ? { 'Authorization': token } : {};
  }

  /**
   * 检查用户是否有特定权限
   * @param {string|Array<string>} permissions - 权限列表
   * @returns {boolean} 是否有权限
   */
  hasPermission(permissions) {
    const userData = this.getUserData();
    if (!userData || !userData.permissions) return false;
    
    const userPermissions = userData.permissions;
    
    if (Array.isArray(permissions)) {
      return permissions.some(permission => userPermissions.includes(permission));
    }
    
    return userPermissions.includes(permissions);
  }

  /**
   * 检查用户是否有特定角色
   * @param {string|Array<string>} roles - 角色列表
   * @returns {boolean} 是否有角色
   */
  hasRole(roles) {
    const userData = this.getUserData();
    if (!userData || !userData.roles) return false;
    
    const userRoles = userData.roles;
    
    if (Array.isArray(roles)) {
      return roles.some(role => userRoles.includes(role));
    }
    
    return userRoles.includes(roles);
  }

  /**
   * 检查用户是否是管理员
   * @returns {boolean} 是否是管理员
   */
  isAdmin() {
    return this.hasRole('admin') || this.hasPermission('admin:*');
  }

  /**
   * 添加认证状态监听器
   * @param {Function} listener - 监听器函数
   * @returns {Function} 移除监听器的函数
   */
  addAuthStateListener(listener) {
    this.authStateListeners.add(listener);
    
    // 返回移除函数
    return () => {
      this.authStateListeners.delete(listener);
    };
  }

  /**
   * 通知认证状态变化
   * @private
   */
  _notifyAuthStateChange(event, data = null) {
    this.authStateListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Auth state listener error:', error);
      }
    });
  }

  /**
   * 获取认证状态
   * @returns {Object} 认证状态
   */
  getAuthState() {
    return {
      isAuthenticated: this.isAuthenticated(),
      userData: this.getUserData(),
      sessionData: this.getSessionData(),
      token: this.getToken(),
      tokenExpiry: this.getTokenExpiry(),
      tokenRemainingTime: this.getTokenRemainingTime(),
      hasRefreshToken: !!this.getRefreshToken()
    };
  }

  /**
   * 检查会话是否过期
   * @returns {boolean} 是否已过期
   */
  isSessionExpired() {
    const sessionData = this.getSessionData();
    if (!sessionData || !sessionData.expiresAt) return false;
    
    const expiryTime = typeof sessionData.expiresAt === 'number' 
      ? sessionData.expiresAt 
      : new Date(sessionData.expiresAt).getTime();
    
    return expiryTime < Date.now();
  }

  /**
   * 延长会话时间
   * @param {number} duration - 延长的时间（秒）
   */
  extendSession(duration) {
    const sessionData = this.getSessionData() || {};
    const newExpiry = Date.now() + (duration * 1000);
    this.setSessionData({ ...sessionData, expiresAt: newExpiry });
  }

  /**
   * 生成临时令牌
   * @param {Object} data - 令牌数据
   * @param {number} expiry - 过期时间（毫秒）
   * @returns {string} 临时令牌
   */
  generateTempToken(data, expiry = 3600000) {
    const tokenData = {
      ...data,
      iat: Date.now() / 1000,
      exp: (Date.now() + expiry) / 1000
    };
    
    // 简单的Base64编码（非标准JWT）
    const encodedData = btoa(JSON.stringify(tokenData));
    return `temp_${encodedData}`;
  }

  /**
   * 验证临时令牌
   * @param {string} token - 临时令牌
   * @returns {Object|null} 令牌数据或null
   */
  validateTempToken(token) {
    try {
      if (!token || !token.startsWith('temp_')) return null;
      
      const encodedData = token.replace('temp_', '');
      const decodedData = JSON.parse(atob(encodedData));
      
      // 检查过期时间
      if (decodedData.exp && decodedData.exp < Date.now() / 1000) {
        return null;
      }
      
      return decodedData;
    } catch (e) {
      console.error('Failed to validate temp token:', e);
      return null;
    }
  }

  /**
   * 清除所有认证相关数据
   */
  destroy() {
    this.stopExpiryCheck();
    this.clearAuthData();
    this.authStateListeners.clear();
  }

  /**
   * 创建API请求拦截器
   * @returns {Function} 请求拦截器
   */
  createRequestInterceptor() {
    return (config) => {
      const token = this.getToken(true);
      if (token) {
        config.headers = { ...config.headers, ...this.getAuthHeader() };
      }
      return config;
    };
  }

  /**
   * 创建API响应拦截器
   * @param {Function} refreshFn - 刷新令牌函数
   * @returns {Function} 响应拦截器
   */
  createResponseInterceptor(refreshFn) {
    return async (response) => {
      // 处理401错误
      if (response.status === 401) {
        try {
          // 尝试刷新令牌
          await this.refreshToken(refreshFn);
          
          // 刷新成功后，可以选择重试请求
          // 这里可以返回一个需要重试的标记
          return { ...response, _needRetry: true };
        } catch (error) {
          // 刷新失败，触发登出
          this.logout();
          throw new Error('Authentication required');
        }
      }
      
      return response;
    };
  }

  /**
   * 导出认证数据（用于调试）
   * @returns {Object} 认证数据
   */
  exportAuthData() {
    return {
      token: this.getToken(),
      refreshToken: this.getRefreshToken(),
      userData: this.getUserData(),
      sessionData: this.getSessionData(),
      tokenExpiry: this.getTokenExpiry()
    };
  }

  /**
   * 导入认证数据（用于调试）
   * @param {Object} authData - 认证数据
   */
  importAuthData(authData) {
    if (authData.token) this.setToken(authData.token);
    if (authData.refreshToken) this.setRefreshToken(authData.refreshToken);
    if (authData.userData) this.setUserData(authData.userData);
    if (authData.sessionData) this.setSessionData(authData.sessionData);
    if (authData.tokenExpiry) this.setTokenExpiry(authData.tokenExpiry);
  }
}

// 导出单例实例
const auth = new Auth();
export default auth;
export { Auth };