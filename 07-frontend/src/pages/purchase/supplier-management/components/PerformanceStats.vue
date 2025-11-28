<template>
  <div class="performance-stats">
    <el-card class="stats-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h3>供应商绩效统计</h3>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleDateChange"
              style="margin-left: 20px"
            />
          </div>
          <div class="header-right">
            <el-button type="primary" @click="refreshData" :loading="loading">
              刷新数据
            </el-button>
            <el-button @click="exportReport">
              导出报表
            </el-button>
          </div>
        </div>
      </template>

      <!-- 关键指标卡片 -->
      <div class="key-indicators">
        <el-row :gutter="20">
          <el-col :span="6" v-for="indicator in keyIndicators" :key="indicator.key">
            <div class="indicator-card" :class="indicator.trend">
              <div class="indicator-header">
                <el-icon :class="indicator.iconClass">
                  <component :is="indicator.icon" />
                </el-icon>
                <div class="indicator-info">
                  <div class="indicator-title">{{ indicator.title }}</div>
                  <div class="indicator-subtitle">{{ indicator.subtitle }}</div>
                </div>
              </div>
              <div class="indicator-value">
                <span class="value">{{ indicator.value }}</span>
                <span class="unit">{{ indicator.unit }}</span>
              </div>
              <div class="indicator-trend">
                <el-icon :class="indicator.trendClass">
                  <component :is="indicator.trendIcon" />
                </el-icon>
                <span class="trend-text">{{ indicator.trendText }}</span>
                <span class="trend-value">({{ indicator.trendValue }})</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 统计图表区域 -->
      <div class="charts-section">
        <el-row :gutter="20">
          <!-- 采购金额趋势 -->
          <el-col :span="12">
            <div class="chart-container">
              <div class="chart-header">
                <h4>采购金额趋势</h4>
                <el-radio-group v-model="purchaseAmountPeriod" size="small">
                  <el-radio-button label="month">按月</el-radio-button>
                  <el-radio-button label="quarter">按季</el-radio-button>
                  <el-radio-button label="year">按年</el-radio-button>
                </el-radio-group>
              </div>
              <div ref="purchaseAmountChartRef" class="chart"></div>
            </div>
          </el-col>

          <!-- 订单数量分布 -->
          <el-col :span="12">
            <div class="chart-container">
              <div class="chart-header">
                <h4>订单数量分布</h4>
                <el-select v-model="orderDistributionType" size="small" style="width: 120px">
                  <el-option label="产品类型" value="product" />
                  <el-option label="订单状态" value="status" />
                  <el-option label="交付方式" value="delivery" />
                </el-select>
              </div>
              <div ref="orderDistributionChartRef" class="chart"></div>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px">
          <!-- 准时交付率 -->
          <el-col :span="8">
            <div class="chart-container">
              <div class="chart-header">
                <h4>准时交付率</h4>
                <el-tooltip content="显示最近6个月的准时交付率变化" placement="top">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </div>
              <div ref="deliveryRateChartRef" class="chart"></div>
            </div>
          </el-col>

          <!-- 质量合格率 -->
          <el-col :span="8">
            <div class="chart-container">
              <div class="chart-header">
                <h4>质量合格率</h4>
                <el-tooltip content="显示各产品的质量合格率" placement="top">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </div>
              <div ref="qualityRateChartRef" class="chart"></div>
            </div>
          </el-col>

          <!-- 价格竞争力 -->
          <el-col :span="8">
            <div class="chart-container">
              <div class="chart-header">
                <h4>价格竞争力</h4>
                <el-tooltip content="与市场平均价格对比" placement="top">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </div>
              <div ref="priceCompetitivenessChartRef" class="chart"></div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 详细数据表格 -->
      <div class="data-table">
        <div class="table-header">
          <h4>详细统计数据</h4>
          <el-tabs v-model="activeTableTab" type="card">
            <el-tab-pane label="订单统计" name="orders" />
            <el-tab-pane label="产品质量" name="quality" />
            <el-tab-pane label="交付绩效" name="delivery" />
            <el-tab-pane label="财务数据" name="finance" />
          </el-tabs>
        </div>

        <!-- 订单统计表格 -->
        <el-table 
          v-if="activeTableTab === 'orders'"
          :data="orderStatsData" 
          stripe 
          border 
          style="width: 100%"
        >
          <el-table-column type="index" width="60" label="序号" />
          <el-table-column prop="month" label="月份" width="100" />
          <el-table-column prop="orderCount" label="订单数量" width="120" />
          <el-table-column prop="totalAmount" label="总金额" width="150">
            <template #default="{ row }">
              ¥{{ formatNumber(row.totalAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="avgAmount" label="平均金额" width="150">
            <template #default="{ row }">
              ¥{{ formatNumber(row.avgAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="productTypes" label="产品类型数" width="120" />
          <el-table-column prop="onTimeRate" label="准时率" width="100">
            <template #default="{ row }">
              {{ row.onTimeRate }}%
            </template>
          </el-table-column>
          <el-table-column prop="qualityRate" label="合格率" width="100">
            <template #default="{ row }">
              {{ row.qualityRate }}%
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button size="small" @click="viewMonthDetail(row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 质量统计表格 -->
        <el-table 
          v-else-if="activeTableTab === 'quality'"
          :data="qualityStatsData" 
          stripe 
          border 
          style="width: 100%"
        >
          <el-table-column type="index" width="60" label="序号" />
          <el-table-column prop="productName" label="产品名称" width="150" />
          <el-table-column prop="totalCount" label="总批次" width="100" />
          <el-table-column prop="qualifiedCount" label="合格批次" width="120" />
          <el-table-column prop="qualifiedRate" label="合格率" width="100">
            <template #default="{ row }">
              <el-progress
                :percentage="row.qualifiedRate"
                :color="getProgressColor(row.qualifiedRate)"
                :show-text="false"
                :stroke-width="8"
              />
              <span style="margin-left: 10px">{{ row.qualifiedRate }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="returnCount" label="退货批次" width="100" />
          <el-table-column prop="returnRate" label="退货率" width="100">
            <template #default="{ row }">
              {{ row.returnRate }}%
            </template>
          </el-table-column>
          <el-table-column prop="avgScore" label="平均评分" width="120">
            <template #default="{ row }">
              <el-rate v-model="row.avgScore" disabled size="small" />
            </template>
          </el-table-column>
        </el-table>

        <!-- 交付绩效表格 -->
        <el-table 
          v-else-if="activeTableTab === 'delivery'"
          :data="deliveryStatsData" 
          stripe 
          border 
          style="width: 100%"
        >
          <el-table-column type="index" width="60" label="序号" />
          <el-table-column prop="month" label="月份" width="100" />
          <el-table-column prop="totalOrders" label="总订单" width="100" />
          <el-table-column prop="onTimeOrders" label="准时订单" width="100" />
          <el-table-column prop="onTimeRate" label="准时率" width="120">
            <template #default="{ row }">
              <el-progress
                :percentage="row.onTimeRate"
                :color="getProgressColor(row.onTimeRate)"
                :show-text="false"
                :stroke-width="8"
              />
              <span style="margin-left: 10px">{{ row.onTimeRate }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="avgDeliveryDays" label="平均交付天数" width="140" />
          <el-table-column prop="delayedOrders" label="延迟订单" width="100" />
          <el-table-column prop="maxDelayDays" label="最大延迟天数" width="120" />
        </el-table>

        <!-- 财务数据表格 -->
        <el-table 
          v-else-if="activeTableTab === 'finance'"
          :data="financeStatsData" 
          stripe 
          border 
          style="width: 100%"
        >
          <el-table-column type="index" width="60" label="序号" />
          <el-table-column prop="month" label="月份" width="100" />
          <el-table-column prop="purchaseAmount" label="采购金额" width="150">
            <template #default="{ row }">
              ¥{{ formatNumber(row.purchaseAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="discountAmount" label="优惠金额" width="150">
            <template #default="{ row }">
              ¥{{ formatNumber(row.discountAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="actualAmount" label="实际金额" width="150">
            <template #default="{ row }">
              ¥{{ formatNumber(row.actualAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="paymentTimeliness" label="付款及时率" width="120">
            <template #default="{ row }">
              {{ row.paymentTimeliness }}%
            </template>
          </el-table-column>
          <el-table-column prop="creditUtilization" label="信用使用率" width="120">
            <template #default="{ row }">
              {{ row.creditUtilization }}%
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { 
  Money, TrendCharts, Timer, Box, InfoFilled,
  ArrowUp, ArrowDown, Minus
} from '@element-plus/icons-vue'

const props = defineProps({
  supplierId: {
    type: [String, Number],
    required: true
  },
  supplierName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['data-updated'])

// 响应式数据
const loading = ref(false)
const dateRange = ref([])
const purchaseAmountPeriod = ref('month')
const orderDistributionType = ref('product')
const activeTableTab = ref('orders')

// 图表引用
const purchaseAmountChartRef = ref()
const orderDistributionChartRef = ref()
const deliveryRateChartRef = ref()
const qualityRateChartRef = ref()
const priceCompetitivenessChartRef = ref()

// 图表实例
const charts = reactive({
  purchaseAmount: null,
  orderDistribution: null,
  deliveryRate: null,
  qualityRate: null,
  priceCompetitiveness: null
})

// 关键指标
const keyIndicators = reactive([
  {
    key: 'totalAmount',
    title: '总采购额',
    subtitle: '本年度累计',
    value: '2,456,789',
    unit: '元',
    icon: Money,
    iconClass: 'money-icon',
    trend: 'up',
    trendIcon: ArrowUp,
    trendClass: 'trend-up',
    trendText: '较上月',
    trendValue: '+12.5%'
  },
  {
    key: 'orderCount',
    title: '订单总数',
    subtitle: '本年度累计',
    value: '156',
    unit: '单',
    icon: Box,
    iconClass: 'order-icon',
    trend: 'up',
    trendIcon: ArrowUp,
    trendClass: 'trend-up',
    trendText: '较上月',
    trendValue: '+8.3%'
  },
  {
    key: 'onTimeRate',
    title: '准时交付率',
    subtitle: '本年度平均',
    value: '96.8',
    unit: '%',
    icon: Timer,
    iconClass: 'time-icon',
    trend: 'down',
    trendIcon: ArrowDown,
    trendClass: 'trend-down',
    trendText: '较上月',
    trendValue: '-0.5%'
  },
  {
    key: 'qualityRate',
    title: '质量合格率',
    subtitle: '本年度平均',
    value: '98.2',
    unit: '%',
    icon: TrendCharts,
    iconClass: 'trend-icon',
    trend: 'up',
    trendIcon: ArrowUp,
    trendClass: 'trend-up',
    trendText: '较上月',
    trendValue: '+0.3%'
  }
])

// 表格数据
const orderStatsData = ref([
  {
    month: '2024-01',
    orderCount: 12,
    totalAmount: 185680,
    avgAmount: 15473,
    productTypes: 8,
    onTimeRate: 95.8,
    qualityRate: 97.2
  },
  {
    month: '2024-02',
    orderCount: 15,
    totalAmount: 223450,
    avgAmount: 14897,
    productTypes: 10,
    onTimeRate: 96.7,
    qualityRate: 98.1
  },
  {
    month: '2024-03',
    orderCount: 18,
    totalAmount: 267890,
    avgAmount: 14883,
    productTypes: 12,
    onTimeRate: 97.2,
    qualityRate: 98.5
  }
])

const qualityStatsData = ref([
  {
    productName: '原材料A',
    totalCount: 45,
    qualifiedCount: 44,
    qualifiedRate: 97.8,
    returnCount: 1,
    returnRate: 2.2,
    avgScore: 4.5
  },
  {
    productName: '零部件B',
    totalCount: 32,
    qualifiedCount: 31,
    qualifiedRate: 96.9,
    returnCount: 1,
    returnRate: 3.1,
    avgScore: 4.3
  },
  {
    productName: '设备C',
    totalCount: 18,
    qualifiedCount: 18,
    qualifiedRate: 100,
    returnCount: 0,
    returnRate: 0,
    avgScore: 4.8
  }
])

const deliveryStatsData = ref([
  {
    month: '2024-01',
    totalOrders: 12,
    onTimeOrders: 11,
    onTimeRate: 91.7,
    avgDeliveryDays: 3.2,
    delayedOrders: 1,
    maxDelayDays: 2
  },
  {
    month: '2024-02',
    totalOrders: 15,
    onTimeOrders: 14,
    onTimeRate: 93.3,
    avgDeliveryDays: 2.8,
    delayedOrders: 1,
    maxDelayDays: 3
  },
  {
    month: '2024-03',
    totalOrders: 18,
    onTimeOrders: 17,
    onTimeRate: 94.4,
    avgDeliveryDays: 2.5,
    delayedOrders: 1,
    maxDelayDays: 1
  }
])

const financeStatsData = ref([
  {
    month: '2024-01',
    purchaseAmount: 185680,
    discountAmount: 9284,
    actualAmount: 176396,
    paymentTimeliness: 95.8,
    creditUtilization: 78.5
  },
  {
    month: '2024-02',
    purchaseAmount: 223450,
    discountAmount: 11173,
    actualAmount: 212277,
    paymentTimeliness: 97.2,
    creditUtilization: 82.3
  },
  {
    month: '2024-03',
    purchaseAmount: 267890,
    discountAmount: 13395,
    actualAmount: 254495,
    paymentTimeliness: 96.5,
    creditUtilization: 85.7
  }
])

// 方法
const getProgressColor = (percentage) => {
  if (percentage >= 95) return '#67c23a'
  if (percentage >= 85) return '#409eff'
  if (percentage >= 75) return '#e6a23c'
  return '#f56c6c'
}

const formatNumber = (num) => {
  return Number(num).toLocaleString()
}

const handleDateChange = (dates) => {
  if (dates) {
    refreshData()
  }
}

const refreshData = async () => {
  loading.value = true
  try {
    // 这里调用API刷新数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 重新初始化图表
    initAllCharts()
    
    ElMessage.success('数据刷新成功')
    emit('data-updated')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

const exportReport = () => {
  ElMessage.success('报表导出功能开发中...')
}

const viewMonthDetail = (row) => {
  ElMessage.info(`查看${row.month}月详情功能开发中...`)
}

// 图表初始化方法
const initPurchaseAmountChart = () => {
  if (!purchaseAmountChartRef.value) return
  
  charts.purchaseAmount = echarts.init(purchaseAmountChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>{a}: ¥{c}'
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [{
      name: '采购金额',
      type: 'line',
      data: [185680, 223450, 267890, 198760, 234560, 278900],
      smooth: true,
      itemStyle: {
        color: '#409eff'
      },
      areaStyle: {
        color: 'rgba(64, 158, 255, 0.1)'
      }
    }]
  }
  
  charts.purchaseAmount.setOption(option)
}

const initOrderDistributionChart = () => {
  if (!orderDistributionChartRef.value) return
  
  charts.orderDistribution = echarts.init(orderDistributionChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a}<br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [{
      name: '订单分布',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: {
        show: false
      },
      labelLine: {
        show: false
      },
      data: [
        { value: 45, name: '原材料' },
        { value: 28, name: '零部件' },
        { value: 18, name: '设备' },
        { value: 12, name: '办公用品' },
        { value: 8, name: '其他' }
      ]
    }]
  }
  
  charts.orderDistribution.setOption(option)
}

const initDeliveryRateChart = () => {
  if (!deliveryRateChartRef.value) return
  
  charts.deliveryRate = echarts.init(deliveryRateChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>{a}: {c}%'
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value',
      min: 80,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [{
      name: '准时交付率',
      type: 'bar',
      data: [91.7, 93.3, 94.4, 92.8, 95.2, 94.1],
      itemStyle: {
        color: '#67c23a'
      }
    }]
  }
  
  charts.deliveryRate.setOption(option)
}

const initQualityRateChart = () => {
  if (!qualityRateChartRef.value) return
  
  charts.qualityRate = echarts.init(qualityRateChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: ['原材料A', '零部件B', '设备C', '产品D', '配件E']
    },
    yAxis: {
      type: 'value',
      min: 90,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [{
      name: '合格率',
      type: 'bar',
      data: [97.8, 96.9, 100, 98.5, 95.2],
      itemStyle: {
        color: '#409eff'
      }
    }]
  }
  
  charts.qualityRate.setOption(option)
}

const initPriceCompetitivenessChart = () => {
  if (!priceCompetitivenessChartRef.value) return
  
  charts.priceCompetitiveness = echarts.init(priceCompetitivenessChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['当前价格', '市场均价']
    },
    xAxis: {
      type: 'category',
      data: ['原材料A', '零部件B', '设备C', '产品D']
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '当前价格',
        type: 'bar',
        data: [120, 200, 150, 80],
        itemStyle: {
          color: '#e6a23c'
        }
      },
      {
        name: '市场均价',
        type: 'line',
        data: [125, 195, 160, 85],
        itemStyle: {
          color: '#f56c6c'
        }
      }
    ]
  }
  
  charts.priceCompetitiveness.setOption(option)
}

const initAllCharts = () => {
  nextTick(() => {
    initPurchaseAmountChart()
    initOrderDistributionChart()
    initDeliveryRateChart()
    initQualityRateChart()
    initPriceCompetitivenessChart()
    
    // 添加resize监听
    Object.values(charts).forEach(chart => {
      if (chart) {
        window.addEventListener('resize', () => chart.resize())
      }
    })
  })
}

const handleResize = () => {
  Object.values(charts).forEach(chart => {
    if (chart) {
      chart.resize()
    }
  })
}

// 监听数据变化
watch(purchaseAmountPeriod, () => {
  initPurchaseAmountChart()
})

watch(orderDistributionType, () => {
  initOrderDistributionChart()
})

onMounted(() => {
  // 设置默认日期范围（最近6个月）
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 6)
  dateRange.value = [
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  ]
  
  initAllCharts()
})

// 组件卸载时清理
onUnmounted(() => {
  Object.values(charts).forEach(chart => {
    if (chart) {
      chart.dispose()
    }
  })
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.performance-stats {
  .stats-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .header-left {
        display: flex;
        align-items: center;
        
        h3 {
          margin: 0;
          color: #303133;
        }
      }
      
      .header-right {
        display: flex;
        gap: 12px;
      }
    }
  }
  
  .key-indicators {
    margin-bottom: 32px;
    
    .indicator-card {
      padding: 20px;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      background: #fff;
      transition: all 0.3s;
      
      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }
      
      .indicator-header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        
        .el-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          margin-right: 12px;
          
          &.money-icon { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          &.order-icon { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
          &.time-icon { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
          &.trend-icon { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
        }
        
        .indicator-info {
          .indicator-title {
            font-size: 14px;
            color: #606266;
            margin-bottom: 4px;
          }
          
          .indicator-subtitle {
            font-size: 12px;
            color: #909399;
          }
        }
      }
      
      .indicator-value {
        margin-bottom: 12px;
        
        .value {
          font-size: 28px;
          font-weight: bold;
          color: #303133;
        }
        
        .unit {
          font-size: 14px;
          color: #909399;
          margin-left: 4px;
        }
      }
      
      .indicator-trend {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        
        .trend-up {
          color: #67c23a;
        }
        
        .trend-down {
          color: #f56c6c;
        }
        
        .trend-text {
          color: #606266;
        }
        
        .trend-value {
          color: #909399;
        }
      }
    }
  }
  
  .charts-section {
    margin-bottom: 32px;
    
    .chart-container {
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      padding: 20px;
      background: #fafafa;
      
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        
        h4 {
          margin: 0;
          color: #303133;
        }
      }
      
      .chart {
        height: 300px;
        width: 100%;
      }
    }
  }
  
  .data-table {
    .table-header {
      margin-bottom: 16px;
      
      h4 {
        margin: 0 0 16px 0;
        color: #303133;
      }
    }
  }
}
</style>