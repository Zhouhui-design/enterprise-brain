<template>
  <header class="header-navigation" :class="headerClasses">
    <div class="header-navigation__container">
      <!-- 左侧区域 -->
      <div class="header-navigation__left">
        <button 
          v-if="showMenuToggle"
          class="header-navigation__menu-toggle"
          @click="$emit('toggle-sidebar')"
          :aria-label="sidebarExpanded ? '收起侧边栏' : '展开侧边栏'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              :d="sidebarExpanded ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'"
            />
          </svg>
        </button>
        
        <div class="header-navigation__title-section">
          <h1 v-if="title" class="header-navigation__title">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="header-navigation__subtitle">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <!-- 中间区域 - 搜索栏 -->
      <div class="header-navigation__center">
        <slot name="search">
          <div v-if="showSearch" class="header-navigation__search">
            <div class="header-navigation__search-input-wrapper">
              <i class="fas fa-search header-navigation__search-icon"></i>
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="searchPlaceholder"
                class="header-navigation__search-input"
                @keyup.enter="handleSearch"
                @focus="searchFocused = true"
                @blur="searchFocused = false"
              />
              <button 
                v-if="searchQuery"
                class="header-navigation__search-clear"
                @click="clearSearch"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <!-- 搜索下拉菜单 -->
            <div 
              v-if="searchFocused && searchResults.length > 0"
              class="header-navigation__search-dropdown"
            >
              <div 
                v-for="result in searchResults" 
                :key="result.id"
                class="header-navigation__search-result"
                @click="selectSearchResult(result)"
              >
                <i :class="result.icon" class="header-navigation__search-result-icon"></i>
                <div class="header-navigation__search-result-content">
                  <div class="header-navigation__search-result-title">{{ result.title }}</div>
                  <div class="header-navigation__search-result-description">{{ result.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </slot>
      </div>

      <!-- 右侧区域 -->
      <div class="header-navigation__right">
        <slot name="actions">
          <!-- 通知 -->
          <div v-if="showNotifications" class="header-navigation__notifications">
            <button 
              class="header-navigation__notification-btn"
              @click="toggleNotifications"
              :class="{ 'header-navigation__notification-btn--active': showNotificationDropdown }"
            >
              <i class="fas fa-bell"></i>
              <span 
                v-if="unreadCount > 0" 
                class="header-navigation__notification-badge"
              >
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </span>
            </button>
            
            <!-- 通知下拉菜单 -->
            <div 
              v-if="showNotificationDropdown"
              class="header-navigation__notification-dropdown"
            >
              <div class="header-navigation__notification-header">
                <h3>通知</h3>
                <button 
                  class="header-navigation__notification-mark-all-read"
                  @click="markAllAsRead"
                >
                  全部标记为已读
                </button>
              </div>
              
              <div class="header-navigation__notification-list">
                <div 
                  v-for="notification in notifications.slice(0, 5)" 
                  :key="notification.id"
                  class="header-navigation__notification-item"
                  :class="{ 'header-navigation__notification-item--unread': !notification.read }"
                  @click="handleNotificationClick(notification)"
                >
                  <div 
                    class="header-navigation__notification-indicator"
                    :class="`header-navigation__notification-indicator--${notification.type}`"
                  >
                    <i :class="getNotificationIcon(notification.type)"></i>
                  </div>
                  <div class="header-navigation__notification-content">
                    <div class="header-navigation__notification-title">{{ notification.title }}</div>
                    <div class="header-navigation__notification-message">{{ notification.message }}</div>
                    <div class="header-navigation__notification-time">{{ formatTime(notification.time) }}</div>
                  </div>
                  <button 
                    class="header-navigation__notification-remove"
                    @click.stop="removeNotification(notification.id)"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
              
              <div class="header-navigation__notification-footer">
                <button class="header-navigation__notification-view-all">
                  查看全部通知
                </button>
              </div>
            </div>
          </div>

          <!-- 用户菜单 -->
          <div v-if="user" class="header-navigation__user">
            <button 
              class="header-navigation__user-btn"
              @click="toggleUserMenu"
              :class="{ 'header-navigation__user-btn--active': showUserDropdown }"
            >
              <img 
                v-if="user.avatar" 
                :src="user.avatar" 
                :alt="user.name"
                class="header-navigation__user-avatar"
              />
              <div v-else class="header-navigation__user-avatar-placeholder">
                {{ user.name?.charAt(0).toUpperCase() }}
              </div>
              <span class="header-navigation__user-name">{{ user.name }}</span>
              <i class="fas fa-chevron-down header-navigation__user-dropdown-icon"></i>
            </button>
            
            <!-- 用户下拉菜单 -->
            <div 
              v-if="showUserDropdown"
              class="header-navigation__user-dropdown"
            >
              <div class="header-navigation__user-header">
                <div class="header-navigation__user-info">
                  <div class="header-navigation__user-name-large">{{ user.name }}</div>
                  <div v-if="user.role" class="header-navigation__user-role">{{ user.role }}</div>
                </div>
              </div>
              
              <div class="header-navigation__user-menu-items">
                <button 
                  v-for="item in userMenuItems" 
                  :key="item.id"
                  class="header-navigation__user-menu-item"
                  @click="handleUserMenuClick(item)"
                >
                  <i :class="item.icon"></i>
                  <span>{{ item.label }}</span>
                </button>
              </div>
              
              <div class="header-navigation__user-footer">
                <button 
                  class="header-navigation__user-logout"
                  @click="handleLogout"
                >
                  <i class="fas fa-sign-out-alt"></i>
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </slot>
      </div>
    </div>

    <!-- 全局遮罩层 -->
    <div 
      v-if="showUserDropdown || showNotificationDropdown"
      class="header-navigation__overlay"
      @click="closeAllDropdowns"
    ></div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

interface User {
  name: string
  avatar?: string
  role?: string
  email?: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  time: Date
}

interface SearchResult {
  id: string
  title: string
  description: string
  icon: string
  path?: string
}

interface UserMenuItem {
  id: string
  label: string
  icon: string
  action: () => void
}

interface Props {
  title?: string
  subtitle?: string
  user?: User
  notifications?: Notification[]
  showMenuToggle?: boolean
  showSearch?: boolean
  showNotifications?: boolean
  sidebarExpanded?: boolean
  searchPlaceholder?: string
  userMenuItems?: UserMenuItem[]
}

const props = withDefaults(defineProps<Props>(), {
  notifications: () => [],
  showMenuToggle: true,
  showSearch: true,
  showNotifications: true,
  sidebarExpanded: true,
  searchPlaceholder: '搜索...'
})

const emit = defineEmits<{
  'toggle-sidebar': []
  'search': [query: string]
  'notification-click': [notification: Notification]
  'user-menu-click': [item: UserMenuItem]
  'logout': []
}>()

// 响应式状态
const searchQuery = ref('')
const searchFocused = ref(false)
const searchResults = ref<SearchResult[]>([])
const showNotificationDropdown = ref(false)
const showUserDropdown = ref(false)
const dropdownOpen = ref(false)

// 计算属性
const headerClasses = computed(() => [
  'header-navigation',
  {
    'header-navigation--with-dropdown': showNotificationDropdown.value || showUserDropdown.value
  }
])

const unreadCount = computed(() => 
  props.notifications.filter(n => !n.read).length
)

// 方法
const handleSearch = () => {
  if (searchQuery.value.trim()) {
    emit('search', searchQuery.value.trim())
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
}

const selectSearchResult = (result: SearchResult) => {
  searchQuery.value = result.title
  searchResults.value = []
  // 这里可以添加导航逻辑
}

const toggleNotifications = () => {
  showNotificationDropdown.value = !showNotificationDropdown.value
  showUserDropdown.value = false
}

const toggleUserMenu = () => {
  showUserDropdown.value = !showUserDropdown.value
  showNotificationDropdown.value = false
}

const closeAllDropdowns = () => {
  showNotificationDropdown.value = false
  showUserDropdown.value = false
}

const markAllAsRead = () => {
  // 发送事件标记所有通知为已读
}

const handleNotificationClick = (notification: Notification) => {
  emit('notification-click', notification)
  showNotificationDropdown.value = false
}

const removeNotification = (id: string) => {
  // 发送事件移除通知
}

const handleUserMenuClick = (item: UserMenuItem) => {
  item.action()
  emit('user-menu-click', item)
  showUserDropdown.value = false
}

const handleLogout = () => {
  emit('logout')
  showUserDropdown.value = false
}

const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    info: 'fas fa-info-circle',
    warning: 'fas fa-exclamation-triangle',
    error: 'fas fa-exclamation-circle',
    success: 'fas fa-check-circle'
  }
  return iconMap[type] || iconMap.info
}

const formatTime = (time: Date) => {
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return time.toLocaleDateString()
}

// 模拟搜索结果（实际项目中应该从API获取）
const performSearch = (query: string) => {
  // 这里应该调用API进行搜索
  searchResults.value = [
    {
      id: '1',
      title: '示例页面 1',
      description: '这是一个示例页面的描述',
      icon: 'fas fa-file',
      path: '/example-1'
    },
    {
      id: '2',
      title: '示例页面 2',
      description: '这是另一个示例页面的描述',
      icon: 'fas fa-folder',
      path: '/example-2'
    }
  ].filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  )
}

