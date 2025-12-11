import Layout from '@/layout/index.vue';

/**
 * 生产计划路由模块
 */
export default {
  path: '/production-planning',
  name: 'ProductionPlanning',
  component: Layout,
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
      path: 'adjustment',
      name: 'PlanAdjustment',
      component: () => import('@/pages/production-planning/PlanAdjustment.vue'),
      meta: { 
        title: '计划调整',
        icon: 'Edit'
      }
    },
    {
      path: 'material-preparation',
      name: 'MaterialPreparationPlan',
      component: () => import('@/pages/production-planning/MaterialPreparationPlan.vue'),
      meta: { 
        title: '备料计划',
        icon: 'Grid'
      }
    },
    {
      path: 'process-plan',
      name: 'ProcessPlanList',
      component: () => import('@/pages/production-planning/ProcessPlanList.vue'),
      meta: { 
        title: '工序计划',
        icon: 'List'
      }
    },

  ]
}
