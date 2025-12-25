/**
 * 错误代码定义工具
 * 用于统一管理系统中的错误代码和错误类型
 */

import { eventBus } from '../../services/event-bus'

class ErrorCodes {
  constructor() {
    this.codes = new Map()
    this.categories = new Map()
    this.errorStats = new Map()
    
    // 初始化错误代码
    this.initializeErrorCodes()
  }

  /**
   * 初始化错误代码
   */
  initializeErrorCodes() {
    // 系统错误 (1000-1999)
    this.addCategory('system', {
      name: '系统错误',
      description: '系统级别的基础错误',
      range: '1000-1999'
    })

    this.addErrorCode('1000', {
      code: '1000',
      name: 'SYSTEM_UNKNOWN_ERROR',
      category: 'system',
      severity: 'high',
      message: '系统未知错误',
      description: '发生了未知的系统错误',
      httpStatus: 500,
      retry: true,
      retryDelay: 1000,
      maxRetries: 3,
      userAction: '请稍后重试，如问题持续存在请联系技术支持'
    })

    this.addErrorCode('1001', {
      code: '1001',
      name: 'SYSTEM_MAINTENANCE',
      category: 'system',
      severity: 'medium',
      message: '系统维护中',
      description: '系统正在进行维护，暂时无法提供服务',
      httpStatus: 503,
      retry: true,
      retryDelay: 30000,
      maxRetries: 1,
      userAction: '系统维护中，请稍后访问',
      autoRecovery: 'retry_with_backoff'
    })

    this.addErrorCode('1002', {
      code: '1002',
      name: 'SYSTEM_OVERLOAD',
      category: 'system',
      severity: 'medium',
      message: '系统负载过高',
      description: '系统当前负载过高，暂时无法处理请求',
      httpStatus: 503,
      retry: true,
      retryDelay: 5000,
      maxRetries: 2,
      userAction: '系统繁忙，请稍后重试',
      autoRecovery: 'exponential_backoff'
    })

    // 认证错误 (2000-2999)
    this.addCategory('authentication', {
      name: '认证错误',
      description: '用户认证相关的错误',
      range: '2000-2999'
    })

    this.addErrorCode('2000', {
      code: '2000',
      name: 'AUTH_CREDENTIALS_INVALID',
      category: 'authentication',
      severity: 'high',
      message: '用户名或密码错误',
      description: '提供的用户名或密码不正确',
      httpStatus: 401,
      retry: true,
      retryDelay: 0,
      maxRetries: 3,
      userAction: '请检查用户名和密码，重新输入',
      securityConcern: true,
      autoRecovery: 'show_password_reset'
    })

    this.addErrorCode('2001', {
      code: '2001',
      name: 'AUTH_TOKEN_EXPIRED',
      category: 'authentication',
      severity: 'medium',
      message: '登录已过期',
      description: '用户登录状态已过期，需要重新登录',
      httpStatus: 401,
      retry: false,
      userAction: '请重新登录',
      autoRecovery: 'auto_relogin'
    })

    this.addErrorCode('2002', {
      code: '2002',
      name: 'AUTH_ACCOUNT_LOCKED',
      category: 'authentication',
      severity: 'high',
      message: '账号已被锁定',
      description: '由于多次登录失败，账号已被临时锁定',
      httpStatus: 423,
      retry: false,
      userAction: '账号已被锁定，请等待一段时间后重试或联系管理员',
      securityConcern: true,
      recoveryStrategy: 'contact_admin'
    })

    this.addErrorCode('2003', {
      code: '2003',
      name: 'AUTH_ACCOUNT_NOT_ACTIVATED',
      category: 'authentication',
      severity: 'medium',
      message: '账号未激活',
      description: '账号注册后未完成邮箱验证',
      httpStatus: 403,
      retry: false,
      userAction: '请检查邮箱并完成账号激活',
      autoRecovery: 'resend_activation_email'
    })

    this.addErrorCode('2004', {
      code: '2004',
      name: 'AUTH_INSUFFICIENT_PERMISSIONS',
      category: 'authentication',
      severity: 'high',
      message: '权限不足',
      description: '当前用户没有执行此操作的权限',
      httpStatus: 403,
      retry: false,
      userAction: '请联系管理员申请相应权限',
      securityConcern: true
    })

    // 数据错误 (3000-3999)
    this.addCategory('data', {
      name: '数据错误',
      description: '数据操作相关的错误',
      range: '3000-3999'
    })

    this.addErrorCode('3000', {
      code: '3000',
      name: 'DATA_NOT_FOUND',
      category: 'data',
      severity: 'medium',
      message: '数据不存在',
      description: '请求的数据不存在或已被删除',
      httpStatus: 404,
      retry: false,
      userAction: '请检查数据是否正确，或联系管理员确认',
      dataIntegrityIssue: true
    })

    this.addErrorCode('3001', {
      code: '3001',
      name: 'DATA_VALIDATION_FAILED',
      category: 'data',
      severity: 'medium',
      message: '数据验证失败',
      description: '提交的数据不符合验证规则',
      httpStatus: 400,
      retry: false,
      userAction: '请检查输入数据的格式和完整性',
      autoRecovery: 'show_validation_errors'
    })

    this.addErrorCode('3002', {
      code: '3002',
      name: 'DATA_DUPLICATE',
      category: 'data',
      severity: 'medium',
      message: '数据重复',
      description: '提交的数据已存在，违反唯一性约束',
      httpStatus: 409,
      retry: false,
      userAction: '数据已存在，请检查是否需要更新现有数据',
      autoRecovery: 'suggest_update_existing'
    })

    this.addErrorCode('3003', {
      code: '3003',
      name: 'DATA_CONFLICT',
      category: 'data',
      severity: 'high',
      message: '数据冲突',
      description: '数据已被其他用户修改，存在冲突',
      httpStatus: 409,
      retry: true,
      retryDelay: 1000,
      maxRetries: 2,
      userAction: '数据已被修改，请刷新后重试',
      autoRecovery: 'merge_conflict_resolution'
    })

    this.addErrorCode('3004', {
      code: '3004',
      name: 'DATA_CORRUPTION',
      category: 'data',
      severity: 'critical',
      message: '数据损坏',
      description: '检测到数据损坏或不完整',
      httpStatus: 500,
      retry: false,
      userAction: '数据出现问题，请联系技术支持',
      critical: true,
      dataIntegrityIssue: true,
      recoveryStrategy: 'data_restoration'
    })

    // 业务逻辑错误 (4000-4999)
    this.addCategory('business', {
      name: '业务逻辑错误',
      description: '业务规则相关的错误',
      range: '4000-4999'
    })

    this.addErrorCode('4000', {
      code: '4000',
      name: 'BUSINESS_RULE_VIOLATION',
      category: 'business',
      severity: 'medium',
      message: '违反业务规则',
      description: '操作违反了系统的业务规则',
      httpStatus: 400,
      retry: false,
      userAction: '请检查操作是否符合业务规则',
      autoRecovery: 'show_rule_explanation'
    })

    this.addErrorCode('4001', {
      code: '4001',
      name: 'BUSINESS_QUOTA_EXCEEDED',
      category: 'business',
      severity: 'medium',
      message: '超出配额限制',
      description: '操作超出了系统设定的配额限制',
      httpStatus: 429,
      retry: true,
      retryDelay: 60000,
      maxRetries: 1,
      userAction: '已达到配额限制，请升级套餐或等待重置',
      autoRecovery: 'show_upgrade_options'
    })

    this.addErrorCode('4002', {
      code: '4002',
      name: 'BUSINESS_OPERATION_NOT_ALLOWED',
      category: 'business',
      severity: 'high',
      message: '操作不被允许',
      description: '当前状态下不允许执行此操作',
      httpStatus: 403,
      retry: false,
      userAction: '请检查操作时机或联系管理员',
      autoRecovery: 'show_operation_requirements'
    })

    // 网络错误 (5000-5999)
    this.addCategory('network', {
      name: '网络错误',
      description: '网络通信相关的错误',
      range: '5000-5999'
    })

    this.addErrorCode('5000', {
      code: '5000',
      name: 'NETWORK_CONNECTION_FAILED',
      category: 'network',
      severity: 'high',
      message: '网络连接失败',
      description: '无法建立网络连接',
      httpStatus: 0,
      retry: true,
      retryDelay: 2000,
      maxRetries: 3,
      userAction: '请检查网络连接，重试或更换网络环境',
      autoRecovery: 'exponential_backoff'
    })

    this.addErrorCode('5001', {
      code: '5001',
      name: 'NETWORK_TIMEOUT',
      category: 'network',
      severity: 'medium',
      message: '网络请求超时',
      description: '网络请求超时，服务器未及时响应',
      httpStatus: 408,
      retry: true,
      retryDelay: 5000,
      maxRetries: 2,
      userAction: '网络响应较慢，请稍后重试',
      autoRecovery: 'increase_timeout'
    })

    this.addErrorCode('5002', {
      code: '5002',
      name: 'NETWORK_RATE_LIMIT',
      category: 'network',
      severity: 'medium',
      message: '请求频率过高',
      description: '请求频率超过了系统限制',
      httpStatus: 429,
      retry: true,
      retryDelay: 60000,
      maxRetries: 1,
      userAction: '请求过于频繁，请稍后重试',
      autoRecovery: 'throttle_requests'
    })

    // 文件操作错误 (6000-6999)
    this.addCategory('file', {
      name: '文件操作错误',
      description: '文件上传下载相关的错误',
      range: '6000-6999'
    })

    this.addErrorCode('6000', {
      code: '6000',
      name: 'FILE_TOO_LARGE',
      category: 'file',
      severity: 'medium',
      message: '文件过大',
      description: '上传的文件大小超过了系统限制',
      httpStatus: 413,
      retry: false,
      userAction: '请压缩文件或选择较小的文件',
      autoRecovery: 'show_compression_options'
    })

    this.addErrorCode('6001', {
      code: '6001',
      name: 'FILE_FORMAT_NOT_SUPPORTED',
      category: 'file',
      severity: 'medium',
      message: '不支持的文件格式',
      description: '上传的文件格式不被支持',
      httpStatus: 415,
      retry: false,
      userAction: '请使用支持的文件格式',
      autoRecovery: 'show_supported_formats'
    })

    this.addErrorCode('6002', {
      code: '6002',
      name: 'FILE_UPLOAD_FAILED',
      category: 'file',
      severity: 'high',
      message: '文件上传失败',
      description: '文件上传过程中发生错误',
      httpStatus: 500,
      retry: true,
      retryDelay: 3000,
      maxRetries: 2,
      userAction: '文件上传失败，请重试或联系技术支持',
      autoRecovery: 'chunked_upload'
    })

    // 第三方服务错误 (7000-7999)
    this.addCategory('third_party', {
      name: '第三方服务错误',
      description: '外部服务集成相关的错误',
      range: '7000-7999'
    })

    this.addErrorCode('7000', {
      code: '7000',
      name: 'THIRD_PARTY_SERVICE_UNAVAILABLE',
      category: 'third_party',
      severity: 'medium',
      message: '第三方服务不可用',
      description: '依赖的第三方服务当前不可用',
      httpStatus: 503,
      retry: true,
      retryDelay: 10000,
      maxRetries: 2,
      userAction: '外部服务暂时不可用，请稍后重试',
      autoRecovery: 'fallback_service'
    })

    this.addErrorCode('7001', {
      code: '7001',
      name: 'THIRD_PARTY_API_ERROR',
      category: 'third_party',
      severity: 'medium',
      message: '第三方API错误',
      description: '第三方API返回错误响应',
      httpStatus: 502,
      retry: true,
      retryDelay: 5000,
      maxRetries: 1,
      userAction: '外部服务出现问题，请稍后重试',
      autoRecovery: 'api_error_handling'
    })
  }

