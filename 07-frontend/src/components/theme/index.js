// 主题系统入口文件

// 导出主要组件
export { default as ThemeProvider } from './ThemeProvider.vue'
export { default as ColorPicker } from './ColorPicker.vue'
export { default as ThemeConfig } from './ThemeConfig.vue'
export { default as LayoutCustomizer } from './LayoutCustomizer.vue'

// 导出钩子函数
export { default as useTheme } from './hooks/useTheme.js'
export { default as useCustomization } from './hooks/useCustomization.js'

// 导出常量
export * from './constants/themeConstants.js'

// 导出工具函数
export * from './utils/themeUtils.js'

// 主题插件安装函数
export const ThemePlugin = {
  install(app, options = {}) {
    // 提供全局主题配置
    app.config.globalProperties.$theme = options.defaultTheme || 'default'
    
    // 注册全局组件
    app.component('ThemeProvider', ThemeProvider)
    app.component('ColorPicker', ColorPicker)
    app.component('ThemeConfig', ThemeConfig)
    app.component('LayoutCustomizer', LayoutCustomizer)
    
    // 添加全局混入
    app.mixin({
      beforeCreate() {
        // 为每个组件注入主题相关方法
        if (this.$options.name || this.$options.__name) {
          this.$theme = this.$parent?.$theme || this.$root.$theme
        }
      }
    })
  }
}

// 默认导出
export default {
  ThemeProvider,
  ColorPicker,
  ThemeConfig,
  LayoutCustomizer,
  useTheme,
  useCustomization,
  ThemePlugin
}