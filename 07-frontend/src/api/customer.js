import request from '@/utils/request'

/**
 * 客户API接口封装
 * 提供统一的错误处理、重试机制和请求队列管理
 */

class CustomerApi {
  constructor() {
    this.requestQueue = []
    this.isRequesting = false
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2
    }
  }

  /**
   * 带重试机制的请求方法
   */
  async requestWithRetry(apiCall, config = {}) {
    const { maxRetries = 3, retryDelay = 1000 } = { ...this.retryConfig, ...config }
    let lastError

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await apiCall()
        console.log(`✅ API请求成功，尝试次数: ${attempt + 1}`)
        return result
      } catch (error) {
        lastError = error
        console.warn(`⚠️ API请求失败，第 ${attempt + 1} 次重试:`, error.message)

        // 如果是最后一次尝试，直接抛出错误
        if (attempt === maxRetries - 1) {
          throw new Error(`API请求失败，已重试 ${maxRetries} 次: ${error.message}`)
        }

        // 指数退避，避免频繁重试
        const delay = retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * 获取客户列表
   */
  async getCustomers(params = {}) {
    const { page = 1, pageSize = 20, customerType, status, region, search } = params

    return this.requestWithRetry(async () => {
      const response = await request.get('/customers', {
        params: {
          page,
          pageSize,
          customerType,
          status,
          region,
          search
        }
      })

      if (response.success) {
        return {
          success: true,
          data: {
            list: response.data.list || [],
            total: response.data.total || 0,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
          }
        }
      } else {
        throw new Error(response.message || '获取客户列表失败')
      }
    })
  }

  /**
   * 根据ID获取客户详情
   */
  async getCustomerById(id) {
    return this.requestWithRetry(async () => {
      const response = await request.get(`/customers/${id}`)

      if (response.success) {
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '获取客户详情失败')
      }
    })
  }

  /**
   * 创建客户
   */
  async createCustomer(customerData) {
    return this.requestWithRetry(async () => {
      const response = await request.post('/customers', {
        data: {
          customerCode: customerData.customerCode,
          customerName: customerData.customerName,
          customerType: customerData.customerType || 'regular',
          status: customerData.status || 'active',
          contactPerson: customerData.contactPerson,
          contactPhone: customerData.contactPhone,
          contactEmail: customerData.contactEmail,
          contactAddress: customerData.contactAddress,
          company: customerData.company || customerData.customerName,
          industry: customerData.industry,
          region: customerData.region,
          taxNumber: customerData.taxNumber,
          creditLimit: parseFloat(customerData.creditLimit) || 0,
          salesPerson: customerData.salesPerson,
          remark: customerData.remark,
          createdBy: customerData.createdBy || 'admin'
        }
      })

      if (response.success) {
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '创建客户失败')
      }
    })
  }

  /**
   * 更新客户
   */
  async updateCustomer(id, customerData) {
    return this.requestWithRetry(async () => {
      const response = await request.put(`/customers/${id}`, {
        data: {
          customerCode: customerData.customerCode,
          customerName: customerData.customerName,
          customerType: customerData.customerType,
          status: customerData.status,
          contactPerson: customerData.contactPerson,
          contactPhone: customerData.contactPhone,
          contactEmail: customerData.contactEmail,
          contactAddress: customerData.contactAddress,
          company: customerData.company,
          companyAddress: customerData.companyAddress,
          industry: customerData.industry,
          region: customerData.region,
          taxNumber: customerData.taxNumber,
          creditLevel: customerData.creditLevel,
          creditLimit: parseFloat(customerData.creditLimit) || 0,
          salesPerson: customerData.salesPerson,
          source: customerData.source,
          tags: customerData.tags,
          remark: customerData.remark,
          updatedBy: customerData.updatedBy || 'admin'
        }
      })

      if (response.success) {
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '更新客户失败')
      }
    })
  }

  /**
   * 删除客户
   */
  async deleteCustomer(id) {
    return this.requestWithRetry(async () => {
      const response = await request.delete(`/customers/${id}`)

      if (response.success) {
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '删除客户失败')
      }
    })
  }

  /**
   * 批量删除客户
   */
  async batchDeleteCustomers(ids) {
    return this.requestWithRetry(async () => {
      const response = await request.post('/customers/batch-delete', {
        data: { ids }
      })

      if (response.success) {
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '批量删除客户失败')
      }
    })
  }

  /**
   * 获取客户统计信息
   */
  async getCustomerStats() {
    return this.requestWithRetry(async () => {
      const response = await request.get('/customers/statistics/overview')

      if (response.success) {
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '获取客户统计信息失败')
      }
    })
  }

  /**
   * 获取客户数据备份列表
   */
  async getBackupList() {
    return this.requestWithRetry(async () => {
      const response = await request.get('/customers/backups')

      if (response.success) {
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '获取备份列表失败')
      }
    })
  }

  /**
   * 从备份恢复客户数据
   */
  async restoreCustomerData(backupId, targetTable = 'customers') {
    return this.requestWithRetry(async () => {
      const response = await request.post('/customers/restore', {
        data: { backupId, targetTable }
      })

      if (response.success) {
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '恢复客户数据失败')
      }
    })
  }

  /**
   * 手动触发备份
   */
  async triggerBackup() {
    return this.requestWithRetry(async () => {
      const response = await request.post('/customers/backup')

      if (response.success) {
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '手动备份失败')
      }
    })
  }

  /**
   * 数据健康检查
   */
  async healthCheck() {
    return this.requestWithRetry(async () => {
      const response = await request.get('/customers/health-check')

      if (response.success) {
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '健康检查失败')
      }
    })
  }

  /**
   * 处理同步队列
   */
  async processSyncQueue(queue) {
    if (!queue || queue.length === 0) {
      return { success: true, data: { processed: 0 } }
    }

    const results = []
    let processed = 0
    let failed = 0

    for (const item of queue) {
      try {
        let result
        switch (item.type) {
          case 'create':
            result = await this.createCustomer(item.data)
            break
          case 'update':
            result = await this.updateCustomer(item.data.id, item.data)
            break
          case 'delete':
            result = await this.deleteCustomer(item.data.id)
            break
          default:
            throw new Error(`未知的队列操作类型: ${item.type}`)
        }

        if (result.success) {
          results.push({ item, status: 'success', data: result.data })
          processed++
        } else {
          results.push({ item, status: 'failed', error: result.message })
          failed++
        }
      } catch (error) {
        results.push({ item, status: 'failed', error: error.message })
        failed++
      }
    }

    return {
      success: failed === 0,
      data: {
        processed,
        failed,
        results
      }
    }
  }

  /**
   * 网络状态监测
   */
  isOnline() {
    return navigator.onLine
  }

  /**
   * 获取请求状态
   */
  getRequestStatus() {
    return {
      isRequesting: this.isRequesting,
      queueLength: this.requestQueue.length,
      isOnline: this.isOnline()
    }
  }

  /**
   * 清空请求队列
   */
  clearQueue() {
    this.requestQueue = []
    console.log('✅ 请求队列已清空')
  }
}

// 创建单例实例
const customerApi = new CustomerApi()

export default customerApi
export { CustomerApi }