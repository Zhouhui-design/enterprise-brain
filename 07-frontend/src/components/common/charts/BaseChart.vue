<template>
  <div class="base-chart-container" :style="containerStyle">
    <div v-if="loading" class="chart-loading">
      <el-skeleton :rows="3" animated />
    </div>
    <div v-else-if="error" class="chart-error">
      <el-empty description="数据加载失败" />
      <el-button type="primary" size="small" @click="$emit('reload')">重新加载</el-button>
    </div>
    <div v-else-if="!hasData" class="chart-empty">
      <el-empty :description="emptyText || '暂无数据'" />
    </div>
    <div v-else class="chart-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'

// Props
const props = defineProps({
  // 图表数据
  data: {
    type: Array,
    default: () => []
  },
  // 图表配置项
  options: {
    type: Object,
    default: () => ({})
  },
  // 图表高度
  height: {
    type: [String, Number],
    default: 300
  },
  // 图表宽度
  width: {
    type: [String, Number],
    default: '100%'
  },
  // 是否显示加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 是否显示错误状态
  error: {
    type: Boolean,
    default: false
  },
  // 无数据时的提示文本
  emptyText: {
    type: String,
    default: ''
  },
  // 是否响应式
  responsive: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['reload', 'resize', 'dataChange'])

// 响应式引用
const chartInstance = ref<InstanceType<any> | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const resizeObserver = ref<ResizeObserver | null>(null)

// 计算属性
const hasData = computed(() => {
  return Array.isArray(props.data) && props.data.length > 0
})

const containerStyle = computed(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  width: typeof props.width === 'number' ? `${props.width}px` : props.width
}))

// 方法
const resizeChart = () => {
  nextTick(() => {
    emit('resize')
  })
}

const updateChart = (newData: any[], newOptions?: any) => {
  emit('dataChange', { data: newData, options: newOptions })
}

// 生命周期
onMounted(() => {
  if (props.responsive) {
    resizeObserver.value = new ResizeObserver(() => {
      resizeChart()
    })
    if (containerRef.value) {
      resizeObserver.value.observe(containerRef.value)
    }
  }
})

onUnmounted(() => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
  if (chartInstance.value) {
    // 清理图表实例
    chartInstance.value = null
  }
})

// 暴露方法给父组件
defineExpose({
  resize: resizeChart,
  update: updateChart,
  chartInstance
})
</script>

<style scoped>
.base-chart-container {
  position: relative;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.chart-loading,
.chart-error,
.chart-empty,
.chart-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.chart-error {
  gap: 16px;
}

.chart-empty {
  min-height: 200px;
}
</style>