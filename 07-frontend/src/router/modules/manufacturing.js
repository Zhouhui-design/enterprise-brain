// 生产管理路由模块
const manufacturingRouter = {
  path: '/manufacturing',
  component: () => import('@/layout/index.vue'),
  redirect: '/manufacturing/production-order/list',
  meta: {
    title: '生产管理',
    icon: 'el-icon-s-operation'
  },
  children: [
    // 工序管理
    {
      path: 'process',
      name: 'ProcessList',
      component: () => import('@/pages/manufacturing/ProcessList.vue'),
      meta: { title: '工序列表' }
    },
    // ✅ 工序间隔设置
    {
      path: 'process-interval-settings',
      name: 'ProcessIntervalSettings',
      component: () => import('@/pages/production-planning/ProcessIntervalSettings.vue'),
      meta: { title: '工序间隔设置' }
    },
    // 生产BOM
    {
      path: 'production-bom',
      name: 'ManufacturingProductionBom',
      component: () => import('@/pages/bom/ProductionBom.vue'),
      meta: { title: '生产BOM' }
    },
    // 列表式生产BOM
    {
      path: 'list-style-production-bom',
      name: 'ManufacturingListStyleProductionBom',
      component: () => import('@/pages/bom/ListStyleProductionBom.vue'),
      meta: { title: '列表式生产BOM' }
    },
    // 生产订单管理
    {
      path: 'production-order',
      component: () => import('@/layout/index.vue'),
      redirect: '/manufacturing/production-order/list',
      meta: { title: '生产订单管理' },
      children: [
        {
          path: 'list',
          name: 'ProductionOrderList',
          component: () => import('@/pages/manufacturing/production-order/ProductionOrderList.vue'),
          meta: { title: '生产订单列表' }
        },
        {
          path: 'create',
          name: 'ProductionOrderCreate',
          component: () => import('@/pages/manufacturing/production-order/ProductionOrderCreate.vue'),
          meta: { title: '创建生产订单' }
        },
        {
          path: 'edit/:id',
          name: 'ProductionOrderEdit',
          component: () => import('@/pages/manufacturing/production-order/ProductionOrderCreate.vue'),
          meta: { title: '编辑生产订单' },
          hidden: true
        },
        {
          path: 'schedule',
          name: 'ProductionOrderSchedule',
          component: () => import('@/pages/manufacturing/production-order/ProductionOrderSchedule.vue'),
          meta: { title: '生产排程' }
        },
        {
          path: 'progress',
          name: 'ProductionProgress',
          component: () => import('@/pages/manufacturing/production-order/ProductionProgress.vue'),
          meta: { title: '生产进度' }
        },
        {
          path: 'planning',
          name: 'ProductionPlanning',
          component: () => import('@/pages/manufacturing/production-order/ProductionPlanning.vue'),
          meta: { title: '生产计划' }
        },
        {
          path: 'material-requirement',
          name: 'MaterialRequirement',
          component: () => import('@/pages/manufacturing/production-order/MaterialRequirement.vue'),
          meta: { title: '物料需求' }
        },
        {
          path: 'report',
          name: 'ProductionReport',
          component: () => import('@/pages/manufacturing/production-order/ProductionReport.vue'),
          meta: { title: '生产报表' }
        }
      ]
    }
  ]
};

export default manufacturingRouter;