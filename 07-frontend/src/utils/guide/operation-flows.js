/**
 * 操作流程管理工具
 * 用于定义和管理复杂的操作流程和引导
 */

import { eventBus } from '../services/event-bus'

class OperationFlows {
  constructor() {
    this.flows = new Map()
    this.activeFlow = null
    this.currentStepIndex = -1
    this.flowHistory = []
    this.flowStats = new Map()
    
    // 初始化默认操作流程
    this.initializeDefaultFlows()
  }

  /**
   * 初始化默认操作流程
   */
  initializeDefaultFlows() {
    // 用户注册流程
    this.addFlow('user-registration', {
      name: '用户注册流程',
      description: '完整的用户注册操作流程',
      category: 'user-management',
      priority: 'high',
      steps: [
        {
          id: 'email-entry',
          name: '邮箱输入',
          description: '用户输入邮箱地址',
          type: 'input',
          component: 'EmailInput',
          validation: {
            required: true,
            type: 'email',
            checkAvailability: true
          },
          actions: {
            next: {
              label: '验证邮箱',
              method: 'validateEmail',
              showLoading: true
            },
            skip: {
              label: '暂不注册',
              method: 'navigateToHome'
            }
          },
          help: {
            title: '为什么需要邮箱？',
            content: '邮箱将作为您的登录账号，用于接收重要通知。',
            tips: [
              '请使用真实的邮箱地址',
              '支持常见的邮箱服务商',
              '不会用于发送垃圾邮件'
            ]
          },
          errorHandling: {
            'invalid-email': {
              message: '请输入有效的邮箱地址',
              recovery: 'showEmailFormatHint'
            },
            'email-exists': {
              message: '该邮箱已被注册',
              recovery: 'showLoginOption'
            },
            'network-error': {
              message: '网络连接失败',
              recovery: 'retryWithBackoff'
            }
          }
        },
        {
          id: 'email-verification',
          name: '邮箱验证',
          description: '发送验证码到邮箱',
          type: 'verification',
          component: 'EmailVerification',
          validation: {
            required: true,
            codeLength: 6,
            expiresIn: 300
          },
          actions: {
            next: {
              label: '验证并继续',
              method: 'verifyEmailCode'
            },
            resend: {
              label: '重新发送',
              method: 'resendVerificationCode',
              cooldown: 60
            },
            back: {
              label: '修改邮箱',
              method: 'backToEmailEntry'
            }
          },
          help: {
            title: '邮箱验证码',
            content: '验证码已发送到您的邮箱，请查收并输入。',
            tips: [
              '验证码6位数字',
              '有效期5分钟',
              '如未收到请检查垃圾箱'
            ]
          },
          errorHandling: {
            'invalid-code': {
              message: '验证码错误',
              recovery: 'showCodeExample'
            },
            'code-expired': {
              message: '验证码已过期',
              recovery: 'resendCode'
            },
            'max-attempts': {
              message: '验证次数过多',
              recovery: 'blockAndShowContact'
            }
          }
        },
        {
          id: 'password-setup',
          name: '设置密码',
          description: '设置登录密码',
          type: 'input',
          component: 'PasswordSetup',
          validation: {
            required: true,
            minLength: 8,
            strength: 'medium',
            confirmPassword: true
          },
          actions: {
            next: {
              label: '设置密码',
              method: 'validatePassword'
            },
            back: {
              label: '上一步',
              method: 'backToVerification'
            }
          },
          help: {
            title: '密码安全要求',
            content: '请设置一个安全的密码来保护您的账户。',
            tips: [
              '至少8个字符',
              '包含字母和数字',
              '建议包含特殊字符',
              '不要使用常见密码'
            ]
          },
          errorHandling: {
            'weak-password': {
              message: '密码强度不够',
              recovery: 'showPasswordStrengthGuide'
            },
            'password-mismatch': {
              message: '两次输入的密码不一致',
              recovery: 'highlightPasswordFields'
            }
          }
        },
        {
          id: 'profile-completion',
          name: '完善资料',
          description: '补充个人基本信息',
          type: 'form',
          component: 'ProfileForm',
          validation: {
            fields: {
              username: { required: true, minLength: 2, maxLength: 20 },
              fullName: { required: false },
              phone: { required: false, pattern: 'phone' },
              gender: { required: false },
              birthDate: { required: false, maxDate: 'today' }
            }
          },
          actions: {
            next: {
              label: '完成注册',
              method: 'submitProfile'
            },
            skip: {
              label: '跳过',
              method: 'skipProfile'
            },
            back: {
              label: '上一步',
              method: 'backToPassword'
            }
          },
          help: {
            title: '个人资料',
            content: '补充资料有助于我们为您提供更好的服务。',
            tips: [
              '用户名将作为昵称显示',
              '手机号可用于找回密码',
              '所有信息都可以后续修改'
            ]
          },
          errorHandling: {
            'username-exists': {
              message: '用户名已被占用',
              recovery: 'suggestUsername'
            },
            'invalid-phone': {
              message: '手机号格式错误',
              recovery: 'showPhoneExample'
            }
          }
        },
        {
          id: 'welcome-complete',
          name: '注册完成',
          description: '欢迎新用户',
          type: 'completion',
          component: 'WelcomeScreen',
          actions: {
            complete: {
              label: '开始使用',
              method: 'navigateToDashboard'
            },
            tour: {
              label: '功能介绍',
              method: 'startFeatureTour'
            }
          },
          help: {
            title: '欢迎加入！',
            content: '恭喜您成功注册账户，现在可以开始使用我们的服务了。',
            tips: [
              '查看新手指南了解基本操作',
              '完善个人资料获得更好体验',
              '遇到问题可查看帮助中心'
            ]
          }
        }
      ],
      completion: {
        message: '注册成功！',
        redirect: '/dashboard',
        followUp: ['first-login-tour', 'profile-setup-reminder']
      }
    })

    // 数据导入流程
    this.addFlow('data-import', {
      name: '数据导入流程',
      description: '导入外部数据的操作流程',
      category: 'data-management',
      priority: 'medium',
      steps: [
        {
          id: 'source-selection',
          name: '选择数据源',
          description: '选择要导入的数据源',
          type: 'selection',
          component: 'DataSourceSelection',
          validation: {
            required: true
          },
          actions: {
            next: {
              label: '下一步',
              method: 'validateSource'
            },
            cancel: {
              label: '取消',
              method: 'cancelImport'
            }
          },
          help: {
            title: '支持的数据源',
            content: '我们支持多种数据源类型，请选择您要导入的格式。',
            tips: [
              'CSV文件：适合结构化数据',
              'Excel文件：支持多个工作表',
              'JSON文件：适合嵌套数据',
              '数据库：支持多种数据库类型'
            ]
          }
        },
        {
          id: 'file-upload',
          name: '上传文件',
          description: '上传数据文件',
          type: 'upload',
          component: 'FileUpload',
          validation: {
            required: true,
            maxSize: '50MB',
            allowedTypes: ['csv', 'xlsx', 'xls', 'json']
          },
          actions: {
            next: {
              label: '上传并验证',
              method: 'uploadFile'
            },
            back: {
              label: '重新选择',
              method: 'backToSource'
            }
          },
          help: {
            title: '文件上传要求',
            content: '请确保文件符合我们的格式要求。',
            tips: [
              '文件大小不超过50MB',
              '第一行应为列标题',
              '避免特殊字符',
              '日期格式建议为 YYYY-MM-DD'
            ]
          },
          errorHandling: {
            'file-too-large': {
              message: '文件大小超过限制',
              recovery: 'suggestCompression'
            },
            'invalid-format': {
              message: '文件格式不支持',
              recovery: 'showSupportedFormats'
            },
            'upload-failed': {
              message: '上传失败',
              recovery: 'retryUpload'
            }
          }
        },
        {
          id: 'data-preview',
          name: '数据预览',
          description: '预览和配置数据映射',
          type: 'preview',
          component: 'DataPreview',
          validation: {
            required: true,
            minRows: 1,
            maxRows: 10000
          },
          actions: {
            next: {
              label: '开始导入',
              method: 'startImport'
            },
            back: {
              label: '重新上传',
              method: 'backToUpload'
            },
            cancel: {
              label: '取消导入',
              method: 'cancelImport'
            }
          },
          help: {
            title: '数据映射',
            content: '请确认数据字段映射是否正确。',
            tips: [
              '检查列标题是否匹配',
              '确认数据类型正确',
              '预览前10行数据',
              '可以调整字段映射'
            ]
          },
          errorHandling: {
            'no-data': {
              message: '文件中没有有效数据',
              recovery: 'showFileStructure'
            },
            'too-many-rows': {
              message: '数据行数超过限制',
              recovery: 'suggestBatchImport'
            }
          }
        },
        {
          id: 'import-progress',
          name: '导入进度',
          description: '显示数据导入进度',
          type: 'progress',
          component: 'ImportProgress',
          actions: {
            complete: {
              label: '查看结果',
              method: 'viewImportResults'
            },
            cancel: {
              label: '取消导入',
              method: 'cancelImport',
              confirm: true
            }
          },
          help: {
            title: '导入进度',
            content: '数据正在处理中，请稍候...',
            tips: [
              '不要关闭页面',
              '大文件需要更长时间',
              '可以查看详细进度'
            ]
          },
          errorHandling: {
            'import-failed': {
              message: '导入过程中出现错误',
              recovery: 'showErrorDetails'
            },
            'timeout': {
              message: '导入超时',
              recovery: 'suggestSmallerBatches'
            }
          }
        },
        {
          id: 'import-summary',
          name: '导入结果',
          description: '显示导入完成情况',
          type: 'summary',
          component: 'ImportSummary',
          actions: {
            complete: {
              label: '完成',
              method: 'navigateToData'
            },
            retry: {
              label: '重新导入',
              method: 'restartImport'
            },
            details: {
              label: '查看详情',
              method: 'showImportDetails'
            }
          },
          help: {
            title: '导入完成',
            content: '数据导入已完成，您可以查看导入结果。',
            tips: [
              '查看成功导入的记录数',
              '检查失败的记录及原因',
              '可以下载错误报告',
              '必要时进行数据清洗'
            ]
          }
        }
      ],
      completion: {
        message: '数据导入完成！',
        redirect: '/data-management',
        followUp: ['data-verification-tour', 'data-cleaning-suggestions']
      }
    })

    // 报表生成流程
    this.addFlow('report-generation', {
      name: '报表生成流程',
      description: '生成自定义报表',
      category: 'reporting',
      priority: 'medium',
      steps: [
        {
          id: 'report-type-selection',
          name: '选择报表类型',
          description: '选择要生成的报表类型',
          type: 'selection',
          component: 'ReportTypeSelection',
          validation: {
            required: true
          },
          actions: {
            next: {
              label: '下一步',
              method: 'selectReportType'
            },
            cancel: {
              label: '取消',
              method: 'cancelReport'
            }
          },
          help: {
            title: '报表类型',
            content: '我们提供多种预定义报表模板。',
            tips: [
              '销售报表：销售数据分析',
              '用户报表：用户行为分析',
              '财务报表：财务状况概览',
              '自定义报表：灵活配置'
            ]
          }
        },
        {
          id: 'parameter-configuration',
          name: '配置参数',
          description: '设置报表参数',
          type: 'form',
          component: 'ReportParameters',
          validation: {
            required: true
          },
          actions: {
            next: {
              label: '生成预览',
              method: 'generatePreview'
            },
            back: {
              label: '重新选择',
              method: 'backToTypeSelection'
            }
          },
          help: {
            title: '参数配置',
            content: '请配置报表的参数和筛选条件。',
            tips: [
              '选择时间范围',
              '设置筛选条件',
              '选择显示字段',
              '配置图表类型'
            ]
          },
          errorHandling: {
            'invalid-date-range': {
              message: '日期范围无效',
              recovery: 'showDateRangePicker'
            },
            'incompatible-filters': {
              message: '筛选条件冲突',
              recovery: 'suggestFilterAdjustment'
            }
          }
        },
        {
          id: 'report-preview',
          name: '报表预览',
          description: '预览报表效果',
          type: 'preview',
          component: 'ReportPreview',
          actions: {
            next: {
              label: '生成报表',
              method: 'generateReport'
            },
            back: {
              label: '修改参数',
              method: 'backToParameters'
            },
            save: {
              label: '保存模板',
              method: 'saveAsTemplate'
            }
          },
          help: {
            title: '报表预览',
            content: '这是报表的预览效果，您可以进行调整。',
            tips: [
              '检查数据准确性',
              '调整图表样式',
              '验证计算结果',
              '确认格式设置'
            ]
          }
        },
        {
          id: 'generation-progress',
          name: '生成进度',
          description: '正在生成报表',
          type: 'progress',
          component: 'GenerationProgress',
          actions: {
            complete: {
              label: '查看报表',
              method: 'viewReport'
            },
            cancel: {
              label: '取消生成',
              method: 'cancelGeneration'
            }
          }
        },
        {
          id: 'report-result',
          name: '报表结果',
          description: '查看生成的报表',
          type: 'result',
          component: 'ReportResult',
          actions: {
            export: {
              label: '导出',
              method: 'exportReport'
            },
            share: {
              label: '分享',
              method: 'shareReport'
            },
            save: {
              label: '保存',
              method: 'saveReport'
            }
          },
          help: {
            title: '报表操作',
            content: '您可以对报表进行多种操作。',
            tips: [
              '导出为PDF或Excel',
              '分享给其他用户',
              '保存到报表库',
              '设置定时生成'
            ]
          }
        }
      ],
      completion: {
        message: '报表生成完成！',
        redirect: '/reports',
        followUp: ['report-analysis-tour']
      }
    })
  }

