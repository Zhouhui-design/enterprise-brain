/**
 * 日志管理系统
 * 
 * 提供全面的日志记录功能，包括：
 * - 控制台日志增强
 * - 错误捕获和上报
 * - 性能数据记录
 * - 日志分级管理
 * - 日志过滤和搜索
 * - 日志导出功能
 * - 与后端日志系统集成
 * 
 * @author AI Assistant
 * @since 2024-01-01
 */

import { eventBus } from './eventBus'
import { errorCodes, recordError } from './error-handling/error-codes'
import { getPerformanceMonitor } from './performanceMonitor'

class Logger {
  constructor() {
    // 日志级别
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      CRITICAL: 4
    }

    // 当前日志级别
    this.currentLevel = this.levels.INFO

    // 日志配置
    this.config = {
      enabled: true,
      console: true,
      remote: true,
      performance: true,
      maxLogSize: 10000,
      logInterval: 60000, // 1分钟
      errorReportUrl: '/api/logs/error',
      performanceReportUrl: '/api/logs/performance',
      logReportUrl: '/api/logs/batch'
    }

    // 日志缓存
    this.logCache = []

    // 性能监控实例
    this.performanceMonitor = getPerformanceMonitor()

    // 初始化
    this.initialize()
  }

  /**
   * 初始化日志系统
   */
  initialize() {
    // 捕获全局错误
    this.setupGlobalErrorHandling()

    // 捕获未处理的Promise拒绝
    this.setupPromiseRejectionHandling()

    // 启动定时日志上报
    this.startPeriodicReporting()

    // 监听性能数据
    this.setupPerformanceMonitoring()

    // 监听错误事件
    this.setupErrorEventListening()

    console.log('Logger initialized successfully')
  }

  /**
   * 设置全局错误处理
   */
  setupGlobalErrorHandling() {
    window.addEventListener('error', (event) => {
      this.error('Global error occurred', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack
      })
    })
  }

  /**
   * 设置Promise拒绝处理
   */
  setupPromiseRejectionHandling() {
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      })
    })
  }

  /**
   * 设置性能监控
   */
  setupPerformanceMonitoring() {
    if (this.config.performance) {
      this.performanceMonitor.start()
    }
  }

  /**
   * 设置错误事件监听
   */
  setupErrorEventListening() {
    eventBus.on('error-occurred', (errorData) => {
      this.error('Event error occurred', errorData)
    })

    eventBus.on('critical-error', (errorData) => {
      this.critical('Critical error occurred', errorData)
    })

    eventBus.on('security-error', (errorData) => {
      this.error('Security error occurred', errorData)
    })
  }

  /**
   * 启动定时日志上报
   */
  startPeriodicReporting() {
    if (this.config.remote) {
      setInterval(() => {
        this.reportLogs()
      }, this.config.logInterval)
    }
  }

  /**
   * 记录调试日志
   */
  debug(message, meta = {}) {
    this.log(this.levels.DEBUG, 'DEBUG', message, meta)
  }

  /**
   * 记录信息日志
   */
  info(message, meta = {}) {
    this.log(this.levels.INFO, 'INFO', message, meta)
  }

  /**
   * 记录警告日志
   */
  warn(message, meta = {}) {
    this.log(this.levels.WARN, 'WARN', message, meta)
  }

  /**
   * 记录错误日志
   */
  error(message, meta = {}) {
    this.log(this.levels.ERROR, 'ERROR', message, meta)
    
    // 记录到错误代码系统
    if (meta.code) {
      recordError(meta.code, meta)
    }
  }

  /**
   * 记录严重错误日志
   */
  critical(message, meta = {}) {
    this.log(this.levels.CRITICAL, 'CRITICAL', message, meta)
    
    // 立即上报
    this.reportLogs()
  }

  /**
   * 核心日志记录方法
   */
  log(level, levelName, message, meta = {}) {
    if (!this.config.enabled || level < this.currentLevel) {
      return
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      message,
      meta,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId(),
      userId: this.getUserId()
    }

    // 添加到缓存
    this.logCache.push(logEntry)

    // 限制缓存大小
    if (this.logCache.length > this.config.maxLogSize) {
      this.logCache.splice(0, this.logCache.length - this.config.maxLogSize)
    }

    // 输出到控制台
    if (this.config.console) {
      this.consoleLog(levelName, message, meta)
    }
  }

  /**
   * 控制台日志输出
   */
  consoleLog(levelName, message, meta) {
    const colorMap = {
      DEBUG: '#909399',
      INFO: '#1890ff',
      WARN: '#e6a23c',
      ERROR: '#f56c6c',
      CRITICAL: '#ff4d4f'
    }

    const color = colorMap[levelName] || '#909399'
    const logMethod = levelName === 'DEBUG' ? console.debug :
                      levelName === 'INFO' ? console.info :
                      levelName === 'WARN' ? console.warn :
                      levelName === 'ERROR' ? console.error : console.error

    logMethod(`%c[${levelName}]%c ${message}`, `color: ${color}; font-weight: bold;`, 'color: inherit;', meta)
  }

  /**
   * 上报日志到服务器
   */
  async reportLogs() {
    if (!this.config.remote || this.logCache.length === 0) {
      return
    }

    const logsToReport = [...this.logCache]
    this.logCache = []

    try {
      const response = await fetch(this.config.logReportUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logs: logsToReport,
          timestamp: new Date().toISOString(),
          sessionId: this.getSessionId(),
          userId: this.getUserId()
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to report logs: ${response.statusText}`)
      }

      this.debug('Logs reported successfully', { count: logsToReport.length })
    } catch (error) {
      this.warn('Failed to report logs', { error: error.message })
      // 将日志放回缓存，以便稍后重试
      this.logCache = [...logsToReport, ...this.logCache]
    }
  }

  /**
   * 上报性能数据
   */
  async reportPerformance() {
    if (!this.config.performance || !this.config.remote) {
      return
    }

    try {
      const report = this.performanceMonitor.generateReport()
      
      const response = await fetch(this.config.performanceReportUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          performance: report,
          timestamp: new Date().toISOString(),
          sessionId: this.getSessionId(),
          userId: this.getUserId()
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to report performance: ${response.statusText}`)
      }

      this.debug('Performance report sent successfully')
    } catch (error) {
      this.warn('Failed to report performance', { error: error.message })
    }
  }

  /**
   * 获取会话ID
   */
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = localStorage.getItem('sessionId') || 
                      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('sessionId', this.sessionId)
    }
    return this.sessionId
  }

  /**
   * 获取用户ID
   */
  getUserId() {
    // 从localStorage或其他地方获取用户ID
    return localStorage.getItem('userId') || null
  }

  /**
   * 设置日志级别
   */
  setLevel(level) {
    if (typeof level === 'string') {
      this.currentLevel = this.levels[level.toUpperCase()] || this.levels.INFO
    } else {
      this.currentLevel = level
    }
    this.info(`Log level set to ${Object.keys(this.levels).find(key => this.levels[key] === this.currentLevel)}`)
  }

  /**
   * 启用/禁用日志
   */
  setEnabled(enabled) {
    this.config.enabled = enabled
    this.info(`Logging ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * 导出日志
   */
  exportLogs(format = 'json') {
    const logs = [...this.logCache]
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(logs, null, 2)
      case 'csv':
        return this.logsToCSV(logs)
      default:
        return logs
    }
  }

  /**
   * 转换日志为CSV格式
   */
  logsToCSV(logs) {
    const headers = ['timestamp', 'level', 'message', 'userAgent', 'url', 'sessionId', 'userId', 'meta']
    const rows = [headers.join(',')]
    
    logs.forEach(log => {
      const row = [
        log.timestamp,
        log.level,
        `"${log.message.replace(/"/g, '""')}"`,
        `"${log.userAgent.replace(/"/g, '""')}"`,
        `"${log.url.replace(/"/g, '""')}"`,
        log.sessionId || '',
        log.userId || '',
        `"${JSON.stringify(log.meta).replace(/"/g, '""')}"`
      ]
      rows.push(row.join(','))
    })
    
    return rows.join('\n')
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logCache = []
    this.info('Logs cleared')
  }

  /**
   * 获取日志统计
   */
  getStats() {
    const stats = {
      total: this.logCache.length,
      byLevel: {},
      byUser: {},
      recent: this.logCache.slice(-50).reverse()
    }

    // 按级别统计
    this.logCache.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1
    })

    // 按用户统计
    this.logCache.forEach(log => {
      if (log.userId) {
        stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1
      }
    })

    return stats
  }

  /**
   * 搜索日志
   */
  searchLogs(query, options = {}) {
    const { level, startTime, endTime, limit = 100 } = options
    
    return this.logCache
      .filter(log => {
        // 按查询字符串过滤
        const matchesQuery = !query || 
          log.message.toLowerCase().includes(query.toLowerCase()) ||
          JSON.stringify(log.meta).toLowerCase().includes(query.toLowerCase())
        
        // 按级别过滤
        const matchesLevel = !level || log.level === level
        
        // 按时间范围过滤
        const logTime = new Date(log.timestamp)
        const matchesTime = (!startTime || logTime >= new Date(startTime)) && 
                           (!endTime || logTime <= new Date(endTime))
        
        return matchesQuery && matchesLevel && matchesTime
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
  }

  /**
   * 销毁日志系统
   */
  destroy() {
    // 上报剩余日志
    this.reportLogs()
    
    // 停止性能监控
    if (this.performanceMonitor) {
      this.performanceMonitor.stop()
    }
    
    // 清空日志
    this.clearLogs()
    
    this.info('Logger destroyed')
  }
}

// 创建单例实例
const logger = new Logger()

// 导出日志级别
const LogLevels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
}

// 导出便捷函数
const debug = (message, meta) => logger.debug(message, meta)
const info = (message, meta) => logger.info(message, meta)
const warn = (message, meta) => logger.warn(message, meta)
const error = (message, meta) => logger.error(message, meta)
const critical = (message, meta) => logger.critical(message, meta)

// 导出日志管理系统
export {
  logger,
  LogLevels,
  debug,
  info,
  warn,
  error,
  critical
}

export default logger
