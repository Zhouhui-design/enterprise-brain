<template>
  <ResponsiveLayout>
    <template #header>
      <HeaderNavigation
        title="采购统计分析"
        :show-search="true"
        :show-notifications="true"
        @toggle-sidebar="() => {}"
      >
        <template #actions>
          <button 
            class="header-action-btn primary"
            @click="handleExport"
            :disabled="loading"
          >
            <i class="fas fa-file-excel"></i>
            <span>导出报表</span>
          </button>
          <button 
            class="header-action-btn secondary"
            @click="handleRefresh"
            :disabled="loading"
          >
            <i class="fas fa-sync-alt"></i>
            <span>刷新数据</span>
          </button>
        </template>
      </HeaderNavigation>
    </template>

    <template #breadcrumb>
      <BreadcrumbNav 
        :items="breadcrumbItems"
        :show-home="true"
      />
    </template>

    <!-- 主要内容区域 -->
    <div class="purchase-statistics">
      <!-- 时间筛选区域 -->
      <div class="filter-section">
        <div class="filter-container">
          <div class="filter-header">
            <h3>统计时间范围</h3>
            <div class="quick-filters">
              <button 
                v-for="range in timeRanges" 
                :key="range.value"
                class="quick-filter-btn"
                :class="{ active: currentTimeRange === range.value }"
                @click="handleTimeRangeChange(range.value)"
              >
                {{ range.label }}
              </button>
            </div>
          </div>
          
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">开始日期</label>
              <input
                v-model="dateRange.start"
                type="date"
                class="filter-input"
                @change="handleDateChange"
              />
            </div>
            <div class="filter-item">
              <label class="filter-label">结束日期</label>
              <input
                v-model="dateRange.end"
                type="date"
                class="filter-input"
                @change="handleDateChange"
              />
            </div>
            <div class="filter-item">
              <label class="filter-label">对比周期</label>
              <select v-model="compareType" class="filter-select" @change="handleCompareChange">
                <option value="none">无对比</option>
                <option value="month">环比</option>
                <option value="year">同比</option>
              </select>
            </div>
            <div class="filter-actions">
              <button 
                class="search-btn primary"
                @click="handleSearch"
                :disabled="loading"
              >
                <i class="fas fa-chart-line"></i>
                <span>生成报表</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 总览卡片 -->
      <div class="overview-section">
        <h3 class="section-title">采购总览</h3>
        <div class="overview-grid">
          <div class="overview-card primary">
            <div class="overview-icon">
              <i class="fas fa-shopping-cart"></i>
            </div>
            <div class="overview-content">
              <div class="overview-number">{{ formatNumber(overviewData.totalOrders) }}</div>
              <div class="overview-label">采购订单总数</div>
              <div class="overview-change" :class="getChangeClass(overviewData.ordersChange)">
                <i :class="getChangeIcon(overviewData.ordersChange)"></i>
                <span>{{ formatPercent(overviewData.ordersChange) }}</span>
              </div>
            </div>
          </div>

          <div class="overview-card success">
            <div class="overview-icon">
              <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="overview-content">
              <div class="overview-number">{{ formatCurrency(overviewData.totalAmount) }}</div>
              <div class="overview-label">采购总金额</div>
              <div class="overview-change" :class="getChangeClass(overviewData.amountChange)">
                <i :class="getChangeIcon(overviewData.amountChange)"></i>
                <span>{{ formatPercent(overviewData.amountChange) }}</span>
              </div>
            </div>
          </div>

          <div class="overview-card warning">
            <div class="overview-icon">
              <i class="fas fa-truck"></i>
            </div>
            <div class="overview-content">
              <div class="overview-number">{{ formatNumber(overviewData.completedDeliveries) }}</div>
              <div class="overview-label">已完成交付</div>
              <div class="overview-change" :class="getChangeClass(overviewData.deliveriesChange)">
                <i :class="getChangeIcon(overviewData.deliveriesChange)"></i>
                <span>{{ formatPercent(overviewData.deliveriesChange) }}</span>
              </div>
            </div>
          </div>

          <div class="overview-card info">
            <div class="overview-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="overview-content">
              <div class="overview-number">{{ formatNumber(overviewData.activeSuppliers) }}</div>
              <div class="overview-label">活跃供应商</div>
              <div class="overview-change" :class="getChangeClass(overviewData.suppliersChange)">
                <i :class="getChangeIcon(overviewData.suppliersChange)"></i>
                <span>{{ formatPercent(overviewData.suppliersChange) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-section">
        <div class="charts-grid">
          <!-- 采购趋势图 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>采购趋势分析</h3>
              <div class="chart-controls">
                <select v-model="trendChartType" class="chart-select" @change="updateTrendChart">
                  <option value="amount">金额趋势</option>
                  <option value="quantity">数量趋势</option>
                  <option value="orders">订单趋势</option>
                </select>
              </div>
            </div>
            <div class="chart-container">
              <canvas ref="trendChart" class="chart-canvas"></canvas>
            </div>
          </div>

          <!-- 分类统计图 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>采购分类统计</h3>
              <div class="chart-controls">
                <select v-model="categoryChartType" class="chart-select" @change="updateCategoryChart">
                  <option value="pie">饼图</option>
                  <option value="bar">柱状图</option>
                  <option value="doughnut">环形图</option>
                </select>
              </div>
            </div>
            <div class="chart-container">
              <canvas ref="categoryChart" class="chart-canvas"></canvas>
            </div>
          </div>

          <!-- 供应商对比图 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>供应商采购对比</h3>
              <div class="chart-controls">
                <select v-model="supplierSortType" class="chart-select" @change="updateSupplierChart">
                  <option value="amount">按金额排序</option>
                  <option value="orders">按订单数排序</option>
                  <option value="delivery">按交付率排序</option>
                </select>
              </div>
            </div>
            <div class="chart-container">
              <canvas ref="supplierChart" class="chart-canvas"></canvas>
            </div>
          </div>

          <!-- 成本分析图 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>成本构成分析</h3>
            </div>
            <div class="chart-container">
              <canvas ref="costChart" class="chart-canvas"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细数据表格 -->
      <div class="table-section">
        <div class="table-header">
          <h3>详细统计数据</h3>
          <div class="table-actions">
            <button 
              class="table-action-btn"
              @click="handleExportDetail"
            >
              <i class="fas fa-download"></i>
              <span>导出详细数据</span>
            </button>
          </div>
        </div>
        
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th class="sortable" @click="handleTableSort('category')">
                  采购分类
                  <i class="fas fa-sort" :class="getTableSortClass('category')"></i>
                </th>
                <th class="sortable" @click="handleTableSort('orders')">
                  订单数量
                  <i class="fas fa-sort" :class="getTableSortClass('orders')"></i>
                </th>
                <th class="sortable" @click="handleTableSort('amount')">
                  采购金额
                  <i class="fas fa-sort" :class="getTableSortClass('amount')"></i>
                </th>
                <th class="sortable" @click="handleTableSort('avgPrice')">
                  平均单价
                  <i class="fas fa-sort" :class="getTableSortClass('avgPrice')"></i>
                </th>
                <th class="sortable" @click="handleTableSort('deliveryRate')">
                  交付完成率
                  <i class="fas fa-sort" :class="getTableSortClass('deliveryRate')"></i>
                </th>
                <th class="sortable" @click="handleTableSort('qualityScore')">
                  质量评分
                  <i class="fas fa-sort" :class="getTableSortClass('qualityScore')"></i>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="item in sortedDetailData" 
                :key="item.category"
              >
                <td class="category-cell">
                  <div class="category-indicator" :style="{ backgroundColor: item.color }"></div>
                  {{ item.category }}
                </td>
                <td class="text-right">{{ formatNumber(item.orders) }}</td>
                <td class="text-right">{{ formatCurrency(item.amount) }}</td>
                <td class="text-right">{{ formatCurrency(item.avgPrice) }}</td>
                <td>
                  <div class="progress-cell">
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        :style="{ width: `${item.deliveryRate}%`, backgroundColor: getProgressColor(item.deliveryRate) }"
                      ></div>
                    </div>
                    <span class="progress-text">{{ item.deliveryRate }}%</span>
                  </div>
                </td>
                <td>
                  <div class="score-cell">
                    <div class="score-stars">
                      <i 
                        v-for="star in 5" 
                        :key="star"
                        class="fas fa-star"
                        :class="{ filled: star <= item.qualityScore }"
                      ></i>
                    </div>
                    <span class="score-text">{{ item.qualityScore.toFixed(1) }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 导出对话框 -->
      <div v-if="exportDialogVisible" class="modal-overlay" @click="exportDialogVisible = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>导出报表</h2>
            <button class="modal-close" @click="exportDialogVisible = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="export-options">
              <div class="export-option">
                <label class="radio-label">
                  <input 
                    type="radio" 
                    v-model="exportType" 
                    value="summary"
                  />
                  <span>汇总报表</span>
                </label>
                <p class="export-description">包含总体统计数据和图表数据</p>
              </div>
              
              <div class="export-option">
                <label class="radio-label">
                  <input 
                    type="radio" 
                    v-model="exportType" 
                    value="detail"
                  />
                  <span>详细报表</span>
                </label>
                <p class="export-description">包含所有明细数据和统计分析</p>
              </div>
              
              <div class="export-option">
                <label class="radio-label">
                  <input 
                    type="radio" 
                    v-model="exportType" 
                    value="chart"
                  />
                  <span>图表报表</span>
                </label>
                <p class="export-description">包含所有图表和可视化数据</p>
              </div>
            </div>
            
            <div class="export-format">
              <label class="filter-label">导出格式</label>
              <select v-model="exportFormat" class="filter-select">
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="pdf">PDF (.pdf)</option>
                <option value="csv">CSV (.csv)</option>
              </select>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn secondary" @click="exportDialogVisible = false">取消</button>
            <button class="btn primary" @click="handleConfirmExport" :disabled="exporting">
              <i v-if="exporting" class="fas fa-spinner fa-spin"></i>
              <span>{{ exporting ? '导出中...' : '确认导出' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </ResponsiveLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import ResponsiveLayout from '@/components/common/layout/ResponsiveLayout.vue'
import HeaderNavigation from '@/components/common/layout/HeaderNavigation.vue'
import BreadcrumbNav from '@/components/common/layout/BreadcrumbNav.vue'

// 响应式数据
const loading = ref(false)
const exporting = ref(false)
const exportDialogVisible = ref(false)
const exportType = ref('summary')
const exportFormat = ref('xlsx')

// 时间筛选
const currentTimeRange = ref('month')
const compareType = ref('none')
const dateRange = reactive({
  start: '',
  end: ''
})

const timeRanges = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本季度', value: 'quarter' },
  { label: '本年', value: 'year' }
]

// 图表类型
const trendChartType = ref('amount')
const categoryChartType = ref('pie')
const supplierSortType = ref('amount')

// 图表实例
const trendChart = ref(null)
const categoryChart = ref(null)
const supplierChart = ref(null)
const costChart = ref(null)

// 总览数据
const overviewData = reactive({
  totalOrders: 0,
  ordersChange: 0,
  totalAmount: 0,
  amountChange: 0,
  completedDeliveries: 0,
  deliveriesChange: 0,
  activeSuppliers: 0,
  suppliersChange: 0
})

// 详细数据
const detailData = ref([])
const tableSortField = ref('')
const tableSortOrder = ref('')

// 面包屑导航
const breadcrumbItems = [
  { label: '采购管理', path: '/purchase' },
  { label: '统计分析', path: '/purchase/statistics' }
]

// 计算属性
const sortedDetailData = computed(() => {
  if (!tableSortField.value) return detailData.value
  
  return [...detailData.value].sort((a, b) => {
    const aVal = a[tableSortField.value]
    const bVal = b[tableSortField.value]
    
    if (typeof aVal === 'string') {
      return tableSortOrder.value === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal)
    }
    
    return tableSortOrder.value === 'asc' 
      ? aVal - bVal 
      : bVal - aVal
  })
})

// 方法
const formatNumber = (value) => {
  return value.toLocaleString()
}

const formatCurrency = (value) => {
  if (!value) return '¥0.00'
  return `¥${Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

const formatPercent = (value) => {
  if (!value) return '0%'
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${(value * 100).toFixed(1)}%`
}

const getChangeClass = (value) => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

const getChangeIcon = (value) => {
  if (value > 0) return 'fas fa-arrow-up'
  if (value < 0) return 'fas fa-arrow-down'
  return 'fas fa-minus'
}

const getProgressColor = (value) => {
  if (value >= 90) return '#48bb78'
  if (value >= 70) return '#ed8936'
  return '#e53e3e'
}

const getTableSortClass = (field) => {
  if (tableSortField.value !== field) return ''
  return tableSortOrder.value === 'asc' ? 'sort-asc' : 'sort-desc'
}

const handleTimeRangeChange = (range) => {
  currentTimeRange.value = range
  updateDateRange(range)
}

const updateDateRange = (range) => {
  const now = new Date()
  let start, end

  switch (range) {
    case 'today':
      start = end = now
      break
    case 'week':
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      start = weekStart
      end = now
      break
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      start = monthStart
      end = now
      break
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      const quarterStart = new Date(now.getFullYear(), quarter * 3, 1)
      start = quarterStart
      end = now
      break
    case 'year':
      const yearStart = new Date(now.getFullYear(), 0, 1)
      start = yearStart
      end = now
      break
  }

  dateRange.start = formatDateForInput(start)
  dateRange.end = formatDateForInput(end)
}

const formatDateForInput = (date) => {
  return date.toISOString().split('T')[0]
}

const handleDateChange = () => {
  currentTimeRange.value = 'custom'
}

const handleCompareChange = () => {
  loadStatisticsData()
}

const handleSearch = () => {
  loadStatisticsData()
}

const handleRefresh = () => {
  loadStatisticsData()
  initCharts()
}

const handleExport = () => {
  exportDialogVisible.value = true
}

const handleExportDetail = () => {
  handleExport()
}

const handleConfirmExport = () => {
  exporting.value = true
  
  setTimeout(() => {
    exporting.value = false
    exportDialogVisible.value = false
    alert(`${exportFormat.toUpperCase()} 报表导出成功！`)
  }, 2000)
}

const handleTableSort = (field) => {
  if (tableSortField.value === field) {
    tableSortOrder.value = tableSortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    tableSortField.value = field
    tableSortOrder.value = 'asc'
  }
}

const loadStatisticsData = () => {
  loading.value = true
  
  setTimeout(() => {
    // 模拟数据加载
    overviewData.totalOrders = 1234
    overviewData.ordersChange = 0.125
    overviewData.totalAmount = 5678900
    overviewData.amountChange = 0.089
    overviewData.completedDeliveries = 1102
    overviewData.deliveriesChange = 0.156
    overviewData.activeSuppliers = 45
    overviewData.suppliersChange = 0.023

    detailData.value = [
      {
        category: '原材料',
        orders: 456,
        amount: 2345678,
        avgPrice: 5145.67,
        deliveryRate: 95.2,
        qualityScore: 4.5,
        color: '#ed8936'
      },
      {
        category: '设备采购',
        orders: 234,
        amount: 1234567,
        avgPrice: 5275.29,
        deliveryRate: 87.8,
        qualityScore: 4.2,
        color: '#4299e1'
      },
      {
        category: '办公用品',
        orders: 543,
        amount: 123456,
        avgPrice: 227.37,
        deliveryRate: 98.1,
        qualityScore: 4.8,
        color: '#48bb78'
      },
      {
        category: '服务采购',
        orders: 123,
        amount: 890123,
        avgPrice: 7238.23,
        deliveryRate: 92.3,
        qualityScore: 4.1,
        color: '#9f7aea'
      },
      {
        category: '其他采购',
        orders: 89,
        amount: 567890,
        avgPrice: 6381.91,
        deliveryRate: 83.4,
        qualityScore: 3.9,
        color: '#38b2ac'
      }
    ]

    loading.value = false
  }, 1000)
}

const initCharts = () => {
  nextTick(() => {
    initTrendChart()
    initCategoryChart()
    initSupplierChart()
    initCostChart()
  })
}

const initTrendChart = () => {
  // 这里应该使用Chart.js或其他图表库初始化趋势图
  console.log('初始化趋势图')
}

const initCategoryChart = () => {
  // 初始化分类统计图
  console.log('初始化分类统计图')
}

const initSupplierChart = () => {
  // 初始化供应商对比图
  console.log('初始化供应商对比图')
}

const initCostChart = () => {
  // 初始化成本分析图
  console.log('初始化成本分析图')
}

const updateTrendChart = () => {
  // 更新趋势图数据
  console.log('更新趋势图', trendChartType.value)
}

const updateCategoryChart = () => {
  // 更新分类统计图
  console.log('更新分类统计图', categoryChartType.value)
}

const updateSupplierChart = () => {
  // 更新供应商对比图
  console.log('更新供应商对比图', supplierSortType.value)
}

// 生命周期
onMounted(() => {
  updateDateRange(currentTimeRange.value)
  loadStatisticsData()
  initCharts()
})
</script>

<style scoped>
.purchase-statistics {
  padding: 2rem;
  font-family: 'Space Mono', monospace;
}

/* 筛选区域 */
.filter-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(237, 137, 54, 0.1);
}

.filter-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.filter-header h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
}

.quick-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.quick-filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(203, 213, 224, 0.8);
  background: rgba(255, 255, 255, 0.8);
  color: #4a5568;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  font-family: 'Space Mono', monospace;
}

