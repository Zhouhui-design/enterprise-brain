/**
 * 数据完整性验证工具
 * 用于确保系统数据的完整性和一致性
 */

import { eventBus } from '../services/event-bus'

class DataIntegrityChecker {
  constructor() {
    this.integrityRules = new Map()
    this.validationHistory = []
    this.issues = []
    this.lastCheckTime = null
    
    // 初始化默认规则
    this.initializeDefaultRules()
  }

  /**
   * 初始化默认的完整性规则
   */
  initializeDefaultRules() {
    // 必填字段规则
    this.addRule('required-fields', {
      description: '必填字段检查',
      priority: 'high',
      validator: (data, requiredFields) => {
        const missing = []
        requiredFields.forEach(field => {
          if (!this.hasValue(data[field])) {
            missing.push({
              field,
              type: 'missing_required',
              severity: 'high'
            })
          }
        })
        return missing
      }
    })

    // 数据类型规则
    this.addRule('type-validation', {
      description: '数据类型验证',
      priority: 'medium',
      validator: (data, typeSchema) => {
        const errors = []
        Object.entries(typeSchema).forEach(([field, expectedType]) => {
          const value = data[field]
          if (value !== undefined && !this.isValidType(value, expectedType)) {
            errors.push({
              field,
              type: 'type_mismatch',
              expected: expectedType,
              actual: typeof value,
              severity: 'medium'
            })
          }
        })
        return errors
      }
    })

    // 引用完整性规则
    this.addRule('reference-integrity', {
      description: '引用完整性检查',
      priority: 'high',
      validator: (data, references) => {
        const broken = []
        references.forEach(ref => {
          const { field, targetCollection, targetField } = ref
          const value = data[field]
          if (value && !this.checkReferenceExists(value, targetCollection, targetField)) {
            broken.push({
              field,
              type: 'broken_reference',
              reference: `${targetCollection}.${targetField}`,
              severity: 'high'
            })
          }
        })
        return broken
      }
    })

    // 业务逻辑一致性
    this.addRule('business-logic', {
      description: '业务逻辑一致性检查',
      priority: 'medium',
      validator: (data, rules) => {
        const violations = []
        rules.forEach(rule => {
          try {
            if (!rule.condition(data)) {
              violations.push({
                type: 'business_rule_violation',
                rule: rule.name,
                description: rule.description,
                severity: rule.severity || 'medium'
              })
            }
          } catch (error) {
            violations.push({
              type: 'rule_evaluation_error',
              rule: rule.name,
              error: error.message,
              severity: 'low'
            })
          }
        })
        return violations
      }
    })
  }

  /**
   * 添加完整性规则
   */
  addRule(name, rule) {
    this.integrityRules.set(name, rule)
  }

  /**
   * 移除完整性规则
   */
  removeRule(name) {
    return this.integrityRules.delete(name)
  }

  /**
   * 执行数据完整性检查
   */
  async checkIntegrity(data, options = {}) {
    const {
      rules = Array.from(this.integrityRules.keys()),
      includeWarnings = true,
      context = {}
    } = options

    const checkResult = {
      timestamp: new Date().toISOString(),
      dataId: this.generateDataId(data),
      status: 'passed',
      errors: [],
      warnings: [],
      info: [],
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0
      }
    }

    // 执行检查
    for (const ruleName of rules) {
      const rule = this.integrityRules.get(ruleName)
      if (!rule) continue

      try {
        const ruleConfig = context[ruleName] || {}
        const issues = rule.validator(data, ruleConfig)

        issues.forEach(issue => {
          issue.rule = ruleName
          issue.description = rule.description
          
          // 根据严重程度分类
          if (issue.severity === 'critical' || issue.severity === 'high') {
            checkResult.errors.push(issue)
            checkResult.summary.criticalIssues++
          } else if (issue.severity === 'medium') {
            checkResult.warnings.push(issue)
          } else {
            checkResult.info.push(issue)
          }
        })
      } catch (error) {
        checkResult.errors.push({
          rule: ruleName,
          type: 'rule_execution_error',
          error: error.message,
          severity: 'critical'
        })
        checkResult.summary.criticalIssues++
      }
    }

    // 计算总问题数
    checkResult.summary.totalIssues = 
      checkResult.errors.length + 
      checkResult.warnings.length + 
      (includeWarnings ? checkResult.info.length : 0)

    // 确定整体状态
    if (checkResult.summary.criticalIssues > 0) {
      checkResult.status = 'failed'
    } else if (checkResult.errors.length > 0) {
      checkResult.status = 'warning'
    }

    // 记录检查历史
    this.validationHistory.push(checkResult)
    
    // 更新最后检查时间
    this.lastCheckTime = checkResult.timestamp

    // 触发事件
    eventBus.emit('data-integrity-checked', {
      result: checkResult,
      data,
      context
    })

