<template>
  <div class="responsive-layout" :class="layoutClasses">
    <!-- 移动端导航栏 -->
    <header 
      v-if="showMobileHeader" 
      class="responsive-layout__mobile-header"
      :class="mobileHeaderClasses"
    >
      <slot name="mobile-header">
        <div class="responsive-layout__mobile-nav">
          <button 
            class="responsive-layout__menu-toggle"
            @click="toggleMobileMenu"
            :aria-label="mobileMenuOpen ? '关闭菜单' : '打开菜单'"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                :d="mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'"
              />
            </svg>
          </button>
          
          <div class="responsive-layout__mobile-logo">
            <img 
              v-if="logoUrl" 
              :src="logoUrl" 
              :alt="brandName"
              class="responsive-layout__mobile-logo-img"
            />
            <h1 v-else class="responsive-layout__mobile-logo-text">
              {{ brandName }}
            </h1>
          </div>
          
          <slot name="mobile-actions">
            <div class="responsive-layout__mobile-actions">
              <button 
                v-if="user"
                class="responsive-layout__user-menu-btn"
                @click="toggleUserMenu"
              >
                <img 
                  v-if="user.avatar" 
                  :src="user.avatar" 
                  :alt="user.name"
                  class="responsive-layout__user-avatar"
                />
                <div v-else class="responsive-layout__user-avatar-placeholder">
                  {{ user.name?.charAt(0).toUpperCase() }}
                </div>
              </button>
            </div>
          </slot>
        </div>
      </slot>
    </header>

    <!-- 桌面端侧边栏 -->
    <aside 
      v-if="showDesktopSidebar" 
      class="responsive-layout__sidebar"
      :class="sidebarClasses"
    >
      <slot name="sidebar">
        <SidebarMenu 
          :menuItems="menuItems"
          :collapsed="sidebarCollapsed"
          :activeItem="activeMenuItem"
          @menu-click="handleMenuClick"
        >
          <template #header>
            <div class="responsive-layout__sidebar-header">
              <div class="responsive-layout__sidebar-logo">
                <img 
                  v-if="logoUrl" 
                  :src="logoUrl" 
                  :alt="brandName"
                  class="responsive-layout__sidebar-logo-img"
                />
                <h2 v-else class="responsive-layout__sidebar-logo-text">
                  {{ brandName }}
                </h2>
              </div>
              <button 
                v-if="collapsible"
                class="responsive-layout__sidebar-toggle"
                @click="toggleSidebar"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    stroke-width="2" 
                    :d="sidebarCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'"
                  />
                </svg>
              </button>
            </div>
          </template>
        </SidebarMenu>
      </slot>
    </aside>

    <!-- 主内容区域 -->
    <main class="responsive-layout__main" :class="mainClasses">
      <!-- 桌面端头部 -->
      <header 
        v-if="showDesktopHeader" 
        class="responsive-layout__desktop-header"
      >
        <slot name="desktop-header">
          <HeaderNavigation 
            :title="pageTitle"
            :user="user"
            :notifications="notifications"
          >
            <template #actions>
              <slot name="header-actions"></slot>
            </template>
          </HeaderNavigation>
        </slot>
      </header>

      <!-- 面包屑导航 -->
      <nav v-if="showBreadcrumb" class="responsive-layout__breadcrumb">
        <slot name="breadcrumb">
          <BreadcrumbNav :items="breadcrumbItems" />
        </slot>
      </nav>

      <!-- 内容区域 -->
      <div class="responsive-layout__content" :class="contentClasses">
        <slot></slot>
      </div>

      <!-- 底部 -->
      <footer v-if="showFooter" class="responsive-layout__footer">
        <slot name="footer">
          <Footer />
        </slot>
      </footer>
    </main>

    <!-- 移动端菜单遮罩 -->
    <div 
      v-if="mobileMenuOpen" 
      class="responsive-layout__mobile-overlay"
      @click="closeMobileMenu"
    ></div>

    <!-- 移动端侧边菜单 -->
    <aside 
      v-if="mobileMenuOpen" 
      class="responsive-layout__mobile-menu"
    >
      <slot name="mobile-menu">
        <div class="responsive-layout__mobile-menu-header">
          <h3>菜单</h3>
          <button 
            class="responsive-layout__mobile-menu-close"
            @click="closeMobileMenu"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        <nav class="responsive-layout__mobile-menu-content">
          <SidebarMenu 
            :menuItems="menuItems"
            :activeItem="activeMenuItem"
            :mobile="true"
            @menu-click="handleMobileMenuClick"
          />
        </nav>
      </slot>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import SidebarMenu from './SidebarMenu.vue'
