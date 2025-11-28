<template>
  <div class="business-intelligence-container">
    <el-card class="header-card">
      <div class="page-header">
        <h2>商业智能分析</h2>
        <el-button-group>
          <el-button :icon="Refresh" @click="refreshData">刷新</el-button>
          <el-button :icon="Download" @click="exportReport">导出报告</el-button>
        </el-button-group>
      </div>
    </el-card>

    <!-- 筛选面板 -->
    <FilterPanel
      @query="handleQuery"
      @reset="handleReset"
      @filter-change="handleFilterChange"
    >
      <template #extra-filters>
        <el-form-item label="业务类型">
          <el-select v-model="filters.businessType" placeholder="请选择">
            <el-option label="销售" value="sales" />
            <el-option label="采购" value="purchase" />
            <el-option label="生产" value="production" />
            <el-option label="库存" value="inventory" />
          </el-select>
        </el-form-item>
        <el-form-item label="区域">
          <el-select v-model="filters.region" placeholder="请选择">
            <el-option label="华东" value="east" />
            <el-option label="华南" value="south" />
            <el-option label="华北" value="north" />
            <el-option label="华中" value="central" />
          </el-select>
        </el-form-item>
      </template>
    </FilterPanel>

    <!-- KPI指标卡片 -->
    <el-row :gutter="16" class="kpi-cards">
      <el-col :xs="24" :sm="12" :md="6" v-for="kpi in kpiData" :key="kpi.title">
        <el-card class="kpi-card" shadow="hover">
          <div class="kpi-content">
            <div class="kpi-icon" :style="{ backgroundColor: kpi.color }">
              <component :is="kpi.icon" />
            </div>
            <div class="kpi-info">
              <div class="kpi-title">{{ kpi.title }}</div>
              <div class="kpi-value">{{ kpi.value }}</div>
              <div class="kpi-trend" :class="kpi.trend > 0 ? 'up' : 'down'">
                <el-icon><component :is="kpi.trend > 0 ? CaretTop : CaretBottom" /></el-icon>
                {{ Math.abs(kpi.trend) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>销售趋势分析</span>
              <el-radio-group v-model="salesChartType" size="small">
                <el-radio-button label="line">折线图</el-radio-button>
                <el-radio-button label="bar">柱状图</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <DataVisualization
            :chart-type="salesChartType"
            :data="salesTrendData"
            :options="salesChartOptions"
            height="350px"
          />
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>
            <span>产品类别占比</span>
          </template>
          <DataVisualization
            chart-type="pie"
            :data="categoryData"
            :options="categoryChartOptions"
            height="350px"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>
            <span>区域销售对比</span>
          </template>
          <DataVisualization
            chart-type="bar"
            :data="regionData"
            :options="regionChartOptions"
            height="350px"
          />
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>
            <span>客户分布雷达图</span>
          </template>
          <DataVisualization
            chart-type="radar"
            :data="customerData"
            :options="customerChartOptions"
            height="350px"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>业务明细数据</span>
          <el-button :icon="Download" size="small" @click="exportTableData">导出数据</el-button>
        </div>
      </template>
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        height="400"
      >
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="businessType" label="业务类型" width="100" />
        <el-table-column prop="region" label="区域" width="100" />
        <el-table-column prop="sales" label="销售额" align="right">
          <template #default="{ row }">
            ¥{{ row.sales.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="orders" label="订单数" align="right" />
        <el-table-column prop="customers" label="客户数" align="right" />
        <el-table-column prop="avgOrderValue" label="平均订单额" align="right">
          <template #default="{ row }">
            ¥{{ row.avgOrderValue.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="growth" label="增长率" align="right">
          <template #default="{ row }">
            <el-tag :type="row.growth > 0 ? 'success' : 'danger'">
              {{ row.growth > 0 ? '+' : '' }}{{ row.growth }}%
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  Download,
  TrendCharts,
  ShoppingCart,
  User,
  Money,
  CaretTop,
  CaretBottom
} from '@element-plus/icons-vue'
import FilterPanel from './components/FilterPanel.vue'
import DataVisualization from './components/DataVisualization.vue'

// 筛选条件
const filters = reactive({
  businessType: '',
  region: '',
  dateRange: []
})

// 加载状态
const loading = ref(false)

// KPI数据
const kpiData = ref([
  {
    title: '总销售额',
    value: '¥12,580,000',
    trend: 15.8,
    icon: Money,
    color: '#409eff'
  },
  {
    title: '订单总数',
    value: '8,523',
    trend: 8.2,
    icon: ShoppingCart,
    color: '#67c23a'
  },
  {
    title: '客户数量',
    value: '1,256',
    trend: -3.5,
    icon: User,
    color: '#e6a23c'
  },
  {
    title: '平均订单额',
    value: '¥1,476',
    trend: 12.3,
    icon: TrendCharts,
    color: '#f56c6c'
  }
])

// 销售趋势数据
const salesChartType = ref('line')
const salesTrendData = ref({
  xAxis: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  series: [
    {
      name: '销售额',
      data: [820, 932, 901, 934, 1290, 1330, 1320, 1450, 1680, 1890, 2100, 2300]
    },
    {
      name: '目标',
      data: [800, 900, 950, 1000, 1200, 1300, 1400, 1500, 1600, 1800, 2000, 2200]
    }
  ]
})

const salesChartOptions = ref({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['销售额', '目标']
  }
})

// 产品类别数据
const categoryData = ref({
  series: [
    { name: '电子产品', value: 3500 },
    { name: '机械设备', value: 2800 },
    { name: '原材料', value: 2200 },
    { name: '配件', value: 1800 },
    { name: '其他', value: 1280 }
  ]
})

const categoryChartOptions = ref({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  }
})

// 区域销售数据
const regionData = ref({
  xAxis: ['华东', '华南', '华北', '华中', '西南', '西北', '东北'],
  series: [
    {
      name: '销售额',
      data: [3200, 2800, 2600, 2300, 1800, 1500, 1200]
    }
  ]
})

const regionChartOptions = ref({
  tooltip: {
    trigger: 'axis'
  }
})

// 客户分布数据
const customerData = ref({
  indicator: [
    { name: '产品质量', max: 100 },
    { name: '服务态度', max: 100 },
    { name: '交付准时', max: 100 },
    { name: '价格合理', max: 100 },
    { name: '售后支持', max: 100 }
  ],
  series: [
    {
      name: '客户满意度',
      data: [85, 90, 88, 82, 86]
    }
  ]
})

const customerChartOptions = ref({
  tooltip: {}
})

// 表格数据
const tableData = ref([])

// 方法
const handleQuery = (params) => {
  console.log('查询参数:', params)
  loadData()
}

const handleReset = () => {
  filters.businessType = ''
  filters.region = ''
  filters.dateRange = []
  loadData()
}

const handleFilterChange = (params) => {
  console.log('筛选变化:', params)
}

const refreshData = () => {
  loadData()
}

const loadData = async () => {
  loading.value = true
  try {
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    tableData.value = [
      {
        date: '2024-01-01',
        businessType: '销售',
        region: '华东',
        sales: 125000,
        orders: 85,
        customers: 42,
        avgOrderValue: 1471,
        growth: 15.2
      },
      {
        date: '2024-01-02',
        businessType: '采购',
        region: '华南',
        sales: 98000,
        orders: 62,
        customers: 35,
        avgOrderValue: 1581,
        growth: -3.8
      },
      {
        date: '2024-01-03',
        businessType: '生产',
        region: '华北',
        sales: 156000,
        orders: 95,
        customers: 48,
        avgOrderValue: 1642,
        growth: 22.5
      }
    ]
    
    ElMessage.success('数据加载成功')
  } catch (error) {
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

const exportReport = () => {
  ElMessage.success('正在导出完整报告...')
}

const exportTableData = () => {
  ElMessage.success('正在导出表格数据...')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.business-intelligence-container {
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
    }
  }

  .kpi-cards {
    margin: 16px 0;

    .kpi-card {
      margin-bottom: 16px;

      .kpi-content {
        display: flex;
        align-items: center;

        .kpi-icon {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: white;
          margin-right: 16px;
        }

        .kpi-info {
          flex: 1;

          .kpi-title {
            font-size: 14px;
            color: #909399;
            margin-bottom: 8px;
          }

          .kpi-value {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }

          .kpi-trend {
            font-size: 12px;
            display: flex;
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

  .table-card {
    margin-top: 16px;
  }
}
</style>
