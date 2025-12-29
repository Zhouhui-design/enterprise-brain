/**
 * 性能监控和指标系统
 * 
 * 提供全面的性能监控功能，包括：
 * - 组件性能监控
 * - 用户行为分析
 * - 内存使用监控
 * - 网络请求分析
 * - 渲染性能分析
 * - 自定义指标追踪
 * 
 * @author AI Assistant
 * @since 2024-01-01
 */

import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

export class PerformanceMonitor {
  constructor() {
    // 性能数据存储
    this.metrics = reactive({
      component: new Map(),
      user: new Map(),
      network: new Map(),
      memory: new Map(),
      render: new Map(),
      custom: new Map()
    })

    // 监控配置
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      maxRecords: 1000,
      reportInterval: 60000, // 1分钟
      autoReport: true
    }

    // 监控状态
    this.isMonitoring = ref(false)
    this.startTime = null
    this.observers = new Set()
    
    // 性能阈值
    this.thresholds = {
      renderTime: 16.67, // 60fps
      memoryGrowth: 50 * 1024 * 1024, // 50MB
      apiResponseTime: 1000, // 1秒
      componentLoadTime: 300 // 300ms
    }

    this.initializeMonitoring()
  }

  /**
   * 初始化监控系统
   */
  initializeMonitoring() {
    if (typeof window === 'undefined' || !window.performance) {
      console.warn('Performance API not available')
      return
    }

    // 设置监控
    this.setupPerformanceObserver()
    this.setupMemoryMonitoring()
    this.setupNetworkMonitoring()
    this.setupUserInteractionMonitoring()
    
    // 记录初始状态
    this.recordInitialMetrics()
  }

  /**
   * 开始监控
   */
  start() {
    if (this.isMonitoring.value) {
      return
    }

    this.isMonitoring.value = true
    this.startTime = Date.now()
    
    // 启动定时报告
    if (this.config.autoReport) {
      this.startPeriodicReporting()
    }

    console.log('性能监控已启动')
  }

  /**
   * 停止监控
   */
  stop() {
    this.isMonitoring.value = false
    
    // 清理观察器
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    
    console.log('性能监控已停止')
  }

  /**
   * 组件性能监控
   */
  monitorComponent(name, component) {
    const startTime = performance.now()
    
    return {
      start: () => {
        return performance.now()
      },
      
      end: (startTime) => {
        const endTime = performance.now()
        const duration = endTime - startTime
        
        this.recordComponentMetric(name, {
          duration,
          timestamp: Date.now(),
          renderCount: this.getComponentRenderCount(name) + 1
        })

        // 检查性能警告
        this.checkPerformanceThresholds('component', name, duration)
        
        return duration
      },
      
      measure: (operation) => {
        const opStart = performance.now()
        const result = operation()
        const opEnd = performance.now()
        
        this.recordComponentMetric(name, {
          operation: operation.name || 'unknown',
          duration: opEnd - opStart,
          timestamp: Date.now()
        })

        return result
      }
    }
  }

  /**
   * 用户行为监控
   */
  trackUserInteraction(event, element, context = {}) {
    const interaction = {
      type: event.type,
      target: element.tagName,
      className: element.className,
      id: element.id,
      timestamp: Date.now(),
      context,
      sessionId: this.getSessionId(),
      sequence: this.getUserInteractionSequence()
    }

    this.recordUserMetric(interaction)
    
    // 分析用户行为模式
    this.analyzeUserBehavior(interaction)
  }

  /**
   * 网络请求监控
   */
  trackNetworkRequest(request, response, duration) {
    const networkMetric = {
      url: request.url,
      method: request.method,
      status: response.status,
      duration,
      size: response.size || 0,
      cache: this.getCacheInfo(request, response),
      timestamp: Date.now(),
      success: response.status >= 200 && response.status < 300
    }

    this.recordNetworkMetric(networkMetric)
    
    // 检查API性能
    this.checkAPIPerformance(networkMetric)
  }

  /**
   * 内存使用监控
   */
  recordMemoryUsage() {
    if (!window.performance || !window.performance.memory) {
      return
    }

    const memoryInfo = {
      usedJSHeapSize: window.performance.memory.usedJSHeapSize,
      totalJSHeapSize: window.performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit,
      timestamp: Date.now()
    }

    this.recordMemoryMetric(memoryInfo)
    
    // 检查内存泄漏
    this.checkMemoryGrowth(memoryInfo)
  }

  /**
   * 渲染性能监控
   */
  measureRenderPerformance() {
    if (!window.performance || !window.requestAnimationFrame) {
      return
    }

    let frameCount = 0
    let lastTime = performance.now()
    
    const measureFrame = () => {
      frameCount++
      const currentTime = performance.now()
      const deltaTime = currentTime - lastTime

      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime)
        const frameTime = deltaTime / frameCount

        this.recordRenderMetric({
          fps,
          frameTime,
          frameCount,
          timestamp: currentTime
        })

        // 检查渲染性能
        this.checkRenderPerformance(frameTime, fps)

        frameCount = 0
        lastTime = currentTime
      }

      if (this.isMonitoring.value) {
        requestAnimationFrame(measureFrame)
      }
    }

    requestAnimationFrame(measureFrame)
  }

  /**
   * 自定义指标追踪
   */
  trackCustomMetric(name, value, tags = {}) {
    const customMetric = {
      name,
      value,
      tags,
      timestamp: Date.now()
    }

    this.recordCustomMetric(customMetric)
  }

  /**
   * 设置性能观察器
   */
  setupPerformanceObserver() {
    if (!window.PerformanceObserver) {
      return
    }

    // 观察导航性能
    const navigationObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (entry.entryType === 'navigation') {
          this.recordNavigationMetric(entry)
        }
      })
    })
    navigationObserver.observe({ entryTypes: ['navigation'] })
    this.observers.add(navigationObserver)

    // 观察资源加载性能
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (entry.entryType === 'resource') {
          this.recordResourceMetric(entry)
        }
      })
    })
    resourceObserver.observe({ entryTypes: ['resource'] })
    this.observers.add(resourceObserver)

    // 观察长任务
    const longTaskObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (entry.entryType === 'longtask') {
          this.recordLongTaskMetric(entry)
        }
      })
    })
    
    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] })
      this.observers.add(longTaskObserver)
    } catch (error) {
      console.warn('Long task observer not supported:', error)
    }
  }

  /**
   * 设置内存监控
   */
  setupMemoryMonitoring() {
    // 定期记录内存使用情况
    setInterval(() => {
      if (this.isMonitoring.value) {
        this.recordMemoryUsage()
      }
    }, 5000) // 每5秒记录一次
  }

  /**
   * 设置网络监控
   */
  setupNetworkMonitoring() {
    // 拦截fetch请求
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      const [url, options] = args
      
      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()
        
        this.trackNetworkRequest(
          { url: typeof url === 'string' ? url : url.url, method: options?.method || 'GET' },
          { 
            status: response.status, 
            size: response.headers.get('content-length') 
          },
          endTime - startTime
        )
        
        return response
      } catch (error) {
        const endTime = performance.now()
        this.trackNetworkRequest(
          { url: typeof url === 'string' ? url : url.url, method: options?.method || 'GET' },
          { status: 0, error: error.message },
          endTime - startTime
        )
        throw error
      }
    }

    // 拦截XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open
    XMLHttpRequest.prototype.open = function(method, url) {
      this._startTime = performance.now()
      this._method = method
      this._url = url
      
      return originalXHROpen.apply(this, arguments)
    }

    const originalXHRSend = XMLHttpRequest.prototype.send
    XMLHttpRequest.prototype.send = function() {
      const originalOnLoad = this.onload
      const originalOnError = this.onerror

      this.onload = () => {
        const endTime = performance.now()
        const duration = endTime - this._startTime
        
        window.performanceMonitor?.trackNetworkRequest(
          { url: this._url, method: this._method },
          { status: this.status, size: this.getResponseHeader('content-length') },
          duration
        )

        if (originalOnLoad) originalOnLoad.apply(this, arguments)
      }

      this.onerror = () => {
        const endTime = performance.now()
        const duration = endTime - this._startTime
        
        window.performanceMonitor?.trackNetworkRequest(
          { url: this._url, method: this._method },
          { status: 0, error: 'network error' },
          duration
        )

        if (originalOnError) originalOnError.apply(this, arguments)
      }

      return originalXHRSend.apply(this, arguments)
    }
  }

  /**
   * 设置用户交互监控
   */
  setupUserInteractionMonitoring() {
    const events = ['click', 'scroll', 'keydown', 'touchstart']
    
    events.forEach(eventType => {
      const handler = (event) => {
        if (Math.random() < this.config.sampleRate) {
          this.trackUserInteraction(event, event.target, {
            page: window.location.pathname,
            userAgent: navigator.userAgent,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight
            }
          })
        }
      }

      document.addEventListener(eventType, handler, { passive: true })
      
      // 存储清理函数
      this.eventCleanup = this.eventCleanup || {}
      this.eventCleanup[eventType] = () => {
        document.removeEventListener(eventType, handler, { passive: true })
      }
    })
  }

  /**
   * 记录组件指标
   */
  recordComponentMetric(name, metric) {
    if (!this.metrics.component.has(name)) {
      this.metrics.component.set(name, [])
    }

    const records = this.metrics.component.get(name)
    records.push(metric)

    // 限制记录数量
    if (records.length > this.config.maxRecords) {
      records.splice(0, records.length - this.config.maxRecords)
    }
  }

  /**
   * 记录用户指标
   */
  recordUserMetric(metric) {
    const sessionId = metric.sessionId
    
    if (!this.metrics.user.has(sessionId)) {
      this.metrics.user.set(sessionId, [])
    }

    const records = this.metrics.user.get(sessionId)
    records.push(metric)

    // 限制记录数量
    if (records.length > this.config.maxRecords) {
      records.splice(0, records.length - this.config.maxRecords)
    }
  }

  /**
   * 记录网络指标
   */
  recordNetworkMetric(metric) {
    const url = metric.url
    
    if (!this.metrics.network.has(url)) {
      this.metrics.network.set(url, [])
    }

    const records = this.metrics.network.get(url)
    records.push(metric)

    // 限制记录数量
    if (records.length > this.config.maxRecords) {
      records.splice(0, records.length - this.config.maxRecords)
    }
  }

  /**
   * 记录内存指标
   */
  recordMemoryMetric(metric) {
    const timestamp = metric.timestamp
    
    if (!this.metrics.memory.has(timestamp)) {
      this.metrics.memory.set(timestamp, metric)
    }

    // 清理旧记录
    const keys = Array.from(this.metrics.memory.keys()).sort()
    while (keys.length > this.config.maxRecords) {
      this.metrics.memory.delete(keys.shift())
    }
  }

  /**
   * 记录渲染指标
   */
  recordRenderMetric(metric) {
    const timestamp = metric.timestamp
    
    if (!this.metrics.render.has(timestamp)) {
      this.metrics.render.set(timestamp, metric)
    }

    // 清理旧记录
    const keys = Array.from(this.metrics.render.keys()).sort()
    while (keys.length > this.config.maxRecords) {
      this.metrics.render.delete(keys.shift())
    }
  }

  /**
   * 记录自定义指标
   */
  recordCustomMetric(metric) {
    const name = metric.name
    
    if (!this.metrics.custom.has(name)) {
      this.metrics.custom.set(name, [])
    }

    const records = this.metrics.custom.get(name)
    records.push(metric)

    // 限制记录数量
    if (records.length > this.config.maxRecords) {
      records.splice(0, records.length - this.config.maxRecords)
    }
  }

  /**
   * 记录导航性能指标
   */
  recordNavigationMetric(entry) {
    const navigationMetric = {
      type: 'navigation',
      duration: entry.duration,
      domContentLoadedTime: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadTime: entry.loadEventEnd - entry.loadEventStart,
      redirectTime: entry.redirectEnd - entry.redirectStart,
      dnsTime: entry.domainLookupEnd - entry.domainLookupStart,
      tcpTime: entry.connectEnd - entry.connectStart,
      requestTime: entry.responseStart - entry.requestStart,
      responseTime: entry.responseEnd - entry.responseStart,
      timestamp: Date.now()
    }
    
    this.recordCustomMetric({ name: 'navigation', ...navigationMetric })
  }

  /**
   * 记录资源加载性能指标
   */
  recordResourceMetric(entry) {
    const resourceMetric = {
      type: 'resource',
      name: entry.name,
      duration: entry.duration,
      size: entry.transferSize || entry.encodedBodySize || 0,
      initiatorType: entry.initiatorType,
      timestamp: Date.now()
    }
    
    this.recordNetworkMetric(resourceMetric)
  }

  /**
   * 记录长任务性能指标
   */
  recordLongTaskMetric(entry) {
    const longTaskMetric = {
      type: 'longtask',
      duration: entry.duration,
      startTime: entry.startTime,
      attribution: entry.attribution ? entry.attribution.map(attr => ({
        name: attr.name,
        entryType: attr.entryType,
        startTime: attr.startTime,
        duration: attr.duration
      })) : [],
      timestamp: Date.now()
    }
    
    this.recordCustomMetric({ name: 'longtask', ...longTaskMetric })
    
    // 长任务警告
    if (entry.duration > 50) {
      console.warn(`检测到长任务: ${entry.duration.toFixed(2)}ms`)
    }
  }

  /**
   * 检查性能阈值
   */
  checkPerformanceThresholds(type, name, value) {
    const threshold = this.thresholds[`${type}Time`] || this.thresholds[`${type}Growth`]
    
    if (threshold && value > threshold) {
      this.reportPerformanceWarning(type, name, value, threshold)
    }
  }

  /**
   * 检查API性能
   */
  checkAPIPerformance(metric) {
    if (metric.duration > this.thresholds.apiResponseTime) {
      console.warn(`API响应缓慢: ${metric.url} - ${metric.duration}ms`)
    }
  }

  /**
   * 检查内存增长
   */
  checkMemoryGrowth(memoryInfo) {
    const records = Array.from(this.metrics.memory.values())
    if (records.length < 2) return

    const previousRecord = records[records.length - 2]
    const growth = memoryInfo.usedJSHeapSize - previousRecord.usedJSHeapSize

    if (growth > this.thresholds.memoryGrowth) {
      console.warn(`检测到内存增长异常: ${growth / 1024 / 1024}MB`)
      this.reportMemoryLeakWarning(growth)
    }
  }

  /**
   * 检查渲染性能
   */
  checkRenderPerformance(frameTime, fps) {
    if (frameTime > this.thresholds.renderTime) {
      console.warn(`渲染帧时间过长: ${frameTime.toFixed(2)}ms (目标: ${this.thresholds.renderTime}ms)`)
    }

    if (fps < 55) {
      console.warn(`帧率过低: ${fps}fps (目标: 60fps)`)
    }
  }

  /**
   * 生成性能报告
   */
  generateReport() {
    const report = {
      timestamp: Date.now(),
      monitoringDuration: Date.now() - this.startTime,
      summary: {
        componentPerformance: this.analyzeComponentPerformance(),
        userBehavior: this.analyzeUserBehavior(),
        networkPerformance: this.analyzeNetworkPerformance(),
        memoryUsage: this.analyzeMemoryUsage(),
        renderPerformance: this.analyzeRenderPerformance(),
        customMetrics: this.analyzeCustomMetrics()
      },
      recommendations: this.generateRecommendations(),
      details: this.metrics
    }

    return report
  }

  /**
   * 分析组件性能
   */
  analyzeComponentPerformance() {
    const analysis = {}

    for (const [name, records] of this.metrics.component) {
      const durations = records.map(r => r.duration)
      analysis[name] = {
        count: records.length,
        averageDuration: this.average(durations),
        maxDuration: Math.max(...durations),
        minDuration: Math.min(...durations),
        p95: this.percentile(durations, 95),
        totalDuration: durations.reduce((sum, d) => sum + d, 0)
      }
    }

    return analysis
  }

  /**
   * 分析用户行为
   */
  analyzeUserBehavior() {
    const sessions = Array.from(this.metrics.user.values())
    
    return {
      totalSessions: sessions.length,
      averageInteractionsPerSession: this.average(sessions.map(s => s.length)),
      mostCommonInteractions: this.getMostCommonInteractions(sessions),
      averageSessionDuration: this.calculateAverageSessionDuration(sessions)
    }
  }

  /**
   * 分析网络性能
   */
  analyzeNetworkPerformance() {
    const requests = Array.from(this.metrics.network.values()).flat()
    
    return {
      totalRequests: requests.length,
      averageResponseTime: this.average(requests.map(r => r.duration)),
      successRate: requests.filter(r => r.success).length / requests.length,
      slowestRequests: requests.sort((a, b) => b.duration - a.duration).slice(0, 10),
      cacheHitRate: this.calculateCacheHitRate(requests)
    }
  }

  /**
   * 分析内存使用
   */
  analyzeMemoryUsage() {
    const records = Array.from(this.metrics.memory.values())
    
    if (records.length === 0) return null

    const usedMemory = records.map(r => r.usedJSHeapSize)
    
    return {
      currentUsage: usedMemory[usedMemory.length - 1],
      averageUsage: this.average(usedMemory),
      peakUsage: Math.max(...usedMemory),
      memoryTrend: this.calculateTrend(usedMemory),
      growthRate: this.calculateGrowthRate(usedMemory)
    }
  }

  /**
   * 分析渲染性能
   */
  analyzeRenderPerformance() {
    const records = Array.from(this.metrics.render.values())
    
    if (records.length === 0) return null

    const frameTimes = records.map(r => r.frameTime)
    const fpsValues = records.map(r => r.fps)

    return {
      averageFPS: this.average(fpsValues),
      minFPS: Math.min(...fpsValues),
      frameTimeAverage: this.average(frameTimes),
      frameTimeMax: Math.max(...frameTimes),
      droppedFrames: records.filter(r => r.frameTime > this.thresholds.renderTime).length
    }
  }

  /**
   * 分析自定义指标
   */
  analyzeCustomMetrics() {
    const analysis = {}

    for (const [name, records] of this.metrics.custom) {
      const values = records.map(r => r.value)
      analysis[name] = {
        count: records.length,
        average: this.average(values),
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[values.length - 1]
      }
    }

    return analysis
  }

  /**
   * 生成性能优化建议
   */
  generateRecommendations() {
    const recommendations = []
    
    // 组件性能建议
    const componentAnalysis = this.analyzeComponentPerformance()
    for (const [name, analysis] of Object.entries(componentAnalysis)) {
      if (analysis.averageDuration > this.thresholds.componentLoadTime) {
        recommendations.push({
          type: 'component',
          priority: 'high',
          title: `组件 ${name} 性能需要优化`,
          description: `平均加载时间 ${analysis.averageDuration.toFixed(2)}ms，建议进行代码分割或懒加载`,
          component: name
        })
      }
    }

    // 网络性能建议
    const networkAnalysis = this.analyzeNetworkPerformance()
    if (networkAnalysis.averageResponseTime > this.thresholds.apiResponseTime) {
      recommendations.push({
        type: 'network',
        priority: 'medium',
        title: 'API响应时间过长',
        description: `平均响应时间 ${networkAnalysis.averageResponseTime.toFixed(2)}ms，建议优化后端性能或启用缓存`
      })
    }

    // 内存使用建议
    const memoryAnalysis = this.analyzeMemoryUsage()
    if (memoryAnalysis && memoryAnalysis.growthRate > 0.1) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        title: '检测到可能的内存泄漏',
        description: `内存增长速率 ${(memoryAnalysis.growthRate * 100).toFixed(2)}%，建议检查事件监听器和定时器清理`
      })
    }

    // 渲染性能建议
    const renderAnalysis = this.analyzeRenderPerformance()
    if (renderAnalysis && renderAnalysis.averageFPS < 55) {
      recommendations.push({
        type: 'render',
        priority: 'high',
        title: '渲染性能需要优化',
        description: `平均帧率 ${renderAnalysis.averageFPS.toFixed(1)}fps，建议减少重排重绘或使用虚拟滚动`
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  // ================ 工具方法 ================

  average(numbers) {
    return numbers.length > 0 ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0
  }

  percentile(numbers, p) {
    const sorted = numbers.slice().sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[index] || 0
  }

  calculateTrend(numbers) {
    if (numbers.length < 2) return 'stable'
    
    const recent = numbers.slice(-10)
    const older = numbers.slice(-20, -10)
    
    const recentAvg = this.average(recent)
    const olderAvg = this.average(older)
    
    if (recentAvg > olderAvg * 1.1) return 'increasing'
    if (recentAvg < olderAvg * 0.9) return 'decreasing'
    return 'stable'
  }

  calculateGrowthRate(numbers) {
    if (numbers.length < 2) return 0
    
    const first = numbers[0]
    const last = numbers[numbers.length - 1]
    return (last - first) / first
  }

  getCacheHitRate(requests) {
    const cached = requests.filter(r => r.cache === 'hit').length
    return requests.length > 0 ? cached / requests.length : 0
  }

  calculateCacheHitRate(requests) {
    // 兼容方法，调用getCacheHitRate
    return this.getCacheHitRate(requests)
  }

  getMostCommonInteractions(sessions) {
    const interactions = sessions.flat()
    const typeCount = {}
    
    interactions.forEach(interaction => {
      typeCount[interaction.type] = (typeCount[interaction.type] || 0) + 1
    })

    return Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))
  }

  calculateAverageSessionDuration(sessions) {
    const durations = sessions.map(session => {
      if (session.length < 2) return 0
      return session[session.length - 1].timestamp - session[0].timestamp
    })

    return this.average(durations)
  }

  getSessionId() {
    // 简单的会话ID生成
    if (!this.sessionId) {
      this.sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2)
    }
    return this.sessionId
  }

  getUserInteractionSequence() {
    if (!this.interactionSequence) {
      this.interactionSequence = 0
    }
    return this.interactionSequence++
  }

  getComponentRenderCount(name) {
    const records = this.metrics.component.get(name) || []
    return records.length
  }

  getCacheInfo(request, response) {
    // 简化的缓存检测
    return response.size && request.url.includes('?') ? 'hit' : 'miss'
  }

  recordInitialMetrics() {
    // 记录导航计时
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing
      this.initialMetrics = {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        firstPaint: this.getFirstPaintTime()
      }
    }
  }

  getFirstPaintTime() {
    if (window.performance && window.performance.getEntriesByType) {
      const paintEntries = window.performance.getEntriesByType('paint')
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
      return firstPaint ? firstPaint.startTime : 0
    }
    return 0
  }

  startPeriodicReporting() {
    this.reportingTimer = setInterval(() => {
      if (this.config.autoReport) {
        this.reportMetrics()
      }
    }, this.config.reportInterval)
  }

  reportMetrics() {
    const report = this.generateReport()
    
    // 发送到监控服务
    this.sendReport(report)
    
    // 清理旧数据
    this.cleanupOldData()
  }

  sendReport(report) {
    // 实现报告发送逻辑
    console.log('Performance Report:', report)
    
    // 这里可以发送到后端监控服务
    // fetch('/api/performance/report', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(report)
    // })
  }

  cleanupOldData() {
    // 清理超过配置时间的数据
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000 // 24小时前

    for (const [key, records] of Object.entries(this.metrics)) {
      if (records instanceof Map) {
        for (const [recordKey, record] of records) {
          if (record.timestamp < cutoffTime) {
            records.delete(recordKey)
          }
        }
      }
    }
  }

  reportPerformanceWarning(type, name, value, threshold) {
    const warning = {
      type,
      name,
      value,
      threshold,
      timestamp: Date.now(),
      severity: 'warning'
    }

    console.warn(`Performance Warning: ${type} - ${name} - ${value} (threshold: ${threshold})`)
    
    // 可以发送到错误监控服务
    // this.sendWarning(warning)
  }

  reportMemoryLeakWarning(growth) {
    console.error(`Memory Leak Warning: Growth of ${growth / 1024 / 1024}MB detected`)
    
    // 可以发送内存泄漏报告
    // this.sendMemoryLeakReport(growth)
  }

  /**
   * 销毁监控器
   */
  destroy() {
    this.stop()
    
    // 清理事件监听器
    if (this.eventCleanup) {
      Object.values(this.eventCleanup).forEach(cleanup => cleanup())
    }
    
    // 清理定时器
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer)
    }
    
    // 清理数据
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key].clear()
    })
  }
}

// 创建全局实例
let globalMonitor = null

/**
 * 获取性能监控实例
 */
export function getPerformanceMonitor() {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor()
  }
  return globalMonitor
}

/**
 * 性能监控组合式函数
 */
export function usePerformanceMonitor() {
  const monitor = getPerformanceMonitor()
  
  onMounted(() => {
    monitor.start()
  })
  
  onUnmounted(() => {
    monitor.stop()
  })
  
  return {
    monitor,
    isMonitoring: monitor.isMonitoring,
    trackComponent: monitor.monitorComponent.bind(monitor),
    trackUser: monitor.trackUserInteraction.bind(monitor),
    trackNetwork: monitor.trackNetworkRequest.bind(monitor),
    trackCustom: monitor.trackCustomMetric.bind(monitor),
    getReport: monitor.generateReport.bind(monitor)
  }
}

export default PerformanceMonitor