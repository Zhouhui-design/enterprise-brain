import { ref, computed, watch, inject } from 'vue'
import { useStorage } from '@vueuse/core'

/**
 * 界面定制钩子
 * 提供布局、组件、动画等界面定制功能
 */
export function useCustomization() {
  // 从主题服务注入定制化配置
  const customizationService = inject('customizationService')
  
  // 本地存储的定制设置
  const customSettings = useStorage('app-custom-settings', {
    layout: {
      sidebarWidth: 250,
      sidebarCollapsed: false,
      sidebarTheme: 'dark',
      headerHeight: 60,
      headerTheme: 'primary',
      contentPadding: 20,
      contentMaxWidth: 'boxed',
      showFooter: true,
      showBreadcrumb: true,
      navigationMode: 'sidebar',
      menuAccordion: false,
      menuIcons: true,
      menuBadges: true
    },
    components: {
      borderRadius: 6,
      buttonSize: 'default',
      buttonShape: 'rounded',
      tableSize: 'default',
      tableBorder: true,
      tableStripe: true,
      inputSize: 'default',
      inputShape: 'rounded',
      cardShadow: 'default',
      animationDuration: 300,
      animationEasing: 'ease',
      enableTransitions: true,
      enableAnimations: true
    },
    appearance: {
      colorScheme: 'auto', // auto, light, dark
      compactMode: false,
      highContrast: false,
      reducedMotion: false,
      fontSize: 'medium', // small, medium, large
      fontFamily: 'system',
      density: 'comfortable' // compact, comfortable, spacious
    },
    behavior: {
      enableSounds: false,
      enableNotifications: true,
      enableTooltips: true,
      enableShortcuts: true,
      autoSave: true,
      confirmBeforeDelete: true,
      confirmBeforeExit: false
    },
    advanced: {
      customCSS: '',
      customJS: '',
      devMode: false,
      showPerformanceMonitor: false,
      showGridLayout: false,
      enableExperimentalFeatures: false
    }
  })

  // 响应式状态
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(true)
  
  const isLoading = ref(false)
  const hasChanges = ref(false)
  const error = ref(null)

  // 监听器列表
  const listeners = new Set()

  /**
   * 检测设备类型
   */
  const detectDeviceType = () => {
    if (typeof window === 'undefined') return

    const width = window.innerWidth
    
    isMobile.value = width <= 768
    isTablet.value = width > 768 && width <= 1024
    isDesktop.value = width > 1024
  }

  /**
   * 更新布局设置
   */
  const updateLayout = (layoutConfig) => {
    try {
      isLoading.value = true
      error.value = null

      customSettings.value.layout = {
        ...customSettings.value.layout,
        ...layoutConfig
      }

      applyLayoutSettings(customSettings.value.layout)
      notifyListeners('layout-update', { layout: customSettings.value.layout })
      
    } catch (err) {
      error.value = err.message || '布局更新失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新组件设置
   */
  const updateComponents = (componentConfig) => {
    try {
      isLoading.value = true
      error.value = null

      customSettings.value.components = {
        ...customSettings.value.components,
        ...componentConfig
      }

      applyComponentSettings(customSettings.value.components)
      notifyListeners('component-update', { components: customSettings.value.components })
      
    } catch (err) {
      error.value = err.message || '组件更新失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新外观设置
   */
  const updateAppearance = (appearanceConfig) => {
    try {
      isLoading.value = true
      error.value = null

      customSettings.value.appearance = {
        ...customSettings.value.appearance,
        ...appearanceConfig
      }

      applyAppearanceSettings(customSettings.value.appearance)
      notifyListeners('appearance-update', { appearance: customSettings.value.appearance })
      
    } catch (err) {
      error.value = err.message || '外观更新失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新行为设置
   */
  const updateBehavior = (behaviorConfig) => {
    try {
      isLoading.value = true
      error.value = null

      customSettings.value.behavior = {
        ...customSettings.value.behavior,
        ...behaviorConfig
      }

      applyBehaviorSettings(customSettings.value.behavior)
      notifyListeners('behavior-update', { behavior: customSettings.value.behavior })
      
    } catch (err) {
      error.value = err.message || '行为更新失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 应用布局设置到DOM
   */
  const applyLayoutSettings = (layout) => {
    const root = document.documentElement
    
    // 设置CSS变量
    root.style.setProperty('--sidebar-width', `${layout.sidebarWidth}px`)
    root.style.setProperty('--sidebar-collapsed-width', '80px')
    root.style.setProperty('--header-height', `${layout.headerHeight}px`)
    root.style.setProperty('--content-padding', `${layout.contentPadding}px`)
    
    // 设置布局类
    root.classList.toggle('sidebar-collapsed', layout.sidebarCollapsed)
    root.classList.toggle('show-footer', layout.showFooter)
    root.classList.toggle('show-breadcrumb', layout.showBreadcrumb)
    
    root.classList.remove('nav-sidebar', 'nav-top', 'nav-mix')
    root.classList.add(`nav-${layout.navigationMode}`)
    
    // 应用主题到侧边栏和头部
    applyThemeToElement('sidebar', layout.sidebarTheme)
    applyThemeToElement('header', layout.headerTheme)
    
    // 响应式布局调整
    applyResponsiveLayout(layout)
  }

  /**
   * 应用组件设置到DOM
   */
  const applyComponentSettings = (components) => {
    const root = document.documentElement
    
    // 设置组件CSS变量
    root.style.setProperty('--border-radius', `${components.borderRadius}px`)
    root.style.setProperty('--animation-duration', `${components.animationDuration}ms`)
    root.style.setProperty('--animation-easing', components.animationEasing)
    
    // 设置按钮样式
    root.classList.remove('btn-sm', 'btn-md', 'btn-lg')
    root.classList.add(`btn-${components.buttonSize}`)
    
    root.classList.remove('btn-square', 'btn-rounded', 'btn-circle')
    root.classList.add(`btn-${components.buttonShape}`)
    
    // 设置输入框样式
    root.classList.remove('input-sm', 'input-md', 'input-lg')
    root.classList.add(`input-${components.inputSize}`)
    
    root.classList.remove('input-square', 'input-rounded')
    root.classList.add(`input-${components.inputShape}`)
    
    // 设置表格样式
    root.classList.remove('table-sm', 'table-md', 'table-lg')
    root.classList.add(`table-${components.tableSize}`)
    root.classList.toggle('table-bordered', components.tableBorder)
    root.classList.toggle('table-striped', components.tableStripe)
    
    // 设置卡片阴影
    root.classList.remove('shadow-none', 'shadow-light', 'shadow-medium', 'shadow-heavy')
    root.classList.add(`shadow-${components.cardShadow}`)
    
    // 启用/禁用过渡和动画
    root.classList.toggle('transitions-enabled', components.enableTransitions)
    root.classList.toggle('animations-enabled', components.enableAnimations)
  }

  /**
   * 应用外观设置到DOM
   */
  const applyAppearanceSettings = (appearance) => {
    const root = document.documentElement
    
    // 颜色方案
    if (appearance.colorScheme === 'dark') {
      root.classList.add('dark-mode')
      root.classList.remove('light-mode')
    } else if (appearance.colorScheme === 'light') {
      root.classList.add('light-mode')
      root.classList.remove('dark-mode')
    } else {
      // 自动检测
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark-mode', prefersDark)
      root.classList.toggle('light-mode', !prefersDark)
    }
    
    // 紧凑模式
    root.classList.toggle('compact-mode', appearance.compactMode)
    root.classList.toggle('normal-mode', !appearance.compactMode)
    
    // 高对比度
    root.classList.toggle('high-contrast', appearance.highContrast)
    
    // 减少动效
    root.classList.toggle('reduced-motion', appearance.reducedMotion)
    
    // 字体大小
    root.classList.remove('font-sm', 'font-md', 'font-lg')
    root.classList.add(`font-${appearance.fontSize}`)
    
    // 字体族
    root.classList.remove('font-system', 'font-serif', 'font-mono')
    root.classList.add(`font-${appearance.fontFamily}`)
    
    // 密度
    root.classList.remove('density-compact', 'density-comfortable', 'density-spacious')
    root.classList.add(`density-${appearance.density}`)
  }

  /**
   * 应用行为设置
   */
  const applyBehaviorSettings = (behavior) => {
    const root = document.documentElement
    
    root.classList.toggle('sounds-enabled', behavior.enableSounds)
    root.classList.toggle('notifications-enabled', behavior.enableNotifications)
    root.classList.toggle('tooltips-enabled', behavior.enableTooltips)
    root.classList.toggle('shortcuts-enabled', behavior.enableShortcuts)
    root.classList.toggle('auto-save-enabled', behavior.autoSave)
    root.classList.toggle('confirm-delete', behavior.confirmBeforeDelete)
    root.classList.toggle('confirm-exit', behavior.confirmBeforeExit)
    
    // 注入自定义CSS和JS
    applyCustomCode(customSettings.value.advanced)
  }

  /**
   * 应用主题到特定元素
   */
  const applyThemeToElement = (element, theme) => {
    const elementList = document.querySelectorAll(`.${element}`)
    elementList.forEach(el => {
      el.classList.remove('theme-light', 'theme-dark', 'theme-primary')
      el.classList.add(`theme-${theme}`)
    })
  }

  /**
   * 应用响应式布局
   */
  const applyResponsiveLayout = (layout) => {
    if (isMobile.value) {
      // 移动端适配
      document.documentElement.classList.add('mobile-layout')
      document.documentElement.classList.remove('tablet-layout', 'desktop-layout')
      
      // 移动端侧边栏设置
      if (layout.navigationMode === 'sidebar') {
        document.documentElement.style.setProperty('--sidebar-width', '100%')
      }
    } else if (isTablet.value) {
      document.documentElement.classList.add('tablet-layout')
      document.documentElement.classList.remove('mobile-layout', 'desktop-layout')
    } else {
      document.documentElement.classList.add('desktop-layout')
      document.documentElement.classList.remove('mobile-layout', 'tablet-layout')
    }
  }

  /**
   * 应用自定义代码
   */
  const applyCustomCode = (advanced) => {
    // 移除之前的自定义CSS
    const existingCSS = document.getElementById('custom-css')
    if (existingCSS) {
      existingCSS.remove()
    }
    
    // 添加自定义CSS
    if (advanced.customCSS) {
      const style = document.createElement('style')
      style.id = 'custom-css'
      style.textContent = advanced.customCSS
      document.head.appendChild(style)
    }
    
    // 移除之前的自定义JS
    const existingJS = document.getElementById('custom-js')
    if (existingJS) {
      existingJS.remove()
    }
    
    // 添加自定义JS（谨慎使用）
    if (advanced.customJS && advanced.devMode) {
      const script = document.createElement('script')
      script.id = 'custom-js'
      script.textContent = advanced.customJS
      document.head.appendChild(script)
    }
  }

  /**
   * 重置所有设置
   */
  const resetSettings = () => {
    customSettings.value = {
      layout: {
        sidebarWidth: 250,
        sidebarCollapsed: false,
        sidebarTheme: 'dark',
        headerHeight: 60,
        headerTheme: 'primary',
        contentPadding: 20,
        contentMaxWidth: 'boxed',
        showFooter: true,
        showBreadcrumb: true,
        navigationMode: 'sidebar',
        menuAccordion: false,
        menuIcons: true,
        menuBadges: true
      },
      components: {
        borderRadius: 6,
        buttonSize: 'default',
        buttonShape: 'rounded',
        tableSize: 'default',
        tableBorder: true,
        tableStripe: true,
        inputSize: 'default',
        inputShape: 'rounded',
        cardShadow: 'default',
        animationDuration: 300,
        animationEasing: 'ease',
        enableTransitions: true,
        enableAnimations: true
      },
      appearance: {
        colorScheme: 'auto',
        compactMode: false,
        highContrast: false,
        reducedMotion: false,
        fontSize: 'medium',
        fontFamily: 'system',
        density: 'comfortable'
      },
      behavior: {
        enableSounds: false,
        enableNotifications: true,
        enableTooltips: true,
        enableShortcuts: true,
        autoSave: true,
        confirmBeforeDelete: true,
        confirmBeforeExit: false
      },
      advanced: {
        customCSS: '',
        customJS: '',
        devMode: false,
        showPerformanceMonitor: false,
        showGridLayout: false,
        enableExperimentalFeatures: false
      }
    }
    
    applyAllSettings()
    notifyListeners('reset', {})
  }

  /**
   * 应用所有设置
   */
  const applyAllSettings = () => {
    applyLayoutSettings(customSettings.value.layout)
    applyComponentSettings(customSettings.value.components)
    applyAppearanceSettings(customSettings.value.appearance)
    applyBehaviorSettings(customSettings.value.behavior)
  }

  /**
   * 导出设置
   */
  const exportSettings = () => {
    const settings = {
      ...customSettings.value,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    }
    
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'custom-settings.json'
    link.click()
    
    URL.revokeObjectURL(url)
    
    notifyListeners('export', settings)
  }

  /**
   * 导入设置
   */
  const importSettings = async (file) => {
    try {
      isLoading.value = true
      error.value = null

      const text = await file.text()
      const data = JSON.parse(text)
      
      // 验证并合并设置
      Object.keys(customSettings.value).forEach(key => {
        if (data[key] && typeof data[key] === 'object') {
          customSettings.value[key] = {
            ...customSettings.value[key],
            ...data[key]
          }
        }
      })
      
      applyAllSettings()
      notifyListeners('import', data)
      
    } catch (err) {
      error.value = err.message || '导入设置失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 监听设置变化
   */
  const onSettingChange = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  /**
   * 监听特定设置变化
   */
  const onLayoutChange = (listener) => {
    return onSettingChange((event, data) => {
      if (event === 'layout-update') {
        listener(data.layout)
      }
    })
  }

  const onComponentChange = (listener) => {
    return onSettingChange((event, data) => {
      if (event === 'component-update') {
        listener(data.components)
      }
    })
  }

  const onAppearanceChange = (listener) => {
    return onSettingChange((event, data) => {
      if (event === 'appearance-update') {
        listener(data.appearance)
      }
    })
  }

  const onBehaviorChange = (listener) => {
    return onSettingChange((event, data) => {
      if (event === 'behavior-update') {
        listener(data.behavior)
      }
    })
  }

  /**
   * 通知监听器
   */
  const notifyListeners = (event, data) => {
    listeners.forEach(listener => {
      try {
        listener(event, data)
      } catch (err) {
        console.warn('设置监听器执行失败:', err)
      }
    })
  }

  /**
   * 检测设置是否有变化
   */
  const hasUnsavedChanges = computed(() => {
    return hasChanges.value
  })

  /**
   * 标记为已保存
   */
  const markAsSaved = () => {
    hasChanges.value = false
  }

  /**
   * 标记为有变化
   */
  const markAsChanged = () => {
    hasChanges.value = true
  }

  // 计算属性
  const currentLayout = computed(() => customSettings.value.layout)
  const currentComponents = computed(() => customSettings.value.components)
  const currentAppearance = computed(() => customSettings.value.appearance)
  const currentBehavior = computed(() => customSettings.value.behavior)
  const currentAdvanced = computed(() => customSettings.value.advanced)

  // 监听设置变化
  watch(customSettings, (newValue, oldValue) => {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      markAsChanged()
    }
  }, { deep: true })

  // 监听窗口大小变化
  window.addEventListener('resize', detectDeviceType)
  
  // 初始化
  detectDeviceType()
  applyAllSettings()

  return {
    // 状态
    isMobile,
    isTablet,
    isDesktop,
    isLoading,
    error,
    hasUnsavedChanges,
    
    // 当前设置
    currentLayout,
    currentComponents,
    currentAppearance,
    currentBehavior,
    currentAdvanced,
    
    // 方法
    updateLayout,
    updateComponents,
    updateAppearance,
    updateBehavior,
    resetSettings,
    exportSettings,
    importSettings,
    onSettingChange,
    onLayoutChange,
    onComponentChange,
    onAppearanceChange,
    onBehaviorChange,
    markAsSaved,
    markAsChanged,
    detectDeviceType
  }
}