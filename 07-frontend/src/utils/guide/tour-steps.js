/**
 * 引导步骤定义工具
 * 用于创建和管理应用中的引导步骤
 */

import { eventBus } from '../services/event-bus'

class TourSteps {
  constructor() {
    this.steps = new Map()
    this.tours = new Map()
    this.activeTour = null
    this.currentStepIndex = -1
    
    // 初始化默认引导步骤
    this.initializeDefaultSteps()
  }

  /**
   * 初始化默认引导步骤
   */
  initializeDefaultSteps() {
    // 用户注册引导
    this.addTour('user-registration', {
      name: '用户注册引导',
      description: '帮助新用户完成注册流程',
      targetAudience: 'new_users',
      priority: 'high',
      steps: [
        {
          id: 'welcome',
          title: '欢迎',
          content: '欢迎使用我们的系统！让我们开始注册流程吧。',
          target: '#registration-form',
          position: 'center',
          type: 'welcome',
          actions: [
            {
              text: '开始注册',
              type: 'primary',
              action: 'next'
            },
            {
              text: '跳过',
              type: 'secondary',
              action: 'skip'
            }
          ],
          validation: null,
          completion: () => console.log('欢迎步骤完成')
        },
        {
          id: 'enter-email',
          title: '输入邮箱',
          content: '请输入您的邮箱地址，这将是您的登录账号。',
          target: '#email-input',
          position: 'bottom',
          type: 'input',
          actions: [
            {
              text: '下一步',
              type: 'primary',
              action: 'next',
              validation: {
                required: true,
                type: 'email'
              }
            },
            {
              text: '返回',
              type: 'secondary',
              action: 'prev'
            }
          ],
          highlight: true,
          overlay: true
        },
        {
          id: 'enter-password',
          title: '设置密码',
          content: '请设置一个安全的密码，至少8个字符，包含字母和数字。',
          target: '#password-input',
          position: 'bottom',
          type: 'input',
          actions: [
            {
              text: '下一步',
              type: 'primary',
              action: 'next',
              validation: {
                required: true,
                minLength: 8,
                pattern: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$'
              }
            },
            {
              text: '返回',
              type: 'secondary',
              action: 'prev'
            }
          ],
          highlight: true,
          overlay: true
        },
        {
          id: 'terms-agreement',
          title: '同意条款',
          content: '请阅读并同意我们的服务条款和隐私政策。',
          target: '#terms-checkbox',
          position: 'top',
          type: 'checkbox',
          actions: [
            {
              text: '完成注册',
              type: 'primary',
              action: 'complete',
              validation: {
                required: true
              }
            },
            {
              text: '返回',
              type: 'secondary',
              action: 'prev'
            }
          ],
          highlight: true
        }
      ],
      completion: {
        message: '注册完成！欢迎加入我们！',
        action: () => this.markTourAsCompleted('user-registration')
      }
    })

    // 首次登录引导
    this.addTour('first-login', {
      name: '首次登录引导',
      description: '帮助用户了解系统基本功能',
      targetAudience: 'new_users',
      priority: 'high',
      steps: [
        {
          id: 'dashboard-overview',
          title: '仪表板概览',
          content: '这是您的个人仪表板，显示了最重要的信息概要。',
          target: '#dashboard',
          position: 'bottom',
          type: 'info',
          actions: [
            {
              text: '了解详情',
              type: 'primary',
              action: 'next'
            },
            {
              text: '跳过',
              type: 'secondary',
              action: 'skip'
            }
          ],
          highlight: true,
          overlay: false
        },
        {
          id: 'navigation-menu',
          title: '导航菜单',
          content: '使用左侧菜单访问不同的功能模块。',
          target: '#navigation-menu',
          position: 'right',
          type: 'info',
          actions: [
            {
              text: '下一步',
              type: 'primary',
              action: 'next'
            },
            {
              text: '返回',
              type: 'secondary',
              action: 'prev'
            }
          ],
          highlight: true,
          allowInteraction: true
        },
        {
          id: 'user-profile',
          title: '个人资料',
          content: '点击这里可以查看和编辑您的个人资料。',
          target: '#user-profile',
          position: 'bottom',
          type: 'info',
          actions: [
            {
              text: '完成',
              type: 'primary',
              action: 'complete'
            },
            {
              text: '返回',
              type: 'secondary',
              action: 'prev'
            }
          ],
          highlight: true
        }
      ],
      completion: {
        message: '基本功能介绍完成！现在您可以开始使用系统了。',
        action: () => this.markTourAsCompleted('first-login')
      }
    })

    // 功能特性引导
    this.addTour('feature-introduction', {
      name: '功能特性介绍',
      description: '介绍系统的主要功能特性',
      targetAudience: 'all_users',
      priority: 'medium',
      steps: [
        {
          id: 'search-feature',
          title: '搜索功能',
          content: '使用搜索框快速查找您需要的内容。',
          target: '#search-box',
          position: 'bottom',
          type: 'interactive',
          actions: [
            {
              text: '试试看',
              type: 'primary',
              action: 'interact',
              target: '#search-box'
            },
            {
              text: '下一步',
              type: 'secondary',
              action: 'next'
            }
          ],
          highlight: true,
          allowInteraction: true
        },
        {
          id: 'data-import',
          title: '数据导入',
          content: '您可以通过这里导入外部数据。',
          target: '#import-button',
          position: 'top',
          type: 'info',
          actions: [
            {
              text: '下一步',
              type: 'primary',
              action: 'next'
            },
            {
              text: '返回',
              type: 'secondary',
              action: 'prev'
            }
          ],
          highlight: true
        },
        {
          id: 'help-center',
          title: '帮助中心',
          content: '遇到问题时，可以在这里找到帮助文档。',
          target: '#help-center',
          position: 'left',
          type: 'info',
          actions: [
            {
              text: '完成',
              type: 'primary',
              action: 'complete'
            },
            {
              text: '返回',
              type: 'secondary',
              action: 'prev'
            }
          ],
          highlight: true
        }
      ],
      completion: {
        message: '功能介绍完成！探索更多功能吧。',
        action: () => this.markTourAsCompleted('feature-introduction')
      }
    })
  }

