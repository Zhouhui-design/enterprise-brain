<template>
  <div class="data-analysis-container">
    <el-card class="header-card">
      <div class="page-header">
        <h2>数据分析</h2>
        <el-button-group>
          <el-button :icon="DocumentAdd" @click="saveAnalysis">保存分析</el-button>
          <el-button :icon="Download" @click="exportAnalysis">导出结果</el-button>
        </el-button-group>
      </div>
    </el-card>

    <el-row :gutter="16">
      <!-- 左侧配置面板 -->
      <el-col :xs="24" :lg="6">
        <el-card class="config-card">
          <template #header>
            <span>分析配置</span>
          </template>

          <el-form :model="analysisConfig" label-position="top" size="default">
            <el-form-item label="数据源">
              <el-select v-model="analysisConfig.dataSource" placeholder="选择数据源" @change="handleDataSourceChange">
                <el-option label="销售数据" value="sales" />
                <el-option label="采购数据" value="purchase" />
                <el-option label="库存数据" value="inventory" />
                <el-option label="生产数据" value="production" />
                <el-option label="财务数据" value="finance" />
              </el-select>
            </el-form-item>

            <el-form-item label="分析维度">
              <el-select
                v-model="analysisConfig.dimensions"
                multiple
                placeholder="选择维度"
                @change="handleDimensionChange"
              >
                <el-option
                  v-for="dim in availableDimensions"
                  :key="dim.value"
                  :label="dim.label"
                  :value="dim.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="分析指标">
              <el-select
                v-model="analysisConfig.metrics"
                multiple
                placeholder="选择指标"
                @change="handleMetricChange"
              >
                <el-option
                  v-for="metric in availableMetrics"
                  :key="metric.value"
                  :label="metric.label"
                  :value="metric.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="聚合方式">
              <el-radio-group v-model="analysisConfig.aggregation">
                <el-radio label="sum">求和</el-radio>
                <el-radio label="avg">平均</el-radio>
                <el-radio label="count">计数</el-radio>
                <el-radio label="max">最大值</el-radio>
                <el-radio label="min">最小值</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="时间范围">
              <el-date-picker
                v-model="analysisConfig.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="分组方式">
              <el-select v-model="analysisConfig.groupBy" placeholder="选择分组">
                <el-option label="按天" value="day" />
                <el-option label="按周" value="week" />
                <el-option label="按月" value="month" />
                <el-option label="按季度" value="quarter" />
                <el-option label="按年" value="year" />
              </el-select>
            </el-form-item>

            <el-form-item label="过滤条件">
              <el-button @click="showFilterDialog = true" style="width: 100%">
                设置过滤条件 ({{ filterCount }})
              </el-button>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="performAnalysis" :loading="analyzing" style="width: 100%">
                <el-icon><Search /></el-icon>
                执行分析
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 快速分析模板 -->
        <el-card class="template-card">
          <template #header>
            <span>快速模板</span>
          </template>
          <div class="template-list">
            <div
              v-for="template in analysisTemplates"
              :key="template.id"
              class="template-item"
              @click="applyTemplate(template)"
            >
              <el-icon><Document /></el-icon>
              <span>{{ template.name }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧结果展示 -->
      <el-col :xs="24" :lg="18">
        <el-tabs v-model="activeTab" type="card">
          <el-tab-pane label="图表分析" name="chart">
            <el-card>
              <template #header>
                <div class="result-header">
                  <span>分析结果</span>
                  <el-radio-group v-model="chartType" size="small">
                    <el-radio-button label="line">折线图</el-radio-button>
                    <el-radio-button label="bar">柱状图</el-radio-button>
                    <el-radio-button label="pie">饼图</el-radio-button>
                    <el-radio-button label="scatter">散点图</el-radio-button>
                  </el-radio-group>
                </div>
              </template>
              <div v-if="!hasAnalysisResult" class="empty-result">
                <el-empty description="请配置分析参数并执行分析" />
              </div>
              <DataVisualization
                v-else
                :chart-type="chartType"
                :data="chartData"
                :options="chartOptions"
                height="500px"
              />
            </el-card>

            <!-- 统计摘要 -->
            <el-card v-if="hasAnalysisResult" class="summary-card">
              <template #header>
                <span>统计摘要</span>
              </template>
              <el-row :gutter="16">
                <el-col :span="6" v-for="stat in statistics" :key="stat.label">
                  <div class="stat-item">
                    <div class="stat-label">{{ stat.label }}</div>
                    <div class="stat-value">{{ stat.value }}</div>
                  </div>
                </el-col>
              </el-row>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="数据表格" name="table">
            <el-card>
              <template #header>
                <div class="result-header">
                  <span>详细数据</span>
                  <el-button-group size="small">
                    <el-button :icon="Download" @click="exportTableData">导出</el-button>
                    <el-button :icon="Refresh" @click="refreshData">刷新</el-button>
                  </el-button-group>
                </div>
              </template>
              <el-table
                :data="tableData"
                v-loading="analyzing"
                border
                stripe
                height="500"
                show-summary
              >
                <el-table-column
                  v-for="col in tableColumns"
                  :key="col.prop"
                  :prop="col.prop"
                  :label="col.label"
                  :width="col.width"
                  :align="col.align || 'left'"
                >
                  <template #default="{ row }" v-if="col.formatter">
                    {{ col.formatter(row[col.prop]) }}
                  </template>
                </el-table-column>
              </el-table>
              <el-pagination
                v-if="tableData.length > 0"
                v-model:current-page="pagination.page"
                v-model:page-size="pagination.size"
                :total="pagination.total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                style="margin-top: 16px; justify-content: flex-end;"
              />
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="对比分析" name="compare">
            <el-card>
              <template #header>
                <span>同比/环比分析</span>
              </template>
              <DataVisualization
                chart-type="bar"
                :data="compareData"
                :options="compareOptions"
                height="500px"
              />
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="趋势预测" name="forecast">
            <el-card>
              <template #header>
                <div class="result-header">
                  <span>趋势预测</span>
                  <el-select v-model="forecastPeriod" size="small" style="width: 120px">
                    <el-option label="未来7天" :value="7" />
                    <el-option label="未来30天" :value="30" />
                    <el-option label="未来90天" :value="90" />
                  </el-select>
                </div>
              </template>
              <DataVisualization
                chart-type="line"
                :data="forecastData"
                :options="forecastOptions"
                height="500px"
              />
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>

    <!-- 过滤条件对话框 -->
    <el-dialog v-model="showFilterDialog" title="设置过滤条件" width="600px">
      <el-form :model="filterForm" label-width="100px">
        <el-form-item
          v-for="(filter, index) in filterForm.filters"
          :key="index"
          :label="`条件${index + 1}`"
        >
          <el-row :gutter="10">
            <el-col :span="8">
              <el-select v-model="filter.field" placeholder="字段">
                <el-option label="金额" value="amount" />
                <el-option label="数量" value="quantity" />
                <el-option label="状态" value="status" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-select v-model="filter.operator" placeholder="操作符">
                <el-option label="等于" value="eq" />
                <el-option label="大于" value="gt" />
                <el-option label="小于" value="lt" />
                <el-option label="包含" value="contains" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-input v-model="filter.value" placeholder="值" />
            </el-col>
            <el-col :span="2">
              <el-button :icon="Delete" @click="removeFilter(index)" />
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item>
          <el-button @click="addFilter">添加条件</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFilterDialog = false">取消</el-button>
        <el-button type="primary" @click="applyFilters">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DocumentAdd,
  Download,
  Search,
  Document,
  Refresh,
  Delete
} from '@element-plus/icons-vue'
import DataVisualization from './components/DataVisualization.vue'

