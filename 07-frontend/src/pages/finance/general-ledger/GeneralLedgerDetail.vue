<template>
  <div class="general-ledger-detail-container">
    <el-page-header content="总账详情" @back="$router.back()" />
    
    <el-card class="main-card" shadow="hover" v-loading="loading">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="会计期间">{{ ledger.period }}</el-descriptions-item>
        <el-descriptions-item label="科目编码">{{ ledger.subjectCode }}</el-descriptions-item>
        <el-descriptions-item label="科目名称" :span="2">{{ ledger.subjectName }}</el-descriptions-item>
        
        <el-descriptions-item label="期初余额">
          <span :class="getAmountClass(ledger.openingBalance)">
            {{ formatAmount(ledger.openingBalance) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="余额方向">
          <el-tag :type="ledger.balanceDirection === 'debit' ? 'success' : 'danger'">
            {{ ledger.balanceDirection === 'debit' ? '借方' : '贷方' }}
          </el-tag>
        </el-descriptions-item>
        
        <el-descriptions-item label="本期借方发生额">
          <span class="text-success">{{ formatAmount(ledger.debitAmount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="本期贷方发生额">
          <span class="text-danger">{{ formatAmount(ledger.creditAmount) }}</span>
        </el-descriptions-item>
        
        <el-descriptions-item label="期末余额">
          <span :class="getAmountClass(ledger.closingBalance)" class="font-bold">
            {{ formatAmount(ledger.closingBalance) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(ledger.status)">
            {{ getStatusText(ledger.status) }}
          </el-tag>
        </el-descriptions-item>
        
        <el-descriptions-item label="创建时间">{{ ledger.createTime }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ ledger.createBy }}</el-descriptions-item>
        
        <el-descriptions-item label="备注" :span="2">{{ ledger.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 明细账列表 -->
      <el-divider>明细账</el-divider>
      <el-table :data="detailList" border>
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="voucherNo" label="凭证号" width="120" />
        <el-table-column prop="voucherDate" label="日期" width="120" />
        <el-table-column prop="summary" label="摘要" min-width="200" />
        <el-table-column label="借方金额" align="right" width="150">
          <template #default="scope">
            <span v-if="scope.row.debitAmount > 0" class="text-success">
              {{ formatAmount(scope.row.debitAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="贷方金额" align="right" width="150">
          <template #default="scope">
            <span v-if="scope.row.creditAmount > 0" class="text-danger">
              {{ formatAmount(scope.row.creditAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="余额" align="right" width="150">
          <template #default="scope">
            <span :class="getAmountClass(scope.row.balance)">
              {{ formatAmount(scope.row.balance) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { generalLedgerApi } from '@/api/finance'

const route = useRoute()
const loading = ref(false)
const ledger = ref({})
const detailList = ref([])

const loadDetail = async () => {
  loading.value = true
  try {
    const res = await generalLedgerApi.getGeneralLedgerDetail(route.query.id)
    ledger.value = res.data || mockLedgerData()
    detailList.value = mockDetailData()
  } catch (error) {
    ledger.value = mockLedgerData()
    detailList.value = mockDetailData()
  } finally {
    loading.value = false
  }
}

const mockLedgerData = () => ({
  period: '2024-01',
  subjectCode: '1001',
  subjectName: '库存现金',
  openingBalance: 100000,
  debitAmount: 50000,
  creditAmount: 30000,
  closingBalance: 120000,
  balanceDirection: 'debit',
  status: 'approved',
  createTime: '2024-01-15 10:00:00',
  createBy: '张三',
  remark: ''
})

const mockDetailData = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    voucherNo: `JZ202401${String(i + 1).padStart(3, '0')}`,
    voucherDate: '2024-01-15',
    summary: `业务摘要${i + 1}`,
    debitAmount: i % 2 === 0 ? 5000 : 0,
    creditAmount: i % 2 === 1 ? 3000 : 0,
    balance: 100000 + (i + 1) * 2000
  }))
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
  loadDetail()
})
</script>

<style scoped>
.general-ledger-detail-container {
  padding: 20px;
}

.main-card {
  margin-top: 20px;
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
