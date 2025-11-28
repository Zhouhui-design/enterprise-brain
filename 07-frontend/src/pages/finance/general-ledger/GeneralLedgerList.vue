<template>
  <div class="general-ledger-list-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>总账列表</span>
          <div>
            <el-button type="primary" :icon="Plus" @click="handleCreate">新建总账</el-button>
            <el-button type="success" :icon="Upload">导入</el-button>
            <el-button type="warning" :icon="Download" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="会计期间">
          <el-date-picker
            v-model="searchForm.period"
            type="month"
            placeholder="选择月份"
          />
        </el-form-item>
        <el-form-item label="科目名称">
          <el-input v-model="searchForm.subjectName" placeholder="请输入科目名称" clearable />
        </el-form-item>
        <el-form-item label="科目编码">
          <el-input v-model="searchForm.subjectCode" placeholder="请输入科目编码" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="待审核" value="pending" />
            <el-option label="已审核" value="approved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="资产总额" :value="stats.totalAssets" prefix="¥" :precision="2" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="负债总额" :value="stats.totalLiabilities" prefix="¥" :precision="2" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="所有者权益" :value="stats.totalEquity" prefix="¥" :precision="2" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="本期利润" :value="stats.currentProfit" prefix="¥" :precision="2" />
          </el-card>
        </el-col>
      </el-row>

      <!-- 总账列表 -->
      <el-table
        :data="ledgerList"
        border
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="period" label="会计期间" width="120" />
        <el-table-column prop="subjectCode" label="科目编码" width="120" />
        <el-table-column prop="subjectName" label="科目名称" width="180" />
        <el-table-column label="期初余额" align="right" width="150">
          <template #default="scope">
            <span :class="getAmountClass(scope.row.openingBalance)">
              {{ formatAmount(scope.row.openingBalance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="本期借方" align="right" width="150">
          <template #default="scope">
            <span class="text-success">{{ formatAmount(scope.row.debitAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="本期贷方" align="right" width="150">
          <template #default="scope">
            <span class="text-danger">{{ formatAmount(scope.row.creditAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="期末余额" align="right" width="150">
          <template #default="scope">
            <span :class="getAmountClass(scope.row.closingBalance)" class="font-bold">
              {{ formatAmount(scope.row.closingBalance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="余额方向" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.balanceDirection === 'debit' ? 'success' : 'danger'" size="small">
              {{ scope.row.balanceDirection === 'debit' ? '借' : '贷' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="viewDetail(scope.row)">
              详情
            </el-button>
            <el-button type="success" size="small" link @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              type="warning"
              size="small"
              link
              @click="handleApprove(scope.row)"
            >
              审批
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadLedgerList"
        @current-change="loadLedgerList"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Upload, Download, Search, Refresh } from '@element-plus/icons-vue'
import { generalLedgerApi } from '@/api/finance'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const ledgerList = ref([])
const selectedRows = ref([])
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

const stats = reactive({
  totalAssets: 0,
  totalLiabilities: 0,
  totalEquity: 0,
  currentProfit: 0
})

const searchForm = reactive({
  period: '',
  subjectName: '',
  subjectCode: '',
  status: ''
})

const loadLedgerList = async () => {
  loading.value = true
  try {
    const res = await generalLedgerApi.getGeneralLedgerList({
      ...searchForm,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    ledgerList.value = res.data?.records || mockData()
    total.value = res.data?.total || 50
    updateStats()
  } catch (error) {
    ledgerList.value = mockData()
    total.value = 50
    updateStats()
  } finally {
    loading.value = false
  }
}

const updateStats = () => {
  stats.totalAssets = 5000000
  stats.totalLiabilities = 2000000
  stats.totalEquity = 3000000
  stats.currentProfit = 500000
}

const mockData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    period: '2024-01',
    subjectCode: `${1001 + i}`,
    subjectName: ['库存现金', '银行存款', '应收账款', '存货', '固定资产'][i % 5],
    openingBalance: 100000 + i * 10000,
    debitAmount: 50000 + i * 5000,
    creditAmount: 30000 + i * 3000,
    closingBalance: 120000 + i * 12000,
    balanceDirection: i % 2 === 0 ? 'debit' : 'credit',
    status: ['pending', 'approved', 'rejected'][i % 3]
  }))
}

const handleSearch = () => {
  pageNum.value = 1
  loadLedgerList()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    period: '',
    subjectName: '',
    subjectCode: '',
    status: ''
  })
  handleSearch()
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleCreate = () => {
  router.push('/finance/general-ledger/create')
}

const viewDetail = (row) => {
  router.push({
    path: '/finance/general-ledger/detail',
    query: { id: row.id }
  })
}

const handleEdit = (row) => {
  router.push({
    path: '/finance/general-ledger/edit',
    query: { id: row.id }
  })
}

const handleApprove = (row) => {
  router.push({
    path: '/finance/general-ledger/approve',
    query: { id: row.id }
  })
}

const handleExport = () => {
  ElMessage.success('导出功能开发中...')
}

const formatAmount = (amount) => {
  return `¥${(amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const getAmountClass = (amount) => {
  return amount >= 0 ? 'text-success' : 'text-danger'
}

const getStatusType = (status) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待审核', approved: '已审核', rejected: '已驳回' }
  return map[status] || '未知'
}

onMounted(() => {
  loadLedgerList()
})
</script>

<style scoped>
.general-ledger-list-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

.font-bold {
  font-weight: bold;
}
</style>
