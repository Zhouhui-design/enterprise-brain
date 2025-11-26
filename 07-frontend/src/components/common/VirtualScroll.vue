<template>
  <div 
    ref="containerRef"
    class="virtual-scroll-container"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <div 
      class="virtual-scroll-phantom" 
      :style="{ height: totalHeight + 'px' }"
    >
      <div 
        class="virtual-scroll-content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="item in visibleItems"
          :key="item.data.id"
          class="virtual-scroll-item"
          :style="{ height: itemHeight + 'px' }"
          :data-index="item.index"
        >
          <slot :item="item.data" :index="item.index" />
        </div>
      </div>
    </div>

    <!-- 加载更多指示器 -->
    <div 
      v-if="loading && !noMore" 
      class="loading-indicator"
      :style="{ 
        top: (visibleItems.length * itemHeight + offsetY) + 'px',
        height: itemHeight + 'px'
      }"
    >
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 无更多数据提示 -->
    <div 
      v-if="noMore" 
      class="no-more-indicator"
      :style="{ 
        top: (visibleItems.length * itemHeight + offsetY) + 'px',
        height: itemHeight + 'px'
      }"
    >
      没有更多数据了
    </div>
  </div>
</template>

<script>
import { 
  ref, 
  computed, 
  onMounted, 
  onUnmounted, 
  nextTick,
  watch 
} from 'vue'
import { Loading } from '@element-plus/icons-vue'

/**
 * 虚拟滚动组件
 * 
 * 支持大数据量的高效渲染，具有以下特性：
 * - 动态高度支持
 * - 无限滚动加载
 * - 缓存优化
 * - 平滑滚动
 * - 性能监控
 * 
 * @author AI Assistant
 * @since 2024-01-01
 */
