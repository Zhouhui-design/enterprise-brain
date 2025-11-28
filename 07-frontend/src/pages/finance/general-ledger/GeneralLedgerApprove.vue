<template>
  <div class="general-ledger-approve-container">
    <el-page-header content="总账审批" @back="$router.back()" />
    
    <el-card class="main-card" shadow="hover" v-loading="loading">
      <!-- 总账信息展示 -->
      <el-descriptions :column="2" border title="总账信息">
        <el-descriptions-item label="会计期间">{{ ledger.period }}</el-descriptions-item>
        <el-descriptions-item label="科目">{{ ledger.subjectName }}</el-descriptions-item>
        <el-descriptions-item label="期初余额">
          {{ formatAmount(ledger.openingBalance) }}
        </el-descriptions-item>
        <el-descriptions-item label="余额方向">
          <el-tag :type="ledger.balanceDirection === 'debit' ? 'success' : 'danger'">
            {{ ledger.balanceDirection === 'debit' ? '借方' : '贷方' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="本期借方">
          {{ formatAmount(ledger.debitAmount) }}
        </el-descriptions-item>
        <el-descriptions-item label="本期贷方">
          {{ formatAmount(ledger.creditAmount) }}
        </el-descriptions-item>
        <el-descriptions-item label="期末余额">
          {{ formatAmount(ledger.closingBalance) }}
        </el-descriptions-item>
        <el-descriptions-item label="创建人">
          {{ ledger.createBy }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 审批表单 -->
      <el-divider />
      <el-form :model="approveForm" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="审批结果" prop="result">
          <el-radio-group v-model="approveForm.result">
            <el-radio label="approved">通过</el-radio>
            <el-radio label="rejected">驳回</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="审批意见" prop="comment">
          <el-input
            v-model="approveForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入审批意见"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitApprove" :loading="submitting">提交审批</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { generalLedgerApi } from '@/api/finance'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)

const ledger = ref({})
const approveForm = reactive({
  id: null,
  result: 'approved',
  comment: ''
})

const rules = {
  result: [{ required: true, message: '请选择审批结果', trigger: 'change' }],
  comment: [{ required: true, message: '请输入审批意见', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await generalLedgerApi.getGeneralLedgerDetail(route.query.id)
    ledger.value = res.data || mockData()
    approveForm.id = ledger.value.id
  } catch (error) {
    ledger.value = mockData()
    approveForm.id = ledger.value.id
  } finally {
    loading.value = false
  }
}

const mockData = () => ({
  id: 1,
  period: '2024-01',
  subjectName: '1001 - 库存现金',
  openingBalance: 100000,
  debitAmount: 50000,
  creditAmount: 30000,
  closingBalance: 120000,
  balanceDirection: 'debit',
  createBy: '张三'
})

const submitApprove = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    await generalLedgerApi.approveGeneralLedger(approveForm)
    ElMessage.success('审批成功')
    router.push('/finance/general-ledger/list')
  } catch (error) {
    if (error !== false) {
      ElMessage.error('审批失败')
    }
  } finally {
    submitting.value = false
  }
}

const formatAmount = (amount) => {
  return `¥${(amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.general-ledger-approve-container {
  padding: 20px;
}

.main-card {
  margin-top: 20px;
}
</style>
