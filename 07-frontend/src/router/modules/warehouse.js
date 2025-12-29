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
      path: 'inventory',
      name: 'InventoryManagement',
      component: () => import('@/pages/inventory/inventory-management/InventoryList.vue'),
      meta: { 
        title: '库存管理',
        permission: ['warehouse:inventory']
      }
    },
    {
      path: 'inventory-count',
      name: 'InventoryCount',
      component: () => import('@/pages/warehouse/InventoryCount.vue'),
      meta: { 
        title: '库存盘点',
        permission: ['warehouse:inventory-count']
      }
    },
    {
      path: 'inventory-flow',
      name: 'InventoryFlow',
      component: () => import('@/pages/warehouse/InventoryFlow.vue'),
      meta: { 
        title: '出入库流水账',
        icon: 'List'
      }
    },
    {
      path: 'in',
      name: 'WarehouseInShort',
      component: () => import('@/pages/warehouse/WarehouseIn.vue'),
      meta: { 
        title: '入库',
        permission: ['warehouse:in']
      }
    },
    {
      path: 'warehouse-in',
      name: 'WarehouseIn',
      component: () => import('@/pages/warehouse/WarehouseIn.vue'),
      meta: { 
        title: '入库管理',
        permission: ['warehouse:in']
      }
    },
    {
      path: 'warehouse-out',
      name: 'WarehouseOut',
      component: () => import('@/pages/warehouse/WarehouseOut.vue'),
      meta: { 
        title: '出库管理',
        permission: ['warehouse:out']
      }
    },
    {
      path: 'out',
      name: 'WarehouseOutShort',
      component: () => import('@/pages/warehouse/WarehouseOut.vue'),
      meta: { 
        title: '出库',
        permission: ['warehouse:out']
      }
    },
    {
      path: 'location-management',
      name: 'LocationManagement',
      component: () => import('@/pages/warehouse/LocationManagement.vue'),
      meta: { 
        title: '库位管理',
        permission: ['warehouse:location']
      }
    },
    {
      path: 'stock-transfer',
      name: 'StockTransfer',
      component: () => import('@/pages/warehouse/StockTransfer.vue'),
      meta: { 
        title: '库存转移',
        permission: ['warehouse:transfer']
      }
    }
  ]
}