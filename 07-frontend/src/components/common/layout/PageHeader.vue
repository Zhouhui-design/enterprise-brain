<template>
  <header class="page-header" :class="headerClasses">
    <!-- 背景装饰 -->
    <div v-if="showBackground" class="page-header__background" :class="backgroundClasses">
      <div v-if="backgroundImage" class="page-header__background-image" :style="backgroundImageStyle"></div>
      <div v-if="showPattern" class="page-header__background-pattern"></div>
      <div v-if="showGradient" class="page-header__background-gradient"></div>
    </div>

    <!-- 主要内容区域 -->
    <div class="page-header__content" :class="contentClasses">
      <div class="page-header__container">
        <!-- 左侧区域 - 标题和信息 -->
        <div class="page-header__left" :class="leftClasses">
          <!-- 返回按钮 -->
          <button 
            v-if="showBackButton"
            class="page-header__back-button"
            @click="handleBackClick"
            :title="backButtonTitle"
          >
            <i :class="backButtonIcon" class="page-header__back-icon"></i>
            <span v-if="showBackText" class="page-header__back-text">{{ backButtonText }}</span>
          </button>

          <!-- 页面图标 -->
          <div v-if="icon" class="page-header__icon-container">
            <div class="page-header__icon" :class="iconClasses">
              <i :class="icon"></i>
            </div>
          </div>

          <!-- 标题和描述 -->
          <div class="page-header__title-section">
            <h1 class="page-header__title" :class="titleClasses">
              {{ title }}
              <span v-if="badge" class="page-header__badge" :class="badgeClasses">
                {{ formatBadge(badge) }}
              </span>
            </h1>
            <p v-if="subtitle" class="page-header__subtitle" :class="subtitleClasses">
              {{ subtitle }}
            </p>
            <div v-if="$slots.description" class="page-header__description">
              <slot name="description"></slot>
            </div>
          </div>
        </div>

        <!-- 中间区域 - 自定义内容 -->
        <div v-if="$slots.center" class="page-header__center">
          <slot name="center"></slot>
        </div>

        <!-- 右侧区域 - 操作按钮 -->
        <div v-if="$slots.actions || showActions" class="page-header__right" :class="rightClasses">
          <slot name="actions">
            <!-- 主要操作按钮 -->
            <div class="page-header__actions">
              <button 
                v-for="action in filteredActions" 
                :key="action.id"
                class="page-header__action"
                :class="getActionClasses(action)"
                @click="handleActionClick(action)"
                :disabled="action.disabled"
                :title="action.title || action.label"
              >
                <i v-if="action.icon" :class="action.icon" class="page-header__action-icon"></i>
                <span v-if="showActionText" class="page-header__action-text">{{ action.label }}</span>
                <span v-if="action.badge" class="page-header__action-badge">
                  {{ formatBadge(action.badge) }}
                </span>
              </button>
            </div>

            <!-- 更多操作菜单 -->
            <div v-if="moreActions.length > 0" class="page-header__more-actions">
              <button 
                class="page-header__more-button"
                @click="toggleMoreMenu"
                :class="{ 'page-header__more-button--active': showMoreMenu }"
              >
                <i class="fas fa-ellipsis-v"></i>
              </button>

              <!-- 更多操作下拉菜单 -->
              <transition name="dropdown">
                <div v-if="showMoreMenu" class="page-header__more-dropdown">
                  <div 
                    v-for="action in moreActions" 
                    :key="action.id"
                    class="page-header__more-item"
                    @click="handleMoreActionClick(action)"
                  >
                    <i v-if="action.icon" :class="action.icon"></i>
                    <span>{{ action.label }}</span>
                  </div>
                </div>
              </transition>
            </div>
          </slot>
        </div>
      </div>

      <!-- 标签页导航 -->
      <div v-if="tabs && tabs.length > 0" class="page-header__tabs">
        <div class="page-header__tabs-container">
          <nav class="page-header__tabs-nav">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              class="page-header__tab"
              :class="getTabClasses(tab)"
              @click="handleTabClick(tab)"
              :disabled="tab.disabled"
            >
              <i v-if="tab.icon" :class="tab.icon" class="page-header__tab-icon"></i>
              <span class="page-header__tab-label">{{ tab.label }}</span>
              <span v-if="tab.badge" class="page-header__tab-badge">
                {{ formatBadge(tab.badge) }}
              </span>
              <div v-if="tab.active" class="page-header__tab-indicator"></div>
            </button>
          </nav>
        </div>
      </div>

      <!-- 额外内容区域 -->
      <div v-if="$slots.extra" class="page-header__extra">
        <div class="page-header__extra-container">
          <slot name="extra"></slot>
        </div>
      </div>
    </div>

    <!-- 全局遮罩层 -->
    <div 
      v-if="showMoreMenu"
      class="page-header__overlay"
      @click="closeMoreMenu"
    ></div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

