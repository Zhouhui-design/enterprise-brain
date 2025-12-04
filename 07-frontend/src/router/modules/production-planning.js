/**
 * 生产计划路由模块
 */
export default {
  path: '/production-planning',
  name: 'ProductionPlanning',
  meta: { 
    title: '生产计划',
    icon: 'Calendar'
  },
  children: [
    {
      path: 'plan-list',
      name: 'ProductionPlanList',
      component: () => import('@/pages/production-planning/ProductionPlanList.vue'),
      meta: { 
        title: '主生产计划',
        icon: 'Document'
      }
    },
    {
      path: 'plan-create',
      name: 'ProductionPlanCreate',
      component: () => import('@/pages/production-planning/ProductionPlanCreate.vue'),
      meta: { 
        title: '新建计划',
        icon: 'Plus',
        hidden: true
      }
    },
    {
      path: 'plan-detail/:id',
      name: 'PlanDetail',
      component: () => import('@/pages/production-planning/PlanDetail.vue'),
      meta: { 
        title: '计划详情',
        icon: 'View',
        hidden: true
      }
    },
    {
      path: 'plan-adjustment',
      name: 'PlanAdjustment',
      component: () => import('@/pages/production-planning/PlanAdjustment.vue'),
      meta: { 
        title: '计划调整',
        icon: 'Edit'
      }
    },
    {
      path: 'capacity-planning',
      name: 'CapacityPlanning',
      component: () => import('@/pages/production-planning/CapacityPlanning.vue'),
      meta: { 
        title: '产能规划',
        icon: 'DataAnalysis'
      }
    }
  ]
}
