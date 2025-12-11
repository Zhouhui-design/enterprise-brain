import Layout from '@/layout/index.vue'

export default {
  path: '/process-planning',
  component: Layout,
  redirect: '/process-planning/operation-sequence',
  meta: { title: '工序计划', icon: 'el-icon-s-order' },
  children: [
    {
      path: 'operation-sequence',
      name: 'OperationSequence',
      component: () => import('@/pages/process-planning/OperationSequence.vue'),
      meta: { title: '工序顺序管理' }
    },
    {
      path: 'process-plan-create',
      name: 'ProcessPlanCreate',
      component: () => import('@/pages/process-planning/ProcessPlanCreate.vue'),
      meta: { title: '工序计划创建' }
    },
    {
      path: 'process-route',
      name: 'ProcessRoute',
      component: () => import('@/pages/process-planning/ProcessRoute.vue'),
      meta: { title: '工序路线管理' }
    },
    {
      path: 'work-instruction',
      name: 'WorkInstruction',
      component: () => import('@/pages/process-planning/WorkInstruction.vue'),
      meta: { title: '工作指导书管理' }
    },
    {
      path: 'real-process-plan',
      name: 'RealProcessPlanList',
      component: () => import('@/pages/production-planning/RealProcessPlanList.vue'),
      meta: { title: '真工序计划' }
    }
  ]
}
