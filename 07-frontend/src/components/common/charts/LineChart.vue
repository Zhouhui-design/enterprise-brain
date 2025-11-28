<template>
  <BaseChart
    ref="baseChartRef"
    :data="processedData"
    :options="mergedOptions"
    :height="height"
    :width="width"
    :loading="loading"
    :error="error"
    :empty-text="emptyText"
    :responsive="responsive"
    @reload="handleReload"
    @resize="handleResize"
    @data-change="handleDataChange"
  >
    <div ref="chartContainerRef" class="line-chart-container" :style="{ width: '100%', height: '100%' }" />
  </BaseChart>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import BaseChart from './BaseChart.vue'

// 假设我们使用ECharts作为图表库
import * as echarts from 'echarts'

// Props
const props = defineProps({
  // 原始数据
  data: {
    type: Array,
    default: () => []
  },
  // X轴数据字段
  xField: {
    type: String,
    default: 'date'
  },
  // Y轴数据配置
  yFields: {
    type: Array,
    default: () => [
      {
        field: 'value',
        name: '数值',
        color: '#1890ff'
      }
    ]
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
  },
  // 是否显示图例
  showLegend: {
    type: Boolean,
    default: true
  },
  // 是否显示网格
  showGrid: {
    type: Boolean,
    default: true
  },
  // 是否显示数值
  showValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['reload', 'click', 'hover', 'dataChange'])

// 响应式引用
const chartInstance = ref<echarts.ECharts | null>(null)
const chartContainerRef = ref<HTMLElement | null>(null)
const baseChartRef = ref<any>(null)

// 计算属性
const processedData = computed(() => {
  return props.data || []
})

const mergedOptions = computed(() => {
  const baseOptions: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      }
    },
    legend: {
      show: props.showLegend,
      data: props.yFields.map(field => field.name)
    },
    grid: {
      show: props.showGrid,
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: processedData.value.map(item => item[props.xField]),
      axisPointer: {
        type: 'shadow'
      }
    },
    yAxis: {
      type: 'value'
    },
    series: props.yFields.map((field, index) => ({
      name: field.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: {
        color: field.color || getDefaultColor(index)
      },
      lineStyle: {
        color: field.color || getDefaultColor(index),
        width: 2
      },
      data: processedData.value.map(item => item[field.field]),
      label: {
        show: props.showValue,
        position: 'top'
      }
    }))
  }
  
  // 合并用户自定义选项
  return { ...baseOptions, ...props.options }
})

// 方法
const getDefaultColor = (index: number): string => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2']
  return colors[index % colors.length]
}

const initChart = () => {
  if (!chartContainerRef.value) return
  
  // 销毁旧实例
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
  
  // 创建新实例
  chartInstance.value = echarts.init(chartContainerRef.value)
  
  // 设置选项
  chartInstance.value.setOption(mergedOptions.value)
  
  // 绑定事件
  chartInstance.value.on('click', (params) => {
    emit('click', params)
  })
  
  chartInstance.value.on('mouseover', (params) => {
    emit('hover', params)
  })
}

const updateChart = () => {
  if (chartInstance.value) {
    chartInstance.value.setOption(mergedOptions.value, true)
  }
}

const handleResize = () => {
  nextTick(() => {
    if (chartInstance.value) {
      chartInstance.value.resize()
    }
  })
}

const handleReload = () => {
  emit('reload')
}

const handleDataChange = (data: any) => {
  emit('dataChange', data)
}

// 监听数据变化
watch([() => props.data, () => props.options], () => {
  updateChart()
}, { deep: true })

// 生命周期
onMounted(() => {
  nextTick(() => {
    initChart()
  })
})

// 暴露方法给父组件
defineExpose({
  chartInstance,
  init: initChart,
  update: updateChart,
  resize: handleResize
})
</script>

<style scoped>
.line-chart-container {
  min-height: 200px;
}
</style>