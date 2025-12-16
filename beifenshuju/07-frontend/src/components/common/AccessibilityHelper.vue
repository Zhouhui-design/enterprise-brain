<template>
  <div class="accessibility-overlay" v-if="showOverlay">
    <!-- 可访问性控制面板 -->
    <div class="accessibility-panel" :class="{ visible: panelVisible }">
      <div class="panel-header">
        <h3>无障碍设置</h3>
        <el-button 
          type="text" 
          @click="togglePanel"
          class="close-btn"
          :aria-label="accessibilityLabels.close"
        >
          <el-icon><Close /></el-icon>
        </el-button>
      </div>

      <div class="panel-content">
        <!-- 字体大小调整 -->
        <div class="control-group">
          <h4>字体大小</h4>
          <div class="font-size-controls">
            <el-button-group>
              <el-button 
                @click="setFontSize('small')"
                :type="currentFontSize === 'small' ? 'primary' : 'default'"
                size="small"
                :aria-label="accessibilityLabels.fontSizeSmall"
              >
                A-
              </el-button>
              <el-button 
                @click="setFontSize('medium')"
                :type="currentFontSize === 'medium' ? 'primary' : 'default'"
                size="small"
                :aria-label="accessibilityLabels.fontSizeMedium"
              >
                A
              </el-button>
              <el-button 
                @click="setFontSize('large')"
                :type="currentFontSize === 'large' ? 'primary' : 'default'"
                size="small"
                :aria-label="accessibilityLabels.fontSizeLarge"
              >
                A+
              </el-button>
            </el-button-group>
          </div>
        </div>

        <!-- 高对比度模式 -->
        <div class="control-group">
          <h4>视觉辅助</h4>
          <div class="visual-controls">
            <el-switch
              v-model="highContrast"
              @change="toggleHighContrast"
              :active-text="accessibilityLabels.highContrast"
              inactive-text="标准模式"
              :aria-label="accessibilityLabels.highContrast"
            />
            
            <el-switch
              v-model="darkMode"
              @change="toggleDarkMode"
              :active-text="accessibilityLabels.darkMode"
              inactive-text="浅色模式"
              :aria-label="accessibilityLabels.darkMode"
            />
          </div>
        </div>

        <!-- 屏幕阅读器支持 -->
        <div class="control-group">
          <h4>屏幕阅读器</h4>
          <div class="screen-reader-controls">
            <el-switch
              v-model="screenReaderMode"
              @change="toggleScreenReader"
              :active-text="accessibilityLabels.screenReader"
              inactive-text="关闭"
              :aria-label="accessibilityLabels.screenReader"
            />
          </div>
        </div>

        <!-- 键盘导航 -->
        <div class="control-group">
          <h4>键盘导航</h4>
          <div class="keyboard-controls">
            <el-switch
              v-model="keyboardNavigation"
              @change="toggleKeyboardNavigation"
              :active-text="accessibilityLabels.keyboardNavigation"
              inactive-text="关闭"
              :aria-label="accessibilityLabels.keyboardNavigation"
            />
            
            <el-switch
              v-model="focusVisible"
              @change="toggleFocusVisible"
              :active-text="accessibilityLabels.focusVisible"
              inactive-text="关闭"
              :aria-label="accessibilityLabels.focusVisible"
            />
          </div>
        </div>

        <!-- 动画和过渡 -->
        <div class="control-group">
          <h4>动画设置</h4>
          <div class="animation-controls">
            <el-switch
              v-model="reduceMotion"
              @change="toggleReduceMotion"
              :active-text="accessibilityLabels.reduceMotion"
              inactive-text="启用动画"
              :aria-label="accessibilityLabels.reduceMotion"
            />
          </div>
        </div>

        <!-- 颜色盲支持 -->
        <div class="control-group">
          <h4>色盲友好</h4>
          <div class="colorblind-controls">
            <el-select
              v-model="colorBlindMode"
              @change="setColorBlindMode"
              placeholder="选择模式"
              :aria-label="accessibilityLabels.colorBlindMode"
            >
              <el-option label="标准" value="normal" />
              <el-option label="红色盲" value="protanopia" />
              <el-option label="绿色盲" value="deuteranopia" />
              <el-option label="蓝色盲" value="tritanopia" />
              <el-option label="全色盲" value="achromatopsia" />
            </el-select>
          </div>
        </div>

        <!-- 快捷键提示 -->
        <div class="control-group">
          <h4>快捷键</h4>
          <div class="shortcut-list">
            <div
              v-for="shortcut in shortcuts"
              :key="shortcut.key"
              class="shortcut-item"
            >
              <kbd class="shortcut-key">{{ shortcut.key }}</kbd>
              <span class="shortcut-desc">{{ shortcut.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 重置按钮 -->
      <div class="panel-footer">
        <el-button @click="resetToDefault" type="warning" size="small">
          重置为默认
        </el-button>
      </div>
    </div>

    <!-- 浮动触发按钮 -->
    <el-button
      type="primary"
      circle
      class="accessibility-trigger"
      @click="togglePanel"
      :aria-label="accessibilityLabels.openPanel"
      :title="accessibilityLabels.openPanel"
    >
      <el-icon><UniversalAccess /></el-icon>
    </el-button>

    <!-- 屏幕阅读器提示 -->
    <div
      v-if="screenReaderMode"
      class="screen-reader-announcements"
      aria-live="polite"
      aria-atomic="true"
      ref="announcementsRef"
    >
      {{ screenReaderAnnouncement }}
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { 
  Close, 
  UniversalAccess 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

/**
 * 可访问性辅助组件
 * 
 * 提供全面的无障碍功能支持，包括：
 * - 字体大小调整
 * - 高对比度模式
 * - 深色模式
 * - 屏幕阅读器支持
 * - 键盘导航
 * - 动画减少
 * - 色盲友好
 * 
 * @author AI Assistant
 * @since 2024-01-01
 */
export default {
  name: 'AccessibilityHelper',
  components: {
    Close,
    UniversalAccess
  },
  props: {
    // 是否显示覆盖层
    showOverlay: {
      type: Boolean,
      default: true
    },
    // 默认设置
    defaultSettings: {
      type: Object,
      default: () => ({})
    },
    // 语言设置
    locale: {
      type: String,
      default: 'zh-CN'
    }
  },
  emits: [
    'setting-change',
    'font-size-change',
    'theme-change',
    'accessibility-toggle'
  ],
  setup(props, { emit }) {
    // ================ 响应式数据 ================
    
    const panelVisible = ref(false)
    const announcementsRef = ref(null)
    const screenReaderAnnouncement = ref('')

    // 可访问性设置
    const settings = reactive({
      fontSize: 'medium',
      highContrast: false,
      darkMode: false,
      screenReaderMode: false,
      keyboardNavigation: true,
      focusVisible: true,
      reduceMotion: false,
      colorBlindMode: 'normal'
    })

    // 当前设置（响应式）
    const currentFontSize = ref(settings.fontSize)
    const highContrast = ref(settings.highContrast)
    const darkMode = ref(settings.darkMode)
    const screenReaderMode = ref(settings.screenReaderMode)
    const keyboardNavigation = ref(settings.keyboardNavigation)
    const focusVisible = ref(settings.focusVisible)
    const reduceMotion = ref(settings.reduceMotion)
    const colorBlindMode = ref(settings.colorBlindMode)

    // ================ 计算属性 ================
    
    const accessibilityLabels = computed(() => {
      const labels = {
        'zh-CN': {
          openPanel: '打开无障碍设置面板',
          close: '关闭无障碍设置面板',
          fontSizeSmall: '减小字体',
          fontSizeMedium: '标准字体',
          fontSizeLarge: '增大字体',
          highContrast: '高对比度模式',
          darkMode: '深色模式',
          screenReader: '屏幕阅读器模式',
          keyboardNavigation: '键盘导航',
          focusVisible: '焦点可见',
          reduceMotion: '减少动画',
          colorBlindMode: '色盲模式',
          settingsApplied: '无障碍设置已应用',
          settingsReset: '无障碍设置已重置'
        },
        'en-US': {
          openPanel: 'Open accessibility settings panel',
          close: 'Close accessibility settings panel',
          fontSizeSmall: 'Decrease font size',
          fontSizeMedium: 'Normal font size',
          fontSizeLarge: 'Increase font size',
          highContrast: 'High contrast mode',
          darkMode: 'Dark mode',
          screenReader: 'Screen reader mode',
          keyboardNavigation: 'Keyboard navigation',
          focusVisible: 'Focus visible',
          reduceMotion: 'Reduce motion',
          colorBlindMode: 'Color blind mode',
          settingsApplied: 'Accessibility settings applied',
          settingsReset: 'Accessibility settings reset'
        }
      }
      
      return labels[props.locale] || labels['zh-CN']
    })

    const shortcuts = computed(() => [
      { key: 'Alt + A', description: accessibilityLabels.value.openPanel },
      { key: 'Alt + +', description: accessibilityLabels.value.fontSizeLarge },
      { key: 'Alt + -', description: accessibilityLabels.value.fontSizeSmall },
      { key: 'Alt + C', description: accessibilityLabels.value.highContrast },
      { key: 'Alt + D', description: accessibilityLabels.value.darkMode },
      { key: 'Tab', description: '导航到下一个元素' },
      { key: 'Shift + Tab', description: '导航到上一个元素' },
      { key: 'Enter', description: '激活当前元素' },
      { key: 'Space', description: '激活按钮或链接' },
      { key: 'Escape', description: '关闭弹窗或取消操作' }
    ])

    // ================ 方法定义 ================

    /**
     * 切换面板显示状态
     */
    const togglePanel = () => {
      panelVisible.value = !panelVisible.value
      
      // 发出屏幕阅读器公告
      if (screenReaderMode.value) {
        announceToScreenReader(
          panelVisible.value ? 
            accessibilityLabels.value.openPanel : 
            accessibilityLabels.value.close
        )
      }
      
      emit('accessibility-toggle', { panelVisible: panelVisible.value })
    }

    /**
     * 设置字体大小
     */
    const setFontSize = (size) => {
      currentFontSize.value = size
      settings.fontSize = size
      applyFontSize(size)
      
      emit('font-size-change', size)
      emit('setting-change', { fontSize: size })
      
      announceSettingChange('fontSize', size)
    }

    /**
     * 切换高对比度模式
     */
    const toggleHighContrast = (enabled) => {
      highContrast.value = enabled
      settings.highContrast = enabled
      applyHighContrast(enabled)
      
      emit('setting-change', { highContrast: enabled })
      announceSettingChange('highContrast', enabled)
    }

    /**
     * 切换深色模式
     */
    const toggleDarkMode = (enabled) => {
      darkMode.value = enabled
      settings.darkMode = enabled
      applyDarkMode(enabled)
      
      emit('theme-change', { darkMode: enabled })
      emit('setting-change', { darkMode: enabled })
      announceSettingChange('darkMode', enabled)
    }

    /**
     * 切换屏幕阅读器模式
     */
    const toggleScreenReader = (enabled) => {
      screenReaderMode.value = enabled
      settings.screenReaderMode = enabled
      applyScreenReaderMode(enabled)
      
      emit('setting-change', { screenReaderMode: enabled })
      announceSettingChange('screenReader', enabled)
    }

    /**
     * 切换键盘导航
     */
    const toggleKeyboardNavigation = (enabled) => {
      keyboardNavigation.value = enabled
      settings.keyboardNavigation = enabled
      applyKeyboardNavigation(enabled)
      
      emit('setting-change', { keyboardNavigation: enabled })
      announceSettingChange('keyboardNavigation', enabled)
    }

    /**
     * 切换焦点可见性
     */
    const toggleFocusVisible = (enabled) => {
      focusVisible.value = enabled
      settings.focusVisible = enabled
      applyFocusVisible(enabled)
      
      emit('setting-change', { focusVisible: enabled })
      announceSettingChange('focusVisible', enabled)
    }

    /**
     * 切换动画减少
     */
    const toggleReduceMotion = (enabled) => {
      reduceMotion.value = enabled
      settings.reduceMotion = enabled
      applyReduceMotion(enabled)
      
      emit('setting-change', { reduceMotion: enabled })
      announceSettingChange('reduceMotion', enabled)
    }

    /**
     * 设置色盲模式
     */
    const setColorBlindMode = (mode) => {
      colorBlindMode.value = mode
      settings.colorBlindMode = mode
      applyColorBlindMode(mode)
      
      emit('setting-change', { colorBlindMode: mode })
      announceSettingChange('colorBlindMode', mode)
    }

    /**
     * 应用字体大小
     */
    const applyFontSize = (size) => {
      const root = document.documentElement
      const fontSizes = {
        small: '14px',
        medium: '16px',
        large: '18px'
      }
      
      root.style.setProperty('--accessibility-font-size', fontSizes[size])
      
      // 添加字体大小类
      root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large')
      root.classList.add(`font-size-${size}`)
    }

    /**
     * 应用高对比度模式
     */
    const applyHighContrast = (enabled) => {
      const root = document.documentElement
      
      if (enabled) {
        root.classList.add('high-contrast')
        root.style.setProperty('--text-color', '#000000')
        root.style.setProperty('--bg-color', '#ffffff')
        root.style.setProperty('--border-color', '#000000')
      } else {
        root.classList.remove('high-contrast')
        root.style.removeProperty('--text-color')
        root.style.removeProperty('--bg-color')
        root.style.removeProperty('--border-color')
      }
    }

    /**
     * 应用深色模式
     */
    const applyDarkMode = (enabled) => {
      const root = document.documentElement
      
      if (enabled) {
        root.classList.add('dark-mode')
        root.style.setProperty('--text-color', '#ffffff')
        root.style.setProperty('--bg-color', '#1a1a1a')
        root.style.setProperty('--border-color', '#404040')
      } else {
        root.classList.remove('dark-mode')
        root.style.removeProperty('--text-color')
        root.style.removeProperty('--bg-color')
        root.style.removeProperty('--border-color')
      }
    }

    /**
     * 应用屏幕阅读器模式
     */
    const applyScreenReaderMode = (enabled) => {
      const root = document.documentElement
      
      if (enabled) {
        root.classList.add('screen-reader-mode')
        // 为屏幕阅读器添加ARIA标签和语义化标记
        enhanceForScreenReader()
      } else {
        root.classList.remove('screen-reader-mode')
      }
    }

    /**
     * 应用键盘导航
     */
    const applyKeyboardNavigation = (enabled) => {
      const root = document.documentElement
      
      if (enabled) {
        root.classList.add('keyboard-navigation')
        setupKeyboardNavigation()
      } else {
        root.classList.remove('keyboard-navigation')
        removeKeyboardNavigation()
      }
    }

    /**
     * 应用焦点可见性
     */
    const applyFocusVisible = (enabled) => {
      const root = document.documentElement
      
      if (enabled) {
        root.classList.add('focus-visible')
        addFocusStyles()
      } else {
        root.classList.remove('focus-visible')
        removeFocusStyles()
      }
    }

    /**
     * 应用动画减少
     */
    const applyReduceMotion = (enabled) => {
      const root = document.documentElement
      
      if (enabled) {
        root.classList.add('reduce-motion')
        root.style.setProperty('--transition-duration', '0.1s')
      } else {
        root.classList.remove('reduce-motion')
        root.style.removeProperty('--transition-duration')
      }
    }

    /**
     * 应用色盲模式
     */
    const applyColorBlindMode = (mode) => {
      const root = document.documentElement
      
      // 移除所有色盲模式类
      root.classList.remove(
        'colorblind-normal', 
        'colorblind-protanopia', 
        'colorblind-deuteranopia',
        'colorblind-tritanopia',
        'colorblind-achromatopsia'
      )
      
      // 添加当前色盲模式类
      root.classList.add(`colorblind-${mode}`)
      
      // 应用色盲滤镜
      applyColorblindFilters(mode)
    }

    /**
     * 为屏幕阅读器增强
     */
    const enhanceForScreenReader = () => {
      // 添加跳转链接
      addSkipLinks()
      
      // 为所有交互元素添加ARIA标签
      enhanceInteractiveElements()
      
      // 为动态内容添加实时区域
      addLiveRegions()
    }

    /**
     * 设置键盘导航
     */
    const setupKeyboardNavigation = () => {
      const handleKeyDown = (event) => {
        // 处理全局快捷键
        switch (event.key) {
          case 'Tab':
            // 确保Tab导航正常工作
            break
          case 'Escape':
            // 关闭当前弹窗
            closeCurrentModal()
            break
          case 'Enter':
          case ' ':
            // 处理按钮激活
            if (event.target.tagName === 'BUTTON') {
              event.target.click()
              event.preventDefault()
            }
            break
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      
      // 保存清理函数
      window._keyboardNavigationCleanup = () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }

    /**
     * 添加焦点样式
     */
    const addFocusStyles = () => {
      const style = document.createElement('style')
      style.textContent = `
        .focus-visible *:focus {
          outline: 3px solid #409eff !important;
          outline-offset: 2px !important;
        }
      `
      document.head.appendChild(style)
      
      // 保存样式元素引用以便清理
      window._focusStyleElement = style
    }

    /**
     * 应用色盲滤镜
     */
    const applyColorblindFilters = (mode) => {
      const root = document.documentElement
      const filters = {
        normal: 'none',
        protanopia: 'url(#protanopia-filter)',
        deuteranopia: 'url(#deuteranopia-filter)',
        tritanopia: 'url(#tritanopia-filter)',
        achromatopsia: 'grayscale(100%)'
      }
      
      root.style.setProperty('--colorblind-filter', filters[mode])
      
      // 添加SVG滤镜
      if (mode !== 'normal') {
        addColorblindFilters()
      }
    }

    /**
     * 添加色盲SVG滤镜
     */
    const addColorblindFilters = () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('style', 'position: absolute; width: 0; height: 0;')
      svg.innerHTML = `
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="
              0.567, 0.433, 0,     0, 0
              0.558, 0.442, 0,     0, 0
              0,     0.242, 0.758, 0, 0
              0,     0,     0,     1, 0
            "/>
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="
              0.625, 0.375, 0,     0, 0
              0.7,   0.3,   0,     0, 0
              0,     0.3,   0.7,   0, 0
              0,     0,     0,     1, 0
            "/>
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="
              0.95, 0.05,  0,     0, 0
              0,    0.433, 0.567, 0, 0
              0,    0.475, 0.525, 0, 0
              0,    0,     0,     1, 0
            "/>
          </filter>
        </defs>
      `
      
      document.body.appendChild(svg)
      window._colorblindSvgElement = svg
    }

    /**
     * 发出屏幕阅读器公告
     */
    const announceToScreenReader = (message) => {
      if (!screenReaderMode.value) return
      
      screenReaderAnnouncement.value = message
      
      // 强制屏幕阅读器读取更新
      nextTick(() => {
        if (announcementsRef.value) {
          announcementsRef.value.textContent = ''
          setTimeout(() => {
            announcementsRef.value.textContent = message
          }, 100)
        }
      })
    }

    /**
     * 公告设置变化
     */
    const announceSettingChange = (setting, value) => {
      if (!screenReaderMode.value) return
      
      const message = `${setting} 设置为 ${value}`
      announceToScreenReader(message)
    }

    /**
     * 重置为默认设置
     */
    const resetToDefault = () => {
      // 重置所有设置
      setFontSize('medium')
      toggleHighContrast(false)
      toggleDarkMode(false)
      toggleScreenReader(false)
      toggleKeyboardNavigation(true)
      toggleFocusVisible(true)
      toggleReduceMotion(false)
      setColorBlindMode('normal')
      
      ElMessage.success(accessibilityLabels.value.settingsReset)
      announceToScreenReader(accessibilityLabels.value.settingsReset)
    }

    /**
     * 初始化设置
     */
    const initializeSettings = () => {
      // 从localStorage读取设置
      const savedSettings = localStorage.getItem('accessibility-settings')
      
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          Object.assign(settings, { ...settings, ...parsed })
        } catch (error) {
          console.warn('Failed to parse accessibility settings:', error)
        }
      }
      
      // 应用默认设置
      applyFontSize(settings.fontSize)
      if (settings.highContrast) applyHighContrast(true)
      if (settings.darkMode) applyDarkMode(true)
      if (settings.screenReaderMode) applyScreenReaderMode(true)
      if (settings.keyboardNavigation) setupKeyboardNavigation()
      if (settings.focusVisible) addFocusStyles()
      if (settings.reduceMotion) applyReduceMotion(true)
      if (settings.colorBlindMode !== 'normal') applyColorBlindMode(settings.colorBlindMode)
    }

    /**
     * 保存设置到localStorage
     */
    const saveSettings = () => {
      try {
        localStorage.setItem('accessibility-settings', JSON.stringify(settings))
      } catch (error) {
        console.warn('Failed to save accessibility settings:', error)
      }
    }

    // ================ 生命周期 ================
    
    onMounted(() => {
      initializeSettings()
      
      // 监听系统偏好设置
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
      if (prefersReducedMotion.matches) {
        toggleReduceMotion(true)
      }
      
      // 监听系统深色模式偏好
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)')
      if (prefersDarkMode.matches) {
        toggleDarkMode(true)
      }
    })

    onUnmounted(() => {
      // 清理事件监听器
      removeKeyboardNavigation()
      removeFocusStyles()
      
      // 移除SVG滤镜
      if (window._colorblindSvgElement) {
        document.body.removeChild(window._colorblindSvgElement)
      }
    })

    // ================ 监听器 ================
    
    // 监听设置变化并保存
    watch(settings, saveSettings, { deep: true })

    // ================ 辅助方法 ================
    
    const addSkipLinks = () => {
      const skipLink = document.createElement('a')
      skipLink.href = '#main-content'
      skipLink.textContent = '跳转到主要内容'
      skipLink.className = 'skip-link'
      skipLink.setAttribute('aria-label', '跳转到主要内容')
      
      document.body.insertBefore(skipLink, document.body.firstChild)
    }

    const enhanceInteractiveElements = () => {
      const interactiveElements = document.querySelectorAll(
        'button, a, input, select, textarea, [tabindex]'
      )
      
      interactiveElements.forEach(element => {
        if (!element.getAttribute('aria-label')) {
          const text = element.textContent || element.title || ''
          if (text) {
            element.setAttribute('aria-label', text.trim())
          }
        }
      })
    }

    const addLiveRegions = () => {
      const liveRegion = document.createElement('div')
      liveRegion.setAttribute('aria-live', 'polite')
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.className = 'sr-only'
      liveRegion.id = 'live-region'
      
      document.body.appendChild(liveRegion)
    }

    const closeCurrentModal = () => {
      const modals = document.querySelectorAll('.el-dialog__wrapper, .modal')
      modals.forEach(modal => {
        if (modal.style.display !== 'none') {
          const closeBtn = modal.querySelector('.el-dialog__headerbtn, .modal-close')
          if (closeBtn) {
            closeBtn.click()
          }
        }
      })
    }

    const removeKeyboardNavigation = () => {
      if (window._keyboardNavigationCleanup) {
        window._keyboardNavigationCleanup()
      }
    }

    const removeFocusStyles = () => {
      if (window._focusStyleElement) {
        document.head.removeChild(window._focusStyleElement)
      }
    }

    // ================ 返回值 ================
    
    return {
      // 响应式数据
      panelVisible,
      currentFontSize,
      highContrast,
      darkMode,
      screenReaderMode,
      keyboardNavigation,
      focusVisible,
      reduceMotion,
      colorBlindMode,
      accessibilityLabels,
      shortcuts,
      announcementsRef,
      screenReaderAnnouncement,
      
      // 方法
      togglePanel,
      setFontSize,
      toggleHighContrast,
      toggleDarkMode,
      toggleScreenReader,
      toggleKeyboardNavigation,
      toggleFocusVisible,
      toggleReduceMotion,
      setColorBlindMode,
      resetToDefault
    }
  }
}
</script>

<style lang="scss" scoped>
.accessibility-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9999;
}

