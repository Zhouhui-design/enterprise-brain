import { createRouter, createWebHistory } from "vue-router";
import Login from "@/pages/system/auth/Login.vue";
import Register from "@/pages/system/auth/Register.vue";
import ForgotPassword from "@/pages/system/auth/ForgotPassword.vue";
import Dashboard from "@/pages/system/Dashboard.vue";
import NotFound from "@/pages/404.vue";

const routes = [
  { path: '/', redirect: '/auth/login' }, // 根路径默认跳转
  { path: '/auth/login', component: Login },
  { path: '/auth/register', component: Register },
  { path: '/auth/forgot-password', component: ForgotPassword },
  { path: '/dashboard', component: Dashboard },
  // 审计管理相关路由
  { path: '/system/audit/log-list', component: () => import('@/pages/system/audit-management/AuditLogList.vue') },
  { path: '/system/audit/log-detail', component: () => import('@/pages/system/audit-management/AuditLogDetail.vue') },
  { path: '/system/audit/data-change', component: () => import('@/pages/system/audit-management/DataChangeList.vue') },
  { path: '/system/audit/operation-trace', component: () => import('@/pages/system/audit-management/OperationTrace.vue') },
  { path: '/:pathMatch(.*)*', component: NotFound }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const isLogin = localStorage.getItem('token');
  // 未登录时跳转到登录页
  if (!isLogin && !to.path.startsWith('/auth')) {
    next('/auth/login');
  } else {
    next();
  }
});

export default router;
