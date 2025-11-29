<template>
  <div class="sales-dashboard">
    <!-- 页面头部 -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">销售概览</h1>
          <p class="page-subtitle">实时监控销售数据，优化业务决策</p>
        </div>
        <div class="header-actions">
          <div class="date-range-selector">
            <select v-model="selectedPeriod" @change="handlePeriodChange">
              <option value="today">今日</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
              <option value="quarter">本季度</option>
              <option value="year">本年</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <button class="btn-refresh" @click="refreshData" :disabled="isLoading">
            <i class="fas fa-sync-alt" :class="{ 'spinning': isLoading }"></i>
            刷新数据
          </button>
          <button class="btn-export" @click="exportReport">
            <i class="fas fa-download"></i>
            导出报表
          </button>
        </div>
      </div>
    </header>

    <!-- 自定义日期范围选择器 -->
    <div v-if="selectedPeriod === 'custom'" class="custom-date-range">
      <div class="date-inputs">
        <input 
          v-model="customDateRange.start" 
          type="date" 
          @change="handleCustomDateChange"
        />
        <span>至</span>
        <input 
          v-model="customDateRange.end" 
          type="date" 
          @change="handleCustomDateChange"
        />
      </div>
    </div>

    <!-- 关键指标卡片 -->
    <section class="metrics-section">
      <div class="metrics-grid">
        <div class="metric-card sales-revenue">
          <div class="metric-header">
            <div class="metric-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="metric-trend" :class="metrics.revenue.trend">
              <i class="fas" :class="getTrendIcon(metrics.revenue.trend)"></i>
              {{ formatTrendPercentage(metrics.revenue.trendPercentage) }}
            </div>
          </div>
          <div class="metric-content">
            <div class="metric-value">¥{{ formatLargeNumber(metrics.revenue.value) }}</div>
            <div class="metric-label">销售总额</div>
            <div class="metric-compare">
              较上期 {{ formatTrendText(metrics.revenue.trend) }}
              <span class="compare-value">¥{{ formatLargeNumber(metrics.revenue.compareValue) }}</span>
            </div>
          </div>
        </div>

        <div class="metric-card orders-count">
          <div class="metric-header">
            <div class="metric-icon">
              <i class="fas fa-shopping-cart"></i>
            </div>
            <div class="metric-trend" :class="metrics.orders.trend">
              <i class="fas" :class="getTrendIcon(metrics.orders.trend)"></i>
              {{ formatTrendPercentage(metrics.orders.trendPercentage) }}
            </div>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ formatLargeNumber(metrics.orders.value) }}</div>
            <div class="metric-label">订单数量</div>
            <div class="metric-compare">
              较上期 {{ formatTrendText(metrics.orders.trend) }}
              <span class="compare-value">{{ metrics.orders.compareValue }} 单</span>
            </div>
          </div>
        </div>

        <div class="metric-card customers-count">
          <div class="metric-header">
            <div class="metric-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="metric-trend" :class="metrics.customers.trend">
              <i class="fas" :class="getTrendIcon(metrics.customers.trend)"></i>
              {{ formatTrendPercentage(metrics.customers.trendPercentage) }}
            </div>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ formatLargeNumber(metrics.customers.value) }}</div>
            <div class="metric-label">客户数量</div>
            <div class="metric-compare">
              较上期 {{ formatTrendText(metrics.customers.trend) }}
              <span class="compare-value">{{ metrics.customers.compareValue }} 位</span>
            </div>
          </div>
        </div>

        <div class="metric-card conversion-rate">
          <div class="metric-header">
            <div class="metric-icon">
              <i class="fas fa-percentage"></i>
            </div>
            <div class="metric-trend" :class="metrics.conversion.trend">
              <i class="fas" :class="getTrendIcon(metrics.conversion.trend)"></i>
              {{ formatTrendPercentage(metrics.conversion.trendPercentage) }}
            </div>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ metrics.conversion.value }}%</div>
            <div class="metric-label">转化率</div>
            <div class="metric-compare">
              较上期 {{ formatTrendText(metrics.conversion.trend) }}
              <span class="compare-value">{{ metrics.conversion.compareValue }}%</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 图表和数据区域 -->
    <div class="charts-section">
      <div class="charts-grid">
        <!-- 销售趋势图表 -->
        <div class="chart-container sales-trend">
          <div class="chart-header">
            <h3 class="chart-title">销售趋势</h3>
            <div class="chart-actions">
              <button 
                class="chart-action-btn"
                :class="{ active: salesTrendType === 'revenue' }"
                @click="salesTrendType = 'revenue'"
              >
                销售额
              </button>
              <button 
                class="chart-action-btn"
                :class="{ active: salesTrendType === 'orders' }"
                @click="salesTrendType = 'orders'"
              >
                订单量
              </button>
            </div>
          </div>
          <div class="chart-content">
            <canvas ref="salesTrendChart" class="trend-chart"></canvas>
          </div>
        </div>

        <!-- 产品销售排行 -->
        <div class="chart-container product-ranking">
          <div class="chart-header">
            <h3 class="chart-title">产品销售排行</h3>
            <button class="btn-more" @click="viewMoreProducts">
              查看更多 <i class="fas fa-arrow-right"></i>
            </button>
          </div>
          <div class="chart-content">
            <div class="ranking-list">
              <div 
                v-for="(product, index) in topProducts" 
                :key="product.id"
                class="ranking-item"
                :class="{ 'top-three': index < 3 }"
              >
                <div class="ranking-number">{{ index + 1 }}</div>
                <div class="product-info">
                  <div class="product-name">{{ product.name }}</div>
                  <div class="product-code">{{ product.code }}</div>
                </div>
                <div class="sales-info">
                  <div class="sales-amount">¥{{ formatLargeNumber(product.salesAmount) }}</div>
                  <div class="sales-quantity">{{ product.quantity }} 件</div>
                </div>
                <div class="trend-indicator" :class="product.trend">
                  <i class="fas" :class="getTrendIcon(product.trend)"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 客户分析和销售目标 -->
    <div class="analysis-section">
      <div class="analysis-grid">
        <!-- 客户分析 -->
        <div class="analysis-container customer-analysis">
          <div class="analysis-header">
            <h3 class="analysis-title">客户分析</h3>
            <div class="analysis-tabs">
              <button 
                class="tab-btn"
                :class="{ active: customerAnalysisType === 'type' }"
                @click="customerAnalysisType = 'type'"
              >
                客户类型
              </button>
              <button 
                class="tab-btn"
                :class="{ active: customerAnalysisType === 'region' }"
                @click="customerAnalysisType = 'region'"
              >
                地域分布
              </button>
            </div>
          </div>
          <div class="analysis-content">
            <canvas ref="customerAnalysisChart" class="analysis-chart"></canvas>
          </div>
        </div>

        <!-- 销售目标进度 -->
        <div class="analysis-container sales-targets">
          <div class="analysis-header">
            <h3 class="analysis-title">销售目标</h3>
            <select v-model="selectedTargetPeriod" @change="loadSalesTargets">
              <option value="monthly">月度目标</option>
              <option value="quarterly">季度目标</option>
              <option value="yearly">年度目标</option>
            </select>
          </div>
          <div class="analysis-content">
            <div class="targets-list">
              <div 
                v-for="target in salesTargets" 
                :key="target.id"
                class="target-item"
              >
                <div class="target-info">
                  <div class="target-name">{{ target.name }}</div>
                  <div class="target-progress">
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        :style="{ width: target.progress + '%' }"
                        :class="getProgressClass(target.progress)"
                      ></div>
                    </div>
                    <div class="progress-text">{{ target.progress }}%</div>
                  </div>
                </div>
                <div class="target-metrics">
                  <div class="metric-row">
                    <span class="metric-label">目标</span>
                    <span class="metric-value">{{ formatTargetValue(target.target, target.type) }}</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">当前</span>
                    <span class="metric-value current">{{ formatTargetValue(target.current, target.type) }}</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">剩余</span>
                    <span class="metric-value remaining">{{ formatTargetValue(target.target - target.current, target.type) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最新动态 -->
    <section class="activities-section">
      <div class="activities-header">
        <h3 class="section-title">最新动态</h3>
        <div class="activity-filters">
          <button 
            class="filter-btn"
            :class="{ active: activityFilter === 'all' }"
            @click="activityFilter = 'all'"
          >
            全部
          </button>
          <button 
            class="filter-btn"
            :class="{ active: activityFilter === 'orders' }"
            @click="activityFilter = 'orders'"
          >
            订单
          </button>
          <button 
            class="filter-btn"
            :class="{ active: activityFilter === 'quotations' }"
            @click="activityFilter = 'quotations'"
          >
            报价
          </button>
          <button 
            class="filter-btn"
            :class="{ active: activityFilter === 'customers' }"
            @click="activityFilter = 'customers'"
          >
            客户
          </button>
        </div>
      </div>
      
      <div class="activities-list">
        <div 
          v-for="activity in filteredActivities" 
          :key="activity.id"
          class="activity-item"
          :class="activity.type"
        >
          <div class="activity-icon">
            <i :class="getActivityIcon(activity.type)"></i>
          </div>
          <div class="activity-content">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-description">{{ activity.description }}</div>
            <div class="activity-meta">
              <span class="activity-time">{{ formatDateTime(activity.createdAt) }}</span>
              <span class="activity-user">{{ activity.user }}</span>
            </div>
          </div>
          <div class="activity-amount" v-if="activity.amount">
            ¥{{ formatLargeNumber(activity.amount) }}
          </div>
        </div>
      </div>
      
      <div class="activities-footer">
        <button class="btn-load-more" @click="loadMoreActivities" :disabled="!hasMoreActivities">
          <i class="fas fa-plus"></i>
          加载更多
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Chart, registerables } from 'chart.js'
import SalesApi from '@/api/sales'

// 注册Chart.js组件
Chart.register(...registerables)

// 接口定义
interface SalesMetrics {
  revenue: {
    value: number
    compareValue: number
    trend: 'up' | 'down' | 'stable'
    trendPercentage: number
  }
  orders: {
    value: number
    compareValue: number
    trend: 'up' | 'down' | 'stable'
    trendPercentage: number
  }
  customers: {
    value: number
    compareValue: number
    trend: 'up' | 'down' | 'stable'
    trendPercentage: number
  }
  conversion: {
    value: number
    compareValue: number
    trend: 'up' | 'down' | 'stable'
    trendPercentage: number
  }
}

interface TopProduct {
  id: string
  name: string
  code: string
  salesAmount: number
  quantity: number
  trend: 'up' | 'down' | 'stable'
}

interface SalesTarget {
  id: string
  name: string
  type: 'revenue' | 'orders' | 'customers'
  target: number
  current: number
  progress: number
}

interface Activity {
  id: string
  type: 'order' | 'quotation' | 'customer' | 'payment'
  title: string
  description: string
  amount?: number
  user: string
  createdAt: string
}

// 响应式数据
const isLoading = ref(false)
const selectedPeriod = ref('month')
const customDateRange = reactive({
  start: '',
  end: ''
})
const salesTrendType = ref<'revenue' | 'orders'>('revenue')
const customerAnalysisType = ref<'type' | 'region'>('type')
const selectedTargetPeriod = ref<'monthly' | 'quarterly' | 'yearly'>('monthly')
const activityFilter = ref<'all' | 'orders' | 'quotations' | 'customers'>('all')

const metrics = reactive<SalesMetrics>({
  revenue: { value: 0, compareValue: 0, trend: 'up', trendPercentage: 15.2 },
  orders: { value: 0, compareValue: 0, trend: 'up', trendPercentage: 8.7 },
  customers: { value: 0, compareValue: 0, trend: 'up', trendPercentage: 12.3 },
  conversion: { value: 0, compareValue: 0, trend: 'down', trendPercentage: -2.1 }
})

const topProducts = ref<TopProduct[]>([])
const salesTargets = ref<SalesTarget[]>([])
const activities = ref<Activity[]>([])
const hasMoreActivities = ref(true)

// Chart实例
const salesTrendChart = ref<HTMLCanvasElement | null>(null)
const customerAnalysisChart = ref<HTMLCanvasElement | null>(null)
let salesTrendChartInstance: Chart | null = null
let customerAnalysisChartInstance: Chart | null = null

// 计算属性
const filteredActivities = computed(() => {
  if (activityFilter.value === 'all') {
    return activities.value
  }
  return activities.value.filter(activity => activity.type === activityFilter.value)
})

// 方法
const formatLargeNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatTrendPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? '+' : ''
  return `${sign}${percentage.toFixed(1)}%`
}