    return checkResult
  }

  /**
   * 批量检查数据完整性
   */
  async batchCheckIntegrity(dataList, options = {}) {
    const results = []
    const summary = {
      total: dataList.length,
      passed: 0,
      warning: 0,
      failed: 0,
      totalIssues: 0
    }

    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i]
      const result = await this.checkIntegrity(data, {
        ...options,
        context: {
          ...options.context,
          batchIndex: i
        }
      })

      results.push(result)
      
      // 更新汇总
      if (result.status === 'passed') {
        summary.passed++
      } else if (result.status === 'warning') {
        summary.warning++
      } else {
        summary.failed++
      }
      summary.totalIssues += result.summary.totalIssues
    }

    return {
      results,
      summary,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 自动修复数据完整性问题
   */
  async autoRepair(data, checkResult, repairOptions = {}) {
    const { autoFix = false, dryRun = false } = repairOptions
    const repairs = []

    if (!autoFix) {
      return { success: false, message: '自动修复未启用' }
    }

    // 遍历所有问题，尝试自动修复
    for (const error of checkResult.errors) {
      const repair = await this.attemptRepair(data, error)
      if (repair.success) {
        if (!dryRun) {
          // 应用修复
          data[repair.field] = repair.value
        }
        repairs.push(repair)
      }
    }

    return {
      success: true,
      repairs,
      message: dryRun ? '修复预览完成' : '自动修复完成'
    }
  }

  /**
   * 尝试修复单个问题
   */
  async attemptRepair(data, error) {
    switch (error.type) {
      case 'missing_required':
        // 为缺失的必填字段提供默认值
        return {
          success: true,
          field: error.field,
          value: this.getDefaultValue(error.field),
          action: '设置默认值'
        }
      
      case 'type_mismatch':
        // 尝试类型转换
        const converted = this.convertType(data[error.field], error.expected)
        if (converted.success) {
          return {
            success: true,
            field: error.field,
            value: converted.value,
            action: '类型转换'
          }
        }
        break
      
      case 'broken_reference':
        // 尝试修复引用（需要根据具体业务逻辑实现）
        return {
          success: false,
          field: error.field,
          reason: '引用修复需要手动处理'
        }
    }

    return { success: false }
  }

  /**
   * 获取字段的默认值
   */
  getDefaultValue(field) {
    const defaults = {
      id: '',
      name: '',
      email: '',
      phone: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      enabled: true,
      count: 0,
      amount: 0
    }

    return defaults[field] || ''
  }

  /**
   * 类型转换
   */
  convertType(value, targetType) {
    try {
      switch (targetType) {
        case 'string':
          return { success: true, value: String(value) }
        case 'number':
          return { success: true, value: Number(value) }
        case 'boolean':
          return { success: true, value: Boolean(value) }
        case 'date':
          return { success: true, value: new Date(value) }
        default:
          return { success: false }
      }
    } catch {
      return { success: false }
    }
  }

  /**
   * 检查引用是否存在
   */
  checkReferenceExists(value, targetCollection, targetField) {
    // 这里需要根据实际的数据存储实现
    // 暂时返回 true，实际使用时需要查询数据库或存储
    return true
  }

  /**
   * 检查值是否存在
   */
  hasValue(value) {
    return value !== null && value !== undefined && value !== ''
  }

  /**
   * 检查数据类型是否有效
   */
  isValidType(value, expectedType) {
    if (value === null || value === undefined) return true
    
    const actualType = Array.isArray(value) ? 'array' : typeof value
    return actualType === expectedType
  }

  /**
   * 生成数据ID
   */
  generateDataId(data) {
    return data.id || 
           `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取验证历史
   */
  getValidationHistory(options = {}) {
    const { limit = 100, status, since } = options
    let history = [...this.validationHistory]

    // 过滤
    if (status) {
      history = history.filter(item => item.status === status)
    }
    if (since) {
      history = history.filter(item => new Date(item.timestamp) >= new Date(since))
    }

    // 排序和限制
    return history
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
  }

  /**
   * 获取完整性统计
   */
  getIntegrityStats() {
    const recent = this.getValidationHistory({ limit: 100 })
    const stats = {
      totalChecks: recent.length,
      passed: 0,
      warning: 0,
      failed: 0,
      averageIssues: 0,
      mostCommonIssues: {},
      lastCheck: this.lastCheckTime
    }

    recent.forEach(result => {
      if (result.status === 'passed') stats.passed++
      else if (result.status === 'warning') stats.warning++
      else stats.failed++

      stats.averageIssues += result.summary.totalIssues

      // 统计最常见的问题
      [...result.errors, ...result.warnings, ...result.info].forEach(issue => {
        stats.mostCommonIssues[issue.type] = 
          (stats.mostCommonIssues[issue.type] || 0) + 1
      })
    })

    if (stats.totalChecks > 0) {
      stats.averageIssues = Math.round(stats.averageIssues / stats.totalChecks * 100) / 100
    }

    return stats
  }

  /**
   * 清除验证历史
   */
  clearHistory() {
    this.validationHistory = []
    this.issues = []
  }
}

// 创建单例实例
export const dataIntegrityChecker = new DataIntegrityChecker()

// 导出类和实用函数
export {
  DataIntegrityChecker
}

// 便捷函数
export async function validateDataIntegrity(data, options = {}) {
  return await dataIntegrityChecker.checkIntegrity(data, options)
}

export async function validateBatchIntegrity(dataList, options = {}) {
  return await dataIntegrityChecker.batchCheckIntegrity(dataList, options)
}

export function getIntegrityStats() {
  return dataIntegrityChecker.getIntegrityStats()
}