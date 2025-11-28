<template>
  <nav class="sidebar-menu" :class="menuClasses">
    <!-- 自定义头部插槽 -->
    <div v-if="$slots.header && !mobile" class="sidebar-menu__header">
      <slot name="header"></slot>
    </div>

    <!-- 菜单项列表 -->
    <ul class="sidebar-menu__list">
      <template v-for="item in processedMenuItems" :key="item.id">
        <!-- 一级菜单项 -->
        <li v-if="!item.children" class="sidebar-menu__item">
          <button
            class="sidebar-menu__button"
            :class="getButtonClasses(item)"
            @click="handleMenuClick(item)"
            :title="collapsed ? item.label : ''"
          >
            <i v-if="item.icon" :class="item.icon" class="sidebar-menu__icon"></i>
            <div v-if="!collapsed" class="sidebar-menu__content">
              <span class="sidebar-menu__label">{{ item.label }}</span>
              <span v-if="item.badge" class="sidebar-menu__badge">
                {{ formatBadge(item.badge) }}
              </span>
            </div>
            <div v-if="item.active" class="sidebar-menu__active-indicator"></div>
          </button>
        </li>

        <!-- 有子菜单的项 -->
        <li v-else class="sidebar-menu__item sidebar-menu__item--has-children">
          <button
            class="sidebar-menu__button"
            :class="getButtonClasses(item)"
            @click="toggleSubmenu(item)"
            :title="collapsed ? item.label : ''"
          >
            <i v-if="item.icon" :class="item.icon" class="sidebar-menu__icon"></i>
            <div v-if="!collapsed" class="sidebar-menu__content">
              <span class="sidebar-menu__label">{{ item.label }}</span>
              <div class="sidebar-menu__controls">
                <span v-if="item.badge" class="sidebar-menu__badge">
                  {{ formatBadge(item.badge) }}
                </span>
                <i 
                  class="fas fa-chevron-down sidebar-menu__arrow"
                  :class="{ 'sidebar-menu__arrow--expanded': item.expanded }"
                ></i>
              </div>
            </div>
            <div v-if="item.active" class="sidebar-menu__active-indicator"></div>
          </button>

          <!-- 子菜单 -->
          <transition name="submenu">
            <ul 
              v-if="!collapsed && item.expanded" 
              class="sidebar-menu__submenu"
            >
              <li 
                v-for="child in item.children" 
                :key="child.id"
                class="sidebar-menu__submenu-item"
              >
                <button
                  class="sidebar-menu__submenu-button"
                  :class="getSubmenuButtonClasses(child)"
                  @click="handleMenuClick(child)"
                >
                  <i v-if="child.icon" :class="child.icon" class="sidebar-menu__submenu-icon"></i>
                  <span class="sidebar-menu__submenu-label">{{ child.label }}</span>
                  <span v-if="child.badge" class="sidebar-menu__submenu-badge">
                    {{ formatBadge(child.badge) }}
                  </span>
                  <div v-if="child.active" class="sidebar-menu__submenu-active-indicator"></div>
                </button>
              </li>
            </ul>
          </transition>
        </li>
      </template>
    </ul>

    <!-- 分组菜单项 -->
    <div v-if="groupedMenuItems.length > 0" class="sidebar-menu__groups">
      <div 
        v-for="group in groupedMenuItems" 
        :key="group.title"
        class="sidebar-menu__group"
      >
        <div 
          v-if="!collapsed"
          class="sidebar-menu__group-title"
        >
          {{ group.title }}
        </div>
        <ul class="sidebar-menu__group-list">
          <template v-for="item in group.items" :key="item.id">
            <!-- 一级菜单项 -->
            <li v-if="!item.children" class="sidebar-menu__item">
              <button
                class="sidebar-menu__button"
                :class="getButtonClasses(item)"
                @click="handleMenuClick(item)"
                :title="collapsed ? item.label : ''"
              >
                <i v-if="item.icon" :class="item.icon" class="sidebar-menu__icon"></i>
                <div v-if="!collapsed" class="sidebar-menu__content">
                  <span class="sidebar-menu__label">{{ item.label }}</span>
                  <span v-if="item.badge" class="sidebar-menu__badge">
                    {{ formatBadge(item.badge) }}
                  </span>
                </div>
                <div v-if="item.active" class="sidebar-menu__active-indicator"></div>
              </button>
            </li>

            <!-- 有子菜单的项 -->
            <li v-else class="sidebar-menu__item sidebar-menu__item--has-children">
              <button
                class="sidebar-menu__button"
                :class="getButtonClasses(item)"
                @click="toggleSubmenu(item)"
                :title="collapsed ? item.label : ''"
              >
                <i v-if="item.icon" :class="item.icon" class="sidebar-menu__icon"></i>
                <div v-if="!collapsed" class="sidebar-menu__content">
                  <span class="sidebar-menu__label">{{ item.label }}</span>
                  <div class="sidebar-menu__controls">
                    <span v-if="item.badge" class="sidebar-menu__badge">
                      {{ formatBadge(item.badge) }}
                    </span>
                    <i 
                      class="fas fa-chevron-down sidebar-menu__arrow"
                      :class="{ 'sidebar-menu__arrow--expanded': item.expanded }"
                    ></i>
                  </div>
                </div>
                <div v-if="item.active" class="sidebar-menu__active-indicator"></div>
              </button>

              <!-- 子菜单 -->
              <transition name="submenu">
                <ul 
                  v-if="!collapsed && item.expanded" 
                  class="sidebar-menu__submenu"
                >
                  <li 
                    v-for="child in item.children" 
                    :key="child.id"
                    class="sidebar-menu__submenu-item"
                  >
                    <button
                      class="sidebar-menu__submenu-button"
                      :class="getSubmenuButtonClasses(child)"
                      @click="handleMenuClick(child)"
                    >
                      <i v-if="child.icon" :class="child.icon" class="sidebar-menu__submenu-icon"></i>
                      <span class="sidebar-menu__submenu-label">{{ child.label }}</span>
                      <span v-if="child.badge" class="sidebar-menu__submenu-badge">
                        {{ formatBadge(child.badge) }}
                      </span>
                      <div v-if="child.active" class="sidebar-menu__submenu-active-indicator"></div>
                    </button>
                  </li>
                </ul>
              </transition>
            </li>
          </template>
        </ul>
      </div>
    </div>

    <!-- 自定义底部插槽 -->
    <div v-if="$slots.footer && !collapsed" class="sidebar-menu__footer">
      <slot name="footer"></slot>
    </div>

    <!-- 折叠状态的悬浮提示 -->
    <div 
      v-if="showTooltip && tooltipItem" 
      class="sidebar-menu__tooltip"
      :style="tooltipStyle"
    >
      {{ tooltipItem.label }}
      <div v-if="tooltipItem.children" class="sidebar-menu__tooltip-submenu-hint">
        包含 {{ tooltipItem.children.length }} 个子菜单
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, reactive, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

