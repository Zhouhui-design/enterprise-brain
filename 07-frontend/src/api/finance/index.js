/**
 * 财务管理相关API
 */
import request from '@/services/utils/request'

/**
 * 总账管理API
 */
export const generalLedgerApi = {
  /**
   * 获取总账列表
   */
  getGeneralLedgerList(params) {
    return request({
      url: '/api/finance/general-ledger/list',
      method: 'get',
      params
    })
  },

  /**
   * 获取总账详情
   */
  getGeneralLedgerDetail(id) {
    return request({
      url: `/api/finance/general-ledger/${id}`,
      method: 'get'
    })
  },

  /**
   * 创建总账
   */
  createGeneralLedger(data) {
    return request({
      url: '/api/finance/general-ledger/create',
      method: 'post',
      data
    })
  },

  /**
   * 更新总账
   */
  updateGeneralLedger(data) {
    return request({
      url: '/api/finance/general-ledger/update',
      method: 'put',
      data
    })
  },

  /**
   * 删除总账
   */
  deleteGeneralLedger(id) {
    return request({
      url: `/api/finance/general-ledger/${id}`,
      method: 'delete'
    })
  },

  /**
   * 审批总账
   */
  approveGeneralLedger(data) {
    return request({
      url: '/api/finance/general-ledger/approve',
      method: 'post',
      data
    })
  }
}

/**
 * 凭证管理API
 */
export const voucherApi = {
  /**
   * 获取凭证列表
   */
  getVoucherList(params) {
    return request({
      url: '/api/finance/voucher/list',
      method: 'get',
      params
    })
  },

  /**
   * 创建凭证
   */
  createVoucher(data) {
    return request({
      url: '/api/finance/voucher/create',
      method: 'post',
      data
    })
  },

  /**
   * 审核凭证
   */
  reviewVoucher(data) {
    return request({
      url: '/api/finance/voucher/review',
      method: 'post',
      data
    })
  },

  /**
   * 获取凭证详情
   */
  getVoucherDetail(id) {
    return request({
      url: `/api/finance/voucher/${id}`,
      method: 'get'
    })
  }
}

/**
 * 科目余额API
 */
export const accountBalanceApi = {
  /**
   * 获取科目余额报表
   */
  getAccountBalanceReport(params) {
    return request({
      url: '/api/finance/account-balance/report',
      method: 'get',
      params
    })
  },

  /**
   * 导出科目余额
   */
  exportAccountBalance(params) {
    return request({
      url: '/api/finance/account-balance/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  }
}

/**
 * 试算平衡API
 */
export const trialBalanceApi = {
  /**
   * 获取试算平衡表
   */
  getTrialBalance(params) {
    return request({
      url: '/api/finance/trial-balance',
      method: 'get',
      params
    })
  },

  /**
   * 导出试算平衡表
   */
  exportTrialBalance(params) {
    return request({
      url: '/api/finance/trial-balance/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  }
}

/**
 * 利润表API
 */
export const profitStatementApi = {
  /**
   * 获取利润表
   */
  getProfitStatement(params) {
    return request({
      url: '/api/finance/profit-statement',
      method: 'get',
      params
    })
  },

  /**
   * 导出利润表
   */
  exportProfitStatement(params) {
    return request({
      url: '/api/finance/profit-statement/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  }
}

/**
 * 资产负债表API
 */
export const balanceSheetApi = {
  /**
   * 获取资产负债表
   */
  getBalanceSheet(params) {
    return request({
      url: '/api/finance/balance-sheet',
      method: 'get',
      params
    })
  },

  /**
   * 导出资产负债表
   */
  exportBalanceSheet(params) {
    return request({
      url: '/api/finance/balance-sheet/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  }
}

/**
 * 付款跟进API
 */
export const paymentFollowUpApi = {
  /**
   * 获取付款跟进列表
   */
  getPaymentFollowUpList(params) {
    return request({
      url: '/api/finance/payment-follow-up/list',
      method: 'get',
      params
    })
  },

  /**
   * 创建跟进记录
   */
  createFollowUpRecord(data) {
    return request({
      url: '/api/finance/payment-follow-up/create',
      method: 'post',
      data
    })
  },

  /**
   * 标记已付款
   */
  markAsPaid(data) {
    return request({
      url: '/api/finance/payment-follow-up/mark-paid',
      method: 'post',
      data
    })
  }
}

/**
 * 收款管理API
 */
export const collectionApi = {
  /**
   * 获取收款列表
   */
  getCollectionList(params) {
    return request({
      url: '/api/finance/collection/list',
      method: 'get',
      params
    })
  },

  /**
   * 创建收款记录
   */
  createCollection(data) {
    return request({
      url: '/api/finance/collection/create',
      method: 'post',
      data
    })
  }
}

/**
 * 发票管理API
 */
export const invoiceApi = {
  /**
   * 获取发票列表
   */
  getInvoiceList(params) {
    return request({
      url: '/api/finance/invoice/list',
      method: 'get',
      params
    })
  },

  /**
   * 创建发票
   */
  createInvoice(data) {
    return request({
      url: '/api/finance/invoice/create',
      method: 'post',
      data
    })
  }
}

/**
 * 应收账款API
 */
export const accountReceivableApi = {
  /**
   * 获取应收账款列表
   */
  getAccountReceivableList(params) {
    return request({
      url: '/api/finance/account-receivable/list',
      method: 'get',
      params
    })
  },

  /**
   * 获取账龄分析
   */
  getAgingAnalysis(params) {
    return request({
      url: '/api/finance/account-receivable/aging-analysis',
      method: 'get',
      params
    })
  }
}

/**
 * 付款申请API
 */
export const paymentApplicationApi = {
  /**
   * 获取付款申请列表
   */
  getPaymentApplicationList(params) {
    return request({
      url: '/api/finance/payment-application/list',
      method: 'get',
      params
    })
  },

  /**
   * 创建付款申请
   */
  createPaymentApplication(data) {
    return request({
      url: '/api/finance/payment-application/create',
      method: 'post',
      data
    })
  },

  /**
   * 审批付款申请
   */
  approvePaymentApplication(data) {
    return request({
      url: '/api/finance/payment-application/approve',
      method: 'post',
      data
    })
  }
}

/**
 * 会计科目API
 */
export const accountSubjectApi = {
  /**
   * 获取会计科目列表
   */
  getAccountSubjectList(params) {
    return request({
      url: '/api/finance/account-subject/list',
      method: 'get',
      params
    })
  },

  /**
   * 获取会计科目树
   */
  getAccountSubjectTree() {
    return request({
      url: '/api/finance/account-subject/tree',
      method: 'get'
    })
  }
}
