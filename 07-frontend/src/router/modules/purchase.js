import Layout from '@/layout/index.vue';

export default {
  path: '/purchase',
  component: Layout,
  redirect: '/purchase/dashboard',
  name: 'Purchase',
  meta: { 
    title: '采购管理', 
    icon: 'ShoppingBag',
    permission: ['purchase:view']
  },
  children: [
    {
      path: 'dashboard',
      name: 'PurchaseDashboard',
      component: () => import('@/pages/purchase/Dashboard.vue'),
      meta: { 
        title: '采购总览',
        icon: 'DataBoard',
        permission: ['purchase:dashboard']
      }
    },
    // 供应商管理
    {
      path: 'suppliers',
      name: 'SupplierManagement',
      redirect: '/purchase/suppliers/list',
      meta: { 
        title: '供应商管理', 
        icon: 'Shop',
        permission: ['purchase:suppliers']
      },
      children: [
        {
          path: 'list',
          name: 'SupplierList',
          component: () => import('@/pages/purchase/suppliers/SupplierList.vue'),
          meta: { 
            title: '供应商列表',
            permission: ['purchase:suppliers:list']
          }
        },
        {
          path: 'detail/:id',
          name: 'SupplierDetail',
          component: () => import('@/pages/purchase/suppliers/SupplierDetail.vue'),
          meta: { 
            title: '供应商详情',
            permission: ['purchase:suppliers:detail'],
            hidden: true
          }
        },
        {
          path: 'add',
          name: 'SupplierAdd',
          component: () => import('@/pages/purchase/suppliers/SupplierForm.vue'),
          meta: { 
            title: '新增供应商',
            permission: ['purchase:suppliers:add'],
            hidden: true
          }
        },
        {
          path: 'edit/:id',
          name: 'SupplierEdit',
          component: () => import('@/pages/purchase/suppliers/SupplierForm.vue'),
          meta: { 
            title: '编辑供应商',
            permission: ['purchase:suppliers:edit'],
            hidden: true
          }
        },
        {
          path: 'evaluation',
          name: 'SupplierEvaluation',
          component: () => import('@/pages/purchase/suppliers/SupplierEvaluation.vue'),
          meta: { 
            title: '供应商评估',
            permission: ['purchase:suppliers:evaluation']
          }
        },
        {
          path: 'qualification',
          name: 'SupplierQualification',
          component: () => import('@/pages/purchase/suppliers/SupplierQualification.vue'),
          meta: { 
            title: '资质管理',
            permission: ['purchase:suppliers:qualification']
          }
        }
      ]
    },
    // 采购申请
    {
      path: 'requisitions',
      name: 'PurchaseRequisitionManagement',
      redirect: '/purchase/requisitions/list',
      meta: { 
        title: '采购申请', 
        icon: 'DocumentAdd',
        permission: ['purchase:requisitions']
      },
      children: [
        {
          path: 'list',
          name: 'PurchaseRequisitionList',
          component: () => import('@/pages/purchase/requisitions/RequisitionList.vue'),
          meta: { 
            title: '申请列表',
            permission: ['purchase:requisitions:list']
          }
        },
        {
          path: 'create',
          name: 'PurchaseRequisitionCreate',
          component: () => import('@/pages/purchase/requisitions/RequisitionForm.vue'),
          meta: { 
            title: '创建申请',
            permission: ['purchase:requisitions:create'],
            hidden: true
          }
        },
        {
          path: 'edit/:id',
          name: 'PurchaseRequisitionEdit',
          component: () => import('@/pages/purchase/requisitions/RequisitionForm.vue'),
          meta: { 
            title: '编辑申请',
            permission: ['purchase:requisitions:edit'],
            hidden: true
          }
        },
        {
          path: 'approval',
          name: 'PurchaseRequisitionApproval',
          component: () => import('@/pages/purchase/requisitions/RequisitionApproval.vue'),
          meta: { 
            title: '申请审批',
            permission: ['purchase:requisitions:approve']
          }
        }
      ]
    },
    // 采购订单
    {
      path: 'orders',
      name: 'PurchaseOrderManagement',
      redirect: '/purchase/orders/list',
      meta: { 
        title: '采购订单', 
        icon: 'List',
        permission: ['purchase:orders']
      },
      children: [
        {
          path: 'list',
          name: 'PurchaseOrderList',
          component: () => import('@/pages/purchase/orders/PurchaseOrderList.vue'),
          meta: { 
            title: '订单列表',
            permission: ['purchase:orders:list']
          }
        },
        {
          path: 'create',
          name: 'PurchaseOrderCreate',
          component: () => import('@/pages/purchase/orders/PurchaseOrderForm.vue'),
          meta: { 
            title: '创建订单',
            permission: ['purchase:orders:create'],
            hidden: true
          }
        },
        {
          path: 'edit/:id',
          name: 'PurchaseOrderEdit',
          component: () => import('@/pages/purchase/orders/PurchaseOrderForm.vue'),
          meta: { 
            title: '编辑订单',
            permission: ['purchase:orders:edit'],
            hidden: true
          }
        },
        {
          path: 'detail/:id',
          name: 'PurchaseOrderDetail',
          component: () => import('@/pages/purchase/orders/PurchaseOrderDetail.vue'),
          meta: { 
            title: '订单详情',
            permission: ['purchase:orders:detail'],
            hidden: true
          }
        },
        {
          path: 'tracking',
          name: 'PurchaseOrderTracking',
          component: () => import('@/pages/purchase/orders/PurchaseOrderTracking.vue'),
          meta: { 
            title: '订单跟踪',
            permission: ['purchase:orders:tracking']
          }
        }
      ]
    },
    // 采购合同
    {
      path: 'contracts',
      name: 'PurchaseContractManagement',
      redirect: '/purchase/contracts/list',
      meta: { 
        title: '采购合同', 
        icon: 'Document',
        permission: ['purchase:contracts']
      },
      children: [
        {
          path: 'list',
          name: 'PurchaseContractList',
          component: () => import('@/pages/purchase/contracts/ContractList.vue'),
          meta: { 
            title: '合同列表',
            permission: ['purchase:contracts:list']
          }
        },
        {
          path: 'create',
          name: 'PurchaseContractCreate',
          component: () => import('@/pages/purchase/contracts/ContractForm.vue'),
          meta: { 
            title: '创建合同',
            permission: ['purchase:contracts:create'],
            hidden: true
          }
        },
        {
          path: 'edit/:id',
          name: 'PurchaseContractEdit',
          component: () => import('@/pages/purchase/contracts/ContractForm.vue'),
          meta: { 
            title: '编辑合同',
            permission: ['purchase:contracts:edit'],
            hidden: true
          }
        },
        {
          path: 'templates',
          name: 'PurchaseContractTemplates',
          component: () => import('@/pages/purchase/contracts/ContractTemplates.vue'),
          meta: { 
            title: '合同模板',
            permission: ['purchase:contracts:templates']
          }
        }
      ]
    },
    // 入库管理
    {
      path: 'receiving',
      name: 'PurchaseReceivingManagement',
      redirect: '/purchase/receiving/list',
      meta: { 
        title: '入库管理', 
        icon: 'Box',
        permission: ['purchase:receiving']
      },
      children: [
        {
          path: 'list',
          name: 'PurchaseReceivingList',
          component: () => import('@/pages/purchase/receiving/ReceivingList.vue'),
          meta: { 
            title: '入库单列表',
            permission: ['purchase:receiving:list']
          }
        },
        {
          path: 'create',
          name: 'PurchaseReceivingCreate',
          component: () => import('@/pages/purchase/receiving/ReceivingForm.vue'),
          meta: { 
            title: '创建入库单',
            permission: ['purchase:receiving:create'],
            hidden: true
          }
        },
        {
          path: 'inspection',
          name: 'PurchaseReceivingInspection',
          component: () => import('@/pages/purchase/receiving/ReceivingInspection.vue'),
          meta: { 
            title: '质检管理',
            permission: ['purchase:receiving:inspection']
          }
        },
        {
          path: 'return',
          name: 'PurchaseReceivingReturn',
          component: () => import('@/pages/purchase/receiving/ReceivingReturn.vue'),
          meta: { 
            title: '退货管理',
            permission: ['purchase:receiving:return']
          }
        }
      ]
    },
    // 付款管理
    {
      path: 'payment',
      name: 'PurchasePaymentManagement',
      redirect: '/purchase/payment/list',
      meta: { 
        title: '付款管理', 
        icon: 'CreditCard',
        permission: ['purchase:payment']
      },
      children: [
        {
          path: 'list',
          name: 'PurchasePaymentList',
          component: () => import('@/pages/purchase/payment/PaymentList.vue'),
          meta: { 
            title: '付款列表',
            permission: ['purchase:payment:list']
          }
        },
        {
          path: 'create',
          name: 'PurchasePaymentCreate',
          component: () => import('@/pages/purchase/payment/PaymentForm.vue'),
          meta: { 
            title: '创建付款',
            permission: ['purchase:payment:create'],
            hidden: true
          },
          hidden: true
        },
        {
          path: 'approval',
          name: 'PurchasePaymentApproval',
          component: () => import('@/pages/purchase/payment/PaymentApproval.vue'),
          meta: { 
            title: '付款审批',
            permission: ['purchase:payment:approve']
          }
        }
      ]
    },
    // 采购计划
    {
      path: 'procurement-plan',
      name: 'ProcurementPlan',
      component: () => import('@/pages/purchase/ProcurementPlanList.vue'),
      meta: { 
        title: '采购计划',
        icon: 'Calendar',
        permission: ['purchase:plan:list']
      }
    },
    // 采购报表
    {
      path: 'reports',
      name: 'PurchaseReports',
      redirect: '/purchase/reports/spend-analysis',
      meta: { 
        title: '采购报表', 
        icon: 'TrendCharts',
        permission: ['purchase:reports']
      },
      children: [
        {
          path: 'spend-analysis',
          name: 'PurchaseSpendAnalysis',
          component: () => import('@/pages/purchase/reports/SpendAnalysis.vue'),
          meta: { 
            title: '支出分析',
            permission: ['purchase:reports:spend']
          }
        },
        {
          path: 'supplier-performance',
          name: 'SupplierPerformanceReport',
          component: () => import('@/pages/purchase/reports/SupplierPerformance.vue'),
          meta: { 
            title: '供应商绩效',
            permission: ['purchase:reports:supplier']
          }
        },
        {
          path: 'category-analysis',
          name: 'PurchaseCategoryAnalysis',
          component: () => import('@/pages/purchase/reports/CategoryAnalysis.vue'),
          meta: { 
            title: '品类分析',
            permission: ['purchase:reports:category']
          }
        },
        {
          path: 'cost-savings',
          name: 'PurchaseCostSavings',
          component: () => import('@/pages/purchase/reports/CostSavings.vue'),
          meta: { 
            title: '成本节约',
            permission: ['purchase:reports:savings']
          }
        }
      ]
    }
  ]
};