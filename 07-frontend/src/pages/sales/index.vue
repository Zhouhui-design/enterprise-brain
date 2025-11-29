<template>
  <div class="sales-dashboard">
    <!-- 页面头部 -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="2"/>
            <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="header-info">
          <h1>销售管理</h1>
          <p>全面的销售订单管理和业务数据分析</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button @click="refreshData">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          刷新数据
        </el-button>
        <el-button type="primary" @click="createNewOrder">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          新建订单
        </el-button>
      </div>
    </div>

    <!-- 数据概览卡片 -->
    <div class="overview-cards">
      <div class="card-item" @click="navigateToOrders('')">
        <div class="card-icon total">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M9 2L3 7v9a2 2 0 002 2h4v5l3-3 3 3v-5h4a2 2 0 002-2V7l-6-5H9z" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="card-info">
          <div class="card-value">{{ overviewData.totalOrders }}</div>
          <div class="card-label">总订单数</div>
        </div>
        <div class="card-trend">
          <span :class="['trend-icon', overviewData.ordersTrend > 0 ? 'up' : 'down']">
            {{ overviewData.ordersTrend > 0 ? '↑' : '↓' }}
          </span>
          <span>{{ Math.abs(overviewData.ordersTrend) }}%</span>
        </div>
      </div>

      <div class="card-item" @click="navigateToOrders('pending')">
        <div class="card-icon pending">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="card-info">
          <div class="card-value">{{ overviewData.pendingOrders }}</div>
          <div class="card-label">待处理</div>
        </div>
        <div class="card-badge">{{ overviewData.pendingOrders > 0 ? '需要处理' : '' }}</div>
      </div>

      <div class="card-item">
        <div class="card-icon revenue">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="card-info">
          <div class="card-value">¥{{ formatAmount(overviewData.totalRevenue) }}</div>
          <div class="card-label">总收入</div>
        </div>
        <div class="card-trend">
          <span :class="['trend-icon', overviewData.revenueTrend > 0 ? 'up' : 'down']">
            {{ overviewData.revenueTrend > 0 ? '↑' : '↓' }}
          </span>
          <span>{{ Math.abs(overviewData.revenueTrend) }}%</span>
        </div>
      </div>

      <div class="card-item">
        <div class="card-icon customers">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 16a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="card-info">
          <div class="card-value">{{ overviewData.activeCustomers }}</div>
          <div class="card-label">活跃客户</div>
        </div>
        <div class="card-trend">
          <span :class="['trend-icon', overviewData.customersTrend > 0 ? 'up' : 'down']">
            {{ overviewData.customersTrend > 0 ? '↑' : '↓' }}
          </span>
          <span>{{ Math.abs(overviewData.customersTrend) }}%</span>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧内容 -->
      <div class="left-content">
        <!-- 销售趋势图表 -->
        <div class="chart-card">
          <div class="card-header">
            <h3>销售趋势</h3>
            <div class="chart-controls">
              <el-radio-group v-model="trendPeriod" @change="updateSalesTrend">
                <el-radio-button label="7">7天</el-radio-button>
                <el-radio-button label="30">30天</el-radio-button>
                <el-radio-button label="90">90天</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="trendChart" width="400" height="200"></canvas>
          </div>
        </div>

        <!-- 订单状态分布 -->
        <div class="chart-card">
          <div class="card-header">
            <h3>订单状态分布</h3>
          </div>
          <div class="chart-container">
            <canvas ref="statusChart" width="400" height="200"></canvas>
          </div>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="right-content">
        <!-- 最近订单 -->
        <div class="orders-card">
          <div class="card-header">
            <h3>最近订单</h3>
            <el-link @click="navigateToOrders('')" type="primary">查看全部</el-link>
          </div>
          <div class="orders-list">
            <div v-for="order in recentOrders" :key="order.id" class="order-item">
              <div class="order-info">
                <div class="order-number">{{ order.orderNumber }}</div>
                <div class="order-customer">{{ order.customer?.name }}</div>
              </div>
              <div class="order-amount">¥{{ formatAmount(order.totalAmount) }}</div>
              <div class="order-status">
                <el-tag :type="getStatusColor(order.status)" size="small">
                  {{ getStatusLabel(order.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions">
          <h3>快捷操作</h3>
          <div class="action-grid">
            <div class="action-item" @click="navigateToOrders('')">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M9 2L3 7v9a2 2 0 002 2h4v5l3-3 3 3v-5h4a2 2 0 002-2V7l-6-5H9z" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <span>订单管理</span>
            </div>
            <div class="action-item" @click="navigateToCustomers()">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <span>客户管理</span>
            </div>
            <div class="action-item" @click="navigateToProducts()">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                  <line x1="9" y1="9" x2="15" y2="9" stroke="currentColor" stroke-width="2"/>
                  <line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <span>产品管理</span>
            </div>
            <div class="action-item" @click="navigateToReports()">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M3 3v18h18" stroke="currentColor" stroke-width="2"/>
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <span>数据报表</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Chart } from 'chart.js'
import { salesOrderAPI, dataUtils } from '@/api'

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const trendPeriod = ref('30')
const overviewData = ref({
  totalOrders: 0,
  pendingOrders: 0,
  totalRevenue: 0,
  activeCustomers: 0,
  ordersTrend: 0,
  revenueTrend: 0,
  customersTrend: 0
})

const recentOrders = ref([])
const trendChart = ref(null)
const statusChart = ref(null)

// 图表实例
let trendChartInstance = null
let statusChartInstance = null

// 方法
const formatAmount = (amount) => {
  return dataUtils.formatAmount(amount)
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    reviewing: 'primary',
    approved: 'success',
    production: 'info',
    delivering: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return colors[status] || ''
}

const getStatusLabel = (status) => {
  const labels = {
    pending: '待处理',
    reviewing: '审批中',
    approved: '已审批',
    production: '生产中',
    delivering: '配送中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return labels[status] || status
}

// 获取概览数据
const fetchOverviewData = async () => {
  try {
    loading.value = true
    const response = await salesOrderAPI.getOrderStats({
      startDate: getStartDate(30),
      endDate: new Date().toISOString()
    })
    
    if (response.success) {
      const stats = response.data
      
      // 这里需要根据实际API返回的数据结构进行调整
      overviewData.value = {
        totalOrders: stats.totalOrders || 0,
        pendingOrders: stats.pendingOrders || 0,
        totalRevenue: stats.totalAmount || 0,
        activeCustomers: stats.activeCustomers || 0,
        ordersTrend: 12.5, // 示例数据
        revenueTrend: 8.3,
        customersTrend: 5.2
      }
    }
  } catch (error) {
    console.error('获取概览数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 获取最近订单
const fetchRecentOrders = async () => {
  try {
    const response = await salesOrderAPI.getOrders({
      page: 1,
      pageSize: 5,
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    })
    
    if (response.success) {
      recentOrders.value = response.data.orders
    }
  } catch (error) {
    console.error('获取最近订单失败:', error)
  }
}

// 更新销售趋势图表
const updateSalesTrend = async () => {
  try {
    const days = parseInt(trendPeriod.value)
    const response = await salesOrderAPI.getOrderStats({
      startDate: getStartDate(days),
      endDate: new Date().toISOString()
    })
    
    if (response.success) {
      // 这里需要根据实际API返回的数据构建图表数据
      const chartData = generateTrendChartData(days)
      renderTrendChart(chartData)
    }
  } catch (error) {
    console.error('更新销售趋势失败:', error)
  }
}

// 生成趋势图表数据
const generateTrendChartData = (days) => {
  const labels = []
  const data = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }))
    
    // 模拟数据
    data.push(Math.floor(Math.random() * 50000) + 10000)
  }
  
  return { labels, data }
}

// 渲染趋势图表
const renderTrendChart = (data) => {
  if (trendChartInstance) {
    trendChartInstance.destroy()
  }
  
  if (trendChart.value) {
    trendChartInstance = new Chart(trendChart.value, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: '销售额',
          data: data.data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          tension: 0.4
        }]
      },
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
            ticks: {
              callback: function(value) {
                return '¥' + value.toLocaleString()
              }
            }
          }
        }
      }
    })
  }
}

