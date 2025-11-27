<template>
  <div class="theme-provider" :class="themeClasses" :style="customStyles">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref, watchEffect, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'

interface Theme {
  name: string
  mode: 'light' | 'dark'
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  borderColor: string
  shadowColor: string
  successColor: string
  warningColor: string
  dangerColor: string
  infoColor: string
}

interface CustomTheme extends Theme {
  customProperties: Record<string, string>
  layout: {
    sidebarWidth: number
    headerHeight: number
    contentPadding: number
  }
  components: {
    borderRadius: number
    fontSize: string
    fontFamily: string
  }
}

const props = defineProps<{
  defaultTheme?: string
  enableSystemTheme?: boolean
  storageKey?: string
}>()

const emit = defineEmits<{
  themeChange: [theme: Theme]
  modeChange: [mode: 'light' | 'dark']
}>()

const defaultThemes: Record<string, Theme> = {
  default: {
    name: 'default',
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
    name: 'dark',
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
  blue: {
    name: 'blue',
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
    name: 'green',
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

const storageKey = props.storageKey || 'app-theme'
const currentThemeName = useStorage(storageKey, props.defaultTheme || 'default')
const customThemes = useStorage(`${storageKey}-custom`, {} as Record<string, CustomTheme>)
const isSystemDark = ref(false)

const currentTheme = computed<CustomTheme>(() => {
  const themeName = currentThemeName.value
  const baseTheme = defaultThemes[themeName] || defaultThemes.default
  const customTheme = customThemes.value[themeName]
  
  return {
    ...baseTheme,
    customProperties: customTheme?.customProperties || {},
    layout: customTheme?.layout || {
      sidebarWidth: 250,
      headerHeight: 60,
      contentPadding: 20
    },
    components: customTheme?.components || {
      borderRadius: 4,
      fontSize: '14px',
      fontFamily: 'Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Arial, sans-serif'
    }
  }
})

const themeClasses = computed(() => [
  `theme-${currentTheme.value.name}`,
  `theme-mode-${currentTheme.value.mode}`,
  'theme-provider'
])

const customStyles = computed(() => {
  const theme = currentTheme.value
  const styles: Record<string, string> = {}
  
  // CSS 变量
  styles['--primary-color'] = theme.primaryColor
  styles['--secondary-color'] = theme.secondaryColor
  styles['--background-color'] = theme.backgroundColor
  styles['--text-color'] = theme.textColor
  styles['--border-color'] = theme.borderColor
  styles['--shadow-color'] = theme.shadowColor
  styles['--success-color'] = theme.successColor
  styles['--warning-color'] = theme.warningColor
  styles['--danger-color'] = theme.dangerColor
  styles['--info-color'] = theme.infoColor
  
  // 布局变量
  styles['--sidebar-width'] = `${theme.layout.sidebarWidth}px`
  styles['--header-height'] = `${theme.layout.headerHeight}px`
  styles['--content-padding'] = `${theme.layout.contentPadding}px`
  
  // 组件变量
  styles['--border-radius'] = `${theme.components.borderRadius}px`
  styles['--font-size'] = theme.components.fontSize
  styles['--font-family'] = theme.components.fontFamily
  
  // 自定义属性
  Object.entries(theme.customProperties).forEach(([key, value]) => {
    styles[`--${key}`] = value
  })
  
  return styles
})

// 监听系统主题变化
const updateSystemTheme = () => {
  if (props.enableSystemTheme && window.matchMedia) {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    isSystemDark.value = darkModeQuery.matches
    
    darkModeQuery.addEventListener('change', (e) => {
      isSystemDark.value = e.matches
      if (props.enableSystemTheme && !currentTheme.value.name.startsWith('dark')) {
        const newTheme = isSystemDark.value ? 'dark' : 'default'
        setTheme(newTheme)
      }
    })
  }
}

const setTheme = (themeName: string, customTheme?: Partial<CustomTheme>) => {
  currentThemeName.value = themeName
  
  if (customTheme) {
    customThemes.value[themeName] = {
      ...defaultThemes[themeName] || defaultThemes.default,
      ...customTheme,
      name: themeName
    } as CustomTheme
  }
  
  emit('themeChange', currentTheme.value)
  emit('modeChange', currentTheme.value.mode)
}

const updateThemeProperty = (property: string, value: string) => {
  const themeName = currentThemeName.value
  if (!customThemes.value[themeName]) {
    customThemes.value[themeName] = {
      ...currentTheme.value,
      name: themeName
    }
  }
  
  customThemes.value[themeName].customProperties[property] = value
}

const resetTheme = (themeName?: string) => {
  if (themeName) {
    delete customThemes.value[themeName]
    if (currentThemeName.value === themeName) {
      currentThemeName.value = 'default'
    }
  } else {
    customThemes.value = {}
    currentThemeName.value = 'default'
  }
}

const getAvailableThemes = () => {
  return Object.keys(defaultThemes)
}

const getCustomThemes = () => {
  return Object.keys(customThemes.value)
}

const exportTheme = (themeName: string) => {
  const theme = customThemes.value[themeName]
  if (theme) {
    const dataStr = JSON.stringify(theme, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${themeName}-theme.json`
    link.click()
    URL.revokeObjectURL(url)
  }
}

const importTheme = (themeFile: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const theme = JSON.parse(e.target?.result as string)
        const themeName = theme.name || `custom-${Date.now()}`
        customThemes.value[themeName] = theme
        setTheme(themeName)
        resolve(theme)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsText(themeFile)
  })
}

// 提供给子组件的主题服务
provide('themeService', {
  theme: currentTheme,
  setTheme,
  updateThemeProperty,
  resetTheme,
  getAvailableThemes,
  getCustomThemes,
  exportTheme,
  importTheme,
  currentThemeName
})

// 监听主题变化
watchEffect(() => {
  document.documentElement.setAttribute('data-theme', currentTheme.value.name)
  document.documentElement.setAttribute('data-mode', currentTheme.value.mode)
})

onMounted(() => {
  updateSystemTheme()
})

defineExpose({
  setTheme,
  updateThemeProperty,
  resetTheme,
  exportTheme,
  importTheme,
  currentTheme
})
</script>

<style scoped>
.theme-provider {
  min-height: 100vh;
  transition: all 0.3s ease;
}

/* 主题过渡动画 */
.theme-mode-dark {
  background-color: var(--background-color);
  color: var(--text-color);
}

.theme-mode-light {
  background-color: var(--background-color);
  color: var(--text-color);
}

/* 全局过渡 */
.theme-provider * {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
</style>