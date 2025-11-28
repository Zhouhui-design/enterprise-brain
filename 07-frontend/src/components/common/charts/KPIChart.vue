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
    <div class="kpi-chart-container">
      <!-- KPI主要指标 -->
      <div v-if="showKpi" class="kpi-main-indicators">
        <div class="kpi-main-value" :class="{ 'kpi-main-value-large': size === 'large' }">
          {{ formatKpiValue(currentValue, format) }}
        </div>
        <div class="kpi-main-label">{{ title }}</div>
        <div v-if="changeValue !== undefined" class="kpi-main-change" :class="getChangeClass(changeValue)">
          <el-icon v-if="changeValue > 0"><ArrowUp /></el-icon>
          <el-icon v-else-if="changeValue < 0"><ArrowDown /></el-icon>
          <el-icon v-else><Minus /></el-icon>
          {{ Math.abs(changeValue) }}%
          <span class="kpi-change-compare">{{ compareText || '较上期' }}</span>
        </div>
      </div>
      
      <!-- 趋势图表 -->
      <div ref="chartContainerRef" class="kpi-trend-chart" :style="{ width: '100%', height: chartHeight }" />
    </div>
  </BaseChart>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import BaseChart from './BaseChart.vue'
import { ArrowUp, ArrowDown, Minus } from '@element-plus/icons-vue'

// 假设我们使用ECharts作为图表库
import * as echarts from 'echarts'

// Props
const props = defineProps({
  // 标题
  title: {
    type: String,
    default: ''
  },
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
  // Y轴数据字段
  yField: {
    type: String,
    default: 'value'
  },
  // 当前值
  currentValue: {
    type: [Number, String],
    default: 0
  },
  // 变化值（百分比）
  changeValue: {
    type: Number,
    default: undefined
  },
  // 比较文本
  compareText: {
    type: String,
    default: ''
  },
  // 格式化类型: 'currency', 'percentage', 'number', 'decimal'
  format: {
    type: String,
    default: 'number'
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
  // 是否显示KPI指标
  showKpi: {
    type: Boolean,
    default: true
  },
  // 尺寸: 'small', 'medium', 'large'
  size: {
    type: String,
    default: 'medium'
  },
  // 图表类型: 'line', 'area'
  chartType: {
    type: String,
    default: 'line'
  },
  // 图表颜色
  chartColor: {
    type: String,
    default: '#1890ff'
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

const chartHeight = computed(() => {
  if (props.showKpi) {
    // 根据整体高度和尺寸调整图表高度
    const totalHeight = typeof props.height === 'number' ? props.height : parseInt(props.height) || 300
    switch (props.size) {
      case 'small':
        return `${totalHeight - 80}px`
      case 'large':
        return `${totalHeight - 120}px`
      default:
        return `${totalHeight - 100}px`
    }
  }
  return '100%'
})

const mergedOptions = computed(() => {
  const baseOptions: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: processedData.value.map(item => item[props.xField]),
      axisLine: {
        lineStyle: {
          color: '#e0e0e0'
        }
      },
      axisLabel: {
        color: '#909399',
        fontSize: 12
      },
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisLabel: {
        color: '#909399',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed'
        }
      }
    },
    series: [{
      type: props.chartType,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: {
        color: props.chartColor
      },
      lineStyle: {
        color: props.chartColor,
        width: 2
      },
      areaStyle: props.chartType === 'area' ? {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: `${props.chartColor}40`
            },
            {
              offset: 1,
              color: `${props.chartColor}10`
            }
          ]
        }
      } : undefined,
      data: processedData.value.map(item => item[props.yField]),
      emphasis: {
        focus: 'series'
      }
    }]
  }
  
  // 合并用户自定义选项
  return { ...baseOptions, ...props.options }
})

// 方法
const formatKpiValue = (value: any, format?: string): string => {
  if (value === null || value === undefined) return '--'
  
  switch (format) {
    case 'currency':
      return `¥${Number(value).toLocaleString()}`
    case 'percentage':
      return `${(Number(value) * 100).toFixed(2)}%`
    case 'number':
      return Number(value).toLocaleString()
    case 'decimal':
      return Number(value).toFixed(2)
    default:
      return String(value)
  }
}

const getChangeClass = (change: number): string => {
  if (change > 0) return 'kpi-change-positive'
  if (change < 0) return 'kpi-change-negative'
  return 'kpi-change-neutral'
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

// 监听高度变化，重新调整图表尺寸
watch([() => props.height, () => props.showKpi, () => props.size], () => {
  handleResize()
})

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
.kpi-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.kpi-main-indicators {
  text-align: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.kpi-main-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  line-height: 1.2;
}

.kpi-main-value-large {
  font-size: 40px;
}

.kpi-main-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.kpi-main-change {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
}

.kpi-change-positive {
  color: #f56c6c;
}

.kpi-change-negative {
  color: #67c23a;
}

.kpi-change-neutral {
  color: #909399;
}

.kpi-change-compare {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.kpi-trend-chart {
  flex: 1;
  min-height: 150px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .kpi-main-indicators {
    padding: 12px 0;
    margin-bottom: 12px;
  }
  
  .kpi-main-value {
    font-size: 24px;
  }
  
  .kpi-main-value-large {
    font-size: 32px;
  }
  
  .kpi-trend-chart {
    min-height: 120px;
  }
}
</style>