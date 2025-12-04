/**
 * 采购管理路由模块
 */
export default {
  path: '/purchase',
  name: 'Purchase',
  meta: { 
    title: '采购管理',
    icon: 'ShoppingCart'
  },
  children: [
    {
      path: 'requisition',
      name: 'PurchaseRequisition',
      component: () => import('@/pages/purchase/PurchaseRequisition.vue'),
      meta: { 
        title: '采购申请',
        icon: 'Document'
      }
    },
    {
      path: 'order-list',
      name: 'PurchaseOrderList',
      component: () => import('@/pages/purchase/PurchaseOrderList.vue'),
      meta: { 
        title: '采购订单',
        icon: 'Tickets'
      }
    },
    {
      path: 'order-create',
      name: 'PurchaseOrderCreate',
      component: () => import('@/pages/purchase/PurchaseOrderCreate.vue'),
      meta: { 
        title: '创建订单',
        icon: 'Plus',
        hidden: true
      }
    },
    {
      path: 'order-approve',
      name: 'PurchaseOrderApprove',
      component: () => import('@/pages/purchase/PurchaseOrderApprove.vue'),
      meta: { 
        title: '订单审批',
        icon: 'Check'
      }
    },
    {
      path: 'tracking',
      name: 'PurchaseTracking',
      component: () => import('@/pages/purchase/PurchaseTracking.vue'),
      meta: { 
        title: '采购跟踪',
        icon: 'View'
      }
    },
    {
      path: 'supplier-evaluation',
      name: 'SupplierEvaluation',
      component: () => import('@/pages/purchase/SupplierEvaluation.vue'),
      meta: { 
        title: '供应商评估',
        icon: 'Star'
      }
    },
    {
      path: 'procurement-plan',
      name: 'ProcurementPlan',
      component: () => import('@/pages/purchase/purchase-order/ProcurementPlan.vue'),
      meta: { 
        title: '采购计划',
        icon: 'Calendar'
      }
    },
    {
      path: 'purchase-statistics',
      name: 'PurchaseStatistics',
      component: () => import('@/pages/purchase/purchase-order/PurchaseStatistics.vue'),
      meta: { 
        title: '采购统计',
        icon: 'DataAnalysis'
      }
    },
    {
      path: 'purchase-tracking-detail',
      name: 'PurchaseTrackingDetail',
      component: () => import('@/pages/purchase/purchase-order/PurchaseTracking.vue'),
      meta: { 
        title: '采购跟踪详情',
        icon: 'View',
        hidden: true
      }
    },
    {
      path: 'supplier-evaluation-detail',
      name: 'SupplierEvaluationDetail',
      component: () => import('@/pages/purchase/purchase-order/SupplierEvaluation.vue'),
      meta: { 
        title: '供应商评估详情',
        icon: 'Star',
        hidden: true
      }
    }
  ]
}