import HeaderNavigation from './HeaderNavigation.vue'
import BreadcrumbNav from './BreadcrumbNav.vue'
import Footer from '../Footer.vue'

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
  showMobileHeader?: boolean
  showDesktopHeader?: boolean
  showDesktopSidebar?: boolean
  showBreadcrumb?: boolean
  showFooter?: boolean
  collapsible?: boolean
  defaultSidebarCollapsed?: boolean
  sidebarPosition?: 'left' | 'right'
  breakpoints?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  brandName: 'Application',
  menuItems: () => [],
  breadcrumbItems: () => [],
  showMobileHeader: true,
  showDesktopHeader: true,
  showDesktopSidebar: true,
  showBreadcrumb: true,
  showFooter: false,
  collapsible: true,
  defaultSidebarCollapsed: false,
  sidebarPosition: 'left',
  breakpoints: () => ({
    mobile: 768,
    tablet: 1024,
    desktop: 1280
  })
})

const emit = defineEmits<{
  'menu-click': [item: MenuItem]
  'sidebar-toggle': [collapsed: boolean]
}>()

// 响应式状态
const screenSize = ref<'mobile' | 'tablet' | 'desktop'>('desktop')
const sidebarCollapsed = ref(props.defaultSidebarCollapsed)
const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)
const activeMenuItem = ref<string>('')

// 计算属性
const isMobile = computed(() => screenSize.value === 'mobile')
const isTablet = computed(() => screenSize.value === 'tablet')
const isDesktop = computed(() => screenSize.value === 'desktop')

const layoutClasses = computed(() => [
  `responsive-layout--${screenSize.value}`,
  `responsive-layout--sidebar-${props.sidebarPosition}`,
  {
    'responsive-layout--sidebar-collapsed': sidebarCollapsed.value,
    'responsive-layout--mobile-menu-open': mobileMenuOpen.value
  }
])

const mobileHeaderClasses = computed(() => [
  'responsive-layout__mobile-header-inner',
  {
    'responsive-layout__mobile-header--menu-open': mobileMenuOpen.value
  }
])

const sidebarClasses = computed(() => [
  'responsive-layout__sidebar-inner',
  {
    'responsive-layout__sidebar-inner--collapsed': sidebarCollapsed.value,
    'responsive-layout__sidebar-inner--mobile': isMobile.value
  }
])

const mainClasses = computed(() => [
  'responsive-layout__main-inner',
  {
    'responsive-layout__main-inner--with-sidebar': props.showDesktopSidebar && !isMobile.value,
    'responsive-layout__main-inner--sidebar-collapsed': sidebarCollapsed.value && !isMobile.value
  }
])

const contentClasses = computed(() => [
  'responsive-layout__content-inner',
  {
    'responsive-layout__content-inner--full-width': !props.showDesktopSidebar || isMobile.value
  }
])

// 方法
const updateScreenSize = () => {
  const width = window.innerWidth
  
  if (width < props.breakpoints.mobile) {
    screenSize.value = 'mobile'
  } else if (width < props.breakpoints.tablet) {
    screenSize.value = 'tablet'
  } else {
    screenSize.value = 'desktop'
  }
}

const toggleSidebar = () => {
  if (!props.collapsible) return
  
  sidebarCollapsed.value = !sidebarCollapsed.value
  emit('sidebar-toggle', sidebarCollapsed.value)
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const handleMenuClick = (item: MenuItem) => {
  activeMenuItem.value = item.id
  emit('menu-click', item)
}

const handleMobileMenuClick = (item: MenuItem) => {
  handleMenuClick(item)
  closeMobileMenu()
}

// 生命周期
onMounted(() => {
  updateScreenSize()
  window.addEventListener('resize', updateScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize)
})
</script>

<style scoped>
.responsive-layout {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  font-family: 'Space Mono', monospace;
  color: #1a202c;
  position: relative;
}

/* 移动端头部 */
.responsive-layout__mobile-header {
  display: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(237, 137, 54, 0.1);
  position: sticky;
  top: 0;
  z-index: 30;
}

.responsive-layout__mobile-header-inner {
  padding: 1rem;
  transition: all 0.3s;
}

.responsive-layout__mobile-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.responsive-layout__menu-toggle {
  background: none;
  border: none;
  color: #2d3748;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.responsive-layout__menu-toggle:hover {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.responsive-layout__mobile-logo {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.responsive-layout__mobile-logo-img {
  height: 32px;
  object-fit: contain;
}

.responsive-layout__mobile-logo-text {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
}

.responsive-layout__mobile-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.responsive-layout__user-menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
}

.responsive-layout__user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(237, 137, 54, 0.3);
}

