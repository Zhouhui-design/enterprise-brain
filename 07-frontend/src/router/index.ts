// 正确的路由配置
import { createRouter, createWebHistory } from "vue-router";
import Login from "@/views/auth/Login.vue";
import Dashboard from "@/views/Dashboard.vue";

const routes = [
  { path: '/', redirect: '/auth/login' },
  { path: '/auth/login', component: Login },
  { path: '/dashboard', component: Dashboard },
  { path: '/:pathMatch(.*)*', component: { template: '<div style="padding: 20px;"><h1>404 页面不存在</h1></div>' } }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const isLogin = localStorage.getItem('token');
  if (!isLogin && !to.path.startsWith('/auth')) {
    next('/auth/login');
  } else {
    next();
  }
});

export default router;