const formatTrendText = (trend: 'up' | 'down' | 'stable'): string => {
  const trendMap = {
    up: '增长',
    down: '下降',
    stable: '持平'
  }
  return trendMap[trend] || '持平'
}

const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
  const iconMap = {
    up: 'fa-arrow-up',
    down: 'fa-arrow-down',
    stable: 'fa-minus'
  }
  return iconMap[trend] || 'fa-minus'
}

const getProgressClass = (progress: number): string => {
  if (progress >= 80) return 'high'
  if (progress >= 50) return 'medium'
  return 'low'
}

const formatTargetValue = (value: number, type: string): string => {
  if (type === 'revenue') {
    return `¥${formatLargeNumber(value)}`
  }
  return formatLargeNumber(value)
}

const getActivityIcon = (type: string): string => {
  const iconMap = {
    order: 'fas fa-shopping-cart',
    quotation: 'fas fa-file-invoice',
    customer: 'fas fa-user-plus',
    payment: 'fas fa-credit-card'
  }
  return iconMap[type] || 'fas fa-circle'
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60))
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else {
    const days = Math.floor(hours / 24)
    return `${days}天前`
  }
}

const handlePeriodChange = () => {
  loadDashboardData()
}

const handleCustomDateChange = () => {
  if (customDateRange.start && customDateRange.end) {
    loadDashboardData()
  }
}