interface Action {
  id: string
  label: string
  icon?: string
  type?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
  disabled?: boolean
  badge?: string | number
  title?: string
  action?: () => void
}

interface Tab {
  id: string
  label: string
  icon?: string
  badge?: string | number
  disabled?: boolean
  active?: boolean
  path?: string
}

interface Props {
  title?: string
  subtitle?: string
  description?: string
  icon?: string
  badge?: string | number
  actions?: Action[]
  tabs?: Tab[]
  showBackButton?: boolean
  showBackText?: boolean
  backButtonText?: string
  backButtonIcon?: string
  backButtonTitle?: string
  showActions?: boolean
  showActionText?: boolean
  showBackground?: boolean
  backgroundImage?: string
  showPattern?: boolean
  showGradient?: boolean
  size?: 'small' | 'medium' | 'large' | 'hero'
  variant?: 'default' | 'minimal' | 'featured' | 'compact'
  alignment?: 'left' | 'center' | 'right' | 'space-between'
}

const props = withDefaults(defineProps<Props>(), {
  showBackButton: false,
  showBackText: false,
  backButtonText: '返回',
  backButtonIcon: 'fas fa-arrow-left',
  backButtonTitle: '返回上一页',
  showActions: true,
  showActionText: true,
  showBackground: true,
  showPattern: true,
  showGradient: true,
  size: 'medium',
  variant: 'default',
  alignment: 'space-between'
})

const emit = defineEmits<{
  'back-click': []
  'action-click': [action: Action]
  'tab-click': [tab: Tab]
}>()

const router = useRouter()

// 响应式状态
const showMoreMenu = ref(false)

// 计算属性
const headerClasses = computed(() => [
  'page-header',
  `page-header--${props.size}`,
  `page-header--${props.variant}`,
  `page-header--${props.alignment}`
])

const backgroundClasses = computed(() => [
  'page-header__background-inner',
  `page-header__background--${props.variant}`
])

const contentClasses = computed(() => [
  'page-header__content-inner',
  `page-header__content--${props.size}`,
  `page-header__content--${props.variant}`
])

const leftClasses = computed(() => [
  'page-header__left-inner',
  `page-header__left--${props.alignment}`
])

const rightClasses = computed(() => [
  'page-header__right-inner',
  `page-header__right--${props.alignment}`
])

const titleClasses = computed(() => [
  'page-header__title-inner',
  `page-header__title--${props.size}`
])

const subtitleClasses = computed(() => [
  'page-header__subtitle-inner',
  `page-header__subtitle--${props.size}`
])

const iconClasses = computed(() => [
  'page-header__icon-inner',
  `page-header__icon--${props.size}`,
  `page-header__icon--${props.variant}`
])

const badgeClasses = computed(() => [
  'page-header__badge-inner',
  `page-header__badge--${props.variant}`
])

const backgroundImageStyle = computed(() => ({
  backgroundImage: props.backgroundImage ? `url(${props.backgroundImage})` : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
}))

// 处理操作按钮
const primaryActions = computed(() => 
  props.actions?.filter(action => action.type === 'primary').slice(0, 2) || []
)

