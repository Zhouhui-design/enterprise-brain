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
    }
  ]
}
