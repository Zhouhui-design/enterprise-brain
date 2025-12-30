import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 根目录路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/auth/login'
  },
  
  // 认证路由
  {
    path: '/auth/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { 
      title: '登录',
      icon: 'el-icon-key'
    }
  },
  {
    path: '/auth/register',
    name: 'Register', 
    component: () => import('@/views/auth/Register.vue'),
    meta: { 
      title: '注册',
      icon: 'el-icon-user'
    }
  },
  {
    path: '/auth/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/auth/ForgotPassword.vue'),
    meta: { 
      title: '忘记密码',
      icon: 'el-icon-key'
    }
  },
  
  // 生产管理路由
  {
    path: '/production-bom',
    name: 'ProductionBOM',
    component: () => import('@/views/ProductionBom.vue'),
    meta: { 
      title: '生产BOM',
      icon: 'el-icon-setting'
    }
  },
  {
    path: '/bom/production',
    alias: '/production-bom', // 添加别名，解决路径匹配问题
    name: 'BomProduction',
    component: () => import('@/views/ProductionBom.vue'),
    meta: { 
      title: '生产BOM',
      icon: 'el-icon-setting'
    }
  },
  {
    path: '/list-style-production-bom',
    name: 'ListStyleProductionBOM',
    component: () => import('@/views/ListStyleProductionBom.vue'),
    meta: { 
      title: '列表式生产BOM',
      icon: 'el-icon-document'
    }
  },
  {
    path: '/material/list',
    name: 'MaterialList',
    component: () => import('@/views/MaterialList.vue'),
    meta: { 
      title: '产品物料库',
      icon: 'el-icon-box'
    }
  },
  {
    path: '/warehouse-inventory',
    name: 'WarehouseInventory',
    component: () => import('@/views/WarehouseInventory.vue'),
    meta: { 
      title: '仓库库存',
      icon: 'el-icon-house'
    }
  },
  {
    path: '/defect-report-production',
    name: 'DefectReportProduction',
    component: () => import('@/views/DefectReportProduction.vue'),
    meta: { 
      title: '缺陷报告',
      icon: 'el-icon-warning'
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const isLogin = localStorage.getItem('token')
  
  // 如果路由需要认证但用户未登录，重定向到登录页
  if (to.meta?.requiresAuth && !isLogin) {
    next('/auth/login')
    return
  }
  
  // 设置浏览器标题
  if (to.meta?.title) {
    document.title = `企业大脑系统 - ${to.meta.title}`
  } else {
    document.title = '企业大脑系统'
  }
  
  next()
})

export default router