  /**
   * 添加引导步骤
   */
  addStep(id, step) {
    this.steps.set(id, {
      ...step,
      id,
      createdAt: new Date().toISOString(),
      version: '1.0'
    })
  }

  /**
   * 添加引导流程
   */
  addTour(tourId, tour) {
    this.tours.set(tourId, {
      ...tour,
      id: tourId,
      createdAt: new Date().toISOString(),
      version: '1.0'
    })
  }

  /**
   * 获取引导步骤
   */
  getStep(stepId) {
    return this.steps.get(stepId)
  }

  /**
   * 获取引导流程
   */
  getTour(tourId) {
    return this.tours.get(tourId)
  }

  /**
   * 获取所有引导流程
   */
  getAllTours(options = {}) {
    const { targetAudience, priority, status } = options
    let tours = Array.from(this.tours.values())

    // 过滤条件
    if (targetAudience) {
      tours = tours.filter(tour => 
        tour.targetAudience === targetAudience || 
        tour.targetAudience === 'all_users'
      )
    }

    if (priority) {
      tours = tours.filter(tour => tour.priority === priority)
    }

    if (status) {
      // 这里需要实现状态检查逻辑
      tours = tours.filter(tour => this.getTourStatus(tour.id) === status)
    }

    return tours.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * 获取引导流程状态
   */
  getTourStatus(tourId) {
    const completedTours = JSON.parse(
      localStorage.getItem('completed-tours') || '[]'
    )
    return completedTours.includes(tourId) ? 'completed' : 'pending'
  }

  /**
   * 开始引导流程
   */
  startTour(tourId, options = {}) {
    const tour = this.getTour(tourId)
    if (!tour) {
      throw new Error(`引导流程 ${tourId} 不存在`)
    }

    // 检查是否已完成
    if (this.getTourStatus(tourId) === 'completed' && !options.forceRestart) {
      return {
        success: false,
        reason: '引导流程已完成',
        canRestart: true
      }
    }

    this.activeTour = tour
    this.currentStepIndex = 0

    // 触发事件
    eventBus.emit('tour-started', {
      tourId,
      tour,
      step: tour.steps[0]
    })

    return {
      success: true,
      tour,
      currentStep: tour.steps[0],
      totalSteps: tour.steps.length
    }
  }

  /**
   * 跳转到下一步
   */
  nextStep(validationData = {}) {
    if (!this.activeTour) {
      throw new Error('没有活跃的引导流程')
    }

    const currentStep = this.activeTour.steps[this.currentStepIndex]
    const nextIndex = this.currentStepIndex + 1

    // 验证当前步骤
    if (currentStep && currentStep.actions) {
      const nextAction = currentStep.actions.find(action => action.action === 'next')
      if (nextAction && nextAction.validation) {
        const isValid = this.validateStepData(validationData, nextAction.validation)
        if (!isValid) {
          return {
            success: false,
            reason: '验证失败',
            currentStep,
            errors: this.getValidationErrors(validationData, nextAction.validation)
          }
        }
      }
    }

    // 执行当前步骤完成回调
    if (currentStep && currentStep.completion) {
      currentStep.completion(validationData)
    }

    // 检查是否完成
    if (nextIndex >= this.activeTour.steps.length) {
      return this.completeTour()
    }

    // 移动到下一步
    this.currentStepIndex = nextIndex
    const nextStep = this.activeTour.steps[nextIndex]

    eventBus.emit('step-changed', {
      tourId: this.activeTour.id,
      stepIndex: nextIndex,
      step: nextStep,
      direction: 'next'
    })

    return {
      success: true,
      step: nextStep,
      stepIndex: nextIndex,
      remainingSteps: this.activeTour.steps.length - nextIndex - 1
    }
  }

  /**
   * 返回上一步
   */
  previousStep() {
    if (!this.activeTour || this.currentStepIndex <= 0) {
      throw new Error('无法返回上一步')
    }

    this.currentStepIndex--
    const prevStep = this.activeTour.steps[this.currentStepIndex]

    eventBus.emit('step-changed', {
      tourId: this.activeTour.id,
      stepIndex: this.currentStepIndex,
      step: prevStep,
      direction: 'prev'
    })

    return {
      success: true,
      step: prevStep,
      stepIndex: this.currentStepIndex,
      remainingSteps: this.activeTour.steps.length - this.currentStepIndex - 1
    }
  }

  /**
   * 跳转到指定步骤
   */
  goToStep(stepIndex) {
    if (!this.activeTour) {
      throw new Error('没有活跃的引导流程')
    }

    if (stepIndex < 0 || stepIndex >= this.activeTour.steps.length) {
      throw new Error(`步骤索引 ${stepIndex} 超出范围`)
    }

    this.currentStepIndex = stepIndex
    const step = this.activeTour.steps[stepIndex]

    eventBus.emit('step-changed', {
      tourId: this.activeTour.id,
      stepIndex,
      step,
      direction: 'jump'
    })

    return {
      success: true,
      step,
      stepIndex,
      remainingSteps: this.activeTour.steps.length - stepIndex - 1
    }
  }

  /**
   * 完成引导流程
   */
  completeTour() {
    if (!this.activeTour) {
      throw new Error('没有活跃的引导流程')
    }

    const tourId = this.activeTour.id
    const tour = this.activeTour

    // 标记为已完成
    this.markTourAsCompleted(tourId)

    // 执行完成回调
    if (tour.completion && tour.completion.action) {
      tour.completion.action()
    }

    eventBus.emit('tour-completed', {
      tourId,
      tour
    })

    // 清理状态
    this.activeTour = null
    this.currentStepIndex = -1

    return {
      success: true,
      message: tour.completion?.message || '引导流程完成',
      tourId
    }
  }

  /**
   * 跳过引导流程
   */
  skipTour(reason = 'user_skip') {
    if (!this.activeTour) {
      throw new Error('没有活跃的引导流程')
    }

    const tourId = this.activeTour.id
    const tour = this.activeTour

    eventBus.emit('tour-skipped', {
      tourId,
      tour,
      reason,
      currentStepIndex: this.currentStepIndex
    })

    // 清理状态
    this.activeTour = null
    this.currentStepIndex = -1

    return {
      success: true,
      message: '引导流程已跳过',
      tourId,
      reason
    }
  }

  /**
   * 暂停引导流程
   */
  pauseTour() {
    if (!this.activeTour) {
      throw new Error('没有活跃的引导流程')
    }

    const tourId = this.activeTour.id
    const currentStep = this.activeTour.steps[this.currentStepIndex]

    eventBus.emit('tour-paused', {
      tourId,
      stepIndex: this.currentStepIndex,
      step: currentStep
    })

    return {
      success: true,
      tourId,
      stepIndex: this.currentStepIndex,
      step: currentStep,
      message: '引导流程已暂停'
    }
  }

  /**
   * 恢复引导流程
   */
  resumeTour(tourId, stepIndex = 0) {
    const tour = this.getTour(tourId)
    if (!tour) {
      throw new Error(`引导流程 ${tourId} 不存在`)
    }

    this.activeTour = tour
    this.currentStepIndex = stepIndex
    const step = tour.steps[stepIndex]

    eventBus.emit('tour-resumed', {
      tourId,
      stepIndex,
      step
    })

    return {
      success: true,
      tour,
      step,
      stepIndex
    }
  }

  /**
   * 标记引导流程为已完成
   */
  markTourAsCompleted(tourId) {
    const completedTours = JSON.parse(
      localStorage.getItem('completed-tours') || '[]'
    )
    
    if (!completedTours.includes(tourId)) {
      completedTours.push(tourId)
      localStorage.setItem('completed-tours', JSON.stringify(completedTours))
    }
  }

  /**
   * 验证步骤数据
   */
  validateStepData(data, validation) {
    if (!validation) return true

    if (validation.required && !this.hasValue(data)) {
      return false
    }

    if (validation.type === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)
    }

    if (validation.minLength && data.length < validation.minLength) {
      return false
    }

    if (validation.pattern) {
      return new RegExp(validation.pattern).test(data)
    }

    return true
  }

