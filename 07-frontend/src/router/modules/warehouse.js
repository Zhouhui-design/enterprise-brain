/**
 * 仓库管理路由模块
 */
import Layout from '@/layout/index.vue'

export default {
  path: '/warehouse',
  component: Layout,
  redirect: '/warehouse/manage',
  name: 'Warehouse',
  meta: { 
    title: '仓库管理',
    icon: 'House'
  },
  children: [
    {
      path: 'manage',
      name: 'WarehouseManage',
      component: () => import('@/pages/warehouse/WarehouseManage.vue'),
      meta: { 
        title: '仓库管理',
        icon: 'House'
      }
    },
    {
      path: 'stock-transfer',
      name: 'StockTransferWarehouse',
      component: () => import('@/pages/inventory/inventory-management/StockTransfer.vue'),
      meta: { 
        title: '库存转移',
        icon: 'SwitchButton'
      }
    }
  ]
}