  /**
   * 添加操作流程
   */
  addFlow(flowId, flow) {
    this.flows.set(flowId, {
      ...flow,
      id: flowId,
      createdAt: new Date().toISOString(),
      version: '1.0'
    })
  }

  /**
   * 获取操作流程
   */
  getFlow(flowId) {
    return this.flows.get(flowId)
  }

  /**
   * 获取所有操作流程
   */
  getAllFlows(options = {}) {
    const { category, priority, status } = options
    let flows = Array.from(this.flows.values())

    // 过滤条件
    if (category) {
      flows = flows.filter(flow => flow.category === category)
    }

    if (priority) {
      flows = flows.filter(flow => flow.priority === priority)
    }

    return flows.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * 开始操作流程
   */
  startFlow(flowId, options = {}) {
    const flow = this.getFlow(flowId)
    if (!flow) {
      throw new Error(`操作流程 ${flowId} 不存在`)
    }

    if (this.activeFlow && !options.allowOverride) {
      throw new Error('已有活跃的流程，请先完成当前流程')
    }

    this.activeFlow = flow
    this.currentStepIndex = 0

    // 记录开始时间
    this.recordFlowStart(flowId)

    eventBus.emit('flow-started', {
      flowId,
      flow,
      step: flow.steps[0]
    })

    return {
      success: true,
      flow,
      currentStep: flow.steps[0],
      totalSteps: flow.steps.length
    }
  }

  /**
   * 执行下一步
   */
  async executeNextStep(actionData = {}) {
    if (!this.activeFlow) {
      throw new Error('没有活跃的操作流程')
    }

    const currentStep = this.activeFlow.steps[this.currentStepIndex]
    const nextIndex = this.currentStepIndex + 1

    // 执行当前步骤的动作
    if (actionData.action) {
      const actionResult = await this.executeStepAction(currentStep, actionData.action, actionData)
      if (!actionResult.success) {
        return actionResult
      }
    }

    // 检查是否完成
    if (nextIndex >= this.activeFlow.steps.length) {
      return this.completeFlow()
    }

    // 移动到下一步
    this.currentStepIndex = nextIndex
    const nextStep = this.activeFlow.steps[nextIndex]

    eventBus.emit('step-executed', {
      flowId: this.activeFlow.id,
      stepIndex: nextIndex,
      step: nextStep,
      direction: 'next',
      actionData
    })

    return {
      success: true,
      step: nextStep,
      stepIndex: nextIndex,
      remainingSteps: this.activeFlow.steps.length - nextIndex - 1
    }
  }

  /**
   * 执行步骤动作
   */
  async executeStepAction(step, actionName, actionData) {
    const action = step.actions[actionName]
    if (!action) {
      return {
        success: false,
        error: `动作 ${actionName} 不存在`
      }
    }

    try {
      // 执行动作方法
      if (typeof this[action.method] === 'function') {
        return await this[action.method](actionData)
      }

      // 触发动作事件
      eventBus.emit('step-action', {
        stepId: step.id,
        action: actionName,
        data: actionData
      })

      return {
        success: true
      }
    } catch (error) {
      // 处理错误
      const errorHandler = step.errorHandling?.[error.code]
      if (errorHandler) {
        return {
          success: false,
          error: errorHandler.message,
          recovery: errorHandler.recovery
        }
      }

      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 完成操作流程
   */
  completeFlow() {
    if (!this.activeFlow) {
      throw new Error('没有活跃的操作流程')
    }

    const flowId = this.activeFlow.id
    const flow = this.activeFlow

    // 记录完成时间
    this.recordFlowCompletion(flowId)

    eventBus.emit('flow-completed', {
      flowId,
      flow,
      duration: this.getFlowDuration(flowId)
    })

    // 执行后续操作
    if (flow.completion?.followUp) {
      this.executeFollowUpActions(flow.completion.followUp)
    }

    // 清理状态
    this.activeFlow = null
    this.currentStepIndex = -1

    return {
      success: true,
      message: flow.completion?.message || '流程完成',
      flowId,
      redirect: flow.completion?.redirect
    }
  }

  /**
   * 跳过当前步骤
   */
  skipCurrentStep(reason = 'user_skip') {
    if (!this.activeFlow) {
      throw new Error('没有活跃的操作流程')
    }

    const currentStep = this.activeFlow.steps[this.currentStepIndex]
    
    eventBus.emit('step-skipped', {
      flowId: this.activeFlow.id,
      stepId: currentStep.id,
      stepIndex: this.currentStepIndex,
      reason
    })

    return this.executeNextStep()
  }

  /**
   * 返回上一步
   */
  goToPreviousStep() {
    if (!this.activeFlow || this.currentStepIndex <= 0) {
      throw new Error('无法返回上一步')
    }

    this.currentStepIndex--
    const prevStep = this.activeFlow.steps[this.currentStepIndex]

    eventBus.emit('step-executed', {
      flowId: this.activeFlow.id,
      stepIndex: this.currentStepIndex,
      step: prevStep,
      direction: 'prev'
    })

    return {
      success: true,
      step: prevStep,
      stepIndex: this.currentStepIndex,
      remainingSteps: this.activeFlow.steps.length - this.currentStepIndex - 1
    }
  }

  /**
   * 记录流程开始
   */
  recordFlowStart(flowId) {
    if (!this.flowStats.has(flowId)) {
      this.flowStats.set(flowId, {
        totalCompletions: 0,
        totalTime: 0,
        averageTime: 0,
        skipRate: 0
      })
    }

    this.flowHistory.push({
      flowId,
      startTime: new Date().toISOString(),
      stepHistory: []
    })
  }

  /**
   * 记录流程完成
   */
  recordFlowCompletion(flowId) {
    const history = this.flowHistory.find(h => h.flowId === flowId && !h.endTime)
    if (history) {
      history.endTime = new Date().toISOString()
      history.duration = new Date(history.endTime) - new Date(history.startTime)

      // 更新统计
      const stats = this.flowStats.get(flowId)
      if (stats) {
        stats.totalCompletions++
        stats.totalTime += history.duration
        stats.averageTime = stats.totalTime / stats.totalCompletions
      }
    }
  }

  /**
   * 获取流程持续时间
   */
  getFlowDuration(flowId) {
    const history = this.flowHistory.find(h => h.flowId === flowId && !h.endTime)
    if (history) {
      return new Date() - new Date(history.startTime)
    }
    return 0
  }

  /**
   * 执行后续操作
   */
  executeFollowUpActions(actions) {
    actions.forEach(action => {
      if (typeof this[action] === 'function') {
        this[action]()
      } else {
        eventBus.emit('follow-up-action', action)
      }
    })
  }

  /**
   * 获取当前步骤
   */
  getCurrentStep() {
    if (!this.activeFlow || this.currentStepIndex < 0) {
      return null
    }
    return this.activeFlow.steps[this.currentStepIndex]
  }

  /**
   * 获取流程进度
   */
  getProgress() {
    if (!this.activeFlow) {
      return null
    }

    return {
      flowId: this.activeFlow.id,
      flowName: this.activeFlow.name,
      currentStepIndex: this.currentStepIndex,
      totalSteps: this.activeFlow.steps.length,
      completedSteps: this.currentStepIndex + 1,
      percentage: Math.round(((this.currentStepIndex + 1) / this.activeFlow.steps.length) * 100),
      duration: this.getFlowDuration(this.activeFlow.id)
    }
  }

  /**
   * 获取流程统计
   */
  getFlowStats() {
    const stats = {}
    for (const [flowId, data] of this.flowStats) {
      const flow = this.getFlow(flowId)
      stats[flowId] = {
        ...data,
        flowName: flow.name,
        category: flow.category,
        priority: flow.priority
      }
    }
    return stats
  }

  /**
   * 清除流程状态
   */
  clearFlowState() {
    this.activeFlow = null
    this.currentStepIndex = -1
  }
}

// 创建单例实例
export const operationFlows = new OperationFlows()

// 导出类和实用函数
export {
  OperationFlows
}

// 便捷函数
export function startFlow(flowId, options = {}) {
  return operationFlows.startFlow(flowId, options)
}

export function executeNextStep(actionData = {}) {
  return operationFlows.executeNextStep(actionData)
}

export function skipCurrentStep(reason) {
  return operationFlows.skipCurrentStep(reason)
}

export function getAllFlows(options = {}) {
  return operationFlows.getAllFlows(options)
}