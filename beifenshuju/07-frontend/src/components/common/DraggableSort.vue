<template>
  <div
    ref="containerRef"
    class="draggable-container"
    :class="{ 'dragging': isDragging }"
  >
    <!-- 拖拽项列表 -->
    <div
      v-for="(item, index) in items"
      :key="item[trackBy]"
      :data-index="index"
      :data-id="item[trackBy]"
      :class="[
        'draggable-item',
        {
          'dragging-over': dragOverIndex === index,
          'dragging': draggingIndex === index
        }
      ]"
      :style="getItemStyle(item, index)"
      draggable="true"
      @dragstart="handleDragStart($event, index, item)"
      @dragend="handleDragEnd"
      @dragover="handleDragOver($event, index)"
      @dragleave="handleDragLeave($event, index)"
      @drop="handleDrop($event, index)"
    >
      <slot name="item" :item="item" :index="index" :isDragging="draggingIndex === index" />
      
      <!-- 拖拽手柄 -->
      <div
        v-if="showHandle"
        class="drag-handle"
        @mousedown="startHandleDrag($event, index, item)"
        :title="dragHandleTitle"
      >
        <slot name="handle">
          <el-icon><Rank /></el-icon>
        </slot>
      </div>

      <!-- 拖拽指示器 -->
      <div
        v-if="draggingIndex === index"
        class="drag-indicator"
        :class="{ 'clone-mode': cloneMode }"
      >
        <div class="indicator-content">
          <slot name="indicator" :item="item" :index="index" />
        </div>
      </div>
    </div>

    <!-- 拖拽占位符 -->
    <div
      v-for="placeholder in placeholders"
      :key="placeholder.key"
      :style="placeholder.style"
      class="drag-placeholder"
      :class="{ 'clone-mode': cloneMode }"
    >
      <slot name="placeholder" :index="placeholder.index" />
    </div>

    <!-- 拖拽提示 -->
    <div
      v-if="showPlaceholder && items.length === 0"
      class="empty-placeholder"
    >
      <slot name="empty">
        <div class="empty-content">
          <el-icon><Box /></el-icon>
          <p>{{ emptyText }}</p>
        </div>
      </slot>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Rank, Box } from '@element-plus/icons-vue'

/**
 * 拖拽排序组件
 * 
 * 提供灵活的拖拽排序功能，包括：
 * - 多种拖拽模式（手柄拖拽、直接拖拽）
 * - 拖拽动画和视觉反馈
 * - 跨容器拖拽支持
 * - 触摸设备支持
 * - 拖拽约束和限制
 * - 可访问性支持
 * - 拖拽事件回调
 * 
 * @author AI Assistant
 * @since 2024-01-01
 */