// 渲染状态图表
const renderStatusChart = () => {
  if (statusChartInstance) {
    statusChartInstance.destroy()
  }
  
  if (statusChart.value) {
    // 模拟状态数据
    const statusData = {
      pending: overviewData.value.pendingOrders,
      approved: 15,
      production: 8,
      delivering: 6,
      completed: 45
    }
    
    statusChartInstance = new Chart(statusChart.value, {
      type: 'doughnut',
      data: {
        labels: ['待处理', '已审批', '生产中', '配送中', '已完成'],
        datasets: [{
          data: Object.values(statusData),
          backgroundColor: [
            '#E6A23C',
            '#409EFF',
            '#909399',
            '#67C23A',
            '#F56C6C'
          ]
        }]
      },
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
}

// 获取开始日期
const getStartDate = (days) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

// 刷新数据
const refreshData = async () => {
  await Promise.all([
    fetchOverviewData(),
    fetchRecentOrders(),
    updateSalesTrend()
  ])
  ElMessage.success('数据刷新成功')
}

// 导航方法
const createNewOrder = () => {
  router.push('/sales/sales-order/create')
}

const navigateToOrders = (status) => {
  router.push(`/sales/sales-order${status ? `?status=${status}` : ''}`)
}

const navigateToCustomers = () => {
  router.push('/sales/customers')
}

const navigateToProducts = () => {
  router.push('/sales/products')
}

const navigateToReports = () => {
  router.push('/sales/reports')
}

// 生命周期
onMounted(async () => {
  await nextTick()
  
  // 获取初始数据
  await fetchOverviewData()
  await fetchRecentOrders()
  
  // 渲染图表
  renderTrendChart(generateTrendChartData(30))
  renderStatusChart()
})
</script>

<style scoped>
.sales-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: var(--primary-color);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon svg {
  width: 24px;
  height: 24px;
  stroke: white;
  fill: none;
}

.header-info h1 {
  font-size: 1.5rem;
  margin: 0;
  color: var(--text-primary);
}

.header-info p {
  margin: 0.5rem 0 0 0;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.card-item {
  background: var(--surface-color);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.card-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon svg {
  width: 24px;
  height: 24px;
  stroke: white;
  fill: none;
}

.card-icon.total {
  background: var(--primary-color);
}

.card-icon.pending {
  background: var(--warning-color);
}

.card-icon.revenue {
  background: var(--success-color);
}

.card-icon.customers {
  background: var(--info-color);
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.card-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.card-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.trend-icon.up {
  color: var(--success-color);
}

.trend-icon.down {
  color: var(--error-color);
}

.card-badge {
  font-size: 0.8rem;
  color: var(--warning-color);
  font-weight: 600;
}

.main-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.chart-card,
.orders-card,
.quick-actions {
  background: var(--surface-color);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  margin-bottom: 2rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.chart-container {
  height: 200px;
  position: relative;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--background-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.order-info {
  flex: 1;
}

.order-number {
  font-weight: 600;
  color: var(--text-primary);
}

.order-customer {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.order-amount {
  font-weight: 600;
  color: var(--primary-color);
  margin-right: 1rem;
}

.quick-actions h3 {
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--background-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-item:hover {
  border-color: var(--primary-color);
  background: var(--surface-color);
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon svg {
  width: 20px;
  height: 20px;
  stroke: white;
  fill: none;
}

.action-item span {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .sales-dashboard {
    padding: 1rem;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .overview-cards {
    grid-template-columns: 1fr;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
}
</style>