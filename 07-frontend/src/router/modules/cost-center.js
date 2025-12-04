/**
 * 成本中心路由模块
 */
export default {
  path: '/cost-center',
  name: 'CostCenter',
  meta: { 
    title: '成本中心',
    icon: 'Coin'
  },
  children: [
    {
      path: 'cost-center',
      name: 'CostCenterManagement',
      component: () => import('@/pages/cost/CostCenter.vue'),
      meta: { 
        title: '成本中心',
        icon: 'Management'
      }
    },
    {
      path: 'cost-item',
      name: 'CostItem',
      component: () => import('@/pages/cost/CostItem.vue'),
      meta: { 
        title: '成本项目',
        icon: 'Document'
      }
    },
    {
      path: 'cost-allocation',
      name: 'CostAllocation',
      component: () => import('@/pages/cost/CostAllocation.vue'),
      meta: { 
        title: '成本分配',
        icon: 'Share'
      }
    },
    {
      path: 'cost-analysis',
      name: 'CostAnalysis',
      component: () => import('@/pages/cost/CostAnalysis.vue'),
      meta: { 
        title: '成本分析',
        icon: 'DataAnalysis'
      }
    },
    {
      path: 'budget-management',
      name: 'CostBudgetManagement',
      component: () => import('@/pages/cost/BudgetManagement.vue'),
      meta: { 
        title: '预算管理',
        icon: 'Coin'
      }
    },
    {
      path: 'profit-analysis',
      name: 'ProfitAnalysis',
      component: () => import('@/pages/cost/ProfitAnalysis.vue'),
      meta: { 
        title: '利润分析',
        icon: 'TrendCharts'
      }
    }
  ]
}