// 监听搜索查询变化
const handleSearchQueryChange = (query: string) => {
  if (query.trim()) {
    performSearch(query)
  } else {
    searchResults.value = []
  }
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.header-navigation')) {
    closeAllDropdowns()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 监听搜索查询
watch(searchQuery, handleSearchQueryChange)
</script>

<style scoped>
.header-navigation {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(237, 137, 54, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px 0 rgba(45, 55, 72, 0.1);
}

.header-navigation__container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 2rem;
  gap: 2rem;
  min-height: 64px;
}

/* 左侧区域 */
.header-navigation__left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.header-navigation__menu-toggle {
  background: none;
  border: none;
  color: #2d3748;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-navigation__menu-toggle:hover {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.header-navigation__title-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.header-navigation__title {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  line-height: 1.2;
}

.header-navigation__subtitle {
  font-size: 0.875rem;
  color: #718096;
  margin: 0;
  line-height: 1.2;
}

/* 中间区域 - 搜索栏 */
.header-navigation__center {
  flex: 1;
  max-width: 600px;
  min-width: 0;
}

.header-navigation__search {
  position: relative;
}

.header-navigation__search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.header-navigation__search-icon {
  position: absolute;
  left: 0.75rem;
  color: #a0aec0;
  font-size: 0.875rem;
  z-index: 1;
}

.header-navigation__search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid rgba(203, 213, 224, 0.8);
  border-radius: 6px;
  background: rgba(247, 250, 252, 0.8);
  font-family: 'Space Mono', monospace;
  font-size: 0.875rem;
  color: #2d3748;
  transition: all 0.2s;
}

