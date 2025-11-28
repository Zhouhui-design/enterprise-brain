import { createRouter, createWebHistory } from 'vue-router';
import Layout from '@/layout/index.vue';
// 导入模块路由
import humanResourcesRouter from './modules/human-resources.js';
import systemRouter from './modules/system.js';
import systemMenuRouter from './modules/systemMenu.js';
import qualityManagementRouter from './modules/quality-management.js';
import financeRouter from './modules/finance.js';
import salesRouter from './modules/sales.js';
import purchaseRouter from './modules/purchase.js';
import manufacturingRouter from './modules/manufacturing.js';

const routes = [
  {
    path: '/',
    redirect: '/auth/login' // 修改为重定向到登录页面
  },
  {
    path: '/auth/login',
    name: 'Login',
    component: () => import('@/pages/after-sales/auth/Login.vue'),
    hidden: true,
    meta: { title: '登录' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/after-sales/Dashboard.vue'),
    meta: { title: '首页' }
  },
  // 质量管理路由
  qualityManagementRouter,
  // 人力资源路由
  humanResourcesRouter,
  // 系统管理路由
  systemRouter,
  systemMenuRouter,
  // 财务管理路由
  financeRouter,
  // 销售管理路由
  salesRouter,
  // 采购管理路由
  purchaseRouter,
  // 生产管理路由
  manufacturingRouter,
  // 回厂管理相关路由
  {
    path: '/receipt',
    component: Layout,
    redirect: '/receipt/list',
    meta: { title: '回厂管理', icon: 'el-icon-box' },
    children: [
      {
        path: 'list',
        name: 'ReceiptList',
        component: () => import('@/pages/receipt/ReceiptItems.vue'),
        meta: { title: '回厂单列表' }
      },
      {
        path: 'quality-check',
        name: 'QualityCheck',
        component: () => import('@/pages/receipt/components/QualityCheck.vue'),
        meta: { title: '质量检验' }
      },
      {
        path: 'inspection-form',
        name: 'InspectionForm',
        component: () => import('@/pages/receipt/components/InspectionForm.vue'),
        meta: { title: '检验表单' }
      }
    ]
  },
  // 仓库管理相关路由
  {
    path: '/warehouse',
    component: Layout,
    redirect: '/warehouse/in',
    meta: { title: '仓库管理', icon: 'el-icon-warehouse' },
    children: [
      {
        path: 'in',
        name: 'WarehouseIn',
        component: () => import('@/pages/warehouse/WarehouseIn.vue'),
        meta: { title: '入库管理' }
      },
      {
        path: 'out',
        name: 'WarehouseOut',
        component: () => import('@/pages/warehouse/WarehouseOut.vue'),
        meta: { title: '出库管理' }
      },
      {
        path: 'stock-transfer',
        name: 'StockTransfer',
        component: () => import('@/pages/warehouse/StockTransfer.vue'),
        meta: { title: '库存转移' }
      },
      {
        path: 'inventory-count',
        name: 'InventoryCount',
        component: () => import('@/pages/warehouse/InventoryCount.vue'),
        meta: { title: '库存盘点' }
      },
      {
        path: 'location-management',
        name: 'LocationManagement',
        component: () => import('@/pages/warehouse/LocationManagement.vue'),
        meta: { title: '库位管理' }
      }
    ]
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/404.vue'),
    hidden: true,
    meta: { title: '页面不存在' }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// 路由前置守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 企业大脑系统` : '企业大脑系统';
  
  // 获取登录状态
  const isLoggedIn = localStorage.getItem('token') !== null;
  
  // 不需要登录的页面
  if (to.path === '/auth/login') {
    // 如果已经登录，直接跳转到首页
    if (isLoggedIn) {
      next({ path: '/dashboard' });
    } else {
      next();
    }
    return;
  }
  
  // 需要登录的页面
  if (!isLoggedIn) {
    // 未登录，跳转到登录页
    next({ path: '/auth/login', query: { redirect: to.fullPath } });
  } else {
    // 已登录，直接放行
    next();
  }
});

export default router;