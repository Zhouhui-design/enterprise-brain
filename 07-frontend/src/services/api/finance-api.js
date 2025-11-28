import request from '@/utils/request'

// 财务管理API服务
export const financeApi = {
  // 财务科目管理
  account: {
    // 获取科目列表
    getList: (params) => {
      return request.get('/finance/accounts', params)
    },
    
    // 获取科目树
    getTree: () => {
      return request.get('/finance/accounts/tree')
    },
    
    // 获取科目详情
    getDetail: (id) => {
      return request.get(`/finance/accounts/${id}`)
    },
    
    // 创建科目
    create: (data) => {
      return request.post('/finance/accounts', data)
    },
    
    // 更新科目
    update: (id, data) => {
      return request.put(`/finance/accounts/${id}`, data)
    },
    
    // 删除科目
    delete: (id) => {
      return request.delete(`/finance/accounts/${id}`)
    }
  },

  // 凭证管理
  voucher: {
    // 获取凭证列表
    getList: (params) => {
      return request.get('/finance/vouchers', params)
    },
    
    // 获取凭证详情
    getDetail: (id) => {
      return request.get(`/finance/vouchers/${id}`)
    },
    
    // 创建凭证
    create: (data) => {
      return request.post('/finance/vouchers', data)
    },
    
    // 更新凭证
    update: (id, data) => {
      return request.put(`/finance/vouchers/${id}`, data)
    },
    
    // 删除凭证
    delete: (id) => {
      return request.delete(`/finance/vouchers/${id}`)
    },
    
    // 审核凭证
    approve: (id, data) => {
      return request.put(`/finance/vouchers/${id}/approve`, data)
    },
    
    // 反审核凭证
    unapprove: (id, data) => {
      return request.put(`/finance/vouchers/${id}/unapprove`, data)
    },
    
    // 导出凭证
    export: (params) => {
      return request.download('/finance/vouchers/export', params, 'vouchers.xlsx')
    }
  },

  // 账簿管理
  ledger: {
    // 获取明细账
    getDetailLedger: (params) => {
      return request.get('/finance/ledger/detail', params)
    },
    
    // 获取总账
    getGeneralLedger: (params) => {
      return request.get('/finance/ledger/general', params)
    },
    
    // 获取日记账
    getJournalLedger: (params) => {
      return request.get('/finance/ledger/journal', params)
    },
    
    // 获取科目余额表
    getBalanceSheet: (params) => {
      return request.get('/finance/ledger/balance', params)
    },
    
    // 导出账簿
    export: (type, params) => {
      return request.download(`/finance/ledger/export/${type}`, params, `${type}-ledger.xlsx`)
    }
  },

  // 财务报表
  report: {
    // 获取资产负债表
    getBalanceSheet: (params) => {
      return request.get('/finance/reports/balance-sheet', params)
    },
    
    // 获取利润表
    getIncomeStatement: (params) => {
      return request.get('/finance/reports/income-statement', params)
    },
    
    // 获取现金流量表
    getCashFlowStatement: (params) => {
      return request.get('/finance/reports/cash-flow', params)
    },
    
    // 获取所有者权益变动表
    getEquityStatement: (params) => {
      return request.get('/finance/reports/equity', params)
    },
    
    // 获取财务指标分析
    getFinancialIndicators: (params) => {
      return request.get('/finance/reports/indicators', params)
    },
    
    // 导出报表
    export: (type, params) => {
      return request.download(`/finance/reports/export/${type}`, params, `${type}-report.xlsx`)
    }
  },

  // 收支管理
  incomeExpense: {
    // 获取收入列表
    getIncomeList: (params) => {
      return request.get('/finance/income', params)
    },
    
    // 获取支出列表
    getExpenseList: (params) => {
      return request.get('/finance/expense', params)
    },
    
    // 创建收入记录
    createIncome: (data) => {
      return request.post('/finance/income', data)
    },
    
    // 创建支出记录
    createExpense: (data) => {
      return request.post('/finance/expense', data)
    },
    
    // 更新收支记录
    update: (type, id, data) => {
      return request.put(`/finance/${type}/${id}`, data)
    },
    
    // 删除收支记录
    delete: (type, id) => {
      return request.delete(`/finance/${type}/${id}`)
    }
  },

  // 预算管理
  budget: {
    // 获取预算列表
    getList: (params) => {
      return request.get('/finance/budgets', params)
    },
    
    // 获取预算详情
    getDetail: (id) => {
      return request.get(`/finance/budgets/${id}`)
    },
    
    // 创建预算
    create: (data) => {
      return request.post('/finance/budgets', data)
    },
    
    // 更新预算
    update: (id, data) => {
      return request.put(`/finance/budgets/${id}`, data)
    },
    
    // 删除预算
    delete: (id) => {
      return request.delete(`/finance/budgets/${id}`)
    },
    
    // 获取预算执行情况
    getExecution: (id) => {
      return request.get(`/finance/budgets/${id}/execution`)
    },
    
    // 预算调整
    adjust: (id, data) => {
      return request.put(`/finance/budgets/${id}/adjust`, data)
    }
  },

  // 资金管理
  fund: {
    // 获取账户列表
    getAccounts: () => {
      return request.get('/finance/funds/accounts')
    },
    
    // 获取资金流水
    getFlow: (params) => {
      return request.get('/finance/funds/flow', params)
    },
    
    // 获取资金余额
    getBalance: (accountId) => {
      return request.get(`/finance/funds/balance/${accountId}`)
    },
    
    // 资金转账
    transfer: (data) => {
      return request.post('/finance/funds/transfer', data)
    },
    
    // 获取资金报表
    getReports: (type, params) => {
      return request.get(`/finance/funds/reports/${type}`, params)
    }
  },

  // 税务管理
  tax: {
    // 获取税种列表
    getTaxTypes: () => {
      return request.get('/finance/tax/types')
    },
    
    // 计算税额
    calculate: (data) => {
      return request.post('/finance/tax/calculate', data)
    },
    
    // 获取税务申报列表
    getDeclarations: (params) => {
      return request.get('/finance/tax/declarations', params)
    },
    
    // 创建税务申报
    createDeclaration: (data) => {
      return request.post('/finance/tax/declarations', data)
    },
    
    // 获取发票管理
    getInvoices: (params) => {
      return request.get('/finance/tax/invoices', params)
    },
    
    // 发票认证
    verifyInvoice: (data) => {
      return request.post('/finance/tax/invoices/verify', data)
    }
  },

  // 成本管理
  cost: {
    // 获取成本中心列表
    getCenters: () => {
      return request.get('/finance/cost/centers')
    },
    
    // 获取成本分摊
    getAllocation: (params) => {
      return request.get('/finance/cost/allocation', params)
    },
    
    // 成本核算
    calculate: (data) => {
      return request.post('/finance/cost/calculate', data)
    },
    
    // 获取成本报表
    getReports: (type, params) => {
      return request.get(`/finance/cost/reports/${type}`, params)
    }
  }
}