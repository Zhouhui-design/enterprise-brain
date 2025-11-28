<template>
  <div class="layout-customizer">
    <el-drawer
      v-model="visible"
      title="布局定制"
      :size="400"
      direction="rtl"
      :close-on-click-modal="false"
    >
      <div class="customizer-content">
        <!-- 布局模式 -->
        <div class="customizer-section">
          <h4 class="section-title">布局模式</h4>
          <div class="layout-modes">
            <div
              v-for="mode in layoutModes"
              :key="mode.value"
              class="layout-mode-item"
              :class="{ active: currentLayoutMode === mode.value }"
              @click="setLayoutMode(mode.value)"
            >
              <div class="mode-preview" :class="mode.previewClass"></div>
              <span class="mode-label">{{ mode.label }}</span>
            </div>
          </div>
        </div>

        <!-- 侧边栏设置 -->
        <div class="customizer-section">
          <h4 class="section-title">侧边栏设置</h4>
          
          <el-form-item label="侧边栏宽度">
            <el-slider
              v-model="sidebarConfig.width"
              :min="180"
              :max="300"
              :step="10"
              show-input
              @change="updateSidebarWidth"
            />
          </el-form-item>
          
          <el-form-item label="侧边栏主题">
            <el-radio-group v-model="sidebarConfig.theme" @change="updateSidebarTheme">
              <el-radio label="light">浅色</el-radio>
              <el-radio label="dark">深色</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="显示Logo">
            <el-switch v-model="sidebarConfig.showLogo" @change="updateSidebarShowLogo" />
          </el-form-item>
          
          <el-form-item label="显示收缩按钮">
            <el-switch v-model="sidebarConfig.collapsible" @change="updateSidebarCollapsible" />
          </el-form-item>
          
          <el-form-item label="收缩状态">
            <el-switch 
              v-model="sidebarConfig.collapsed" 
              @change="updateSidebarCollapsed"
              :disabled="!sidebarConfig.collapsible"
            />
          </el-form-item>
        </div>

        <!-- 头部设置 -->
        <div class="customizer-section">
          <h4 class="section-title">头部设置</h4>
          
          <el-form-item label="头部高度">
            <el-slider
              v-model="headerConfig.height"
              :min="50"
              :max="80"
              :step="5"
              show-input
              @change="updateHeaderHeight"
            />
          </el-form-item>
          
          <el-form-item label="头部主题">
            <el-radio-group v-model="headerConfig.theme" @change="updateHeaderTheme">
              <el-radio label="light">浅色</el-radio>
              <el-radio label="dark">深色</el-radio>
              <el-radio label="primary">主色调</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="显示面包屑">
            <el-switch v-model="headerConfig.showBreadcrumb" @change="updateBreadcrumb" />
          </el-form-item>
          
          <el-form-item label="显示用户信息">
            <el-switch v-model="headerConfig.showUser" @change="updateUser" />
          </el-form-item>
          
          <el-form-item label="显示设置">
            <el-switch v-model="headerConfig.showSettings" @change="updateSettings" />
          </el-form-item>
        </div>

        <!-- 内容设置 -->
        <div class="customizer-section">
          <h4 class="section-title">内容设置</h4>
          
          <el-form-item label="内容边距">
            <el-slider
              v-model="contentConfig.padding"
              :min="10"
              :max="40"
              :step="5"
              show-input
              @change="updateContentPadding"
            />
          </el-form-item>
          
          <el-form-item label="最大宽度">
            <el-radio-group v-model="contentConfig.maxWidth" @change="updateContentMaxWidth">
              <el-radio label="fluid">流式布局</el-radio>
              <el-radio label="boxed">盒子布局</el-radio>
              <el-radio label="wide">宽屏布局</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="显示页脚">
            <el-switch v-model="contentConfig.showFooter" @change="updateFooter" />
          </el-form-item>
        </div>

        <!-- 导航设置 -->
        <div class="customizer-section">
          <h4 class="section-title">导航设置</h4>
          
          <el-form-item label="导航模式">
            <el-radio-group v-model="navigationConfig.mode" @change="updateNavigationMode">
              <el-radio label="sidebar">侧边栏导航</el-radio>
              <el-radio label="top">顶部导航</el-radio>
              <el-radio label="mix">混合导航</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="菜单折叠">
            <el-switch v-model="navigationConfig.accordion" @change="updateAccordion" />
          </el-form-item>
          
          <el-form-item label="显示图标">
            <el-switch v-model="navigationConfig.showIcons" @change="updateMenuIcons" />
          </el-form-item>
          
          <el-form-item label="显示徽章">
            <el-switch v-model="navigationConfig.showBadges" @change="updateMenuBadges" />
          </el-form-item>
        </div>

        <!-- 预览 -->
        <div class="customizer-section">
          <h4 class="section-title">布局预览</h4>
          <div class="layout-preview">
            <component :is="currentLayoutComponent" v-bind="layoutProps" />
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="customizer-actions">
          <el-button @click="resetLayout">重置布局</el-button>
          <el-button type="primary" @click="applyLayout">应用布局</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 触发按钮 -->
    <div class="customizer-trigger" @click="visible = true">
      <i class="fas fa-cog"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface ThemeService {
  theme: any
  updateThemeProperty: (property: string, value: string) => void
}

