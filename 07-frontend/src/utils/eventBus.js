import mitt from 'mitt';

/**
 * 事件总线
 * 用于组件间的通信
 */
const eventBus = mitt();

// 同时支持默认导出和命名导出
export default eventBus;
export { eventBus };

// 事件类型枚举
export const Events = {
  // 用户相关事件
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_INFO_UPDATED: 'user:info-updated',
  
  // 侧边栏相关事件
  SIDEBAR_TOGGLE: 'sidebar:toggle',
  SIDEBAR_CLOSE: 'sidebar:close',
  
  // 通知相关事件
  NOTIFICATION_ADD: 'notification:add',
  NOTIFICATION_REMOVE: 'notification:remove',
  NOTIFICATION_CLEAR: 'notification:clear',
  
  // 加载状态相关事件
  LOADING_START: 'loading:start',
  LOADING_END: 'loading:end',
  
  // 面包屑相关事件
  BREADCRUMB_UPDATE: 'breadcrumb:update',
  BREADCRUMB_ADD: 'breadcrumb:add',
  BREADCRUMB_CLEAR: 'breadcrumb:clear',
  
  // 设备相关事件
  DEVICE_CHANGE: 'device:change',
  
  // 主题相关事件
  THEME_CHANGE: 'theme:change',
  
  // 语言相关事件
  LANGUAGE_CHANGE: 'language:change',
  
  // 数据刷新事件
  DATA_REFRESH: 'data:refresh',
  
  // 模态框相关事件
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  
  // 表格相关事件
  TABLE_REFRESH: 'table:refresh',
  TABLE_SELECTION_CHANGE: 'table:selection-change',
  TABLE_ROW_CLICK: 'table:row-click',
  
  // 表单相关事件
  FORM_SUBMIT: 'form:submit',
  FORM_RESET: 'form:reset',
  
  // WebSocket相关事件
  WS_CONNECT: 'ws:connect',
  WS_DISCONNECT: 'ws:disconnect',
  WS_MESSAGE: 'ws:message',
  WS_ERROR: 'ws:error',
  
  // 权限相关事件
  PERMISSION_UPDATE: 'permission:update',
  
  // 业务相关事件
  ORDER_CREATE: 'order:create',
  ORDER_UPDATE: 'order:update',
  ORDER_DELETE: 'order:delete',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  
  // 其他事件
  REFRESH: 'refresh',
  SCROLL_TOP: 'scroll:top'
};
