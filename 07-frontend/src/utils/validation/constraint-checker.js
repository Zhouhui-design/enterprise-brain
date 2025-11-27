/**
 * 约束检查器工具
 * 用于检查业务约束、数据约束和操作约束
 */

import { eventBus } from '../services/event-bus'

class ConstraintChecker {
  constructor() {
    this.constraints = new Map()
    this.constraintGroups = new Map()
    this.violationHistory = []
    this.activeConstraints = new Set()
    
    // 初始化默认约束
    this.initializeDefaultConstraints()
  }

  /**
   * 初始化默认约束
   */
  initializeDefaultConstraints() {
    // 数据长度约束
    this.addConstraint('string-length', {
      description: '字符串长度限制',
      category: 'data',
      priority: 'medium',
      validator: (value, { min, max, field }) => {
        if (typeof value !== 'string') return { valid: true }
        
        const length = value.length
        const violations = []
        
        if (min !== undefined && length < min) {
          violations.push({
            field,
            type: 'min_length',
            actual: length,
            required: min,
            message: `${field} 长度不能少于 ${min} 个字符`
          })
        }
        
        if (max !== undefined && length > max) {
          violations.push({
            field,
            type: 'max_length',
            actual: length,
            allowed: max,
            message: `${field} 长度不能超过 ${max} 个字符`
          })
        }
        
        return {
          valid: violations.length === 0,
          violations
        }
      }
    })

    // 数值范围约束
    this.addConstraint('numeric-range', {
      description: '数值范围限制',
      category: 'data',
      priority: 'high',
      validator: (value, { min, max, field }) => {
        if (typeof value !== 'number') return { valid: true }
        
        const violations = []
        
        if (min !== undefined && value < min) {
          violations.push({
            field,
            type: 'min_value',
            actual: value,
            required: min,
            message: `${field} 值不能小于 ${min}`
          })
        }
        
        if (max !== undefined && value > max) {
          violations.push({
            field,
            type: 'max_value',
            actual: value,
            allowed: max,
            message: `${field} 值不能大于 ${max}`
          })
        }
        
        return {
          valid: violations.length === 0,
          violations
        }
      }
    })

    // 正则表达式约束
    this.addConstraint('regex-pattern', {
      description: '正则表达式匹配',
      category: 'format',
      priority: 'high',
      validator: (value, { pattern, field, flags = 'g' }) => {
        if (typeof value !== 'string') return { valid: true }
        
        try {
          const regex = new RegExp(pattern, flags)
          const valid = regex.test(value)
          
          return {
            valid,
            violations: valid ? [] : [{
              field,
              type: 'pattern_mismatch',
              pattern,
              message: `${field} 格式不正确`
            }]
          }
        } catch (error) {
          return {
            valid: false,
            violations: [{
              field,
              type: 'invalid_regex',
              pattern,
              error: error.message,
              message: `正则表达式 ${pattern} 无效`
            }]
          }
        }
      }
    })

    // 唯一性约束
    this.addConstraint('uniqueness', {
      description: '唯一性约束',
      category: 'business',
      priority: 'high',
      validator: async (value, { field, collection, context = {} }) => {
        // 这里需要根据实际的数据存储实现查询
        // 暂时返回验证通过
        return {
          valid: true,
          violations: []
        }
      }
    })

    // 依赖关系约束
    this.addConstraint('dependency', {
      description: '字段依赖关系',
      category: 'business',
      priority: 'medium',
      validator: (data, { dependencies }) => {
        const violations = []
        
        dependencies.forEach(dep => {
          const { field, dependsOn, condition } = dep
          const fieldValue = data[field]
          const dependsValue = data[dependsOn]
          
          // 检查依赖条件
          if (condition) {
            const conditionMet = this.evaluateCondition(dependsValue, condition)
            if (conditionMet && !fieldValue) {
              violations.push({
                field,
                type: 'missing_dependency',
                dependsOn,
                condition,
                message: `当 ${dependsOn} 满足条件时，${field} 不能为空`
              })
            }
          } else if (dependsValue && !fieldValue) {
            violations.push({
              field,
              type: 'missing_dependency',
              dependsOn,
              message: `当 ${dependsOn} 有值时，${field} 不能为空`
            })
          }
        })
        
        return {
          valid: violations.length === 0,
          violations
        }
      }
    })

    // 业务规则约束
    this.addConstraint('business-rule', {
      description: '业务规则约束',
      category: 'business',
      priority: 'high',
      validator: (data, { rules }) => {
        const violations = []
        
        rules.forEach(rule => {
          try {
            const result = rule.validate(data)
            if (!result.valid) {
              violations.push({
                type: 'business_rule_violation',
                rule: rule.name,
                message: result.message || `违反业务规则: ${rule.name}`,
                severity: rule.severity || 'medium'
              })
            }
          } catch (error) {
            violations.push({
              type: 'rule_execution_error',
              rule: rule.name,
              error: error.message,
              message: `执行业务规则 ${rule.name} 时出错`
            })
          }
        })
        
        return {
          valid: violations.length === 0,
          violations
        }
      }
    })

    // 时间约束
    this.addConstraint('time-constraint', {
      description: '时间相关约束',
      category: 'temporal',
      priority: 'medium',
      validator: (value, { field, type, params }) => {
        const violations = []
        const now = new Date()
        const dateValue = new Date(value)
        
        switch (type) {
          case 'past':
            if (dateValue > now) {
              violations.push({
                field,
                type: 'future_date',
                message: `${field} 不能是未来时间`
              })
            }
            break
          
          case 'future':
            if (dateValue < now) {
              violations.push({
                field,
                type: 'past_date',
                message: `${field} 不能是过去时间`
              })
            }
            break
          
          case 'range':
            const { start, end } = params
            if (dateValue < new Date(start) || dateValue > new Date(end)) {
              violations.push({
                field,
                type: 'date_out_of_range',
                start,
                end,
                message: `${field} 必须在 ${start} 和 ${end} 之间`
              })
            }
            break
        }
        
        return {
          valid: violations.length === 0,
          violations
        }
      }
    })
  }

