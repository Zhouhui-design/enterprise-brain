import request from '@/utils/request'
import { storageService } from './initialization-service'

// 主题管理服务
export const themeService = {
  // 获取主题列表
  getThemes: async (params = {}) => {
    try {
      return await request.get('/theme/list', params)
    } catch (error) {
      console.error('获取主题列表失败:', error)
      return []
    }
  },

  // 获取当前主题
  getCurrentTheme: async () => {
    try {
      const theme = await request.get('/theme/current')
      storageService.setItem('current-theme', theme)
      return theme
    } catch (error) {
      console.error('获取当前主题失败:', error)
      return storageService.getItem('current-theme', { name: 'default' })
    }
  },

  // 应用主题
  applyTheme: async (themeName, customization = {}) => {
    try {
      const result = await request.post('/theme/apply', { 
        themeName, 
        customization 
      })
      
      // 保存到本地存储
      storageService.setItem('current-theme', { name: themeName, ...customization })
      
      // 应用CSS变量
      this.applyThemeToDOM(result)
      
      return result
    } catch (error) {
      console.error('应用主题失败:', error)
      throw error
    }
  },

  // 保存主题配置
  saveThemeConfig: async (config) => {
    try {
      const result = await request.post('/theme/save-config', config)
      storageService.setItem('theme-config', config)
      return result
    } catch (error) {
      console.error('保存主题配置失败:', error)
      throw error
    }
  },

  // 获取主题配置
  getThemeConfig: async () => {
    try {
      const config = await request.get('/theme/config')
      storageService.setItem('theme-config', config)
      return config
    } catch (error) {
      console.error('获取主题配置失败:', error)
      return storageService.getItem('theme-config', {})
    }
  },

  // 创建自定义主题
  createCustomTheme: async (themeData) => {
    try {
      return await request.post('/theme/custom', themeData)
    } catch (error) {
      console.error('创建自定义主题失败:', error)
      throw error
    }
  },

  // 删除自定义主题
  deleteCustomTheme: async (themeName) => {
    try {
      return await request.delete(`/theme/custom/${themeName}`)
    } catch (error) {
      console.error('删除自定义主题失败:', error)
      throw error
    }
  },

  // 导出主题
  exportTheme: async (themeName, format = 'json') => {
    try {
      return await request.download(`/theme/export/${themeName}`, { format }, `theme-${themeName}.${format}`)
    } catch (error) {
      console.error('导出主题失败:', error)
      throw error
    }
  },

  // 导入主题
  importTheme: async (themeFile) => {
    try {
      return await request.upload('/theme/import', themeFile)
    } catch (error) {
      console.error('导入主题失败:', error)
      throw error
    }
  },

  // 应用主题到DOM
  applyThemeToDOM: (themeConfig) => {
    const root = document.documentElement
    
    // 应用颜色变量
    if (themeConfig.colors) {
      Object.entries(themeConfig.colors).forEach(([key, value]) => {
        root.style.setProperty(`--theme-color-${key}`, value)
      })
    }

    // 应用字体变量
    if (themeConfig.fonts) {
      Object.entries(themeConfig.fonts).forEach(([key, value]) => {
        root.style.setProperty(`--theme-font-${key}`, value)
      })
    }

    // 应用间距变量
    if (themeConfig.spacing) {
      Object.entries(themeConfig.spacing).forEach(([key, value]) => {
        root.style.setProperty(`--theme-spacing-${key}`, value)
      })
    }

    // 应用阴影变量
    if (themeConfig.shadows) {
      Object.entries(themeConfig.shadows).forEach(([key, value]) => {
        root.style.setProperty(`--theme-shadow-${key}`, value)
      })
    }

    // 应用边框变量
    if (themeConfig.borders) {
      Object.entries(themeConfig.borders).forEach(([key, value]) => {
        root.style.setProperty(`--theme-border-${key}`, value)
      })
    }
  },

  // 重置主题
  resetTheme: async () => {
    try {
      await request.post('/theme/reset')
      storageService.removeItem('current-theme')
      storageService.removeItem('theme-config')
      
      // 重置CSS变量
      const root = document.documentElement
      const style = root.getAttribute('style') || ''
      const themeVars = style.split(';').filter(s => !s.includes('--theme-'))
      root.setAttribute('style', themeVars.join(';'))
      
      return true
    } catch (error) {
      console.error('重置主题失败:', error)
      return false
    }
  },

  // 获取主题预设
  getThemePresets: () => {
    return {
      default: {
        name: '默认主题',
        colors: {
          primary: '#1890ff',
          success: '#52c41a',
          warning: '#faad14',
          error: '#f5222d',
          info: '#1890ff'
        }
      },
      dark: {
        name: '深色主题',
        colors: {
          primary: '#177ddc',
          success: '#49aa19',
          warning: '#d89614',
          error: '#d32029',
          info: '#177ddc'
        }
      },
      light: {
        name: '浅色主题',
        colors: {
          primary: '#2f54eb',
          success: '#52c41a',
          warning: '#faad14',
          error: '#f5222d',
          info: '#1890ff'
        }
      }
    }
  },

  // 初始化主题
  initTheme: async () => {
    try {
      // 从本地存储获取主题配置
      let currentTheme = storageService.getItem('current-theme')
      
      if (!currentTheme) {
        // 如果本地没有，则从服务器获取
        currentTheme = await themeService.getCurrentTheme()
      }
      
      // 应用主题
      if (currentTheme && currentTheme.name) {
        await themeService.applyTheme(currentTheme.name, currentTheme)
      } else {
        // 默认主题
        await themeService.applyTheme('default')
      }
      
      return true
    } catch (error) {
      console.error('主题初始化失败:', error)
      // 应用默认主题
      await themeService.applyTheme('default')
      return false
    }
  },

  // 主题切换监听器
  addThemeChangeListener: (callback) => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'style') {
          const target = mutation.target
          if (target === document.documentElement) {
            callback()
          }
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    })

    return observer
  }
}

// 主题工具函数
export const themeUtils = {
  // 生成颜色变体
  generateColorVariants: (baseColor) => {
    const colors = {}
    
    // 这里可以添加更复杂的颜色生成逻辑
    colors.primary = baseColor
    colors.light = this.lightenColor(baseColor, 20)
    colors.dark = this.darkenColor(baseColor, 20)
    colors.soft = this.lightenColor(baseColor, 40)
    
    return colors
  },

  // 颜色变浅
  lightenColor: (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1)
  },

  // 颜色变深
  darkenColor: (color, percent) => {
    return this.lightenColor(color, -percent)
  },

  // 获取对比色
  getContrastColor: (bgColor) => {
    const color = bgColor.replace('#', '')
    const r = parseInt(color.substr(0, 2), 16)
    const g = parseInt(color.substr(2, 2), 16)
    const b = parseInt(color.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    
    return brightness > 128 ? '#000000' : '#ffffff'
  },

  // 验证颜色格式
  validateColor: (color) => {
    const s = new Option().style
    s.color = color
    return s.color !== ''
  }
}