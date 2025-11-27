/**
 * 错误消息管理工具
 * 用于统一管理和自定义错误消息显示
 */

import { eventBus } from '../services/event-bus'
import { getErrorCode } from './error-codes'

class ErrorMessages {
  constructor() {
    this.templates = new Map()
    this.customMessages = new Map()
    this.messageHistory = []
    this.userPreferences = this.loadUserPreferences()
    
    // 初始化默认消息模板
    this.initializeMessageTemplates()
  }

  /**
   * 初始化默认消息模板
   */
  initializeMessageTemplates() {
    // 基础模板
    this.addTemplate('basic', {
      title: '{{message}}',
      description: '{{description}}',
      type: 'info',
      showIcon: true,
      showClose: true,
      autoClose: false,
      duration: 5000
    })

    // 错误模板
    this.addTemplate('error', {
      title: '错误',
      message: '{{message}}',
      description: '{{description}}',
      type: 'error',
      showIcon: true,
      showClose: true,
      autoClose: false,
      actions: [
        {
          label: '重试',
          type: 'primary',
          action: 'retry'
        },
        {
          label: '查看详情',
          type: 'secondary',
          action: 'show_details'
        }
      ]
    })

    // 成功模板
    this.addTemplate('success', {
      title: '操作成功',
      message: '{{message}}',
      description: '{{description}}',
      type: 'success',
      showIcon: true,
      showClose: true,
      autoClose: true,
      duration: 3000
    })

    // 警告模板
    this.addTemplate('warning', {
      title: '警告',
      message: '{{message}}',
      description: '{{description}}',
      type: 'warning',
      showIcon: true,
      showClose: true,
      autoClose: false,
      actions: [
        {
          label: '继续',
          type: 'primary',
          action: 'continue'
        },
        {
          label: '取消',
          type: 'secondary',
          action: 'cancel'
        }
      ]
    })

    // 网络错误模板
    this.addTemplate('network-error', {
      title: '网络连接失败',
      message: '无法连接到服务器，请检查您的网络连接。',
      description: '{{additionalInfo}}',
      type: 'error',
      showIcon: true,
      showClose: true,
      autoClose: false,
      actions: [
        {
          label: '重试',
          type: 'primary',
          action: 'retry'
        },
        {
          label: '离线模式',
          type: 'secondary',
          action: 'offline_mode'
        }
      ],
      tips: [
        '检查网络连接',
        '尝试刷新页面',
        '使用其他网络环境'
      ]
    })

    // 认证错误模板
    this.addTemplate('auth-error', {
      title: '身份验证失败',
      message: '{{message}}',
      description: '{{description}}',
      type: 'error',
      showIcon: true,
      showClose: true,
      autoClose: false,
      actions: [
        {
          label: '重新登录',
          type: 'primary',
          action: 'relogin'
        },
        {
          label: '忘记密码',
          type: 'secondary',
          action: 'forgot_password'
        }
      ],
      security: true
    })

    // 权限错误模板
    this.addTemplate('permission-error', {
      title: '权限不足',
      message: '您没有执行此操作的权限。',
      description: '{{description}}',
      type: 'error',
      showIcon: true,
      showClose: true,
      autoClose: false,
      actions: [
        {
          label: '申请权限',
          type: 'primary',
          action: 'request_permission'
        },
        {
          label: '联系管理员',
          type: 'secondary',
          action: 'contact_admin'
        }
      ]
    })

    // 数据验证错误模板
    this.addTemplate('validation-error', {
      title: '数据验证失败',
      message: '提交的数据不符合要求。',
      description: '{{description}}',
      type: 'error',
      showIcon: true,
      showClose: true,
      autoClose: false,
      actions: [
        {
          label: '修改数据',
          type: 'primary',
          action: 'edit_data'
        },
        {
          label: '查看帮助',
          type: 'secondary',
          action: 'show_help'
        }
      ],
      showValidationErrors: true
    })

    // 文件上传错误模板
    this.addTemplate('file-upload-error', {
      title: '文件上传失败',
      message: '{{message}}',
      description: '{{description}}',
      type: 'error',
      showIcon: true,
      showClose: true,
      autoClose: false,
      actions: [
        {
          label: '重新选择',
          type: 'primary',
          action: 'reselect_file'
        },
        {
          label: '压缩文件',
          type: 'secondary',
          action: 'compress_file'
        }
      ],
      fileSpecific: true
    })

    // 操作确认模板
    this.addTemplate('confirmation', {
      title: '{{title}}',
      message: '{{message}}',
      description: '{{description}}',
      type: 'warning',
      showIcon: true,
      showClose: false,
      autoClose: false,
      confirmText: '确认',
      cancelText: '取消',
      confirmAction: 'confirm',
      cancelAction: 'cancel',
      requireConfirmation: true
    })

    // 加载状态模板
    this.addTemplate('loading', {
      title: '{{title || "正在处理"}}',
      message: '{{message || "请稍候..."}}',
      type: 'info',
      showIcon: true,
      showClose: false,
      autoClose: false,
      showProgress: false,
      progress: 0,
      cancellable: true,
      cancelAction: 'cancel_operation'
    })

    // 进度模板
    this.addTemplate('progress', {
      title: '{{title}}',
      message: '{{message}}',
      description: '{{description}}',
      type: 'info',
      showIcon: true,
      showClose: false,
      autoClose: false,
      showProgress: true,
      progress: '{{progress}}',
      showPercentage: true,
      cancellable: true,
      cancelAction: 'cancel_operation'
    })
  }

