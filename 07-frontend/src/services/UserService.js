/**
 * 用户服务
 * 提供用户管理和多用户数据隔离功能
 */
class UserService {
  constructor() {
    this.currentUser = null;
    this.users = [];
    this.userStorageKey = 'enterprise_brain_users';
    this.currentUserKey = 'enterprise_brain_current_user';
  }

  /**
   * 初始化用户服务
   */
  async init() {
    try {
      // 从localStorage加载用户数据
      this.loadUsersFromStorage();
      
      // 尝试恢复当前用户会话
      this.restoreCurrentUser();
    } catch (error) {
      console.error('用户服务初始化失败:', error);
    }
  }

  /**
   * 从localStorage加载用户数据
   */
  loadUsersFromStorage() {
    try {
      const usersStr = localStorage.getItem(this.userStorageKey);
      if (usersStr) {
        this.users = JSON.parse(usersStr);
      } else {
        // 创建默认管理员用户
        this.users = [{
          id: 'admin',
          username: 'admin',
          password: 'admin123', // 实际应用中应该加密存储
          role: 'administrator',
          name: '系统管理员',
          email: 'admin@enterprisebrain.com',
          createdAt: new Date().toISOString()
        }];
        this.saveUsersToStorage();
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
      this.users = [];
    }
  }

  /**
   * 保存用户数据到localStorage
   */
  saveUsersToStorage() {
    try {
      localStorage.setItem(this.userStorageKey, JSON.stringify(this.users));
    } catch (error) {
      console.error('保存用户数据失败:', error);
    }
  }

  /**
   * 恢复当前用户会话
   */
  restoreCurrentUser() {
    try {
      const currentUserStr = localStorage.getItem(this.currentUserKey);
      if (currentUserStr) {
        this.currentUser = JSON.parse(currentUserStr);
      }
    } catch (error) {
      console.error('恢复用户会话失败:', error);
      this.currentUser = null;
    }
  }

  /**
   * 保存当前用户会话
   */
  saveCurrentUserSession() {
    try {
      if (this.currentUser) {
        localStorage.setItem(this.currentUserKey, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(this.currentUserKey);
      }
    } catch (error) {
      console.error('保存用户会话失败:', error);
    }
  }

  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Object} 登录结果
   */
  login(username, password) {
    try {
      // 查找用户
      const user = this.users.find(u => u.username === username);
      
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 验证密码（实际应用中应该使用加密验证）
      if (user.password !== password) {
        throw new Error('密码错误');
      }
      
      // 设置当前用户
      this.currentUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        loginTime: new Date().toISOString()
      };
      
      // 保存会话
      this.saveCurrentUserSession();
      
      return {
        success: true,
        user: this.currentUser,
        message: '登录成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 用户登出
   */
  logout() {
    this.currentUser = null;
    this.saveCurrentUserSession();
  }

  /**
   * 获取当前用户
   * @returns {Object|null} 当前用户信息
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * 检查用户是否已登录
   * @returns {boolean} 是否已登录
   */
  isLoggedIn() {
    return !!this.currentUser;
  }

  /**
   * 检查用户权限
   * @param {string} requiredRole - 所需角色
   * @returns {boolean} 是否有权限
   */
  hasRole(requiredRole) {
    if (!this.currentUser) {
      return false;
    }
    
    // 管理员拥有所有权限
    if (this.currentUser.role === 'administrator') {
      return true;
    }
    
    return this.currentUser.role === requiredRole;
  }

  /**
   * 获取所有用户（仅管理员）
   * @param {string} requesterId - 请求者ID
   * @returns {Array} 用户列表
   */
  getAllUsers(requesterId) {
    const requester = this.users.find(u => u.id === requesterId);
    if (!requester || requester.role !== 'administrator') {
      throw new Error('权限不足');
    }
    
    // 不返回密码字段
    return this.users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * 创建新用户（仅管理员）
   * @param {Object} userData - 用户数据
   * @param {string} requesterId - 请求者ID
   * @returns {Object} 创建结果
   */
  createUser(userData, requesterId) {
    try {
      const requester = this.users.find(u => u.id === requesterId);
      if (!requester || requester.role !== 'administrator') {
        throw new Error('权限不足');
      }
      
      // 检查用户名是否已存在
      if (this.users.some(u => u.username === userData.username)) {
        throw new Error('用户名已存在');
      }
      
      // 创建新用户
      const newUser = {
        id: this.generateUserId(),
        username: userData.username,
        password: userData.password, // 实际应用中应该加密
        role: userData.role,
        name: userData.name,
        email: userData.email,
        createdAt: new Date().toISOString()
      };
      
      this.users.push(newUser);
      this.saveUsersToStorage();
      
      // 不返回密码字段
      const { password, ...userWithoutPassword } = newUser;
      return {
        success: true,
        user: userWithoutPassword,
        message: '用户创建成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 更新用户信息（仅管理员或用户自己）
   * @param {string} userId - 用户ID
   * @param {Object} userData - 用户数据
   * @param {string} requesterId - 请求者ID
   * @returns {Object} 更新结果
   */
  updateUser(userId, userData, requesterId) {
    try {
      // 检查权限
      if (requesterId !== userId && requesterId !== 'admin') {
        throw new Error('权限不足');
      }
      
      // 查找用户
      const userIndex = this.users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        throw new Error('用户不存在');
      }
      
      // 检查用户名是否已被其他用户使用
      if (userData.username && 
          userData.username !== this.users[userIndex].username &&
          this.users.some((u, index) => u.username === userData.username && index !== userIndex)) {
        throw new Error('用户名已存在');
      }
      
      // 更新用户信息
      const updatedUser = {
        ...this.users[userIndex],
        ...userData,
        updatedAt: new Date().toISOString()
      };
      
      // 如果更新的是当前用户，也需要更新会话
      if (this.currentUser && this.currentUser.id === userId) {
        this.currentUser = {
          ...this.currentUser,
          ...userData,
          updatedAt: new Date().toISOString()
        };
        this.saveCurrentUserSession();
      }
      
      this.users[userIndex] = updatedUser;
      this.saveUsersToStorage();
      
      // 不返回密码字段
      const { password, ...userWithoutPassword } = updatedUser;
      return {
        success: true,
        user: userWithoutPassword,
        message: '用户信息更新成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 删除用户（仅管理员）
   * @param {string} userId - 用户ID
   * @param {string} requesterId - 请求者ID
   * @returns {Object} 删除结果
   */
  deleteUser(userId, requesterId) {
    try {
      const requester = this.users.find(u => u.id === requesterId);
      if (!requester || requester.role !== 'administrator') {
        throw new Error('权限不足');
      }
      
      // 不能删除自己
      if (userId === requesterId) {
        throw new Error('不能删除自己的账户');
      }
      
      // 查找用户
      const userIndex = this.users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        throw new Error('用户不存在');
      }
      
      // 删除用户
      this.users.splice(userIndex, 1);
      this.saveUsersToStorage();
      
      return {
        success: true,
        message: '用户删除成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 生成用户ID
   * @returns {string} 用户ID
   */
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 为数据添加用户标识（用于数据隔离）
   * @param {Object} data - 数据对象
   * @returns {Object} 添加用户标识的数据
   */
  addUserDataOwnership(data) {
    if (this.currentUser) {
      return {
        ...data,
        ownerId: this.currentUser.id,
        ownerName: this.currentUser.name
      };
    }
    return data;
  }

  /**
   * 检查数据所有权
   * @param {Object} data - 数据对象
   * @returns {boolean} 是否有访问权限
   */
  checkDataOwnership(data) {
    // 管理员可以访问所有数据
    if (this.currentUser && this.currentUser.role === 'administrator') {
      return true;
    }
    
    // 检查数据所有者
    if (data.ownerId) {
      return this.currentUser && this.currentUser.id === data.ownerId;
    }
    
    // 如果数据没有所有者信息，允许访问（向后兼容）
    return true;
  }

  /**
   * 过滤用户可访问的数据
   * @param {Array} dataList - 数据列表
   * @returns {Array} 过滤后的数据列表
   */
  filterAccessibleData(dataList) {
    // 管理员可以访问所有数据
    if (this.currentUser && this.currentUser.role === 'administrator') {
      return dataList;
    }
    
    // 普通用户只能访问自己的数据
    if (this.currentUser) {
      return dataList.filter(data => 
        !data.ownerId || data.ownerId === this.currentUser.id
      );
    }
    
    // 未登录用户只能访问无所有者的数据
    return dataList.filter(data => !data.ownerId);
  }

  /**
   * 获取用户数据统计
   * @param {string} userId - 用户ID
   * @returns {Object} 数据统计
   */
  async getUserDataStatistics(userId) {
    try {
      // 这里需要与数据库服务集成来获取实际统计数据
      // 暂时返回模拟数据
      return {
        materials: 0,
        productionBoms: 0,
        designBoms: 0,
        salesBoms: 0,
        total: 0
      };
    } catch (error) {
      console.error('获取用户数据统计失败:', error);
      return {
        materials: 0,
        productionBoms: 0,
        designBoms: 0,
        salesBoms: 0,
        total: 0
      };
    }
  }
}

// 创建并导出用户服务实例
const userService = new UserService();
export default userService;