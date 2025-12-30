/**
 * 性能监控工具 - 修复版本
 * 修复了长任务检测和性能监控初始化问题
 */

class PerformanceMonitor {
  constructor() {
    this.isRunning = false
    this.longTaskThreshold = 50 // 50ms阈值
    this.metrics = {
      longTasks: [],
      slowNetworkRequests: [],
      memoryUsage: [],
      renderTime: []
    }
    
    // 安全的初始化
    this.init()
  }

  init() {
    try {
      // 安全地创建全局性能监控
      if (typeof window !== 'undefined') {
        // 避免重复初始化
        if (!window.performanceMonitor) {
          window.performanceMonitor = this
          
          // 安全地开始监控
          this.start()
          console.log('[性能监控] 已初始化')
        }
      }
    } catch (error) {
      console.warn('[性能监控] 初始化失败:', error)
    }
  }

  start() {
    if (this.isRunning) return
    
    this.isRunning = true
    
    // 监控长任务
    this.monitorLongTasks()
    
    // 监控网络请求
    this.monitorNetworkRequests()
    
    // 监控页面渲染
    this.monitorPageRendering()
    
    // 监控内存使用
    this.monitorMemoryUsage()
  }

  stop() {
    this.isRunning = false
    console.log('[性能监控] 已停止')
  }

  monitorLongTasks() {
    try {
      const originalSetTimeout = window.setTimeout
      const originalFetch = window.fetch

      window.setTimeout = (callback, delay) => {
        const startTime = performance.now()
        
        return originalSetTimeout(() => {
          try {
            const endTime = performance.now()
            const duration = endTime - startTime
            
            callback()
            
            // 记录长任务
            if (duration > this.longTaskThreshold) {
              const longTaskMetric = {
                type: 'longtask',
                duration: Math.round(duration),
                timestamp: new Date().toISOString(),
                stack: new Error().stack // 获取调用栈
              }
              
              this.recordMetric(longTaskMetric)
            }
          } catch (error) {
            console.error('[性能监控] 长任务监控错误:', error)
          }
        }, delay)
      }

      window.fetch = (...args) => {
        const startTime = performance.now()
        
        return originalFetch(...args).finally(() => {
          try {
            const endTime = performance.now()
            const duration = endTime - startTime
            
            // 记录慢请求
            if (duration > 1000) { // 1秒阈值
              const slowRequestMetric = {
                type: 'slowrequest',
                url: args[0],
                duration: Math.round(duration),
                timestamp: new Date().toISOString()
              }
              
              this.recordMetric(slowRequestMetric)
            }
          } catch (error) {
            console.error('[性能监控] 网络监控错误:', error)
          }
        })
      }
    } catch (error) {
      console.error('[性能监控] 初始化监控失败:', error)
    }
  }

