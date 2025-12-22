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
          component: () => import('@/pages/purchase/supplier-management/SupplierList.vue'),
          meta: { 
            title: '供应商列表',
            permission: ['purchase:suppliers:list']
          }
        },
        {
          path: 'create',
          name: 'SupplierCreate',
          component: () => import('@/pages/purchase/supplier-management/SupplierCreate.vue'),
          meta: { 
            title: '新增供应商',
            permission: ['purchase:suppliers:create'],
            hidden: true
          }
        }
      ]
    },
    // 采购计划
    {
      path: 'procurement-plans',
      name: 'ProcurementPlanManagement',
      redirect: '/purchase/procurement-plans/list',
      meta: {
        title: '采购计划',
        icon: 'List',
        permission: ['purchase:procurement-plans']
      },
      children: [
        {
          path: 'list',
          name: 'ProcurementPlanList',
          component: () => import('@/pages/purchase/ProcurementPlanList.vue'),
          meta: {
            title: '采购计划列表',
            permission: ['purchase:procurement-plans:list']
          }
        },
        {
          path: 'new',
          name: 'ProcurementPlanNew',
          component: () => import('@/pages/purchase/ProcurementPlanNew.vue'),
          meta: {
            title: '新建采购计划',
            permission: ['purchase:procurement-plans:new'],
            hidden: true
          }
        }
      ]
    },
    // 采购申请
    {
      path: 'requisitions',
      name: 'PurchaseRequisition',
      component: () => import('@/pages/purchase/PurchaseRequisition.vue'),
      meta: { 
        title: '采购申请',
        permission: ['purchase:requisitions']
      }
    },
    // 采购订单
    {
      path: 'orders',
      name: 'PurchaseOrder',
      redirect: '/purchase/orders/list',
      meta: { 
        title: '采购订单',
        permission: ['purchase:orders']
      },
      children: [
          {
            path: 'list',
            name: 'PurchaseOrderList',
            component: () => import('@/pages/purchase/PurchaseOrderList.vue'),
            meta: { 
              title: '订单列表',
              permission: ['purchase:orders:list']
            }
          },
          {
            path: 'create',
            name: 'PurchaseOrderCreate',
            component: () => import('@/pages/purchase/PurchaseOrderCreate.vue'),
            meta: { 
              title: '创建订单',
              permission: ['purchase:orders:create']
            }
          },
          {
            path: 'approve',
            name: 'PurchaseOrderApprove',
            component: () => import('@/pages/purchase/PurchaseOrderApprove.vue'),
            meta: { 
              title: '审批订单',
              permission: ['purchase:orders:approve']
            }
          }
        ]
    },





  ]
};