  /**
   * 添加错误代码
   */
  addErrorCode(code, errorInfo) {
    this.codes.set(code, {
      ...errorInfo,
      createdAt: new Date().toISOString()
    })

    // 统计错误代码
    if (!this.errorStats.has(code)) {
      this.errorStats.set(code, {
        count: 0,
        firstOccurrence: null,
        lastOccurrence: null
      })
    }

    // 触发事件
    eventBus.emit('error-code-added', { code, errorInfo })
  }

  /**
   * 添加错误分类
   */
  addCategory(categoryId, categoryInfo) {
    this.categories.set(categoryId, {
      ...categoryInfo,
      createdAt: new Date().toISOString()
    })
  }

  /**
   * 获取错误代码信息
   */
  getErrorCode(code) {
    return this.codes.get(code)
  }

  /**
   * 根据名称获取错误代码
   */
  getErrorCodeByName(name) {
    for (const [code, info] of this.codes) {
      if (info.name === name) {
        return { code, ...info }
      }
    }
    return null
  }

  /**
   * 获取分类下的所有错误代码
   */
  getErrorCodesByCategory(category) {
    const codes = []
    for (const [code, info] of this.codes) {
      if (info.category === category) {
        codes.push({ code, ...info })
      }
    }
    return codes
  }

  /**
   * 按严重程度获取错误代码
   */
  getErrorCodesBySeverity(severity) {
    const codes = []
    for (const [code, info] of this.codes) {
      if (info.severity === severity) {
        codes.push({ code, ...info })
      }
    }
    return codes
  }