  /**
   * 添加约束
   */
  addConstraint(name, constraint) {
    this.constraints.set(name, constraint)
    
    // 添加到分组
    if (!this.constraintGroups.has(constraint.category)) {
      this.constraintGroups.set(constraint.category, new Set())
    }
    this.constraintGroups.get(constraint.category).add(name)
  }

  /**
   * 移除约束
   */
  removeConstraint(name) {
    const constraint = this.constraints.get(name)
    if (constraint) {
      this.constraints.delete(name)
      this.constraintGroups.get(constraint.category)?.delete(name)
      this.activeConstraints.delete(name)
      return true
    }
    return false
  }

  /**
   * 激活约束
   */
  activateConstraint(name) {
    if (this.constraints.has(name)) {
      this.activeConstraints.add(name)
      return true
    }
    return false
  }

  /**
   * 停用约束
   */
  deactivateConstraint(name) {
    return this.activeConstraints.delete(name)
  }

  /**
   * 激活约束组
   */
  activateConstraintGroup(category) {
    const constraints = this.constraintGroups.get(category)
    if (constraints) {
      constraints.forEach(name => this.activeConstraints.add(name))
      return true
    }
    return false
  }

  /**
   * 停用约束组
   */
  deactivateConstraintGroup(category) {
    const constraints = this.constraintGroups.get(category)
    if (constraints) {
      constraints.forEach(name => this.activeConstraints.delete(name))
      return true
    }
    return false
  }

  /**
   * 验证数据
   */
  async validate(data, constraintConfigs = {}) {
    const result = {
      timestamp: new Date().toISOString(),
      valid: true,
      violations: [],
      summary: {
        totalViolations: 0,
        byCategory: {},
        bySeverity: { low: 0, medium: 0, high: 0, critical: 0 }
      }
    }

    // 遍历所有激活的约束
    for (const constraintName of this.activeConstraints) {
      const constraint = this.constraints.get(constraintName)
      if (!constraint) continue

      const config = constraintConfigs[constraintName] || {}
      
      try {
        let constraintResult
        
        // 处理不同类型的约束
        if (constraint.category === 'data') {
          constraintResult = await this.validateDataConstraints(
            data, constraint, config
          )
        } else {
          constraintResult = await constraint.validator(data, config)
        }

        if (!constraintResult.valid) {
          result.valid = false
          
          // 处理违规信息
          constraintResult.violations.forEach(violation => {
            const enrichedViolation = {
              ...violation,
              constraint: constraintName,
              category: constraint.category,
              severity: violation.severity || this.getConstraintSeverity(constraint)
            }
            
            result.violations.push(enrichedViolation)
            
            // 更新统计
            this.updateSummary(result.summary, enrichedViolation)
          })
        }
      } catch (error) {
        result.valid = false
        result.violations.push({
          constraint: constraintName,
          category: constraint.category,
          type: 'validation_error',
          error: error.message,
          severity: 'high'
        })
      }
    }

    // 记录验证历史
    this.violationHistory.push(result)

    // 触发事件
    eventBus.emit('constraint-validated', {
      result,
      data,
      constraintConfigs
    })

    return result
  }

  /**
   * 验证数据约束
   */
  async validateDataConstraints(data, constraint, config) {
    const violations = []
    
    if (config.fields) {
      // 验证特定字段
      for (const [field, fieldConfig] of Object.entries(config.fields)) {
        const value = data[field]
        const result = constraint.validator(value, { ...fieldConfig, field })
        if (!result.valid) {
          violations.push(...result.violations)
        }
      }
    } else {
      // 验证整个数据对象
      const result = constraint.validator(data, config)
      if (!result.valid) {
        violations.push(...result.violations)
      }
    }
    
    return {
      valid: violations.length === 0,
      violations
    }
  }

