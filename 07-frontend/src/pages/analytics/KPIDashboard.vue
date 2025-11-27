<template>
  <div class="kpi-dashboard-container">
    <el-card class="header-card">
      <div class="page-header">
        <h2>KPI仪表板</h2>
        <div class="header-actions">
          <el-select v-model="selectedDashboard" placeholder="选择仪表板" style="width: 200px; margin-right: 10px">
            <el-option
              v-for="dashboard in dashboardList"
              :key="dashboard.id"
              :label="dashboard.name"
              :value="dashboard.id"
            />
          </el-select>
          <el-button-group>
            <el-button :icon="Setting" @click="showDashboardConfig = true">配置</el-button>
            <el-button :icon="Refresh" @click="refreshDashboard">刷新</el-button>
            <el-button :icon="FullScreen" @click="toggleFullScreen">全屏</el-button>
          </el-button-group>
        </div>
      </div>
    </el-card>

    <!-- 时间范围选择 -->
    <el-card class="filter-card">
      <el-form inline>
        <el-form-item label="时间范围">
          <el-radio-group v-model="timeRange" @change="handleTimeRangeChange">
            <el-radio-button label="today">今天</el-radio-button>
            <el-radio-button label="week">本周</el-radio-button>
            <el-radio-button label="month">本月</el-radio-button>
            <el-radio-button label="quarter">本季度</el-radio-button>
            <el-radio-button label="year">本年</el-radio-button>
            <el-radio-button label="custom">自定义</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="timeRange === 'custom'">
          <el-date-picker
            v-model="customDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="loadDashboardData"
          />
        </el-form-item>
        <el-form-item label="自动刷新">
          <el-switch v-model="autoRefresh" @change="handleAutoRefreshChange" />
          <span v-if="autoRefresh" style="margin-left: 10px; color: #909399;">
            每{{ refreshInterval / 1000 }}秒
          </span>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- KPI指标网格 -->
    <div v-loading="loading" class="dashboard-grid">
      <!-- 主要KPI指标卡片 -->
      <el-row :gutter="16" class="kpi-row">
        <el-col
          :xs="24"
          :sm="12"
          :md="6"
          v-for="kpi in mainKPIs"
          :key="kpi.id"
        >
          <el-card class="kpi-card" :class="kpi.status" shadow="hover">
            <div class="kpi-header">
              <span class="kpi-title">{{ kpi.title }}</span>
              <el-tag :type="getKPIStatusType(kpi.status)" size="small">
                {{ getKPIStatusText(kpi.status) }}
              </el-tag>
            </div>
            <div class="kpi-body">
              <div class="kpi-value">{{ kpi.value }}</div>
              <div class="kpi-target">目标: {{ kpi.target }}</div>
            </div>
            <div class="kpi-footer">
              <div class="kpi-progress">
                <el-progress
                  :percentage="kpi.completion"
                  :color="getProgressColor(kpi.completion)"
                  :show-text="false"
                />
                <span class="progress-text">完成率 {{ kpi.completion }}%</span>
              </div>
              <div class="kpi-trend" :class="kpi.trend > 0 ? 'up' : 'down'">
                <el-icon>
                  <component :is="kpi.trend > 0 ? TrendCharts : Bottom" />
                </el-icon>
                {{ Math.abs(kpi.trend) }}%
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="16" class="chart-row">
        <el-col :xs="24" :md="12" :lg="8">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>销售达成率</span>
                <el-dropdown @command="handleChartAction">
                  <el-icon><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="refresh">刷新</el-dropdown-item>
                      <el-dropdown-item command="export">导出</el-dropdown-item>
                      <el-dropdown-item command="config">配置</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
            <DataVisualization
              chart-type="gauge"
              :data="salesGaugeData"
              :options="salesGaugeOptions"
              height="280px"
            />
          </el-card>
        </el-col>

        <el-col :xs="24" :md="12" :lg="8">
          <el-card>
            <template #header>
              <span>客户满意度</span>
            </template>
            <DataVisualization
              chart-type="gauge"
              :data="satisfactionGaugeData"
              :options="satisfactionGaugeOptions"
              height="280px"
            />
          </el-card>
        </el-col>

        <el-col :xs="24" :md="12" :lg="8">
          <el-card>
            <template #header>
              <span>库存周转率</span>
            </template>
            <DataVisualization
              chart-type="gauge"
              :data="inventoryGaugeData"
              :options="inventoryGaugeOptions"
              height="280px"
            />
          </el-card>
        </el-col>
      </el-row>

      <!-- 趋势图表 -->
      <el-row :gutter="16" class="chart-row">
        <el-col :xs="24" :lg="16">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>KPI趋势分析</span>
                <el-radio-group v-model="trendChartType" size="small">
                  <el-radio-button label="line">折线</el-radio-button>
                  <el-radio-button label="bar">柱状</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <DataVisualization
              :chart-type="trendChartType"
              :data="trendData"
              :options="trendOptions"
              height="350px"
            />
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="8">
          <el-card>
            <template #header>
              <span>KPI分布</span>
            </template>
            <DataVisualization
              chart-type="pie"
              :data="distributionData"
              :options="distributionOptions"
              height="350px"
            />
          </el-card>
        </el-col>
      </el-row>

      <!-- 详细指标列表 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <span>详细KPI指标</span>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索指标"
              :prefix-icon="Search"
              style="width: 200px"
              clearable
            />
          </div>
        </template>
        <el-table :data="filteredKPIList" border stripe>
          <el-table-column prop="name" label="指标名称" width="200" />
          <el-table-column prop="category" label="类别" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="current" label="当前值" align="right" width="120" />
          <el-table-column prop="target" label="目标值" align="right" width="120" />
          <el-table-column prop="completion" label="完成率" align="center" width="150">
            <template #default="{ row }">
              <el-progress
                :percentage="row.completion"
                :color="getProgressColor(row.completion)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="trend" label="趋势" align="center" width="100">
            <template #default="{ row }">
              <span :class="['trend-badge', row.trend > 0 ? 'up' : 'down']">
                <el-icon>
                  <component :is="row.trend > 0 ? CaretTop : CaretBottom" />
                </el-icon>
                {{ Math.abs(row.trend) }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" align="center" width="100">
            <template #default="{ row }">
              <el-tag :type="getKPIStatusType(row.status)">
                {{ getKPIStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updatedTime" label="更新时间" width="160" />
          <el-table-column label="操作" fixed="right" width="150">
            <template #default="{ row }">
              <el-button link type="primary" @click="viewKPIDetail(row)">详情</el-button>
              <el-button link type="primary" @click="viewKPIHistory(row)">历史</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 仪表板配置对话框 -->
    <el-dialog v-model="showDashboardConfig" title="仪表板配置" width="800px">
      <el-form :model="dashboardConfig" label-width="100px">
        <el-form-item label="仪表板名称">
          <el-input v-model="dashboardConfig.name" />
        </el-form-item>
        <el-form-item label="布局方式">
          <el-radio-group v-model="dashboardConfig.layout">
            <el-radio label="grid">网格</el-radio>
            <el-radio label="flex">弹性</el-radio>
            <el-radio label="custom">自定义</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="刷新间隔">
          <el-select v-model="dashboardConfig.refreshInterval">
            <el-option label="30秒" :value="30000" />
            <el-option label="1分钟" :value="60000" />
            <el-option label="5分钟" :value="300000" />
            <el-option label="不自动刷新" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="显示组件">
          <el-checkbox-group v-model="dashboardConfig.widgets">
            <el-checkbox label="mainKPI">主要KPI</el-checkbox>
            <el-checkbox label="gauge">仪表盘</el-checkbox>
            <el-checkbox label="trend">趋势图</el-checkbox>
            <el-checkbox label="distribution">分布图</el-checkbox>
            <el-checkbox label="table">详细列表</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDashboardConfig = false">取消</el-button>
        <el-button type="primary" @click="saveDashboardConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Setting,
  Refresh,
  FullScreen,
  MoreFilled,
  Search,
  TrendCharts,
  Bottom,
  CaretTop,
  CaretBottom
} from '@element-plus/icons-vue'
import DataVisualization from './components/DataVisualization.vue'

const dashboardList = ref([
  { id: 1, name: '销售仪表板' },
  { id: 2, name: '生产仪表板' },
  { id: 3, name: '财务仪表板' }
])

const selectedDashboard = ref(1)
const timeRange = ref('month')
const customDateRange = ref([])
const autoRefresh = ref(false)
const refreshInterval = ref(30000)
const loading = ref(false)
const searchKeyword = ref('')

const mainKPIs = ref([
  {
    id: 1,
    title: '销售收入',
    value: '¥12,580,000',
    target: '¥15,000,000',
    completion: 84,
    trend: 15.8,
    status: 'warning'
  },
  {
    id: 2,
    title: '订单完成率',
    value: '96.5%',
    target: '95%',
    completion: 101,
    trend: 3.2,
    status: 'success'
  },
  {
    id: 3,
    title: '客户满意度',
    value: '4.6/5.0',
    target: '4.5/5.0',
    completion: 102,
    trend: 5.8,
    status: 'success'
  },
  {
    id: 4,
    title: '库存周转率',
    value: '6.8次',
    target: '8次',
    completion: 85,
    trend: -2.5,
    status: 'danger'
  }
])

const trendChartType = ref('line')

const salesGaugeData = ref({
  series: [{ value: 84, name: '销售达成率' }]
})

const salesGaugeOptions = ref({
  tooltip: { formatter: '{a} <br/>{b} : {c}%' }
})

const satisfactionGaugeData = ref({
  series: [{ value: 92, name: '客户满意度' }]
})

const satisfactionGaugeOptions = ref({
  tooltip: { formatter: '{a} <br/>{b} : {c}%' }
})

const inventoryGaugeData = ref({
  series: [{ value: 85, name: '库存周转率' }]
})

const inventoryGaugeOptions = ref({
  tooltip: { formatter: '{a} <br/>{b} : {c}%' }
})

const trendData = ref({
  xAxis: ['1月', '2月', '3月', '4月', '5月', '6月'],
  series: [
    { name: '销售收入', data: [2200, 2400, 2100, 2600, 2800, 3000] },
    { name: '订单完成率', data: [92, 94, 91, 95, 96, 97] },
    { name: '客户满意度', data: [88, 89, 90, 91, 92, 92] }
  ]
})

const trendOptions = ref({
  tooltip: { trigger: 'axis' },
  legend: { data: ['销售收入', '订单完成率', '客户满意度'] }
})

const distributionData = ref({
  series: [
    { name: '优秀', value: 35 },
    { name: '良好', value: 45 },
    { name: '一般', value: 15 },
    { name: '待改进', value: 5 }
  ]
})

const distributionOptions = ref({
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left' }
})

const kpiList = ref([
  {
    name: '月销售额',
    category: '销售',
    current: '¥2,580,000',
    target: '¥3,000,000',
    completion: 86,
    trend: 12.5,
    status: 'warning',
    updatedTime: '2024-01-20 10:30'
  },
  {
    name: '新客户数',
    category: '销售',
    current: '156',
    target: '150',
    completion: 104,
    trend: 8.3,
    status: 'success',
    updatedTime: '2024-01-20 10:30'
  },
  {
    name: '生产合格率',
    category: '生产',
    current: '98.5%',
    target: '98%',
    completion: 101,
    trend: 0.5,
    status: 'success',
    updatedTime: '2024-01-20 10:25'
  },
  {
    name: '设备利用率',
    category: '生产',
    current: '82%',
    target: '85%',
    completion: 96,
    trend: -3.2,
    status: 'warning',
    updatedTime: '2024-01-20 10:25'
  },
  {
    name: '应收账款周转率',
    category: '财务',
    current: '5.2次',
    target: '6次',
    completion: 87,
    trend: -8.5,
    status: 'danger',
    updatedTime: '2024-01-20 10:20'
  }
])

const filteredKPIList = computed(() => {
  if (!searchKeyword.value) {
    return kpiList.value
  }
  return kpiList.value.filter(kpi =>
    kpi.name.includes(searchKeyword.value) ||
    kpi.category.includes(searchKeyword.value)
  )
})

const showDashboardConfig = ref(false)
const dashboardConfig = reactive({
  name: '我的仪表板',
  layout: 'grid',
  refreshInterval: 60000,
  widgets: ['mainKPI', 'gauge', 'trend', 'distribution', 'table']
})

let refreshTimer = null

const handleTimeRangeChange = () => {
  loadDashboardData()
}

const handleAutoRefreshChange = (value) => {
  if (value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  refreshTimer = setInterval(() => {
    loadDashboardData()
  }, refreshInterval.value)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const loadDashboardData = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

const refreshDashboard = () => {
  loadDashboardData()
}

const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const handleChartAction = (command) => {
  ElMessage.success(`执行操作: ${command}`)
}

const getKPIStatusType = (status) => {
  const typeMap = {
    success: 'success',
    warning: 'warning',
    danger: 'danger'
  }
  return typeMap[status] || 'info'
}

const getKPIStatusText = (status) => {
  const textMap = {
    success: '正常',
    warning: '预警',
    danger: '异常'
  }
  return textMap[status] || '未知'
}

const getProgressColor = (percentage) => {
  if (percentage >= 100) return '#67c23a'
  if (percentage >= 80) return '#409eff'
  if (percentage >= 60) return '#e6a23c'
  return '#f56c6c'
}

const viewKPIDetail = (row) => {
  ElMessage.info(`查看 ${row.name} 详情`)
}

const viewKPIHistory = (row) => {
  ElMessage.info(`查看 ${row.name} 历史数据`)
}

const saveDashboardConfig = () => {
  showDashboardConfig.value = false
  ElMessage.success('配置已保存')
}

onMounted(() => {
  loadDashboardData()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped lang="scss">
.kpi-dashboard-container {
  padding: 20px;

  .header-card {
    margin-bottom: 16px;

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
      }

      .header-actions {
        display: flex;
        align-items: center;
      }
    }
  }

  .filter-card {
    margin-bottom: 16px;
  }

  .kpi-row {
    margin-bottom: 16px;

    .kpi-card {
      margin-bottom: 16px;

      &.success {
        border-left: 4px solid #67c23a;
      }

      &.warning {
        border-left: 4px solid #e6a23c;
      }

      &.danger {
        border-left: 4px solid #f56c6c;
      }

      .kpi-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .kpi-title {
          font-size: 14px;
          color: #606266;
        }
      }

      .kpi-body {
        margin-bottom: 16px;

        .kpi-value {
          font-size: 28px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 4px;
        }

        .kpi-target {
          font-size: 12px;
          color: #909399;
        }
      }

      .kpi-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .kpi-progress {
          flex: 1;
          margin-right: 16px;

          .progress-text {
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
            display: block;
          }
        }

        .kpi-trend {
          display: flex;
          align-items: center;
          font-size: 14px;
          font-weight: 500;

          &.up {
            color: #67c23a;
          }

          &.down {
            color: #f56c6c;
          }
        }
      }
    }
  }

  .chart-row {
    margin-bottom: 16px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-card {
    margin-top: 16px;

    .trend-badge {
      display: inline-flex;
      align-items: center;

      &.up {
        color: #67c23a;
      }

      &.down {
        color: #f56c6c;
      }
    }
  }
}
</style>
