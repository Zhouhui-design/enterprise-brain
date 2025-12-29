<template>
  <nav class="breadcrumb-nav" :class="navClasses">
    <div class="breadcrumb-nav__container">
      <!-- 面包屑列表 -->
      <ol class="breadcrumb-nav__list">
        <!-- 首页链接 -->
        <li class="breadcrumb-nav__item breadcrumb-nav__item--home">
          <router-link 
            v-if="showHome"
            :to="homePath"
            class="breadcrumb-nav__link breadcrumb-nav__link--home"
            :title="homeLabel"
          >
            <i class="fas fa-home breadcrumb-nav__home-icon"></i>
            <span v-if="showHomeText" class="breadcrumb-nav__home-text">{{ homeLabel }}</span>
          </router-link>
        </li>

        <!-- 分隔符 -->
        <li 
          v-if="showHome && items.length > 0" 
          class="breadcrumb-nav__separator"
          :class="separatorClasses"
        >
          <i :class="separatorIcon"></i>
        </li>

        <!-- 面包屑项 -->
        <template v-for="(item, index) in items" :key="index">
          <li 
            class="breadcrumb-nav__item"
            :class="getItemClasses(item, index)"
          >
            <!-- 可点击的链接 -->
            <router-link 
              v-if="item.path && index < items.length - 1"
              :to="item.path"
              class="breadcrumb-nav__link"
              :title="item.label"
            >
              <i v-if="item.icon" :class="item.icon" class="breadcrumb-nav__item-icon"></i>
              <span class="breadcrumb-nav__item-text">{{ item.label }}</span>
              <span v-if="item.badge" class="breadcrumb-nav__item-badge">
                {{ formatBadge(item.badge) }}
              </span>
            </router-link>
            
            <!-- 当前页面的文本 -->
            <span v-else class="breadcrumb-nav__current">
              <i v-if="item.icon" :class="item.icon" class="breadcrumb-nav__item-icon"></i>
              <span class="breadcrumb-nav__current-text">{{ item.label }}</span>
              <span v-if="item.badge" class="breadcrumb-nav__current-badge">
                {{ formatBadge(item.badge) }}
              </span>
            </span>
          </li>

          <!-- 分隔符 -->
          <li 
            v-if="index < items.length - 1" 
            class="breadcrumb-nav__separator"
            :class="separatorClasses"
          >
            <i :class="separatorIcon"></i>
          </li>
        </template>

        <!-- 自定义结尾内容 -->
        <li v-if="$slots.suffix" class="breadcrumb-nav__item breadcrumb-nav__item--suffix">
          <slot name="suffix"></slot>
        </li>
      </ol>

      <!-- 额外信息（如搜索、筛选等） -->
      <div v-if="$slots.extra" class="breadcrumb-nav__extra">
        <slot name="extra"></slot>
      </div>
    </div>

    <!-- 展开菜单（移动端） -->
    <div v-if="showExpandButton && isOverflowing" class="breadcrumb-nav__expand">
      <button 
        class="breadcrumb-nav__expand-btn"
        @click="toggleExpandMenu"
        :class="{ 'breadcrumb-nav__expand-btn--active': showExpandMenu }"
      >
        <i class="fas fa-ellipsis-h"></i>
      </button>
      
      <!-- 展开菜单内容 -->
      <div 
        v-if="showExpandMenu" 
        class="breadcrumb-nav__expand-menu"
        :class="expandMenuClasses"
      >
        <div class="breadcrumb-nav__expand-header">
          <span>导航路径</span>
          <button 
            class="breadcrumb-nav__expand-close"
            @click="closeExpandMenu"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="breadcrumb-nav__expand-content">
          <!-- 首页 -->
          <router-link 
            v-if="showHome"
            :to="homePath"
            class="breadcrumb-nav__expand-item breadcrumb-nav__expand-item--home"
          >
            <i class="fas fa-home"></i>
            <span>{{ homeLabel }}</span>
          </router-link>
          
          <!-- 面包屑项 -->
          <template v-for="(item, index) in items" :key="index">
            <router-link 
              v-if="item.path && index < items.length - 1"
              :to="item.path"
              class="breadcrumb-nav__expand-item"
            >
              <i v-if="item.icon" :class="item.icon"></i>
              <span>{{ item.label }}</span>
            </router-link>
            
            <div 
              v-else
              class="breadcrumb-nav__expand-item breadcrumb-nav__expand-item--current"
            >
              <i v-if="item.icon" :class="item.icon"></i>
              <span>{{ item.label }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

// Props定义
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  showHome: {
    type: Boolean,
    default: true
  },
  homeLabel: {
    type: String,
    default: '首页'
  },
  homePath: {
    type: String,
    default: '/'
  },
  showHomeText: {
    type: Boolean,
    default: false
  },
  separator: {
    type: String,
    default: 'chevron-right'
  },
  variant: {
    type: String,
    default: 'default'
  },
  maxItems: {
    type: Number,
    default: 5
  },
  showExpandButton: {
    type: Boolean,
    default: true
  },
  collapsible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['item-click'])

