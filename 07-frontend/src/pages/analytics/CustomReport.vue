<template>
  <div class="custom-report-container">
    <el-card class="header-card">
      <div class="page-header">
        <h2>自定义报表</h2>
        <el-button-group>
          <el-button type="primary" :icon="Plus" @click="createReport">创建报表</el-button>
          <el-button :icon="Upload" @click="importReport">导入报表</el-button>
          <el-button :icon="Download" @click="exportReports">批量导出</el-button>
        </el-button-group>
      </div>
    </el-card>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card">
      <el-form inline>
        <el-form-item label="报表名称">
          <el-input
            v-model="searchForm.reportName"
            placeholder="请输入报表名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="报表类型">
          <el-select v-model="searchForm.reportType" clearable placeholder="全部" style="width: 150px">
            <el-option label="表格报表" value="table" />
            <el-option label="图表报表" value="chart" />
            <el-option label="仪表盘" value="dashboard" />
            <el-option label="复合报表" value="mixed" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建人">
          <el-select v-model="searchForm.creator" clearable placeholder="全部" style="width: 150px">
            <el-option label="我创建的" value="me" />
            <el-option label="团队创建" value="team" />
            <el-option label="公共报表" value="public" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" clearable placeholder="全部" style="width: 120px">
            <el-option label="启用" value="1" />
            <el-option label="禁用" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 报表列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>报表列表</span>
          <div class="header-right">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="list">列表</el-radio-button>
              <el-radio-button label="grid">卡片</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <!-- 列表视图 -->
      <el-table
        v-if="viewMode === 'list'"
        :data="reportList"
        v-loading="loading"
        border
        stripe
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="reportName" label="报表名称" width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="viewReport(row)">{{ row.reportName }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="reportCode" label="报表编码" width="150" />
        <el-table-column prop="reportType" label="报表类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getReportTypeTag(row.reportType)">
              {{ getReportTypeText(row.reportType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="isPublic" label="公开性" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isPublic ? 'success' : 'info'" size="small">
              {{ row.isPublic ? '公开' : '私有' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="executionCount" label="执行次数" width="100" align="right" />
        <el-table-column prop="createdBy" label="创建人" width="120" />
        <el-table-column prop="createdTime" label="创建时间" width="160" />
        <el-table-column label="操作" fixed="right" width="280">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="viewReport(row)">查看</el-button>
            <el-button link type="primary" :icon="VideoPlay" @click="executeReport(row)">执行</el-button>
            <el-button link type="primary" :icon="Edit" @click="editReport(row)">编辑</el-button>
            <el-button link type="primary" :icon="CopyDocument" @click="copyReport(row)">复制</el-button>
            <el-button link type="danger" :icon="Delete" @click="deleteReport(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 卡片视图 -->
      <div v-else class="report-grid">
        <el-row :gutter="16">
          <el-col
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
            v-for="report in reportList"
            :key="report.id"
          >
            <el-card class="report-card" shadow="hover">
              <div class="report-card-header">
                <el-tag :type="getReportTypeTag(report.reportType)" size="small">
                  {{ getReportTypeText(report.reportType) }}
                </el-tag>
                <el-dropdown @command="(cmd) => handleCardAction(cmd, report)">
                  <el-icon class="more-icon"><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="execute" :icon="VideoPlay">执行</el-dropdown-item>
                      <el-dropdown-item command="edit" :icon="Edit">编辑</el-dropdown-item>
                      <el-dropdown-item command="copy" :icon="CopyDocument">复制</el-dropdown-item>
                      <el-dropdown-item command="delete" :icon="Delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <div class="report-card-body" @click="viewReport(report)">
                <h3>{{ report.reportName }}</h3>
                <p class="report-description">{{ report.description || '暂无描述' }}</p>
                <div class="report-stats">
                  <span><el-icon><User /></el-icon> {{ report.createdBy }}</span>
                  <span><el-icon><DataAnalysis /></el-icon> {{ report.executionCount }}次</span>
                </div>
              </div>
              <div class="report-card-footer">
                <el-tag v-if="report.isPublic" type="success" size="small">公开</el-tag>
                <span class="report-time">{{ formatTime(report.createdTime) }}</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 分页 -->
      <el-pagination
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

    <!-- 报表构建器对话框 -->
    <ReportBuilder
      v-model:visible="showReportBuilder"
      :report-data="currentReport"
      @save="handleSaveReport"
    />

    <!-- 报表执行结果对话框 -->
    <el-dialog
      v-model="showExecutionResult"
      title="报表执行结果"
      width="90%"
      fullscreen
    >
      <el-tabs v-model="activeResultTab">
        <el-tab-pane label="数据结果" name="data">
          <div class="result-toolbar">
            <el-button :icon="Download" @click="exportResultData">导出数据</el-button>
            <el-button :icon="Refresh" @click="reExecuteReport">重新执行</el-button>
          </div>
          <el-table
            :data="executionResult.data"
            border
            stripe
            max-height="500"
            v-loading="executing"
          >
            <el-table-column
              v-for="(col, index) in executionResult.columns"
              :key="index"
              :prop="col.prop"
              :label="col.label"
              :width="col.width"
            />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="图表展示" name="chart">
          <div class="chart-toolbar">
            <el-radio-group v-model="resultChartType" size="small">
              <el-radio-button label="line">折线图</el-radio-button>
              <el-radio-button label="bar">柱状图</el-radio-button>
              <el-radio-button label="pie">饼图</el-radio-button>
              <el-radio-button label="scatter">散点图</el-radio-button>
            </el-radio-group>
          </div>
          <DataVisualization
            :chart-type="resultChartType"
            :data="executionResult.chartData"
            :options="executionResult.chartOptions"
            height="500px"
          />
        </el-tab-pane>
        <el-tab-pane label="执行信息" name="info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="报表名称">{{ executionResult.reportName }}</el-descriptions-item>
            <el-descriptions-item label="执行状态">
              <el-tag :type="executionResult.status === 'success' ? 'success' : 'danger'">
                {{ executionResult.status === 'success' ? '成功' : '失败' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="执行时间">{{ executionResult.executionTime }}</el-descriptions-item>
            <el-descriptions-item label="耗时">{{ executionResult.duration }}ms</el-descriptions-item>
            <el-descriptions-item label="结果行数">{{ executionResult.rowCount }}</el-descriptions-item>
            <el-descriptions-item label="执行人">{{ executionResult.executor }}</el-descriptions-item>
            <el-descriptions-item label="SQL语句" :span="2">
              <el-input
                type="textarea"
                :value="executionResult.sql"
                :rows="6"
                readonly
              />
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Upload,
  Download,
  Search,
  Refresh,
  View,
  VideoPlay,
  Edit,
  Delete,
  CopyDocument,
  MoreFilled,
  User,
  DataAnalysis
} from '@element-plus/icons-vue'
import ReportBuilder from './components/ReportBuilder.vue'
import DataVisualization from './components/DataVisualization.vue'

// 搜索表单
const searchForm = reactive({
  reportName: '',
  reportType: '',
  creator: '',
  status: ''
})

// 视图模式
const viewMode = ref('list')
const loading = ref(false)

// 报表列表
const reportList = ref([])

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 报表构建器
const showReportBuilder = ref(false)
const currentReport = ref(null)

// 执行结果
const showExecutionResult = ref(false)
const executing = ref(false)
const activeResultTab = ref('data')
const resultChartType = ref('bar')
const executionResult = reactive({
  reportName: '',
  status: 'success',
  executionTime: '',
  duration: 0,
  rowCount: 0,
  executor: '',
  sql: '',
  columns: [],
  data: [],
  chartData: {},
  chartOptions: {}
})

// 方法
const handleSearch = () => {
  pagination.page = 1
  loadReportList()
}

const handleReset = () => {
  searchForm.reportName = ''
  searchForm.reportType = ''
  searchForm.creator = ''
  searchForm.status = ''
  loadReportList()
}

const loadReportList = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 模拟数据
    reportList.value = [
      {
        id: 1,
        reportName: '月度销售报表',
        reportCode: 'RPT_SALES_MONTHLY',
        reportType: 'table',
        description: '统计每月销售数据，包括销售额、订单量等关键指标',
        isPublic: true,
        executionCount: 156,
        createdBy: '张三',
        createdTime: '2024-01-15 10:30:00'
      },
      {
        id: 2,
        reportName: '产品销售趋势',
        reportCode: 'RPT_PRODUCT_TREND',
        reportType: 'chart',
        description: '展示产品销售趋势图表，支持多维度分析',
        isPublic: true,
        executionCount: 89,
        createdBy: '李四',
        createdTime: '2024-01-16 14:20:00'
      },
      {
        id: 3,
        reportName: '库存分析仪表盘',
        reportCode: 'RPT_INVENTORY_DASHBOARD',
        reportType: 'dashboard',
        description: '库存实时监控仪表盘，包含预警提示',
        isPublic: false,
        executionCount: 234,
        createdBy: '王五',
        createdTime: '2024-01-17 09:15:00'
      },
      {
        id: 4,
        reportName: '客户价值分析',
        reportCode: 'RPT_CUSTOMER_VALUE',
        reportType: 'mixed',
        description: '综合分析客户价值，包含RFM模型分析',
        isPublic: true,
        executionCount: 67,
        createdBy: '张三',
        createdTime: '2024-01-18 16:45:00'
      }
    ]
    
    pagination.total = 4
  } catch (error) {
    ElMessage.error('加载报表列表失败')
  } finally {
    loading.value = false
  }
}

const createReport = () => {
  currentReport.value = null
  showReportBuilder.value = true
}

const editReport = (report) => {
  currentReport.value = { ...report }
  showReportBuilder.value = true
}

const viewReport = (report) => {
  ElMessage.info(`查看报表：${report.reportName}`)
}

const executeReport = async (report) => {
  executing.value = true
  showExecutionResult.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 模拟执行结果
    Object.assign(executionResult, {
      reportName: report.reportName,
      status: 'success',
      executionTime: new Date().toLocaleString(),
      duration: 856,
      rowCount: 50,
      executor: '当前用户',
      sql: `SELECT product_name, SUM(sales_amount) as total_sales
FROM sales_orders
WHERE order_date >= '2024-01-01'
GROUP BY product_name
ORDER BY total_sales DESC`,
      columns: [
        { prop: 'productName', label: '产品名称', width: 200 },
        { prop: 'totalSales', label: '销售额', width: 150 },
        { prop: 'orderCount', label: '订单数', width: 120 },
        { prop: 'avgPrice', label: '平均单价', width: 150 }
      ],
      data: Array.from({ length: 20 }, (_, i) => ({
        productName: `产品${i + 1}`,
        totalSales: `¥${(Math.random() * 100000).toFixed(2)}`,
        orderCount: Math.floor(Math.random() * 100),
        avgPrice: `¥${(Math.random() * 1000).toFixed(2)}`
      })),
      chartData: {
        xAxis: ['产品1', '产品2', '产品3', '产品4', '产品5'],
        series: [{
          name: '销售额',
          data: [45000, 38000, 32000, 28000, 25000]
        }]
      },
      chartOptions: {
        tooltip: { trigger: 'axis' }
      }
    })
    
    ElMessage.success('报表执行成功')
  } catch (error) {
    executionResult.status = 'failed'
    ElMessage.error('报表执行失败')
  } finally {
    executing.value = false
  }
}

const copyReport = async (report) => {
  try {
    await ElMessageBox.confirm(`确定要复制报表"${report.reportName}"吗？`, '提示', {
      type: 'warning'
    })
    ElMessage.success('报表已复制')
    loadReportList()
  } catch {
    // 取消操作
  }
}

const deleteReport = async (report) => {
  try {
    await ElMessageBox.confirm(`确定要删除报表"${report.reportName}"吗？`, '警告', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    ElMessage.success('删除成功')
    loadReportList()
  } catch {
    // 取消操作
  }
}

const importReport = () => {
  ElMessage.info('导入报表功能')
}

const exportReports = () => {
  ElMessage.info('批量导出报表')
}

const handleCardAction = (command, report) => {
  const actions = {
    execute: () => executeReport(report),
    edit: () => editReport(report),
    copy: () => copyReport(report),
    delete: () => deleteReport(report)
  }
  actions[command]?.()
}

const handleSaveReport = (reportData) => {
  console.log('保存报表:', reportData)
  ElMessage.success('报表保存成功')
  showReportBuilder.value = false
  loadReportList()
}

const exportResultData = () => {
  ElMessage.success('正在导出数据...')
}

const reExecuteReport = () => {
  ElMessage.info('重新执行报表')
}

const handleSizeChange = () => {
  loadReportList()
}

const handleCurrentChange = () => {
  loadReportList()
}

const getReportTypeTag = (type) => {
  const tagMap = {
    table: '',
    chart: 'success',
    dashboard: 'warning',
    mixed: 'danger'
  }
  return tagMap[type] || ''
}

const getReportTypeText = (type) => {
  const textMap = {
    table: '表格',
    chart: '图表',
    dashboard: '仪表盘',
    mixed: '复合'
  }
  return textMap[type] || '未知'
}

const formatTime = (time) => {
  if (!time) return ''
  return time.split(' ')[0]
}

onMounted(() => {
  loadReportList()
})
</script>

<style scoped lang="scss">
.custom-report-container {
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

  .filter-card {
    margin-bottom: 16px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .report-grid {
    min-height: 400px;

    .report-card {
      margin-bottom: 16px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .report-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .more-icon {
          cursor: pointer;
          font-size: 18px;
          color: #909399;

          &:hover {
            color: #409eff;
          }
        }
      }

      .report-card-body {
        margin-bottom: 12px;

        h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 500;
          color: #303133;
        }

        .report-description {
          margin: 0 0 12px 0;
          font-size: 13px;
          color: #606266;
          line-height: 1.5;
          height: 40px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .report-stats {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #909399;

          span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }

      .report-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 12px;
        border-top: 1px solid #ebeef5;

        .report-time {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .result-toolbar,
  .chart-toolbar {
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
