/**
 * 输入验证器
 * 提供全面的输入数据验证功能，支持各种数据类型和验证规则
 */
export class InputValidator {
  constructor() {
    this.validationRules = new Map()
    this.customValidators = new Map()
    this.validationCache = new Map()
    
    this.initializeBuiltinRules()
  }

  /**
   * 初始化内置验证规则
   */
  initializeBuiltinRules() {
    // 基础类型验证
    this.validationRules.set('required', this.validateRequired)
    this.validationRules.set('string', this.validateString)
    this.validationRules.set('number', this.validateNumber)
    this.validationRules.set('boolean', this.validateBoolean)
    this.validationRules.set('email', this.validateEmail)
    this.validationRules.set('url', this.validateURL)
    this.validationRules.set('phone', this.validatePhone)
    
    // 字符串验证
    this.validationRules.set('minLength', this.validateMinLength)
    this.validationRules.set('maxLength', this.validateMaxLength)
    this.validationRules.set('pattern', this.validatePattern)
    this.validationRules.set('noWhitespace', this.validateNoWhitespace)
    this.validationRules.set('alphanumeric', this.validateAlphanumeric)
    
    // 数字验证
    this.validationRules.set('min', this.validateMin)
    this.validationRules.set('max', this.validateMax)
    this.validationRules.set('positive', this.validatePositive)
    this.validationRules.set('negative', this.validateNegative)
    this.validationRules.set('integer', this.validateInteger)
    this.validationRules.set('float', this.validateFloat)
    
    // 数组验证
    this.validationRules.set('array', this.validateArray)
    this.validationRules.set('minItems', this.validateMinItems)
    this.validationRules.set('maxItems', this.validateMaxItems)
    this.validationRules.set('uniqueItems', this.validateUniqueItems)
    
    // 对象验证
    this.validationRules.set('object', this.validateObject)
    this.validationRules.set('schema', this.validateSchema)
    
    // 高级验证
    this.validationRules.set('async', this.validateAsync)
    this.validationRules.set('conditional', this.validateConditional)
    this.validationRules.set('custom', this.validateCustom)
  }

