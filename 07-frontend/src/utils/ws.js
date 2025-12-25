import eventBus, { Events } from './eventBus';

/**
 * WebSocket服务类
 * 用于管理WebSocket连接、发送和接收消息
 */
class WebSocketService {
  constructor() {
    this.socket = null;
    this.url = '';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.isManualDisconnect = false;
    this.heartbeatInterval = null;
    this.heartbeatTimeout = 30000;
    this.messageHandlers = new Map();
  }

  /**
   * 初始化WebSocket连接
   * @param {string} url - WebSocket服务器URL
   */
  init(url) {
    this.url = url;
    this.connect();
  }

  /**
   * 建立WebSocket连接
   */
  connect() {
    try {
      this.socket = new WebSocket(this.url);
      
      // 设置事件监听器
      this.socket.onopen = this.onOpen.bind(this);
      this.socket.onmessage = this.onMessage.bind(this);
      this.socket.onerror = this.onError.bind(this);
      this.socket.onclose = this.onClose.bind(this);
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      this.handleReconnect();
    }
  }

  /**
   * WebSocket连接成功回调
   */
  onOpen() {
    console.log('WebSocket连接已建立');
    this.reconnectAttempts = 0;
    this.isManualDisconnect = false;
    
    // 发送连接事件
    eventBus.emit(Events.WS_CONNECT);
    
    // 启动心跳检测
    this.startHeartbeat();
    
    // 发送连接成功消息
    this.send({
      type: 'connect',
      data: {
        timestamp: Date.now(),
        clientId: this.generateClientId()
      }
    });
  }

  /**
   * WebSocket接收消息回调
   * @param {MessageEvent} event - 消息事件
   */
  onMessage(event) {
    try {
      const message = JSON.parse(event.data);
      console.log('WebSocket接收消息:', message);
      
      // 发送消息事件
      eventBus.emit(Events.WS_MESSAGE, message);
      
      // 调用对应类型的消息处理器
      if (message.type && this.messageHandlers.has(message.type)) {
        this.messageHandlers.get(message.type)(message);
      }
      
      // 处理心跳响应
      if (message.type === 'pong') {
        this.handlePong();
      }
    } catch (error) {
      console.error('WebSocket消息解析失败:', error);
    }
  }

  /**
   * WebSocket错误回调
   * @param {Event} error - 错误事件
   */
  onError(error) {
    console.error('WebSocket错误:', error);
    
    // 发送错误事件
    eventBus.emit(Events.WS_ERROR, error);
  }

  /**
   * WebSocket关闭回调
   * @param {CloseEvent} event - 关闭事件
   */
  onClose(event) {
    console.log('WebSocket连接已关闭:', event.code, event.reason);
    
    // 发送断开连接事件
    eventBus.emit(Events.WS_DISCONNECT, { code: event.code, reason: event.reason });
    
    // 停止心跳检测
    this.stopHeartbeat();
    
    // 处理重连
    if (!this.isManualDisconnect) {
      this.handleReconnect();
    }
  }

  /**
   * 发送消息
   * @param {Object} message - 消息对象
   */
  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return true;
    }
    console.error('WebSocket未连接，无法发送消息');
    return false;
  }

  /**
   * 断开WebSocket连接
   */
  disconnect() {
    this.isManualDisconnect = true;
    if (this.socket) {
      this.socket.close();
    }
    this.stopHeartbeat();
  }

  /**
   * 处理重连逻辑
   */
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`WebSocket尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('WebSocket重连失败，已达到最大重连次数');
    }
  }

  /**
   * 启动心跳检测
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', data: { timestamp: Date.now() } });
        
        // 设置心跳超时检测
        setTimeout(() => {
          if (this.socket) {
            console.error('WebSocket心跳超时，断开连接');
            this.socket.close();
          }
        }, this.heartbeatTimeout);
      }
    }, this.heartbeatTimeout / 2);
  }

  /**
   * 处理心跳响应
   */
  handlePong() {
    // 心跳响应正常，无需处理
  }

  /**
   * 停止心跳检测
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 注册消息处理器
   * @param {string} type - 消息类型
   * @param {Function} handler - 消息处理函数
   */
  registerMessageHandler(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  /**
   * 移除消息处理器
   * @param {string} type - 消息类型
   */
  removeMessageHandler(type) {
    this.messageHandlers.delete(type);
  }

  /**
   * 清空所有消息处理器
   */
  clearMessageHandlers() {
    this.messageHandlers.clear();
  }

  /**
   * 生成客户端ID
   * @returns {string} - 客户端ID
   */
  generateClientId() {
    return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 获取WebSocket连接状态
   * @returns {number} - 连接状态
   */
  getReadyState() {
    return this.socket ? this.socket.readyState : WebSocket.CLOSED;
  }

  /**
   * 检查WebSocket是否已连接
   * @returns {boolean} - 是否已连接
   */
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

// 创建单例实例
const wsService = new WebSocketService();

export default wsService;