const refreshData = async () => {
  isLoading.value = true
  try {
    await loadDashboardData()
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  } finally {
    isLoading.value = false
  }
}

const exportReport = () => {
  // 实现导出功能
  ElMessage.success('报表导出成功')
}

const viewMoreProducts = () => {
  // 跳转到产品页面
  console.log('查看更多产品')
}

const loadSalesTargets = async () => {
  try {
    const response = await SalesApi.getSalesTargets({
      period: selectedTargetPeriod.value
    })
    salesTargets.value = response.data
  } catch (error) {
    console.error('加载销售目标失败:', error)
  }
}

const loadMoreActivities = async () => {
  try {
    const lastActivity = activities.value[activities.value.length - 1]
    const response = await SalesApi.getActivities({
      type: activityFilter.value,
      before: lastActivity?.createdAt,
      limit: 10
    })
    
    if (response.data.length === 0) {
      hasMoreActivities.value = false
    } else {
      activities.value.push(...response.data)
    }
  } catch (error) {
    console.error('加载更多动态失败:', error)
  }
}

const initializeSalesTrendChart = () => {
  if (!salesTrendChart.value) return

  const ctx = salesTrendChart.value.getContext('2d')
  if (!ctx) return

  // 销售趋势数据
  const trendData = {
    revenue: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      datasets: [{
        label: '销售额 (万元)',
        data: [120, 145, 165, 142, 178, 195, 182, 168, 192, 185, 210, 225],
        borderColor: '#38B2AC',
        backgroundColor: 'rgba(56, 178, 172, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    orders: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      datasets: [{
        label: '订单量',
        data: [85, 92, 108, 95, 110, 125, 118, 105, 130, 122, 145, 158],
        borderColor: '#ED8936',
        backgroundColor: 'rgba(237, 137, 54, 0.1)',
        tension: 0.4,
        fill: true
      }]
    }
  }

  salesTrendChartInstance = new Chart(ctx, {
    type: 'line',
    data: trendData[salesTrendType.value],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  })
}