const themeService = inject('themeService') as ThemeService

const visible = ref(false)

const currentLayoutMode = ref('sidebar')

const sidebarConfig = ref({
  width: 250,
  theme: 'dark',
  showLogo: true,
  collapsible: true,
  collapsed: false
})

const headerConfig = ref({
  height: 60,
  theme: 'primary',
  showBreadcrumb: true,
  showUser: true,
  showSettings: true
})

const contentConfig = ref({
  padding: 20,
  maxWidth: 'boxed',
  showFooter: true
})

const navigationConfig = ref({
  mode: 'sidebar',
  accordion: false,
  showIcons: true,
  showBadges: true
})

const layoutModes = [
  {
    value: 'sidebar',
    label: '侧边栏布局',
    previewClass: 'sidebar-layout'
  },
  {
    value: 'top',
    label: '顶部布局',
    previewClass: 'top-layout'
  },
  {
    value: 'mix',
    label: '混合布局',
    previewClass: 'mix-layout'
  },
  {
    value: 'vertical',
    label: '垂直布局',
    previewClass: 'vertical-layout'
  }
]

const layoutProps = computed(() => ({
  sidebarWidth: `${sidebarConfig.value.width}px`,
  sidebarTheme: sidebarConfig.value.theme,
  headerHeight: `${headerConfig.value.height}px`,
  headerTheme: headerConfig.value.theme,
  contentPadding: `${contentConfig.value.padding}px`,
  showLogo: sidebarConfig.value.showLogo,
  showBreadcrumb: headerConfig.value.showBreadcrumb,
  collapsed: sidebarConfig.value.collapsed,
  navigationMode: navigationConfig.value.mode
}))

const currentLayoutComponent = computed(() => {
  switch (currentLayoutMode.value) {
    case 'sidebar':
      return 'SidebarLayoutPreview'
    case 'top':
      return 'TopLayoutPreview'
    case 'mix':
      return 'MixLayoutPreview'
    case 'vertical':
      return 'VerticalLayoutPreview'
    default:
      return 'SidebarLayoutPreview'
  }
})

const setLayoutMode = (mode: string) => {
  currentLayoutMode.value = mode
}

const updateSidebarWidth = (value: number) => {
  themeService.updateThemeProperty('sidebar-width', `${value}px`)
}

const updateSidebarTheme = (theme: string) => {
  themeService.updateThemeProperty('sidebar-theme', theme)
}

const updateSidebarShowLogo = (show: boolean) => {
  themeService.updateThemeProperty('sidebar-show-logo', show.toString())
}

const updateSidebarCollapsible = (collapsible: boolean) => {
  themeService.updateThemeProperty('sidebar-collapsible', collapsible.toString())
}

