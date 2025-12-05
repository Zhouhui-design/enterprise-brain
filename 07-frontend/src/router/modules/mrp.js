import Layout from '@/layout/index.vue'

export default {
  path: '/mrp',
  component: Layout,
  redirect: '/mrp/capacity-load',
  meta: { title: 'MRP管理', icon: 'el-icon-s-data' },
  children: [
    {
      path: 'capacity-load',
      name: 'CapacityLoad',
      component: () => import('@/pages/mrp/CapacityLoad.vue'),
      meta: { title: '工序能力负荷表' }
    },
    {
      path: 'plan-approve',
      name: 'MRPPlanApprove',
      component: () => import('@/pages/mrp/MRPPlanApprove.vue'),
      meta: { title: 'MRP计划审核' }
    },
    {
      path: 'material-demand',
      name: 'MaterialDemand',
      component: () => import('@/pages/mrp/MaterialDemand.vue'),
      meta: { title: '物料需求明细' }
    }
  ]
}