const initializeCustomerAnalysisChart = () => {
  if (!customerAnalysisChart.value) return

  const ctx = customerAnalysisChart.value.getContext('2d')
  if (!ctx) return

  const analysisData = {
    type: {
      labels: ['新客户', '老客户', 'VIP客户', '潜在客户'],
      datasets: [{
        label: '客户数量',
        data: [45, 128, 23, 67],
        backgroundColor: ['#38B2AC', '#ED8936', '#48BB78', '#A0AEC0']
      }]
    },
    region: {
      labels: ['华东', '华南', '华北', '西南', '西北', '东北'],
      datasets: [{
        label: '客户数量',
        data: [68, 45, 38, 25, 15, 12],
        backgroundColor: ['#38B2AC', '#ED8936', '#48BB78', '#A0AEC0', '#718096', '#2D3748']
      }]
    }
  }

  customerAnalysisChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: analysisData[customerAnalysisType.value],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  })
}

const loadDashboardData = async () => {
  isLoading.value = true
  try {
    // 加载关键指标
    const metricsResponse = await SalesApi.getSalesMetrics({
      period: selectedPeriod.value,
      startDate: customDateRange.start,
      endDate: customDateRange.end
    })
    Object.assign(metrics, metricsResponse.data)

    // 加载热销产品
    const productsResponse = await SalesApi.getTopProducts({
      limit: 8,
      period: selectedPeriod.value
    })
    topProducts.value = productsResponse.data

    // 加载销售目标
    await loadSalesTargets()

    // 加载最新动态
    const activitiesResponse = await SalesApi.getActivities({
      type: activityFilter.value,
      limit: 10
    })
    activities.value = activitiesResponse.data

    // 更新图表
    updateCharts()
  } catch (error) {
    console.error('加载仪表板数据失败:', error)
    ElMessage.error('数据加载失败')
  } finally {
    isLoading.value = false
  }
}