  /**
   * 记录错误发生
   */
  recordError(code, context = {}) {
    const errorCode = this.getErrorCode(code)
    if (!errorCode) {
      console.warn(`Unknown error code: ${code}`)
      return
    }

    // 更新统计
    const stats = this.errorStats.get(code)
    if (stats) {
      stats.count++
      stats.lastOccurrence = new Date().toISOString()
      if (!stats.firstOccurrence) {
        stats.firstOccurrence = stats.lastOccurrence
      }
    }

    // 触发事件
    eventBus.emit('error-occurred', {
      code,
      errorCode,
      context,
      timestamp: new Date().toISOString()
    })

    // 记录关键错误
    if (errorCode.severity === 'critical' || errorCode.critical) {
      this.handleCriticalError(code, errorCode, context)
    }

    // 记录安全相关错误
    if (errorCode.securityConcern) {
      this.handleSecurityError(code, errorCode, context)
    }
  }

  /**
   * 处理关键错误
   */
  handleCriticalError(code, errorCode, context) {
    eventBus.emit('critical-error', {
      code,
      errorCode,
      context,
      timestamp: new Date().toISOString()
    })

    // 可以在这里添加自动通知逻辑
    // 例如：发送告警、记录到日志系统等
    console.error(`CRITICAL ERROR [${code}]: ${errorCode.message}`, context)
  }