const router = useRouter()

// 响应式状态
const showExpandMenu = ref(false)
const isOverflowing = ref(false)
const containerRef = ref(null)

// 计算属性
const navClasses = computed(() => [
  'breadcrumb-nav',
  `breadcrumb-nav--${props.variant}`,
  {
    'breadcrumb-nav--overflowing': isOverflowing.value,
    'breadcrumb-nav--expanded': showExpandMenu.value
  }
])

const separatorClasses = computed(() => [
  'breadcrumb-nav__separator-inner',
  `breadcrumb-nav__separator--${props.separator}`
])

const expandMenuClasses = computed(() => [
  'breadcrumb-nav__expand-menu-inner',
  `breadcrumb-nav__expand-menu--${props.variant}`
])

const separatorIcon = computed(() => {
  const iconMap = {
    'chevron-right': 'fas fa-chevron-right',
    'chevron-left': 'fas fa-chevron-left',
    'slash': 'fas fa-slash',
    'greater-than': 'fas fa-greater-than',
    'angle-right': 'fas fa-angle-right',
    'arrow-right': 'fas fa-arrow-right',
    'dot': 'fas fa-circle'
  }
  return iconMap[props.separator] || iconMap['chevron-right']
})

// 处理溢出的面包屑项
const visibleItems = computed(() => {
  if (!isOverflowing.value || !props.collapsible) {
    return props.items
  }
  
  const maxVisible = props.maxItems
  if (props.items.length <= maxVisible) {
    return props.items
  }
  
  // 保留前面的几项和最后一项
  const keepFirst = Math.max(1, maxVisible - 2)
  const result = [
    ...props.items.slice(0, keepFirst),
    {
      label: '...',
      icon: 'fas fa-ellipsis-h',
      hidden: true
    },
    ...props.items.slice(-1)
  ]
  
  return result
})

// 方法
const getItemClasses = (item, index) => [
  'breadcrumb-nav__item-inner',
  {
    'breadcrumb-nav__item--current': index === props.items.length - 1,
    'breadcrumb-nav__item--disabled': item.disabled,
    'breadcrumb-nav__item--hidden': item.hidden
  }
]

const formatBadge = (badge) => {
  if (typeof badge === 'number') {
    return badge > 99 ? '99+' : badge.toString()
  }
  return badge
}

const checkOverflow = async () => {
  await nextTick()
  if (!containerRef.value) return
  
  const container = containerRef.value
  const list = container.querySelector('.breadcrumb-nav__list')
  if (!list) return
  
  const isOverflow = list.scrollWidth > list.clientWidth
  isOverflowing.value = isOverflow
}

const toggleExpandMenu = () => {
  showExpandMenu.value = !showExpandMenu.value
}

const closeExpandMenu = () => {
  showExpandMenu.value = false
}

const handleItemClick = (item, index) => {
  if (item.disabled) return
  
  emit('item-click', item, index)
  
  if (item.path && index < props.items.length - 1) {
    try {
      router.push(item.path)
    } catch (error) {
      console.warn('导航失败:', error)
    }
  }
  
  closeExpandMenu()
}

// 点击外部关闭展开菜单
const handleClickOutside = (event) => {
  const target = event.target
  if (!target.closest('.breadcrumb-nav')) {
    closeExpandMenu()
  }
}

// 响应式处理
const handleResize = () => {
  checkOverflow()
}

// 键盘导航支持
const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    closeExpandMenu()
  }
}

