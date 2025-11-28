<template>
  <div class="trial-balance-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>试算平衡表</span>
          <div>
            <el-button type="success" :icon="Download" @click="handleExport">导出</el-button>
            <el-button :icon="Printer" @click="handlePrint">打印</el-button>
          </div>
        </div>
      </template>

      <!-- 查询条件 -->
      <el-form :model="queryForm" :inline="true">
        <el-form-item label="会计期间">
          <el-date-picker v-model="queryForm.period" type="month" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadReport">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 平衡检查提示 -->
      <el-alert
        v-if="!isBalanced"
        type="error"
        title="警告：借贷不平衡！"
        :description="`借贷差额：${formatAmount(Math.abs(balanceDiff))}`"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;"
      />
      <el-alert
        v-else
        type="success"
        title="借贷平衡"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;"
      />

      <!-- 试算平衡表 -->
      <el-table
        :data="reportData"
        border
        v-loading="loading"
        show-summary
        :summary-method="getSummaries"
      >
        <el-table-column prop="subjectCode" label="科目编码" width="120" />
        <el-table-column prop="subjectName" label="科目名称" width="200" />
        <el-table-column label="期初余额" align="right" width="150">
          <template #default="scope">
            <span :class="getAmountClass(scope.row.openingBalance)">
              {{ formatAmount(Math.abs(scope.row.openingBalance)) }}
              <small>{{ scope.row.openingBalance >= 0 ? '借' : '贷' }}</small>
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
              {{ formatAmount(Math.abs(scope.row.closingBalance)) }}
              <small>{{ scope.row.closingBalance >= 0 ? '借' : '贷' }}</small>
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Printer } from '@element-plus/icons-vue'
import { trialBalanceApi } from '@/api/finance'

const loading = ref(false)
const reportData = ref([])

const queryForm = reactive({
  period: new Date()
})

const totalDebit = computed(() => {
  return reportData.value.reduce((sum, item) => sum + item.debitAmount, 0)
})

const totalCredit = computed(() => {
  return reportData.value.reduce((sum, item) => sum + item.creditAmount, 0)
})

const balanceDiff = computed(() => {
  return totalDebit.value - totalCredit.value
})

const isBalanced = computed(() => {
  return Math.abs(balanceDiff.value) < 0.01
})

const loadReport = async () => {
  loading.value = true
  try {
    const res = await trialBalanceApi.getTrialBalance(queryForm)
    reportData.value = res.data || mockData()
  } catch (error) {
    reportData.value = mockData()
  } finally {
    loading.value = false
  }
}

const mockData = () => {
  return [
    {
      subjectCode: '1001',
      subjectName: '库存现金',
      openingBalance: 100000,
      debitAmount: 50000,
      creditAmount: 30000,
      closingBalance: 120000
    },
    {
      subjectCode: '1002',
      subjectName: '银行存款',
      openingBalance: 500000,
      debitAmount: 200000,
      creditAmount: 150000,
      closingBalance: 550000
    },
    {
      subjectCode: '2202',
      subjectName: '应付账款',
      openingBalance: -300000,
      debitAmount: 100000,
      creditAmount: 150000,
      closingBalance: -350000
    }
  ]
}

const getSummaries = (param) => {
  const { columns } = param
  const sums = []
  
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
    } else if (index === 1) {
      sums[index] = ''
    } else if (index === 3) {
      sums[index] = formatAmount(totalDebit.value)
    } else if (index === 4) {
      sums[index] = formatAmount(totalCredit.value)
    } else {
      sums[index] = ''
    }
  })
  
  return sums
}

const formatAmount = (amount) => {
  return `¥${(amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const getAmountClass = (amount) => {
  return amount >= 0 ? 'text-success' : 'text-danger'
}

const handleExport = async () => {
  try {
    await trialBalanceApi.exportTrialBalance(queryForm)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const handlePrint = () => {
  window.print()
}

onMounted(() => {
  loadReport()
})
</script>

<style scoped>
.trial-balance-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
