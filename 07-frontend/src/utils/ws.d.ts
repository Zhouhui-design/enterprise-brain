// WebSocket服务类型定义

// WebSocket连接状态
export type WsReadyState = 0 | 1 | 2 | 3;

// WebSocket消息类型
export interface WsMessage {
  type: string;
  data?: any;
  timestamp?: number;
  clientId?: string;
}

// WebSocket配置选项
export interface WsConfig {
  url: string;
  reconnectAttempts?: number;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatTimeout?: number;
}

// WebSocket服务接口
export interface WsService {
  /**
   * 初始化WebSocket连接
   * @param url WebSocket服务器URL
   */
  init(url: string): void;
  
  /**
   * 建立WebSocket连接
   */
  connect(): void;
  
  /**
   * 发送消息
   * @param message 消息对象
   * @returns 是否发送成功
   */
  send(message: WsMessage): boolean;
  
  /**
   * 断开WebSocket连接
   */
  disconnect(): void;
  
  /**
   * 注册消息处理器
   * @param type 消息类型
   * @param handler 消息处理函数
   */
  registerMessageHandler(type: string, handler: (message: WsMessage) => void): void;
  
  /**
   * 移除消息处理器
   * @param type 消息类型
   */
  removeMessageHandler(type: string): void;
  
  /**
   * 清空所有消息处理器
   */
  clearMessageHandlers(): void;
  
  /**
   * 获取WebSocket连接状态
   * @returns 连接状态
   */
  getReadyState(): WsReadyState;
  
  /**
   * 检查WebSocket是否已连接
   * @returns 是否已连接
   */
  isConnected(): boolean;
}

// WebSocket服务实例
declare const wsService: WsService;
export default wsService;
