<template>
  <div class="data-visualization">
    <div class="chart-container" ref="chartRef"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  chartType: {
    type: String,
    default: 'line', // line, bar, pie, scatter, etc.
    validator: (value) => ['line', 'bar', 'pie', 'scatter', 'radar', 'gauge'].includes(value)
  },
  chartData: {
    type: Object,
    required: true
  },
  chartOptions: {
    type: Object,
    default: () => ({})
  },
  height: {
    type: String,
    default: '400px'
  }
})

const chartRef = ref(null)
let chartInstance = null

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance) return

  const defaultOptions = getDefaultOptions()
  const mergedOptions = {
    ...defaultOptions,
    ...props.chartOptions
  }

  chartInstance.setOption(mergedOptions)
}

const getDefaultOptions = () => {
  const { xAxisData, series } = props.chartData

  const baseOptions = {
    title: {
      text: props.chartOptions.title || '',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: series?.map(s => s.name) || [],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    toolbox: {
      feature: {
        saveAsImage: {},
        dataView: { readOnly: false },
        magicType: { type: ['line', 'bar'] },
        restore: {}
      }
    }
  }

  switch (props.chartType) {
    case 'line':
    case 'bar':
      return {
        ...baseOptions,
        xAxis: {
          type: 'category',
          data: xAxisData || [],
          boundaryGap: props.chartType === 'bar'
        },
        yAxis: {
          type: 'value'
        },
        series: (series || []).map(s => ({
          ...s,
          type: props.chartType,
          smooth: true
        }))
      }

    case 'pie':
      return {
        ...baseOptions,
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        series: [{
          name: '数据',
          type: 'pie',
          radius: '50%',
          data: series || [],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      }

    case 'scatter':
      return {
        ...baseOptions,
        xAxis: {
          type: 'value'
        },
        yAxis: {
          type: 'value'
        },
        series: (series || []).map(s => ({
          ...s,
          type: 'scatter',
          symbolSize: 10
        }))
      }

    case 'radar':
      return {
        ...baseOptions,
        radar: {
          indicator: xAxisData || []
        },
        series: [{
          name: '数据',
          type: 'radar',
          data: series || []
        }]
      }

    case 'gauge':
      return {
        ...baseOptions,
        series: [{
          type: 'gauge',
          data: series || []
        }]
      }

    default:
      return baseOptions
  }
}

const resize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

watch(() => props.chartData, () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

watch(() => props.chartOptions, () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', resize)
})

defineExpose({
  resize,
  getChartInstance: () => chartInstance
})
</script>

<script>
import { onBeforeUnmount } from 'vue'
</script>

<style scoped lang="scss">
.data-visualization {
  width: 100%;
  
  .chart-container {
    width: 100%;
    height: v-bind(height);
  }
}
</style>