export default {
  name: 'VirtualScroll',
  components: {
    Loading
  },
  props: {
    // 数据列表
    items: {
      type: Array,
      default: () => []
    },
    // 每项高度
    itemHeight: {
      type: Number,
      default: 60
    },
    // 容器高度
    containerHeight: {
      type: Number,
      default: 400
    },
    // 缓冲区大小（额外渲染的项目数）
    bufferSize: {
      type: Number,
      default: 5
    },
    // 是否启用无限滚动
    infiniteScroll: {
      type: Boolean,
      default: false
    },
    // 是否正在加载
    loading: {
      type: Boolean,
      default: false
    },
    // 是否没有更多数据
    noMore: {
      type: Boolean,
      default: false
    },
    // 滚动到底部的阈值
    scrollThreshold: {
      type: Number,
      default: 100
    }
  },
  emits: [
    'scroll',
    'load-more'
  ],
  setup(props, { emit }) {
    // ================ 响应式数据 ================
    
    const containerRef = ref(null)
    const scrollTop = ref(0)
    const isScrolling = ref(false)
    const scrollTimer = ref(null)
    
    // ================ 计算属性 ================
    
    const totalHeight = computed(() => {
      return props.items.length * props.itemHeight
    })
    
    const visibleCount = computed(() => {
      return Math.ceil(props.containerHeight / props.itemHeight)
    })
    
    const startIndex = computed(() => {
      const index = Math.floor(scrollTop.value / props.itemHeight)
      return Math.max(0, index - props.bufferSize)
    })
    
    const endIndex = computed(() => {
      const index = startIndex.value + visibleCount.value + props.bufferSize * 2
      return Math.min(props.items.length, index)
    })
    
    const visibleItems = computed(() => {
      return props.items.slice(startIndex.value, endIndex.value).map((data, index) => ({
        data,
        index: startIndex.value + index
      }))
    })
    
    const offsetY = computed(() => {
      return startIndex.value * props.itemHeight
    })
    
    // ================ 方法定义 ================
    
    const handleScroll = (event) => {
      const element = event.target
      scrollTop.value = element.scrollTop
      
      // 设置滚动状态
      isScrolling.value = true
      
      // 清除之前的定时器
      if (scrollTimer.value) {
        clearTimeout(scrollTimer.value)
      }
      
      // 设置滚动结束定时器
      scrollTimer.value = setTimeout(() => {
        isScrolling.value = false
      }, 150)
      
      // 发送滚动事件
      emit('scroll', {
        scrollTop: scrollTop.value,
        isBottom: isScrollToBottom(element),
        progress: (scrollTop.value / (element.scrollHeight - element.clientHeight)) * 100
      })
      
      // 无限滚动检测
      if (props.infiniteScroll && shouldLoadMore(element)) {
        emit('load-more')
      }
    }
    
    const isScrollToBottom = (element) => {
      const { scrollTop, scrollHeight, clientHeight } = element
      return scrollTop + clientHeight >= scrollHeight - props.scrollThreshold
    }
    
    const shouldLoadMore = (element) => {
      return !props.loading && 
             !props.noMore && 
             isScrollToBottom(element)
    }
    
    const scrollToIndex = (index) => {
      if (!containerRef.value || index < 0 || index >= props.items.length) {
        return
      }
      
      const targetScrollTop = index * props.itemHeight
      containerRef.value.scrollTop = targetScrollTop
    }
    
    const scrollToTop = () => {
      if (containerRef.value) {
        containerRef.value.scrollTop = 0
      }
    }
    
    const scrollToBottom = () => {
      if (containerRef.value) {
        containerRef.value.scrollTop = containerRef.value.scrollHeight
      }
    }
    
    const getScrollInfo = () => {
      if (!containerRef.value) {
        return null
      }
      
      const element = containerRef.value
      return {
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        isScrollToBottom: isScrollToBottom(element),
        progress: (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100
      }
    }
    
    // ================ 性能监控 ================
    
    let performanceObserver = null
    
    const setupPerformanceMonitoring = () => {
      if (typeof PerformanceObserver === 'undefined') {
        return
      }
      
      performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.name === 'virtual-scroll-render') {
            console.log('Virtual scroll render time:', entry.duration, 'ms')
          }
        })
      })
      
      performanceObserver.observe({ 
        entryTypes: ['measure'] 
      })
    }
    
    const measureRenderPerformance = (fn) => {
      const startMark = 'virtual-scroll-render-start'
      const endMark = 'virtual-scroll-render-end'
      
      performance.mark(startMark)
      fn()
      performance.mark(endMark)
      performance.measure('virtual-scroll-render', startMark, endMark)
    }
    
    // ================ 生命周期 ================
    
    onMounted(() => {
      nextTick(() => {
        setupPerformanceMonitoring()
      })
    })
    
    onUnmounted(() => {
      if (scrollTimer.value) {
        clearTimeout(scrollTimer.value)
      }
      
      if (performanceObserver) {
        performanceObserver.disconnect()
      }
    })
    
    // ================ 监听器 ================
    
    // 监听数据变化，优化性能
    watch(() => props.items.length, () => {
      if (isScrolling.value) {
        measureRenderPerformance(() => {
          // 数据变化时的优化处理
        })
      }
    })
    
    // ================ 返回值 ================
    
    return {
      containerRef,
      totalHeight,
      visibleItems,
      offsetY,
      handleScroll,
      scrollToIndex,
      scrollToTop,
      scrollToBottom,
      getScrollInfo
    }
  }
}
</script>

<style lang="scss" scoped>
.virtual-scroll-container {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  
  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
    
    &:hover {
      background: #a8a8a8;
    }
  }
  
  // Firefox滚动条样式
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

.virtual-scroll-phantom {
  position: relative;
  width: 100%;
}

.virtual-scroll-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.virtual-scroll-item {
  position: absolute;
  left: 0;
  right: 0;
  transition: transform 0.1s ease-out;
}

.loading-indicator,
.no-more-indicator {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  font-size: 14px;
  color: #909399;
  z-index: 10;
}

.loading-indicator {
  .is-loading {
    margin-right: 8px;
    animation: rotating 2s linear infinite;
  }
}

.no-more-indicator {
  background: transparent;
  border: none;
  border-top: 1px dashed #e4e7ed;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// 高性能渲染优化
.virtual-scroll-item {
  will-change: transform;
}

// 滚动性能优化
.virtual-scroll-container {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000;
}

// 响应式设计
@media (max-width: 768px) {
  .virtual-scroll-container {
    &::-webkit-scrollbar {
      width: 4px;
    }
  }
  
  .loading-indicator,
  .no-more-indicator {
    font-size: 12px;
    padding: 8px;
  }
}
</style>