  /**
   * 获取约束严重程度
   */
  getConstraintSeverity(constraint) {
    const severityMap = {
      critical: ['critical', 'security'],
      high: ['high', 'business'],
      medium: ['medium', 'data'],
      low: ['low', 'format']
    }
    
    for (const [severity, priorities] of Object.entries(severityMap)) {
      if (priorities.includes(constraint.priority) || priorities.includes(constraint.category)) {
        return severity
      }
    }
    
    return 'medium'
  }

  /**
   * 更新验证结果摘要
   */
  updateSummary(summary, violation) {
    summary.totalViolations++
    
    // 按类别统计
    if (!summary.byCategory[violation.category]) {
      summary.byCategory[violation.category] = 0
    }
    summary.byCategory[violation.category]++
    
    // 按严重程度统计
    if (summary.bySeverity[violation.severity] !== undefined) {
      summary.bySeverity[violation.severity]++
    }
  }

  /**
   * 评估条件
   */
  evaluateCondition(value, condition) {
    switch (condition.type) {
      case 'equals':
        return value === condition.value
      case 'not_equals':
        return value !== condition.value
      case 'exists':
        return value !== null && value !== undefined && value !== ''
      case 'not_exists':
        return value === null || value === undefined || value === ''
      case 'greater_than':
        return Number(value) > Number(condition.value)
      case 'less_than':
        return Number(value) < Number(condition.value)
      case 'contains':
        return String(value).includes(condition.value)
      case 'matches':
        return new RegExp(condition.pattern).test(String(value))
      default:
        return false
    }
  }

  /**
   * 获取约束列表
   */
  getConstraints(options = {}) {
    const { category, active, priority } = options
    let constraints = Array.from(this.constraints.entries())

    // 过滤条件
    if (category) {
      constraints = constraints.filter(([_, constraint]) => 
        constraint.category === category
      )
    }
    
    if (active !== undefined) {
      constraints = constraints.filter(([name, _]) => 
        this.activeConstraints.has(name) === active
      )
    }
    
    if (priority) {
      constraints = constraints.filter(([_, constraint]) => 
        constraint.priority === priority
      )
    }

    return constraints.map(([name, constraint]) => ({
      name,
      ...constraint,
      active: this.activeConstraints.has(name)
    }))
  }

  /**
   * 获取约束组
   */
  getConstraintGroups() {
    const groups = {}
    for (const [category, constraints] of this.constraintGroups) {
      groups[category] = {
        constraints: Array.from(constraints),
        activeCount: Array.from(constraints).filter(name => 
          this.activeConstraints.has(name)
        ).length
      }
    }
    return groups
  }

  /**
   * 获取违规历史
   */
  getViolationHistory(options = {}) {
    const { limit = 100, since, category, severity } = options
    let history = [...this.violationHistory]

    // 过滤条件
    if (since) {
      history = history.filter(item => 
        new Date(item.timestamp) >= new Date(since)
      )
    }
    
    if (category || severity) {
      history = history.map(item => ({
        ...item,
        violations: item.violations.filter(violation => {
          if (category && violation.category !== category) return false
          if (severity && violation.severity !== severity) return false
          return true
        })
      })).filter(item => item.violations.length > 0)
    }

    // 排序和限制
    return history
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
  }

  /**
   * 获取违规统计
   */
  getViolationStats() {
    const recent = this.getViolationHistory({ limit: 100 })
    const stats = {
      totalValidations: recent.length,
      totalViolations: 0,
      violationRate: 0,
      byCategory: {},
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      topViolations: {},
      trends: []
    }

    recent.forEach(result => {
      result.violations.forEach(violation => {
        stats.totalViolations++
        
        // 按类别统计
        if (!stats.byCategory[violation.category]) {
          stats.byCategory[violation.category] = 0
        }
        stats.byCategory[violation.category]++
        
        // 按严重程度统计
        stats.bySeverity[violation.severity]++
        
        // 最常见的违规
        const key = `${violation.constraint}:${violation.type}`
        if (!stats.topViolations[key]) {
          stats.topViolations[key] = 0
        }
        stats.topViolations[key]++
      })
    })

    if (stats.totalValidations > 0) {
      stats.violationRate = Math.round(
        (stats.totalViolations / stats.totalValidations) * 100 * 100
      ) / 100
    }

    return stats
  }

  /**
   * 清除历史记录
   */
  clearHistory() {
    this.violationHistory = []
  }

  /**
   * 重置约束状态
   */
  reset() {
    this.activeConstraints.clear()
    this.violationHistory = []
  }
}

// 创建单例实例
export const constraintChecker = new ConstraintChecker()

// 导出类和实用函数
export {
  ConstraintChecker
}

// 便捷函数
export async function checkConstraints(data, constraintConfigs = {}) {
  return await constraintChecker.validate(data, constraintConfigs)
}

export function getConstraints(options = {}) {
  return constraintChecker.getConstraints(options)
}

export function getViolationStats() {
  return constraintChecker.getViolationStats()
}