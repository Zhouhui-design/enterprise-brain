import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'

// 错误处理服务
export const errorHandlingService = {
  // 错误类型常量
  ERROR_TYPES: {
    NETWORK: 'NETWORK_ERROR',
    API: 'API_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    AUTH: 'AUTH_ERROR',
    BUSINESS: 'BUSINESS_ERROR',
    SYSTEM: 'SYSTEM_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR'
  },

  // 错误级别常量
  ERROR_LEVELS: {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
  },

  // 错误处理器映射
  handlers: new Map(),

  // 错误日志存储
  errorLogs: [],

  // 最大日志数量
  MAX_LOGS: 100,

  // 注册错误处理器
  registerHandler(type, handler) {
    this.handlers.set(type, handler)
  },

  // 移除错误处理器
  removeHandler(type) {
    this.handlers.delete(type)
  },

  // 处理错误
  handleError(error, options = {}) {
    const {
      type = this.ERROR_TYPES.UNKNOWN,
      level = this.ERROR_LEVELS.ERROR,
      showMessage = true,
      showNotification = false,
      logToServer = true,
      customHandler = null
    } = options

    // 构建错误对象
    const errorObj = {
      id: this.generateErrorId(),
      type,
      level,
      message: this.getErrorMessage(error),
      originalError: error,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      stack: error?.stack || null
    }

    // 记录错误日志
    this.logError(errorObj)

    // 执行自定义处理器
    if (customHandler && typeof customHandler === 'function') {
      customHandler(errorObj)
    }

    // 执行注册的处理器
    const handler = this.handlers.get(type)
    if (handler && typeof handler === 'function') {
      handler(errorObj)
    }

    // 显示用户消息
    if (showMessage) {
      this.showErrorMessage(errorObj)
    }

    if (showNotification) {
      this.showErrorNotification(errorObj)
    }

    // 上报错误到服务器
    if (logToServer) {
      this.reportErrorToServer(errorObj)
    }

    return errorObj
  },

  // 生成错误ID
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  // 获取错误消息
  getErrorMessage(error) {
    if (typeof error === 'string') {
      return error
    }

    if (error?.response?.data?.message) {
      return error.response.data.message
    }

    if (error?.message) {
      return error.message
    }

    if (error?.statusText) {
      return error.statusText
    }

    return '未知错误'
  },

  // 显示错误消息
  showErrorMessage(errorObj) {
    const message = errorObj.message
    const type = this.getMessageType(errorObj.level)

    if (errorObj.level === this.ERROR_LEVELS.CRITICAL) {
      ElMessageBox.alert(message, '严重错误', {
        type: 'error',
        confirmButtonText: '确定',
        showClose: false
      })
    } else {
      ElMessage({
        type,
        message,
        duration: 3000,
        showClose: true
      })
    }
  },

  // 显示错误通知
  showErrorNotification(errorObj) {
    const type = this.getMessageType(errorObj.level)
    
    ElNotification({
      type,
      title: '系统通知',
      message: errorObj.message,
      duration: 5000,
      showClose: true
    })
  },

  // 获取消息类型
  getMessageType(level) {
    const typeMap = {
      [this.ERROR_LEVELS.INFO]: 'info',
      [this.ERROR_LEVELS.WARNING]: 'warning',
      [this.ERROR_LEVELS.ERROR]: 'error',
      [this.ERROR_LEVELS.CRITICAL]: 'error'
    }
    return typeMap[level] || 'error'
  },

  // 记录错误日志
  logError(errorObj) {
    this.errorLogs.push(errorObj)
    
    // 限制日志数量
    if (this.errorLogs.length > this.MAX_LOGS) {
      this.errorLogs = this.errorLogs.slice(-this.MAX_LOGS)
    }

    // 输出到控制台
    console.error('Error logged:', errorObj)
  },

  // 上报错误到服务器
  reportErrorToServer(errorObj) {
    try {
      // 异步上报，不影响主流程
      fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorObj)
      }).catch(() => {
        // 静默处理上报失败
        console.warn('Failed to report error to server')
      })
    } catch (error) {
      console.warn('Error reporting failed:', error)
    }
  },

  // 获取错误日志
  getErrorLogs() {
    return [...this.errorLogs]
  },

  // 清除错误日志
  clearErrorLogs() {
    this.errorLogs = []
  },

  // 导出错误日志
  exportErrorLogs() {
    const dataStr = JSON.stringify(this.errorLogs, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `error-logs-${new Date().toISOString().slice(0, 10)}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }
}

// 网络错误处理器
errorHandlingService.registerHandler(errorHandlingService.ERROR_TYPES.NETWORK, (error) => {
  console.log('Network error handled:', error)
  
  if (error.originalError?.code === 'NETWORK_ERROR') {
    ElNotification({
      type: 'warning',
      title: '网络异常',
      message: '网络连接异常，请检查网络设置',
      duration: 5000
    })
  }
})

// API错误处理器
errorHandlingService.registerHandler(errorHandlingService.ERROR_TYPES.API, (error) => {
  console.log('API error handled:', error)
  
  const status = error.originalError?.response?.status
  
  switch (status) {
    case 401:
      ElMessageBox.confirm(
        '登录状态已过期，请重新登录',
        '提示',
        {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 跳转到登录页
        window.location.href = '/login'
      })
      break
      
    case 403:
      ElMessage({
        type: 'error',
        message: '权限不足，无法执行此操作'
      })
      break
      
    case 404:
      ElMessage({
        type: 'warning',
        message: '请求的资源不存在'
      })
      break
      
    case 500:
      ElMessage({
        type: 'error',
        message: '服务器内部错误，请稍后重试'
      })
      break
  }
})

// 验证错误处理器
errorHandlingService.registerHandler(errorHandlingService.ERROR_TYPES.VALIDATION, (error) => {
  console.log('Validation error handled:', error)
  
  ElMessage({
    type: 'warning',
    message: error.message || '输入数据验证失败',
    duration: 3000
  })
})

// 授权错误处理器
errorHandlingService.registerHandler(errorHandlingService.ERROR_TYPES.AUTH, (error) => {
  console.log('Auth error handled:', error)
  
  ElMessageBox.confirm(
    '您未登录或登录已过期，请重新登录',
    '提示',
    {
      confirmButtonText: '去登录',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    window.location.href = '/login'
  }).catch(() => {
    // 用户取消
  })
})

// 业务错误处理器
errorHandlingService.registerHandler(errorHandlingService.ERROR_TYPES.BUSINESS, (error) => {
  console.log('Business error handled:', error)
  
  ElMessage({
    type: 'warning',
    message: error.message || '业务处理失败',
    duration: 3000
  })
})

// 全局错误捕获
window.addEventListener('error', (event) => {
  errorHandlingService.handleError(event.error, {
    type: errorHandlingService.ERROR_TYPES.SYSTEM,
    showMessage: false,
    logToServer: true
  })
})

window.addEventListener('unhandledrejection', (event) => {
  errorHandlingService.handleError(event.reason, {
    type: errorHandlingService.ERROR_TYPES.UNKNOWN,
    showMessage: false,
    logToServer: true
  })
})

// Promise错误处理工具
export const promiseErrorHandler = {
  // 包装Promise，自动处理错误
  wrap(promise, options = {}) {
    return promise
      .catch(error => {
        errorHandlingService.handleError(error, {
          type: errorHandlingService.ERROR_TYPES.API,
          showMessage: true,
          ...options
        })
        throw error // 重新抛出，让调用者也能处理
      })
  },

  // 静默处理错误
  silent(promise) {
    return promise.catch(error => {
      errorHandlingService.handleError(error, {
        showMessage: false,
        logToServer: true
      })
    })
  },

  // 带重试的错误处理
  retry(promise, maxRetries = 3, delay = 1000) {
    let retryCount = 0
    
    const attempt = () => {
      return promise
        .catch(error => {
          retryCount++
          
          if (retryCount < maxRetries) {
            console.warn(`Retry attempt ${retryCount}/${maxRetries}`)
            return new Promise(resolve => setTimeout(resolve, delay)).then(attempt)
          } else {
            errorHandlingService.handleError(error, {
              type: errorHandlingService.ERROR_TYPES.NETWORK,
              showMessage: true
            })
            throw error
          }
        })
    }
    
    return attempt()
  }
}

// 表单错误处理工具
export const formErrorHandler = {
  // 处理表单验证错误
  handleValidationError(formRef, errors) {
    if (formRef && typeof formRef.setFields === 'function') {
      // Element Plus表单
      const formErrors = {}
      
      Object.keys(errors).forEach(field => {
        formErrors[field] = [{ message: errors[field], field }]
      })
      
      formRef.setFields(formErrors)
    }
    
    // 显示错误消息
    const firstError = Object.values(errors)[0]
    if (firstError) {
      ElMessage({
        type: 'error',
        message: firstError
      })
    }
  },

  // 处理表单提交错误
  handleSubmitError(error, formRef = null) {
    if (error.response?.data?.errors) {
      // 服务器返回的字段错误
      this.handleValidationError(formRef, error.response.data.errors)
    } else {
      // 其他错误
      errorHandlingService.handleError(error, {
        type: errorHandlingService.ERROR_TYPES.BUSINESS
      })
    }
  }
}

// 导出默认实例
export default errorHandlingService