const updateCharts = () => {
  nextTick(() => {
    initializeSalesTrendChart()
    initializeCustomerAnalysisChart()
  })
}

// 监听器
watch(salesTrendType, () => {
  if (salesTrendChartInstance) {
    salesTrendChartInstance.destroy()
    initializeSalesTrendChart()
  }
})

watch(customerAnalysisType, () => {
  if (customerAnalysisChartInstance) {
    customerAnalysisChartInstance.destroy()
    initializeCustomerAnalysisChart()
  }
})

// 生命周期
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
/* CSS Variables */
:root {
  --color-slate: #2D3748;
  --color-orange: #ED8936;
  --color-teal: #38B2AC;
  --color-off-white: #F7FAFC;
  --color-gray-light: #E2E8F0;
  --color-gray-medium: #A0AEC0;
  --color-success: #48BB78;
  --color-warning: #ED8936;
  --color-danger: #F56565;
  --font-display: 'Playfair Display', serif;
  --font-body: 'Space Mono', monospace;
}

.sales-dashboard {
  max-width: 1600px;
  margin: 0 auto;
  padding: 32px 24px;
  background: linear-gradient(135deg, var(--color-off-white) 0%, #FFFFFF 100%);
  min-height: 100vh;
}

/* Dashboard Header */
.dashboard-header {
  margin-bottom: 48px;
  position: relative;
}

.dashboard-header::before {
  content: '';
  position: absolute;
  top: -32px;
  left: -48px;
  right: -48px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-gray-light), transparent);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
}

