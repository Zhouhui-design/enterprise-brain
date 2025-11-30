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
    {
      path: 'dashboard',
      name: 'SalesDashboard',
      component: () => import('@/pages/sales/Dashboard.vue'),
      meta: { 
        title: '销售总览',
        icon: 'DataBoard',
        permission: ['sales:dashboard']
      }
    },
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
          path: 'detail/:id',
          name: 'CustomerDetail',
          component: () => import('@/pages/sales/customers/CustomerDetail.vue'),
          meta: { 
            title: '客户详情',
            permission: ['sales:customers:detail'],
            hidden: true
          }
        },
        {
          path: 'add',
          name: 'CustomerAdd',
          component: () => import('@/pages/sales/customers/CustomerForm.vue'),
          meta: { 
            title: '新增客户',
            permission: ['sales:customers:add'],
            hidden: true
          }
        },
        {
          path: 'edit/:id',
          name: 'CustomerEdit',
          component: () => import('@/pages/sales/customers/CustomerForm.vue'),
          meta: { 
            title: '编辑客户',
            permission: ['sales:customers:edit'],
            hidden: true
          }
        },
        {
          path: 'contact',
          name: 'CustomerContact',
          component: () => import('@/pages/sales/customers/CustomerContact.vue'),
          meta: { 
            title: '联系人管理',
            permission: ['sales:customers:contact']
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
          component: () => import('@/pages/sales/sales-order/SalesOrderListNew.vue'),
          meta: { 
            title: '订单列表',
            permission: ['sales:orders:list']
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
          path: 'create',
          name: 'SalesOrderCreate',
          component: () => import('@/pages/sales/orders/SalesOrderForm.vue'),
          meta: { 
            title: '创建订单',
            permission: ['sales:orders:create'],
            hidden: true
          }
        },
        {
          path: 'edit/:id',
          name: 'SalesOrderEdit',
          component: () => import('@/pages/sales/orders/SalesOrderForm.vue'),
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
    // 销售机会
    {
      path: 'opportunities',
      name: 'SalesOpportunityManagement',
      redirect: '/sales/opportunities/list',
      meta: { 
        title: '销售机会', 
        icon: 'Trophy',
        permission: ['sales:opportunities']
      },
      children: [
        {
          path: 'list',
          name: 'SalesOpportunityList',
          component: () => import('@/pages/sales/opportunities/OpportunityList.vue'),
          meta: { 
            title: '机会列表',
            permission: ['sales:opportunities:list']
          }
        },
        {
          path: 'create',
          name: 'SalesOpportunityCreate',
          component: () => import('@/pages/sales/opportunities/OpportunityForm.vue'),
          meta: { 
            title: '创建机会',
            permission: ['sales:opportunities:create'],
            hidden: true
          }
        },
        {
          path: 'edit/:id',
          name: 'SalesOpportunityEdit',
          component: () => import('@/pages/sales/opportunities/OpportunityForm.vue'),
          meta: { 
            title: '编辑机会',
            permission: ['sales:opportunities:edit'],
            hidden: true
          }
        },
        {
          path: 'pipeline',
          name: 'SalesPipeline',
          component: () => import('@/pages/sales/opportunities/SalesPipeline.vue'),
          meta: { 
            title: '销售漏斗',
            permission: ['sales:opportunities:pipeline']
          }
        }
      ]
    },
    // 合同管理
    {
      path: 'contracts',
      name: 'ContractManagement',
      redirect: '/sales/contracts/list',
      meta: { 
        title: '合同管理', 
        icon: 'Memo',
        permission: ['sales:contracts']
      },
      children: [
        {
          path: 'list',
          name: 'ContractList',
          component: () => import('@/pages/sales/contracts/ContractList.vue'),
          meta: { 
            title: '合同列表',
            permission: ['sales:contracts:list']
          }
        },
        {
          path: 'create',
          name: 'ContractCreate',
          component: () => import('@/pages/sales/contracts/ContractForm.vue'),
          meta: { 
            title: '创建合同',
            permission: ['sales:contracts:create'],
            hidden: true
          }
        },
        {
          path: 'edit/:id',
          name: 'ContractEdit',
          component: () => import('@/pages/sales/contracts/ContractForm.vue'),
          meta: { 
            title: '编辑合同',
            permission: ['sales:contracts:edit'],
            hidden: true
          }
        },
        {
          path: 'templates',
          name: 'ContractTemplates',
          component: () => import('@/pages/sales/contracts/ContractTemplates.vue'),
          meta: { 
            title: '合同模板',
            permission: ['sales:contracts:templates']
          }
        }
      ]
    },
    // 报价管理
    {
      path: 'quotations',
      name: 'QuotationManagement',
      redirect: '/sales/quotations/list',
      meta: { 
        title: '报价管理', 
        icon: 'PriceTag',
        permission: ['sales:quotations']
      },
      children: [
        {
          path: 'list',
          name: 'QuotationList',
          component: () => import('@/pages/sales/quotations/QuotationList.vue'),
          meta: { 
            title: '报价列表',
            permission: ['sales:quotations:list']
          }
        },
        {
          path: 'create',
          name: 'QuotationCreate',
          component: () => import('@/pages/sales/quotations/QuotationForm.vue'),
          meta: { 
            title: '创建报价',
            permission: ['sales:quotations:create'],
            hidden: true
          }
        },
        {
          path: 'edit/:id',
          name: 'QuotationEdit',
          component: () => import('@/pages/sales/quotations/QuotationForm.vue'),
          meta: { 
            title: '编辑报价',
            permission: ['sales:quotations:edit'],
            hidden: true
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
        },
        {
          path: 'customer-analysis',
          name: 'CustomerAnalysis',
          component: () => import('@/pages/sales/reports/CustomerAnalysis.vue'),
          meta: { 
            title: '客户分析',
            permission: ['sales:reports:customer']
          }
        },
        {
          path: 'product-sales',
          name: 'ProductSalesReport',
          component: () => import('@/pages/sales/reports/ProductSalesReport.vue'),
          meta: { 
            title: '产品销售',
            permission: ['sales:reports:product']
          }
        },
        {
          path: 'regional',
          name: 'RegionalSalesReport',
          component: () => import('@/pages/sales/reports/RegionalSalesReport.vue'),
          meta: { 
            title: '区域销售',
            permission: ['sales:reports:regional']
          }
        }
      ]
    }
  ]
};