<template>
  <div class="chart-demo-container">
    <h1 class="demo-title">图表组件示例</h1>
    
    <!-- 基础图表使用示例 -->
    <section class="demo-section">
      <h2 class="section-title">基础图表组件</h2>
      <p class="section-description">所有图表组件都继承自BaseChart，提供了统一的加载、错误和空状态处理。</p>
    </section>
    
    <!-- 折线图示例 -->
    <section class="demo-section">
      <h2 class="section-title">折线图示例</h2>
      <DashboardWidget title="销售额趋势" :show-refresh="true" @refresh="refreshLineChart">
        <LineChart
          :data="lineChartData"
          :y-fields="[
            { field: 'sales', name: '销售额', color: '#1890ff' },
            { field: 'profit', name: '利润', color: '#52c41a' }
          ]"
          :show-value="true"
          @click="handleChartClick"
        />
      </DashboardWidget>
    </section>
    
    <!-- 柱状图示例 -->
    <section class="demo-section">
      <h2 class="section-title">柱状图示例</h2>
      <DashboardWidget title="月度销量对比" :show-refresh="true" @refresh="refreshBarChart">
        <BarChart
          :data="barChartData"
          :y-fields="[
            { field: 'actual', name: '实际销量', color: '#1890ff' },
            { field: 'target', name: '目标销量', color: '#faad14' }
          ]"
          :show-value="true"
          :is-stacked="false"
        />
      </DashboardWidget>
    </section>
    
    <!-- 饼图示例 -->
    <section class="demo-section">
      <h2 class="section-title">饼图示例</h2>
      <DashboardWidget title="销售渠道分布" :show-refresh="true" @refresh="refreshPieChart">
        <PieChart
          :data="pieChartData"
          :name-field="'channel'"
          :value-field="'sales'"
          :show-percent="true"
          :type="'ring'"
          :outer-radius="'70%'"
        />
      </DashboardWidget>
    </section>
    
    <!-- KPI图表示例 -->
    <section class="demo-section">
      <h2 class="section-title">KPI图表示例</h2>
      <DashboardWidget title="本月销售额KPI" :show-refresh="true" @refresh="refreshKPIChart">
        <KPIChart
          title="月度销售额"
          :data="kpiTrendData"
          :current-value="currentSales"
          :change-value="salesGrowthRate"
          :format="'currency'"
          :chart-type="'area'"
        />
      </DashboardWidget>
    </section>
    
    <!-- 趋势图示例 -->
    <section class="demo-section">
      <h2 class="section-title">趋势图示例（含预测）</h2>
      <DashboardWidget title="未来销售额预测" :show-refresh="true" @refresh="refreshTrendChart">
        <TrendChart
          :data="historicalData"
          :forecast-data="forecastData"
          :show-forecast-range="true"
          :y-fields="[{ field: 'value', name: '历史销售额', color: '#1890ff' }]"
        />
      </DashboardWidget>
    </section>
    
    <!-- 仪表盘示例 -->
    <section class="demo-section">
      <h2 class="section-title">仪表盘示例</h2>
      <Dashboard
        title="销售概览仪表盘"
        :kpi-items="kpiItems"
        :actions="true"
        :loading="dashboardLoading"
      >
        <template #actions>
          <el-button type="primary" size="small" @click="refreshDashboard">刷新数据</el-button>
          <el-button type="default" size="small" @click="exportDashboard">导出报表</el-button>
        </template>
        
        <div class="dashboard-grid">
          <div class="dashboard-col">
            <DashboardWidget title="销售额趋势" size="small">
              <LineChart :data="lineChartData" height="200" :show-legend="false" />
            </DashboardWidget>
          </div>
          <div class="dashboard-col">
            <DashboardWidget title="渠道分布" size="small">
              <PieChart :data="pieChartData" height="200" :show-legend="false" />
            </DashboardWidget>
          </div>
        </div>
      </Dashboard>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Dashboard, DashboardWidget, LineChart, BarChart, PieChart, KPIChart, TrendChart } from './index'