.header-text {
  transform: translateY(-8px);
}

.page-title {
  font-family: var(--font-display);
  font-size: 3.5rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0 0 8px 0;
  line-height: 1.1;
}

.page-subtitle {
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--color-gray-medium);
  margin: 0;
  letter-spacing: 0.05em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.date-range-selector select {
  padding: 12px 16px;
  border: 1px solid var(--color-gray-light);
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  min-width: 140px;
  cursor: pointer;
}

.btn-refresh, .btn-export {
  padding: 12px 20px;
  border-radius: 12px;
  font-family: var(--font-body);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-refresh {
  background: var(--color-teal);
  border: none;
  color: white;
}

.btn-refresh:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(56, 178, 172, 0.3);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-refresh .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.btn-export {
  background: transparent;
  border: 1px solid var(--color-gray-light);
  color: var(--color-slate);
}

.btn-export:hover {
  border-color: var(--color-teal);
  color: var(--color-teal);
}

/* Custom Date Range */
.custom-date-range {
  margin-bottom: 32px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-gray-light);
  border-radius: 12px;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
}

.date-inputs input {
  padding: 10px 16px;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 14px;
}

.date-inputs span {
  font-family: var(--font-body);
  color: var(--color-gray-medium);
}

/* Metrics Section */
.metrics-section {
  margin-bottom: 48px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  padding: 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.metric-card:hover {
  transform: translateY(-4px) rotate(-1deg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
}

.metric-card.sales-revenue {
  border-top: 4px solid var(--color-teal);
}

.metric-card.orders-count {
  border-top: 4px solid var(--color-orange);
}

.metric-card.customers-count {
  border-top: 4px solid var(--color-success);
}

.metric-card.conversion-rate {
  border-top: 4px solid var(--color-warning);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.sales-revenue .metric-icon {
  background: linear-gradient(135deg, var(--color-teal), #4FD1C5);
}

.orders-count .metric-icon {
  background: linear-gradient(135deg, var(--color-orange), #F6AD55);
}

.customers-count .metric-icon {
  background: linear-gradient(135deg, var(--color-success), #68D391);
}

.conversion-rate .metric-icon {
  background: linear-gradient(135deg, var(--color-warning), #F6AD55);
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 16px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
}

.metric-trend.up {
  background: rgba(72, 187, 120, 0.1);
  color: var(--color-success);
}

.metric-trend.down {
  background: rgba(245, 101, 101, 0.1);
  color: var(--color-danger);
}

.metric-trend.stable {
  background: rgba(160, 174, 192, 0.1);
  color: var(--color-gray-medium);
}

.metric-value {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--color-slate);
  margin-bottom: 8px;
  line-height: 1;
}

.metric-label {
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.metric-compare {
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--color-gray-medium);
}

.compare-value {
  font-weight: 600;
  color: var(--color-slate);
}

/* Charts Section */
.charts-section {
  margin-bottom: 48px;
}

.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
}

.chart-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  overflow: hidden;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid var(--color-gray-light);
}

.chart-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.chart-action-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--color-gray-light);
  border-radius: 20px;
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.chart-action-btn.active {
  background: var(--color-teal);
  border-color: var(--color-teal);
  color: white;
}

.chart-action-btn:hover:not(.active) {
  border-color: var(--color-teal);
  color: var(--color-teal);
}

.chart-content {
  padding: 24px;
  height: 300px;
}

.trend-chart, .analysis-chart {
  width: 100%;
  height: 100%;
}

/* Product Ranking */
.btn-more {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-slate);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-more:hover {
  border-color: var(--color-teal);
  color: var(--color-teal);
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ranking-item {
  display: grid;
  grid-template-columns: 48px 1fr auto auto;
  gap: 16px;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.ranking-item:hover {
  background: rgba(56, 178, 172, 0.05);
}

.ranking-item.top-three {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(255, 255, 255, 0.95));
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.ranking-number {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-slate);
  background: var(--color-gray-light);
}

.ranking-item.top-three .ranking-number {
  background: linear-gradient(135deg, var(--color-orange), #FBD38D);
  color: white;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-slate);
}

.product-code {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
}

.sales-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.sales-amount {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-teal);
}

.sales-quantity {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
}

.trend-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.trend-indicator.up {
  background: rgba(72, 187, 120, 0.1);
  color: var(--color-success);
}

.trend-indicator.down {
  background: rgba(245, 101, 101, 0.1);
  color: var(--color-danger);
}

.trend-indicator.stable {
  background: rgba(160, 174, 192, 0.1);
  color: var(--color-gray-medium);
}

/* Analysis Section */
.analysis-section {
  margin-bottom: 48px;
}

.analysis-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.analysis-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  overflow: hidden;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid var(--color-gray-light);
}

.analysis-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0;
}

.analysis-tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--color-gray-light);
  border-radius: 20px;
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: var(--color-teal);
  border-color: var(--color-teal);
  color: white;
}

