// 主题工具函数

import { THEME_PRESETS } from '../constants/themeConstants'

/**
 * 颜色工具函数
 */
export const colorUtils = {
  // 十六进制转RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  },

  // RGB转十六进制
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  },

  // 获取颜色的亮度
  getLuminance(hex) {
    const rgb = this.hexToRgb(hex)
    if (!rgb) return 0

    const { r, g, b } = rgb
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  },

  // 判断颜色是深色还是浅色
  isLight(hex) {
    return this.getLuminance(hex) > 0.179
  },

  // 生成颜色的变体
  generateVariants(hex) {
    const rgb = this.hexToRgb(hex)
    if (!rgb) return {}

    const variants = {}
    
    // 生成更亮的颜色
    variants.light = this.rgbToHex(
      Math.min(255, rgb.r + 30),
      Math.min(255, rgb.g + 30),
      Math.min(255, rgb.b + 30)
    )

    // 生成更暗的颜色
    variants.dark = this.rgbToHex(
      Math.max(0, rgb.r - 30),
      Math.max(0, rgb.g - 30),
      Math.max(0, rgb.b - 30)
    )

    // 生成更柔和的颜色
    variants.soft = this.rgbToHex(
      Math.min(255, rgb.r + 50),
      Math.min(255, rgb.g + 50),
      Math.min(255, rgb.b + 50)
    )

    return variants
  },

  // 生成渐变色
  generateGradient(hex, direction = 'to right') {
    const variants = this.generateVariants(hex)
    return {
      background: `linear-gradient(${direction}, ${hex}, ${variants.dark})`,
      colors: [hex, variants.dark]
    }
  }
}

/**
 * CSS变量操作工具
 */
export const cssUtils = {
  // 设置CSS变量
  setCSSVariable(name, value, element = document.documentElement) {
    element.style.setProperty(`--${name}`, value)
  },

  // 获取CSS变量
  getCSSVariable(name, element = document.documentElement) {
    return getComputedStyle(element).getPropertyValue(`--${name}`).trim()
  },

  // 批量设置CSS变量
  setCSSVariables(variables, element = document.documentElement) {
    Object.entries(variables).forEach(([name, value]) => {
      this.setCSSVariable(name, value, element)
    })
  },

  // 生成主题CSS变量
  generateThemeCSSVariables(theme, prefix = 'theme') {
    const variables = {}
    
    Object.entries(theme).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('#')) {
        variables[`${prefix}-${key}`] = value
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (typeof subValue === 'string') {
            variables[`${prefix}-${key}-${subKey}`] = subValue
          }
        })
      }
    })

    return variables
  }
}

/**
 * 主题验证工具
 */
export const validationUtils = {
  // 验证颜色值
  isValidColor(color) {
    const s = new Option().style
    s.color = color
    return s.color !== ''
  },

  // 验证主题配置
  validateThemeConfig(config) {
    const errors = []

    // 验证必需字段
    if (!config.name || typeof config.name !== 'string') {
      errors.push('主题名称是必需的')
    }

    if (!config.primary || !this.isValidColor(config.primary)) {
      errors.push('无效的主色调')
    }

    // 验证颜色格式
    const colorKeys = ['primary', 'success', 'warning', 'error', 'info']
    colorKeys.forEach(key => {
      if (config[key] && !this.isValidColor(config[key])) {
        errors.push(`无效的${key}颜色`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // 验证布局配置
  validateLayoutConfig(config) {
    const errors = []

    if (!config.sidebarPosition) {
      errors.push('侧边栏位置配置缺失')
    }

    if (!config.contentWidth) {
      errors.push('内容宽度配置缺失')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * 主题转换工具
 */
export const transformUtils = {
  // 将主题配置转换为CSS变量
  themeToCSSVariables(theme) {
    const cssVars = {}

    // 颜色变量
    Object.entries(theme).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('#')) {
        cssVars[`color-${key}`] = value
      }
    })

    return cssVars
  },

  // 将CSS变量转换为主题配置
  cssVariablesToTheme(cssVars) {
    const theme = {}

    Object.entries(cssVars).forEach(([key, value]) => {
      if (key.startsWith('color-') && value.startsWith('#')) {
        const colorKey = key.replace('color-', '')
        theme[colorKey] = value
      }
    })

    return theme
  },

  // 合并主题配置
  mergeThemes(baseTheme, overrideTheme) {
    return {
      ...baseTheme,
      ...overrideTheme,
      customColors: {
        ...baseTheme.customColors,
        ...overrideTheme.customColors
      },
      layout: {
        ...baseTheme.layout,
        ...overrideTheme.layout
      },
      components: {
        ...baseTheme.components,
        ...overrideTheme.components
      }
    }
  }
}

/**
 * 本地存储工具
 */
export const storageUtils = {
  // 保存主题配置
  saveThemeConfig(config, key = 'theme-config') {
    try {
      localStorage.setItem(key, JSON.stringify(config))
      return true
    } catch (error) {
      console.error('保存主题配置失败:', error)
      return false
    }
  },

  // 加载主题配置
  loadThemeConfig(key = 'theme-config') {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('加载主题配置失败:', error)
      return null
    }
  },

  // 删除主题配置
  removeThemeConfig(key = 'theme-config') {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('删除主题配置失败:', error)
      return false
    }
  },

  // 清除所有主题相关数据
  clearThemeData() {
    const keys = ['theme-config', 'user-theme-preferences', 'custom-themes']
    keys.forEach(key => this.removeThemeConfig(key))
  }
}

/**
 * 响应式工具
 */
export const responsiveUtils = {
  // 获取当前断点
  getCurrentBreakpoint() {
    const width = window.innerWidth
    
    if (width < 480) return 'xs'
    if (width < 576) return 'sm'
    if (width < 768) return 'md'
    if (width < 992) return 'lg'
    if (width < 1200) return 'xl'
    return 'xxl'
  },

  // 检查是否为移动设备
  isMobile() {
    return window.innerWidth < 768
  },

  // 检查是否为平板设备
  isTablet() {
    const width = window.innerWidth
    return width >= 768 && width < 992
  },

  // 检查是否为桌面设备
  isDesktop() {
    return window.innerWidth >= 992
  },

  // 监听窗口大小变化
  onResize(callback) {
    if (typeof callback === 'function') {
      window.addEventListener('resize', callback)
      return () => window.removeEventListener('resize', callback)
    }
  }
}

/**
 * 动画工具
 */
export const animationUtils = {
  // 创建过渡动画
  createTransition(properties = 'all', duration = 300, easing = 'ease-in-out') {
    return `${properties} ${duration}ms ${easing}`
  },

  // 创建关键帧动画
  createKeyframes(name, keyframes) {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes ${name} {
        ${Object.entries(keyframes).map(([percent, styles]) => 
          `${percent} { ${Object.entries(styles).map(([prop, value]) => 
            `${prop}: ${value}`
          ).join('; ')} }`
        ).join('\n')}
      }
    `
    document.head.appendChild(style)
    return style
  },

  // 添加动画类
  addAnimationClass(element, className, duration = 300) {
    element.classList.add(className)
    setTimeout(() => {
      element.classList.remove(className)
    }, duration)
  }
}