.accessibility-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 360px;
  max-height: 80vh;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  overflow-y: auto;
  pointer-events: auto;
  transform: translateX(120%);
  transition: transform 0.3s ease;

  &.visible {
    transform: translateX(0);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #e4e7ed;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .close-btn {
      color: #909399;
      
      &:hover {
        color: #606266;
      }
    }
  }

  .panel-content {
    padding: 16px;
  }

  .control-group {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #606266;
    }

    .font-size-controls,
    .visual-controls,
    .screen-reader-controls,
    .keyboard-controls,
    .animation-controls {
      margin-bottom: 12px;
    }

    .colorblind-controls {
      .el-select {
        width: 100%;
      }
    }

    .shortcut-list {
      .shortcut-item {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        font-size: 12px;

        .shortcut-key {
          background: #f5f7fa;
          border: 1px solid #dcdfe6;
          border-radius: 4px;
          padding: 2px 6px;
          margin-right: 8px;
          font-family: monospace;
          font-size: 11px;
        }

        .shortcut-desc {
          color: #909399;
        }
      }
    }
  }

  .panel-footer {
    padding: 16px;
    border-top: 1px solid #e4e7ed;
    text-align: center;
  }
}

.accessibility-trigger {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  z-index: 9998;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.screen-reader-announcements {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

// 全局可访问性样式
:global(.font-size-small) {
  font-size: 14px;
}

:global(.font-size-medium) {
  font-size: 16px;
}

:global(.font-size-large) {
  font-size: 18px;
}

:global(.high-contrast) {
  filter: contrast(1.5);
}

:global(.dark-mode) {
  color-scheme: dark;
}

:global(.screen-reader-mode) {
  // 为屏幕阅读器优化的样式
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
}

:global(.keyboard-navigation) {
  // 键盘导航样式
  *:focus {
    outline: 2px solid #409eff;
    outline-offset: 2px;
  }
}

:global(.focus-visible) {
  // 焦点可见样式
  *:focus {
    outline: 3px solid #409eff;
    outline-offset: 2px;
  }
}

:global(.reduce-motion) {
  // 减少动画
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// 色盲模式滤镜
:global(.colorblind-protanopia) {
  filter: var(--colorblind-filter, none);
}

:global(.colorblind-deuteranopia) {
  filter: var(--colorblind-filter, none);
}

:global(.colorblind-tritanopia) {
  filter: var(--colorblind-filter, none);
}

:global(.colorblind-achromatopsia) {
  filter: var(--colorblind-filter, none);
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #409eff;
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 10001;

  &:focus {
    top: 6px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .accessibility-panel {
    width: 90%;
    max-width: 320px;
    right: 5%;
    left: 5%;
  }

  .accessibility-trigger {
    bottom: 16px;
    right: 16px;
    width: 48px;
    height: 48px;
  }
}
</style>