const updateSidebarCollapsed = (collapsed: boolean) => {
  themeService.updateThemeProperty('sidebar-collapsed', collapsed.toString())
}

const updateHeaderHeight = (height: number) => {
  themeService.updateThemeProperty('header-height', `${height}px`)
}

const updateHeaderTheme = (theme: string) => {
  themeService.updateThemeProperty('header-theme', theme)
}

const updateBreadcrumb = (show: boolean) => {
  themeService.updateThemeProperty('show-breadcrumb', show.toString())
}

const updateUser = (show: boolean) => {
  themeService.updateThemeProperty('show-user', show.toString())
}

const updateSettings = (show: boolean) => {
  themeService.updateThemeProperty('show-settings', show.toString())
}

const updateContentPadding = (padding: number) => {
  themeService.updateThemeProperty('content-padding', `${padding}px`)
}

const updateContentMaxWidth = (maxWidth: string) => {
  themeService.updateThemeProperty('content-max-width', maxWidth)
}

const updateFooter = (show: boolean) => {
  themeService.updateThemeProperty('show-footer', show.toString())
}

const updateNavigationMode = (mode: string) => {
  themeService.updateThemeProperty('navigation-mode', mode)
}

const updateAccordion = (accordion: boolean) => {
  themeService.updateThemeProperty('menu-accordion', accordion.toString())
}

const updateMenuIcons = (show: boolean) => {
  themeService.updateThemeProperty('menu-icons', show.toString())
}

const updateMenuBadges = (show: boolean) => {
  themeService.updateThemeProperty('menu-badges', show.toString())
}

const resetLayout = () => {
  sidebarConfig.value = {
    width: 250,
    theme: 'dark',
    showLogo: true,
    collapsible: true,
    collapsed: false
  }
  
  headerConfig.value = {
    height: 60,
    theme: 'primary',
    showBreadcrumb: true,
    showUser: true,
    showSettings: true
  }
  
  contentConfig.value = {
    padding: 20,
    maxWidth: 'boxed',
    showFooter: true
  }
  
  navigationConfig.value = {
    mode: 'sidebar',
    accordion: false,
    showIcons: true,
    showBadges: true
  }
  
  currentLayoutMode.value = 'sidebar'
  
  // 重置主题属性
  const defaultProperties = {
    'sidebar-width': '250px',
    'sidebar-theme': 'dark',
    'sidebar-show-logo': 'true',
    'sidebar-collapsible': 'true',
    'sidebar-collapsed': 'false',
    'header-height': '60px',
    'header-theme': 'primary',
    'show-breadcrumb': 'true',
    'show-user': 'true',
    'show-settings': 'true',
    'content-padding': '20px',
    'content-max-width': 'boxed',
    'show-footer': 'true',
    'navigation-mode': 'sidebar',
    'menu-accordion': 'false',
    'menu-icons': 'true',
    'menu-badges': 'true'
  }
  
  Object.entries(defaultProperties).forEach(([key, value]) => {
    themeService.updateThemeProperty(key, value)
  })
  
  ElMessage.success('布局已重置')
}

const applyLayout = () => {
  // 应用所有布局设置
  updateSidebarWidth(sidebarConfig.value.width)
  updateSidebarTheme(sidebarConfig.value.theme)
  updateSidebarShowLogo(sidebarConfig.value.showLogo)
  updateSidebarCollapsible(sidebarConfig.value.collapsible)
  updateSidebarCollapsed(sidebarConfig.value.collapsed)
  
  updateHeaderHeight(headerConfig.value.height)
  updateHeaderTheme(headerConfig.value.theme)
  updateBreadcrumb(headerConfig.value.showBreadcrumb)
  updateUser(headerConfig.value.showUser)
  updateSettings(headerConfig.value.showSettings)
  
  updateContentPadding(contentConfig.value.padding)
  updateContentMaxWidth(contentConfig.value.maxWidth)
  updateFooter(contentConfig.value.showFooter)
  
  updateNavigationMode(navigationConfig.value.mode)
  updateAccordion(navigationConfig.value.accordion)
  updateMenuIcons(navigationConfig.value.showIcons)
  updateMenuBadges(navigationConfig.value.showBadges)
  
  ElMessage.success('布局已应用')
  visible.value = false
}