.responsive-layout__user-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ed8936;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-family: 'Playfair Display', serif;
}

/* 桌面端侧边栏 */
.responsive-layout__sidebar {
  display: block;
  position: relative;
  z-index: 20;
}

.responsive-layout__sidebar-inner {
  width: 280px;
  background: rgba(45, 55, 72, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(237, 137, 54, 0.2);
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.responsive-layout--sidebar-right .responsive-layout__sidebar-inner {
  left: auto;
  right: 0;
  border-right: none;
  border-left: 1px solid rgba(237, 137, 54, 0.2);
}

.responsive-layout__sidebar-inner--collapsed {
  width: 80px;
}

.responsive-layout__sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 80px;
}

.responsive-layout__sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.responsive-layout__sidebar-logo-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.responsive-layout__sidebar-logo-text {
  font-family: 'Playfair Display', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #f7fafc;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity 0.3s;
}

.responsive-layout__sidebar-inner--collapsed .responsive-layout__sidebar-logo-text {
  opacity: 0;
  width: 0;
}

.responsive-layout__sidebar-toggle {
  background: none;
  border: none;
  color: #f7fafc;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.responsive-layout__sidebar-toggle:hover {
  background: rgba(237, 137, 54, 0.2);
}

/* 主内容区域 */
.responsive-layout__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.responsive-layout__main-inner {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.responsive-layout__main-inner--with-sidebar {
  margin-left: 0;
}

.responsive-layout--sidebar-left .responsive-layout__main-inner--with-sidebar {
  margin-left: 280px;
}

.responsive-layout--sidebar-left .responsive-layout__main-inner--sidebar-collapsed {
  margin-left: 80px;
}

.responsive-layout--sidebar-right .responsive-layout__main-inner--with-sidebar {
  margin-right: 280px;
}

.responsive-layout--sidebar-right .responsive-layout__main-inner--sidebar-collapsed {
  margin-right: 80px;
}

/* 桌面端头部 */
.responsive-layout__desktop-header {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(237, 137, 54, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
}

/* 面包屑 */
.responsive-layout__breadcrumb {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  border-bottom: 1px solid rgba(237, 137, 54, 0.05);
  padding: 0.75rem 2rem;
}

/* 内容区域 */
.responsive-layout__content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.responsive-layout__content-inner--full-width {
  padding: 1rem;
}

/* 底部 */
.responsive-layout__footer {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  border-top: 1px solid rgba(237, 137, 54, 0.1);
  padding: 1rem 2rem;
}

/* 移动端菜单 */
.responsive-layout__mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(45, 55, 72, 0.5);
  backdrop-filter: blur(2px);
  z-index: 25;
}

.responsive-layout__mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background: rgba(45, 55, 72, 0.95);
  backdrop-filter: blur(10px);
  z-index: 35;
  overflow-y: auto;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.responsive-layout--mobile-menu-open .responsive-layout__mobile-menu {
  transform: translateX(0);
}

.responsive-layout__mobile-menu-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(237, 137, 54, 0.1);
}

.responsive-layout__mobile-menu-header h3 {
  color: #f7fafc;
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.responsive-layout__mobile-menu-close {
  background: none;
  border: none;
  color: #f7fafc;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.responsive-layout__mobile-menu-close:hover {
  background: rgba(237, 137, 54, 0.2);
}

.responsive-layout__mobile-menu-content {
  padding: 1rem 0;
}

/* 响应式断点 */
.responsive-layout--mobile .responsive-layout__mobile-header {
  display: block;
}

.responsive-layout--mobile .responsive-layout__sidebar {
  display: none;
}

.responsive-layout--mobile .responsive-layout__desktop-header {
  display: none;
}

.responsive-layout--mobile .responsive-layout__breadcrumb {
  padding: 0.5rem 1rem;
}

.responsive-layout--mobile .responsive-layout__content {
  padding: 1rem;
}

.responsive-layout--tablet .responsive-layout__mobile-header {
  display: none;
}

.responsive-layout--tablet .responsive-layout__sidebar {
  display: block;
}

.responsive-layout--tablet .responsive-layout__desktop-header {
  display: block;
}

.responsive-layout--tablet .responsive-layout__content {
  padding: 1.5rem;
}

@media (max-width: 1024px) {
  .responsive-layout__main-inner--with-sidebar {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
  
  .responsive-layout__sidebar-inner {
    transform: translateX(-100%);
  }
  
  .responsive-layout--sidebar-right .responsive-layout__sidebar-inner {
    transform: translateX(100%);
  }
  
  .responsive-layout__sidebar-inner--collapsed {
    width: 280px;
  }
}
</style>