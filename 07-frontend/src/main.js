import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // 引入路由
import ElementPlus from 'element-plus'; // 引入 Element Plus
import 'element-plus/dist/index.css'; // 引入 Element Plus 样式
import * as ElementPlusIconsVue from '@element-plus/icons-vue'; // 引入 Element Plus 图标
import { createPinia } from 'pinia'; // 引入 Pinia 状态管理

// 创建 Pinia 实例
const pinia = createPinia();

// 创建 App 实例
const app = createApp(App);

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 挂载路由、Pinia、Element Plus
app.use(router);
app.use(pinia);
app.use(ElementPlus);

// 挂载 App
app.mount('#app');