const secondaryActions = computed(() => 
  props.actions?.filter(action => action.type !== 'primary').slice(0, 2) || []
)

const moreActions = computed(() => {
  if (!props.actions) return []
  const remainingCount = props.actions.length - primaryActions.value.length - secondaryActions.value.length
  return remainingCount > 0 ? props.actions.slice(-(remainingCount)) : []
})

const filteredActions = computed(() => [...primaryActions.value, ...secondaryActions.value])

// 方法
const formatBadge = (badge: string | number) => {
  if (typeof badge === 'number') {
    return badge > 99 ? '99+' : badge.toString()
  }
  return badge
}

const handleBackClick = () => {
  emit('back-click')
  router.back()
}

const handleActionClick = (action: Action) => {
  if (action.disabled) return
  
  if (action.action) {
    action.action()
  }
  
  emit('action-click', action)
}

const handleMoreActionClick = (action: Action) => {
  handleActionClick(action)
  closeMoreMenu()
}

const handleTabClick = (tab: Tab) => {
  if (tab.disabled) return
  
  if (tab.path) {
    router.push(tab.path)
  }
  
  emit('tab-click', tab)
}

const toggleMoreMenu = () => {
  showMoreMenu.value = !showMoreMenu.value
}

const closeMoreMenu = () => {
  showMoreMenu.value = false
}

const getActionClasses = (action: Action) => [
  `page-header__action--${action.type || 'secondary'}`,
  {
    'page-header__action--disabled': action.disabled
  }
]

const getTabClasses = (tab: Tab) => [
  'page-header__tab-inner',
  {
    'page-header__tab--active': tab.active,
    'page-header__tab--disabled': tab.disabled
  }
]

// 点击外部关闭更多菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.page-header__more-actions')) {
    closeMoreMenu()
  }
}

// 键盘支持
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMoreMenu()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.page-header {
  position: relative;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  font-family: 'Space Mono', monospace;
  color: #1a202c;
  overflow: hidden;
}

/* 背景样式 */
.page-header__background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.page-header__background-inner {
  width: 100%;
  height: 100%;
  position: relative;
}

.page-header__background--default {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
}

.page-header__background--minimal {
  background: #ffffff;
}

.page-header__background--featured {
  background: linear-gradient(135deg, rgba(237, 137, 54, 0.05) 0%, rgba(56, 178, 172, 0.05) 100%);
}

.page-header__background--compact {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.page-header__background-image {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.1;
  z-index: 1;
}

.page-header__background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(circle at 20% 80%, rgba(237, 137, 54, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(56, 178, 172, 0.1) 0%, transparent 50%);
  z-index: 2;
}

.page-header__background-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, rgba(237, 137, 54, 0.02) 0%, rgba(56, 178, 172, 0.02) 100%);
  z-index: 3;
}

/* 内容区域 */
.page-header__content {
  position: relative;
  z-index: 10;
  padding: 0;
}

.page-header__content-inner {
  padding: 2rem 0;
}

.page-header__content--small {
  padding: 1rem 0;
}

.page-header__content--medium {
  padding: 2rem 0;
}

.page-header__content--large {
  padding: 3rem 0;
}

.page-header__content--hero {
  padding: 4rem 0;
}

.page-header__content--compact {
  padding: 1rem 0;
}

.page-header__container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 2rem;
}

/* 响应式网格布局 */
.page-header--left .page-header__container {
  grid-template-columns: auto 1fr;
  justify-content: flex-start;
}

.page-header--center .page-header__container {
  grid-template-columns: 1fr;
  justify-content: center;
  text-align: center;
}

.page-header--right .page-header__container {
  grid-template-columns: 1fr auto;
  justify-content: flex-end;
}

/* 左侧区域 */
.page-header__left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-header__left-inner {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-header--center .page-header__left-inner {
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
  text-align: center;
}

.page-header--right .page-header__left-inner {
  justify-content: flex-end;
}

.page-header__back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(237, 137, 54, 0.2);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  color: #ed8936;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
}

