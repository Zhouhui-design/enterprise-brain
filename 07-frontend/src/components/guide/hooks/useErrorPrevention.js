import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { errorCodes } from '@/utils/error-handling/error-codes'
import { errorMessages } from '@/utils/error-handling/error-messages'
import { recoveryStrategies } from '@/utils/error-handling/recovery-strategies'

/**
 * 错误防错 Hook
 * 提供主动式错误预防和用户引导，类似于游戏中的错误提示机制
 */
export function useErrorPrevention(level = 'moderate') {
  // 防错状态
  const preventionState = reactive({
    // 防错级别
    level: level,
    
    // 是否启用
    enabled: true,
    
    // 当前检测到的潜在错误
    currentErrors: [],
    
    // 历史预防记录
    history: [],
    
    // 统计信息
    stats: {
      totalChecks: 0,
      preventedErrors: 0,
      successfulRecoveries: 0,
      ignoredWarnings: 0
    },
    
    // 配置
    config: {
      // 是否显示防错提示
      showPreventionTips: true,
      // 是否自动修复
      autoFix: level === 'strict',
      // 是否需要确认
      requireConfirmation: level !== 'relaxed',
      // 防抖延迟
      debounceDelay: 500,
      // 最大提示数量
      maxTips: 3,
      // 是否记录用户选择
      recordUserChoices: true
    }
  })

  // 内部状态
  const preventionTimer = ref(null)
  const activePreventionDialogs = ref([])
  const userChoices = ref(new Map())
  const contextBuffer = ref([])

  // 计算属性
  const hasPreventionTips = computed(() => preventionState.currentErrors.length > 0)
  const criticalErrors = computed(() => 
    preventionState.currentErrors.filter(error => error.severity === 'critical')
  )
  const warningErrors = computed(() => 
    preventionState.currentErrors.filter(error => error.severity === 'warning')
  )
  const infoErrors = computed(() => 
    preventionState.currentErrors.filter(error => error.severity === 'info')
  )

  /**
   * 检查潜在错误
   * @param {any} data - 要检查的数据
   * @param {Object} context - 上下文信息
   * @param {Object} rules - 规则配置
   * @returns {Promise<Array>} 潜在错误列表
   */
  const checkPotentialErrors = async (data, context = {}, rules = {}) => {
    try {
      preventionState.stats.totalChecks++
      
      // 更新上下文
      updateContextBuffer(data, context)
      
      const detectedErrors = []
      
      // 执行各种检查
      detectedErrors.push(...await checkDataIntegrity(data, context))
      detectedErrors.push(...await checkBusinessLogic(data, context, rules))
      detectedErrors.push(...await checkUserPatterns(data, context))
      detectedErrors.push(...await checkSystemConstraints(data, context))
      
      // 过滤和排序错误
      const filteredErrors = filterAndSortErrors(detectedErrors)
      
      // 更新状态
      preventionState.currentErrors = filteredErrors
      
      // 显示防错提示
      if (filteredErrors.length > 0 && preventionState.config.showPreventionTips) {
        await showPreventionTips(filteredErrors)
      }
      
      // 记录检查结果
      recordPreventionEvent('error_check', {
        errorCount: filteredErrors.length,
        context: context,
        dataHash: hashData(data)
      })
      
      return filteredErrors

    } catch (error) {
      console.error('Error prevention check failed:', error)
      return []
    }
  }

  /**
   * 预防错误执行
   * @param {Object} action - 要执行的动作
   * @param {Object} context - 执行上下文
   * @returns {Promise<boolean>} 是否成功预防
   */
  const preventError = async (action, context = {}) => {
    try {
      // 检查是否启用防错
      if (!preventionState.enabled) {
        return true
      }
      
      // 预检查动作
      const preCheckResult = await preCheckAction(action, context)
      
      if (preCheckResult.hasRisks) {
        const shouldProceed = await handleRiskAction(action, preCheckResult, context)
        
        if (!shouldProceed) {
          preventionState.stats.preventedErrors++
          recordPreventionEvent('error_prevented', {
            action: action,
            risks: preCheckResult.risks
          })
          
          return false
        }
      }
      
      // 执行动作前的最后检查
      const finalCheck = await finalActionCheck(action, context)
      
      if (finalCheck.shouldBlock) {
        showBlockingError(action, finalCheck, context)
        preventionState.stats.preventedErrors++
        return false
      }
      
      return true

    } catch (error) {
      console.error('Error prevention failed:', error)
      return true // 如果防错机制失败，允许继续执行
    }
  }

  /**
   * 智能错误恢复
   * @param {Object} error - 错误对象
   * @param {Object} context - 错误上下文
   * @returns {Promise<Object>} 恢复结果
   */
  const recoverFromError = async (error, context = {}) => {
    try {
      // 分析错误
      const errorAnalysis = analyzeError(error, context)
      
      // 获取恢复策略
      const recoveryStrategy = getRecoveryStrategy(errorAnalysis)
      
      if (!recoveryStrategy) {
        return { success: false, message: 'No recovery strategy available' }
      }
      
      // 执行恢复策略
      const recoveryResult = await executeRecoveryStrategy(
        recoveryStrategy, 
        error, 
        context
      )
      
      if (recoveryResult.success) {
        preventionState.stats.successfulRecoveries++
        
        recordPreventionEvent('error_recovered', {
          error: error,
          strategy: recoveryStrategy.id,
          result: recoveryResult
        })
        
        showRecoverySuccess(recoveryStrategy, recoveryResult)
      }
      
      return recoveryResult

    } catch (error) {
      console.error('Error recovery failed:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 显示防错提示
   * @param {Array} errors - 错误列表
   */
  const showPreventionTips = async (errors) => {
    const criticalErrors = errors.filter(e => e.severity === 'critical')
    const nonCriticalErrors = errors.filter(e => e.severity !== 'critical')
    
    // 优先处理关键错误
    if (criticalErrors.length > 0) {
      await showCriticalErrorDialog(criticalErrors)
    }
    
    // 显示非关键错误的批量提示
    if (nonCriticalErrors.length > 0) {
      showWarningNotification(nonCriticalErrors)
    }
  }

  /**
   * 记录用户选择
   * @param {string} choiceType - 选择类型
   * @param {Object} choiceData - 选择数据
   */
  const recordUserChoice = (choiceType, choiceData) => {
    if (!preventionState.config.recordUserChoices) return
    
    userChoices.value.set(choiceType, {
      ...choiceData,
      timestamp: Date.now()
    })
    
    // 学习用户模式
    learnUserPattern(choiceType, choiceData)
  }

  /**
   * 更新防错配置
   * @param {Object} newConfig - 新配置
   */
  const updatePreventionConfig = (newConfig) => {
    preventionState.config = { ...preventionState.config, ...newConfig }
    
    recordPreventionEvent('config_updated', newConfig)
  }

  /**
   * 启用/禁用防错机制
   * @param {boolean} enabled - 是否启用
   */
  const togglePrevention = (enabled) => {
    preventionState.enabled = enabled
    
    recordPreventionEvent('prevention_toggled', { enabled })
  }

  /**
   * 获取防错统计
   * @returns {Object} 统计信息
   */
  const getPreventionStats = () => {
    return {
      ...preventionState.stats,
      effectiveness: preventionState.stats.totalChecks > 0 ? 
        (preventionState.stats.preventedErrors / preventionState.stats.totalChecks * 100).toFixed(2) + '%' : '0%',
      currentErrors: preventionState.currentErrors.length,
      userChoicePatterns: Object.fromEntries(userChoices.value)
    }
  }

  /**
   * 清除当前错误
   */
  const clearCurrentErrors = () => {
    preventionState.currentErrors = []
    
    recordPreventionEvent('current_errors_cleared')
  }

  // 内部方法：检查数据完整性
  const checkDataIntegrity = async (data, context) => {
    const errors = []
    
    try {
      // 检查数据类型
      if (data === null || data === undefined) {
        errors.push({
          code: 'DATA_NULL_OR_UNDEFINED',
          message: '数据为空或未定义',
          severity: 'critical',
          suggestion: '请检查数据源是否正常',
          autoFix: false
        })
      }
      
      // 检查数据结构
      if (typeof data === 'object' && data !== null) {
        const requiredFields = context.requiredFields || []
        for (const field of requiredFields) {
          if (!(field in data)) {
            errors.push({
              code: 'MISSING_REQUIRED_FIELD',
              message: `缺少必需字段: ${field}`,
              field: field,
              severity: 'critical',
              suggestion: `请添加字段 ${field} 或检查数据映射`,
              autoFix: false
            })
          }
        }
        
        // 检查字段值
        for (const [key, value] of Object.entries(data)) {
          if (value === null || value === '') {
            errors.push({
              code: 'EMPTY_FIELD',
              message: `字段 ${key} 为空`,
              field: key,
              severity: 'warning',
              suggestion: `请为字段 ${key} 提供有效值`,
              autoFix: true,
              fixAction: () => ({ [key]: getDefaultFieldValue(key, context) })
            })
          }
        }
      }
      
      // 检查数据范围
      if (context.ranges) {
        for (const [field, range] of Object.entries(context.ranges)) {
          const value = data[field]
          if (value !== undefined && !isInRange(value, range)) {
            errors.push({
              code: 'VALUE_OUT_OF_RANGE',
              message: `字段 ${field} 的值超出有效范围`,
              field: field,
              value: value,
              range: range,
              severity: 'warning',
              suggestion: `请确保 ${field} 的值在 ${range.min} 到 ${range.max} 之间`,
              autoFix: true,
              fixAction: () => ({ [field]: clampValue(value, range) })
            })
          }
        }
      }
      
    } catch (error) {
      console.error('Data integrity check failed:', error)
    }
    
    return errors
  }

  // 内部方法：检查业务逻辑
  const checkBusinessLogic = async (data, context, rules) => {
    const errors = []
    
    try {
      // 检查业务规则
      if (rules.businessRules) {
        for (const rule of rules.businessRules) {
          try {
            const result = await rule.check(data, context)
            if (!result.valid) {
              errors.push({
                code: 'BUSINESS_RULE_VIOLATION',
                message: result.message || '违反业务规则',
                rule: rule.name,
                severity: rule.severity || 'warning',
                suggestion: result.suggestion,
                autoFix: rule.autoFix || false,
                fixAction: rule.fixAction
              })
            }
          } catch (error) {
            errors.push({
              code: 'BUSINESS_RULE_ERROR',
              message: `业务规则检查失败: ${rule.name}`,
              rule: rule.name,
              severity: 'warning',
              suggestion: '请检查业务规则配置'
            })
          }
        }
      }
      
      // 检查数据一致性
      if (context.consistencyChecks) {
        for (const check of context.consistencyChecks) {
          try {
            const result = await check.validate(data)
            if (!result.consistent) {
              errors.push({
                code: 'DATA_INCONSISTENCY',
                message: result.message || '数据不一致',
                severity: 'warning',
                suggestion: result.suggestion,
                autoFix: result.autoFix || false
              })
            }
          } catch (error) {
            console.error('Consistency check failed:', error)
          }
        }
      }
      
    } catch (error) {
      console.error('Business logic check failed:', error)
    }
    
    return errors
  }

  // 内部方法：检查用户模式
  const checkUserPatterns = async (data, context) => {
    const errors = []
    
    try {
      // 检查重复操作
      if (context.operationId) {
        const recentOperations = contextBuffer.value.filter(
          item => item.operationId === context.operationId && 
          Date.now() - item.timestamp < 5000 // 5秒内
        )
        
        if (recentOperations.length > 2) {
          errors.push({
            code: 'POTENTIAL_DUPLICATE_OPERATION',
            message: '检测到可能的重复操作',
            severity: 'warning',
            suggestion: '请确认是否要重复执行此操作',
            autoFix: false
          })
        }
      }
      
      // 检查异常模式
      const userPattern = analyzeUserPattern(contextBuffer.value)
      if (userPattern.isAnomalous) {
        errors.push({
          code: 'ANOMALOUS_USER_PATTERN',
          message: '检测到异常的用户操作模式',
          severity: 'info',
          suggestion: '请确认操作是否符合预期',
          autoFix: false
        })
      }
      
    } catch (error) {
      console.error('User pattern check failed:', error)
    }
    
    return errors
  }

  // 内部方法：检查系统约束
  const checkSystemConstraints = async (data, context) => {
    const errors = []
    
    try {
      // 检查资源限制
      if (context.resourceLimits) {
        for (const [resource, limit] of Object.entries(context.resourceLimits)) {
          const currentUsage = await getCurrentResourceUsage(resource)
          if (currentUsage > limit) {
            errors.push({
              code: 'RESOURCE_LIMIT_EXCEEDED',
              message: `资源 ${resource} 使用量超过限制`,
              resource: resource,
              current: currentUsage,
              limit: limit,
              severity: 'critical',
              suggestion: `请减少 ${resource} 的使用或增加限制`,
              autoFix: false
            })
          }
        }
      }
      
      // 检查权限
      if (context.requiredPermissions) {
        const userPermissions = await getUserPermissions()
        const missingPermissions = context.requiredPermissions.filter(
          perm => !userPermissions.includes(perm)
        )
        
        if (missingPermissions.length > 0) {
          errors.push({
            code: 'INSUFFICIENT_PERMISSIONS',
            message: '权限不足',
            missingPermissions: missingPermissions,
            severity: 'critical',
            suggestion: '请获取必要的权限后再执行操作',
            autoFix: false
          })
        }
      }
      
    } catch (error) {
      console.error('System constraint check failed:', error)
    }
    
    return errors
  }

  // 内部方法：过滤和排序错误
  const filterAndSortErrors = (errors) => {
    // 根据防错级别过滤
    let filteredErrors = errors
    
    if (preventionState.level === 'relaxed') {
      filteredErrors = errors.filter(e => e.severity === 'critical')
    } else if (preventionState.level === 'strict') {
      filteredErrors = errors
    } else { // moderate
      filteredErrors = errors.filter(e => 
        e.severity === 'critical' || e.severity === 'warning'
      )
    }
    
    // 根据严重程度排序
    filteredErrors.sort((a, b) => {
      const severityOrder = { critical: 3, warning: 2, info: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
    
    // 限制提示数量
    return filteredErrors.slice(0, preventionState.config.maxTips)
  }

  // 内部方法：显示关键错误对话框
  const showCriticalErrorDialog = async (criticalErrors) => {
    try {
      const result = await ElMessageBox.alert(
        criticalErrors.map(e => `• ${e.message}`).join('\n'),
        '⚠️ 检测到关键问题',
        {
          type: 'error',
          confirmButtonText: '我知道了',
          showCancelButton: true,
          cancelButtonText: '忽略所有',
          dangerouslyUseHTMLString: false
        }
      )
      
      recordUserChoice('critical_error_dialog', { 
        action: 'acknowledged',
        errors: criticalErrors 
      })
      
    } catch (action) {
      if (action === 'cancel') {
        recordUserChoice('critical_error_dialog', { 
          action: 'ignored',
          errors: criticalErrors 
        })
        
        preventionState.stats.ignoredWarnings++
        clearCurrentErrors()
      }
    }
  }

  // 内部方法：显示警告通知
  const showWarningNotification = (warningErrors) => {
    const message = `检测到 ${warningErrors.length} 个潜在问题`
    
    ElNotification({
      title: '⚡ 防错提示',
      message: message,
      type: 'warning',
      duration: 5000,
      showClose: true,
      onClick: () => {
        showWarningDetails(warningErrors)
      }
    })
  }

  // 内部方法：显示警告详情
  const showWarningDetails = async (warningErrors) => {
    const htmlContent = warningErrors.map(e => {
      const autoFixText = e.autoFix ? ' <span style="color: #67C23A;">[可自动修复]</span>' : ''
      return `<div style="margin-bottom: 12px;">
        <strong>${e.code}</strong>: ${e.message}${autoFixText}<br>
        <small style="color: #909399;">建议: ${e.suggestion}</small>
      </div>`
    }).join('')
    
    ElMessageBox.alert(htmlContent, '潜在问题详情', {
      dangerouslyUseHTMLString: true,
      type: 'warning',
      confirmButtonText: '好的'
    })
  }

  // 内部方法：记录防错事件
  const recordPreventionEvent = (eventType, data = {}) => {
    const event = {
      type: eventType,
      timestamp: Date.now(),
      level: preventionState.level,
      data: data
    }
    
    preventionState.history.push(event)
    
    // 限制历史记录数量
    if (preventionState.history.length > 1000) {
      preventionState.history = preventionState.history.slice(-500)
    }
  }

  // 内部方法：更新上下文缓冲
  const updateContextBuffer = (data, context) => {
    contextBuffer.value.push({
      data: hashData(data),
      context: context,
      timestamp: Date.now()
    })
    
    // 限制缓冲区大小
    if (contextBuffer.value.length > 100) {
      contextBuffer.value = contextBuffer.value.slice(-50)
    }
  }

  // 内部方法：学习用户模式
  const learnUserPattern = (choiceType, choiceData) => {
    // 简单的学习模式：记录用户的选择倾向
    if (!userChoices.value.has('patterns')) {
      userChoices.value.set('patterns', {})
    }
    
    const patterns = userChoices.value.get('patterns')
    patterns[choiceType] = patterns[choiceType] || []
    patterns[choiceType].push({
      action: choiceData.action,
      timestamp: Date.now()
    })
  }

  // 工具方法
  const hashData = (data) => {
    return btoa(JSON.stringify(data)).substring(0, 16)
  }

  const isInRange = (value, range) => {
    return value >= range.min && value <= range.max
  }

  const clampValue = (value, range) => {
    return Math.max(range.min, Math.min(range.max, value))
  }

  const getDefaultFieldValue = (field, context) => {
    const defaults = context.defaultValues || {}
    return defaults[field] || ''
  }

  const getCurrentResourceUsage = async (resource) => {
    // 模拟获取资源使用情况
    return Math.random() * 100
  }

  const getUserPermissions = async () => {
    // 模拟获取用户权限
    return ['read', 'write']
  }

  const analyzeError = (error, context) => {
    return {
      type: error.code || 'UNKNOWN_ERROR',
      severity: error.severity || 'medium',
      context: context,
      recoverable: true
    }
  }

  const getRecoveryStrategy = (errorAnalysis) => {
    return recoveryStrategies[errorAnalysis.type] || null
  }

  const executeRecoveryStrategy = async (strategy, error, context) => {
    try {
      if (typeof strategy.execute === 'function') {
        return await strategy.execute(error, context)
      }
      return { success: false, message: 'Invalid recovery strategy' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const showRecoverySuccess = (strategy, result) => {
    ElNotification({
      title: '✅ 自动恢复成功',
      message: result.message || '问题已自动修复',
      type: 'success',
      duration: 3000
    })
  }

  const analyzeUserPattern = (buffer) => {
    // 简单的用户模式分析
    return {
      isAnomalous: false,
      patterns: {}
    }
  }

  const preCheckAction = async (action, context) => {
    // 模拟动作预检查
    return {
      hasRisks: Math.random() > 0.8,
      risks: []
    }
  }

  const handleRiskAction = async (action, riskResult, context) => {
    try {
      await ElMessageBox.confirm(
        '此操作可能存在风险，确定要继续吗？',
        '⚠️ 风险提示',
        {
          type: 'warning',
          confirmButtonText: '继续执行',
          cancelButtonText: '取消操作'
        }
      )
      
      return true
    } catch {
      return false
    }
  }

  const finalActionCheck = async (action, context) => {
    // 模拟最终检查
    return {
      shouldBlock: false
    }
  }

  const showBlockingError = (action, checkResult, context) => {
    ElMessage.error('操作被阻止：' + checkResult.reason)
  }

  return {
    // 状态
    preventionState,
    hasPreventionTips,
    criticalErrors,
    warningErrors,
    infoErrors,
    
    // 主要方法
    checkPotentialErrors,
    preventError,
    recoverFromError,
    
    // 工具方法
    updatePreventionConfig,
    togglePrevention,
    getPreventionStats,
    clearCurrentErrors,
    recordUserChoice,
    
    // 内部方法（暴露用于测试）
    checkDataIntegrity,
    checkBusinessLogic,
    checkUserPatterns,
    checkSystemConstraints
  }
}