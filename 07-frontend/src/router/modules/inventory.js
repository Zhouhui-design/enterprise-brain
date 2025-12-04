/**
 * 库存管理路由模块
 */
export default {
  path: '/inventory',
  name: 'Inventory',
  meta: { 
    title: '库存管理',
    icon: 'Box'
  },
  children: [
    {
      path: 'projected-balance',
      name: 'ProjectedBalance',
      component: () => import('@/pages/inventory/ProjectedBalance.vue'),
      meta: { 
        title: '预计结存',
        icon: 'TrendCharts'
      }
    }
  ]
}
