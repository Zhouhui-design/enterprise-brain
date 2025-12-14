// 正确的路由配置
import { createRouter, createWebHistory } from "vue-router";
import Login from "@/views/auth/Login.vue";
import Dashboard from "@/views/Dashboard.vue";

// 导入业务路由模块
import productionPlanning from "./modules/production-planning";
import processPlanning from "./modules/process-planning";
import bom from "./modules/bom";
import inventory from "./modules/inventory";
import material from "./modules/material";
import mrp from "./modules/mrp";
import product from "./modules/product";
import productionResources from "./modules/production-resources";
import purchase from "./modules/purchase";
import purchaseManagement from "./modules/purchase-management";
import shipping from "./modules/shipping";
import sales from "./modules/sales";
import warehouse from "./modules/warehouse";
import finance from "./modules/finance";
import humanResources from "./modules/human-resources";
import manufacturing from "./modules/manufacturing";
import qualityManagement from "./modules/quality-management";
import system from "./modules/system";

const routes = [
  { path: '/', redirect: '/auth/login' },
  { path: '/auth/login', component: Login },
  { path: '/dashboard', component: Dashboard },
  { path: '/:pathMatch(.*)*', component: { template: '<div style="padding: 20px;"><h1>404 页面不存在</h1></div>' } },
  // 注册业务路由模块
  productionPlanning,
  processPlanning,
  bom,
  inventory,
  material,
  mrp,
  product,
  productionResources,
  purchase,
  purchaseManagement,
  shipping,
  sales,
  warehouse,
  finance,
  humanResources,
  manufacturing,
  qualityManagement,
  system
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