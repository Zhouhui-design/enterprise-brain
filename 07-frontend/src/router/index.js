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
import productRouter from './modules/product.js';
import materialRouter from './modules/material.js';
import bomRouter from './modules/bom.js';
import demoRouter from './modules/demo.js';
import shippingRouter from './modules/shipping.js';
import productionPlanningRouter from './modules/production-planning.js';
import inventoryRouter from './modules/inventory.js';
import costCenterRouter from './modules/cost-center.js';
import purchaseManagementRouter from './modules/purchase-management.js';
import bomTreeStructureRouter from './modules/bom-tree-structure.js';

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
    component: Layout,
    redirect: '/dashboard/home',
    meta: { title: '首页' },
    children: [
      {
        path: 'home',
        name: 'Dashboard',
        component: () => import('@/pages/after-sales/Dashboard.vue'),
        meta: { title: '首页' }
      },
      // 部门工作台路由
      {
        path: 'hr',
        name: 'HRDashboard',
        component: () => import('@/pages/dashboard/HRDashboard.vue'),
        meta: { title: '人事部工作台' }
      },
      {
        path: 'ai',
        name: 'AIDashboard',
        component: () => import('@/pages/dashboard/AIDashboard.vue'),
        meta: { title: '智脑工作台' }
      },
      {
        path: 'rd',
        name: 'RDDashboard',
        component: () => import('@/pages/dashboard/RDDashboard.vue'),
        meta: { title: '技术/研发/设计工作台' }
      },
      {
        path: 'kpi',
        name: 'KPIDashboard',
        component: () => import('@/pages/dashboard/KPIDashboard.vue'),
        meta: { title: '绩效管理工作台' }
      },
      {
        path: 'sales',
        name: 'SalesDashboard',
        component: () => import('@/pages/dashboard/SalesDashboard.vue'),
        meta: { title: '销售部工作台' }
      },
      {
        path: 'quality',
        name: 'QualityDashboard',
        component: () => import('@/pages/dashboard/QualityDashboard.vue'),
        meta: { title: '品保部工作台' }
      }
    ]
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
  // 产品管理路由
  productRouter,
  // 物料管理路由
  materialRouter,
  // BOM管理路由
  bomRouter,
  // 发货管理路由
  shippingRouter,
  // 生产计划路由
  productionPlanningRouter,
  // 库存管理路由
  inventoryRouter,
  // 成本中心路由
  costCenterRouter,
  // 采购管理路由
  purchaseManagementRouter,
  // BOM树结构路由
  bomTreeStructureRouter,
  // 演示功能路由
  demoRouter,
  // 研发项目管理路由
  {
    path: '/after-sales',
    component: Layout,
    redirect: '/after-sales/project-management',
    meta: { title: '研发管理' },
    children: [
      {
        path: 'project-management',
        name: 'ProjectManagement',
        component: () => import('@/pages/after-sales/ProjectManagement.vue'),
        meta: { title: '研发项目管理' }
      }
    ]
  },
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
      next({ path: '/dashboard/home' });
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