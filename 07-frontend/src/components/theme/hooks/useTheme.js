import { ref, computed, watch, inject, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'

/**
 * 主题管理钩子
 * 提供主题切换、自定义主题、导出导入等功能
 */
export function useTheme() {
  // 从 ThemeProvider 注入主题服务
  const themeService = inject('themeService')
  
  // 本地存储的当前主题名称
  const currentThemeName = useStorage('app-theme', 'default')
  
  // 主题配置存储
  const customThemes = useStorage('app-custom-themes', {})
  const themeSettings = useStorage('app-theme-settings', {
    enableSystemTheme: false,
    followSystemColor: false,
    autoSwitchTheme: false,
    themeTransitionDuration: 300
  })

  // 当前主题的响应式引用
  const currentTheme = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // 主题变化监听器列表
  const listeners = new Set()

  /**
   * 获取可用主题列表
   */
  const getAvailableThemes = () => {
    const defaultThemes = ['default', 'dark', 'light', 'blue', 'green']
    const customThemeNames = Object.keys(customThemes.value)
    return [
      ...defaultThemes.map(name => ({
        name,
        label: getThemeLabel(name),
        isCustom: false,
        preview: getThemePreview(name)
      })),
      ...customThemeNames.map(name => ({
        name,
        label: customThemes.value[name]?.name || name,
        isCustom: true,
        preview: getCustomThemePreview(customThemes.value[name])
      }))
    ]
  }

  /**
   * 获取主题标签
   */
  const getThemeLabel = (name) => {
    const labels = {
      default: '默认主题',
      dark: '深色主题',
      light: '浅色主题',
      blue: '蓝色主题',
      green: '绿色主题'
    }
    return labels[name] || name
  }

  /**
   * 获取主题预览
   */
  const getThemePreview = (name) => {
    const previews = {
      default: {
        primary: '#409EFF',
        background: '#ffffff',
        text: '#303133'
      },
      dark: {
        primary: '#409EFF',
        background: '#1a1a1a',
        text: '#ffffff'
      },
      light: {
        primary: '#2c5cc5',
        background: '#ffffff',
        text: '#262626'
      },
      blue: {
        primary: '#1890ff',
        background: '#f0f5ff',
        text: '#262626'
      },
      green: {
        primary: '#52c41a',
        background: '#f6ffed',
        text: '#262626'
      }
    }
    return previews[name] || previews.default
  }

  /**
   * 获取自定义主题预览
   */
  const getCustomThemePreview = (theme) => {
    return {
      primary: theme.primaryColor || '#409EFF',
      background: theme.backgroundColor || '#ffffff',
      text: theme.textColor || '#303133'
    }
  }

  /**
   * 切换主题
   */
  const setTheme = async (themeName) => {
    if (isLoading.value) return
    
    try {
      isLoading.value = true
      error.value = null

      // 如果使用主题服务，调用服务方法
      if (themeService && typeof themeService.setTheme === 'function') {
        await themeService.setTheme(themeName)
      } else {
        // 本地主题切换逻辑
        currentThemeName.value = themeName
        
        // 更新CSS变量
        await updateThemeVariables(themeName)
      }

      // 通知监听器
      notifyListeners('change', { themeName, theme: currentTheme.value })
      
    } catch (err) {
      error.value = err.message || '主题切换失败'
      console.error('主题切换失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新主题CSS变量
   */
  const updateThemeVariables = async (themeName) => {
    const theme = getThemeByName(themeName)
    if (!theme) return

    // 应用主题到document.documentElement
    Object.entries(theme).forEach(([key, value]) => {
      if (key.startsWith('--')) {
        document.documentElement.style.setProperty(key, value)
      }
    })

    // 设置data属性
    document.documentElement.setAttribute('data-theme', themeName)
    document.documentElement.setAttribute('data-mode', theme.mode || 'light')
  }

  /**
   * 根据名称获取主题配置
   */
  const getThemeByName = (name) => {
    // 先查找自定义主题
    if (customThemes.value[name]) {
      return customThemes.value[name]
    }

    // 查找预设主题
    const presetThemes = {
      default: {
        mode: 'light',
        primaryColor: '#409EFF',
        secondaryColor: '#79bbff',
        backgroundColor: '#ffffff',
        textColor: '#303133',
        borderColor: '#dcdfe6',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        successColor: '#67C23A',
        warningColor: '#E6A23C',
        dangerColor: '#F56C6C',
        infoColor: '#909399'
      },
      dark: {
        mode: 'dark',
        primaryColor: '#409EFF',
        secondaryColor: '#79bbff',
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        borderColor: '#434343',
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        successColor: '#67C23A',
        warningColor: '#E6A23C',
        dangerColor: '#F56C6C',
        infoColor: '#909399'
      },
      light: {
        mode: 'light',
        primaryColor: '#2c5cc5',
        secondaryColor: '#5b7fdc',
        backgroundColor: '#ffffff',
        textColor: '#262626',
        borderColor: '#d9d9d9',
        shadowColor: 'rgba(0, 0, 0, 0.08)',
        successColor: '#52c41a',
        warningColor: '#faad14',
        dangerColor: '#ff4d4f',
        infoColor: '#1890ff'
      },
      blue: {
        mode: 'light',
        primaryColor: '#1890ff',
        secondaryColor: '#40a9ff',
        backgroundColor: '#f0f5ff',
        textColor: '#262626',
        borderColor: '#d9d9d9',
        shadowColor: 'rgba(24, 144, 255, 0.1)',
        successColor: '#52c41a',
        warningColor: '#faad14',
        dangerColor: '#ff4d4f',
        infoColor: '#1890ff'
      },
      green: {
        mode: 'light',
        primaryColor: '#52c41a',
        secondaryColor: '#73d13d',
        backgroundColor: '#f6ffed',
        textColor: '#262626',
        borderColor: '#d9d9d9',
        shadowColor: 'rgba(82, 196, 26, 0.1)',
        successColor: '#52c41a',
        warningColor: '#faad14',
        dangerColor: '#ff4d4f',
        infoColor: '#1890ff'
      }
    }

    return presetThemes[name]
  }

  /**
   * 创建自定义主题
   */
  const createCustomTheme = async (themeConfig) => {
    const themeName = themeConfig.name || `custom-${Date.now()}`
    
    try {
      isLoading.value = true
      error.value = null

      // 验证主题配置
      const validatedTheme = validateThemeConfig(themeConfig)
      
      // 保存到本地存储
      customThemes.value[themeName] = validatedTheme
      
      // 如果使用主题服务，调用服务方法
      if (themeService && typeof themeService.setTheme === 'function') {
        await themeService.setTheme(themeName, validatedTheme)
      } else {
        currentThemeName.value = themeName
        await updateThemeVariables(themeName)
      }

      notifyListeners('create', { themeName, theme: validatedTheme })
      return validatedTheme
      
    } catch (err) {
      error.value = err.message || '创建主题失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 验证主题配置
   */
  const validateThemeConfig = (config) => {
    const required = ['primaryColor', 'backgroundColor', 'textColor']
    const missing = required.filter(field => !config[field])
    
    if (missing.length > 0) {
      throw new Error(`缺少必需字段: ${missing.join(', ')}`)
    }

    return {
      name: config.name,
      mode: config.mode || 'light',
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor || adjustColor(config.primaryColor, 20),
      backgroundColor: config.backgroundColor,
      textColor: config.textColor,
      borderColor: config.borderColor || adjustColor(config.textColor, 80),
      shadowColor: config.shadowColor || hexToRgba(config.backgroundColor, 0.1),
      successColor: config.successColor || '#52C41A',
      warningColor: config.warningColor || '#E6A23C',
      dangerColor: config.dangerColor || '#F56C6C',
      infoColor: config.infoColor || '#909399',
      customProperties: config.customProperties || {},
      layout: config.layout || {
        sidebarWidth: 250,
        headerHeight: 60,
        contentPadding: 20
      },
      components: config.components || {
        borderRadius: 6,
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * 更新自定义主题
   */
  const updateCustomTheme = async (themeName, updates) => {
    try {
      isLoading.value = true
      error.value = null

      const existingTheme = customThemes.value[themeName]
      if (!existingTheme) {
        throw new Error(`主题 "${themeName}" 不存在`)
      }

      const updatedTheme = {
        ...existingTheme,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      customThemes.value[themeName] = updatedTheme

      if (currentThemeName.value === themeName) {
        await updateThemeVariables(themeName)
      }

      notifyListeners('update', { themeName, theme: updatedTheme })
      return updatedTheme
      
    } catch (err) {
      error.value = err.message || '更新主题失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 删除自定义主题
   */
  const deleteCustomTheme = async (themeName) => {
    try {
      isLoading.value = true
      error.value = null

      if (!customThemes.value[themeName]) {
        throw new Error(`主题 "${themeName}" 不存在`)
      }

      delete customThemes.value[themeName]

      // 如果删除的是当前主题，切换到默认主题
      if (currentThemeName.value === themeName) {
        await setTheme('default')
      }

      notifyListeners('delete', { themeName })
      
    } catch (err) {
      error.value = err.message || '删除主题失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 导出主题
   */
  const exportTheme = (themeName) => {
    const theme = themeName ? customThemes.value[themeName] : {
      name: 'all-themes',
      themes: {
        ...customThemes.value
      }
    }

    const dataStr = JSON.stringify(theme, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${theme.name}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    
    notifyListeners('export', { themeName, theme })
  }

  /**
   * 导入主题
   */
  const importTheme = async (file) => {
    try {
      isLoading.value = true
      error.value = null

      const text = await file.text()
      const data = JSON.parse(text)

      if (data.name && data.primaryColor) {
        // 导入单个主题
        const validatedTheme = validateThemeConfig(data)
        await createCustomTheme(validatedTheme)
      } else if (data.themes) {
        // 导入多个主题
        const themes = data.themes
        for (const [name, themeConfig] of Object.entries(themes)) {
          try {
            const validatedTheme = validateThemeConfig(themeConfig)
            customThemes.value[name] = validatedTheme
          } catch (err) {
            console.warn(`导入主题 "${name}" 失败:`, err)
          }
        }
      } else {
        throw new Error('无效的主题文件格式')
      }

      notifyListeners('import', { data })
      
    } catch (err) {
      error.value = err.message || '导入主题失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 重置主题设置
   */
  const resetTheme = () => {
    currentThemeName.value = 'default'
    customThemes.value = {}
    themeSettings.value = {
      enableSystemTheme: false,
      followSystemColor: false,
      autoSwitchTheme: false,
      themeTransitionDuration: 300
    }
    updateThemeVariables('default')
    notifyListeners('reset', {})
  }

  /**
   * 工具函数
   */
  const adjustColor = (color, amount) => {
    const num = parseInt(color.slice(1), 16)
    const r = Math.max(0, Math.min(255, (num >> 16) + amount))
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount))
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const notifyListeners = (event, data) => {
    listeners.forEach(listener => {
      try {
        listener(event, data)
      } catch (err) {
        console.warn('主题监听器执行失败:', err)
      }
    })
  }

  /**
   * 监听主题事件
   */
  const onThemeChange = (listener) => {
    listeners.add(listener)
    
    // 返回取消监听的函数
    return () => {
      listeners.delete(listener)
    }
  }

  /**
   * 检测系统主题
   */
  const detectSystemTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      return darkModeQuery.matches ? 'dark' : 'light'
    }
    
    return 'light'
  }

  /**
   * 设置系统主题跟随
   */
  const enableSystemThemeFollow = (enable = true) => {
    themeSettings.value.enableSystemTheme = enable
    
    if (enable) {
      const systemTheme = detectSystemTheme()
      setTheme(systemTheme)
      
      // 监听系统主题变化
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      darkModeQuery.addEventListener('change', (e) => {
        setTheme(e.matches ? 'dark' : 'light')
      })
    }
  }

  // 计算属性
  const isDarkMode = computed(() => {
    return currentTheme.value?.mode === 'dark'
  })

  const themeColors = computed(() => {
    return {
      primary: currentTheme.value?.primaryColor || '#409EFF',
      background: currentTheme.value?.backgroundColor || '#ffffff',
      text: currentTheme.value?.textColor || '#303133',
      border: currentTheme.value?.borderColor || '#dcdfe6',
      success: currentTheme.value?.successColor || '#67C23A',
      warning: currentTheme.value?.warningColor || '#E6A23C',
      danger: currentTheme.value?.dangerColor || '#F56C6C',
      info: currentTheme.value?.infoColor || '#909399'
    }
  })

  const themeConfig = computed(() => ({
    name: currentThemeName.value,
    theme: currentTheme.value,
    colors: themeColors.value,
    settings: themeSettings.value,
    isCustom: !!customThemes.value[currentThemeName.value],
    availableThemes: getAvailableThemes(),
    customThemes: Object.entries(customThemes.value)
  }))

  // 生命周期钩子
  onMounted(() => {
    // 初始化当前主题
    const theme = getThemeByName(currentThemeName.value)
    currentTheme.value = theme
    
    // 应用主题
    updateThemeVariables(currentThemeName.value)
    
    // 检测系统主题设置
    if (themeSettings.value.enableSystemTheme) {
      enableSystemThemeFollow(true)
    }
  })

  // 监听主题名称变化
  watch(currentThemeName, (newName) => {
    const theme = getThemeByName(newName)
    currentTheme.value = theme
    updateThemeVariables(newName)
  })

  return {
    // 状态
    currentThemeName,
    currentTheme,
    isLoading,
    error,
    isDarkMode,
    themeColors,
    themeConfig,
    
    // 方法
    setTheme,
    createCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    exportTheme,
    importTheme,
    resetTheme,
    getAvailableThemes,
    onThemeChange,
    enableSystemThemeFollow,
    detectSystemTheme
  }
}