/**
 * 业务规则验证器
 * 提供业务层面的数据验证和规则检查
 */
export class BusinessRules {
  constructor() {
    this.rules = new Map()
    this.ruleCategories = new Map()
    this.ruleContext = new Map()
    
    this.initializeBuiltinRules()
  }

  /**
   * 初始化内置业务规则
   */
  initializeBuiltinRules() {
    // 用户相关规则
    this.addRule('user.email.unique', this.validateUniqueEmail, {
      category: 'user',
      description: '邮箱地址唯一性验证',
      async: true
    })

    this.addRule('user.age.restriction', this.validateAgeRestriction, {
      category: 'user',
      description: '年龄限制验证',
      params: { minAge: 18, maxAge: 120 }
    })

    this.addRule('user.password.strength', this.validatePasswordStrength, {
      category: 'user',
      description: '密码强度验证',
      params: { minLength: 8, requireUppercase: true, requireNumbers: true }
    })

    // 订单相关规则
    this.addRule('order.amount.limit', this.validateOrderAmountLimit, {
      category: 'order',
      description: '订单金额限制',
      params: { maxAmount: 10000 }
    })

    this.addRule('order.inventory.check', this.validateInventoryCheck, {
      category: 'order',
      description: '库存检查',
      async: true
    })

    this.addRule('order.shipping.time', this.validateShippingTime, {
      category: 'order',
      description: '配送时间验证'
    })

    // 产品相关规则
    this.addRule('product.price.range', this.validatePriceRange, {
      category: 'product',
      description: '产品价格范围验证',
      params: { minPrice: 0, maxPrice: 99999 }
    })

    this.addRule('product.stock.warning', this.validateStockWarning, {
      category: 'product',
      description: '库存预警'
    })

    this.addRule('product.category.consistency', this.validateCategoryConsistency, {
      category: 'product',
      description: '产品分类一致性'
    })

    // 数据完整性规则
    this.addRule('data.reference.integrity', this.validateReferenceIntegrity, {
      category: 'data',
      description: '引用完整性检查',
      async: true
    })

    this.addRule('data.duplicate.check', this.validateDuplicateCheck, {
      category: 'data',
      description: '重复数据检查',
      async: true
    })

    // 业务流程规则
    this.addRule('workflow.approval.chain', this.validateApprovalChain, {
      category: 'workflow',
      description: '审批链验证',
      async: true
    })

    this.addRule('workflow.deadline.check', this.validateDeadlineCheck, {
      category: 'workflow',
      description: '截止时间检查'
    })

    this.addRule('workflow.permission.check', this.validatePermissionCheck, {
      category: 'workflow',
      description: '权限检查',
      async: true
    })

    // 财务相关规则
    this.addRule('finance.budget.limit', this.validateBudgetLimit, {
      category: 'finance',
      description: '预算限制检查'
    })

    this.addRule('finance.transaction.duplicate', this.validateTransactionDuplicate, {
      category: 'finance',
      description: '重复交易检查',
      async: true
    })

    this.addRule('finance.amount.precision', this.validateAmountPrecision, {
      category: 'finance',
      description: '金额精度检查'
    })
  }

  /**
   * 主要验证方法
   * @param {*} data - 要验证的数据
   * @param {Object} rules - 验证规则配置
   * @param {Object} context - 验证上下文
   * @returns {Promise<Object>} 验证结果
   */
  async validate(data, rules = {}, context = {}) {
    const startTime = Date.now()
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      passedRules: [],
      failedRules: [],
      metadata: {
        duration: 0,
        rulesChecked: 0,
        context: context
      }
    }