  /**
   * 处理安全相关错误
   */
  handleSecurityError(code, errorCode, context) {
    eventBus.emit('security-error', {
      code,
      errorCode,
      context,
      timestamp: new Date().toISOString()
    })

    // 可以在这里添加安全监控逻辑
    console.warn(`SECURITY ERROR [${code}]: ${errorCode.message}`, context)
  }

  /**
   * 获取错误统计
   */
  getErrorStats(options = {}) {
    const { category, severity, since, limit = 50 } = options
    let stats = []

    for (const [code, data] of this.errorStats) {
      const errorCode = this.getErrorCode(code)
      if (!errorCode) continue

      // 应用过滤条件
      if (category && errorCode.category !== category) continue
      if (severity && errorCode.severity !== severity) continue
      if (since && new Date(data.lastOccurrence) < new Date(since)) continue

      stats.push({
        code,
        name: errorCode.name,
        message: errorCode.message,
        category: errorCode.category,
        severity: errorCode.severity,
        count: data.count,
        firstOccurrence: data.firstOccurrence,
        lastOccurrence: data.lastOccurrence,
        frequency: this.calculateFrequency(data.count, data.firstOccurrence)
      })
    }

    return stats
      .sort((a, b) => {
        // 优先按出现次数排序
        if (b.count !== a.count) {
          return b.count - a.count
        }
        // 其次按最近发生时间排序
        return new Date(b.lastOccurrence) - new Date(a.lastOccurrence)
      })
      .slice(0, limit)
  }

  /**
   * 计算错误频率
   */
  calculateFrequency(count, firstOccurrence) {
    if (!firstOccurrence) return 0

    const daysSinceFirst = (new Date() - new Date(firstOccurrence)) / (1000 * 60 * 60 * 24)
    if (daysSinceFirst < 1) return count

    return Math.round(count / daysSinceFirst * 100) / 100
  }

  /**
   * 获取分类统计
   */
  getCategoryStats() {
    const stats = {}
    for (const [categoryId, category] of this.categories) {
      const categoryCodes = this.getErrorCodesByCategory(categoryId)
      let totalCount = 0
      let criticalCount = 0
      let lastOccurrence = null

      categoryCodes.forEach(({ code }) => {
        const codeStats = this.errorStats.get(code)
        if (codeStats) {
          totalCount += codeStats.count
          const errorCode = this.getErrorCode(code)
          if (errorCode.critical || errorCode.severity === 'critical') {
            criticalCount += codeStats.count
          }
          if (codeStats.lastOccurrence && 
              (!lastOccurrence || new Date(codeStats.lastOccurrence) > new Date(lastOccurrence))) {
            lastOccurrence = codeStats.lastOccurrence
          }
        }
      })

      stats[categoryId] = {
        ...category,
        codeCount: categoryCodes.length,
        totalOccurrences: totalCount,
        criticalOccurrences: criticalCount,
        lastOccurrence,
        errorCodes: categoryCodes.map(({ code, name, message, severity }) => ({
          code,
          name,
          message,
          severity,
          count: this.errorStats.get(code)?.count || 0
        }))
      }
    }

    return stats
  }