  /**
   * 获取验证错误信息
   */
  getValidationErrors(data, validation) {
    const errors = []

    if (validation.required && !this.hasValue(data)) {
      errors.push('此字段为必填项')
    }

    if (validation.type === 'email' && !this.validateStepData(data, { type: 'email' })) {
      errors.push('请输入有效的邮箱地址')
    }

    if (validation.minLength && data.length < validation.minLength) {
      errors.push(`至少需要 ${validation.minLength} 个字符`)
    }

    if (validation.pattern && !this.validateStepData(data, { pattern: validation.pattern })) {
      errors.push('格式不正确')
    }

    return errors
  }

  /**
   * 检查值是否存在
   */
  hasValue(value) {
    return value !== null && value !== undefined && value !== ''
  }

  /**
   * 获取当前步骤
   */
  getCurrentStep() {
    if (!this.activeTour || this.currentStepIndex < 0) {
      return null
    }
    return this.activeTour.steps[this.currentStepIndex]
  }

  /**
   * 获取引导流程进度
   */
  getProgress() {
    if (!this.activeTour) {
      return null
    }

    return {
      tourId: this.activeTour.id,
      currentStepIndex: this.currentStepIndex,
      totalSteps: this.activeTour.steps.length,
      completedSteps: this.currentStepIndex + 1,
      percentage: Math.round(((this.currentStepIndex + 1) / this.activeTour.steps.length) * 100)
    }
  }

  /**
   * 清除引导流程状态
   */
  clearTourState() {
    this.activeTour = null
    this.currentStepIndex = -1
  }

  /**
   * 重置所有引导流程状态
   */
  resetAllTours() {
    localStorage.removeItem('completed-tours')
    this.clearTourState()
    eventBus.emit('all-tours-reset')
  }
}

// 创建单例实例
export const tourSteps = new TourSteps()

// 导出类和实用函数
export {
  TourSteps
}

// 便捷函数
export function startTour(tourId, options = {}) {
  return tourSteps.startTour(tourId, options)
}

export function nextStep(validationData) {
  return tourSteps.nextStep(validationData)
}

export function previousStep() {
  return tourSteps.previousStep()
}

export function skipTour(reason) {
  return tourSteps.skipTour(reason)
}

export function getAllTours(options = {}) {
  return tourSteps.getAllTours(options)
}