import mitt from 'mitt';

// 创建事件总线实例
export const eventBus = mitt();

// 事件名称常量
export const EVENT_NAMES = {
  // 日志相关事件
  LOG_ADDED: 'log:added',
  LOG_FILTER_CHANGED: 'log:filter-changed',
  
  // 错误相关事件
  ERROR_OCCURRED: 'error:occurred',
  ERROR_HANDLED: 'error:handled',
  
  // 性能相关事件
  PERFORMANCE_MEASURED: 'performance:measured',
  
  // 告警相关事件
  ALERT_TRIGGERED: 'alert:triggered',
  ALERT_CLEARED: 'alert:cleared',
  
  // 系统相关事件
  SYSTEM_READY: 'system:ready',
  USER_LOGGED_IN: 'user:logged-in',
  USER_LOGGED_OUT: 'user:logged-out',
  
  // 数据相关事件
  DATA_UPDATED: 'data:updated',
  DATA_SYNCED: 'data:synced',
  
  // UI相关事件
  THEME_CHANGED: 'theme:changed',
  LANGUAGE_CHANGED: 'language:changed',
  
  // 监控相关事件
  METRICS_COLLECTED: 'metrics:collected',
};

// 导出事件总线实例和事件名称
export default eventBus;