.quick-filter-btn:hover {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
  border-color: rgba(237, 137, 54, 0.3);
}

.quick-filter-btn.active {
  background: #ed8936;
  color: white;
  border-color: #ed8936;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  color: #2d3748;
  font-size: 0.875rem;
}

.filter-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid rgba(203, 213, 224, 0.8);
  border-radius: 8px;
  font-size: 0.875rem;
  background: rgba(247, 250, 252, 0.8);
  transition: all 0.2s;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: rgba(237, 137, 54, 0.5);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 3px rgba(237, 137, 54, 0.1);
}

.filter-actions {
  display: flex;
  gap: 0.75rem;
}

.search-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Space Mono', monospace;
}

.search-btn.primary {
  background: #ed8936;
  color: white;
}

.search-btn.primary:hover:not(:disabled) {
  background: #dd7724;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(237, 137, 54, 0.3);
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 总览区域 */
.overview-section {
  margin-bottom: 2rem;
}

.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 1rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.overview-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(237, 137, 54, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.overview-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--card-color-start), var(--card-color-end));
  opacity: 0.8;
}

.overview-card.primary {
  --card-color-start: #ed8936;
  --card-color-end: #dd7724;
}

.overview-card.success {
  --card-color-start: #48bb78;
  --card-color-end: #38a169;
}