  /**
   * 添加消息模板
   */
  addTemplate(id, template) {
    this.templates.set(id, {
      ...template,
      id,
      createdAt: new Date().toISOString()
    })
  }

  /**
   * 获取消息模板
   */
  getTemplate(id) {
    return this.templates.get(id)
  }

  /**
   * 生成错误消息
   */
  generateMessage(errorCode, context = {}, templateId = null) {
    const errorCodeInfo = getErrorCode(errorCode)
    const template = templateId ? 
      this.getTemplate(templateId) : 
      this.getBestTemplate(errorCodeInfo)

    if (!template) {
      return this.createDefaultMessage(errorCodeInfo, context)
    }

    return this.renderTemplate(template, {
      ...errorCodeInfo,
      ...context
    })
  }

  /**
   * 获取最佳模板
   */
  getBestTemplate(errorCodeInfo) {
    if (!errorCodeInfo) {
      return this.getTemplate('basic')
    }

    // 根据错误类型选择最合适的模板
    switch (errorCodeInfo.category) {
      case 'network':
        return this.getTemplate('network-error')
      case 'authentication':
        return errorCodeInfo.code.startsWith('2000') ? 
          this.getTemplate('auth-error') : 
          this.getTemplate('permission-error')
      case 'data':
        return errorCodeInfo.code === '3001' ? 
          this.getTemplate('validation-error') : 
          this.getTemplate('error')
      case 'file':
        return this.getTemplate('file-upload-error')
      default:
        return this.getTemplate('error')
    }
  }

  /**
   * 渲染模板
   */
  renderTemplate(template, data) {
    let rendered = { ...template }

    // 替换模板变量
    Object.keys(rendered).forEach(key => {
      if (typeof rendered[key] === 'string') {
        rendered[key] = this.replaceVariables(rendered[key], data)
      }
    })

    // 处理动作
    if (rendered.actions) {
      rendered.actions = rendered.actions.map(action => ({
        ...action,
        label: this.replaceVariables(action.label, data),
        disabled: this.shouldDisableAction(action, data)
      }))
    }

    return rendered
  }

