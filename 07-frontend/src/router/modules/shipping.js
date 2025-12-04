/**
 * 发货管理路由模块
 */
export default {
  path: '/shipping',
  name: 'Shipping',
  meta: { 
    title: '发货管理',
    icon: 'Van'
  },
  children: [
    {
      path: 'plan',
      name: 'ShippingPlan',
      component: () => import('@/pages/shipping/ShippingPlan.vue'),
      meta: { 
        title: '发货计划',
        icon: 'Calendar'
      }
    },
    {
      path: 'application',
      name: 'ShippingApplication',
      component: () => import('@/pages/shipping/ShippingApplication.vue'),
      meta: { 
        title: '发货申请',
        icon: 'Document'
      }
    },
    {
      path: 'execution',
      name: 'ShippingExecution',
      component: () => import('@/pages/shipping/ShippingExecution.vue'),
      meta: { 
        title: '发货执行',
        icon: 'Box'
      }
    },
    {
      path: 'delivery-note',
      name: 'DeliveryNote',
      component: () => import('@/pages/shipping/DeliveryNote.vue'),
      meta: { 
        title: '发货单',
        icon: 'Tickets'
      }
    },
    {
      path: 'logistics',
      name: 'LogisticsTracking',
      component: () => import('@/pages/shipping/LogisticsTracking.vue'),
      meta: { 
        title: '物流跟踪',
        icon: 'Location'
      }
    }
  ]
}
