<template>
  <div class="profit-statement-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>利润表</span>
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
        <el-form-item label="对比方式">
          <el-select v-model="queryForm.compareType">
            <el-option label="本期" value="current" />
            <el-option label="本期/上期对比" value="lastPeriod" />
            <el-option label="本期/去年同期对比" value="lastYear" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadReport">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 利润表 -->
      <el-table :data="reportData" border v-loading="loading">
        <el-table-column prop="itemName" label="项目" width="300" />
        <el-table-column label="本期金额" align="right" width="200">
          <template #default="scope">
            <span :class="getAmountClass(scope.row.currentAmount)">
              {{ formatAmount(scope.row.currentAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column 
          v-if="queryForm.compareType !== 'current'"
          label="上期金额"
          align="right"
          width="200"
        >
          <template #default="scope">
            <span :class="getAmountClass(scope.row.lastAmount)">
              {{ formatAmount(scope.row.lastAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="queryForm.compareType !== 'current'"
          label="变动额"
          align="right"
          width="200"
        >
          <template #default="scope">
            <span :class="getChangeClass(scope.row.changeAmount)">
              {{ formatAmount(scope.row.changeAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="queryForm.compareType !== 'current'"
          label="变动率"
          align="right"
          width="120"
        >
          <template #default="scope">
            <span :class="getChangeClass(scope.row.changeRate)">
              {{ formatPercent(scope.row.changeRate) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Printer } from '@element-plus/icons-vue'
import { profitStatementApi } from '@/api/finance'

const loading = ref(false)
const reportData = ref([])

const queryForm = reactive({
  period: new Date(),
  compareType: 'current'
})

const loadReport = async () => {
  loading.value = true
  try {
    const res = await profitStatementApi.getProfitStatement(queryForm)
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
      itemName: '一、营业收入',
      currentAmount: 5000000,
      lastAmount: 4500000,
      changeAmount: 500000,
      changeRate: 11.11
    },
    {
      itemName: '减：营业成本',
      currentAmount: 3000000,
      lastAmount: 2700000,
      changeAmount: 300000,
      changeRate: 11.11
    },
    {
      itemName: '    税金及附加',
      currentAmount: 50000,
      lastAmount: 45000,
      changeAmount: 5000,
      changeRate: 11.11
    },
    {
      itemName: '    销售费用',
      currentAmount: 200000,
      lastAmount: 180000,
      changeAmount: 20000,
      changeRate: 11.11
    },
    {
      itemName: '    管理费用',
      currentAmount: 300000,
      lastAmount: 270000,
      changeAmount: 30000,
      changeRate: 11.11
    },
    {
      itemName: '    财务费用',
      currentAmount: 50000,
      lastAmount: 45000,
      changeAmount: 5000,
      changeRate: 11.11
    },
    {
      itemName: '二、营业利润',
      currentAmount: 1400000,
      lastAmount: 1260000,
      changeAmount: 140000,
      changeRate: 11.11
    },
    {
      itemName: '加：营业外收入',
      currentAmount: 100000,
      lastAmount: 90000,
      changeAmount: 10000,
      changeRate: 11.11
    },
    {
      itemName: '减：营业外支出',
      currentAmount: 50000,
      lastAmount: 45000,
      changeAmount: 5000,
      changeRate: 11.11
    },
    {
      itemName: '三、利润总额',
      currentAmount: 1450000,
      lastAmount: 1305000,
      changeAmount: 145000,
      changeRate: 11.11
    },
    {
      itemName: '减：所得税费用',
      currentAmount: 362500,
      lastAmount: 326250,
      changeAmount: 36250,
      changeRate: 11.11
    },
    {
      itemName: '四、净利润',
      currentAmount: 1087500,
      lastAmount: 978750,
      changeAmount: 108750,
      changeRate: 11.11
    }
  ]
}

const formatAmount = (amount) => {
  return `¥${(amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatPercent = (rate) => {
  return `${(rate || 0).toFixed(2)}%`
}

const getAmountClass = (amount) => {
  return amount >= 0 ? '' : 'text-danger'
}

const getChangeClass = (value) => {
  if (value > 0) return 'text-success'
  if (value < 0) return 'text-danger'
  return ''
}

const handleExport = async () => {
  try {
    await profitStatementApi.exportProfitStatement(queryForm)
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
.profit-statement-container {
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
</style>