    try {
      // 验证每个规则
      for (const [ruleKey, ruleConfig] of Object.entries(rules)) {
        const ruleResult = await this.validateRule(ruleKey, data, ruleConfig, context)
        
        results.rulesChecked++
        results.metadata.rulesChecked++

        if (ruleResult.valid) {
          results.passedRules.push({
            rule: ruleKey,
            message: ruleResult.message || `规则 ${ruleKey} 验证通过`,
            category: ruleResult.category
          })
        } else {
          results.isValid = false
          results.failedRules.push({
            rule: ruleKey,
            message: ruleResult.message || `规则 ${ruleKey} 验证失败`,
            severity: ruleResult.severity || 'error',
            category: ruleResult.category,
            suggestions: ruleResult.suggestions
          })

          if (ruleResult.severity === 'error') {
            results.errors.push({
              code: ruleKey,
              message: ruleResult.message,
              rule: ruleKey,
              category: ruleResult.category,
              suggestions: ruleResult.suggestions
            })
          } else if (ruleResult.severity === 'warning') {
            results.warnings.push({
              code: ruleKey,
              message: ruleResult.message,
              rule: ruleKey,
              category: ruleResult.category,
              suggestions: ruleResult.suggestions
            })
          }
        }
      }

      results.metadata.duration = Date.now() - startTime

      return results

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          code: 'BUSINESS_RULE_VALIDATION_ERROR',
          message: `业务规则验证失败: ${error.message}`,
          category: 'system'
        }],
        warnings: [],
        passedRules: [],
        failedRules: [],
        metadata: {
          duration: Date.now() - startTime,
          error: true
        }
      }
    }
  }

  /**
   * 验证单个规则
   * @param {string} ruleKey - 规则键
   * @param {*} data - 数据
   * @param {Object} config - 规则配置
   * @param {Object} context - 上下文
   * @returns {Promise<Object>} 规则验证结果
   */
  async validateRule(ruleKey, data, config = {}, context = {}) {
    try {
      const rule = this.rules.get(ruleKey)
      
      if (!rule) {
        return {
          valid: false,
          message: `未找到业务规则: ${ruleKey}`,
          severity: 'error'
        }
      }

      // 准备规则参数
      const params = { ...rule.params, ...config }
      
      // 执行规则验证
      const result = await rule.validator(data, params, context, config)
      
      // 确保结果包含必要字段
      return {
        valid: result.valid !== false,
        message: result.message,
        severity: result.severity || 'error',
        category: rule.category,
        suggestions: result.suggestions || [],
        data: result.data
      }

    } catch (error) {
      return {
        valid: false,
        message: `规则 ${ruleKey} 执行失败: ${error.message}`,
        severity: 'error'
      }
    }
  }

  /**
   * 添加业务规则
   * @param {string} key - 规则键
   * @param {Function} validator - 验证函数
   * @param {Object} options - 规则选项
   */
  addRule(key, validator, options = {}) {
    this.rules.set(key, {
      validator,
      category: options.category || 'custom',
      description: options.description || '',
      params: options.params || {},
      async: options.async || false,
      priority: options.priority || 0,
      enabled: options.enabled !== false
    })

    // 按分类组织规则
    if (!this.ruleCategories.has(options.category)) {
      this.ruleCategories.set(options.category, new Set())
    }
    this.ruleCategories.get(options.category).add(key)
  }

  /**
   * 移除业务规则
   * @param {string} key - 规则键
   */
  removeRule(key) {
    const rule = this.rules.get(key)
    if (rule) {
      this.ruleCategories.get(rule.category)?.delete(key)
      this.rules.delete(key)
    }
  }

  /**
   * 获取分类下的所有规则
   * @param {string} category - 分类名称
   * @returns {Array} 规则列表
   */
  getRulesByCategory(category) {
    const ruleKeys = this.ruleCategories.get(category) || new Set()
    return Array.from(ruleKeys).map(key => ({
      key,
      ...this.rules.get(key)
    }))
  }

  /**
   * 获取所有分类
   * @returns {Array} 分类列表
   */
  getCategories() {
    return Array.from(this.ruleCategories.keys())
  }

  /**
   * 生成业务建议
   * @param {*} data - 数据
   * @param {Object} validationResult - 验证结果
   * @returns {Array} 建议列表
   */
  static generateSuggestions(data, validationResult) {
    const suggestions = []

    // 基于失败规则生成建议
    validationResult.failedRules?.forEach(failedRule => {
      if (failedRule.suggestions && failedRule.suggestions.length > 0) {
        suggestions.push(...failedRule.suggestions.map(suggestion => ({
          type: 'rule-violation-fix',
          rule: failedRule.rule,
          category: failedRule.category,
          message: suggestion,
          priority: failedRule.severity === 'error' ? 'high' : 'medium'
        })))
      }
    })

    // 基于数据模式生成通用建议
    if (data && typeof data === 'object') {
      suggestions.push(...BusinessRules.generateDataSuggestions(data))
    }

    return suggestions
  }

  /**
   * 生成数据相关建议
   * @param {Object} data - 数据对象
   * @returns {Array} 建议列表
   */
  static generateDataSuggestions(data) {
    const suggestions = []

    // 检查缺失的必填字段
    if (data.email && !data.name) {
      suggestions.push({
        type: 'data-completeness',
        message: '建议添加姓名信息以提高数据完整性',
        priority: 'low'
      })
    }

    // 检查数据一致性
    if (data.phone && !data.email) {
      suggestions.push({
        type: 'data-consistency',
        message: '建议同时提供邮箱和电话信息',
        priority: 'low'
      })
    }

    return suggestions
  }

  // 内置业务规则实现

  async validateUniqueEmail(data, params, context) {
    try {
      // 模拟API调用检查邮箱唯一性
      const exists = await this.checkEmailExists(data.email, context)
      
      return {
        valid: !exists,
        message: exists ? '该邮箱地址已被使用' : '邮箱地址唯一',
        suggestions: exists ? [
          '请使用其他邮箱地址',
          '或者找回已有账户'
        ] : []
      }
    } catch (error) {
      return {
        valid: false,
        message: '邮箱唯一性检查失败',
        severity: 'warning'
      }
    }
  }

  async validateAgeRestriction(data, params) {
    const age = data.age
    const { minAge, maxAge } = params

    if (age < minAge) {
      return {
        valid: false,
        message: `年龄不能小于 ${minAge} 岁`,
        suggestions: [`请确认年龄输入是否正确`]
      }
    }

    if (age > maxAge) {
      return {
        valid: false,
        message: `年龄不能大于 ${maxAge} 岁`,
        suggestions: [`请确认年龄输入是否正确`]
      }
    }

    return {
      valid: true,
      message: '年龄符合要求'
    }
  }

  async validatePasswordStrength(data, params) {
    const password = data.password
    const { minLength, requireUppercase, requireNumbers, requireSpecialChars } = params

    const checks = {
      minLength: password.length >= minLength,
      hasUppercase: !requireUppercase || /[A-Z]/.test(password),
      hasNumbers: !requireNumbers || /\d/.test(password),
      hasSpecialChars: !requireSpecialChars || /[!@#$%^&*]/.test(password)
    }

    const passedChecks = Object.values(checks).filter(Boolean).length
    const totalChecks = Object.keys(checks).length

    if (passedChecks === totalChecks) {
      return {
        valid: true,
        message: '密码强度符合要求'
      }
    }

    const suggestions = []
    if (!checks.minLength) suggestions.push(`密码长度至少需要 ${minLength} 位`)
    if (!checks.hasUppercase) suggestions.push('密码需要包含大写字母')
    if (!checks.hasNumbers) suggestions.push('密码需要包含数字')
    if (!checks.hasSpecialChars) suggestions.push('密码需要包含特殊字符')

    return {
      valid: false,
      message: `密码强度不足 (${passedChecks}/${totalChecks} 项检查通过)`,
      suggestions
    }
  }

  async validateOrderAmountLimit(data, params) {
    const amount = data.amount || data.totalAmount
    const { maxAmount } = params

    if (amount > maxAmount) {
      return {
        valid: false,
        message: `订单金额超过限制 (¥${amount.toFixed(2)} > ¥${maxAmount.toFixed(2)})`,
        severity: 'warning',
        suggestions: [
          '请确认订单金额是否正确',
          '如需大额订单，请联系客服'
        ]
      }
    }

    return {
      valid: true,
      message: '订单金额在允许范围内'
    }
  }

  async validateInventoryCheck(data, params, context) {
    try {
      // 模拟库存检查
      const items = data.items || []
      const inventoryIssues = []

      for (const item of items) {
        const stock = await this.getProductStock(item.productId, context)
        if (stock < item.quantity) {
          inventoryIssues.push(`${item.productName || item.productId}: 库存不足 (${stock} < ${item.quantity})`)
        }
      }

      if (inventoryIssues.length > 0) {
        return {
          valid: false,
          message: '部分商品库存不足',
          suggestions: [
            '调整商品数量',
            '选择其他商品',
            '联系客服补货'
          ]
        }
      }

      return {
        valid: true,
        message: '库存充足'
      }
    } catch (error) {
      return {
        valid: false,
        message: '库存检查失败',
        severity: 'warning'
      }
    }
  }

  async validateShippingTime(data, params, context) {
    const shippingDate = data.shippingDate || data.deliveryDate
    
    if (!shippingDate) {
      return {
        valid: false,
        message: '请指定配送日期',
        suggestions: ['选择合适的配送时间']
      }
    }

    const now = new Date()
    const shippingDateTime = new Date(shippingDate)
    const minDays = params.minDays || 1
    const maxDays = params.maxDays || 30

    const daysDiff = Math.ceil((shippingDateTime - now) / (1000 * 60 * 60 * 24))

    if (daysDiff < minDays) {
      return {
        valid: false,
        message: `配送时间太早，至少需要提前 ${minDays} 天`,
        suggestions: ['选择更晚的配送时间']
      }
    }

    if (daysDiff > maxDays) {
      return {
        valid: false,
        severity: 'warning',
        message: `配送时间过远，建议不超过 ${maxDays} 天`,
        suggestions: ['选择更近的配送时间']
      }
    }

    return {
      valid: true,
      message: '配送时间合理'
    }
  }

  async validatePriceRange(data, params) {
    const price = data.price || data.unitPrice
    const { minPrice, maxPrice } = params

    if (price < minPrice) {
      return {
        valid: false,
        message: `价格不能低于 ¥${minPrice.toFixed(2)}`,
        suggestions: ['调整价格到合理范围']
      }
    }

    if (price > maxPrice) {
      return {
        valid: false,
        severity: 'warning',
        message: `价格过高 (¥${price.toFixed(2)})`,
        suggestions: ['确认价格是否正确']
      }
    }

    return {
      valid: true,
      message: '价格在合理范围内'
    }
  }

  async validateStockWarning(data, params) {
    const stock = data.stock || data.inventory
    const warningLevel = params.warningLevel || 10

    if (stock <= warningLevel) {
      return {
        valid: true,
        severity: 'warning',
        message: `库存偏低 (剩余 ${stock} 件)`,
        suggestions: [
          '及时补货',
          '考虑设置库存预警'
        ]
      }
    }

    return {
      valid: true,
      message: '库存充足'
    }
  }

  async validateCategoryConsistency(data, params) {
    const { category, subCategory, attributes } = data

    if (category && subCategory) {
      // 模拟检查分类一致性
      const validCombinations = await this.getValidCategoryCombinations()
      const combination = `${category}.${subCategory}`
      
      if (!validCombinations.includes(combination)) {
        return {
          valid: false,
          message: '产品分类不一致',
          suggestions: [
            '检查分类选择是否正确',
            '查看分类匹配规则'
          ]
        }
      }
    }

    return {
      valid: true,
      message: '分类信息一致'
    }
  }

  async validateReferenceIntegrity(data, params, context) {
    const references = params.references || []
    const issues = []

    for (const ref of references) {
      const refValue = data[ref.field]
      if (refValue) {
        const exists = await this.checkReferenceExists(ref.table, ref.field, refValue, context)
        if (!exists) {
          issues.push(`${ref.field} 引用的记录不存在: ${refValue}`)
        }
      }
    }

    if (issues.length > 0) {
      return {
        valid: false,
        message: '数据引用完整性检查失败',
        suggestions: [
          '检查关联数据是否存在',
          '确保外键引用正确'
        ]
      }
    }

    return {
      valid: true,
      message: '引用完整性检查通过'
    }
  }

  async validateDuplicateCheck(data, params, context) {
    const { fields, table } = params
    const conditions = {}

    // 构建重复检查条件
    for (const field of fields) {
      if (data[field]) {
        conditions[field] = data[field]
      }
    }

    if (Object.keys(conditions).length === 0) {
      return {
        valid: true,
        message: '无需重复检查'
      }
    }

    try {
      const exists = await this.checkDuplicateExists(table, conditions, context)
      
      return {
        valid: !exists,
        message: exists ? '发现重复数据' : '无重复数据',
        suggestions: exists ? [
          '检查是否为重复提交',
          '确认数据唯一性'
        ] : []
      }
    } catch (error) {
      return {
        valid: false,
        severity: 'warning',
        message: '重复检查失败'
      }
    }
  }

  async validateApprovalChain(data, params, context) {
    const { approvers, amount } = data
    const approvalRules = params.rules || []

    if (!approvers || approvers.length === 0) {
      return {
        valid: false,
        message: '必须指定审批人',
        suggestions: ['添加审批人']
      }
    }

    // 根据金额检查审批层级
    let requiredLevels = 1
    for (const rule of approvalRules) {
      if (amount >= rule.minAmount) {
        requiredLevels = Math.max(requiredLevels, rule.requiredLevels)
      }
    }

    if (approvers.length < requiredLevels) {
      return {
        valid: false,
        message: `审批人数量不足 (需要 ${requiredLevels} 层，当前 ${approvers.length} 层)`,
        suggestions: [`添加足够的审批人 (${requiredLevels - approvers.length} 人)`]
      }
    }

    return {
      valid: true,
      message: '审批链配置正确'
    }
  }

  async validateDeadlineCheck(data, params) {
    const deadline = data.deadline || data.dueDate
    
    if (!deadline) {
      return {
        valid: false,
        message: '必须设置截止时间',
        suggestions: ['设置合理的截止时间']
      }
    }

    const now = new Date()
    const deadlineTime = new Date(deadline)
    const minDays = params.minDays || 1

    if (deadlineTime <= now) {
      return {
        valid: false,
        message: '截止时间不能早于当前时间',
        suggestions: ['设置更晚的截止时间']
      }
    }

    if (deadlineTime <= new Date(now.getTime() + minDays * 24 * 60 * 60 * 1000)) {
      return {
        valid: true,
        severity: 'warning',
        message: '截止时间过近',
        suggestions: ['考虑延长截止时间']
      }
    }

    return {
      valid: true,
      message: '截止时间设置合理'
    }
  }

  async validatePermissionCheck(data, params, context) {
    const { action, resource } = data
    const userPermissions = context.userPermissions || []

    if (!action || !resource) {
      return {
        valid: false,
        message: '必须指定操作和资源',
        suggestions: ['提供完整的操作信息']
      }
    }

    const requiredPermission = `${resource}:${action}`
    const hasPermission = userPermissions.some(perm => 
      perm === requiredPermission || perm === `${resource}:*` || perm === '*:*'
    )

    if (!hasPermission) {
      return {
        valid: false,
        message: '权限不足',
        suggestions: [
          '申请相应权限',
          '联系管理员授权'
        ]
      }
    }

    return {
      valid: true,
      message: '权限检查通过'
    }
  }

  async validateBudgetLimit(data, params) {
    const { amount, budgetId } = data
    
    if (!budgetId) {
      return {
        valid: true,
        message: '未指定预算，跳过预算检查'
      }
    }

    try {
      const budget = await this.getBudgetInfo(budgetId)
      const usedAmount = budget.usedAmount + amount
      const totalBudget = budget.totalAmount

      if (usedAmount > totalBudget) {
        return {
          valid: false,
          message: `超出预算限制 (¥${usedAmount.toFixed(2)} > ¥${totalBudget.toFixed(2)})`,
          severity: 'error',
          suggestions: [
            '减少申请金额',
            '申请预算调整',
            '分批执行'
          ]
        }
      }

      const usageRate = usedAmount / totalBudget
      if (usageRate > 0.9) {
        return {
          valid: true,
          severity: 'warning',
          message: `预算即将用完 (${(usageRate * 100).toFixed(1)}%)`,
          suggestions: ['关注预算使用情况']
        }
      }

      return {
        valid: true,
        message: '预算充足'
      }
    } catch (error) {
      return {
        valid: false,
        severity: 'warning',
        message: '预算检查失败'
      }
    }
  }

  async validateTransactionDuplicate(data, params, context) {
    const { amount, date, description } = data
    const timeWindow = params.timeWindow || 300000 // 5分钟

    try {
      const duplicates = await this.findDuplicateTransactions({
        amount,
        date,
        description,
        timeWindow
      }, context)

      if (duplicates.length > 0) {
        return {
          valid: false,
          message: '发现重复交易',
          suggestions: [
            '确认是否为重复提交',
            '检查交易详情'
          ]
        }
      }

      return {
        valid: true,
        message: '无重复交易'
      }
    } catch (error) {
      return {
        valid: false,
        severity: 'warning',
        message: '重复交易检查失败'
      }
    }
  }

  async validateAmountPrecision(data, params) {
    const { amount } = data
    const precision = params.precision || 2

    if (typeof amount !== 'number') {
      return {
        valid: false,
        message: '金额必须是数字',
        suggestions: ['提供正确的金额数值']
      }
    }

    const decimals = amount.toString().split('.')[1]?.length || 0
    
    if (decimals > precision) {
      return {
        valid: false,
        message: `金额精度超限 (${decimals} > ${precision} 位小数)`,
        suggestions: [`金额保留 ${precision} 位小数`]
      }
    }

    return {
      valid: true,
      message: '金额精度正确'
    }
  }

  // 模拟辅助方法（实际应用中应该调用真实的API）

  async checkEmailExists(email, context) {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 100))
    return false // 假设邮箱不存在
  }

  async getProductStock(productId, context) {
    // 模拟库存查询
    await new Promise(resolve => setTimeout(resolve, 50))
    return Math.floor(Math.random() * 100) + 10
  }

  async getValidCategoryCombinations() {
    // 模拟分类数据
    return [
      'electronics.phone',
      'electronics.computer',
      'clothing.shirt',
      'clothing.pants'
    ]
  }

  async checkReferenceExists(table, field, value, context) {
    // 模拟引用检查
    await new Promise(resolve => setTimeout(resolve, 50))
    return true // 假设引用存在
  }

  async checkDuplicateExists(table, conditions, context) {
    // 模拟重复检查
    await new Promise(resolve => setTimeout(resolve, 100))
    return false // 假设无重复
  }

  async getBudgetInfo(budgetId) {
    // 模拟预算信息
    return {
      totalAmount: 10000,
      usedAmount: 3000
    }
  }

  async findDuplicateTransactions(criteria, context) {
    // 模拟重复交易查询
    await new Promise(resolve => setTimeout(resolve, 100))
    return []
  }
}

// 导出单例实例
export const BusinessRulesInstance = new BusinessRules()

// 默认导出类
export default BusinessRules