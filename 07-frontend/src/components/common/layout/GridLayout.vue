<template>
  <div class="grid-layout" :class="layoutClasses">
    <!-- 网格容器 -->
    <div 
      class="grid-layout__container" 
      :style="gridStyles"
      :class="containerClasses"
    >
      <!-- 网格项 -->
      <div 
        v-for="(item, index) in items" 
        :key="item.id || index"
        class="grid-layout__item"
        :class="getItemClasses(item, index)"
        :style="getItemStyles(item)"
      >
        <slot 
          name="item" 
          :item="item" 
          :index="index"
          :is-dragging="draggedItem === item"
        >
          <div class="grid-layout__item-content">
            <component 
              :is="item.component || 'div'" 
              v-bind="item.props"
              class="grid-layout__item-component"
            >
              <slot name="item-content" :item="item" :index="index">
                {{ item.content || item.title }}
              </slot>
            </component>
            
            <!-- 拖拽手柄 -->
            <div 
              v-if="draggable && !item.locked"
              class="grid-layout__drag-handle"
              @mousedown="startDrag($event, item)"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
              </svg>
            </div>
          </div>
        </slot>
      </div>

      <!-- 占位符元素 -->
      <div 
        v-if="showPlaceholder"
        class="grid-layout__placeholder"
        :class="placeholderClasses"
        :style="placeholderStyles"
      >
        <slot name="placeholder">
          <div class="grid-layout__placeholder-content">
            <i class="fas fa-plus-circle"></i>
            <span>拖拽组件到此处</span>
          </div>
        </slot>
      </div>
    </div>

    <!-- 网格控制面板 -->
    <div v-if="showControls" class="grid-layout__controls">
      <slot name="controls" :layout="layout">
        <div class="grid-layout__control-group">
          <button 
            class="grid-layout__control-btn"
            @click="toggleEditMode"
            :class="{ 'grid-layout__control-btn--active': editMode }"
          >
            <i class="fas fa-edit"></i>
            {{ editMode ? '完成编辑' : '编辑布局' }}
          </button>
          
          <button 
            class="grid-layout__control-btn"
            @click="resetLayout"
            :disabled="!canReset"
          >
            <i class="fas fa-undo"></i>
            重置布局
          </button>
          
          <button 
            class="grid-layout__control-btn"
            @click="saveLayout"
            :disabled="!hasChanges"
          >
            <i class="fas fa-save"></i>
            保存布局
          </button>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch, nextTick } from 'vue'
import { v4 as uuidv4 } from 'uuid'

interface GridItem {
  id?: string
  x?: number
  y?: number
  w?: number
  h?: number
  component?: string
  props?: Record<string, any>
  content?: string
  title?: string
  locked?: boolean
  resizable?: boolean
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

interface GridConfig {
  cols?: number
  rows?: number
  gap?: string | number
  autoFlow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense'
  itemMinWidth?: string
  itemMinHeight?: string
}

interface Props {
  items?: GridItem[]
  config?: GridConfig
  draggable?: boolean
  resizable?: boolean
  responsive?: boolean
  showPlaceholder?: boolean
  showControls?: boolean
  compact?: boolean
  animated?: boolean
  editMode?: boolean
  breakpoints?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  config: () => ({}),
  draggable: false,
  resizable: false,
  responsive: true,
  showPlaceholder: false,
  showControls: false,
  compact: false,
  animated: true,
  editMode: false,
  breakpoints: () => ({
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280
  })
})

const emit = defineEmits<{
  'item-move': [item: GridItem, oldPosition: { x: number; y: number }, newPosition: { x: number; y: number }]
  'item-resize': [item: GridItem, oldSize: { w: number; h: number }, newSize: { w: number; h: number }]
  'layout-change': [layout: GridItem[]]
  'edit-mode-toggle': [enabled: boolean]
  'layout-save': [layout: GridItem[]]
  'layout-reset': []
}>()

// 响应式状态
const layoutItems = ref<GridItem[]>([])
const currentBreakpoint = ref<string>('lg')
const isDragging = ref(false)
const draggedItem = ref<GridItem | null>(null)
const dragStartPosition = reactive({ x: 0, y: 0 })
const itemStartPosition = reactive({ x: 0, y: 0 })
const editModeState = ref(props.editMode)
const hasChanges = ref(false)