  /**
   * 替换变量
   */
  replaceVariables(text, data) {
    if (typeof text !== 'string') return text

    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match
    })
  }

  /**
   * 判断是否应该禁用动作
   */
  shouldDisableAction(action, data) {
    switch (action.action) {
      case 'retry':
        return !data.retry || data.maxRetries <= 0
      case 'offline_mode':
        return !navigator.onLine
      case 'compress_file':
        return !data.fileSize || data.fileSize < 1024 * 1024 // 1MB
      default:
        return false
    }
  }

  /**
   * 创建默认消息
   */
  createDefaultMessage(errorCodeInfo, context) {
    return {
      title: '发生错误',
      message: errorCodeInfo?.message || '未知错误',
      description: errorCodeInfo?.description || context.description || '',
      type: 'error',
      showIcon: true,
      showClose: true,
      autoClose: false,
      actions: errorCodeInfo?.retry ? [
        {
          label: '重试',
          type: 'primary',
          action: 'retry'
        }
      ] : []
    }
  }

  /**
   * 格式化验证错误
   */
  formatValidationErrors(errors) {
    const formatted = {
      title: '数据验证失败',
      message: '请检查以下输入错误：',
      type: 'error',
      showIcon: true,
      showClose: true,
      autoClose: false,
      validationErrors: []
    }

    errors.forEach(error => {
      formatted.validationErrors.push({
        field: error.field,
        message: error.message,
        type: error.type || 'error',
        severity: error.severity || 'medium'
      })
    })

    return formatted
  }

  /**
   * 格式化网络错误
   */
  formatNetworkError(error, context = {}) {
    const message = this.generateMessage(
      error.code || '5000',
      {
        ...context,
        additionalInfo: this.getNetworkErrorMessage(error)
      },
      'network-error'
    )

    // 添加网络特定信息
    message.networkInfo = {
      online: navigator.onLine,
      connection: navigator.connection || {},
      errorType: this.classifyNetworkError(error),
      suggestions: this.getNetworkSuggestions(error)
    }

    return message
  }

  /**
   * 获取网络错误消息
   */
  getNetworkErrorMessage(error) {
    if (!navigator.onLine) {
      return '您当前处于离线状态，请检查网络连接。'
    }

    switch (error.type) {
      case 'timeout':
        return '网络请求超时，可能是网络速度较慢或服务器响应缓慢。'
      case 'abort':
        return '请求被中断，请重试。'
      case 'network':
        return '网络连接失败，请检查您的网络设置。'
      default:
        return '网络连接出现问题，请检查网络状态后重试。'
    }
  }

  /**
   * 分类网络错误
   */
  classifyNetworkError(error) {
    if (!navigator.onLine) return 'offline'
    if (error.timeout) return 'timeout'
    if (error.aborted) return 'aborted'
    if (error.response) return 'server_error'
    return 'connection_error'
  }

  /**
   * 获取网络建议
   */
  getNetworkSuggestions(error) {
    const suggestions = ['检查网络连接']

    if (!navigator.onLine) {
      suggestions.push('等待网络恢复')
    } else if (error.timeout) {
      suggestions.push('检查网络速度', '稍后重试')
    } else {
      suggestions.push('刷新页面', '尝试其他网络环境')
    }

    return suggestions
  }

  /**
   * 创建进度消息
   */
  createProgressMessage(title, progress, context = {}) {
    return this.renderTemplate(this.getTemplate('progress'), {
      title,
      progress,
      ...context
    })
  }

  /**
   * 创建确认消息
   */
  createConfirmationMessage(options) {
    const {
      title = '确认操作',
      message = '您确定要执行此操作吗？',
      description = '',
      confirmText = '确认',
      cancelText = '取消',
      danger = false
    } = options

    const template = this.getTemplate('confirmation')
    const messageData = this.renderTemplate(template, {
      title,
      message,
      description,
      confirmText,
      cancelText
    })

    if (danger) {
      messageData.type = 'error'
      messageData.confirmStyle = 'danger'
    }

    return messageData
  }

  /**
   * 添加自定义消息
   */
  addCustomMessage(id, message) {
    this.customMessages.set(id, {
      ...message,
      id,
      createdAt: new Date().toISOString()
    })
  }

  /**
   * 获取自定义消息
   */
  getCustomMessage(id) {
    return this.customMessages.get(id)
  }

  /**
   * 记录消息历史
   */
  recordMessage(message, type = 'info', context = {}) {
    const record = {
      id: this.generateMessageId(),
      type,
      message,
      context,
      timestamp: new Date().toISOString(),
      read: false
    }

    this.messageHistory.unshift(record)
    
    // 限制历史记录数量
    if (this.messageHistory.length > 100) {
      this.messageHistory = this.messageHistory.slice(0, 100)
    }

    // 触发事件
    eventBus.emit('message-recorded', record)

    return record.id
  }

  /**
   * 生成消息ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 标记消息为已读
   */
  markAsRead(messageId) {
    const message = this.messageHistory.find(m => m.id === messageId)
    if (message) {
      message.read = true
      eventBus.emit('message-read', { messageId })
    }
  }

  /**
   * 获取消息历史
   */
  getMessageHistory(options = {}) {
    const {
      type,
      unread,
      limit = 50,
      since
    } = options

    let history = [...this.messageHistory]

    // 过滤条件
    if (type) {
      history = history.filter(m => m.type === type)
    }

    if (unread !== undefined) {
      history = history.filter(m => m.read === !unread)
    }

    if (since) {
      history = history.filter(m => 
        new Date(m.timestamp) >= new Date(since)
      )
    }

    return history.slice(0, limit)
  }

  /**
   * 清除消息历史
   */
  clearHistory(type = null) {
    if (type) {
      this.messageHistory = this.messageHistory.filter(m => m.type !== type)
    } else {
      this.messageHistory = []
    }

    eventBus.emit('message-history-cleared', { type })
  }

  /**
   * 加载用户偏好
   */
  loadUserPreferences() {
    try {
      return JSON.parse(localStorage.getItem('error-message-preferences') || '{}')
    } catch {
      return {
        autoClose: true,
        duration: 5000,
        showIcon: true,
        position: 'top-right',
        enableSound: false,
        enableVibration: false
      }
    }
  }

  /**
   * 保存用户偏好
   */
  saveUserPreferences(preferences) {
    try {
      this.userPreferences = { ...this.userPreferences, ...preferences }
      localStorage.setItem('error-message-preferences', JSON.stringify(this.userPreferences))
    } catch (error) {
      console.warn('Failed to save user preferences:', error)
    }
  }

  /**
   * 获取用户偏好
   */
  getUserPreferences() {
    return this.userPreferences
  }

  /**
   * 更新消息偏好
   */
  updateMessagePreferences(updates) {
    this.saveUserPreferences(updates)
    eventBus.emit('message-preferences-updated', updates)
  }

  /**
   * 获取消息统计
   */
  getMessageStats(days = 7) {
    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - days)

    const stats = {
      total: 0,
      byType: {},
      byHour: {},
      mostCommon: {},
      recentTrend: []
    }

    this.messageHistory.forEach(message => {
      const messageDate = new Date(message.timestamp)
      
      if (messageDate >= startDate) {
        stats.total++

        // 按类型统计
        if (!stats.byType[message.type]) {
          stats.byType[message.type] = 0
        }
        stats.byType[message.type]++

        // 按小时统计
        const hour = messageDate.getHours()
        if (!stats.byHour[hour]) {
          stats.byHour[hour] = 0
        }
        stats.byHour[hour]++

        // 统计最常见的消息内容
        const key = message.message.title || message.message.message
        if (!stats.mostCommon[key]) {
          stats.mostCommon[key] = 0
        }
        stats.mostCommon[key]++
      }
    })

    // 计算趋势
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      
      const dayCount = this.messageHistory.filter(m => 
        m.timestamp.startsWith(dateKey)
      ).length

      stats.recentTrend.push({
        date: dateKey,
        count: dayCount
      })
    }

    return stats
  }

  /**
   * 批量处理错误消息
   */
  batchProcessErrors(errors, options = {}) {
    const {
      groupBy = 'type',
      maxMessages = 5,
      showSummary = true
    } = options

    const grouped = this.groupErrors(errors, groupBy)
    const messages = []

    if (Object.keys(grouped).length <= maxMessages || !showSummary) {
      // 分别显示每个错误
      errors.forEach(error => {
        messages.push(this.generateMessage(error.code, error))
      })
    } else {
      // 显示汇总消息
      const summary = this.createErrorMessageSummary(grouped, errors)
      messages.push(summary)
    }

    return messages
  }

  /**
   * 分组错误
   */
  groupErrors(errors, groupBy) {
    const grouped = {}

    errors.forEach(error => {
      let key
      
      switch (groupBy) {
        case 'type':
          key = error.type || 'unknown'
          break
        case 'category':
          const errorCodeInfo = getErrorCode(error.code)
          key = errorCodeInfo?.category || 'unknown'
          break
        case 'severity':
          key = error.severity || 'medium'
          break
        default:
          key = error.code || 'unknown'
      }

      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(error)
    })

    return grouped
  }

  /**
   * 创建错误消息汇总
   */
  createErrorMessageSummary(grouped, errors) {
    return {
      title: '发现多个错误',
      message: `检测到 ${Object.keys(grouped).length} 类错误，共 ${errors.length} 个问题。`,
      type: 'error',
      showIcon: true,
      showClose: true,
      autoClose: false,
      summary: true,
      groups: Object.keys(grouped).map(key => ({
        type: key,
        count: grouped[key].length,
        errors: grouped[key].slice(0, 3) // 只显示前3个错误详情
      })),
      actions: [
        {
          label: '查看全部',
          type: 'primary',
          action: 'show_all_errors'
        },
        {
          label: '批量重试',
          type: 'secondary',
          action: 'batch_retry'
        }
      ]
    }
  }
}

// 创建单例实例
export const errorMessages = new ErrorMessages()

// 导出类和实用函数
export {
  ErrorMessages
}

// 便捷函数
export function generateErrorMessage(errorCode, context = {}, templateId = null) {
  return errorMessages.generateMessage(errorCode, context, templateId)
}

export function formatValidationErrors(errors) {
  return errorMessages.formatValidationErrors(errors)
}

export function formatNetworkError(error, context = {}) {
  return errorMessages.formatNetworkError(error, context)
}

export function createConfirmationMessage(options) {
  return errorMessages.createConfirmationMessage(options)
}

export function updateMessagePreferences(preferences) {
  return errorMessages.updateMessagePreferences(preferences)
}