.header-navigation__search-input:focus {
  outline: none;
  border-color: rgba(237, 137, 54, 0.5);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 3px rgba(237, 137, 54, 0.1);
}

.header-navigation__search-clear {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.header-navigation__search-clear:hover {
  color: #4a5568;
  background: rgba(203, 213, 224, 0.3);
}

.header-navigation__search-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(237, 137, 54, 0.2);
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(45, 55, 72, 0.1);
  z-index: 50;
  max-height: 300px;
  overflow-y: auto;
}

.header-navigation__search-result {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid rgba(237, 137, 54, 0.05);
}

.header-navigation__search-result:last-child {
  border-bottom: none;
}

.header-navigation__search-result:hover {
  background: rgba(237, 137, 54, 0.05);
}

.header-navigation__search-result-icon {
  color: #ed8936;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.header-navigation__search-result-content {
  flex: 1;
  min-width: 0;
}

.header-navigation__search-result-title {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.header-navigation__search-result-description {
  font-size: 0.75rem;
  color: #718096;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 右侧区域 */
.header-navigation__right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

/* 通知 */
.header-navigation__notifications {
  position: relative;
}

.header-navigation__notification-btn {
  background: none;
  border: none;
  color: #4a5568;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-navigation__notification-btn:hover {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.header-navigation__notification-btn--active {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.header-navigation__notification-badge {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: #e53e3e;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.25rem;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
  line-height: 1;
}

.header-navigation__notification-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(237, 137, 54, 0.2);
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(45, 55, 72, 0.1);
  z-index: 50;
}

.header-navigation__notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid rgba(237, 137, 54, 0.1);
}

.header-navigation__notification-header h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
}

.header-navigation__notification-mark-all-read {
  background: none;
  border: none;
  color: #ed8936;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.header-navigation__notification-mark-all-read:hover {
  background: rgba(237, 137, 54, 0.1);
}

.header-navigation__notification-list {
  max-height: 300px;
  overflow-y: auto;
}

.header-navigation__notification-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid rgba(237, 137, 54, 0.05);
  position: relative;
}

.header-navigation__notification-item:last-child {
  border-bottom: none;
}

.header-navigation__notification-item:hover {
  background: rgba(237, 137, 54, 0.05);
}

