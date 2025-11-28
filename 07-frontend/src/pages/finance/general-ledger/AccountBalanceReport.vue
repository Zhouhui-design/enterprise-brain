<template>
  <div class="account-balance-report-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>科目余额表</span>
          <div>
            <el-button type="success" :icon="Download" @click="handleExport">导出</el-button>
            <el-button :icon="Printer" @click="handlePrint">打印</el-button>
          </div>
        </div>
      </template>

      <!-- 查询条件 -->
      <el-form :model="queryForm" :inline="true">
        <el-form-item label="会计期间">
          <el-date-picker
            v-model="queryForm.period"
            type="month"
            placeholder="选择月份"
          />
        </el-form-item>
        <el-form-item label="科目级次">
          <el-select v-model="queryForm.level">
            <el-option label="全部" value="" />
            <el-option label="一级科目" value="1" />
            <el-option label="二级科目" value="2" />
            <el-option label="三级科目" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="显示零余额">
          <el-switch v-model="queryForm.showZero" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadReport">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 科目余额表 -->
      <el-table
        :data="reportData"
        border
        v-loading="loading"
        show-summary
        :summary-method="getSummaries"
        style="margin-top: 20px;"
      >
        <el-table-column prop="subjectCode" label="科目编码" width="120" fixed />
        <el-table-column prop="subjectName" label="科目名称" width="180" fixed />
        <el-table-column label="期初余额" align="center">
          <el-table-column label="借方" align="right" width="150">
            <template #default="scope">
              <span v-if="scope.row.openingDebit > 0">
                {{ formatAmount(scope.row.openingDebit) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="贷方" align="right" width="150">
            <template #default="scope">
              <span v-if="scope.row.openingCredit > 0">
                {{ formatAmount(scope.row.openingCredit) }}
              </span>
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="本期发生额" align="center">
          <el-table-column label="借方" align="right" width="150">
            <template #default="scope">
              {{ formatAmount(scope.row.currentDebit) }}
            </template>
          </el-table-column>
          <el-table-column label="贷方" align="right" width="150">
            <template #default="scope">
              {{ formatAmount(scope.row.currentCredit) }}
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="本年累计" align="center">
          <el-table-column label="借方" align="right" width="150">
            <template #default="scope">
              {{ formatAmount(scope.row.yearDebit) }}
            </template>
          </el-table-column>
          <el-table-column label="贷方" align="right" width="150">
            <template #default="scope">
              {{ formatAmount(scope.row.yearCredit) }}
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="期末余额" align="center">
          <el-table-column label="借方" align="right" width="150">
            <template #default="scope">
              <span v-if="scope.row.closingDebit > 0" class="font-bold">
                {{ formatAmount(scope.row.closingDebit) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="贷方" align="right" width="150">
            <template #default="scope">
              <span v-if="scope.row.closingCredit > 0" class="font-bold">
                {{ formatAmount(scope.row.closingCredit) }}
              </span>
            </template>
          </el-table-column>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Printer } from '@element-plus/icons-vue'
import { accountBalanceApi } from '@/api/finance'

const loading = ref(false)
const reportData = ref([])

const queryForm = reactive({
  period: new Date(),
  level: '',
  showZero: false
})

const loadReport = async () => {
  loading.value = true
  try {
    const res = await accountBalanceApi.getAccountBalanceReport(queryForm)
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
      openingDebit: 100000,
      openingCredit: 0,
      currentDebit: 50000,
      currentCredit: 30000,
      yearDebit: 200000,
      yearCredit: 150000,
      closingDebit: 120000,
      closingCredit: 0
    },
    {
      subjectCode: '1002',
      subjectName: '银行存款',
      openingDebit: 500000,
      openingCredit: 0,
      currentDebit: 200000,
      currentCredit: 150000,
      yearDebit: 800000,
      yearCredit: 600000,
      closingDebit: 550000,
      closingCredit: 0
    }
  ]
}

const getSummaries = (param) => {
  const { columns, data } = param
  const sums = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    if (index === 1) {
      sums[index] = ''
      return
    }
    
    const values = data.map(item => {
      const prop = column.property
      return Number(item[prop])
    })
    
    if (!values.every(value => isNaN(value))) {
      const sum = values.reduce((prev, curr) => {
        const value = Number(curr)
        if (!isNaN(value)) {
          return prev + value
        } else {
          return prev
        }
      }, 0)
      sums[index] = formatAmount(sum)
    } else {
      sums[index] = ''
    }
  })
  
  return sums
}

const formatAmount = (amount) => {
  return `¥${(amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const handleExport = async () => {
  try {
    await accountBalanceApi.exportAccountBalance(queryForm)
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
.account-balance-report-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.font-bold {
  font-weight: bold;
}
</style>
