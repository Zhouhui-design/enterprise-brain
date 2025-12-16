/**
 * 主题管理系统
 * 
 * 提供完整的主题切换功能，包括：
 * - 多主题支持（亮色、深色、自动等）
 * - 自定义主题创建
 * - 主题预设管理
 * - 动态主题切换
 * - 主题数据持久化
 * - 系统主题检测
 * - CSS变量管理
 * 
 * @author AI Assistant
 * @since 2024-01-01
 */

import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

/**
 * 预定义主题
 */
const PRESET_THEMES = {
  light: {
    name: '亮色主题',
    code: 'light',
    mode: 'light',
    colors: {
      primary: '#409eff',
      success: '#67c23a',
      warning: '#e6a23c',
      danger: '#f56c6c',
      info: '#909399',
      
      background: '#ffffff',
      surface: '#f5f7fa',
      paper: '#ffffff',
      
      text: '#303133',
      textSecondary: '#606266',
      textTertiary: '#909399',
      
      border: '#e4e7ed',
      divider: '#e4e7ed',
      
      shadow: 'rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.5)'
    },
    css: `
      :root {
        --el-bg-color: #ffffff;
        --el-bg-color-page: #f2f3f5;
        --el-bg-color-overlay: #ffffff;
        --el-text-color-primary: #303133;
        --el-text-color-regular: #606266;
        --el-text-color-secondary: #909399;
        --el-text-color-placeholder: #c0c4cc;
        --el-text-color-disabled: #c0c4cc;
        --el-border-color: #dcdfe6;
        --el-border-color-light: #e4e7ed;
        --el-border-color-lighter: #ebeef5;
        --el-border-color-extra-light: #f2f6fc;
        --el-border-color-dark: #dcdfe6;
        --el-border-color-darker: #cdd0d6;
        --el-fill-color: #c0c4cc;
        --el-fill-color-light: #d3d4d6;
        --el-fill-color-lighter: #e5e7eb;
        --el-fill-color-extra-light: #ebeef5;
        --el-fill-color-dark: #a8abb2;
        --el-fill-color-darker: #6c7293;
        --el-fill-color-blank: #ffffff;
        --el-box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
        --el-box-shadow-light: 0 2px 12px 0 rgba(0, 0, 0, .1);
        --el-box-shadow-base: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
        --el-box-shadow-dark: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
        --el-disabled-bg-color: #f5f7fa;
        --el-disabled-text-color: #c0c4cc;
        --el-disabled-border-color: #e4e7ed;
        --el-overlay-color: rgba(255, 255, 255, .9);
        --el-mask-color: rgba(255, 255, 255, .9);
        --el-color-white: #ffffff;
        --el-color-black: #000000;
        --el-color-primary: #409eff;
        --el-color-primary-light-3: #79bbff;
        --el-color-primary-light-5: #a0cfff;
        --el-color-primary-light-7: #c6e2ff;
        --el-color-primary-light-8: #d9ecff;
        --el-color-primary-light-9: #ecf5ff;
        --el-color-primary-dark-2: #337ecc;
        --el-color-success: #67c23a;
        --el-color-success-light-3: #95d475;
        --el-color-success-light-5: #b3e19d;
        --el-color-success-light-7: #d1edc4;
        --el-color-success-light-8: #e1f3d8;
        --el-color-success-light-9: #f0f9eb;
        --el-color-success-dark-2: #529b2e;
        --el-color-warning: #e6a23c;
        --el-color-warning-light-3: #eebe77;
        --el-color-warning-light-5: #f3d19e;
        --el-color-warning-light-7: #f8e6c3;
        --el-color-warning-light-8: #faecd1;
        --el-color-warning-light-9: #fdf6ec;
        --el-color-warning-dark-2: #b88230;
        --el-color-danger: #f56c6c;
        --el-color-danger-light-3: #f78989;
        --el-color-danger-light-5: #fab6b6;
        --el-color-danger-light-7: #fdd2d2;
        --el-color-danger-light-8: #fde2e2;
        --el-color-danger-light-9: #fef0f0;
        --el-color-danger-dark-2: #c45656;
        --el-color-info: #909399;
        --el-color-info-light-3: #b1b3b8;
        --el-color-info-light-5: #c8c9cc;
        --el-color-info-light-7: #dadbde;
        --el-color-info-light-8: #e5e6eb;
        --el-color-info-light-9: #f4f4f5;
        --el-color-info-dark-2: #73767a;
      }
    `
  },
  
  dark: {
    name: '深色主题',
    code: 'dark',
    mode: 'dark',
    colors: {
      primary: '#409eff',
      success: '#67c23a',
      warning: '#e6a23c',
      danger: '#f56c6c',
      info: '#909399',
      
      background: '#1a1a1a',
      surface: '#2d2d2d',
      paper: '#262626',
      
      text: '#ffffff',
      textSecondary: '#d4d4d4',
      textTertiary: '#a8a8a8',
      
      border: '#404040',
      divider: '#404040',
      
      shadow: 'rgba(0, 0, 0, 0.3)',
      overlay: 'rgba(0, 0, 0, 0.8)'
    },
    css: `
      :root {
        --el-bg-color: #1a1a1a;
        --el-bg-color-page: #0a0a0a;
        --el-bg-color-overlay: #1a1a1a;
        --el-text-color-primary: #ffffff;
        --el-text-color-regular: #d4d4d4;
        --el-text-color-secondary: #a8a8a8;
        --el-text-color-placeholder: #6c7293;
        --el-text-color-disabled: #6c7293;
        --el-border-color: #4c4d4f;
        --el-border-color-light: #414243;
        --el-border-color-lighter: #363637;
        --el-border-color-extra-light: #2b2b2c;
        --el-border-color-dark: #58585b;
        --el-border-color-darker: #414243;
        --el-fill-color: #414243;
        --el-fill-color-light: #4c4d4f;
        --el-fill-color-lighter: #58585b;
        --el-fill-color-extra-light: #636366;
        --el-fill-color-dark: #363637;
        --el-fill-color-darker: #2b2b2c;
        --el-fill-color-blank: #1a1a1a;
        --el-box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
        --el-box-shadow-light: 0 2px 12px 0 rgba(0, 0, 0, .1);
        --el-box-shadow-base: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
        --el-box-shadow-dark: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
        --el-disabled-bg-color: #262727;
        --el-disabled-text-color: #6c7293;
        --el-disabled-border-color: #4c4d4f;
        --el-overlay-color: rgba(0, 0, 0, .8);
        --el-mask-color: rgba(255, 255, 255, .9);
        --el-color-white: #ffffff;
        --el-color-black: #000000;
        --el-color-primary: #409eff;
        --el-color-primary-light-3: #337ecc;
        --el-color-primary-light-5: #79bbff;
        --el-color-primary-light-7: #a0cfff;
        --el-color-primary-light-8: #c6e2ff;
        --el-color-primary-light-9: #d9ecff;
        --el-color-primary-dark-2: #66b1ff;
        --el-color-success: #67c23a;
        --el-color-success-light-3: #529b2e;
        --el-color-success-light-5: #95d475;
        --el-color-success-light-7: #b3e19d;
        --el-color-success-light-8: #d1edc4;
        --el-color-success-light-9: #f0f9eb;
        --el-color-success-dark-2: #85ce61;
        --el-color-warning: #e6a23c;
        --el-color-warning-light-3: #b88230;
        --el-color-warning-light-5: #eebe77;
        --el-color-warning-light-7: #f3d19e;
        --el-color-warning-light-8: #f8e6c3;
        --el-color-warning-light-9: #fdf6ec;
        --el-color-warning-dark-2: #ebb563;
        --el-color-danger: #f56c6c;
        --el-color-danger-light-3: #c45656;
        --el-color-danger-light-5: #f78989;
        --el-color-danger-light-7: #fdd2d2;
        --el-color-danger-light-8: #fde2e2;
        --el-color-danger-light-9: #fef0f0;
        --el-color-danger-dark-2: #f19898;
        --el-color-info: #909399;
        --el-color-info-light-3: #73767a;
        --el-color-info-light-5: #b1b3b8;
        --el-color-info-light-7: #c8c9cc;
        --el-color-info-light-8: #dadbde;
        --el-color-info-light-9: #f4f4f5;
        --el-color-info-dark-2: #a6a9ad;
      }
    `
  },
  
  blue: {
    name: '蓝色主题',
    code: 'blue',
    mode: 'light',
    colors: {
      primary: '#1890ff',
      background: '#f0f8ff',
      surface: '#e6f7ff',
      paper: '#ffffff'
    },
    css: `
      :root {
        --el-color-primary: #1890ff;
        --el-bg-color: #f0f8ff;
        --el-bg-color-page: #ffffff;
      }
    `
  },
  
  purple: {
    name: '紫色主题',
    code: 'purple',
    mode: 'light',
    colors: {
      primary: '#722ed1',
      background: '#f9f0ff',
      surface: '#f3e8ff',
      paper: '#ffffff'
    },
    css: `
      :root {
        --el-color-primary: #722ed1;
        --el-bg-color: #f9f0ff;
        --el-bg-color-page: #ffffff;
      }
    `
  }
}