.page-header__back-button:hover {
  background: rgba(237, 137, 54, 0.1);
  border-color: rgba(237, 137, 54, 0.4);
  transform: translateY(-1px);
}

.page-header__back-icon {
  font-size: 0.875rem;
}

.page-header__back-text {
  font-family: 'Playfair Display', serif;
}

.page-header__icon-container {
  flex-shrink: 0;
}

.page-header__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(237, 137, 54, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ed8936;
  font-size: 1.25rem;
  transition: all 0.2s;
}

.page-header__icon--small {
  width: 40px;
  height: 40px;
  font-size: 1rem;
}

.page-header__icon--large {
  width: 56px;
  height: 56px;
  font-size: 1.5rem;
}

.page-header__icon--hero {
  width: 64px;
  height: 64px;
  font-size: 1.75rem;
}

.page-header__icon--featured {
  background: linear-gradient(135deg, rgba(237, 137, 54, 0.15) 0%, rgba(56, 178, 172, 0.15) 100%);
  border: 1px solid rgba(237, 137, 54, 0.2);
}

.page-header__title-section {
  min-width: 0;
  flex: 1;
}

.page-header__title {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.page-header__title-inner {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.page-header__title--small {
  font-size: 1.5rem;
}

.page-header__title--medium {
  font-size: 2rem;
}

.page-header__title--large {
  font-size: 2.5rem;
}

.page-header__title--hero {
  font-size: 3rem;
}

.page-header__badge {
  background: #ed8936;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
  font-family: 'Space Mono', monospace;
}

.page-header__badge-inner {
  background: #ed8936;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
  font-family: 'Space Mono', monospace;
}

.page-header__badge--featured {
  background: linear-gradient(135deg, #ed8936 0%, #38b2ac 100%);
}

.page-header__subtitle {
  color: #718096;
  margin: 0.5rem 0 0 0;
  line-height: 1.4;
}

.page-header__subtitle-inner {
  color: #718096;
  margin: 0.5rem 0 0 0;
  line-height: 1.4;
}

.page-header__subtitle--small {
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.page-header__subtitle--medium {
  font-size: 1rem;
  margin-top: 0.5rem;
}

.page-header__subtitle--large {
  font-size: 1.125rem;
  margin-top: 0.75rem;
}

.page-header__subtitle--hero {
  font-size: 1.25rem;
  margin-top: 1rem;
}

.page-header__description {
  margin-top: 1rem;
  color: #4a5568;
  line-height: 1.6;
}

/* 中间区域 */
.page-header__center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 右侧区域 */
.page-header__right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}

.page-header__right-inner {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}

.page-header--center .page-header__right-inner {
  justify-content: center;
  margin-top: 1.5rem;
}

.page-header--left .page-header__right-inner {
  margin-left: auto;
}

.page-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-header__action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(203, 213, 224, 0.8);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: 'Space Mono', monospace;
  white-space: nowrap;
}

.page-header__action--primary {
  background: #ed8936;
  color: white;
  border-color: #ed8936;
}

.page-header__action--primary:hover {
  background: #dd7724;
  border-color: #dd7724;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(237, 137, 54, 0.3);
}

.page-header__action--secondary {
  background: rgba(255, 255, 255, 0.8);
  color: #4a5568;
  border-color: rgba(203, 213, 224, 0.8);
}

.page-header__action--secondary:hover {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
  border-color: rgba(237, 137, 54, 0.3);
  transform: translateY(-1px);
}

.page-header__action--danger {
  background: #e53e3e;
  color: white;
  border-color: #e53e3e;
}

.page-header__action--danger:hover {
  background: #c53030;
  border-color: #c53030;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(229, 62, 62, 0.3);
}

.page-header__action--success {
  background: #48bb78;
  color: white;
  border-color: #48bb78;
}

.page-header__action--success:hover {
  background: #38a169;
  border-color: #38a169;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(72, 187, 120, 0.3);
}

.page-header__action--warning {
  background: #ed8936;
  color: white;
  border-color: #ed8936;
}

.page-header__action--warning:hover {
  background: #dd7724;
  border-color: #dd7724;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(237, 137, 54, 0.3);
}

.page-header__action--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.page-header__action-icon {
  font-size: 0.875rem;
}

.page-header__action-text {
  font-family: 'Playfair Display', serif;
}

.page-header__action-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.0625rem 0.25rem;
  border-radius: 6px;
  min-width: 16px;
  text-align: center;
  line-height: 1.2;
}

.page-header__more-actions {
  position: relative;
}

.page-header__more-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(203, 213, 224, 0.8);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
}

