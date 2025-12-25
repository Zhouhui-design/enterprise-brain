/**
 * 依赖注入容器
 * 用于管理模块间的依赖关系，降低模块间的耦合度
 */
class Container {
  constructor() {
    this.services = new Map();
    this.instances = new Map();
  }

  /**
   * 注册服务
   * @param {string} name - 服务名称
   * @param {Function|Object} service - 服务工厂函数或实例
   * @param {Object} options - 注册选项
   * @param {boolean} options.singleton - 是否单例模式，默认为true
   * @param {Array} options.dependencies - 依赖的服务名称数组
   */
  register(name, service, options = {}) {
    const { singleton = true, dependencies = [] } = options;
    
    this.services.set(name, {
      service,
      singleton,
      dependencies
    });
  }

  /**
   * 获取服务实例
   * @param {string} name - 服务名称
   * @returns {Object} - 服务实例
   */
  get(name) {
    if (!this.services.has(name)) {
      throw new Error(`Service '${name}' not found`);
    }

    // 如果是单例且已存在实例，直接返回
    if (this.services.get(name).singleton && this.instances.has(name)) {
      return this.instances.get(name);
    }

    const { service, dependencies } = this.services.get(name);
    
    // 解析依赖
    const resolvedDependencies = dependencies.map(depName => this.get(depName));
    
    // 创建实例
    let instance;
    if (typeof service === 'function') {
      // 构造函数或工厂函数
      instance = new service(...resolvedDependencies);
    } else {
      // 直接实例
      instance = service;
    }
    
    // 如果是单例，缓存实例
    if (this.services.get(name).singleton) {
      this.instances.set(name, instance);
    }
    
    return instance;
  }

  /**
   * 检查服务是否已注册
   * @param {string} name - 服务名称
   * @returns {boolean} - 是否已注册
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * 移除服务
   * @param {string} name - 服务名称
   */
  remove(name) {
    this.services.delete(name);
    this.instances.delete(name);
  }

  /**
   * 清除所有服务
   */
  clear() {
    this.services.clear();
    this.instances.clear();
  }

  /**
   * 获取所有已注册服务名称
   * @returns {Array} - 服务名称数组
   */
  getServiceNames() {
    return Array.from(this.services.keys());
  }
}

// 创建并导出单例容器
const container = new Container();
module.exports = container;
