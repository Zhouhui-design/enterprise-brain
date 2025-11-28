<template>
  <div class="sidebar-layout" :class="layoutClasses">
    <!-- 侧边栏 -->
    <aside class="sidebar-layout__sidebar" :class="sidebarClasses">
      <div class="sidebar-layout__sidebar-header">
        <div class="sidebar-layout__logo">
          <img 
            v-if="logoUrl" 
            :src="logoUrl" 
            :alt="brandName"
            class="sidebar-layout__logo-img"
          />
          <div v-else class="sidebar-layout__logo-text">
            <h2>{{ brandName }}</h2>
          </div>
        </div>
        <button 
          class="sidebar-layout__toggle"
          @click="toggleSidebar"
          :aria-label="collapsed ? '展开侧边栏' : '收起侧边栏'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              :d="collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'"
            />
          </svg>
        </button>
      </div>

      <nav class="sidebar-layout__nav">
        <slot name="menu">
          <SidebarMenu 
            :menuItems="menuItems" 
            :collapsed="collapsed"
            :activeItem="activeMenuItem"
            @menu-click="handleMenuClick"
          />
        </slot>
      </nav>

      <div v-if="$slots.sidebarFooter" class="sidebar-layout__footer">
        <slot name="sidebarFooter"></slot>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <div class="sidebar-layout__main" :class="mainClasses">
      <!-- 顶部导航栏 -->
      <header v-if="showHeader" class="sidebar-layout__header">
        <slot name="header">
          <HeaderNavigation 
            :title="pageTitle"
            :user="user"
            :notifications="notifications"
            @toggle-sidebar="toggleSidebar"
          >
            <template #actions>
              <slot name="headerActions"></slot>
            </template>
          </HeaderNavigation>
        </slot>
      </header>

      <!-- 面包屑导航 -->
      <div v-if="showBreadcrumb" class="sidebar-layout__breadcrumb">
        <slot name="breadcrumb">
          <BreadcrumbNav :items="breadcrumbItems" />
        </slot>
      </div>

      <!-- 页面内容 -->
      <main class="sidebar-layout__content" :class="contentClasses">
        <slot></slot>
      </main>
    </div>

    <!-- 移动端遮罩层 -->
    <div 
      v-if="showMobileOverlay" 
      class="sidebar-layout__overlay"
      @click="closeMobileSidebar"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import SidebarMenu from './SidebarMenu.vue'
import HeaderNavigation from './HeaderNavigation.vue'
import BreadcrumbNav from './BreadcrumbNav.vue'

interface MenuItem {
  id: string
  label: string
  icon?: string
  path?: string
  badge?: string | number
  children?: MenuItem[]
}

interface BreadcrumbItem {
  label: string
  path?: string
}

interface User {
  name: string
  avatar?: string
  role?: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
}

interface Props {
  brandName?: string
  logoUrl?: string
  menuItems?: MenuItem[]
  breadcrumbItems?: BreadcrumbItem[]
  pageTitle?: string
  user?: User
  notifications?: Notification[]
  showHeader?: boolean
  showBreadcrumb?: boolean
  collapsible?: boolean
  defaultCollapsed?: boolean
  sidebarPosition?: 'left' | 'right'
  sidebarWidth?: string
  responsive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  brandName: 'Application',
  menuItems: () => [],
  breadcrumbItems: () => [],
  showHeader: true,
  showBreadcrumb: true,
  collapsible: true,
  defaultCollapsed: false,
  sidebarPosition: 'left',
  sidebarWidth: '280px',
  responsive: true
})

const emit = defineEmits<{
  'menu-click': [item: MenuItem]
  'sidebar-toggle': [collapsed: boolean]
}>()

const collapsed = ref(props.defaultCollapsed)
const isMobile = ref(false)
const showMobileSidebar = ref(false)

const layoutClasses = computed(() => [
  `sidebar-layout--${props.sidebarPosition}`,
  {
    'sidebar-layout--collapsed': collapsed.value,
    'sidebar-layout--mobile': isMobile.value,
    'sidebar-layout--mobile-open': isMobile.value && showMobileSidebar.value
  }
])

const sidebarClasses = computed(() => [
  'sidebar-layout__sidebar-inner',
  {
    'sidebar-layout__sidebar-inner--collapsed': collapsed.value,
    'sidebar-layout__sidebar-inner--mobile': isMobile.value
  }
])

