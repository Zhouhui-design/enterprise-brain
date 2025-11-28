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
    <div ref="chartContainerRef" class="pie-chart-container" :style="{ width: '100%', height: '100%' }" />
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
  // 名称字段
  nameField: {
    type: String,
    default: 'name'
  },
  // 值字段
  valueField: {
    type: String,
    default: 'value'
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
  // 是否显示数值
  showValue: {
    type: Boolean,
    default: true
  },
  // 是否显示百分比
  showPercent: {
    type: Boolean,
    default: true
  },
  // 饼图类型: 'pie', 'ring' (环形图)
  type: {
    type: String,
    default: 'pie'
  },
  // 环形图的内半径
  innerRadius: {
    type: [String, Number],
    default: '30%'
  },
  // 饼图的外半径
  outerRadius: {
    type: [String, Number],
    default: '70%'
  },
  // 图例位置
  legendPosition: {
    type: String,
    default: 'right'
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
  // 准备饼图数据
  const pieData = processedData.value.map(item => ({
    name: item[props.nameField],
    value: item[props.valueField]
  }))

  // 准备标签格式化函数
  const labelFormatter = (params: any) => {
    let result = params.name
    if (props.showValue) {
      result += `: ${params.value}`
    }
    if (props.showPercent) {
      result += ` (${params.percent}%)`
    }
    return result
  }

  const baseOptions: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      show: props.showLegend,
      orient: props.legendPosition === 'top' || props.legendPosition === 'bottom' ? 'horizontal' : 'vertical',
      left: props.legendPosition === 'left' ? 'left' : undefined,
      right: props.legendPosition === 'right' ? 'right' : undefined,
      top: props.legendPosition === 'top' ? 'top' : undefined,
      bottom: props.legendPosition === 'bottom' ? 'bottom' : undefined
    },
    series: [{
      name: props.yFields?.[0]?.name || '数据',
      type: 'pie',
      radius: props.type === 'ring' 
        ? [props.innerRadius, props.outerRadius] 
        : [0, props.outerRadius],
      center: ['50%', '50%'],
      data: pieData,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        },
        focus: 'self'
      },
      label: {
        show: props.showValue || props.showPercent,
        formatter: labelFormatter
      },
      labelLine: {
        show: props.showValue || props.showPercent
      }
    }]
  }
  
  // 合并用户自定义选项
  return { ...baseOptions, ...props.options }
})

// 方法
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
.pie-chart-container {
  min-height: 200px;
}
</style>