  /**
   * 获取趋势分析
   */
  getTrendAnalysis(days = 7) {
    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - days)

    const dailyStats = {}
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      dailyStats[dateKey] = {
        total: 0,
        byCategory: {},
        bySeverity: {}
      }
    }

    // 统计每日错误数据
    for (const [code, data] of this.errorStats) {
      const errorCode = this.getErrorCode(code)
      if (!errorCode || !data.lastOccurrence) continue

      const occurrenceDate = new Date(data.lastOccurrence).toISOString().split('T')[0]
      if (dailyStats[occurrenceDate]) {
        dailyStats[occurrenceDate].total++
        
        // 按分类统计
        if (!dailyStats[occurrenceDate].byCategory[errorCode.category]) {
          dailyStats[occurrenceDate].byCategory[errorCode.category] = 0
        }
        dailyStats[occurrenceDate].byCategory[errorCode.category]++

        // 按严重程度统计
        if (!dailyStats[occurrenceDate].bySeverity[errorCode.severity]) {
          dailyStats[occurrenceDate].bySeverity[errorCode.severity] = 0
        }
        dailyStats[occurrenceDate].bySeverity[errorCode.severity]++
      }
    }

    return {
      period: `${days}天`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dailyStats,
      summary: this.calculateTrendSummary(dailyStats)
    }
  }

  /**
   * 计算趋势摘要
   */
  calculateTrendSummary(dailyStats) {
    const total = Object.values(dailyStats).reduce((sum, day) => sum + day.total, 0)
    const daysWithErrors = Object.values(dailyStats).filter(day => day.total > 0).length
    const maxDailyErrors = Math.max(...Object.values(dailyStats).map(day => day.total))
    const avgDailyErrors = Math.round(total / Object.keys(dailyStats).length * 100) / 100

    return {
      totalErrors: total,
      daysWithErrors,
      maxDailyErrors,
      avgDailyErrors,
      errorRate: Math.round((daysWithErrors / Object.keys(dailyStats).length) * 100 * 100) / 100
    }
  }

  /**
   * 清除错误统计
   */
  clearStats(category = null) {
    if (category) {
      const categoryCodes = this.getErrorCodesByCategory(category)
      categoryCodes.forEach(({ code }) => {
        this.errorStats.delete(code)
      })
    } else {
      this.errorStats.clear()
    }

    eventBus.emit('error-stats-cleared', { category })
  }

  /**
   * 导出错误代码
   */
  exportCodes(format = 'json') {
    const codes = {}
    for (const [code, info] of this.codes) {
      codes[code] = info
    }

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(codes, null, 2)
      case 'csv':
        return this.codesToCSV(codes)
      default:
        return codes
    }
  }

  /**
   * 转换为CSV格式
   */
  codesToCSV(codes) {
    const headers = ['代码', '名称', '消息', '分类', '严重程度', 'HTTP状态', '是否可重试']
    const rows = [headers.join(',')]

    for (const [code, info] of Object.entries(codes)) {
      const row = [
        code,
        info.name,
        info.message,
        info.category,
        info.severity,
        info.httpStatus || '',
        info.retry || false
      ].map(field => `"${field}"`)
      
      rows.push(row.join(','))
    }

    return rows.join('\n')
  }
}

// 创建单例实例
export const errorCodes = new ErrorCodes()

// 导出类和实用函数
export {
  ErrorCodes
}

// 便捷函数
export function getErrorCode(code) {
  return errorCodes.getErrorCode(code)
}

export function recordError(code, context = {}) {
  return errorCodes.recordError(code, context)
}

export function getErrorStats(options = {}) {
  return errorCodes.getErrorStats(options)
}

export function getTrendAnalysis(days = 7) {
  return errorCodes.getTrendAnalysis(days)
}