  monitorNetworkRequests() {
    try {
      // 监控XMLHttpRequest
      const originalXHROpen = XMLHttpRequest.prototype.open
      const originalXHRSend = XMLHttpRequest.prototype.send

      XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this._method = method
        this._url = url
        this._startTime = performance.now()
        
        return originalXHROpen.call(this, method, url, ...args)
      }

      XMLHttpRequest.prototype.send = function(data) {
        const startTime = this._startTime || performance.now()
        
        const onLoad = () => {
          try {
            const endTime = performance.now()
            const duration = endTime - startTime
            
            if (duration > 1000) {
              window.performanceMonitor?.recordMetric({
                type: 'slowrequest',
                url: this._url,
                duration: Math.round(duration),
                timestamp: new Date().toISOString()
              })
            }
          } catch (error) {
            console.error('[性能监控] XHR监控错误:', error)
          }
        }

        this.addEventListener('load', onLoad)
        originalXHRSend.call(this, data)
      }
    } catch (error) {
      console.warn('[性能监控] 网络监控初始化失败:', error)
    }
  }

  monitorPageRendering() {
    try {
      let lastRenderTime = performance.now()
      
      const observer = new MutationObserver((mutations) => {
        const renderTime = performance.now() - lastRenderTime
        lastRenderTime = performance.now()
        
        if (renderTime > 16) { // 16ms阈值（一帧60fps）
          this.recordMetric({
            type: 'slowrender',
            duration: Math.round(renderTime),
            timestamp: new Date().toISOString()
          })
        }
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      })
    } catch (error) {
      console.warn('[性能监控] 渲染监控初始化失败:', error)
    }
  }

  monitorMemoryUsage() {
    try {
      if (performance.memory) {
        setInterval(() => {
          try {
            const memoryInfo = {
              used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), // MB
              total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), // MB
              limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024), // MB
              timestamp: new Date().toISOString()
            }
            
            this.recordMetric(memoryInfo)
          } catch (error) {
            console.error('[性能监控] 内存监控错误:', error)
          }
        }, 5000) // 每5秒检查一次
      }
    } catch (error) {
      console.warn('[性能监控] 内存监控不可用:', error)
    }
  }

  recordMetric(metric) {
    try {
      if (!metric || !metric.type) return
      
      // 安全地添加指标
      switch (metric.type) {
        case 'longtask':
          this.metrics.longTasks.push(metric)
          if (this.metrics.longTasks.length > 50) {
            this.metrics.longTasks = this.metrics.longTasks.slice(-20) // 保留最近20个
          }
          break
          
        case 'slowrequest':
          this.metrics.slowNetworkRequests.push(metric)
          if (this.metrics.slowNetworkRequests.length > 30) {
            this.metrics.slowNetworkRequests = this.metrics.slowNetworkRequests.slice(-10) // 保留最近10个
          }
          break
          
        case 'slowrender':
          this.metrics.renderTime.push(metric)
          if (this.metrics.renderTime.length > 20) {
            this.metrics.renderTime = this.metrics.renderTime.slice(-10) // 保留最近10个
          }
          break
          
        case 'memory':
          this.metrics.memoryUsage.push(metric)
          if (this.metrics.memoryUsage.length > 20) {
            this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-10) // 保留最近10个
          }
          break
          
        default:
          this.metrics.other = this.metrics.other || []
          this.metrics.other.push(metric)
          if (this.metrics.other.length > 20) {
            this.metrics.other = this.metrics.other.slice(-10)
          }
      }
    } catch (error) {
      console.error('[性能监控] 记录指标失败:', error)
    }
  }

  trackNetworkRequest(options) {
    try {
      // 安全的网络请求跟踪
      if (typeof options !== 'object' || !options.url) return
      
      const startTime = performance.now()
      
      // 返回一个Promise以便跟踪
      return fetch(options.url, options).finally(() => {
        const endTime = performance.now()
        const duration = endTime - startTime
        
        if (duration > 1000) {
          this.recordMetric({
            type: 'slowrequest',
            url: options.url,
            duration: Math.round(duration),
            method: options.method || 'GET',
            timestamp: new Date().toISOString()
          })
        }
      })
    } catch (error) {
      console.error('[性能监控] 网络请求跟踪失败:', error)
    }
  }

  generateReport() {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalLongTasks: this.metrics.longTasks.length,
          totalSlowRequests: this.metrics.slowNetworkRequests.length,
          avgRenderTime: this.metrics.renderTime.length > 0 
            ? Math.round(this.metrics.renderTime.reduce((sum, item) => sum + item.duration, 0) / this.metrics.renderTime.length)
            : 0,
          maxMemoryUsage: this.metrics.memoryUsage.length > 0
            ? Math.max(...this.metrics.memoryUsage.map(item => item.used))
            : 0
        },
        details: {
          longTasks: this.metrics.longTasks.slice(-5), // 最近5个长任务
          slowRequests: this.metrics.slowNetworkRequests.slice(-5), // 最近5个慢请求
          memoryUsage: this.metrics.memoryUsage.slice(-5) // 最近5个内存使用
        }
      }
      
      return report
    } catch (error) {
      console.error('[性能监控] 生成报告失败:', error)
      return {}
    }
  }

  // 向后兼容的API
  start() {
    this.isRunning = true
    console.log('[性能监控] 已启动')
  }

  stop() {
    this.isRunning = false
    console.log('[性能监控] 已停止')
  }

  trackLongTask(taskName, taskFn) {
    try {
      const startTime = performance.now()
      
      const wrappedFn = async (...args) => {
        try {
          const result = await taskFn(...args)
          const endTime = performance.now()
          const duration = endTime - startTime
          
          if (duration > this.longTaskThreshold) {
            this.recordMetric({
              type: 'longtask',
              name: taskName,
              duration: Math.round(duration),
              timestamp: new Date().toISOString()
            })
          }
          
          return result
        } catch (error) {
          console.error(`[性能监控] 任务 ${taskName} 执行失败:`, error)
          throw error
        }
      }
      
      return wrappedFn
    } catch (error) {
      console.error('[性能监控] 包装长任务失败:', error)
      return taskFn
    }
  }

  recordLongTaskMetric(entry) {
    try {
      this.recordMetric({
        type: 'longtask',
        ...entry
      })
    } catch (error) {
      console.error('[性能监控] 记录长任务指标失败:', error)
    }
  }
}

export default function getPerformanceMonitor() {
  try {
    return new PerformanceMonitor()
  } catch (error) {
    console.error('[性能监控] 创建失败:', error)
    return {
      start: () => console.warn('[性能监控] 降级模式：监控未初始化'),
      stop: () => console.warn('[性能监控] 降级模式：监控未初始化'),
      generateReport: () => ({}),
      trackLongTask: (name, fn) => fn
    }
  }
}