/**
 * 主题管理器类
 */
export class ThemeManager {
  constructor() {
    // 当前主题
    this.currentTheme = ref('light')
    
    // 自定义主题
    this.customThemes = reactive(new Map())
    
    // 系统主题检测
    this.systemTheme = 'light'
    
    // 主题变化监听器
    this.themeChangeListeners = new Set()
    
    // 自动切换设置
    this.autoSwitch = ref(false)
    
    // 时间段设置
    this.timeSettings = reactive({
      dayStart: 6,  // 6:00
      dayEnd: 18    // 18:00
    })
    
    this.initializeThemeManager()
  }

  /**
   * 初始化主题管理器
   */
  initializeThemeManager() {
    // 检测系统主题
    this.detectSystemTheme()
    
    // 加载用户设置
    this.loadUserSettings()
    
    // 设置主题
    this.applyTheme(this.currentTheme.value)
    
    // 设置系统主题监听
    this.setupSystemThemeListener()
    
    // 设置时间监听
    this.setupTimeBasedSwitching()
    
    console.log('主题管理器初始化完成')
  }

  /**
   * 检测系统主题
   */
  detectSystemTheme() {
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      this.systemTheme = darkModeQuery.matches ? 'dark' : 'light'
    }
  }

  /**
   * 设置系统主题监听
   */
  setupSystemThemeListener() {
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      darkModeQuery.addEventListener('change', (e) => {
        this.systemTheme = e.matches ? 'dark' : 'light'
        
        // 如果启用了自动切换，应用系统主题
        if (this.autoSwitch.value && this.currentTheme.value === 'auto') {
          this.applyTheme(this.systemTheme)
        }
      })
    }
  }

  /**
   * 设置基于时间的主题切换
   */
  setupTimeBasedSwitching() {
    const checkTime = () => {
      if (!this.autoSwitch.value) return
      
      const now = new Date()
      const currentHour = now.getHours()
      
      let targetTheme
      
      if (currentHour >= this.timeSettings.dayStart && 
          currentHour < this.timeSettings.dayEnd) {
        targetTheme = 'light'
      } else {
        targetTheme = 'dark'
      }
      
      if (targetTheme !== this.currentTheme.value) {
        this.applyTheme(targetTheme)
      }
    }
    
    // 每分钟检查一次
    setInterval(checkTime, 60000)
    
    // 立即检查一次
    checkTime()
  }

  /**
   * 切换主题
   */
  switchTheme(themeCode) {
    let targetTheme = themeCode
    
    // 处理自动主题
    if (themeCode === 'auto') {
      this.autoSwitch.value = true
      targetTheme = this.systemTheme
    } else {
      this.autoSwitch.value = false
    }
    
    // 验证主题存在
    if (!this.isThemeAvailable(targetTheme)) {
      console.warn(`主题 ${targetTheme} 不存在`)
      return false
    }
    
    this.applyTheme(targetTheme)
    this.saveUserSettings()
    
    // 触发主题变化事件
    this.notifyThemeChange(targetTheme)
    
    return true
  }

  /**
   * 应用主题
   */
  applyTheme(themeCode) {
    const theme = this.getTheme(themeCode)
    
    if (!theme) {
      console.error(`主题 ${themeCode} 不存在`)
      return
    }
    
    // 更新当前主题
    this.currentTheme.value = themeCode
    
    // 应用CSS变量
    this.applyCSSVariables(theme)
    
    // 应用CSS类
    this.applyThemeClasses(theme)
    
    // 更新meta标签
    this.updateMetaTags(theme)
  }

  /**
   * 应用CSS变量
   */
  applyCSSVariables(theme) {
    const root = document.documentElement
    
    if (theme.css) {
      // 如果有预设CSS，直接应用
      this.injectCSS(theme.css)
    } else {
      // 应用颜色变量
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value)
      })
    }
  }

  /**
   * 应用主题类
   */
  applyThemeClasses(theme) {
    const root = document.documentElement
    
    // 移除所有主题类
    Object.keys(PRESET_THEMES).forEach(code => {
      root.classList.remove(`theme-${code}`)
    })
    
    // 移除模式类
    root.classList.remove('theme-light', 'theme-dark')
    
    // 添加当前主题类
    root.classList.add(`theme-${theme.code}`)
    root.classList.add(`theme-${theme.mode}`)
  }

  /**
   * 更新meta标签
   */
  updateMetaTags(theme) {
    // 更新主题色
    let themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta')
      themeColorMeta.name = 'theme-color'
      document.head.appendChild(themeColorMeta)
    }
    
    themeColorMeta.content = theme.colors.primary
  }

  /**
   * 注入CSS
   */
  injectCSS(css) {
    // 移除现有的主题CSS
    const existingStyle = document.getElementById('theme-css')
    if (existingStyle) {
      existingStyle.remove()
    }
    
    // 创建新的样式标签
    const style = document.createElement('style')
    style.id = 'theme-css'
    style.textContent = css
    document.head.appendChild(style)
  }

  /**
   * 获取主题
   */
  getTheme(themeCode) {
    return PRESET_THEMES[themeCode] || this.customThemes.get(themeCode)
  }

  /**
   * 获取所有主题
   */
  getAllThemes() {
    const themes = { ...PRESET_THEMES }
    this.customThemes.forEach((theme, code) => {
      themes[code] = theme
    })
    return themes
  }

  /**
   * 创建自定义主题
   */
  createCustomTheme(themeData) {
    const {
      name,
      code,
      mode = 'light',
      colors,
      css = null
    } = themeData
    
    if (!name || !code) {
      throw new Error('主题名称和代码不能为空')
    }
    
    // 验证代码唯一性
    if (this.isThemeAvailable(code)) {
      throw new Error(`主题代码 ${code} 已存在`)
    }
    
    const theme = {
      name,
      code,
      mode,
      colors: this.validateThemeColors(colors),
      css: css || this.generateCSS(colors, mode),
      custom: true,
      createdAt: new Date().toISOString()
    }
    
    this.customThemes.set(code, theme)
    this.saveUserSettings()
    
    return theme
  }

  /**
   * 更新自定义主题
   */
  updateCustomTheme(code, updates) {
    const existingTheme = this.customThemes.get(code)
    if (!existingTheme) {
      throw new Error(`主题 ${code} 不存在`)
    }
    
    const updatedTheme = {
      ...existingTheme,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    // 如果更新了颜色，重新生成CSS
    if (updates.colors) {
      updatedTheme.colors = this.validateThemeColors(updates.colors)
      updatedTheme.css = this.generateCSS(updatedTheme.colors, updatedTheme.mode)
    }
    
    this.customThemes.set(code, updatedTheme)
    this.saveUserSettings()
    
    // 如果当前是更新主题，重新应用
    if (this.currentTheme.value === code) {
      this.applyTheme(code)
    }
    
    return updatedTheme
  }

  /**
   * 删除自定义主题
   */
  deleteCustomTheme(code) {
    if (!this.customThemes.has(code)) {
      throw new Error(`主题 ${code} 不存在`)
    }
    
    this.customThemes.delete(code)
    this.saveUserSettings()
    
    // 如果删除的是当前主题，切换到默认主题
    if (this.currentTheme.value === code) {
      this.switchTheme('light')
    }
  }

  /**
   * 验证主题颜色
   */
  validateThemeColors(colors) {
    const requiredColors = [
      'primary', 'success', 'warning', 'danger', 'info',
      'background', 'surface', 'paper',
      'text', 'textSecondary', 'textTertiary',
      'border', 'divider'
    ]
    
    const validatedColors = { ...colors }
    
    // 补充缺失的颜色
    requiredColors.forEach(colorKey => {
      if (!validatedColors[colorKey]) {
        validatedColors[colorKey] = this.getDefaultColor(colorKey, colors.primary)
      }
    })
    
    return validatedColors
  }

  /**
   * 获取默认颜色
   */
  getDefaultColor(colorKey, primaryColor) {
    const defaults = {
      success: '#67c23a',
      warning: '#e6a23c',
      danger: '#f56c6c',
      info: '#909399',
      background: '#ffffff',
      surface: '#f5f7fa',
      paper: '#ffffff',
      text: '#303133',
      textSecondary: '#606266',
      textTertiary: '#909399',
      border: '#e4e7ed',
      divider: '#e4e7ed',
      shadow: 'rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.5)'
    }
    
    return defaults[colorKey] || primaryColor
  }

  /**
   * 生成CSS
   */
  generateCSS(colors, mode) {
    const css = `
      :root {
        ${Object.entries(colors).map(([key, value]) => 
          `--theme-${key}: ${value};`
        ).join('\n        ')}
        
        /* 基于主题模式的样式调整 */
        ${mode === 'dark' ? this.generateDarkModeStyles(colors) : this.generateLightModeStyles(colors)}
      }
    `
    
    return css
  }

  /**
   * 生成深色模式样式
   */
  generateDarkModeStyles(colors) {
    return `
      /* 深色模式特定样式 */
      .theme-dark {
        --el-bg-color: ${colors.background};
        --el-text-color-primary: ${colors.text};
        --el-border-color: ${colors.border};
        --el-box-shadow: ${colors.shadow};
      }
      
      /* 滚动条样式 */
      .theme-dark ::-webkit-scrollbar {
        background: ${colors.border};
      }
      
      .theme-dark ::-webkit-scrollbar-thumb {
        background: ${colors.textSecondary};
      }
    `
  }

  /**
   * 生成亮色模式样式
   */
  generateLightModeStyles(colors) {
    return `
      /* 亮色模式特定样式 */
      .theme-light {
        --el-bg-color: ${colors.background};
        --el-text-color-primary: ${colors.text};
        --el-border-color: ${colors.border};
        --el-box-shadow: ${colors.shadow};
      }
      
      /* 滚动条样式 */
      .theme-light ::-webkit-scrollbar {
        background: ${colors.border};
      }
      
      .theme-light ::-webkit-scrollbar-thumb {
        background: ${colors.textSecondary};
      }
    `
  }

  /**
   * 检查主题是否可用
   */
  isThemeAvailable(themeCode) {
    return themeCode in PRESET_THEMES || this.customThemes.has(themeCode)
  }

  /**
   * 导出主题
   */
  exportTheme(themeCode) {
    const theme = this.getTheme(themeCode)
    if (!theme) {
      throw new Error(`主题 ${themeCode} 不存在`)
    }
    
    return JSON.stringify(theme, null, 2)
  }

  /**
   * 导入主题
   */
  importTheme(themeJson) {
    try {
      const themeData = JSON.parse(themeJson)
      
      if (themeData.custom) {
        // 自定义主题，直接添加
        this.customThemes.set(themeData.code, themeData)
      } else {
        // 预设主题，更新
        PRESET_THEMES[themeData.code] = themeData
      }
      
      this.saveUserSettings()
      
      return themeData
    } catch (error) {
      throw new Error('主题格式无效：' + error.message)
    }
  }

  /**
   * 保存用户设置
   */
  saveUserSettings() {
    const settings = {
      currentTheme: this.currentTheme.value,
      autoSwitch: this.autoSwitch.value,
      timeSettings: this.timeSettings,
      customThemes: Array.from(this.customThemes.entries()).map(([code, theme]) => ({
        code,
        theme: { ...theme, css: undefined } // 不保存CSS，可以重新生成
      }))
    }
    
    try {
      localStorage.setItem('theme-settings', JSON.stringify(settings))
    } catch (error) {
      console.error('保存主题设置失败:', error)
    }
  }

  /**
   * 加载用户设置
   */
  loadUserSettings() {
    try {
      const settings = localStorage.getItem('theme-settings')
      if (settings) {
        const parsed = JSON.parse(settings)
        
        // 恢复自定义主题
        if (parsed.customThemes) {
          parsed.customThemes.forEach(({ code, theme }) => {
            theme.css = this.generateCSS(theme.colors, theme.mode)
            this.customThemes.set(code, theme)
          })
        }
        
        // 恢复设置
        this.currentTheme.value = parsed.currentTheme || 'light'
        this.autoSwitch.value = parsed.autoSwitch || false
        Object.assign(this.timeSettings, parsed.timeSettings || {})
      }
    } catch (error) {
      console.error('加载主题设置失败:', error)
    }
  }

  /**
   * 通知主题变化
   */
  notifyThemeChange(themeCode) {
    const theme = this.getTheme(themeCode)
    
    this.themeChangeListeners.forEach(listener => {
      try {
        listener(themeCode, theme)
      } catch (error) {
        console.error('主题变化监听器执行失败:', error)
      }
    })
  }

  /**
   * 添加主题变化监听器
   */
  addThemeChangeListener(listener) {
    this.themeChangeListeners.add(listener)
  }

  /**
   * 移除主题变化监听器
   */
  removeThemeChangeListener(listener) {
    this.themeChangeListeners.delete(listener)
  }

  /**
   * 获取主题预览
   */
  getThemePreview(themeCode) {
    const theme = this.getTheme(themeCode)
    if (!theme) {
      return null
    }
    
    return {
      code: theme.code,
      name: theme.name,
      mode: theme.mode,
      preview: {
        primary: theme.colors.primary,
        background: theme.colors.background,
        surface: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border
      }
    }
  }

  /**
   * 重置为默认设置
   */
  resetToDefault() {
    this.currentTheme.value = 'light'
    this.autoSwitch.value = false
    Object.assign(this.timeSettings, {
      dayStart: 6,
      dayEnd: 18
    })
    
    this.saveUserSettings()
    this.switchTheme('light')
  }

  /**
   * 获取主题统计
   */
  getThemeStats() {
    const totalThemes = Object.keys(PRESET_THEMES).length + this.customThemes.size
    const presetCount = Object.keys(PRESET_THEMES).length
    const customCount = this.customThemes.size
    
    return {
      total: totalThemes,
      preset: presetCount,
      custom: customCount,
      current: this.currentTheme.value,
      autoSwitch: this.autoSwitch.value,
      systemTheme: this.systemTheme
    }
  }
}