const mainClasses = computed(() => [
  'sidebar-layout__main-inner',
  {
    'sidebar-layout__main-inner--shifted': !collapsed.value && !isMobile.value
  }
])

const contentClasses = computed(() => [
  'sidebar-layout__content-inner',
  {
    'sidebar-layout__content-inner--padded': !props.showHeader || !props.showBreadcrumb
  }
])

const activeMenuItem = ref<string>('')

const toggleSidebar = () => {
  if (isMobile.value) {
    showMobileSidebar.value = !showMobileSidebar.value
  } else {
    collapsed.value = !collapsed.value
  }
  emit('sidebar-toggle', collapsed.value)
}

const closeMobileSidebar = () => {
  showMobileSidebar.value = false
}

const handleMenuClick = (item: MenuItem) => {
  activeMenuItem.value = item.id
  emit('menu-click', item)
  if (isMobile.value) {
    closeMobileSidebar()
  }
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    showMobileSidebar.value = false
  }
}

onMounted(() => {
  if (props.responsive) {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  }
})

onUnmounted(() => {
  if (props.responsive) {
    window.removeEventListener('resize', checkMobile)
  }
})
</script>

<style scoped>
.sidebar-layout {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  font-family: 'Space Mono', monospace;
  color: #1a202c;
  position: relative;
}

/* 侧边栏样式 */
.sidebar-layout__sidebar {
  position: relative;
  z-index: 30;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-layout__sidebar-inner {
  width: 280px;
  height: 100vh;
  background: rgba(45, 55, 72, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(237, 137, 54, 0.2);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.sidebar-layout__sidebar-inner--collapsed {
  width: 80px;
}

.sidebar-layout--right .sidebar-layout__sidebar-inner {
  left: auto;
  right: 0;
  border-right: none;
  border-left: 1px solid rgba(237, 137, 54, 0.2);
}

/* 移动端侧边栏 */
.sidebar-layout__sidebar-inner--mobile {
  transform: translateX(-100%);
  width: 280px;
  z-index: 40;
}

.sidebar-layout--right .sidebar-layout__sidebar-inner--mobile {
  transform: translateX(100%);
}

.sidebar-layout--mobile-open .sidebar-layout__sidebar-inner--mobile {
  transform: translateX(0);
}

/* 侧边栏头部 */
.sidebar-layout__sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 80px;
}

.sidebar-layout__logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.sidebar-layout__logo-img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 8px;
}

.sidebar-layout__logo-text h2 {
  color: #f7fafc;
  font-family: 'Playfair Display', serif;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity 0.3s;
}

.sidebar-layout__sidebar-inner--collapsed .sidebar-layout__logo-text h2 {
  opacity: 0;
  width: 0;
}

.sidebar-layout__toggle {
  background: none;
  border: none;
  color: #f7fafc;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.sidebar-layout__toggle:hover {
  background: rgba(237, 137, 54, 0.2);
}

/* 侧边栏导航 */
.sidebar-layout__nav {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.sidebar-layout__footer {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 主内容区域 */
.sidebar-layout__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-layout__main-inner {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-layout__main-inner--shifted {
  margin-left: 0;
}

.sidebar-layout--right .sidebar-layout__main-inner--shifted {
  margin-left: 0;
  margin-right: 0;
}

.sidebar-layout--collapsed .sidebar-layout__main-inner--shifted {
  margin-left: 0;
}

.sidebar-layout--right .sidebar-layout--collapsed .sidebar-layout__main-inner--shifted {
  margin-right: 0;
}

/* 头部导航 */
.sidebar-layout__header {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(237, 137, 54, 0.1);
  position: sticky;
  top: 0;
  z-index: 20;
}

/* 面包屑 */
.sidebar-layout__breadcrumb {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  border-bottom: 1px solid rgba(237, 137, 54, 0.05);
  padding: 0.75rem 2rem;
}

/* 内容区域 */
.sidebar-layout__content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.sidebar-layout__content-inner--padded {
  padding: 2rem;
}

/* 移动端遮罩层 */
.sidebar-layout__overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(45, 55, 72, 0.5);
  backdrop-filter: blur(2px);
  z-index: 35;
  display: none;
}

.sidebar-layout--mobile-open .sidebar-layout__overlay {
  display: block;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .sidebar-layout__main-inner--shifted {
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .sidebar-layout__content {
    padding: 1rem;
  }
  
  .sidebar-layout__breadcrumb {
    padding: 0.5rem 1rem;
  }
}
</style>