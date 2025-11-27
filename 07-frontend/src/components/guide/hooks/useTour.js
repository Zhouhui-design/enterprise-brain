import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

/**
 * 引导游览 Hook
 * 提供游戏化的用户引导功能，类似于新手教程
 */
export function useTour(initialConfig = {}) {
  // 响应式状态
  const tourState = reactive({
    // 是否活跃
    isActive: false,
    
    // 当前步骤索引
    currentIndex: 0,
    
    // 引导步骤
    steps: [],
    
    // 总步骤数
    totalSteps: 0,
    
    // 当前步骤
    currentStep: null,
    
    // 引导配置
    config: {
      // 是否允许跳过
      allowSkip: true,
      // 是否显示进度
      showProgress: true,
      // 是否允许键盘导航
      allowKeyboardNavigation: true,
      // 是否自动滚动到目标
      autoScroll: true,
      // 是否显示遮罩
      showOverlay: true,
      // 完成后的回调
      onComplete: null,
      // 跳过后的回调
      onSkip: null,
      // 步骤变化的回调
      onStepChange: null,
      // 引导名称（用于存储完成状态）
      tourName: null,
      // 是否记录完成状态
      trackCompletion: true,
      ...initialConfig
    },
    
    // 历史记录
    history: [],
    
    // 错误信息
    error: null,
    
    // 加载状态
    isLoading: false
  })

  // 内部状态
  const tourTimer = ref(null)
  const isPaused = ref(false)

  // 计算属性
  const isFirstStep = computed(() => tourState.currentIndex === 0)
  const isLastStep = computed(() => tourState.currentIndex >= tourState.totalSteps - 1)
  const progressPercentage = computed(() => {
    if (tourState.totalSteps === 0) return 0
    return Math.round((tourState.currentIndex + 1) / tourState.totalSteps * 100)
  })

  const nextStepAvailable = computed(() => 
    tourState.currentIndex < tourState.totalSteps - 1
  )

  const previousStepAvailable = computed(() => 
    tourState.currentIndex > 0
  )

  // 方法：初始化引导
  const initializeTour = async (config) => {
    try {
      tourState.isLoading = true
      tourState.error = null

      // 合并配置
      tourState.config = { ...tourState.config, ...config }

      // 验证步骤
      if (!config.steps || !Array.isArray(config.steps)) {
        throw new Error('Invalid steps configuration')
      }

      // 过滤和预处理步骤
      tourState.steps = preprocessSteps(config.steps)
      tourState.totalSteps = tourState.steps.length

      // 重置状态
      tourState.currentIndex = 0
      tourState.history = []

      // 检查是否已经完成
      if (tourState.config.trackCompletion && tourState.config.tourName) {
        const isCompleted = await checkTourCompletion(tourState.config.tourName)
        if (isCompleted) {
          tourState.isActive = false
          return { completed: true }
        }
      }

      tourState.isLoading = false
      return { success: true, totalSteps: tourState.totalSteps }
    } catch (error) {
      tourState.error = error.message
      tourState.isLoading = false
      throw error
    }
  }

  // 方法：开始引导
  const startTour = async (config) => {
    try {
      // 如果有配置，先初始化
      if (config) {
        const initResult = await initializeTour(config)
        if (initResult.completed) {
          ElMessage.info('您已经完成过这个引导了！')
          return
        }
      }

      // 检查是否可以直接开始
      if (tourState.totalSteps === 0) {
        throw new Error('No steps configured for the tour')
      }

      tourState.isActive = true
      tourState.isPaused = false

      // 加载第一步
      await loadStep(0)

      // 显示开始提示
      if (tourState.config.showStartMessage) {
        ElNotification({
          title: '开始引导',
          message: '欢迎来到引导模式！让我们一步步了解系统功能。',
          type: 'info',
          duration: 3000
        })
      }

      // 记录开始事件
      recordTourEvent('tour_start')

    } catch (error) {
      console.error('Failed to start tour:', error)
      ElMessage.error('启动引导失败：' + error.message)
    }
  }

  // 方法：暂停引导
  const pauseTour = () => {
    isPaused.value = true
    recordTourEvent('tour_pause')
  }

  // 方法：恢复引导
  const resumeTour = () => {
    isPaused.value = false
    recordTourEvent('tour_resume')
  }

  // 方法：结束引导
  const endTour = (reason = 'manual') => {
    if (!tourState.isActive) return

    tourState.isActive = false
    isPaused.value = false

    // 清理定时器
    if (tourTimer.value) {
      clearTimeout(tourTimer.value)
    }

    // 记录结束事件
    recordTourEvent('tour_end', { reason })

    // 调用回调
    if (reason === 'complete' && tourState.config.onComplete) {
      tourState.config.onComplete(tourState.history)
    } else if (reason === 'skip' && tourState.config.onSkip) {
      tourState.config.onSkip(tourState.history)
    }

    // 显示结束提示
    if (reason === 'complete' && tourState.config.showCompleteMessage) {
      ElNotification({
        title: '引导完成',
        message: '恭喜！您已经完成了所有引导步骤。',
        type: 'success',
        duration: 4000
      })
    }

    // 记录完成状态
    if (reason === 'complete' && tourState.config.trackCompletion && tourState.config.tourName) {
      saveTourCompletion(tourState.config.tourName)
    }
  }

  // 方法：下一步
  const nextStep = async () => {
    if (!nextStepAvailable.value || isPaused.value) return

    try {
      // 记录当前步骤完成
      recordStepComplete(tourState.currentIndex)

      // 移动到下一步
      tourState.currentIndex++
      
      await loadStep(tourState.currentIndex)
      
      // 触发步骤变化回调
      if (tourState.config.onStepChange) {
        tourState.config.onStepChange(tourState.currentStep, tourState.currentIndex)
      }

      recordTourEvent('step_next', { 
        from: tourState.currentIndex - 1, 
        to: tourState.currentIndex 
      })

    } catch (error) {
      console.error('Failed to load next step:', error)
      ElMessage.error('加载下一步失败：' + error.message)
      
      // 回退到上一步
      tourState.currentIndex--
    }
  }

  // 方法：上一步
  const previousStep = async () => {
    if (!previousStepAvailable.value || isPaused.value) return

    try {
      // 记录当前步骤
      recordStepEvent(tourState.currentIndex, 'step_previous')

      // 移动到上一步
      tourState.currentIndex--
      
      await loadStep(tourState.currentIndex)
      
      // 触发步骤变化回调
      if (tourState.config.onStepChange) {
        tourState.config.onStepChange(tourState.currentStep, tourState.currentIndex)
      }

      recordTourEvent('step_previous', { 
        from: tourState.currentIndex + 1, 
        to: tourState.currentIndex 
      })

    } catch (error) {
      console.error('Failed to load previous step:', error)
      ElMessage.error('加载上一步失败：' + error.message)
      
      // 回到下一步
      tourState.currentIndex++
    }
  }

  // 方法：跳转到指定步骤
  const goToStep = async (stepIndex) => {
    if (stepIndex < 0 || stepIndex >= tourState.totalSteps || isPaused.value) {
      return
    }

    try {
      const previousIndex = tourState.currentIndex
      
      // 记录跳转事件
      recordStepEvent(previousIndex, 'step_jump', { to: stepIndex })

      // 跳转到目标步骤
      tourState.currentIndex = stepIndex
      
      await loadStep(stepIndex)
      
      // 触发步骤变化回调
      if (tourState.config.onStepChange) {
        tourState.config.onStepChange(tourState.currentStep, stepIndex)
      }

      recordTourEvent('step_jump', { 
        from: previousIndex, 
        to: stepIndex 
      })

    } catch (error) {
      console.error('Failed to jump to step:', error)
      ElMessage.error('跳转步骤失败：' + error.message)
      
      // 回到原步骤
      tourState.currentIndex = previousIndex
    }
  }

  // 方法：跳过引导
  const skipTour = () => {
    if (!tourState.config.allowSkip) {
      ElMessage.warning('当前引导不允许跳过')
      return
    }

    if (confirm('确定要跳过引导吗？您可以稍后重新开始。')) {
      endTour('skip')
    }
  }

  // 方法：完成引导
  const completeTour = () => {
    // 记录最后一步完成
    if (tourState.currentIndex < tourState.totalSteps) {
      recordStepComplete(tourState.currentIndex)
    }

    endTour('complete')
  }

  // 内部方法：加载步骤
  const loadStep = async (stepIndex) => {
    const step = tourState.steps[stepIndex]
    if (!step) {
      throw new Error(`Step ${stepIndex} not found`)
    }

    tourState.currentStep = step

    // 执行步骤前置动作
    if (step.beforeShow) {
      await step.beforeShow()
    }

    // 自动滚动到目标
    if (tourState.config.autoScroll && step.target) {
      await scrollToTarget(step.target)
    }

    // 等待DOM更新
    await nextTick()

    // 高亮目标元素
    if (step.target) {
      highlightTarget(step.target)
    }

    // 执行步骤后置动作
    if (step.afterShow) {
      await step.afterShow()
    }

    // 设置自动前进（如果配置了）
    if (step.autoAdvance && step.duration) {
      tourTimer.value = setTimeout(() => {
        nextStep()
      }, step.duration)
    }
  }

  // 内部方法：预处理步骤
  const preprocessSteps = (steps) => {
    return steps.map((step, index) => ({
      id: step.id || `step-${index}`,
      title: step.title || `步骤 ${index + 1}`,
      content: step.content || '',
      target: step.target || null,
      position: step.position || 'bottom',
      icon: step.icon || 'fas fa-info-circle',
      duration: step.duration || 0,
      autoAdvance: step.autoAdvance || false,
      allowSkip: step.allowSkip !== false,
      showSkip: step.showSkip !== false,
      actions: step.actions || [],
      validation: step.validation || null,
      beforeShow: step.beforeShow || null,
      afterShow: step.afterShow || null,
      onValidate: step.onValidate || null,
      ...step
    }))
  }

  // 内部方法：滚动到目标
  const scrollToTarget = async (target) => {
    const element = document.querySelector(target)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      })
      
      // 等待滚动完成
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  // 内部方法：高亮目标元素
  const highlightTarget = (target) => {
    // 移除之前的高亮
    document.querySelectorAll('.tour-highlighted').forEach(el => {
      el.classList.remove('tour-highlighted')
    })

    // 添加新的高亮
    const element = document.querySelector(target)
    if (element) {
      element.classList.add('tour-highlighted')
    }
  }

  // 内部方法：记录步骤完成
  const recordStepComplete = (stepIndex) => {
    const step = tourState.steps[stepIndex]
    if (step) {
      recordStepEvent(stepIndex, 'step_complete')
    }
  }

  // 内部方法：记录步骤事件
  const recordStepEvent = (stepIndex, eventType, data = {}) => {
    const step = tourState.steps[stepIndex]
    if (!step) return

    const event = {
      stepId: step.id,
      stepIndex,
      eventType,
      timestamp: Date.now(),
      data
    }

    tourState.history.push(event)
  }

  // 内部方法：记录引导事件
  const recordTourEvent = (eventType, data = {}) => {
    const event = {
      eventType,
      timestamp: Date.now(),
      data,
      tourName: tourState.config.tourName
    }

    tourState.history.push(event)
  }

  // 内部方法：检查引导完成状态
  const checkTourCompletion = async (tourName) => {
    try {
      const completed = localStorage.getItem(`tour_completed_${tourName}`)
      return completed === 'true'
    } catch (error) {
      console.warn('Failed to check tour completion:', error)
      return false
    }
  }

  // 内部方法：保存引导完成状态
  const saveTourCompletion = (tourName) => {
    try {
      localStorage.setItem(`tour_completed_${tourName}`, 'true')
      localStorage.setItem(`tour_completed_date_${tourName}`, new Date().toISOString())
    } catch (error) {
      console.warn('Failed to save tour completion:', error)
    }
  }

  // 重置引导状态
  const resetTour = () => {
    tourState.isActive = false
    tourState.currentIndex = 0
    tourState.currentStep = null
    tourState.history = []
    tourState.error = null
    
    if (tourTimer.value) {
      clearTimeout(tourTimer.value)
    }
  }

  // 获取引导统计
  const getTourStats = () => {
    return {
      totalSteps: tourState.totalSteps,
      completedSteps: tourState.history.filter(event => 
        event.eventType === 'step_complete'
      ).length,
      totalTime: tourState.history.length > 0 ? 
        Date.now() - tourState.history[0].timestamp : 0,
      skipCount: tourState.history.filter(event => 
        event.eventType === 'tour_skip'
      ).length
    }
  }

  // 导出状态和方法
  return {
    // 状态
    tourState,
    isPaused,
    
    // 计算属性
    isFirstStep,
    isLastStep,
    progressPercentage,
    nextStepAvailable,
    previousStepAvailable,
    
    // 主要方法
    initializeTour,
    startTour,
    endTour,
    pauseTour,
    resumeTour,
    nextStep,
    previousStep,
    goToStep,
    skipTour,
    completeTour,
    resetTour,
    
    // 工具方法
    getTourStats,
    loadStep,
    recordTourEvent,
    recordStepEvent
  }
}