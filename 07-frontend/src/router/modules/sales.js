import Layout from '@/layout/index.vue';

export default {
  path: '/sales',
  component: Layout,
  redirect: '/sales/dashboard',
  name: 'Sales',
  meta: { 
    title: '销售管理', 
    icon: 'ShoppingCart',
    permission: ['sales:view']
  },
  children: [

    // 客户管理
    {
      path: 'customers',
      name: 'CustomerManagement',
      redirect: '/sales/customers/list',
      meta: { 
        title: '客户管理', 
        icon: 'User',
        permission: ['sales:customers']
      },
      children: [
        {
          path: 'list',
          name: 'CustomerList',
          component: () => import('@/pages/sales/customers/CustomerList.vue'),
          meta: { 
            title: '客户列表',
            permission: ['sales:customers:list']
          }
        },
        {
          path: 'create',
          name: 'CustomerCreate',
          component: () => import('@/pages/sales/customers/CustomerCreate.vue'),
          meta: { 
            title: '创建客户',
            permission: ['sales:customers:create'],
            hidden: true
          }
        },
        {
          path: 'view/:id',
          name: 'CustomerView',
          component: () => import('@/pages/sales/customers/CustomerView.vue'),
          meta: { 
            title: '客户详情',
            permission: ['sales:customers:view'],
            hidden: true
          }
        }
      ]
    },
    // 销售订单
    {
      path: 'orders',
      name: 'SalesOrderManagement',
      redirect: '/sales/orders/list',
      meta: { 
        title: '销售订单', 
        icon: 'Document',
        permission: ['sales:orders']
      },
      children: [
        {
          path: 'list',
          name: 'SalesOrderList',
          component: () => import('@/pages/sales/sales-order/SalesOrderListNew2.vue'),
          meta: { 
            title: '销售订单列表',
            permission: ['sales:orders:list']
          }
        },
        {
          path: 'create',
          name: 'SalesOrderCreate',
          component: () => import('@/pages/sales/sales-order/SalesOrderCreateNew.vue'),
          meta: { 
            title: '创建销售订单',
            permission: ['sales:orders:create']
          }
        },
        {
          path: 'view/:id',
          name: 'SalesOrderView',
          component: () => import('@/pages/sales/sales-order/SalesOrderView.vue'),
          meta: { 
            title: '查看销售订单',
            permission: ['sales:orders:view'],
            hidden: true
          }
        },
        {
          path: 'customers',
          name: 'SalesOrderCustomerList',
          component: () => import('@/pages/sales/customers/CustomerList.vue'),
          meta: { 
            title: '客户台账',
            permission: ['sales:customers:list']
          }
        },

        {
          path: 'edit/:id',
          name: 'SalesOrderEdit',
          component: () => import('@/pages/sales/sales-order/SalesOrderCreateNew.vue'),
          meta: { 
            title: '编辑订单',
            permission: ['sales:orders:edit'],
            hidden: true
          }
        },
        {
          path: 'detail/:id',
          name: 'SalesOrderDetail',
          component: () => import('@/pages/sales/orders/SalesOrderDetail.vue'),
          meta: { 
            title: '订单详情',
            permission: ['sales:orders:detail'],
            hidden: true
          }
        },
        {
          path: 'approval',
          name: 'SalesOrderApproval',
          component: () => import('@/pages/sales/orders/SalesOrderApproval.vue'),
          meta: { 
            title: '订单审批',
            permission: ['sales:orders:approve']
          }
        }
      ]
    },

    // 销售报表
    {
      path: 'reports',
      name: 'SalesReports',
      redirect: '/sales/reports/performance',
      meta: { 
        title: '销售报表', 
        icon: 'TrendCharts',
        permission: ['sales:reports']
      },
      children: [
        {
          path: 'performance',
          name: 'SalesPerformance',
          component: () => import('@/pages/sales/reports/SalesPerformance.vue'),
          meta: { 
            title: '销售业绩',
            permission: ['sales:reports:performance']
          }
        }
      ]
    }
  ]
};