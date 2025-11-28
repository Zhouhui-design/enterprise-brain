import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { storageService } from './initialization-service'

// 用户引导服务
export const guideService = {
  // 引导状态
  guides: new Map(),

  // 当前引导步骤
  currentGuide: null,
  currentStep: 0,

  // 引导配置
  config: {
    autoStart: true,
    showSkip: true,
    showProgress: true,
    allowKeyboardNavigation: true,
    highlightElement: true,
    overlayOpacity: 0.7
  },

  // 引导步骤数据
  guideSteps: {
    // 首次登录引导
    welcome: [
      {
        id: 'welcome',
        title: '欢迎使用企业大脑',
        content: '让我们一起来了解系统的基本功能和操作方式',
        position: 'center',
        canSkip: true
      },
      {
        id: 'navigation',
        title: '导航菜单',
        content: '左侧是系统的主要功能菜单，您可以快速访问各个模块',
        target: '.sidebar-menu',
        position: 'right',
        canSkip: true
      },
      {
        id: 'dashboard',
        title: '仪表盘',
        content: '这里是您的个人工作台，显示重要信息和快捷操作',
        target: '.dashboard-container',
        position: 'left',
        canSkip: true
      },
      {
        id: 'user-menu',
        title: '用户菜单',
        content: '点击头像可以访问个人设置、修改密码等功能',
        target: '.user-avatar',
        position: 'bottom',
        canSkip: true
      }
    ],

    // 功能模块引导
    dashboard: [
      {
        id: 'overview',
        title: '数据概览',
        content: '这里展示了系统的关键业务数据和统计信息',
        target: '.data-overview',
        position: 'bottom'
      },
      {
        id: 'quick-actions',
        title: '快捷操作',
        content: '您可以在这里快速执行常用操作',
        target: '.quick-actions',
        position: 'right'
      },
      {
        id: 'charts',
        title: '图表分析',
        content: '各种图表帮助您更好地了解业务趋势',
        target: '.chart-container',
        position: 'left'
      }
    ],

    // 表单操作引导
    form: [
      {
        id: 'form-basic',
        title: '表单基础操作',
        content: '填写表单时，请注意必填字段的红色星号标识',
        target: '.form-container',
        position: 'top'
      },
      {
        id: 'form-validation',
        title: '数据验证',
        content: '系统会自动验证您输入的数据，确保格式正确',
        target: '.form-validation',
        position: 'right'
      },
      {
        id: 'form-submit',
        title: '提交表单',
        content: '填写完成后，点击提交按钮保存数据',
        target: '.submit-button',
        position: 'top'
      }
    ]
  },

  // 初始化引导
  init(config = {}) {
    this.config = { ...this.config, ...config }
    
    // 从本地存储加载引导进度
    this.loadGuideProgress()
    
    // 检查是否需要自动开始引导
    if (this.config.autoStart) {
      this.checkAutoStart()
    }
  },

  // 开始引导
  async startGuide(guideName, startStep = 0) {
    const steps = this.guideSteps[guideName]
    if (!steps || steps.length === 0) {
      console.warn(`Guide "${guideName}" not found`)
      return false
    }

    // 检查是否已完成引导
    if (this.isGuideCompleted(guideName)) {
      const result = await this.confirmRestartGuide(guideName)
      if (!result) {
        return false
      }
    }

    this.currentGuide = guideName
    this.currentStep = startStep
    
    // 创建引导遮罩
    this.createOverlay()
    
    // 开始显示步骤
    this.showStep(startStep)
    
    return true
  },

  // 显示引导步骤
  showStep(stepIndex) {
    const steps = this.guideSteps[this.currentGuide]
    if (!steps || stepIndex >= steps.length) {
      this.completeGuide()
      return
    }

    const step = steps[stepIndex]
    
    // 隐藏之前的步骤
    this.hideStep()
    
    // 创建步骤元素
    this.createStepElement(step, stepIndex)
    
    // 高亮目标元素
    if (step.target && this.config.highlightElement) {
      this.highlightElement(step.target)
    }
    
    // 记录进度
    this.saveGuideProgress()
  },

  // 创建引导步骤元素
  createStepElement(step, stepIndex) {
    // 移除现有步骤元素
    const existingStep = document.getElementById('guide-step')
    if (existingStep) {
      existingStep.remove()
    }

    const stepElement = document.createElement('div')
    stepElement.id = 'guide-step'
    stepElement.className = 'guide-step'
    
    // 设置位置
    this.positionStepElement(stepElement, step)
    
    // 设置内容
    stepElement.innerHTML = `
      <div class="guide-step-content">
        <div class="guide-step-header">
          <h3>${step.title}</h3>
          ${this.config.showProgress ? 
            `<div class="guide-step-progress">${stepIndex + 1} / ${this.guideSteps[this.currentGuide].length}</div>` : 
            ''}
        </div>
        <div class="guide-step-body">
          <p>${step.content}</p>
        </div>
        <div class="guide-step-footer">
          <button class="guide-button guide-button-secondary" onclick="guideService.skipGuide()">
            ${this.config.showSkip ? '跳过引导' : '关闭'}
          </button>
          <div class="guide-step-navigation">
            ${stepIndex > 0 ? 
              `<button class="guide-button guide-button-primary" onclick="guideService.previousStep()">上一步</button>` : 
              ''}
            <button class="guide-button guide-button-primary" onclick="guideService.nextStep()">
              ${stepIndex === this.guideSteps[this.currentGuide].length - 1 ? '完成' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(stepElement)
    
    // 添加动画
    setTimeout(() => {
      stepElement.classList.add('guide-step-visible')
    }, 100)
  },

  // 定位步骤元素
  positionStepElement(stepElement, step) {
    if (step.position === 'center') {
      // 居中显示
      stepElement.style.position = 'fixed'
      stepElement.style.top = '50%'
      stepElement.style.left = '50%'
      stepElement.style.transform = 'translate(-50%, -50%)'
      stepElement.style.zIndex = '10001'
    } else if (step.target) {
      // 相对于目标元素定位
      const targetElement = document.querySelector(step.target)
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect()
        stepElement.style.position = 'absolute'
        stepElement.style.zIndex = '10001'
        
        switch (step.position) {
          case 'top':
            stepElement.style.bottom = `${window.innerHeight - rect.top + 10}px`
            stepElement.style.left = `${rect.left + rect.width / 2}px`
            stepElement.style.transform = 'translateX(-50%)'
            break
          case 'bottom':
            stepElement.style.top = `${rect.bottom + 10}px`
            stepElement.style.left = `${rect.left + rect.width / 2}px`
            stepElement.style.transform = 'translateX(-50%)'
            break
          case 'left':
            stepElement.style.right = `${window.innerWidth - rect.left + 10}px`
            stepElement.style.top = `${rect.top + rect.height / 2}px`
            stepElement.style.transform = 'translateY(-50%)'
            break
          case 'right':
            stepElement.style.left = `${rect.right + 10}px`
            stepElement.style.top = `${rect.top + rect.height / 2}px`
            stepElement.style.transform = 'translateY(-50%)'
            break
        }
      }
    }
  },

  // 高亮目标元素
  highlightElement(selector) {
    // 清除之前的高亮
    this.clearHighlights()
    
    const element = document.querySelector(selector)
    if (element) {
      element.classList.add('guide-highlight')
      
      // 添加高亮样式
      if (!document.getElementById('guide-highlight-styles')) {
        const style = document.createElement('style')
        style.id = 'guide-highlight-styles'
        style.textContent = `
          .guide-highlight {
            position: relative;
            z-index: 10000;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, ${this.config.overlayOpacity});
            border-radius: 4px;
            transition: all 0.3s ease;
          }
          .guide-step {
            position: fixed;
            max-width: 400px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
          }
          .guide-step-visible {
            opacity: 1;
            transform: translateY(0);
          }
          .guide-step-content {
            padding: 24px;
          }
          .guide-step-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }
          .guide-step-header h3 {
            margin: 0;
            font-size: 18px;
            color: #333;
          }
          .guide-step-progress {
            font-size: 14px;
            color: #666;
          }
          .guide-step-body p {
            margin: 0;
            line-height: 1.6;
            color: #666;
          }
          .guide-step-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
          }
          .guide-step-navigation {
            display: flex;
            gap: 8px;
          }
          .guide-button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
          }
          .guide-button-primary {
            background: #1890ff;
            color: white;
          }
          .guide-button-primary:hover {
            background: #40a9ff;
          }
          .guide-button-secondary {
            background: #f5f5f5;
            color: #666;
          }
          .guide-button-secondary:hover {
            background: #e0e0e0;
          }
        `
        document.head.appendChild(style)
      }
    }
  },

  // 清除高亮
  clearHighlights() {
    const highlighted = document.querySelectorAll('.guide-highlight')
    highlighted.forEach(el => el.classList.remove('guide-highlight'))
  },

  // 创建遮罩层
  createOverlay() {
    if (document.getElementById('guide-overlay')) {
      return
    }

    const overlay = document.createElement('div')
    overlay.id = 'guide-overlay'
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, ${this.config.overlayOpacity});
      z-index: 9999;
      transition: opacity 0.3s ease;
    `
    
    document.body.appendChild(overlay)
  },

  // 移除遮罩层
  removeOverlay() {
    const overlay = document.getElementById('guide-overlay')
    if (overlay) {
      overlay.remove()
    }
    this.clearHighlights()
  },

  // 隐藏步骤
  hideStep() {
    const stepElement = document.getElementById('guide-step')
    if (stepElement) {
      stepElement.classList.remove('guide-step-visible')
      setTimeout(() => {
        stepElement.remove()
      }, 300)
    }
  },

  // 下一步
  nextStep() {
    this.currentStep++
    this.showStep(this.currentStep)
  },

  // 上一步
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--
      this.showStep(this.currentStep)
    }
  },

  // 跳过引导
  skipGuide() {
    this.endGuide()
    ElMessage.info('已跳过引导，您可以在设置中重新开始')
  },

  // 完成引导
  completeGuide() {
    this.markGuideCompleted(this.currentGuide)
    this.endGuide()
    ElNotification({
      title: '引导完成',
      message: '恭喜您完成了新手引导！',
      type: 'success',
      duration: 3000
    })
  },

  // 结束引导
  endGuide() {
    this.hideStep()
    this.removeOverlay()
    this.currentGuide = null
    this.currentStep = 0
    this.saveGuideProgress()
  },

  // 检查是否自动开始
  checkAutoStart() {
    // 检查是否首次访问
    if (!storageService.getItem('has-visited')) {
      setTimeout(() => {
        this.startGuide('welcome')
        storageService.setItem('has-visited', true)
      }, 1000)
    }
  },

  // 确认重新开始引导
  confirmRestartGuide(guideName) {
    return new Promise((resolve) => {
      ElMessageBox.confirm(
        '您已经完成过此引导，确定要重新开始吗？',
        '提示',
        {
          confirmButtonText: '重新开始',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        resolve(true)
      }).catch(() => {
        resolve(false)
      })
    })
  },

  // 标记引导已完成
  markGuideCompleted(guideName) {
    const completedGuides = storageService.getItem('completed-guides', [])
    if (!completedGuides.includes(guideName)) {
      completedGuides.push(guideName)
      storageService.setItem('completed-guides', completedGuides)
    }
  },

  // 检查引导是否已完成
  isGuideCompleted(guideName) {
    const completedGuides = storageService.getItem('completed-guides', [])
    return completedGuides.includes(guideName)
  },

  // 保存引导进度
  saveGuideProgress() {
    const progress = {
      currentGuide: this.currentGuide,
      currentStep: this.currentStep
    }
    storageService.setItem('guide-progress', progress)
  },

  // 加载引导进度
  loadGuideProgress() {
    const progress = storageService.getItem('guide-progress')
    if (progress && progress.currentGuide) {
      this.currentGuide = progress.currentGuide
      this.currentStep = progress.currentStep || 0
    }
  },

  // 重置所有引导
  resetAllGuides() {
    storageService.removeItem('completed-guides')
    storageService.removeItem('guide-progress')
    storageService.removeItem('has-visited')
    ElMessage.success('引导记录已重置')
  },

  // 添加自定义引导步骤
  addGuideSteps(guideName, steps) {
    this.guideSteps[guideName] = steps
  },

  // 获取所有可用的引导
  getAvailableGuides() {
    return Object.keys(this.guideSteps)
  },

  // 获取引导统计
  getGuideStatistics() {
    const completedGuides = storageService.getItem('completed-guides', [])
    const totalGuides = Object.keys(this.guideSteps).length
    
    return {
      total: totalGuides,
      completed: completedGuides.length,
      remaining: totalGuides - completedGuides.length,
      completionRate: totalGuides > 0 ? (completedGuides.length / totalGuides * 100).toFixed(1) : 0
    }
  }
}

// 键盘导航支持
document.addEventListener('keydown', (event) => {
  if (!guideService.currentGuide) return
  
  if (!guideService.config.allowKeyboardNavigation) return
  
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      guideService.nextStep()
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      guideService.previousStep()
      break
    case 'Escape':
      guideService.skipGuide()
      break
  }
})

// 导出到全局
window.guideService = guideService

export default guideService