import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // 引入路由
import ElementPlus from 'element-plus'; // 引入 Element Plus
import 'element-plus/dist/index.css'; // 引入 Element Plus 样式
import * as ElementPlusIconsVue from '@element-plus/icons-vue'; // 引入 Element Plus 图标
import { createPinia } from 'pinia'; // 引入 Pinia 状态管理

// 引入事件总线
import eventBus from './utils/eventBus';

// 引入 WebSocket 服务
import wsService from './utils/ws';

// 引入日志管理系统
import logger from './utils/logger';
import { getPerformanceMonitor } from './utils/performanceMonitor';

// 创建 Pinia 实例
const pinia = createPinia();

// 创建 App 实例
const app = createApp(App);

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 提供全局服务
app.provide('eventBus', eventBus);
app.provide('wsService', wsService);
app.provide('logger', logger);

// 初始化性能监控
const performanceMonitor = getPerformanceMonitor();
app.provide('performanceMonitor', performanceMonitor);

// 挂载路由、Pinia、Element Plus
app.use(router);
app.use(pinia);
app.use(ElementPlus);

// 记录应用启动日志
logger.info('应用启动', {
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  environment: import.meta.env.MODE
});

// 初始化 WebSocket 连接
// 根据环境变量或配置文件获取 WebSocket URL
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
wsService.init(wsUrl);

// 挂载 App
app.mount('#app');

// 应用卸载时断开 WebSocket 连接
window.addEventListener('beforeunload', () => {
  wsService.disconnect();
});