  /**
   * 主要验证方法
   * @param {*} data - 要验证的数据
   * @param {Object} rules - 验证规则
   * @param {Object} options - 验证选项
   * @returns {Promise<Object>} 验证结果
   */
  async validate(data, rules = {}, options = {}) {
    const startTime = Date.now()
    const cacheKey = this.generateCacheKey(data, rules, options)
    
    // 检查缓存
    if (options.cache !== false && this.validationCache.has(cacheKey)) {
      return {
        ...this.validationCache.get(cacheKey),
        fromCache: true
      }
    }

    try {
      const result = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldResults: {},
        metadata: {
          duration: 0,
          rulesApplied: Object.keys(rules).length,
          timestamp: Date.now()
        }
      }

      // 验证数据
      await this.validateData(data, rules, options, result)

      // 计算验证时间
      result.metadata.duration = Date.now() - startTime

      // 缓存结果
      if (options.cache !== false) {
        this.validationCache.set(cacheKey, { ...result })
      }

      return result

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          code: 'VALIDATION_EXCEPTION',
          message: error.message,
          type: 'system'
        }],
        warnings: [],
        metadata: {
          duration: Date.now() - startTime,
          error: true
        }
      }
    }
  }

  /**
   * 字段验证方法
   * @param {string} field - 字段名
   * @param {*} value - 字段值
   * @param {Object} rules - 字段规则
   * @returns {Promise<Object>} 字段验证结果
   */
  async validateField(field, value, rules = {}) {
    const result = {
      field: field,
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    try {
      for (const [ruleName, ruleConfig] of Object.entries(rules)) {
        const ruleResult = await this.applyRule(ruleName, value, ruleConfig, {
          field: field,
          isFieldValidation: true
        })

        if (!ruleResult.valid) {
          result.isValid = false
          result.errors.push({
            rule: ruleName,
            message: ruleResult.message,
            code: ruleResult.code,
            value: value
          })
        }

        if (ruleResult.warning) {
          result.warnings.push({
            rule: ruleName,
            message: ruleResult.warning,
            code: ruleResult.code,
            value: value
          })
        }

        if (ruleResult.suggestion) {
          result.suggestions.push(ruleResult.suggestion)
        }
      }

    } catch (error) {
      result.isValid = false
      result.errors.push({
        code: 'FIELD_VALIDATION_ERROR',
        message: `字段验证失败: ${error.message}`
      })
    }

    return result
  }

  /**
   * 批量验证方法
   * @param {Array} items - 要验证的项目数组
   * @param {Object} rules - 验证规则
   * @param {Object} options - 验证选项
   * @returns {Promise<Object>} 批量验证结果
   */
  async validateBatch(items, rules, options = {}) {
    const results = []
    const startTime = Date.now()

    try {
      // 并行验证所有项目
      const promises = items.map(async (item, index) => {
        const itemResult = await this.validate(item, rules, {
          ...options,
          index
        })
        
        return {
          index,
          item,
          result: itemResult
        }
      })

      const batchResults = await Promise.all(promises)
      
      // 汇总结果
      const summary = this.aggregateBatchResults(batchResults)
      
      return {
        isValid: summary.validCount === items.length,
        totalItems: items.length,
        validCount: summary.validCount,
        invalidCount: summary.invalidCount,
        warningCount: summary.warningCount,
        results: batchResults,
        duration: Date.now() - startTime,
        summary
      }

    } catch (error) {
      return {
        isValid: false,
        totalItems: items.length,
        validCount: 0,
        invalidCount: items.length,
        warningCount: 0,
        results: [],
        duration: Date.now() - startTime,
        error: error.message
      }
    }
  }

  /**
   * 添加自定义验证器
   * @param {string} name - 验证器名称
   * @param {Function} validator - 验证函数
   * @param {Object} options - 验证器选项
   */
  addValidator(name, validator, options = {}) {
    this.customValidators.set(name, {
      validator,
      async: options.async || false,
      description: options.description,
      examples: options.examples
    })
  }

  /**
   * 生成验证建议
   * @param {*} data - 数据
   * @param {Object} rules - 规则
   * @param {Object} result - 验证结果
   * @returns {Array} 建议列表
   */
  generateSuggestions(data, rules, result) {
    const suggestions = []

    // 基于错误生成建议
    result.errors?.forEach(error => {
      if (error.rule) {
        const suggestion = this.getSuggestionForRule(error.rule, error.value, rules[error.rule])
        if (suggestion) {
          suggestions.push({
            type: 'error-fix',
            field: error.field,
            rule: error.rule,
            message: suggestion.message,
            autoFix: suggestion.autoFix,
            fixAction: suggestion.fixAction
          })
        }
      }
    })

    // 基于警告生成建议
    result.warnings?.forEach(warning => {
      if (warning.rule) {
        const suggestion = this.getSuggestionForRule(warning.rule, warning.value, rules[warning.rule])
        if (suggestion) {
          suggestions.push({
            type: 'warning-improvement',
            field: warning.field,
            rule: warning.rule,
            message: suggestion.message,
            autoFix: suggestion.autoFix,
            fixAction: suggestion.fixAction
          })
        }
      }
    })

    return suggestions
  }

  // 内部方法：验证数据
  async validateData(data, rules, options, result) {
    // 如果是对象且指定了字段规则
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      await this.validateObjectFields(data, rules, options, result)
    } else {
      // 验证单个值
      await this.validateValue(data, rules, options, result)
    }

    // 更新整体有效性
    result.isValid = result.errors.length === 0
  }

  // 内部方法：验证对象字段
  async validateObjectFields(data, rules, options, result) {
    for (const [field, fieldRules] of Object.entries(rules)) {
      const fieldResult = await this.validateField(field, data[field], fieldRules)
      result.fieldResults[field] = fieldResult

      // 合并错误和警告
      result.errors.push(...fieldResult.errors.map(err => ({
        ...err,
        field: field
      })))

      result.warnings.push(...fieldResult.warnings.map(warn => ({
        ...warn,
        field: field
      })))
    }
  }

  // 内部方法：验证单个值
  async validateValue(data, rules, options, result) {
    for (const [ruleName, ruleConfig] of Object.entries(rules)) {
      const ruleResult = await this.applyRule(ruleName, data, ruleConfig, options)

      if (!ruleResult.valid) {
        result.errors.push({
          rule: ruleName,
          message: ruleResult.message,
          code: ruleResult.code,
          value: data
        })
      }

      if (ruleResult.warning) {
        result.warnings.push({
          rule: ruleName,
          message: ruleResult.warning,
          code: ruleResult.code,
          value: data
        })
      }
    }
  }

  // 内部方法：应用验证规则
  async applyRule(ruleName, value, ruleConfig, options) {
    // 获取验证函数
    let validator = this.validationRules.get(ruleName)
    
    // 如果是自定义规则
    if (!validator && ruleName === 'custom') {
      const customValidator = this.customValidators.get(ruleConfig.name)
      if (customValidator) {
        validator = customValidator.validator
      }
    }

    if (!validator) {
      return {
        valid: false,
        message: `Unknown validation rule: ${ruleName}`,
        code: 'UNKNOWN_RULE'
      }
    }

    try {
      // 执行验证
      const result = await validator(value, ruleConfig, options)
      return result
    } catch (error) {
      return {
        valid: false,
        message: `Validation rule '${ruleName}' failed: ${error.message}`,
        code: 'RULE_EXECUTION_ERROR'
      }
    }
  }

  // 内部方法：生成缓存键
  generateCacheKey(data, rules, options) {
    return `${this.hashData(data)}_${this.hashData(rules)}_${this.hashData(options)}`
  }

  // 内部方法：哈希数据
  hashData(data) {
    return btoa(JSON.stringify(data)).substring(0, 16)
  }

  // 内部方法：汇总批量验证结果
  aggregateBatchResults(batchResults) {
    let validCount = 0
    let invalidCount = 0
    let warningCount = 0

    batchResults.forEach(({ result }) => {
      if (result.isValid) {
        validCount++
      } else {
        invalidCount++
      }
      
      if (result.warnings?.length > 0) {
        warningCount++
      }
    })

    return {
      validCount,
      invalidCount,
      warningCount
    }
  }

  // 内部方法：获取规则建议
  getSuggestionForRule(ruleName, value, ruleConfig) {
    const suggestions = {
      required: {
        message: '请提供必需的值',
        autoFix: false
      },
      email: {
        message: '请输入有效的邮箱地址',
        autoFix: true,
        fixAction: () => {
          if (typeof value === 'string') {
            return value.toLowerCase().trim()
          }
          return value
        }
      },
      minLength: {
        message: `最少需要 ${ruleConfig} 个字符`,
        autoFix: false
      },
      maxLength: {
        message: `最多允许 ${ruleConfig} 个字符`,
        autoFix: false
      },
      min: {
        message: `值不能小于 ${ruleConfig}`,
        autoFix: true,
        fixAction: () => Math.max(value, ruleConfig)
      },
      max: {
        message: `值不能大于 ${ruleConfig}`,
        autoFix: true,
        fixAction: () => Math.min(value, ruleConfig)
      },
      pattern: {
        message: '格式不正确',
        autoFix: false
      }
    }

    return suggestions[ruleName] || null
  }

  // 内置验证规则实现

  async validateRequired(value, config) {
    const isValid = value !== null && value !== undefined && value !== '' && 
                   (Array.isArray(value) ? value.length > 0 : true)
    
    return {
      valid: isValid,
      message: isValid ? null : '此字段为必填项',
      code: 'REQUIRED_MISSING'
    }
  }

  async validateString(value, config) {
    const isValid = typeof value === 'string'
    
    return {
      valid: isValid,
      message: isValid ? null : '值必须是字符串',
      code: 'INVALID_STRING'
    }
  }

  async validateNumber(value, config) {
    const isValid = typeof value === 'number' && !isNaN(value)
    
    return {
      valid: isValid,
      message: isValid ? null : '值必须是数字',
      code: 'INVALID_NUMBER'
    }
  }

  async validateEmail(value, config) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isValid = typeof value === 'string' && emailRegex.test(value)
    
    return {
      valid: isValid,
      message: isValid ? null : '请输入有效的邮箱地址',
      code: 'INVALID_EMAIL'
    }
  }

  async validateURL(value, config) {
    try {
      const url = new URL(value)
      const isValid = url.protocol === 'http:' || url.protocol === 'https:'
      
      return {
        valid: isValid,
        message: isValid ? null : '请输入有效的URL地址',
        code: 'INVALID_URL'
      }
    } catch {
      return {
        valid: false,
        message: '请输入有效的URL地址',
        code: 'INVALID_URL'
      }
    }
  }

  async validatePhone(value, config) {
    // 简单的手机号验证（中国）
    const phoneRegex = /^1[3-9]\d{9}$/
    const isValid = typeof value === 'string' && phoneRegex.test(value)
    
    return {
      valid: isValid,
      message: isValid ? null : '请输入有效的手机号',
      code: 'INVALID_PHONE'
    }
  }

  async validateMinLength(value, minLength) {
    if (typeof value !== 'string' && !Array.isArray(value)) {
      return {
        valid: true,
        message: null
      }
    }
    
    const isValid = value.length >= minLength
    
    return {
      valid: isValid,
      message: isValid ? null : `长度不能少于 ${minLength} 个字符`,
      code: 'MIN_LENGTH_VIOLATION'
    }
  }

  async validateMaxLength(value, maxLength) {
    if (typeof value !== 'string' && !Array.isArray(value)) {
      return {
        valid: true,
        message: null
      }
    }
    
    const isValid = value.length <= maxLength
    
    return {
      valid: isValid,
      message: isValid ? null : `长度不能超过 ${maxLength} 个字符`,
      code: 'MAX_LENGTH_VIOLATION'
    }
  }

  async validatePattern(value, pattern) {
    if (typeof value !== 'string') {
      return {
        valid: true,
        message: null
      }
    }
    
    const regex = new RegExp(pattern)
    const isValid = regex.test(value)
    
    return {
      valid: isValid,
      message: isValid ? null : '格式不正确',
      code: 'PATTERN_MISMATCH'
    }
  }

  async validateMin(value, min) {
    if (typeof value !== 'number') {
      return {
        valid: true,
        message: null
      }
    }
    
    const isValid = value >= min
    
    return {
      valid: isValid,
      message: isValid ? null : `值不能小于 ${min}`,
      code: 'MIN_VIOLATION'
    }
  }

  async validateMax(value, max) {
    if (typeof value !== 'number') {
      return {
        valid: true,
        message: null
      }
    }
    
    const isValid = value <= max
    
    return {
      valid: isValid,
      message: isValid ? null : `值不能大于 ${max}`,
      code: 'MAX_VIOLATION'
    }
  }

  async validateArray(value, config) {
    const isValid = Array.isArray(value)
    
    return {
      valid: isValid,
      message: isValid ? null : '值必须是数组',
      code: 'INVALID_ARRAY'
    }
  }

  async validateObject(value, config) {
    const isValid = typeof value === 'object' && value !== null && !Array.isArray(value)
    
    return {
      valid: isValid,
      message: isValid ? null : '值必须是对象',
      code: 'INVALID_OBJECT'
    }
  }

  async validateBoolean(value, config) {
    const isValid = typeof value === 'boolean'
    
    return {
      valid: isValid,
      message: isValid ? null : '值必须是布尔值',
      code: 'INVALID_BOOLEAN'
    }
  }

  async validateInteger(value, config) {
    const isValid = typeof value === 'number' && Number.isInteger(value)
    
    return {
      valid: isValid,
      message: isValid ? null : '值必须是整数',
      code: 'INVALID_INTEGER'
    }
  }

  async validateFloat(value, config) {
    const isValid = typeof value === 'number' && !Number.isInteger(value)
    
    return {
      valid: isValid,
      message: isValid ? null : '值必须是浮点数',
      code: 'INVALID_FLOAT'
    }
  }

  async validatePositive(value, config) {
    const isValid = typeof value === 'number' && value > 0
    
    return {
      valid: isValid,
      message: isValid ? null : '值必须是正数',
      code: 'NOT_POSITIVE'
    }
  }

  async validateNegative(value, config) {
    const isValid = typeof value === 'number' && value < 0
    
    return {
      valid: isValid,
      message: isValid ? null : '值必须是负数',
      code: 'NOT_NEGATIVE'
    }
  }

  async validateMinItems(value, minItems) {
    if (!Array.isArray(value)) {
      return {
        valid: true,
        message: null
      }
    }
    
    const isValid = value.length >= minItems
    
    return {
      valid: isValid,
      message: isValid ? null : `数组项数不能少于 ${minItems}`,
      code: 'MIN_ITEMS_VIOLATION'
    }
  }

  async validateMaxItems(value, maxItems) {
    if (!Array.isArray(value)) {
      return {
        valid: true,
        message: null
      }
    }
    
    const isValid = value.length <= maxItems
    
    return {
      valid: isValid,
      message: isValid ? null : `数组项数不能超过 ${maxItems}`,
      code: 'MAX_ITEMS_VIOLATION'
    }
  }

  async validateUniqueItems(value, config) {
    if (!Array.isArray(value)) {
      return {
        valid: true,
        message: null
      }
    }
    
    const uniqueItems = new Set(value)
    const isValid = uniqueItems.size === value.length
    
    return {
      valid: isValid,
      message: isValid ? null : '数组中存在重复项',
      code: 'DUPLICATE_ITEMS'
    }
  }

  async validateNoWhitespace(value, config) {
    if (typeof value !== 'string') {
      return {
        valid: true,
        message: null
      }
    }
    
    const isValid = !/\s/.test(value)
    
    return {
      valid: isValid,
      message: isValid ? null : '值不能包含空格',
      code: 'CONTAINS_WHITESPACE'
    }
  }

  async validateAlphanumeric(value, config) {
    if (typeof value !== 'string') {
      return {
        valid: true,
        message: null
      }
    }
    
    const isValid = /^[a-zA-Z0-9]+$/.test(value)
    
    return {
      valid: isValid,
      message: isValid ? null : '值只能包含字母和数字',
      code: 'INVALID_ALPHANUMERIC'
    }
  }

  async validateSchema(value, schema) {
    try {
      // 这里应该实现完整的JSON Schema验证
      // 简化实现，只检查基本结构
      const isValid = typeof value === 'object' && value !== null
      
      return {
        valid: isValid,
        message: isValid ? null : '数据不符合指定的schema',
        code: 'SCHEMA_VIOLATION'
      }
    } catch (error) {
      return {
        valid: false,
        message: 'Schema验证失败: ' + error.message,
        code: 'SCHEMA_ERROR'
      }
    }
  }

  async validateAsync(value, config) {
    try {
      if (typeof config.validator !== 'function') {
        return {
          valid: false,
          message: 'Async验证器必须是函数',
          code: 'INVALID_ASYNC_VALIDATOR'
        }
      }
      
      const result = await config.validator(value)
      
      return {
        valid: !!result.valid,
        message: result.message || 'Async验证失败',
        code: result.code || 'ASYNC_VALIDATION_FAILED'
      }
    } catch (error) {
      return {
        valid: false,
        message: 'Async验证异常: ' + error.message,
        code: 'ASYNC_VALIDATION_ERROR'
      }
    }
  }

  async validateConditional(value, config) {
    try {
      const { condition, rules, elseRules } = config
      
      // 评估条件
      let conditionMet = false
      if (typeof condition === 'function') {
        conditionMet = condition(value)
      } else if (typeof condition === 'object') {
        // 简单的条件评估
        conditionMet = this.evaluateCondition(value, condition)
      }
      
      // 根据条件应用不同的规则
      const rulesToApply = conditionMet ? rules : elseRules
      
      if (!rulesToApply) {
        return { valid: true, message: null }
      }
      
      return await this.validate(value, rulesToApply)
    } catch (error) {
      return {
        valid: false,
        message: '条件验证失败: ' + error.message,
        code: 'CONDITIONAL_VALIDATION_ERROR'
      }
    }
  }

  async validateCustom(value, config) {
    try {
      const customValidator = this.customValidators.get(config.name)
      
      if (!customValidator) {
        return {
          valid: false,
          message: `未找到自定义验证器: ${config.name}`,
          code: 'UNKNOWN_CUSTOM_VALIDATOR'
        }
      }
      
      const result = await customValidator.validator(value, config)
      
      return {
        valid: !!result.valid,
        message: result.message || '自定义验证失败',
        code: result.code || 'CUSTOM_VALIDATION_FAILED'
      }
    } catch (error) {
      return {
        valid: false,
        message: '自定义验证异常: ' + error.message,
        code: 'CUSTOM_VALIDATION_ERROR'
      }
    }
  }

  // 辅助方法
  evaluateCondition(value, condition) {
    if (condition.eq !== undefined) {
      return value === condition.eq
    }
    if (condition.ne !== undefined) {
      return value !== condition.ne
    }
    if (condition.gt !== undefined) {
      return value > condition.gt
    }
    if (condition.lt !== undefined) {
      return value < condition.lt
    }
    if (condition.gte !== undefined) {
      return value >= condition.gte
    }
    if (condition.lte !== undefined) {
      return value <= condition.lte
    }
    if (condition.in !== undefined) {
      return condition.in.includes(value)
    }
    if (condition.nin !== undefined) {
      return !condition.nin.includes(value)
    }
    
    return false
  }

  // 清除缓存
  clearCache() {
    this.validationCache.clear()
  }

  // 获取验证统计
  getStats() {
    return {
      builtinRules: this.validationRules.size,
      customValidators: this.customValidators.size,
      cacheSize: this.validationCache.size
    }
  }
}

// 导出单例实例
export const InputValidatorInstance = new InputValidator()

// 默认导出类
export default InputValidator