.overview-card.warning {
  --card-color-start: #ed8936;
  --card-color-end: #dd7724;
}

.overview-card.info {
  --card-color-start: #4299e1;
  --card-color-end: #3182ce;
}

.overview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 25px -5px rgba(45, 55, 72, 0.2);
}

.overview-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.overview-card.success .overview-icon {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
}

.overview-card.warning .overview-icon {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.overview-card.info .overview-icon {
  background: rgba(66, 153, 225, 0.1);
  color: #4299e1;
}

.overview-content {
  flex: 1;
}

.overview-number {
  font-family: 'Playfair Display', serif;
  font-size: 1.875rem;
  font-weight: 700;
  color: #2d3748;
  line-height: 1.2;
  margin-bottom: 0.25rem;
}

.overview-label {
  font-size: 0.875rem;
  color: #718096;
  margin-bottom: 0.5rem;
}

.overview-change {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.overview-change.positive {
  color: #48bb78;
}

.overview-change.negative {
  color: #e53e3e;
}

.overview-change.neutral {
  color: #a0aec0;
}

/* 图表区域 */
.charts-section {
  margin-bottom: 2rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.chart-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(237, 137, 54, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(45, 55, 72, 0.15);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.chart-header h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.chart-controls {
  display: flex;
  gap: 0.5rem;
}

.chart-select {
  padding: 0.5rem;
  border: 1px solid rgba(203, 213, 224, 0.8);
  border-radius: 6px;
  font-size: 0.75rem;
  background: rgba(247, 250, 252, 0.8);
  transition: all 0.2s;
}

.chart-select:focus {
  outline: none;
  border-color: rgba(237, 137, 54, 0.5);
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-canvas {
  max-width: 100%;
  max-height: 100%;
}

/* 表格区域 */
.table-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(237, 137, 54, 0.1);
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.table-header h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.table-actions {
  display: flex;
  gap: 0.75rem;
}

.table-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(237, 137, 54, 0.3);
  background: rgba(237, 137, 54, 0.05);
  color: #ed8936;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.table-action-btn:hover {
  background: rgba(237, 137, 54, 0.1);
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th,
.data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(237, 137, 54, 0.1);
}

.data-table th {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  color: #2d3748;
  background: rgba(247, 250, 252, 0.8);
  position: sticky;
  top: 0;
  z-index: 10;
  cursor: pointer;
  user-select: none;
}

.data-table th.sortable:hover {
  background: rgba(237, 137, 54, 0.05);
}

.data-table th i {
  margin-left: 0.5rem;
  font-size: 0.75rem;
  opacity: 0.5;
}

.data-table th i.sort-asc,
.data-table th i.sort-desc {
  opacity: 1;
  color: #ed8936;
}

.text-right {
  text-align: right;
}

.category-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.category-indicator {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(203, 213, 224, 0.3);
  border-radius: 4px;
  overflow: hidden;
  min-width: 80px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #4a5568;
  min-width: 40px;
}

.score-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.score-stars {
  display: flex;
  gap: 0.25rem;
}

.score-stars i {
  font-size: 0.875rem;
  color: rgba(203, 213, 224, 0.5);
  transition: color 0.2s;
}

.score-stars i.filled {
  color: #f6e05e;
}

.score-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #4a5568;
  min-width: 20px;
}

/* 对话框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(45, 55, 72, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 25px -5px rgba(45, 55, 72, 0.2);
  border: 1px solid rgba(237, 137, 54, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(237, 137, 54, 0.1);
}

.modal-header h2 {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.modal-close:hover {
  color: #e53e3e;
  background: rgba(229, 62, 62, 0.1);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(237, 137, 54, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.export-option {
  padding: 1rem;
  border: 1px solid rgba(203, 213, 224, 0.5);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-option:hover {
  border-color: rgba(237, 137, 54, 0.5);
  background: rgba(237, 137, 54, 0.02);
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #2d3748;
  cursor: pointer;
}

.export-description {
  margin: 0.5rem 0 0 1.5rem;
  color: #718096;
  font-size: 0.875rem;
  line-height: 1.4;
}

.export-format {
  margin-top: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Space Mono', monospace;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn.primary {
  background: #ed8936;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: #dd7724;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(237, 137, 54, 0.3);
}

.btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn.secondary {
  background: rgba(255, 255, 255, 0.8);
  color: #4a5568;
  border: 1px solid rgba(203, 213, 224, 0.8);
}

.btn.secondary:hover {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
  border-color: rgba(237, 137, 54, 0.3);
}

/* 头部操作按钮 */
.header-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Space Mono', monospace;
}

.header-action-btn.primary {
  background: #ed8936;
  color: white;
}

.header-action-btn.primary:hover:not(:disabled) {
  background: #dd7724;
}

.header-action-btn.secondary {
  background: rgba(255, 255, 255, 0.8);
  color: #4a5568;
  border: 1px solid rgba(203, 213, 224, 0.8);
}

.header-action-btn.secondary:hover {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
  border-color: rgba(237, 137, 54, 0.3);
}

.header-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .purchase-statistics {
    padding: 1rem;
  }
  
  .filter-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .quick-filters {
    order: -1;
    width: 100%;
  }
  
  .overview-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .filter-row {
    grid-template-columns: 1fr;
  }
  
  .overview-grid {
    grid-template-columns: 1fr;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .progress-cell,
  .score-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}

@media (max-width: 640px) {
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .chart-container {
    height: 250px;
  }
}
</style>