.page-header__more-button:hover {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
  border-color: rgba(237, 137, 54, 0.3);
}

.page-header__more-button--active {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
  border-color: rgba(237, 137, 54, 0.3);
}

.page-header__more-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(237, 137, 54, 0.2);
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(45, 55, 72, 0.1);
  z-index: 100;
  min-width: 160px;
}

.page-header__more-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  color: #4a5568;
}

.page-header__more-item:hover {
  background: rgba(237, 137, 54, 0.05);
  color: #ed8936;
}

/* 标签页导航 */
.page-header__tabs {
  border-top: 1px solid rgba(237, 137, 54, 0.1);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(5px);
}

.page-header__tabs-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}

.page-header__tabs-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.page-header__tabs-nav::-webkit-scrollbar {
  display: none;
}

.page-header__tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  color: #718096;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: 'Playfair Display', serif;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
}

.page-header__tab:hover {
  color: #ed8936;
  background: rgba(237, 137, 54, 0.05);
}

.page-header__tab-inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  color: #718096;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: 'Playfair Display', serif;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
}

.page-header__tab--active {
  color: #ed8936;
  border-bottom-color: #ed8936;
}

.page-header__tab--disabled {
  color: #a0aec0;
  cursor: not-allowed;
  opacity: 0.6;
}

.page-header__tab-icon {
  font-size: 0.875rem;
}

.page-header__tab-badge {
  background: #ed8936;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.0625rem 0.25rem;
  border-radius: 6px;
  min-width: 16px;
  text-align: center;
  line-height: 1.2;
}

.page-header__tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #ed8936;
}

/* 额外内容区域 */
.page-header__extra {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  border-top: 1px solid rgba(237, 137, 54, 0.1);
}

.page-header__extra-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
}

/* 遮罩层 */
.page-header__overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(45, 55, 72, 0.1);
  z-index: 90;
}

/* 动画效果 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .page-header__container {
    padding: 0 1.5rem;
    gap: 1.5rem;
  }
  
  .page-header__tabs-container {
    padding: 0 1.5rem;
  }
  
  .page-header__extra-container {
    padding: 1.5rem;
  }
  
  .page-header__title--hero {
    font-size: 2.5rem;
  }
}

@media (max-width: 768px) {
  .page-header__container {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0 1rem;
  }
  
  .page-header__left-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .page-header__right-inner {
    justify-content: flex-start;
  }
  
  .page-header__actions {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .page-header__action {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }
  
  .page-header__tabs-container {
    padding: 0 1rem;
  }
  
  .page-header__tab-inner {
    padding: 0.75rem 1rem;
    font-size: 0.8125rem;
  }
  
  .page-header__extra-container {
    padding: 1rem;
  }
  
  .page-header__title--large {
    font-size: 2rem;
  }
  
  .page-header__title--hero {
    font-size: 2.25rem;
  }
  
  .show-action-text .page-header__action-text {
    display: none;
  }
  
  .show-back-text .page-header__back-text {
    display: none;
  }
}

@media (max-width: 640px) {
  .page-header__content-inner {
    padding: 1rem 0;
  }
  
  .page-header__title--medium {
    font-size: 1.5rem;
  }
  
  .page-header__title--large {
    font-size: 1.75rem;
  }
  
  .page-header__title--hero {
    font-size: 2rem;
  }
  
  .page-header__icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .page-header__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>