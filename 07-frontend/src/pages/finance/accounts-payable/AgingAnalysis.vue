<template>
  <div class="aging-analysis">
    <div class="header">
      <h2>应付账款账龄分析</h2>
      <div class="header-actions">
        <el-button type="primary" @click="exportAnalysis">导出分析报表</el-button>
        <el-button @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="供应商名称">
        <el-input v-model="searchForm.supplierName" placeholder="请输入供应商名称" />
      </el-form-item>
      <el-form-item label="供应商类型">
        <el-select v-model="searchForm.supplierType" placeholder="请选择供应商类型">
          <el-option label="全部" value="" />
          <el-option label="直销供应商" value="direct" />
          <el-option label="经销供应商" value="distributor" />
          <el-option label="零售供应商" value="retail" />
          <el-option label="重要供应商" value="vip" />
        </el-select>
      </el-form-item>
      <el-form-item label="负责人">
        <el-select v-model="searchForm.responsiblePerson" placeholder="请选择负责人">
          <el-option label="全部" value="" />
          <el-option label="张三" value="张三" />
          <el-option label="李四" value="李四" />
          <el-option label="王五" value="王五" />
        </el-select>
      </el-form-item>
      <el-form-item label="金额范围">
        <el-input-number
          v-model="searchForm.amountMin"
          :min="0"
          placeholder="最小金额"
          style="width: 120px;"
        />
        <span style="margin: 0 10px;">-</span>
        <el-input-number
          v-model="searchForm.amountMax"
          :min="0"
          placeholder="最大金额"
          style="width: 120px;"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 账龄分析概览 -->
    <div class="overview-container">
      <el-row :gutter="20">
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">应付账款总额</div>
              <div class="overview-value primary">{{ formatCurrency(totalPayable) }}</div>
              <div class="overview-desc">{{ agingData.length }} 笔应付账款</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">逾期金额</div>
              <div class="overview-value danger">{{ formatCurrency(overdueAmount) }}</div>
              <div class="overview-desc">{{ overdueRate }}% 的总应付</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">平均账龄</div>
              <div class="overview-value warning">{{ avgAgingDays }} 天</div>
              <div class="overview-desc">较上期 {{ agingTrend > 0 ? '↑' : agingTrend < 0 ? '↓' : '→' }} {{ Math.abs(agingTrend) }}%</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">超期供应商数</div>
              <div class="overview-value danger">{{ overdueSupplierCount }}</div>
              <div class="overview-desc">{{ overdueSupplierRate }}% 的供应商</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">坏账风险金额</div>
              <div class="overview-value warning">{{ formatCurrency(badDebtRiskAmount) }}</div>
              <div class="overview-desc">超期180天以上</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">本月付款</div>
              <div class="overview-value success">{{ formatCurrency(currentMonthPayment) }}</div>
              <div class="overview-desc">占计划 {{ monthPaymentRate }}%</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="chart-container">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span>账龄分布</span>
              </div>
            </template>
            <div ref="agingDistributionChart" class="chart-item"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span>账龄趋势</span>
                <el-select v-model="trendTimeRange" @change="updateCharts">
                  <el-option label="近6个月" value="6months" />
                  <el-option label="近12个月" value="12months" />
                </el-select>
              </div>
            </template>
            <div ref="agingTrendChart" class="chart-item"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span>按供应商类型分布</span>
              </div>
            </template>
            <div ref="supplierTypeChart" class="chart-item"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span>按负责人分布</span>
              </div>
            </template>
            <div ref="responsiblePersonChart" class="chart-item"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 账龄分析详情表 -->
    <el-card class="data-table-card">
      <template #header>
        <div class="table-header">
          <span>账龄分析详情</span>
          <div class="table-actions">
            <el-checkbox v-model="showZeroBalance">显示余额为零的供应商</el-checkbox>
          </div>
        </div>
      </template>
      <el-table
        v-loading="loading"
        :data="filteredAgingData"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="supplierName" label="供应商名称" width="180" :show-overflow-tooltip="true">
          <template #default="{ row }">
            <a href="#" @click.stop="viewSupplierDetails(row)">{{ row.supplierName }}</a>
          </template>
        </el-table-column>
        <el-table-column prop="supplierType" label="供应商类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getSupplierTypeTag(row.supplierType)">{{ getSupplierTypeText(row.supplierType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="responsiblePerson" label="负责人" width="100" />
        <el-table-column prop="creditLimit" label="信用额度" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.creditLimit) }}
          </template>
        </el-table-column>
        <el-table-column prop="currentBalance" label="当前余额" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.currentBalance > 0 }">
              {{ formatCurrency(row.currentBalance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="days0To30" label="0-30天" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-primary': row.days0To30 > 0 }">
              {{ formatCurrency(row.days0To30) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="days31To60" label="31-60天" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-warning': row.days31To60 > 0 }">
              {{ formatCurrency(row.days31To60) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="days61To90" label="61-90天" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.days61To90 > 0 }">
              {{ formatCurrency(row.days61To90) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="days91To180" label="91-180天" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.days91To180 > 0 }">
              {{ formatCurrency(row.days91To180) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="daysOver180" label="180天以上" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.daysOver180 > 0 }">
              {{ formatCurrency(row.daysOver180) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="overdueDays" label="逾期天数" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getOverdueDaysTag(row.overdueDays)">{{ row.overdueDays }}天</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="agingLevel" label="账龄等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getAgingLevelTag(row.agingLevel)">{{ getAgingLevelText(row.agingLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="riskLevel" label="风险等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getRiskLevelTag(row.riskLevel)">{{ getRiskLevelText(row.riskLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewSupplierDetails(row)">详情</el-button>
            <el-button
              v-if="row.currentBalance > 0"
              type="primary"
              size="small"
              @click="makePayment(row)"
            >
              付款
            </el-button>
            <el-button
              v-if="row.overdueDays > 0"
              type="danger"
              size="small"
              @click="followUpOverdue(row)"
            >
              逾期跟进
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'AgingAnalysis',
  setup() {
    // 状态管理
    const loading = ref(false)
    const agingData = ref([])
    const selectedRows = ref([])
    const showZeroBalance = ref(false)
    const trendTimeRange = ref('6months')

    // 图表引用
    const agingDistributionChart = ref(null)
    const agingTrendChart = ref(null)
    const supplierTypeChart = ref(null)
    const responsiblePersonChart = ref(null)

    // 搜索表单
    const searchForm = reactive({
      supplierName: '',
      supplierType: '',
      responsiblePerson: '',
      amountMin: null,
      amountMax: null
    })

    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    })

    // 计算属性
    const filteredAgingData = computed(() => {
      let data = [...agingData.value]
      
      // 筛选零余额
      if (!showZeroBalance.value) {
        data = data.filter(item => item.currentBalance > 0)
      }
      
      // 应用搜索条件
      if (searchForm.supplierName) {
        data = data.filter(item => 
          item.supplierName.toLowerCase().includes(searchForm.supplierName.toLowerCase())
        )
      }
      if (searchForm.supplierType) {
        data = data.filter(item => item.supplierType === searchForm.supplierType)
      }
      if (searchForm.responsiblePerson) {
        data = data.filter(item => item.responsiblePerson === searchForm.responsiblePerson)
      }
      if (searchForm.amountMin !== null && searchForm.amountMin !== undefined) {
        data = data.filter(item => item.currentBalance >= searchForm.amountMin)
      }
      if (searchForm.amountMax !== null && searchForm.amountMax !== undefined) {
        data = data.filter(item => item.currentBalance <= searchForm.amountMax)
      }
      
      // 分页
      const start = (pagination.currentPage - 1) * pagination.pageSize
      const end = start + pagination.pageSize
      pagination.total = data.length
      
      return data.slice(start, end)
    })

    // 应付账款总额
    const totalPayable = computed(() => {
      return agingData.value.reduce((sum, item) => sum + item.currentBalance, 0)
    })

    // 逾期金额
    const overdueAmount = computed(() => {
      return agingData.value.reduce((sum, item) => {
        const overdue = item.days31To60 + item.days61To90 + item.days91To180 + item.daysOver180
        return sum + overdue
      }, 0)
    })

    // 逾期率
    const overdueRate = computed(() => {
      if (totalPayable.value === 0) return 0
      return Math.round((overdueAmount.value / totalPayable.value) * 100)
    })

    // 平均账龄
    const avgAgingDays = computed(() => {
      let totalDays = 0
      let totalAmount = 0
      
      agingData.value.forEach(item => {
        const amount = item.currentBalance
        if (amount > 0) {
          // 加权平均计算账龄
          totalDays += (item.days0To30 * 15) + (item.days31To60 * 45) + 
                      (item.days61To90 * 75) + (item.days91To180 * 135) + 
                      (item.daysOver180 * 200)
          totalAmount += amount
        }
      })
      
      if (totalAmount === 0) return 0
      return Math.round(totalDays / totalAmount)
    })

    // 账龄趋势
    const agingTrend = ref(-3) // 模拟数据，较上期下降3%

    // 超期供应商数
    const overdueSupplierCount = computed(() => {
      return agingData.value.filter(item => item.overdueDays > 0).length
    })

    // 超期供应商比例
    const overdueSupplierRate = computed(() => {
      if (agingData.value.length === 0) return 0
      return Math.round((overdueSupplierCount.value / agingData.value.length) * 100)
    })

    // 坏账风险金额（超期180天以上）
    const badDebtRiskAmount = computed(() => {
      return agingData.value.reduce((sum, item) => {
        return sum + item.daysOver180
      }, 0)
    })

    // 本月付款
    const currentMonthPayment = ref(95000.00) // 模拟数据

    // 本月付款计划完成率
    const monthPaymentRate = ref(79) // 模拟数据

    // 格式化日期
    const formatDate = (date) => {
      if (!date) return ''
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    // 格式化货币
    const formatCurrency = (value) => {
      if (value === null || value === undefined) return '0.00'
      return value.toFixed(2)
    }

    // 获取供应商类型标签样式
    const getSupplierTypeTag = (type) => {
      switch (type) {
        case 'direct': return 'primary'
        case 'distributor': return 'success'
        case 'retail': return 'info'
        case 'vip': return 'warning'
        default: return 'default'
      }
    }

    // 获取供应商类型文本
    const getSupplierTypeText = (type) => {
      switch (type) {
        case 'direct': return '直销供应商'
        case 'distributor': return '经销供应商'
        case 'retail': return '零售供应商'
        case 'vip': return '重要供应商'
        default: return '其他'
      }
    }

    // 获取逾期天数标签样式
    const getOverdueDaysTag = (days) => {
      if (days === 0) return 'success'
      if (days <= 30) return 'warning'
      if (days <= 90) return 'danger'
      return 'danger'
    }

    // 获取账龄等级标签样式
    const getAgingLevelTag = (level) => {
      switch (level) {
        case 'normal': return 'success'
        case 'warning': return 'warning'
        case 'danger': return 'danger'
        default: return 'info'
      }
    }

    // 获取账龄等级文本
    const getAgingLevelText = (level) => {
      switch (level) {
        case 'normal': return '正常'
        case 'warning': return '预警'
        case 'danger': return '危险'
        default: return '未知'
      }
    }

    // 获取风险等级标签样式
    const getRiskLevelTag = (level) => {
      switch (level) {
        case 'low': return 'success'
        case 'medium': return 'warning'
        case 'high': return 'danger'
        default: return 'info'
      }
    }

    // 获取风险等级文本
    const getRiskLevelText = (level) => {
      switch (level) {
        case 'low': return '低风险'
        case 'medium': return '中风险'
        case 'high': return '高风险'
        default: return '未知'
      }
    }

    // 处理选择变化
    const handleSelectionChange = (val) => {
      selectedRows.value = val
    }

    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size
    }

    const handleCurrentChange = (current) => {
      pagination.currentPage = current
    }

    // 搜索
    const search = () => {
      pagination.currentPage = 1
    }

    // 重置搜索
    const resetSearch = () => {
      Object.keys(searchForm).forEach(key => {
        if (key === 'amountMin' || key === 'amountMax') {
          searchForm[key] = null
        } else {
          searchForm[key] = ''
        }
      })
      pagination.currentPage = 1
    }

    // 查看供应商详情
    const viewSupplierDetails = (row) => {
      ElMessage.info(`查看供应商详情: ${row.supplierName}`)
    }

    // 付款
    const makePayment = (row) => {
      ElMessageBox.confirm(`确定要对供应商 ${row.supplierName} 进行付款吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('付款成功')
      }).catch(() => {})
    }

    // 逾期跟进
    const followUpOverdue = (row) => {
      ElMessage.info(`对供应商 ${row.supplierName} 进行逾期跟进`)
    }

    // 导出分析报表
    const exportAnalysis = () => {
      ElMessageBox.confirm('确定要导出账龄分析报表吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        loading.value = true
        // 模拟导出
        setTimeout(() => {
          ElMessage.success('报表导出成功')
          loading.value = false
        }, 1000)
      }).catch(() => {})
    }

    // 刷新数据
    const refreshData = () => {
      loadData()
      updateCharts()
      ElMessage.success('数据已刷新')
    }

    // 更新图表
    const updateCharts = () => {
      // 这里应该使用真实的图表库，如 ECharts
      ElMessage.info('图表数据已更新')
    }

    // 加载数据
    const loadData = () => {
      loading.value = true
      // 模拟API调用延迟
      setTimeout(() => {
        // 模拟数据
        const mockData = [
          {
            id: 1,
            supplierName: '北京科技有限公司',
            supplierType: 'direct',
            responsiblePerson: '张三',
            creditLimit: 1000000.00,
            currentBalance: 150000.00,
            days0To30: 50000.00,
            days31To60: 80000.00,
            days61To90: 20000.00,
            days91To180: 0,
            daysOver180: 0,
            overdueDays: 45,
            agingLevel: 'warning',
            riskLevel: 'medium'
          },
          {
            id: 2,
            supplierName: '上海贸易公司',
            supplierType: 'distributor',
            responsiblePerson: '李四',
            creditLimit: 800000.00,
            currentBalance: 280000.00,
            days0To30: 100000.00,
            days31To60: 50000.00,
            days61To90: 70000.00,
            days91To180: 40000.00,
            daysOver180: 20000.00,
            overdueDays: 75,
            agingLevel: 'danger',
            riskLevel: 'high'
          },
          {
            id: 3,
            supplierName: '广州制造有限公司',
            supplierType: 'direct',
            responsiblePerson: '王五',
            creditLimit: 1500000.00,
            currentBalance: 80000.00,
            days0To30: 80000.00,
            days31To60: 0,
            days61To90: 0,
            days91To180: 0,
            daysOver180: 0,
            overdueDays: 0,
            agingLevel: 'normal',
            riskLevel: 'low'
          }
        ]

        agingData.value = mockData
        loading.value = false
        
        // 初始化图表
        nextTick(() => {
          updateCharts()
        })
      }, 500)
    }

    // 生命周期
    onMounted(() => {
      loadData()
    })

    return {
      loading,
      agingData,
      selectedRows,
      searchForm,
      pagination,
      showZeroBalance,
      trendTimeRange,
      agingDistributionChart,
      agingTrendChart,
      supplierTypeChart,
      responsiblePersonChart,
      filteredAgingData,
      totalPayable,
      overdueAmount,
      overdueRate,
      avgAgingDays,
      agingTrend,
      overdueSupplierCount,
      overdueSupplierRate,
      badDebtRiskAmount,
      currentMonthPayment,
      monthPaymentRate,
      formatDate,
      formatCurrency,
      getSupplierTypeTag,
      getSupplierTypeText,
      getOverdueDaysTag,
      getAgingLevelTag,
      getAgingLevelText,
      getRiskLevelTag,
      getRiskLevelText,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      search,
      resetSearch,
      viewSupplierDetails,
      makePayment,
      followUpOverdue,
      exportAnalysis,
      refreshData,
      updateCharts
    }
  }
}
</script>

<style scoped>
.aging-analysis {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-form {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.overview-container {
  margin-bottom: 20px;
}

.overview-card {
  border-radius: 4px;
  overflow: hidden;
}

.overview-content {
  text-align: center;
  padding: 20px 0;
}

.overview-label {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.overview-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.overview-value.primary {
  color: #409eff;
}

.overview-value.success {
  color: #67c23a;
}

.overview-value.warning {
  color: #e6a23c;
}

.overview-value.danger {
  color: #f56c6c;
}

.overview-desc {
  color: #909399;
  font-size: 12px;
}

.chart-container {
  margin-bottom: 20px;
}

.chart-card {
  background: white;
  margin-bottom: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-item {
  height: 300px;
  width: 100%;
}

.data-table-card {
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
  padding: 20px;
  border-top: 1px solid #ebeef5;
}

.text-primary {
  color: #409eff;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}
</style>