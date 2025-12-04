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
      component: () => import('@/pages/finance/FinanceOverview.vue'),
      meta: { 
        title: '财务概览',
        icon: 'DataBoard',
        permission: ['finance:overview']
      }
    },
    // 成本管理
    {
      path: 'cost-management',
      name: 'CostManagement',
      component: () => import('@/pages/finance/CostManagement.vue'),
      meta: { 
        title: '成本管理',
        icon: 'Coin',
        permission: ['finance:cost']
      }
    },
    // 费用报销
    {
      path: 'expense-reimbursement',
      name: 'ExpenseReimbursement',
      component: () => import('@/pages/finance/ExpenseReimbursement.vue'),
      meta: { 
        title: '费用报销',
        icon: 'Wallet',
        permission: ['finance:expense-reimbursement']
      }
    },
    // 预算管理
    {
      path: 'budget-management',
      name: 'BudgetManagementPage',
      component: () => import('@/pages/finance/BudgetManagement.vue'),
      meta: { 
        title: '预算管理',
        icon: 'Coin',
        permission: ['finance:budget-page']
      }
    },
    // 付款申请
    {
      path: 'payment-application',
      name: 'PaymentApplication',
      component: () => import('@/pages/finance/PaymentApplication.vue'),
      meta: { 
        title: '付款申请',
        icon: 'CreditCard',
        permission: ['finance:payment-application']
      }
    },
    // 付款计划
    {
      path: 'payment-plan',
      name: 'PaymentPlan',
      component: () => import('@/pages/finance/PaymentPlan.vue'),
      meta: { 
        title: '付款计划',
        icon: 'Calendar',
        permission: ['finance:payment-plan']
      }
    },
    // 收款管理
    {
      path: 'collection-management',
      name: 'CollectionManagement',
      component: () => import('@/pages/finance/CollectionManagement.vue'),
      meta: { 
        title: '收款管理',
        icon: 'Money',
        permission: ['finance:collection']
      }
    },
    // 回款跟进
    {
      path: 'payment-follow-up',
      name: 'PaymentFollowUp',
      component: () => import('@/pages/finance/PaymentFollowUp.vue'),
      meta: { 
        title: '回款跟进',
        icon: 'View',
        permission: ['finance:payment-followup']
      }
    },
    // 应收账款
    {
      path: 'account-receivable',
      name: 'AccountReceivable',
      component: () => import('@/pages/finance/AccountReceivable.vue'),
      meta: { 
        title: '应收账款',
        icon: 'Money',
        permission: ['finance:account-receivable']
      }
    },
    // 发票管理
    {
      path: 'invoice-management',
      name: 'InvoiceManagement',
      component: () => import('@/pages/finance/InvoiceManagement.vue'),
      meta: { 
        title: '发票管理',
        icon: 'Tickets',
        permission: ['finance:invoice']
      }
    },
    // 财务报表
    {
      path: 'financial-report',
      name: 'FinancialReport',
      component: () => import('@/pages/finance/FinancialReport.vue'),
      meta: { 
        title: '财务报表',
        icon: 'Document',
        permission: ['finance:financial-report']
      }
    },
    // 财务分析
    {
      path: 'financial-analysis',
      name: 'FinancialAnalysis',
      component: () => import('@/pages/finance/FinancialAnalysis.vue'),
      meta: { 
        title: '财务分析',
        icon: 'DataAnalysis',
        permission: ['finance:analysis']
      }
    },
    // 税务管理
    {
      path: 'tax-management',
      name: 'TaxManagementPage',
      component: () => import('@/pages/finance/TaxManagement.vue'),
      meta: { 
        title: '税务管理',
        icon: 'Tickets',
        permission: ['finance:tax-page']
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
    },
    // 总账管理
    {
      path: 'general-ledger',
      name: 'GeneralLedgerManagement',
      redirect: '/finance/general-ledger/list',
      meta: { 
        title: '总账管理', 
        icon: 'Notebook',
        permission: ['finance:general-ledger']
      },
      children: [
        {
          path: 'list',
          name: 'GeneralLedgerList',
          component: () => import('@/pages/finance/general-ledger/GeneralLedgerList.vue'),
          meta: { 
            title: '总账列表',
            permission: ['finance:general-ledger:list']
          }
        },
        {
          path: 'detail/:id',
          name: 'GeneralLedgerDetail',
          component: () => import('@/pages/finance/general-ledger/GeneralLedgerDetail.vue'),
          meta: { 
            title: '总账详情',
            permission: ['finance:general-ledger:detail']
          },
          hidden: true
        },
        {
          path: 'create',
          name: 'GeneralLedgerCreate',
          component: () => import('@/pages/finance/general-ledger/GeneralLedgerCreate.vue'),
          meta: { 
            title: '新建总账',
            permission: ['finance:general-ledger:create']
          },
          hidden: true
        },
        {
          path: 'edit/:id',
          name: 'GeneralLedgerEdit',
          component: () => import('@/pages/finance/general-ledger/GeneralLedgerEdit.vue'),
          meta: { 
            title: '编辑总账',
            permission: ['finance:general-ledger:edit']
          },
          hidden: true
        },
        {
          path: 'approve/:id',
          name: 'GeneralLedgerApprove',
          component: () => import('@/pages/finance/general-ledger/GeneralLedgerApprove.vue'),
          meta: { 
            title: '总账审批',
            permission: ['finance:general-ledger:approve']
          },
          hidden: true
        },
        {
          path: 'voucher-entry',
          name: 'VoucherEntry',
          component: () => import('@/pages/finance/general-ledger/VoucherEntry.vue'),
          meta: { 
            title: '凭证录入',
            permission: ['finance:voucher:entry']
          }
        },
        {
          path: 'voucher-review',
          name: 'VoucherReview',
          component: () => import('@/pages/finance/general-ledger/VoucherReview.vue'),
          meta: { 
            title: '凭证审核',
            permission: ['finance:voucher:review']
          }
        },
        {
          path: 'account-balance-report',
          name: 'AccountBalanceReport',
          component: () => import('@/pages/finance/general-ledger/AccountBalanceReport.vue'),
          meta: { 
            title: '科目余额表',
            permission: ['finance:report:account-balance']
          }
        },
        {
          path: 'trial-balance',
          name: 'TrialBalance',
          component: () => import('@/pages/finance/general-ledger/TrialBalance.vue'),
          meta: { 
            title: '试算平衡表',
            permission: ['finance:report:trial-balance']
          }
        },
        {
          path: 'profit-statement',
          name: 'ProfitStatement',
          component: () => import('@/pages/finance/general-ledger/ProfitStatement.vue'),
          meta: { 
            title: '利润表',
            permission: ['finance:report:profit']
          }
        },
        {
          path: 'balance-sheet',
          name: 'BalanceSheetGL',
          component: () => import('@/pages/finance/general-ledger/BalanceSheet.vue'),
          meta: { 
            title: '资产负债表',
            permission: ['finance:report:balance-sheet']
          }
        }
      ]
    },
    // 应收账款管理
    {
      path: 'accounts-receivable',
      name: 'AccountsReceivableManagement',
      redirect: '/finance/accounts-receivable/list',
      meta: { 
        title: '应收账款', 
        icon: 'Money',
        permission: ['finance:ar']
      },
      children: [
        {
          path: 'list',
          name: 'ReceivableList',
          component: () => import('@/pages/finance/accounts-receivable/ReceivableList.vue'),
          meta: { 
            title: '应收单列表',
            permission: ['finance:ar:list']
          }
        },
        {
          path: 'create',
          name: 'ReceivableCreate',
          component: () => import('@/pages/finance/accounts-receivable/ReceivableCreate.vue'),
          meta: { 
            title: '新建应收单',
            permission: ['finance:ar:create']
          },
          hidden: true
        },
        {
          path: 'approve/:id',
          name: 'ReceivableApprove',
          component: () => import('@/pages/finance/accounts-receivable/ReceivableApprove.vue'),
          meta: { 
            title: '应收单审核',
            permission: ['finance:ar:approve']
          },
          hidden: true
        },
        {
          path: 'collection-application',
          name: 'CollectionApplication',
          component: () => import('@/pages/finance/accounts-receivable/CollectionApplication.vue'),
          meta: { 
            title: '收款申请',
            permission: ['finance:ar:collection']
          }
        },
        {
          path: 'collection-execution',
          name: 'CollectionExecution',
          component: () => import('@/pages/finance/accounts-receivable/CollectionExecution.vue'),
          meta: { 
            title: '收款执行',
            permission: ['finance:ar:execution']
          }
        },
        {
          path: 'customer-statement',
          name: 'CustomerStatement',
          component: () => import('@/pages/finance/accounts-receivable/CustomerStatement.vue'),
          meta: { 
            title: '客户对账单',
            permission: ['finance:ar:statement']
          }
        },
        {
          path: 'receivable-aging',
          name: 'ReceivableAging',
          component: () => import('@/pages/finance/accounts-receivable/ReceivableAging.vue'),
          meta: { 
            title: '应收账龄分析',
            permission: ['finance:ar:aging']
          }
        }
      ]
    }
  ]
};