// 生命周期
onMounted(() => {
  checkOverflow()
  window.addEventListener('resize', handleResize)
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.breadcrumb-nav {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  border-bottom: 1px solid rgba(237, 137, 54, 0.05);
  padding: 0;
  font-family: 'Space Mono', monospace;
  position: relative;
}

.breadcrumb-nav__container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 2rem;
  gap: 1rem;
  max-width: 100%;
}

.breadcrumb-nav__list {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.breadcrumb-nav__list::-webkit-scrollbar {
  display: none;
}

.breadcrumb-nav__item {
  display: flex;
  align-items: center;
  white-space: nowrap;
  flex-shrink: 0;
}

.breadcrumb-nav__item-inner {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.breadcrumb-nav__item--current .breadcrumb-nav__current-text {
  color: #2d3748;
  font-weight: 600;
  font-family: 'Playfair Display', serif;
}

.breadcrumb-nav__item--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.breadcrumb-nav__item--hidden {
  color: #a0aec0;
  cursor: default;
}

.breadcrumb-nav__link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #4a5568;
  text-decoration: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.breadcrumb-nav__link:hover {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.breadcrumb-nav__link--home {
  padding: 0.25rem;
}

.breadcrumb-nav__current {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #2d3748;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.breadcrumb-nav__home-icon,
.breadcrumb-nav__item-icon {
  font-size: 0.75rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.breadcrumb-nav__link:hover .breadcrumb-nav__home-icon,
.breadcrumb-nav__link:hover .breadcrumb-nav__item-icon {
  opacity: 1;
}

.breadcrumb-nav__home-text {
  margin-left: 0.25rem;
}

.breadcrumb-nav__item-text,
.breadcrumb-nav__current-text {
  line-height: 1.2;
}

.breadcrumb-nav__item-badge,
.breadcrumb-nav__current-badge {
  background: #ed8936;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.0625rem 0.25rem;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
  line-height: 1.2;
  margin-left: 0.25rem;
}

.breadcrumb-nav__separator {
  display: flex;
  align-items: center;
  color: #a0aec0;
  font-size: 0.625rem;
  flex-shrink: 0;
  margin: 0 0.25rem;
}

.breadcrumb-nav__separator-inner {
  display: flex;
  align-items: center;
}

.breadcrumb-nav__separator--dot {
  color: #cbd5e0;
  font-size: 0.375rem;
}

.breadcrumb-nav__extra {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

/* 展开菜单 */
.breadcrumb-nav__expand {
  position: relative;
  flex-shrink: 0;
}

.breadcrumb-nav__expand-btn {
  background: none;
  border: none;
  color: #4a5568;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.breadcrumb-nav__expand-btn:hover {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.breadcrumb-nav__expand-btn--active {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.breadcrumb-nav__expand-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(237, 137, 54, 0.2);
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(45, 55, 72, 0.1);
  z-index: 100;
  min-width: 200px;
  max-width: 300px;
}

.breadcrumb-nav__expand-menu-inner {
  padding: 0.5rem;
}

.breadcrumb-nav__expand-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(237, 137, 54, 0.1);
  margin-bottom: 0.5rem;
}

.breadcrumb-nav__expand-header span {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  color: #2d3748;
  font-size: 0.875rem;
}

.breadcrumb-nav__expand-close {
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.breadcrumb-nav__expand-close:hover {
  color: #4a5568;
  background: rgba(203, 213, 224, 0.3);
}

.breadcrumb-nav__expand-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.breadcrumb-nav__expand-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  text-decoration: none;
  color: #4a5568;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.breadcrumb-nav__expand-item:hover {
  background: rgba(237, 137, 54, 0.05);
  color: #ed8936;
}

.breadcrumb-nav__expand-item--current {
  color: #2d3748;
  font-weight: 600;
  font-family: 'Playfair Display', serif;
  background: rgba(237, 137, 54, 0.05);
  pointer-events: none;
}

.breadcrumb-nav__expand-item--home {
  color: #ed8936;
}

/* 变体样式 */
.breadcrumb-nav--minimal {
  background: transparent;
  border-bottom: none;
}

.breadcrumb-nav--minimal .breadcrumb-nav__container {
  padding: 0.5rem 2rem;
}

.breadcrumb-nav--minimal .breadcrumb-nav__link {
  padding: 0.125rem 0.25rem;
}

.breadcrumb-nav--minimal .breadcrumb-nav__current {
  padding: 0.125rem 0.25rem;
}

.breadcrumb-nav--minimal .breadcrumb-nav__item-icon {
  display: none;
}

.breadcrumb-nav--detailed {
  background: linear-gradient(135deg, rgba(247, 250, 252, 0.9) 0%, rgba(237, 242, 247, 0.9) 100%);
  border-bottom: 1px solid rgba(237, 137, 54, 0.1);
}

.breadcrumb-nav--detailed .breadcrumb-nav__container {
  padding: 1rem 2rem;
}

.breadcrumb-nav--detailed .breadcrumb-nav__link {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}

.breadcrumb-nav--detailed .breadcrumb-nav__current {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: rgba(237, 137, 54, 0.05);
  border: 1px solid rgba(237, 137, 54, 0.1);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .breadcrumb-nav__container {
    padding: 0.75rem 1rem;
  }
  
  .breadcrumb-nav__list {
    gap: 0.25rem;
  }
  
  .breadcrumb-nav__separator {
    margin: 0 0.125rem;
  }
}

@media (max-width: 768px) {
  .breadcrumb-nav__container {
    padding: 0.5rem 1rem;
  }
  
  .breadcrumb-nav__expand-menu {
    right: -1rem;
    left: -1rem;
    width: auto;
    max-width: none;
    border-radius: 8px 8px 0 0;
  border-left: none;
    border-right: none;
  }
  
  .breadcrumb-nav__home-text {
    display: none;
  }
  
  .breadcrumb-nav__item-badge,
  .breadcrumb-nav__current-badge {
    display: none;
  }
}

@media (max-width: 640px) {
  .breadcrumb-nav__container {
    padding: 0.5rem 0.75rem;
  }
  
  .breadcrumb-nav__link {
    font-size: 0.8125rem;
  }
  
  .breadcrumb-nav__current {
    font-size: 0.8125rem;
  }
  
  .breadcrumb-nav__extra {
    gap: 0.5rem;
  }
}

/* 动画效果 */
.breadcrumb-nav__expand-menu {
  animation: fadeInScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 溢出状态 */
.breadcrumb-nav--overflowing .breadcrumb-nav__list {
  mask-image: linear-gradient(to right, black 90%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, black 90%, transparent 100%);
}
</style>