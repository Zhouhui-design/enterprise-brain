<template>
  <div class="receivable-aging-container">
    <el-card shadow="hover">
      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customerName" placeholder="请输入客户名称" clearable />
        </el-form-item>
        <el-form-item label="业务类型">
          <el-select v-model="searchForm.businessType" placeholder="请选择业务类型" clearable>
            <el-option label="销售应收" value="SALE" />
            <el-option label="服务应收" value="SERVICE" />
            <el-option label="租赁应收" value="LEASE" />
            <el-option label="其他应收" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="账龄区间">
          <el-select v-model="searchForm.agingPeriod" placeholder="请选择账龄区间" clearable>
            <el-option label="30天以内" value="0-30" />
            <el-option label="31-60天" value="31-60" />
            <el-option label="61-90天" value="61-90" />
            <el-option label="91-180天" value="91-180" />
            <el-option label="180天以上" value="180+" />
          </el-select>
        </el-form-item>
        <el-form-item label="统计日期">
          <el-date-picker
            v-model="searchForm.statDate"
            type="date"
            placeholder="选择统计日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 账龄汇总 -->
      <el-divider content-position="left">账龄汇总</el-divider>
      <el-row :gutter="20" class="aging-summary">
        <el-col :span="4">
          <div class="aging-card">
            <div class="aging-label">应收总额</div>
            <div class="aging-value total">¥{{ formatAmount(agingSummary.total) }}</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="aging-card level-1">
            <div class="aging-label">30天以内</div>
            <div class="aging-value">¥{{ formatAmount(agingSummary.period1) }}</div>
            <div class="aging-percent">{{ agingSummary.percent1 }}%</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="aging-card level-2">
            <div class="aging-label">31-60天</div>
            <div class="aging-value">¥{{ formatAmount(agingSummary.period2) }}</div>
            <div class="aging-percent">{{ agingSummary.percent2 }}%</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="aging-card level-3">
            <div class="aging-label">61-90天</div>
            <div class="aging-value">¥{{ formatAmount(agingSummary.period3) }}</div>
            <div class="aging-percent">{{ agingSummary.percent3 }}%</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="aging-card level-4">
            <div class="aging-label">91-180天</div>
            <div class="aging-value">¥{{ formatAmount(agingSummary.period4) }}</div>
            <div class="aging-percent">{{ agingSummary.percent4 }}%</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="aging-card level-5">
            <div class="aging-label">180天以上</div>
            <div class="aging-value">¥{{ formatAmount(agingSummary.period5) }}</div>
            <div class="aging-percent">{{ agingSummary.percent5 }}%</div>
          </div>
        </el-col>
      </el-row>

      <!-- 操作按钮 -->
      <div class="toolbar">
        <el-button type="primary" :icon="Download" @click="handleExport">导出</el-button>
        <el-button :icon="Printer" @click="handlePrint">打印</el-button>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      </div>

      <!-- 账龄明细表格 -->
      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        show-summary
        :summary-method="getSummaries"
        :span-method="spanMethod"
      >
        <el-table-column prop="customerName" label="客户名称" width="200" fixed />
        <el-table-column prop="businessType" label="业务类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getBusinessTypeTag(row.businessType)" size="small">
              {{ getBusinessTypeName(row.businessType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="应收总额" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text total">¥{{ formatAmount(row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="30天以内" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text level-1">¥{{ formatAmount(row.period1) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="31-60天" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text level-2">¥{{ formatAmount(row.period2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="61-90天" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text level-3">¥{{ formatAmount(row.period3) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="91-180天" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text level-4">¥{{ formatAmount(row.period4) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="180天以上" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text level-5">¥{{ formatAmount(row.period5) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="overdueRatio" label="逾期率" width="100" align="right">
          <template #default="{ row }">
            <el-tag :type="getOverdueTag(row.overdueRatio)" size="small">
              {{ row.overdueRatio }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="riskLevel" label="风险等级" width="120">
          <template #default="{ row }">
            <el-tag :type="getRiskTag(row.riskLevel)" size="small">
              {{ getRiskLevelName(row.riskLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              查看明细
            </el-button>
            <el-button link type="warning" size="small" @click="handleViewStatement(row)">
              客户对账单
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />

      <!-- 可视化图表 -->
      <el-divider content-position="left">账龄分布图表</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-container">
            <div class="chart-title">账龄金额分布</div>
            <div id="amountChart" style="width: 100%; height: 300px"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-container">
            <div class="chart-title">客户风险分布</div>
            <div id="riskChart" style="width: 100%; height: 300px"></div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download, Printer } from '@element-plus/icons-vue'

const router = useRouter()

// 搜索表单
const searchForm = reactive({
  customerName: '',
  businessType: '',
  agingPeriod: '',
  statDate: new Date()
})

// 账龄汇总
const agingSummary = reactive({
  total: 0,
  period1: 0,
  percent1: 0,
  period2: 0,
  percent2: 0,
  period3: 0,
  percent3: 0,
  period4: 0,
  percent4: 0,
  period5: 0,
  percent5: 0
})

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 分页
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取数据
    tableData.value = [
      {
        customerName: '深圳ABC科技有限公司',
        businessType: 'SALE',
        totalAmount: 500000,
        period1: 200000,
        period2: 150000,
        period3: 80000,
        period4: 50000,
        period5: 20000,
        overdueRatio: 30,
        riskLevel: 'MEDIUM'
      },
      {
        customerName: '广州XYZ贸易公司',
        businessType: 'SERVICE',
        totalAmount: 300000,
        period1: 100000,
        period2: 80000,
        period3: 60000,
        period4: 40000,
        period5: 20000,
        overdueRatio: 40,
        riskLevel: 'HIGH'
      },
      {
        customerName: '上海DEF实业有限公司',
        businessType: 'SALE',
        totalAmount: 200000,
        period1: 180000,
        period2: 20000,
        period3: 0,
        period4: 0,
        period5: 0,
        overdueRatio: 10,
        riskLevel: 'LOW'
      }
    ]

    pagination.total = 3

    // 更新汇总数据
    const total = tableData.value.reduce((sum, row) => sum + row.totalAmount, 0)
    agingSummary.total = total
    agingSummary.period1 = tableData.value.reduce((sum, row) => sum + row.period1, 0)
    agingSummary.period2 = tableData.value.reduce((sum, row) => sum + row.period2, 0)
    agingSummary.period3 = tableData.value.reduce((sum, row) => sum + row.period3, 0)
    agingSummary.period4 = tableData.value.reduce((sum, row) => sum + row.period4, 0)
    agingSummary.period5 = tableData.value.reduce((sum, row) => sum + row.period5, 0)
    
    agingSummary.percent1 = total > 0 ? ((agingSummary.period1 / total) * 100).toFixed(2) : 0
    agingSummary.percent2 = total > 0 ? ((agingSummary.period2 / total) * 100).toFixed(2) : 0
    agingSummary.percent3 = total > 0 ? ((agingSummary.period3 / total) * 100).toFixed(2) : 0
    agingSummary.percent4 = total > 0 ? ((agingSummary.period4 / total) * 100).toFixed(2) : 0
    agingSummary.percent5 = total > 0 ? ((agingSummary.period5 / total) * 100).toFixed(2) : 0

    // 绘制图表
    renderCharts()
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadData()
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    customerName: '',
    businessType: '',
    agingPeriod: '',
    statDate: new Date()
  })
  handleSearch()
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

// 打印
const handlePrint = () => {
  window.print()
}

// 查看明细
const handleViewDetail = (row) => {
  router.push(`/finance/accounts-receivable/list?customerName=${row.customerName}`)
}

// 查看对账单
const handleViewStatement = (row) => {
  router.push(`/finance/accounts-receivable/statement?customerName=${row.customerName}`)
}

// 汇总方法
const getSummaries = (param) => {
  const { columns, data } = param
  const sums = []

  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    
    const props = ['totalAmount', 'period1', 'period2', 'period3', 'period4', 'period5']
    if (props.includes(column.property)) {
      const values = data.map(item => Number(item[column.property]))
      const sum = values.reduce((prev, curr) => prev + curr, 0)
      sums[index] = `¥${formatAmount(sum)}`
    } else {
      sums[index] = ''
    }
  })

  return sums
}

// 合并单元格
const spanMethod = ({ row, column, rowIndex, columnIndex }) => {
  // 可以根据需要实现单元格合并逻辑
  return {
    rowspan: 1,
    colspan: 1
  }
}

// 业务类型名称
const getBusinessTypeName = (type) => {
  const map = {
    SALE: '销售应收',
    SERVICE: '服务应收',
    LEASE: '租赁应收',
    OTHER: '其他应收'
  }
  return map[type] || type
}

// 业务类型标签
const getBusinessTypeTag = (type) => {
  const map = {
    SALE: '',
    SERVICE: 'success',
    LEASE: 'warning',
    OTHER: 'info'
  }
  return map[type] || ''
}

// 逾期率标签
const getOverdueTag = (ratio) => {
  if (ratio < 10) return 'success'
  if (ratio < 30) return 'warning'
  return 'danger'
}

// 风险等级名称
const getRiskLevelName = (level) => {
  const map = {
    LOW: '低风险',
    MEDIUM: '中风险',
    HIGH: '高风险',
    CRITICAL: '严重风险'
  }
  return map[level] || level
}

// 风险等级标签
const getRiskTag = (level) => {
  const map = {
    LOW: 'success',
    MEDIUM: 'warning',
    HIGH: 'danger',
    CRITICAL: 'danger'
  }
  return map[level] || ''
}

// 渲染图表
const renderCharts = () => {
  // TODO: 使用 ECharts 或其他图表库绘制图表
  // 这里只是示例，需要引入相应的图表库
  console.log('渲染图表...')
}

// 金额格式化
const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.receivable-aging-container {
  padding: 20px;

  .search-form {
    margin-bottom: 20px;
  }

  .aging-summary {
    margin-bottom: 20px;

    .aging-card {
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      color: white;

      .aging-label {
        font-size: 14px;
        margin-bottom: 10px;
        opacity: 0.9;
      }

      .aging-value {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .aging-percent {
        font-size: 12px;
        opacity: 0.8;
      }

      &.total {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        
        .aging-value {
          font-size: 24px;
        }
      }

      &.level-1 {
        background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
      }

      &.level-2 {
        background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
      }

      &.level-3 {
        background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
      }

      &.level-4 {
        background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
      }

      &.level-5 {
        background: linear-gradient(135deg, #909399 0%, #a6a9ad 100%);
      }
    }
  }

  .toolbar {
    margin-bottom: 20px;
  }

  .amount-text {
    font-weight: 500;

    &.total {
      color: #303133;
    }

    &.level-1 {
      color: #67c23a;
    }

    &.level-2 {
      color: #409eff;
    }

    &.level-3 {
      color: #e6a23c;
    }

    &.level-4 {
      color: #f56c6c;
    }

    &.level-5 {
      color: #909399;
    }
  }

  .el-pagination {
    margin: 20px 0;
    justify-content: flex-end;
  }

  .chart-container {
    padding: 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .chart-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 15px;
      text-align: center;
    }
  }
}

@media print {
  .search-form,
  .toolbar,
  .el-pagination {
    display: none;
  }
}
</style>