// 分析配置
const analysisConfig = reactive({
  dataSource: 'sales',
  dimensions: [],
  metrics: [],
  aggregation: 'sum',
  dateRange: [],
  groupBy: 'day'
})

// 可用维度和指标
const availableDimensions = ref([
  { label: '日期', value: 'date' },
  { label: '产品', value: 'product' },
  { label: '客户', value: 'customer' },
  { label: '区域', value: 'region' },
  { label: '类别', value: 'category' }
])

const availableMetrics = ref([
  { label: '销售额', value: 'sales' },
  { label: '订单数', value: 'orders' },
  { label: '利润', value: 'profit' },
  { label: '成本', value: 'cost' }
])

// 分析状态
const analyzing = ref(false)
const hasAnalysisResult = ref(false)
const activeTab = ref('chart')
const chartType = ref('line')

// 图表数据
const chartData = ref({})
const chartOptions = ref({})
const compareData = ref({})
const compareOptions = ref({})
const forecastData = ref({})
const forecastOptions = ref({})
const forecastPeriod = ref(30)

// 表格数据
const tableData = ref([])
const tableColumns = ref([])
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 统计摘要
const statistics = ref([])

// 过滤条件
const showFilterDialog = ref(false)
const filterForm = reactive({
  filters: []
})

const filterCount = computed(() => filterForm.filters.length)

