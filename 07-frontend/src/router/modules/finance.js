import Layout from '@/layout/index.vue';

export default {
  path: '/finance',
  component: Layout,
  redirect: '/finance/overview',
  name: 'Finance',
  meta: { 
    title: '财务管理', 
    icon: 'Money',
    permission: ['finance:view']
  },
  children: [
    {
      path: 'overview',
      name: 'FinanceOverview',
      component: () => import('@/pages/finance/Overview.vue'),
      meta: { 
        title: '财务总览',
        icon: 'DataBoard',
        permission: ['finance:overview']
      }
    },
    // 费用报销管理
    {
      path: 'expense',
      name: 'ExpenseManagement',
      redirect: '/finance/expense/list',
      meta: { 
        title: '费用报销', 
        icon: 'Wallet',
        permission: ['finance:expense']
      },
      children: [
        {
          path: 'list',
          name: 'ExpenseList',
          component: () => import('@/pages/finance/expense/ExpenseList.vue'),
          meta: { 
            title: '报销申请',
            permission: ['finance:expense:list']
          }
        },
        {
          path: 'approval',
          name: 'ExpenseApproval',
          component: () => import('@/pages/finance/expense/ExpenseApproval.vue'),
          meta: { 
            title: '报销审批',
            permission: ['finance:expense:approve']
          }
        },
        {
          path: 'statistics',
          name: 'ExpenseStatistics',
          component: () => import('@/pages/finance/expense/ExpenseStatistics.vue'),
          meta: { 
            title: '费用统计',
            permission: ['finance:expense:stats']
          }
        }
      ]
    },
    // 预算管理
    {
      path: 'budget',
      name: 'BudgetManagement',
      redirect: '/finance/budget/list',
      meta: { 
        title: '预算管理', 
        icon: 'Coin',
        permission: ['finance:budget']
      },
      children: [
        {
          path: 'list',
          name: 'BudgetList',
          component: () => import('@/pages/finance/budget/BudgetList.vue'),
          meta: { 
            title: '预算编制',
            permission: ['finance:budget:list']
          }
        },
        {
          path: 'execution',
          name: 'BudgetExecution',
          component: () => import('@/pages/finance/budget/BudgetExecution.vue'),
          meta: { 
            title: '预算执行',
            permission: ['finance:budget:execution']
          }
        },
        {
          path: 'analysis',
          name: 'BudgetAnalysis',
          component: () => import('@/pages/finance/budget/BudgetAnalysis.vue'),
          meta: { 
            title: '预算分析',
            permission: ['finance:budget:analysis']
          }
        }
      ]
    },
    // 资金管理
    {
      path: 'funds',
      name: 'FundsManagement',
      redirect: '/finance/funds/accounts',
      meta: { 
        title: '资金管理', 
        icon: 'CreditCard',
        permission: ['finance:funds']
      },
      children: [
        {
          path: 'accounts',
          name: 'BankAccounts',
          component: () => import('@/pages/finance/funds/BankAccounts.vue'),
          meta: { 
            title: '银行账户',
            permission: ['finance:funds:accounts']
          }
        },
        {
          path: 'cash-flow',
          name: 'CashFlow',
          component: () => import('@/pages/finance/funds/CashFlow.vue'),
          meta: { 
            title: '现金流管理',
            permission: ['finance:funds:cashflow']
          }
        },
        {
          path: 'payment',
          name: 'PaymentManagement',
          component: () => import('@/pages/finance/funds/PaymentManagement.vue'),
          meta: { 
            title: '付款管理',
            permission: ['finance:funds:payment']
          }
        },
        {
          path: 'receivable',
          name: 'ReceivableManagement',
          component: () => import('@/pages/finance/funds/ReceivableManagement.vue'),
          meta: { 
            title: '应收管理',
            permission: ['finance:funds:receivable']
          }
        }
      ]
    },
    // 财务报表
    {
      path: 'reports',
      name: 'FinancialReports',
      redirect: '/finance/reports/balance-sheet',
      meta: { 
        title: '财务报表', 
        icon: 'Document',
        permission: ['finance:reports']
      },
      children: [
        {
          path: 'balance-sheet',
          name: 'BalanceSheet',
          component: () => import('@/pages/finance/reports/BalanceSheet.vue'),
          meta: { 
            title: '资产负债表',
            permission: ['finance:reports:balance']
          }
        },
        {
          path: 'income-statement',
          name: 'IncomeStatement',
          component: () => import('@/pages/finance/reports/IncomeStatement.vue'),
          meta: { 
            title: '利润表',
            permission: ['finance:reports:income']
          }
        },
        {
          path: 'cash-flow-statement',
          name: 'CashFlowStatement',
          component: () => import('@/pages/finance/reports/CashFlowStatement.vue'),
          meta: { 
            title: '现金流量表',
            permission: ['finance:reports:cashflow']
          }
        },
        {
          path: 'custom-reports',
          name: 'CustomReports',
          component: () => import('@/pages/finance/reports/CustomReports.vue'),
          meta: { 
            title: '自定义报表',
            permission: ['finance:reports:custom']
          }
        }
      ]
    },
    // 税务管理
    {
      path: 'tax',
      name: 'TaxManagement',
      redirect: '/finance/tax/declaration',
      meta: { 
        title: '税务管理', 
        icon: 'Tickets',
        permission: ['finance:tax']
      },
      children: [
        {
          path: 'declaration',
          name: 'TaxDeclaration',
          component: () => import('@/pages/finance/tax/TaxDeclaration.vue'),
          meta: { 
            title: '纳税申报',
            permission: ['finance:tax:declaration']
          }
        },
        {
          path: 'planning',
          name: 'TaxPlanning',
          component: () => import('@/pages/finance/tax/TaxPlanning.vue'),
          meta: { 
            title: '税务筹划',
            permission: ['finance:tax:planning']
          }
        },
        {
          path: 'analysis',
          name: 'TaxAnalysis',
          component: () => import('@/pages/finance/tax/TaxAnalysis.vue'),
          meta: { 
            title: '税务分析',
            permission: ['finance:tax:analysis']
          }
        }
      ]
    }
  ]
};