.header-navigation__notification-item--unread {
  background: rgba(237, 137, 54, 0.02);
}

.header-navigation__notification-indicator {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.header-navigation__notification-indicator--info {
  background: rgba(66, 153, 225, 0.1);
  color: #4299e1;
}

.header-navigation__notification-indicator--warning {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.header-navigation__notification-indicator--error {
  background: rgba(229, 62, 62, 0.1);
  color: #e53e3e;
}

.header-navigation__notification-indicator--success {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
}

.header-navigation__notification-content {
  flex: 1;
  min-width: 0;
}

.header-navigation__notification-title {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.25rem;
  line-height: 1.2;
}

.header-navigation__notification-message {
  font-size: 0.875rem;
  color: #4a5568;
  line-height: 1.4;
  margin-bottom: 0.25rem;
}

.header-navigation__notification-time {
  font-size: 0.75rem;
  color: #a0aec0;
}

.header-navigation__notification-remove {
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0;
}

.header-navigation__notification-item:hover .header-navigation__notification-remove {
  opacity: 1;
}

.header-navigation__notification-remove:hover {
  color: #e53e3e;
  background: rgba(229, 62, 62, 0.1);
}

.header-navigation__notification-footer {
  padding: 1rem;
  border-top: 1px solid rgba(237, 137, 54, 0.1);
}

.header-navigation__notification-view-all {
  width: 100%;
  background: none;
  border: none;
  color: #ed8936;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  text-align: center;
}

.header-navigation__notification-view-all:hover {
  background: rgba(237, 137, 54, 0.1);
}

/* 用户菜单 */
.header-navigation__user {
  position: relative;
}

.header-navigation__user-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.header-navigation__user-btn:hover {
  background: rgba(237, 137, 54, 0.1);
}

.header-navigation__user-btn--active {
  background: rgba(237, 137, 54, 0.1);
}

.header-navigation__user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(237, 137, 54, 0.3);
}

.header-navigation__user-avatar-placeholder {
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

.header-navigation__user-name {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  color: #2d3748;
  font-size: 0.875rem;
}

.header-navigation__user-dropdown-icon {
  font-size: 0.625rem;
  color: #a0aec0;
  transition: transform 0.2s;
}

.header-navigation__user-btn--active .header-navigation__user-dropdown-icon {
  transform: rotate(180deg);
}

.header-navigation__user-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 240px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(237, 137, 54, 0.2);
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(45, 55, 72, 0.1);
  z-index: 50;
}

.header-navigation__user-header {
  padding: 1rem;
  border-bottom: 1px solid rgba(237, 137, 54, 0.1);
}

.header-navigation__user-info {
  text-align: center;
}

.header-navigation__user-name-large {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  color: #2d3748;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.header-navigation__user-role {
  font-size: 0.75rem;
  color: #718096;
}

.header-navigation__user-menu-items {
  padding: 0.5rem;
}

.header-navigation__user-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: none;
  border: none;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  color: #2d3748;
  text-align: left;
}

.header-navigation__user-menu-item:hover {
  background: rgba(237, 137, 54, 0.05);
  color: #ed8936;
}

.header-navigation__user-menu-item i {
  width: 16px;
  text-align: center;
  opacity: 0.7;
}

.header-navigation__user-menu-item:hover i {
  opacity: 1;
}

.header-navigation__user-footer {
  padding: 0.5rem 1rem 1rem;
  border-top: 1px solid rgba(237, 137, 54, 0.1);
}

.header-navigation__user-logout {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: none;
  border: none;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  color: #e53e3e;
  text-align: left;
}

.header-navigation__user-logout:hover {
  background: rgba(229, 62, 62, 0.05);
}

/* 遮罩层 */
.header-navigation__overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(45, 55, 72, 0.1);
  z-index: 40;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .header-navigation__container {
    padding: 0.75rem 1rem;
    gap: 1rem;
  }
  
  .header-navigation__center {
    max-width: 400px;
  }
  
  .header-navigation__user-name {
    display: none;
  }
}

@media (max-width: 768px) {
  .header-navigation__container {
    padding: 0.75rem 1rem;
  }
  
  .header-navigation__search {
    display: none;
  }
  
  .header-navigation__notification-dropdown,
  .header-navigation__user-dropdown {
    width: 280px;
  }
  
  .header-navigation__subtitle {
    display: none;
  }
  
  .header-navigation__title {
    font-size: 1rem;
  }
}
</style>