// 分析模板
const analysisTemplates = ref([
  { id: 1, name: '销售趋势分析', config: {} },
  { id: 2, name: '产品占比分析', config: {} },
  { id: 3, name: '客户价值分析', config: {} },
  { id: 4, name: '库存周转分析', config: {} }
])

// 方法
const handleDataSourceChange = () => {
  // 根据数据源更新可用维度和指标
  console.log('数据源变更:', analysisConfig.dataSource)
}

const handleDimensionChange = () => {
  console.log('维度变更:', analysisConfig.dimensions)
}

const handleMetricChange = () => {
  console.log('指标变更:', analysisConfig.metrics)
}

const performAnalysis = async () => {
  if (!analysisConfig.dataSource) {
    ElMessage.warning('请选择数据源')
    return
  }
  if (analysisConfig.dimensions.length === 0) {
    ElMessage.warning('请选择至少一个分析维度')
    return
  }
  if (analysisConfig.metrics.length === 0) {
    ElMessage.warning('请选择至少一个分析指标')
    return
  }

  analyzing.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 模拟生成分析结果
    chartData.value = {
      xAxis: ['1月', '2月', '3月', '4月', '5月', '6月'],
      series: [{
        name: '销售额',
        data: [820, 932, 901, 934, 1290, 1330]
      }]
    }

    tableData.value = Array.from({ length: 20 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      product: `产品${i + 1}`,
      sales: Math.floor(Math.random() * 10000),
      orders: Math.floor(Math.random() * 100)
    }))

    tableColumns.value = [
      { prop: 'date', label: '日期', width: 120 },
      { prop: 'product', label: '产品', width: 150 },
      { prop: 'sales', label: '销售额', align: 'right', formatter: (val) => `¥${val.toLocaleString()}` },
      { prop: 'orders', label: '订单数', align: 'right' }
    ]

    statistics.value = [
      { label: '总计', value: '¥1,258,000' },
      { label: '平均值', value: '¥62,900' },
      { label: '最大值', value: '¥98,500' },
      { label: '最小值', value: '¥35,200' }
    ]

    pagination.total = 100
    hasAnalysisResult.value = true
    ElMessage.success('分析完成')
  } catch (error) {
    ElMessage.error('分析失败')
  } finally {
    analyzing.value = false
  }
}

const applyTemplate = (template) => {
  ElMessage.success(`应用模板：${template.name}`)
  // 应用模板配置
}

const addFilter = () => {
  filterForm.filters.push({
    field: '',
    operator: 'eq',
    value: ''
  })
}

const removeFilter = (index) => {
  filterForm.filters.splice(index, 1)
}

const applyFilters = () => {
  showFilterDialog.value = false
  ElMessage.success('过滤条件已应用')
}

const saveAnalysis = () => {
  ElMessage.success('分析已保存')
}

const exportAnalysis = () => {
  ElMessage.success('正在导出分析结果...')
}

const exportTableData = () => {
  ElMessage.success('正在导出表格数据...')
}

const refreshData = () => {
  performAnalysis()
}

const handleSizeChange = () => {
  performAnalysis()
}

const handleCurrentChange = () => {
  performAnalysis()
}

onMounted(() => {
  // 初始化
})
</script>

<style scoped lang="scss">
.data-analysis-container {
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

  .config-card {
    margin-bottom: 16px;
  }

  .template-card {
    .template-list {
      .template-item {
        display: flex;
        align-items: center;
        padding: 10px;
        margin-bottom: 8px;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background-color: #f5f7fa;
          border-color: #409eff;
        }

        .el-icon {
          margin-right: 8px;
        }
      }
    }
  }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .empty-result {
    padding: 60px 0;
  }

  .summary-card {
    margin-top: 16px;

    .stat-item {
      text-align: center;
      padding: 16px;
      background-color: #f5f7fa;
      border-radius: 4px;

      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }
    }
  }
}
</style>
