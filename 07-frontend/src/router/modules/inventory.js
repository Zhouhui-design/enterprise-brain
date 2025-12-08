/**
 * 库存管理路由模块
 */
import Layout from '@/layout/index.vue'

export default {
  path: '/inventory',
  component: Layout,
  redirect: '/inventory/list',
  name: 'Inventory',
  meta: { 
    title: '库存管理',
    icon: 'Box'
  },
  children: [
    {
      path: 'list',
      name: 'InventoryList',
      component: () => import('@/pages/inventory/inventory-management/InventoryList.vue'),
      meta: { 
        title: '库存列表',
        icon: 'Document'
      }
    },
    {
      path: 'detail',
      name: 'InventoryDetail',
      component: () => import('@/pages/inventory/inventory-management/InventoryDetail.vue'),
      meta: { 
        title: '库存明细',
        icon: 'Tickets'
      }
    },
    {
      path: 'report',
      name: 'InventoryReport',
      component: () => import('@/pages/inventory/inventory-management/InventoryReport.vue'),
      meta: { 
        title: '库存报表',
        icon: 'DataAnalysis'
      }
    },
    {
      path: 'stock-movement',
      name: 'StockMovement',
      component: () => import('@/pages/inventory/inventory-management/StockMovement.vue'),
      meta: { 
        title: '库存移动',
        icon: 'Sort'
      }
    },
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
