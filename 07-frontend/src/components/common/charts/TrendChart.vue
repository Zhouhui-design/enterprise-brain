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
    <div ref="chartContainerRef" class="trend-chart-container" :style="{ width: '100%', height: '100%' }" />
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
  // 预测数据
  forecastData: {
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
        name: '实际值',
        color: '#1890ff'
      }
    ]
  },
  // 预测数据字段
  forecastField: {
    type: String,
    default: 'forecast'
  },
  // 预测数据名称
  forecastName: {
    type: String,
    default: '预测值'
  },
  // 预测数据颜色
  forecastColor: {
    type: String,
    default: '#52c41a'
  },
  // 是否显示预测区间
  showForecastRange: {
    type: Boolean,
    default: false
  },
  // 预测区间上限字段
  forecastUpperField: {
    type: String,
    default: 'upper'
  },
  // 预测区间下限字段
  forecastLowerField: {
    type: String,
    default: 'lower'
  },
  // 图表配置项
  options: {
    type: Object,
    default: () => ({})
  },
  // 图表高度
  height: {
    type: [String, Number],
    default: 400
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
  },
  // 是否平滑曲线
  smooth: {
    type: Boolean,
    default: true
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

const hasForecastData = computed(() => {
  return props.forecastData && props.forecastData.length > 0
})

const mergedOptions = computed(() => {
  // 合并实际数据和预测数据的X轴
  const allXData = [
    ...processedData.value.map(item => item[props.xField]),
    ...(hasForecastData.value ? props.forecastData.map(item => item[props.xField]) : [])
  ]
  
  // 去重并保持顺序
  const uniqueXData = [...new Map(allXData.map((item, index) => [item, index])).entries()]
    .sort(([,a], [,b]) => a - b)
    .map(([item]) => item)
  
  // 构建系列数据
  const series: any[] = props.yFields.map((field, index) => ({
    name: field.name,
    type: 'line',
    smooth: props.smooth,
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
  
  // 添加预测数据系列
  if (hasForecastData.value) {
    // 预测区间（如果启用）
    if (props.showForecastRange) {
      series.push({
        name: '预测区间',
        type: 'line',
        smooth: props.smooth,
        symbol: 'none',
        stack: 'confidence-band',
        lineStyle: {
          opacity: 0
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: `${props.forecastColor}40`
              },
              {
                offset: 1,
                color: `${props.forecastColor}10`
              }
            ]
          }
        },
        data: props.forecastData.map(item => item[props.forecastUpperField]),
        emphasis: {
          focus: 'series'
        }
      })
      
      series.push({
        name: '-',
        type: 'line',
        smooth: props.smooth,
        symbol: 'none',
        stack: '-confidence-band',
        lineStyle: {
          opacity: 0
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: `${props.forecastColor}40`
              },
              {
                offset: 1,
                color: `${props.forecastColor}10`
              }
            ]
          }
        },
        data: props.forecastData.map(item => -item[props.forecastLowerField]),
        emphasis: {
          focus: 'series'
        }
      })
    }
    
    // 预测值线
    series.push({
      name: props.forecastName,
      type: 'line',
      smooth: props.smooth,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: {
        color: props.forecastColor
      },
      lineStyle: {
        color: props.forecastColor,
        width: 2,
        type: 'dashed'
      },
      data: props.forecastData.map(item => item[props.forecastField]),
      label: {
        show: props.showValue,
        position: 'top'
      },
      emphasis: {
        focus: 'series'
      }
    })
  }
  
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
      data: series.map(s => s.name).filter(name => name !== '-')
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
      data: uniqueXData,
      boundaryGap: false,
      axisPointer: {
        type: 'shadow'
      }
    },
    yAxis: {
      type: 'value'
    },
    series: series
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
watch([() => props.data, () => props.forecastData, () => props.options], () => {
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
.trend-chart-container {
  min-height: 300px;
}
</style>