// 模拟数据
const lineChartData = ref<any[]>([])
const barChartData = ref<any[]>([])
const pieChartData = ref<any[]>([])
const kpiTrendData = ref<any[]>([])
const historicalData = ref<any[]>([])
const forecastData = ref<any[]>([])

// KPI数据
const currentSales = ref(1250000)
const salesGrowthRate = ref(12.5)

// 仪表盘数据
const dashboardLoading = ref(false)
const kpiItems = ref([
  {
    label: '总销售额',
    value: 1250000,
    format: 'currency',
    change: 12.5,
    description: '同比增长'
  },
  {
    label: '订单数量',
    value: 528,
    format: 'number',
    change: 8.3,
    description: '同比增长'
  },
  {
    label: '客单价',
    value: 2367.42,
    format: 'currency',
    change: 3.9,
    description: '同比增长'
  },
  {
    label: '转化率',
    value: 0.058,
    format: 'percentage',
    change: -1.2,
    description: '同比变化'
  }
])

// 生成模拟数据
const generateLineChartData = () => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  return months.map(month => ({
    date: month,
    sales: Math.floor(Math.random() * 500000) + 500000,
    profit: Math.floor(Math.random() * 200000) + 100000
  }))
}

const generateBarChartData = () => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月']
  return months.map(month => ({
    name: month,
    actual: Math.floor(Math.random() * 1000) + 1000,
    target: 2000
  }))
}

const generatePieChartData = () => {
  return [
    { channel: '线上商城', sales: 450000 },
    { channel: '线下门店', sales: 320000 },
    { channel: '代理商', sales: 280000 },
    { channel: '其他渠道', sales: 200000 }
  ]
}

const generateHistoricalAndForecastData = () => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const historical = months.slice(0, 6).map((month, index) => ({
    date: month,
    value: Math.floor(Math.random() * 300000) + 500000
  }))
  
  const forecast = months.slice(6).map((month, index) => {
    const baseValue = historical[historical.length - 1].value
    const trend = (index + 1) * 50000
    const randomVariation = Math.floor(Math.random() * 40000) - 20000
    const value = baseValue + trend + randomVariation
    return {
      date: month,
      forecast: value,
      upper: value * 1.1,
      lower: value * 0.9
    }
  })
  
  return { historical, forecast }
}

// 刷新数据方法
const refreshLineChart = () => {
  lineChartData.value = generateLineChartData()
  kpiTrendData.value = lineChartData.value.slice(-7)
}

const refreshBarChart = () => {
  barChartData.value = generateBarChartData()
}

const refreshPieChart = () => {
  pieChartData.value = generatePieChartData()
}

const refreshKPIChart = () => {
  refreshLineChart()
  currentSales.value = Math.floor(Math.random() * 1000000) + 1000000
  salesGrowthRate.value = Math.round((Math.random() * 20 - 5) * 10) / 10
}

const refreshTrendChart = () => {
  const { historical, forecast } = generateHistoricalAndForecastData()
  historicalData.value = historical
  forecastData.value = forecast
}

const refreshDashboard = () => {
  dashboardLoading.value = true
  setTimeout(() => {
    refreshLineChart()
    refreshBarChart()
    refreshPieChart()
    refreshTrendChart()
    dashboardLoading.value = false
  }, 1000)
}

const exportDashboard = () => {
  alert('导出报表功能待实现')
}

// 事件处理
const handleChartClick = (params: any) => {
  console.log('Chart clicked:', params)
  alert(`点击了${params.name}: ${params.value}`)
}

// 初始化数据
onMounted(() => {
  refreshLineChart()
  refreshBarChart()
  refreshPieChart()
  refreshTrendChart()
})
</script>

<style scoped>
.chart-demo-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.demo-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 30px;
  text-align: center;
}

.demo-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.section-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 20px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.dashboard-col {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-demo-container {
    padding: 10px;
  }
  
  .demo-title {
    font-size: 24px;
    margin-bottom: 20px;
  }
  
  .section-title {
    font-size: 18px;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>