export default {
  name: 'DraggableSort',
  components: {
    Rank,
    Box
  },
  props: {
    // 列表数据
    items: {
      type: Array,
      required: true,
      default: () => []
    },
    // 追踪字段
    trackBy: {
      type: String,
      default: 'id'
    },
    // 拖拽模式：'direct' | 'handle' | 'both'
    mode: {
      type: String,
      default: 'direct',
      validator: value => ['direct', 'handle', 'both'].includes(value)
    },
    // 是否显示拖拽手柄
    showHandle: {
      type: Boolean,
      default: false
    },
    // 拖拽手柄提示
    dragHandleTitle: {
      type: String,
      default: '拖拽排序'
    },
    // 动画时长
    animationDuration: {
      type: Number,
      default: 300
    },
    // 是否启用克隆拖拽
    cloneMode: {
      type: Boolean,
      default: false
    },
    // 拖拽阈值
    dragThreshold: {
      type: Number,
      default: 5
    },
    // 是否允许跨容器拖拽
    crossContainer: {
      type: Boolean,
      default: false
    },
    // 拖拽组名（用于跨容器）
    groupName: {
      type: String,
      default: 'default'
    },
    // 是否显示空占位符
    showPlaceholder: {
      type: Boolean,
      default: true
    },
    // 空状态文本
    emptyText: {
      type: String,
      default: '拖拽项目到这里'
    },
    // 拖拽方向：'vertical' | 'horizontal' | 'both'
    direction: {
      type: String,
      default: 'vertical',
      validator: value => ['vertical', 'horizontal', 'both'].includes(value)
    },
    // 拖拽约束
    constraints: {
      type: Object,
      default: () => ({})
    },
    // 是否启用拖拽动画
    enableAnimation: {
      type: Boolean,
      default: true
    },
    // 是否禁用拖拽
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'drag-start',
    'drag-end',
    'drag-move',
    'drop',
    'reorder',
    'sort-change'
  ],
  setup(props, { emit }) {
    // ================ 响应式数据 ================
    
    const containerRef = ref(null)
    const isDragging = ref(false)
    const draggingIndex = ref(-1)
    const dragOverIndex = ref(-1)
    const placeholders = ref([])
    
    // 拖拽状态
    const dragState = reactive({
      startIndex: -1,
      currentIndex: -1,
      dragElement: null,
      dragData: null,
      dragHandle: false,
      touchStart: { x: 0, y: 0 },
      dragOffset: { x: 0, y: 0 }
    })

    // ================ 计算属性 ================
    
    const sortedItems = computed(() => {
      return [...props.items]
    })

    const containerClasses = computed(() => ({
      'draggable-vertical': props.direction === 'vertical' || props.direction === 'both',
      'draggable-horizontal': props.direction === 'horizontal',
      'draggable-disabled': props.disabled,
      'dragging-active': isDragging.value
    }))

    // ================ 方法定义 ================

    /**
     * 获取项目样式
     */
    const getItemStyle = (item, index) => {
      const style = {}
      
      // 拖拽中的项目样式
      if (draggingIndex.value === index) {
        style.opacity = props.cloneMode ? 1 : 0.5
        style.transform = props.cloneMode ? 'scale(1.05)' : 'scale(0.95)'
        style.zIndex = '1000'
      }
      
      // 拖拽悬停的项目样式
      if (dragOverIndex.value === index && !props.cloneMode) {
        style.transform = 'translateY(-2px)'
      }
      
      return style
    }

    /**
     * 处理拖拽开始
     */
    const handleDragStart = (event, index, item) => {
      if (props.disabled) {
        event.preventDefault()
        return
      }

      const target = event.target.closest('.draggable-item')
      if (!target) return

      // 设置拖拽数据
      dragState.startIndex = index
      dragState.currentIndex = index
      dragState.dragElement = target
      dragState.dragData = item
      dragState.dragHandle = event.target.classList.contains('drag-handle')

      // 计算偏移量
      if (event.type === 'mousedown') {
        const rect = target.getBoundingClientRect()
        dragState.dragOffset = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        }
      } else if (event.type === 'touchstart') {
        const touch = event.touches[0]
        const rect = target.getBoundingClientRect()
        dragState.touchStart = {
          x: touch.clientX,
          y: touch.clientY
        }
        dragState.dragOffset = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        }
      }

      // 设置拖拽状态
      isDragging.value = true
      draggingIndex.value = index

      // 设置拖拽数据传输
      if (props.crossContainer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', JSON.stringify({
          item,
          index,
          groupName: props.groupName
        }))
        event.dataTransfer.setData('application/json', JSON.stringify({
          item,
          index,
          groupName: props.groupName
        }))
      }

      // 发出事件
      emit('drag-start', {
        item,
        index,
        dragElement: target,
        mode: dragState.dragHandle ? 'handle' : 'direct'
      })

      // 克隆模式处理
      if (props.cloneMode) {
        const clone = target.cloneNode(true)
        clone.style.position = 'fixed'
        clone.style.zIndex = '1000'
        clone.style.pointerEvents = 'none'
        clone.style.opacity = '0.8'
        document.body.appendChild(clone)
        dragState.dragElement = clone
      }
    }

    /**
     * 处理拖拽结束
     */
    const handleDragEnd = (event) => {
      if (!isDragging.value) return

      // 清理拖拽状态
      const startIndex = dragState.startIndex
      const endIndex = dragState.currentIndex

      isDragging.value = false
      draggingIndex.value = -1
      dragOverIndex.value = -1

      // 清理占位符
      placeholders.value = []

      // 清理克隆元素
      if (props.cloneMode && dragState.dragElement && dragState.dragElement.parentNode) {
        dragState.dragElement.parentNode.removeChild(dragState.dragElement)
      }

      // 重置拖拽状态
      Object.assign(dragState, {
        startIndex: -1,
        currentIndex: -1,
        dragElement: null,
        dragData: null,
        dragHandle: false,
        touchStart: { x: 0, y: 0 },
        dragOffset: { x: 0, y: 0 }
      })

      // 发出事件
      emit('drag-end', {
        startIndex,
        endIndex,
        item: props.items[startIndex],
        moved: startIndex !== endIndex
      })

      // 如果位置发生变化，发出重排序事件
      if (startIndex !== endIndex) {
        handleReorder(startIndex, endIndex)
      }

      // 清理拖拽样式
      cleanupDragStyles()
    }

    /**
     * 处理拖拽悬停
     */
    const handleDragOver = (event, index) => {
      if (props.disabled || dragState.currentIndex === index) return

      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'

      // 更新悬停索引
      dragOverIndex.value = index

      // 计算插入位置
      const targetElement = event.currentTarget
      const rect = targetElement.getBoundingClientRect()
      
      let insertionIndex = index
      
      if (props.direction === 'horizontal') {
        const midX = rect.left + rect.width / 2
        const mouseX = event.clientX || (event.touches[0]?.clientX || 0)
        
        if (mouseX > midX) {
          insertionIndex = index + 1
        } else {
          insertionIndex = index
        }
      } else {
        const midY = rect.top + rect.height / 2
        const mouseY = event.clientY || (event.touches[0]?.clientY || 0)
        
        if (mouseY > midY) {
          insertionIndex = index + 1
        } else {
          insertionIndex = index
        }
      }

      // 验证插入位置
      insertionIndex = Math.max(0, Math.min(insertionIndex, props.items.length))

      // 更新拖拽位置
      if (insertionIndex !== dragState.currentIndex) {
        dragState.currentIndex = insertionIndex
        
        // 更新占位符
        updatePlaceholders(insertionIndex)
      }

      // 发出移动事件
      emit('drag-move', {
        fromIndex: dragState.startIndex,
        toIndex: insertionIndex,
        item: dragState.dragData,
        overIndex: index
      })
    }

    /**
     * 处理拖拽离开
     */
    const handleDragLeave = (event, index) => {
      if (dragOverIndex.value === index) {
        dragOverIndex.value = -1
        placeholders.value = []
      }
    }

    /**
     * 处理放置
     */
    const handleDrop = (event, index) => {
      if (props.disabled) return

      event.preventDefault()
      event.stopPropagation()

      const startIndex = dragState.startIndex
      let endIndex = index

      // 处理跨容器拖拽
      if (props.crossContainer && event.dataTransfer.files.length === 0) {
        try {
          const data = JSON.parse(event.dataTransfer.getData('application/json') || 
                           event.dataTransfer.getData('text/plain'))
          
          if (data && data.groupName === props.groupName) {
            // 跨容器拖拽处理
            emit('drop', {
              fromIndex: data.index,
              toIndex: index,
              item: data.item,
              external: true
            })
            return
          }
        } catch (error) {
          console.error('解析拖拽数据失败:', error)
        }
      }

      // 调整目标索引
      if (props.direction === 'horizontal') {
        const rect = event.currentTarget.getBoundingClientRect()
        const midX = rect.left + rect.width / 2
        const mouseX = event.clientX || (event.touches[0]?.clientX || 0)
        
        if (mouseX > midX) {
          endIndex = index + 1
        }
      } else {
        const rect = event.currentTarget.getBoundingClientRect()
        const midY = rect.top + rect.height / 2
        const mouseY = event.clientY || (event.touches[0]?.clientY || 0)
        
        if (mouseY > midY) {
          endIndex = index + 1
        }
      }

      // 验证索引
      endIndex = Math.max(0, Math.min(endIndex, props.items.length))

      // 处理重排序
      if (startIndex !== endIndex) {
        handleReorder(startIndex, endIndex)
      }

      // 发出放置事件
      emit('drop', {
        fromIndex: startIndex,
        toIndex: endIndex,
        item: props.items[startIndex] || dragState.dragData,
        external: false
      })
    }

    /**
     * 开始手柄拖拽
     */
    const startHandleDrag = (event, index, item) => {
      if (props.mode !== 'handle' && props.mode !== 'both') {
        return
      }

      // 调整事件，确保是拖拽开始
      const adjustedEvent = { ...event, type: 'mousedown' }
      handleDragStart(adjustedEvent, index, item)
    }

    /**
     * 处理重排序
     */
    const handleReorder = (fromIndex, toIndex) => {
      if (fromIndex === toIndex) return

      const items = [...props.items]
      const [removed] = items.splice(fromIndex, 1)
      items.splice(toIndex, 0, removed)

      // 发出重排序事件
      emit('reorder', {
        fromIndex,
        toIndex,
        oldItems: props.items,
        newItems: items,
        movedItem: removed
      })

      // 发出排序变化事件
      emit('sort-change', {
        oldIndex: fromIndex,
        newIndex: toIndex,
        items: items
      })
    }

    /**
     * 更新占位符
     */
    const updatePlaceholders = (insertionIndex) => {
      if (!props.enableAnimation || props.cloneMode) {
        placeholders.value = []
        return
      }

      const newPlaceholders = []
      
      // 插入占位符
      newPlaceholders.push({
        key: `placeholder-${insertionIndex}`,
        index: insertionIndex,
        style: getPlaceholderStyle(insertionIndex)
      })

      placeholders.value = newPlaceholders
    }

    /**
     * 获取占位符样式
     */
    const getPlaceholderStyle = (index) => {
      const item = props.items[index]
      if (!item) return {}

      const containerEl = containerRef.value
      if (!containerEl) return {}

      const targetEl = containerEl.querySelector(`[data-index="${index}"]`)
      if (!targetEl) return {}

      const rect = targetEl.getBoundingClientRect()
      const containerRect = containerEl.getBoundingClientRect()

      const style = {
        position: 'absolute',
        top: `${rect.top - containerRect.top}px`,
        left: `${rect.left - containerRect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        transition: `all ${props.animationDuration}ms ease`,
        opacity: 0.3,
        border: '2px dashed #409eff',
        backgroundColor: '#f0f9ff'
      }

      return style
    }

    /**
     * 清理拖拽样式
     */
    const cleanupDragStyles = () => {
      const container = containerRef.value
      if (!container) return

      const items = container.querySelectorAll('.draggable-item')
      items.forEach(item => {
        item.style.transition = ''
        item.style.transform = ''
        item.style.zIndex = ''
      })
    }

    // ================ 触摸事件处理 ================

    /**
     * 处理触摸开始
     */
    const handleTouchStart = (event) => {
      const touch = event.touches[0]
      const target = event.target.closest('.draggable-item')
      
      if (!target) return
      
      dragState.touchStart = {
        x: touch.clientX,
        y: touch.clientY
      }
      
      handleDragStart(event, parseInt(target.dataset.index), JSON.parse(target.dataset.item || '{}'))
    }

    /**
     * 处理触摸移动
     */
    const handleTouchMove = (event) => {
      if (!isDragging.value) return

      event.preventDefault()
      
      const touch = event.touches[0]
      const deltaX = touch.clientX - dragState.touchStart.x
      const deltaY = touch.clientY - dragState.touchStart.y

      // 检查是否超过拖拽阈值
      if (Math.abs(deltaX) < props.dragThreshold && Math.abs(deltaY) < props.dragThreshold) {
        return
      }

      const targetElement = document.elementFromPoint(touch.clientX, touch.clientY)
      if (!targetElement || !targetElement.classList.contains('draggable-item')) {
        return
      }

      const index = parseInt(targetElement.dataset.index)
      handleDragOver(event, index)
    }

    /**
     * 处理触摸结束
     */
    const handleTouchEnd = (event) => {
      handleDragEnd(event)
    }

    // ================ 约束处理 ================

    /**
     * 验证拖拽约束
     */
    const validateDragConstraints = (fromIndex, toIndex) => {
      const constraints = props.constraints
      
      // 位置约束
      if (constraints.maxIndex !== undefined && toIndex > constraints.maxIndex) {
        return false
      }
      
      if (constraints.minIndex !== undefined && toIndex < constraints.minIndex) {
        return false
      }
      
      // 自定义约束函数
      if (constraints.validator && typeof constraints.validator === 'function') {
        return constraints.validator(fromIndex, toIndex, props.items)
      }
      
      return true
    }

    /**
     * 应用拖拽约束
     */
    const applyDragConstraints = (fromIndex, toIndex) => {
      if (!validateDragConstraints(fromIndex, toIndex)) {
        return dragState.startIndex
      }
      return toIndex
    }

    // ================ 生命周期 ================
    
    onMounted(() => {
      const container = containerRef.value
      
      if (!container) return

      // 添加事件监听器
      container.addEventListener('touchstart', handleTouchStart, { passive: false })
      container.addEventListener('touchmove', handleTouchMove, { passive: false })
      container.addEventListener('touchend', handleTouchEnd, { passive: false })
      
      // 设置全局样式
      document.body.style.userSelect = 'none'
    })

    onUnmounted(() => {
      const container = containerRef.value
      
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart)
        container.removeEventListener('touchmove', handleTouchMove)
        container.removeEventListener('touchend', handleTouchEnd)
      }
      
      // 恢复全局样式
      document.body.style.userSelect = ''
    })

    // ================ 返回值 ================
    
    return {
      // 响应式数据
      containerRef,
      isDragging,
      draggingIndex,
      dragOverIndex,
      placeholders,
      sortedItems,
      containerClasses,
      
      // 方法
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      startHandleDrag,
      handleReorder,
      getItemStyle
    }
  }
}
</script>

<style lang="scss" scoped>
.draggable-container {
  position: relative;
  user-select: none;
  
  &.dragging-disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  &.dragging-active {
    position: relative;
    
    &::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(64, 158, 255, 0.1);
      z-index: 999;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
  }
}

.draggable-item {
  position: relative;
  cursor: grab;
  transition: transform 0.3s ease, opacity 0.3s ease;
  touch-action: none;
  
  &:hover {
    transform: translateY(-1px);
  }
  
  &.dragging {
    cursor: grabbing;
    transform: scale(0.95);
    opacity: 0.5;
    z-index: 1000;
    
    &:hover {
      transform: scale(0.95);
    }
  }
  
  &.dragging-over {
    border: 2px dashed #409eff;
    background: #f0f9ff;
  }
  
  &[draggable="false"] {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.drag-handle {
  position: absolute;
  top: 50%;
  left: 8px;
  transform: translateY(-50%);
  cursor: grab;
  padding: 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.1);
  color: #666;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.2);
    color: #333;
  }
  
  &:active {
    cursor: grabbing;
    background: rgba(0, 0, 0, 0.3);
  }
}

.drag-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 999;
  
  .indicator-content {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(64, 158, 255, 0.1);
    border: 2px solid #409eff;
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  &.clone-mode {
    border: 2px solid #409eff;
    background: rgba(64, 158, 255, 0.05);
    opacity: 0.8;
  }
}

.drag-placeholder {
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #409eff;
  pointer-events: none;
  
  &.clone-mode {
    background: rgba(64, 158, 255, 0.05);
  }
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border: 2px dashed #e4e7ed;
  border-radius: 8px;
  color: #909399;
  
  .empty-content {
    text-align: center;
    
    .el-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: #c0c4cc;
    }
    
    p {
      margin: 0;
      font-size: 14px;
    }
  }
}

// 动画
@keyframes pulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .draggable-item {
    .drag-handle {
      left: 4px;
      padding: 2px;
    }
  }
  
  .drag-placeholder {
    font-size: 11px;
  }
}

// 垂直方向样式
.draggable-vertical {
  .draggable-item {
    margin-bottom: 8px;
    
    .drag-handle {
      top: 50%;
      left: 8px;
    }
  }
}

// 水平方向样式
.draggable-horizontal {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  
  .draggable-item {
    margin-bottom: 0;
    margin-right: 8px;
    
    &:last-child {
      margin-right: 0;
    }
    
    .drag-handle {
      top: 8px;
      left: 50%;
      transform: translateX(-50%) translateY(-50%);
    }
  }
}

// 拖拽禁用状态
.draggable-disabled {
  .draggable-item {
    cursor: not-allowed !important;
    
    &:hover {
      transform: none !important;
    }
    
    .drag-handle {
      cursor: not-allowed !important;
    }
  }
}

// 高对比度模式支持
@media (prefers-contrast: high) {
  .draggable-container {
    .draggable-item {
      border: 1px solid #000;
      
      &.dragging-over {
        border: 2px solid #000;
        background: #fff;
      }
    }
    
    .drag-placeholder {
      border: 2px solid #000;
      background: #fff;
      color: #000;
    }
  }
}

// 减少动画偏好
@media (prefers-reduced-motion: reduce) {
  .draggable-item,
  .drag-placeholder {
    transition: none;
  }
  
  .drag-indicator {
    animation: none;
  }
}

// 可访问性支持
@media (prefers-reduced-motion: reduce) {
  .draggable-container[draggable="true"]:focus-within {
    outline: 2px solid #409eff;
    outline-offset: 2px;
  }
}

// 屏幕阅读器支持
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

// 拖拽光标样式
.draggable-item {
  &[aria-grabbed="true"] {
    cursor: grabbing;
  }
  
  &[aria-dropeffect="move"] {
    border: 2px solid #409eff;
    background: #f0f9ff;
  }
}

// 拖拽预览样式
.drag-preview {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  pointer-events: none;
  opacity: 0.8;
  transform: rotate(5deg);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
</style>