.analysis-content {
  padding: 24px;
  height: 300px;
}

.analysis-header select {
  padding: 8px 16px;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
}

/* Sales Targets */
.targets-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.target-item {
  padding: 20px;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 12px;
  border: 1px solid var(--color-gray-light);
}

.target-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.target-name {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-slate);
}

.target-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  width: 120px;
  height: 8px;
  background: var(--color-gray-light);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-fill.high {
  background: var(--color-success);
}

.progress-fill.medium {
  background: var(--color-warning);
}

.progress-fill.low {
  background: var(--color-danger);
}

.progress-text {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  min-width: 40px;
}

.target-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.metric-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.metric-row .metric-label {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-row .metric-value {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-slate);
}

.metric-row .metric-value.current {
  color: var(--color-teal);
}

.metric-row .metric-value.remaining {
  color: var(--color-orange);
}

/* Activities Section */
.activities-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  padding: 32px;
  overflow: hidden;
}

.activities-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0;
}

.activity-filters {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--color-gray-light);
  border-radius: 20px;
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn.active {
  background: var(--color-teal);
  border-color: var(--color-teal);
  color: white;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.activity-item {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.activity-item:hover {
  background: rgba(56, 178, 172, 0.05);
}

.activity-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
}

.activity-item.order .activity-icon {
  background: linear-gradient(135deg, var(--color-teal), #4FD1C5);
}

.activity-item.quotation .activity-icon {
  background: linear-gradient(135deg, var(--color-orange), #FBD38D);
}

.activity-item.customer .activity-icon {
  background: linear-gradient(135deg, var(--color-success), #68D391);
}

.activity-item.payment .activity-icon {
  background: linear-gradient(135deg, var(--color-warning), #F6AD55);
}

.activity-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.activity-title {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-slate);
}

.activity-description {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-gray-medium);
}

.activity-meta {
  display: flex;
  gap: 16px;
}

.activity-time, .activity-user {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
}

.activity-amount {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-teal);
  text-align: right;
}

.activities-footer {
  display: flex;
  justify-content: center;
}

.btn-load-more {
  padding: 12px 32px;
  background: transparent;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-slate);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-load-more:hover:not(:disabled) {
  border-color: var(--color-teal);
  color: var(--color-teal);
}

.btn-load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .charts-grid, .analysis-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .sales-dashboard {
    padding: 24px 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }
  
  .page-title {
    font-size: 2.5rem;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .date-inputs {
    flex-direction: column;
    align-items: stretch;
  }
  
  .target-metrics {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .activity-filters {
    flex-wrap: wrap;
  }
  
  .activity-item {
    grid-template-columns: 40px 1fr auto;
    gap: 12px;
  }
}
</style>