interface MenuItem {
  id: string
  label: string
  icon?: string
  path?: string
  badge?: string | number
  active?: boolean
  children?: MenuItem[]
  group?: string
  expanded?: boolean
  disabled?: boolean
  external?: boolean
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

interface Props {
  menuItems?: MenuItem[]
  activeItem?: string
  collapsed?: boolean
  mobile?: boolean
  showIcons?: boolean
  expandOnHover?: boolean
  groupBy?: string
}

const props = withDefaults(defineProps<Props>(), {
  menuItems: () => [],
  showIcons: true,
  expandOnHover: false,
  groupBy: ''
})

const emit = defineEmits<{
  'menu-click': [item: MenuItem]
  'submenu-toggle': [item: MenuItem, expanded: boolean]
}>()

const router = useRouter()

// 响应式状态
const showTooltip = ref(false)
const tooltipItem = ref<MenuItem | null>(null)
const tooltipStyle = reactive({ top: '0px', left: '0px' })
const hoverTimer = ref<NodeJS.Timeout | null>(null)

// 处理菜单项，确保每个项都有必要的状态
const processedMenuItems = computed(() => {
  return props.menuItems
    .filter(item => !props.groupBy || !item.group)
    .map(item => ({
      ...item,
      active: item.active || item.id === props.activeItem,
      expanded: item.expanded || false
    }))
})

const groupedMenuItems = computed(() => {
  if (!props.groupBy) return []
  
  const groups: Record<string, MenuItem[]> = {}
  
  props.menuItems.forEach(item => {
    if (item.group) {
      if (!groups[item.group]) {
        groups[item.group] = []
      }
      groups[item.group].push({
        ...item,
        active: item.active || item.id === props.activeItem,
        expanded: item.expanded || false
      })
    }
  })
  
  return Object.entries(groups).map(([title, items]) => ({
    title,
    items
  }))
})

// 计算属性
const menuClasses = computed(() => [
  'sidebar-menu',
  {
    'sidebar-menu--collapsed': props.collapsed,
    'sidebar-menu--mobile': props.mobile
  }
])

// 方法
const getButtonClasses = (item: MenuItem) => [
  'sidebar-menu__button-inner',
  {
    'sidebar-menu__button--active': item.active,
    'sidebar-menu__button--disabled': item.disabled,
    'sidebar-menu__button--has-children': item.children && item.children.length > 0
  }
]

const getSubmenuButtonClasses = (item: MenuItem) => [
  'sidebar-menu__submenu-button-inner',
  {
    'sidebar-menu__submenu-button--active': item.active,
    'sidebar-menu__submenu-button--disabled': item.disabled
  }
]

const handleMenuClick = async (item: MenuItem) => {
  if (item.disabled) return
  
  // 更新活动状态
  updateActiveStates(item)
  
  // 导航处理
  if (item.path) {
    if (item.external) {
      window.open(item.path, '_blank')
    } else {
      try {
        await router.push(item.path)
      } catch (error) {
        console.warn('导航失败:', error)
      }
    }
  }
  
  emit('menu-click', item)
}

const toggleSubmenu = (item: MenuItem) => {
  if (!item.children || item.children.length === 0) return
  
  item.expanded = !item.expanded
  emit('submenu-toggle', item, item.expanded)
}

const updateActiveStates = (activeItem: MenuItem) => {
  const updateItems = (items: MenuItem[]) => {
    items.forEach(item => {
      item.active = item.id === activeItem.id
      
      if (item.children) {
        updateItems(item.children)
        
        // 如果子菜单项被激活，自动展开父菜单
        if (item.children.some(child => child.active) && !item.expanded) {
          item.expanded = true
        }
      }
    })
  }
  
  updateItems(props.menuItems)
}

const formatBadge = (badge: string | number) => {
  if (typeof badge === 'number') {
    return badge > 99 ? '99+' : badge.toString()
  }
  return badge
}

const showTooltipForItem = (event: MouseEvent, item: MenuItem) => {
  if (!props.collapsed || !props.expandOnHover) return
  
  clearTimeout(hoverTimer.value!)
  
  hoverTimer.value = setTimeout(() => {
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    
    tooltipItem.value = item
    tooltipStyle.top = `${rect.top + window.scrollY}px`
    tooltipStyle.left = `${rect.right + 10}px`
    showTooltip.value = true
  }, 300)
}

const hideTooltip = () => {
  clearTimeout(hoverTimer.value!)
  showTooltip.value = false
  tooltipItem.value = null
}

// 键盘导航支持
const handleKeyDown = (event: KeyboardEvent) => {
  // 这里可以添加键盘导航逻辑
}

// 生命周期
onMounted(() => {
  if (!props.mobile) {
    document.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  if (!props.mobile) {
    document.removeEventListener('keydown', handleKeyDown)
  }
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value)
  }
})
</script>