// 监听主题变化，同步更新配置
watch(() => themeService.theme, (newTheme) => {
  const customProperties = newTheme.customProperties || {}
  
  // 同步配置到界面
  if (customProperties['sidebar-width']) {
    sidebarConfig.value.width = parseInt(customProperties['sidebar-width'])
  }
  if (customProperties['sidebar-theme']) {
    sidebarConfig.value.theme = customProperties['sidebar-theme']
  }
  if (customProperties['header-height']) {
    headerConfig.value.height = parseInt(customProperties['header-height'])
  }
  if (customProperties['content-padding']) {
    contentConfig.value.padding = parseInt(customProperties['content-padding'])
  }
  if (customProperties['navigation-mode']) {
    navigationConfig.value.mode = customProperties['navigation-mode']
    currentLayoutMode.value = customProperties['navigation-mode']
  }
}, { immediate: true, deep: true })
</script>

<style scoped>
.layout-customizer {
  position: relative;
}

.customizer-trigger {
  position: fixed;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: var(--primary-color, #409eff);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: all 0.3s ease;
}

.customizer-trigger:hover {
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.customizer-content {
  height: 100%;
  overflow-y: auto;
}

.customizer-section {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--background-color, #ffffff);
  border: 1px solid var(--border-color, #ebeef5);
  border-radius: 8px;
}

.section-title {
  margin: 0 0 16px 0;
  color: var(--text-color, #303133);
  font-size: 14px;
  font-weight: 500;
}

.layout-modes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.layout-mode-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--border-color, #ebeef5);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.layout-mode-item:hover {
  border-color: var(--primary-color, #409eff);
  transform: translateY(-2px);
}

.layout-mode-item.active {
  border-color: var(--primary-color, #409eff);
  background: rgba(64, 158, 255, 0.05);
}

.mode-preview {
  width: 80px;
  height: 60px;
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 4px;
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
  background: #f5f7fa;
}

.mode-preview.sidebar-layout::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 25%;
  height: 100%;
  background: var(--primary-color, #409eff);
}

.mode-preview.sidebar-layout::after {
  content: '';
  position: absolute;
  top: 20%;
  left: 0;
  right: 0;
  height: 15%;
  background: var(--text-color, #303133);
  opacity: 0.1;
}

.mode-preview.top-layout::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 20%;
  background: var(--primary-color, #409eff);
}

.mode-preview.top-layout::after {
  content: '';
  position: absolute;
  top: 20%;
  left: 0;
  width: 25%;
  bottom: 0;
  background: var(--text-color, #303133);
  opacity: 0.1;
}

.mode-preview.mix-layout::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 15%;
  background: var(--primary-color, #409eff);
}

.mode-preview.mix-layout::after {
  content: '';
  position: absolute;
  top: 15%;
  left: 0;
  width: 25%;
  bottom: 0;
  background: var(--text-color, #303133);
  opacity: 0.1;
}

.mode-preview.vertical-layout::before {
  content: '';
  position: absolute;
  top: 15%;
  left: 0;
  width: 25%;
  bottom: 0;
  background: var(--primary-color, #409eff);
}

.mode-preview.vertical-layout::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 15%;
  background: var(--text-color, #303133);
  opacity: 0.1;
}

.mode-label {
  font-size: 12px;
  color: var(--text-color, #606266);
}

.layout-preview {
  margin-top: 16px;
  border: 1px solid var(--border-color, #ebeef5);
  border-radius: 8px;
  overflow: hidden;
  height: 200px;
  background: var(--background-color, #f5f7fa);
}

.customizer-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color, #ebeef5);
}

/* 表单项样式优化 */
:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  color: var(--text-color, #606266);
  font-size: 13px;
}

:deep(.el-slider) {
  margin: 8px 0;
}

:deep(.el-radio-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-radio) {
  margin-right: 0;
}
</style>