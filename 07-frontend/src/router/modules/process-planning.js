import Layout from '@/layout/index.vue'

export default {
  path: '/process-planning',
  component: Layout,
  redirect: '/process-planning/real-process-plan',  // 修改默认重定向到真工序计划
  meta: {
    title: '工序计划',
    icon: 'el-icon-s-order',
    hidden: false  // 改为false，让父路由可见
  },
  children: [
    {
      path: 'real-process-plan',
      name: 'RealProcessPlanList',
      component: () => import('@/pages/production-planning/RealProcessPlanList.vue'),
      meta: {
        title: '真工序计划',
        icon: 'el-icon-s-claim'
      }
    }  // 只保留真工序计划路由
  ]
}