// 计算属性
const currentConfig = computed(() => ({
  cols: 12,
  rows: 'auto',
  gap: props.compact ? '0.5rem' : '1rem',
  autoFlow: 'dense',
  itemMinWidth: '200px',
  itemMinHeight: '150px',
  ...props.config
}))

const layoutClasses = computed(() => [
  'grid-layout',
  {
    'grid-layout--draggable': props.draggable,
    'grid-layout--resizable': props.resizable,
    'grid-layout--animated': props.animated,
    'grid-layout--compact': props.compact,
    'grid-layout--edit-mode': editModeState.value
  }
])

const containerClasses = computed(() => [
  'grid-layout__container-inner',
  `grid-layout__container--${currentBreakpoint.value}`
])

const gridStyles = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${currentConfig.value.cols}, 1fr)`,
  gridAutoRows: currentConfig.value.rows === 'auto' ? 'minmax(150px, auto)' : `repeat(${currentConfig.value.rows}, 1fr)`,
  gap: currentConfig.value.gap,
  gridAutoFlow: currentConfig.value.autoFlow,
  transition: props.animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
}))

const canReset = computed(() => layoutItems.value.length > 0)

// 方法
const getItemClasses = (item: GridItem, index: number) => [
  'grid-layout__item-inner',
  {
    'grid-layout__item--locked': item.locked,
    'grid-layout__item--dragging': isDragging.value && draggedItem.value === item,
    'grid-layout__item--ghost': isDragging.value && draggedItem.value !== item
  }
]

const getItemStyles = (item: GridItem) => {
  const x = item.x ?? (index % (currentConfig.value.cols as number))
  const y = item.y ?? Math.floor(index / (currentConfig.value.cols as number))
  const w = item.w ?? 1
  const h = item.h ?? 1
  
  return {
    gridColumn: `${x + 1} / span ${w}`,
    gridRow: `${y + 1} / span ${h}`,
    zIndex: isDragging.value && draggedItem.value === item ? 1000 : 1
  }
}

const startDrag = (event: MouseEvent, item: GridItem) => {
  if (!props.draggable || item.locked) return
  
  event.preventDefault()
  isDragging.value = true
  draggedItem.value = item
  
  dragStartPosition.x = event.clientX
  dragStartPosition.y = event.clientY
  
  const index = layoutItems.value.indexOf(item)
  itemStartPosition.x = item.x ?? (index % (currentConfig.value.cols as number))
  itemStartPosition.y = item.y ?? Math.floor(index / (currentConfig.value.cols as number))
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (event: MouseEvent) => {
  if (!isDragging.value || !draggedItem.value) return
  
  const deltaX = event.clientX - dragStartPosition.x
  const deltaY = event.clientY - dragStartPosition.y
  
  // 计算新的网格位置
  const cellSize = calculateCellSize()
  const newGridX = Math.round(itemStartPosition.x + deltaX / cellSize.width)
  const newGridY = Math.round(itemStartPosition.y + deltaY / cellSize.height)
  
  // 边界检查
  const item = draggedItem.value
  const maxGridX = (currentConfig.value.cols as number) - (item.w ?? 1)
  
  const boundedX = Math.max(0, Math.min(newGridX, maxGridX))
  const boundedY = Math.max(0, newGridY)
  
  // 更新位置
  const oldPosition = { x: item.x, y: item.y }
  item.x = boundedX
  item.y = boundedY
  
  hasChanges.value = true
  emit('item-move', item, oldPosition, { x: boundedX, y: boundedY })
}

const stopDrag = () => {
  isDragging.value = false
  draggedItem.value = null
  
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  
  emit('layout-change', layoutItems.value)
}

const calculateCellSize = () => {
  // 这里应该根据实际DOM尺寸计算单元格大小
  return { width: 200, height: 150 }
}

const toggleEditMode = () => {
  editModeState.value = !editModeState.value
  emit('edit-mode-toggle', editModeState.value)
}

const resetLayout = () => {
  layoutItems.value = props.items.map((item, index) => ({
    ...item,
    x: index % (currentConfig.value.cols as number),
    y: Math.floor(index / (currentConfig.value.cols as number)
  }))
  hasChanges.value = false
  emit('layout-reset')
  emit('layout-change', layoutItems.value)
}

const saveLayout = () => {
  emit('layout-save', layoutItems.value)
  hasChanges.value = false
}

// 占位符相关
const placeholderClasses = computed(() => [
  'grid-layout__placeholder-inner'
])

const placeholderStyles = computed(() => ({
  gridColumn: 'span 1',
  gridRow: 'span 1'
}))

// 响应式断点检测
const updateBreakpoint = () => {
  const width = window.innerWidth
  const { breakpoints } = props
  
  if (width < breakpoints.sm) {
    currentBreakpoint.value = 'sm'
  } else if (width < breakpoints.md) {
    currentBreakpoint.value = 'md'
  } else if (width < breakpoints.lg) {
    currentBreakpoint.value = 'lg'
  } else {
    currentBreakpoint.value = 'xl'
  }
}

// 生命周期
watch(() => props.items, (newItems) => {
  layoutItems.value = newItems.map(item => ({
    id: uuidv4(),
    ...item
  }))
}, { immediate: true, deep: true })

if (props.responsive) {
  onMounted(() => {
    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
  })
}
</script>

<style scoped>
.grid-layout {
  width: 100%;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  font-family: 'Space Mono', monospace;
  color: #1a202c;
  position: relative;
}

.grid-layout__container {
  width: 100%;
  position: relative;
}

.grid-layout__item {
  position: relative;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(237, 137, 54, 0.1);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.grid-layout__item--locked {
  opacity: 0.7;
  cursor: not-allowed;
}

.grid-layout__item--dragging {
  cursor: grabbing;
  transform: scale(1.02);
  box-shadow: 0 20px 25px -5px rgba(45, 55, 72, 0.2), 0 10px 10px -5px rgba(45, 55, 72, 0.04);
  z-index: 1000;
}

.grid-layout__item--ghost {
  opacity: 0.3;
  transform: scale(0.95);
}

.grid-layout__item:hover {
  border-color: rgba(237, 137, 54, 0.3);
  box-shadow: 0 4px 6px -1px rgba(45, 55, 72, 0.1), 0 2px 4px -1px rgba(45, 55, 72, 0.06);
}

.grid-layout__item-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 1rem;
}

.grid-layout__item-component {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2d3748;
  font-family: 'Playfair Display', serif;
}

.grid-layout__drag-handle {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(237, 137, 54, 0.8);
  color: white;
  border-radius: 4px;
  padding: 0.25rem;
  cursor: grab;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

.grid-layout__item:hover .grid-layout__drag-handle {
  opacity: 1;
}

.grid-layout__drag-handle:active {
  cursor: grabbing;
}

.grid-layout__placeholder {
  background: rgba(56, 178, 172, 0.1);
  border: 2px dashed rgba(56, 178, 172, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
}

.grid-layout__placeholder-content {
  text-align: center;
  color: #38b2ac;
  font-size: 0.875rem;
}

.grid-layout__placeholder-content i {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  display: block;
}

.grid-layout__controls {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(237, 137, 54, 0.1);
  padding: 1rem 2rem;
  position: sticky;
  bottom: 0;
  z-index: 20;
}

.grid-layout__control-group {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.grid-layout__control-btn {
  background: rgba(237, 137, 54, 0.1);
  border: 1px solid rgba(237, 137, 54, 0.3);
  color: #ed8936;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.grid-layout__control-btn:hover:not(:disabled) {
  background: rgba(237, 137, 54, 0.2);
  border-color: rgba(237, 137, 54, 0.5);
}

.grid-layout__control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.grid-layout__control-btn--active {
  background: #ed8936;
  color: white;
  border-color: #ed8936;
}

/* 响应式网格 */
.grid-layout__container--sm {
  grid-template-columns: repeat(4, 1fr) !important;
}

.grid-layout__container--md {
  grid-template-columns: repeat(8, 1fr) !important;
}

.grid-layout__container--lg {
  grid-template-columns: repeat(12, 1fr) !important;
}

.grid-layout__container--xl {
  grid-template-columns: repeat(16, 1fr) !important;
}

@media (max-width: 640px) {
  .grid-layout__container {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 0.5rem !important;
  }
  
  .grid-layout__item-content {
    padding: 0.5rem;
  }
  
  .grid-layout__control-group {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>