/**
 * 人力资源-员工管理相关API
 */
import request from '@/services/utils/request'

/**
 * 员工管理API
 */
export const employeeApi = {
  /**
   * 获取员工列表
   * @param {Object} params - 查询参数
   */
  getEmployeeList(params) {
    return request({
      url: '/api/hr/employee/list',
      method: 'get',
      params
    })
  },

  /**
   * 获取员工详情
   * @param {String} id - 员工ID
   */
  getEmployeeDetail(id) {
    return request({
      url: `/api/hr/employee/${id}`,
      method: 'get'
    })
  },

  /**
   * 创建员工
   * @param {Object} data - 员工数据
   */
  createEmployee(data) {
    return request({
      url: '/api/hr/employee/create',
      method: 'post',
      data
    })
  },

  /**
   * 更新员工信息
   * @param {Object} data - 员工数据
   */
  updateEmployee(data) {
    return request({
      url: '/api/hr/employee/update',
      method: 'put',
      data
    })
  },

  /**
   * 删除员工
   * @param {String} id - 员工ID
   */
  deleteEmployee(id) {
    return request({
      url: `/api/hr/employee/${id}`,
      method: 'delete'
    })
  },

  /**
   * 获取员工统计
   */
  getEmployeeStats() {
    return request({
      url: '/api/hr/employee/stats',
      method: 'get'
    })
  }
}

/**
 * 员工入职API
 */
export const onboardingApi = {
  /**
   * 创建入职申请
   * @param {Object} data - 入职数据
   */
  createOnboarding(data) {
    return request({
      url: '/api/hr/onboarding/create',
      method: 'post',
      data
    })
  },

  /**
   * 获取入职列表
   * @param {Object} params - 查询参数
   */
  getOnboardingList(params) {
    return request({
      url: '/api/hr/onboarding/list',
      method: 'get',
      params
    })
  },

  /**
   * 审批入职
   * @param {Object} data - 审批数据
   */
  approveOnboarding(data) {
    return request({
      url: '/api/hr/onboarding/approve',
      method: 'post',
      data
    })
  }
}

/**
 * 员工离职API
 */
export const offboardingApi = {
  /**
   * 创建离职申请
   * @param {Object} data - 离职数据
   */
  createOffboarding(data) {
    return request({
      url: '/api/hr/offboarding/create',
      method: 'post',
      data
    })
  },

  /**
   * 获取离职列表
   * @param {Object} params - 查询参数
   */
  getOffboardingList(params) {
    return request({
      url: '/api/hr/offboarding/list',
      method: 'get',
      params
    })
  },

  /**
   * 审批离职
   * @param {Object} data - 审批数据
   */
  approveOffboarding(data) {
    return request({
      url: '/api/hr/offboarding/approve',
      method: 'post',
      data
    })
  }
}

/**
 * 员工调动API
 */
export const transferApi = {
  /**
   * 创建调动申请
   * @param {Object} data - 调动数据
   */
  createTransfer(data) {
    return request({
      url: '/api/hr/transfer/create',
      method: 'post',
      data
    })
  },

  /**
   * 获取调动列表
   * @param {Object} params - 查询参数
   */
  getTransferList(params) {
    return request({
      url: '/api/hr/transfer/list',
      method: 'get',
      params
    })
  },

  /**
   * 审批调动
   * @param {Object} data - 审批数据
   */
  approveTransfer(data) {
    return request({
      url: '/api/hr/transfer/approve',
      method: 'post',
      data
    })
  }
}

/**
 * 薪资管理API
 */
export const salaryApi = {
  /**
   * 获取薪资列表
   * @param {Object} params - 查询参数
   */
  getSalaryList(params) {
    return request({
      url: '/api/hr/salary/list',
      method: 'get',
      params
    })
  },

  /**
   * 获取薪资详情
   * @param {String} id - 薪资ID
   */
  getSalaryDetail(id) {
    return request({
      url: `/api/hr/salary/${id}`,
      method: 'get'
    })
  },

  /**
   * 创建薪资
   * @param {Object} data - 薪资数据
   */
  createSalary(data) {
    return request({
      url: '/api/hr/salary/create',
      method: 'post',
      data
    })
  },

  /**
   * 更新薪资
   * @param {Object} data - 薪资数据
   */
  updateSalary(data) {
    return request({
      url: '/api/hr/salary/update',
      method: 'put',
      data
    })
  },

  /**
   * 批量发放薪资
   * @param {Object} data - 批量数据
   */
  batchPaySalary(data) {
    return request({
      url: '/api/hr/salary/batch-pay',
      method: 'post',
      data
    })
  }
}

/**
 * 绩效考核API
 */
export const performanceApi = {
  /**
   * 获取绩效列表
   * @param {Object} params - 查询参数
   */
  getPerformanceList(params) {
    return request({
      url: '/api/hr/performance/list',
      method: 'get',
      params
    })
  },

  /**
   * 获取绩效详情
   * @param {String} id - 绩效ID
   */
  getPerformanceDetail(id) {
    return request({
      url: `/api/hr/performance/${id}`,
      method: 'get'
    })
  },

  /**
   * 创建绩效考核
   * @param {Object} data - 绩效数据
   */
  createPerformance(data) {
    return request({
      url: '/api/hr/performance/create',
      method: 'post',
      data
    })
  },

  /**
   * 提交考核评分
   * @param {Object} data - 评分数据
   */
  submitScore(data) {
    return request({
      url: '/api/hr/performance/score',
      method: 'post',
      data
    })
  },

  /**
   * 审批绩效
   * @param {Object} data - 审批数据
   */
  approvePerformance(data) {
    return request({
      url: '/api/hr/performance/approve',
      method: 'post',
      data
    })
  }
}

/**
 * 部门API
 */
export const departmentApi = {
  /**
   * 获取部门列表
   */
  getDepartmentList() {
    return request({
      url: '/api/hr/department/list',
      method: 'get'
    })
  },

  /**
   * 获取部门树
   */
  getDepartmentTree() {
    return request({
      url: '/api/hr/department/tree',
      method: 'get'
    })
  }
}

/**
 * 职位API
 */
export const positionApi = {
  /**
   * 获取职位列表
   */
  getPositionList() {
    return request({
      url: '/api/hr/position/list',
      method: 'get'
    })
  }
}
