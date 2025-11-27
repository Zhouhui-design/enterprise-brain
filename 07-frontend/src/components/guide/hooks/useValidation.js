import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InputValidator } from '@/utils/validation/input-validator'
import { BusinessRules } from '@/utils/validation/business-rules'
import { DataIntegrity } from '@/utils/validation/data-integrity'
import { ConstraintChecker } from '@/utils/validation/constraint-checker'

/**
 * 验证 Hook
 * 提供全面的数据验证功能，包括实时验证、批量验证、防错机制等
 */
export function useValidation(type = 'input') {
  // 验证状态
  const validationState = reactive({
    // 验证状态
    isValid: false,
    isInvalid: false,
    hasWarnings: false,
    isChecking: false,
    
    // 验证结果
    results: null,
    errors: [],
    warnings: [],
    
    // 当前验证项
    currentValidation: null,
    
    // 验证配置
    config: {
      // 验证类型
      type: type,
      // 实时验证
      realtime: true,
      // 防抖延迟（毫秒）
      debounceDelay: 300,
      // 是否显示详细错误
      showDetails: true,
      // 是否启用智能建议
      enableSuggestions: true,
      // 验证级别：strict, moderate, relaxed
      level: 'moderate',
      // 自定义验证规则
      customRules: {},
      // 是否启用缓存
      enableCache: true
    },
    
    // 缓存
    cache: new Map(),
    
    // 验证历史
    history: []
  })

  // 内部状态
  const validationTimer = ref(null)
  const fieldValidations = reactive({})
  const validationPromises = new Map()

  // 计算属性
  const hasErrors = computed(() => validationState.errors.length > 0)
  const errorCount = computed(() => validationState.errors.length)
  const warningCount = computed(() => validationState.warnings.length)
  const totalIssues = computed(() => errorCount.value + warningCount.value)

  /**
   * 主要验证方法
   * @param {*} data - 要验证的数据
   * @param {Object} rules - 验证规则
   * @param {Object} options - 验证选项
   * @returns {Promise<Object>} 验证结果
   */
  const validate = async (data, rules, options = {}) => {
    try {
      validationState.isChecking = true
      validationState.currentValidation = { data, rules, options }

      const startTime = Date.now()
      
      // 清空之前的结果
      clearResults()

      // 生成验证缓存键
      const cacheKey = generateCacheKey(data, rules, options)
      
      // 检查缓存
      if (validationState.config.enableCache && validationState.cache.has(cacheKey)) {
        const cachedResult = validationState.cache.get(cacheKey)
        validationState.results = cachedResult
        updateValidationState(cachedResult)
        
        recordValidationEvent('cache_hit', { 
          duration: Date.now() - startTime 
        })
        
        return cachedResult
      }

      // 执行验证
      let result = await performValidation(data, rules, options)
      
      // 后处理
      result = postProcessResult(result, data, rules, options)
      
      // 更新状态
      validationState.results = result
      updateValidationState(result)
      
      // 缓存结果
      if (validationState.config.enableCache) {
        validationState.cache.set(cacheKey, result)
      }

      // 记录验证事件
      recordValidationEvent('validation_complete', {
        isValid: result.isValid,
        errorCount: result.errors?.length || 0,
        warningCount: result.warnings?.length || 0,
        duration: Date.now() - startTime,
        dataHash: hashData(data)
      })

      return result

    } catch (error) {
      console.error('Validation error:', error)
      
      const errorResult = {
        isValid: false,
        errors: [{ 
          code: 'VALIDATION_ERROR', 
          message: error.message,
          type: 'system'
        }],
        warnings: []
      }
      
      validationState.results = errorResult
      updateValidationState(errorResult)
      
      recordValidationEvent('validation_error', {
        error: error.message,
        duration: Date.now() - startTime
      })
      
      return errorResult

    } finally {
      validationState.isChecking = false
      validationState.currentValidation = null
    }
  }

  /**
   * 实时验证方法（带防抖）
   * @param {*} data - 要验证的数据
   * @param {Object} rules - 验证规则
   * @param {Object} options - 验证选项
   */
  const validateRealtime = (data, rules, options = {}) => {
    if (!validationState.config.realtime) return

    // 清除之前的定时器
    if (validationTimer.value) {
      clearTimeout(validationTimer.value)
    }

    // 设置新的定时器
    validationTimer.value = setTimeout(async () => {
      await validate(data, rules, { ...options, realtime: true })
    }, validationState.config.debounceDelay)
  }

  /**
   * 字段验证方法
   * @param {string} field - 字段名
   * @param {*} value - 字段值
   * @param {Object} fieldRules - 字段规则
   * @returns {Promise<Object>} 字段验证结果
   */
  const validateField = async (field, value, fieldRules = {}) => {
    try {
      const fieldValidator = getValidatorForType(validationState.config.type)
      const result = await fieldValidator.validateField(field, value, fieldRules)
      
      // 更新字段验证状态
      fieldValidations[field] = result
      
      // 记录字段验证事件
      recordValidationEvent('field_validation', {
        field,
        isValid: result.isValid,
        hasWarnings: result.warnings?.length > 0
      })
      
      return result

    } catch (error) {
      console.error(`Field validation error for ${field}:`, error)
      
      const errorResult = {
        isValid: false,
        errors: [{ 
          code: 'FIELD_VALIDATION_ERROR', 
          message: error.message,
          field: field
        }],
        warnings: []
      }
      
      fieldValidations[field] = errorResult
      return errorResult
    }
  }

  /**
   * 批量验证方法
   * @param {Array} dataArray - 数据数组
   * @param {Object} rules - 验证规则
   * @param {Object} options - 验证选项
   * @returns {Promise<Object>} 批量验证结果
   */
  const batchValidate = async (dataArray, rules, options = {}) => {
    try {
      validationState.isChecking = true
      
      const startTime = Date.now()
      const results = []
      
      // 并行验证所有数据
      const promises = dataArray.map(async (data, index) => {
        const promiseKey = `batch-${index}`
        
        // 避免重复验证
        if (validationPromises.has(promiseKey)) {
          return validationPromises.get(promiseKey)
        }
        
        const promise = validate(data, rules, { ...options, index })
        validationPromises.set(promiseKey, promise)
        
        try {
          const result = await promise
          results.push({
            index,
            data,
            result
          })
          
          return result
        } finally {
          validationPromises.delete(promiseKey)
        }
      })
      
      await Promise.all(promises)
      
      // 汇总结果
      const batchResult = aggregateBatchResults(results)
      
      recordValidationEvent('batch_validation_complete', {
        totalItems: dataArray.length,
        validItems: batchResult.validCount,
        invalidItems: batchResult.invalidCount,
        duration: Date.now() - startTime
      })
      
      return batchResult

    } catch (error) {
      console.error('Batch validation error:', error)
      
      const errorResult = {
        isValid: false,
        errors: [{ 
          code: 'BATCH_VALIDATION_ERROR', 
          message: error.message
        }],
        results: []
      }
      
      return errorResult

    } finally {
      validationState.isChecking = false
    }
  }

  /**
   * 清除验证结果
   */
  const clearResults = () => {
    validationState.isValid = false
    validationState.isInvalid = false
    validationState.hasWarnings = false
    validationState.results = null
    validationState.errors = []
    validationState.warnings = []
    validationState.currentValidation = null
  }

  /**
   * 清除缓存
   */
  const clearCache = () => {
    validationState.cache.clear()
    recordValidationEvent('cache_cleared')
  }

  /**
   * 获取验证历史
   * @param {Object} filters - 过滤条件
   * @returns {Array} 验证历史记录
   */
  const getValidationHistory = (filters = {}) => {
    let history = [...validationState.history]
    
    if (filters.type) {
      history = history.filter(event => event.type === filters.type)
    }
    
    if (filters.startTime) {
      history = history.filter(event => event.timestamp >= filters.startTime)
    }
    
    if (filters.endTime) {
      history = history.filter(event => event.timestamp <= filters.endTime)
    }
    
    return history.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * 获取字段验证状态
   * @param {string} field - 字段名
   * @returns {Object} 字段验证状态
   */
  const getFieldValidation = (field) => {
    return fieldValidations[field] || null
  }

  /**
   * 获取所有字段验证状态
   * @returns {Object} 所有字段验证状态
   */
  const getAllFieldValidations = () => {
    return { ...fieldValidations }
  }

  /**
   * 更新验证配置
   * @param {Object} newConfig - 新配置
   */
  const updateConfig = (newConfig) => {
    validationState.config = { ...validationState.config, ...newConfig }
    
    // 如果禁用了实时验证，清除定时器
    if (!validationState.config.realtime && validationTimer.value) {
      clearTimeout(validationTimer.value)
    }
  }

  // 内部方法：执行验证
  const performValidation = async (data, rules, options) => {
    const validator = getValidatorForType(validationState.config.type)
    return await validator.validate(data, rules, options)
  }

  // 内部方法：后处理验证结果
  const postProcessResult = (result, data, rules, options) => {
    // 添加智能建议
    if (validationState.config.enableSuggestions) {
      result.suggestions = generateSuggestions(result, data, rules)
    }
    
    // 添加修复建议
    result.fixes = generateFixes(result, data, rules)
    
    // 添加验证级别信息
    result.validationLevel = validationState.config.level
    
    // 添加时间戳
    result.timestamp = Date.now()
    
    return result
  }

  // 内部方法：更新验证状态
  const updateValidationState = (result) => {
    validationState.isValid = result.isValid !== false
    validationState.isInvalid = !validationState.isValid
    validationState.hasWarnings = result.warnings && result.warnings.length > 0
    validationState.errors = result.errors || []
    validationState.warnings = result.warnings || []
  }

  // 内部方法：获取验证器
  const getValidatorForType = (type) => {
    switch (type) {
      case 'input':
        return InputValidator
      case 'business':
        return BusinessRules
      case 'data':
        return DataIntegrity
      case 'constraint':
        return ConstraintChecker
      default:
        throw new Error(`Unknown validation type: ${type}`)
    }
  }

  // 内部方法：生成缓存键
  const generateCacheKey = (data, rules, options) => {
    return `${hashData(data)}_${hashData(rules)}_${hashData(options)}`
  }

  // 内部方法：哈希数据
  const hashData = (data) => {
    return btoa(JSON.stringify(data)).substring(0, 16)
  }

  // 内部方法：记录验证事件
  const recordValidationEvent = (type, data = {}) => {
    const event = {
      type,
      timestamp: Date.now(),
      data,
      validationType: validationState.config.type
    }
    
    validationState.history.push(event)
    
    // 限制历史记录数量
    if (validationState.history.length > 1000) {
      validationState.history = validationState.history.slice(-500)
    }
  }

  // 内部方法：生成建议
  const generateSuggestions = (result, data, rules) => {
    const suggestions = []
    
    // 基于错误生成建议
    result.errors?.forEach(error => {
      if (error.suggestion) {
        suggestions.push({
          type: 'error-fix',
          field: error.field,
          message: error.suggestion,
          priority: 'high'
        })
      }
    })
    
    // 基于警告生成建议
    result.warnings?.forEach(warning => {
      if (warning.suggestion) {
        suggestions.push({
          type: 'warning-improvement',
          field: warning.field,
          message: warning.suggestion,
          priority: 'medium'
        })
      }
    })
    
    return suggestions
  }

  // 内部方法：生成修复方案
  const generateFixes = (result, data, rules) => {
    const fixes = []
    
    result.errors?.forEach(error => {
      if (error.fix) {
        fixes.push({
          field: error.field,
          type: error.fix.type,
          action: error.fix.action,
          autoFix: error.fix.autoFix || false,
          description: error.fix.description
        })
      }
    })
    
    return fixes
  }

  // 内部方法：汇总批量验证结果
  const aggregateBatchResults = (results) => {
    let validCount = 0
    let invalidCount = 0
    let warningCount = 0
    
    const allErrors = []
    const allWarnings = []
    
    results.forEach(({ result, index }) => {
      if (result.isValid) {
        validCount++
      } else {
        invalidCount++
      }
      
      if (result.warnings?.length > 0) {
        warningCount++
        allWarnings.push(...result.warnings)
      }
      
      if (result.errors?.length > 0) {
        allErrors.push(...result.errors)
      }
    })
    
    return {
      isValid: invalidCount === 0,
      hasWarnings: warningCount > 0,
      totalCount: results.length,
      validCount,
      invalidCount,
      warningCount,
      errors: allErrors,
      warnings: allWarnings,
      results
    }
  }

  // 监听配置变化
  watch(() => validationState.config, (newConfig) => {
    recordValidationEvent('config_updated', newConfig)
  }, { deep: true })

  return {
    // 状态
    validationState,
    fieldValidations,
    
    // 计算属性
    hasErrors,
    errorCount,
    warningCount,
    totalIssues,
    
    // 主要方法
    validate,
    validateRealtime,
    validateField,
    batchValidate,
    
    // 工具方法
    clearResults,
    clearCache,
    getValidationHistory,
    getFieldValidation,
    getAllFieldValidations,
    updateConfig,
    
    // 内部方法（暴露用于测试）
    performValidation,
    generateSuggestions,
    aggregateBatchResults
  }
}