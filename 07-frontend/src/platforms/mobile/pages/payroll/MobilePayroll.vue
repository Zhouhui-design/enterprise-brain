<template>
  <div class="mobile-payroll">
    <!-- 头部导航 -->
    <van-nav-bar
      title="薪资管理"
      left-text="返回"
      left-arrow
      fixed
      @click-left="goBack"
    >
      <template #right>
        <van-icon name="search" size="18" @click="showSearch = true" />
      </template>
    </van-nav-bar>

    <!-- 内容区域 -->
    <div class="payroll-content">
      <!-- 薪资概览卡片 -->
      <div class="salary-overview">
        <div class="current-month">
          <div class="month-label">当前月份</div>
          <div class="month-value">{{ currentMonth }}</div>
        </div>
        <div class="salary-amount">
          <div class="amount-label">应发工资</div>
          <div class="amount-value">¥{{ formatNumber(currentSalary.totalSalary) }}</div>
        </div>
        <div class="salary-detail">
          <div class="detail-item">
            <span class="label">基本工资</span>
            <span class="value">¥{{ formatNumber(currentSalary.baseSalary) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">绩效工资</span>
            <span class="value">¥{{ formatNumber(currentSalary.performanceSalary) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">津贴补贴</span>
            <span class="value">¥{{ formatNumber(currentSalary.allowance) }}</span>
          </div>
          <div class="detail-item deduction">
            <span class="label">扣款项</span>
            <span class="value">-¥{{ formatNumber(currentSalary.deduction) }}</span>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions">
        <van-grid :column-num="3" :gutter="12">
          <van-grid-item 
            v-for="action in quickActions" 
            :key="action.name"
            :icon="action.icon"
            :text="action.name"
            @click="action.handler"
          />
        </van-grid>
      </div>

      <!-- 薪资历史 -->
      <div class="salary-history">
        <div class="section-header">
          <h3>薪资历史</h3>
          <van-button size="mini" type="primary" plain @click="viewAllHistory">
            查看全部
          </van-button>
        </div>
        
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div 
            v-for="record in salaryHistory" 
            :key="record.id"
            class="history-item"
            @click="viewSalaryDetail(record)"
          >
            <div class="history-header">
              <div class="month">{{ record.month }}</div>
              <div class="status" :class="record.status">
                {{ getStatusText(record.status) }}
              </div>
            </div>
            <div class="history-content">
              <div class="salary-info">
                <div class="total-salary">
                  <span class="label">应发工资</span>
                  <span class="amount">¥{{ formatNumber(record.totalSalary) }}</span>
                </div>
                <div class="actual-salary">
                  <span class="label">实发工资</span>
                  <span class="amount">¥{{ formatNumber(record.actualSalary) }}</span>
                </div>
              </div>
              <div class="action-buttons">
                <van-button size="mini" @click.stop="downloadPayslip(record)">
                  下载工资条
                </van-button>
              </div>
            </div>
          </div>
        </van-list>
      </div>

      <!-- 统计信息 -->
      <div class="statistics-section">
        <h3>年度统计</h3>
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-value">¥{{ formatNumber(yearStats.totalIncome) }}</div>
            <div class="stat-label">年度总收入</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">¥{{ formatNumber(yearStats.averageSalary) }}</div>
            <div class="stat-label">月均工资</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ yearStats.workingDays }}天</div>
            <div class="stat-label">工作天数</div>
          </div>
        </div>

        <!-- 收入趋势图表 -->
        <div class="chart-container">
          <div ref="chartRef" class="salary-chart"></div>
        </div>
      </div>
    </div>

    <!-- 搜索弹窗 -->
    <van-popup v-model:show="showSearch" position="top" :style="{ height: '60%' }">
      <div class="search-popup">
        <van-search
          v-model="searchQuery"
          placeholder="搜索薪资记录"
          @search="handleSearch"
          @cancel="showSearch = false"
        />
        
        <div class="search-filters">
          <div class="filter-group">
            <label>年份</label>
            <van-picker
              v-model="selectedYear"
              :columns="yearOptions"
              @change="onYearChange"
            />
          </div>
          
          <div class="filter-group">
            <label>状态</label>
            <van-radio-group v-model="selectedStatus" direction="horizontal">
              <van-radio name="all">全部</van-radio>
              <van-radio name="paid">已发放</van-radio>
              <van-radio name="pending">待发放</van-radio>
            </van-radio-group>
          </div>
        </div>
        
        <div class="search-actions">
          <van-button block type="primary" @click="handleSearch">
            搜索
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 薪资详情弹窗 -->
    <van-popup 
      v-model:show="showDetail" 
      position="bottom" 
      :style="{ height: '80%' }"
      round
    >
      <div class="detail-popup" v-if="selectedRecord">
        <div class="detail-header">
          <h3>薪资详情 - {{ selectedRecord.month }}</h3>
          <van-icon name="cross" @click="showDetail = false" />
        </div>
        
        <div class="detail-content">
          <!-- 基本信息 -->
          <div class="info-section">
            <h4>基本信息</h4>
            <van-cell-group>
              <van-cell title="员工姓名" :value="selectedRecord.employeeName" />
              <van-cell title="员工编号" :value="selectedRecord.employeeNo" />
              <van-cell title="部门" :value="selectedRecord.department" />
              <van-cell title="职位" :value="selectedRecord.position" />
            </van-cell-group>
          </div>

          <!-- 收入明细 -->
          <div class="info-section">
            <h4>收入明细</h4>
            <van-cell-group>
              <van-cell 
                v-for="income in selectedRecord.incomeDetails" 
                :key="income.name"
                :title="income.name" 
                :value="`¥${formatNumber(income.amount)}`"
              />
            </van-cell-group>
          </div>

          <!-- 扣款明细 -->
          <div class="info-section">
            <h4>扣款明细</h4>
            <van-cell-group>
              <van-cell 
                v-for="deduction in selectedRecord.deductionDetails" 
                :key="deduction.name"
                :title="deduction.name" 
                :value="`-¥${formatNumber(deduction.amount)}`"
              />
            </van-cell-group>
          </div>

          <!-- 统计信息 -->
          <div class="summary-section">
            <div class="summary-item">
              <span class="label">应发工资</span>
              <span class="value">¥{{ formatNumber(selectedRecord.totalSalary) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">扣款合计</span>
              <span class="value">-¥{{ formatNumber(selectedRecord.totalDeduction) }}</span>
            </div>
            <div class="summary-item total">
              <span class="label">实发工资</span>
              <span class="value">¥{{ formatNumber(selectedRecord.actualSalary) }}</span>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 底部导航 -->
    <van-tabbar v-model="activeTab" @change="onTabChange">
      <van-tabbar-item icon="home-o" to="/mobile">首页</van-tabbar-item>
      <van-tabbar-item icon="description" to="/mobile/attendance">考勤</van-tabbar-item>
      <van-tabbar-item icon="gold-coin" to="/mobile/payroll">薪资</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/mobile/profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, showConfirmDialog } from 'vant'
import * as echarts from 'echarts'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const finished = ref(false)
const showSearch = ref(false)
const showDetail = ref(false)
const searchQuery = ref('')
const selectedYear = ref(['2024'])
const selectedStatus = ref('all')
const activeTab = ref(2)
const chartRef = ref<HTMLElement>()

// 当前薪资信息
const currentSalary = reactive({
  month: '2024-11',
  totalSalary: 12850.00,
  baseSalary: 8000.00,
  performanceSalary: 3500.00,
  allowance: 1350.00,
  deduction: 0.00
})

// 当前月份
const currentMonth = ref('2024年11月')

// 快捷操作
const quickActions = ref([
  {
    name: '工资条',
    icon: 'description',
    handler: () => downloadCurrentPayslip()
  },
  {
    name: '纳税证明',
    icon: 'certificate',
    handler: () => getTaxCertificate()
  },
  {
    name: '收入证明',
    icon: 'bookmark',
    handler: () => getIncomeCertificate()
  },
  {
    name: '社保查询',
    icon: 'shield-o',
    handler: () => querySocialInsurance()
  },
  {
    name: '公积金查询',
    icon: 'home-o',
    handler: () => queryHousingFund()
  },
  {
    name: '设置',
    icon: 'setting',
    handler: () => goToSettings()
  }
])

// 薪资历史记录
const salaryHistory = ref([
  {
    id: 1,
    month: '2024年11月',
    totalSalary: 12850.00,
    actualSalary: 10280.00,
    status: 'paid',
    employeeName: '张三',
    employeeNo: 'EMP001',
    department: '技术部',
    position: '高级工程师'
  },
  {
    id: 2,
    month: '2024年10月',
    totalSalary: 12500.00,
    actualSalary: 10000.00,
    status: 'paid',
    employeeName: '张三',
    employeeNo: 'EMP001',
    department: '技术部',
    position: '高级工程师'
  },
  {
    id: 3,
    month: '2024年09月',
    totalSalary: 13500.00,
    actualSalary: 10800.00,
    status: 'paid',
    employeeName: '张三',
    employeeNo: 'EMP001',
    department: '技术部',
    position: '高级工程师'
  }
])

// 年度统计
const yearStats = reactive({
  totalIncome: 145800.00,
  averageSalary: 12150.00,
  workingDays: 241
})

// 选中的记录
const selectedRecord = ref<any>(null)

// 年份选项
const yearOptions = ['2024', '2023', '2022', '2021', '2020']

// 格式化数字
const formatNumber = (num: number): string => {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    paid: '已发放',
    pending: '待发放',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

// 返回上一页
const goBack = (): void => {
  router.back()
}

// 加载更多数据
const onLoad = (): void => {
  // 模拟加载更多数据
  setTimeout(() => {
    // 这里应该调用API获取更多数据
    loading.value = false
    
    // 模拟没有更多数据
    if (salaryHistory.value.length >= 10) {
      finished.value = true
    }
  }, 1000)
}

// 查看薪资详情
const viewSalaryDetail = (record: any): void => {
  // 模拟详细数据
  selectedRecord.value = {
    ...record,
    incomeDetails: [
      { name: '基本工资', amount: 8000.00 },
      { name: '绩效工资', amount: 3500.00 },
      { name: '岗位津贴', amount: 1000.00 },
      { name: '餐补', amount: 300.00 },
      { name: '交通补贴', amount: 500.00 }
    ],
    deductionDetails: [
      { name: '社保个人部分', amount: 1280.00 },
      { name: '公积金个人部分', amount: 960.00 },
      { name: '个人所得税', amount: 330.00 }
    ],
    totalDeduction: 2570.00
  }
  showDetail.value = true
}

// 下载工资条
const downloadPayslip = (record: any): void => {
  showLoadingToast({
    message: '正在生成工资条...',
    forbidClick: true
  })
  
  setTimeout(() => {
    showToast('工资条已生成')
    // 这里应该调用下载API
  }, 2000)
}

// 下载当前工资条
const downloadCurrentPayslip = (): void => {
  downloadPayslip(salaryHistory.value[0])
}

// 获取纳税证明
const getTaxCertificate = (): void => {
  showToast('正在生成纳税证明...')
}

// 获取收入证明
const getIncomeCertificate = (): void => {
  showToast('正在生成收入证明...')
}

// 查询社保
const querySocialInsurance = (): void => {
  router.push('/mobile/social-insurance')
}

// 查询公积金
const queryHousingFund = (): void => {
  router.push('/mobile/housing-fund')
}

// 前往设置
const goToSettings = (): void => {
  router.push('/mobile/payroll/settings')
}

// 查看全部历史
const viewAllHistory = (): void => {
  router.push('/mobile/payroll/history')
}

// 处理搜索
const handleSearch = (): void => {
  showSearch.value = false
  showToast('搜索功能开发中...')
}

// 年份变化
const onYearChange = (value: string): void => {
  console.log('Selected year:', value)
  // 这里应该根据选择的年份重新加载数据
}

// Tab切换
const onTabChange = (index: number): void => {
  console.log('Tab changed to:', index)
}

// 初始化图表
const initChart = (): void => {
  if (!chartRef.value) return
  
  const chart = echarts.init(chartRef.value)
  
  const option = {
    title: {
      text: '月度收入趋势',
      left: 'center',
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>工资: ¥${formatNumber(data.value)}`
      }
    },
    xAxis: {
      type: 'category',
      data: ['7月', '8月', '9月', '10月', '11月'],
      axisLabel: {
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 12,
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '工资',
        type: 'line',
        data: [11800, 12200, 13500, 12500, 12850],
        smooth: true,
        itemStyle: {
          color: '#1989fa'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(25, 137, 250, 0.3)' },
              { offset: 1, color: 'rgba(25, 137, 250, 0.1)' }
            ]
          }
        }
      }
    ]
  }
  
  chart.setOption(option)
  
  // 响应式调整
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

// 组件挂载
onMounted(() => {
  // 获取当前月份
  const now = new Date()
  currentMonth.value = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月`
  
  // 初始化图表
  nextTick(() => {
    initChart()
  })
})
</script>

<style scoped>
.mobile-payroll {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-top: 46px;
  padding-bottom: 50px;
}

.payroll-content {
  padding: 16px;
}

/* 薪资概览卡片 */
.salary-overview {
  background: linear-gradient(135deg, #1989fa 0%, #0066cc 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.3);
}

.current-month {
  margin-bottom: 16px;
}

.month-label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.month-value {
  font-size: 18px;
  font-weight: bold;
}

.salary-amount {
  margin-bottom: 20px;
}

.amount-label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.amount-value {
  font-size: 32px;
  font-weight: bold;
}

.salary-detail {
  display: grid;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item.deduction {
  color: #ff6b6b;
}

/* 快捷操作 */
.quick-actions {
  margin-bottom: 24px;
}

/* 薪资历史 */
.salary-history {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.history-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.month {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status.paid {
  background: #f0f9ff;
  color: #1989fa;
}

.status.pending {
  background: #fff7e6;
  color: #ff976a;
}

.history-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.salary-info {
  flex: 1;
}

.total-salary,
.actual-salary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.total-salary .label,
.actual-salary .label {
  font-size: 14px;
  color: #969799;
}

.total-salary .amount {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}

.actual-salary .amount {
  font-size: 14px;
  font-weight: 600;
  color: #07c160;
}

/* 统计信息 */
.statistics-section {
  margin-bottom: 24px;
}

.statistics-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #969799;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.salary-chart {
  width: 100%;
  height: 200px;
}

/* 搜索弹窗 */
.search-popup {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-filters {
  flex: 1;
  padding: 16px 0;
}

.filter-group {
  margin-bottom: 20px;
}

.filter-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #323233;
}

.search-actions {
  padding-top: 16px;
  border-top: 1px solid #ebedf0;
}

/* 详情弹窗 */
.detail-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #ebedf0;
}

.detail-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.info-section {
  margin-bottom: 24px;
}

.info-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}

.summary-section {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-item .label {
  font-size: 14px;
  color: #969799;
}

.summary-item .value {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}

.summary-item.total {
  border-top: 1px solid #ebedf0;
  padding-top: 8px;
  margin-top: 8px;
}

.summary-item.total .value {
  font-size: 16px;
  color: #1989fa;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .stat-cards {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    margin-bottom: 16px;
  }
}
</style>