// 创建全局实例
let globalThemeManager = null

/**
 * 获取主题管理器实例
 */
export function getThemeManager() {
  if (!globalThemeManager) {
    globalThemeManager = new ThemeManager()
  }
  return globalThemeManager
}

/**
 * 主题管理组合式函数
 */
export function useTheme() {
  const themeManager = getThemeManager()
  
  onMounted(() => {
    // 组件挂载时确保主题已正确应用
    themeManager.applyTheme(themeManager.currentTheme.value)
  })
  
  const currentTheme = computed(() => {
    const theme = themeManager.getTheme(themeManager.currentTheme.value)
    return theme || PRESET_THEMES.light
  })
  
  const currentThemeCode = computed(() => themeManager.currentTheme.value)
  
  const isDark = computed(() => {
    const theme = themeManager.getTheme(themeManager.currentTheme.value)
    return theme?.mode === 'dark'
  })
  
  const availableThemes = computed(() => themeManager.getAllThemes())
  
  const switchTheme = (themeCode) => {
    return themeManager.switchTheme(themeCode)
  }
  
  const createTheme = (themeData) => {
    return themeManager.createCustomTheme(themeData)
  }
  
  const updateTheme = (code, updates) => {
    return themeManager.updateCustomTheme(code, updates)
  }
  
  const deleteTheme = (code) => {
    return themeManager.deleteCustomTheme(code)
  }
  
  const exportTheme = (code) => {
    return themeManager.exportTheme(code)
  }
  
  const importTheme = (themeJson) => {
    return themeManager.importTheme(themeJson)
  }
  
  const resetTheme = () => {
    return themeManager.resetToDefault()
  }
  
  const getThemePreview = (code) => {
    return themeManager.getThemePreview(code)
  }
  
  const setAutoSwitch = (enabled) => {
    themeManager.autoSwitch.value = enabled
    if (enabled) {
      themeManager.switchTheme('auto')
    }
    return themeManager.autoSwitch.value
  }
  
  return {
    // 响应式数据
    currentTheme,
    currentThemeCode,
    isDark,
    availableThemes,
    
    // 方法
    switchTheme,
    createTheme,
    updateTheme,
    deleteTheme,
    exportTheme,
    importTheme,
    resetTheme,
    getThemePreview,
    setAutoSwitch,
    
    // 管理器实例
    manager: themeManager
  }
}

export default ThemeManager