<style scoped>
.sidebar-menu {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
  font-family: 'Space Mono', monospace;
  position: relative;
}

.sidebar-menu__header {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.sidebar-menu__list {
  flex: 1;
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-menu__item {
  margin: 0;
  position: relative;
}

.sidebar-menu__button {
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 48px;
}

.sidebar-menu__button-inner {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin: 0.25rem;
  position: relative;
  color: rgba(247, 250, 252, 0.8);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-menu__button:hover .sidebar-menu__button-inner {
  background: rgba(237, 137, 54, 0.1);
  color: rgba(247, 250, 252, 0.9);
}

.sidebar-menu__button--active .sidebar-menu__button-inner {
  background: rgba(237, 137, 54, 0.2);
  color: #f7fafc;
  font-weight: 600;
}

.sidebar-menu__button--disabled .sidebar-menu__button-inner {
  color: rgba(247, 250, 252, 0.3);
  cursor: not-allowed;
}

.sidebar-menu__icon {
  font-size: 1.125rem;
  width: 1.125rem;
  text-align: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.sidebar-menu__content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  margin-left: 0.75rem;
}

.sidebar-menu__label {
  font-family: 'Playfair Display', serif;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.sidebar-menu__controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.sidebar-menu__badge {
  background: #e53e3e;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
}

.sidebar-menu__arrow {
  font-size: 0.625rem;
  color: rgba(247, 250, 252, 0.6);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-menu__arrow--expanded {
  transform: rotate(180deg);
}

.sidebar-menu__active-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: #ed8936;
  border-radius: 0 2px 2px 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.sidebar-menu__button--active .sidebar-menu__active-indicator {
  opacity: 1;
}

/* 子菜单 */
.sidebar-menu__submenu {
  list-style: none;
  margin: 0;
  padding: 0;
  background: rgba(45, 55, 72, 0.3);
  border-radius: 0 0 8px 8px;
  margin: 0 0.5rem 0.25rem;
  overflow: hidden;
}

.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
  opacity: 0;
}

.submenu-enter-to,
.submenu-leave-from {
  max-height: 300px;
  opacity: 1;
}

.sidebar-menu__submenu-item {
  position: relative;
}

.sidebar-menu__submenu-button {
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 40px;
}

.sidebar-menu__submenu-button-inner {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem 0.5rem 3.5rem;
  margin: 0.125rem 0.5rem;
  border-radius: 6px;
  position: relative;
  color: rgba(247, 250, 252, 0.7);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.8125rem;
}

.sidebar-menu__submenu-button:hover .sidebar-menu__submenu-button-inner {
  background: rgba(237, 137, 54, 0.08);
  color: rgba(247, 250, 252, 0.8);
}

.sidebar-menu__submenu-button--active .sidebar-menu__submenu-button-inner {
  background: rgba(237, 137, 54, 0.15);
  color: #f7fafc;
  font-weight: 600;
}

.sidebar-menu__submenu-icon {
  font-size: 0.875rem;
  width: 0.875rem;
  text-align: center;
  flex-shrink: 0;
  margin-right: 0.75rem;
  transition: all 0.2s;
}

.sidebar-menu__submenu-label {
  font-family: 'Space Mono', monospace;
  font-size: 0.8125rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.sidebar-menu__submenu-badge {
  background: #e53e3e;
  color: white;
  font-size: 0.5625rem;
  font-weight: 600;
  padding: 0.0625rem 0.25rem;
  border-radius: 6px;
  min-width: 16px;
  text-align: center;
  line-height: 1.2;
}

.sidebar-menu__submenu-active-indicator {
  position: absolute;
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 16px;
  background: #ed8936;
  border-radius: 0 1px 1px 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.sidebar-menu__submenu-button--active .sidebar-menu__submenu-active-indicator {
  opacity: 1;
}

/* 分组菜单 */
.sidebar-menu__groups {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-menu__group {
  margin-bottom: 1rem;
}

.sidebar-menu__group-title {
  font-family: 'Playfair Display', serif;
  font-size: 0.6875rem;
  font-weight: 600;
  color: rgba(247, 250, 252, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.0625rem;
  padding: 0.5rem 1rem;
  margin: 0.5rem 0 0.25rem;
}

.sidebar-menu__group-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* 底部 */
.sidebar-menu__footer {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

/* 工具提示 */
.sidebar-menu__tooltip {
  position: fixed;
  background: rgba(45, 55, 72, 0.95);
  backdrop-filter: blur(10px);
  color: #f7fafc;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-family: 'Playfair Display', serif;
  white-space: nowrap;
  z-index: 1000;
  box-shadow: 0 4px 6px -1px rgba(45, 55, 72, 0.2);
  border: 1px solid rgba(237, 137, 54, 0.2);
  pointer-events: none;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-menu__tooltip.show {
  opacity: 1;
  transform: translateY(0);
}

.sidebar-menu__tooltip-submenu-hint {
  font-size: 0.625rem;
  color: rgba(247, 250, 252, 0.7);
  margin-top: 0.25rem;
}

/* 折叠状态 */
.sidebar-menu--collapsed {
  overflow: visible;
}

.sidebar-menu--collapsed .sidebar-menu__content {
  display: none;
}

.sidebar-menu--collapsed .sidebar-menu__submenu {
  display: none;
}

.sidebar-menu--collapsed .sidebar-menu__group-title {
  display: none;
}

.sidebar-menu--collapsed .sidebar-menu__footer {
  display: none;
}

.sidebar-menu--collapsed .sidebar-menu__button-inner {
  padding: 0.75rem;
  justify-content: center;
}

.sidebar-menu--collapsed .sidebar-menu__active-indicator {
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 3px;
  border-radius: 2px;
  top: auto;
  bottom: 0;
}

/* 移动端 */
.sidebar-menu--mobile {
  padding: 0;
}

.sidebar-menu--mobile .sidebar-menu__button-inner {
  padding: 1rem;
  margin: 0;
  border-radius: 0;
}

.sidebar-menu--mobile .sidebar-menu__submenu {
  background: rgba(45, 55, 72, 0.1);
  margin: 0;
}

.sidebar-menu--mobile .sidebar-menu__submenu-button-inner {
  padding: 0.75rem 1rem 0.75rem 3rem;
  margin: 0;
  border-radius: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar-menu__button-inner {
    padding: 1rem;
    margin: 0;
    border-radius: 0;
  }
  
  .sidebar-menu__submenu {
    background: rgba(45, 55, 72, 0.1);
    margin: 0;
  }
  
  .sidebar-menu__submenu-button-inner {
    padding: 0.75rem 1rem 0.75rem 3rem;
    margin: 0;
    border-radius: 0;
  }
  
  .sidebar-menu__group-title {
    padding: 0.75rem 1rem;
  }
}
</style>