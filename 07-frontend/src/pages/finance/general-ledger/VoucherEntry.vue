<template>
  <div class="voucher-entry-container">
    <el-page-header content="凭证录入" @back="$router.back()" />
    
    <el-card class="main-card" shadow="hover">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="凭证字号" prop="voucherType">
              <el-select v-model="form.voucherType" placeholder="请选择">
                <el-option label="记" value="JZ" />
                <el-option label="收" value="SZ" />
                <el-option label="付" value="FZ" />
                <el-option label="转" value="ZZ" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="凭证日期" prop="voucherDate">
              <el-date-picker v-model="form.voucherDate" type="date" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="附件数">
              <el-input-number v-model="form.attachmentCount" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 凭证分录 -->
        <el-divider content-position="left">凭证分录</el-divider>
        <el-table :data="form.entries" border class="entry-table">
          <el-table-column label="摘要" min-width="200">
            <template #default="scope">
              <el-input v-model="scope.row.summary" placeholder="请输入摘要" />
            </template>
          </el-table-column>
          <el-table-column label="会计科目" width="250">
            <template #default="scope">
              <el-select v-model="scope.row.subjectId" placeholder="请选择科目" style="width: 100%;">
                <el-option label="1001 - 库存现金" value="1" />
                <el-option label="1002 - 银行存款" value="2" />
                <el-option label="1122 - 应收账款" value="3" />
                <el-option label="2202 - 应付账款" value="4" />
                <el-option label="6001 - 主营业务收入" value="5" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="借方金额" width="150" align="right">
            <template #default="scope">
              <el-input-number
                v-model="scope.row.debitAmount"
                :precision="2"
                :min="0"
                placeholder="0.00"
                style="width: 100%;"
                @input="calculateTotal"
              />
            </template>
          </el-table-column>
          <el-table-column label="贷方金额" width="150" align="right">
            <template #default="scope">
              <el-input-number
                v-model="scope.row.creditAmount"
                :precision="2"
                :min="0"
                placeholder="0.00"
                style="width: 100%;"
                @input="calculateTotal"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="scope">
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                link
                @click="removeEntry(scope.$index)"
                :disabled="form.entries.length <= 2"
              />
            </template>
          </el-table-column>
        </el-table>

        <div class="entry-actions">
          <el-button :icon="Plus" @click="addEntry">添加分录</el-button>
        </div>

        <!-- 合计 -->
        <el-row :gutter="20" class="total-row">
          <el-col :span="12" :offset="12">
            <div class="total-info">
              <span>借方合计：<strong :class="{'text-danger': !isBalanced}">¥{{ totalDebit.toFixed(2) }}</strong></span>
              <span>贷方合计：<strong :class="{'text-danger': !isBalanced}">¥{{ totalCredit.toFixed(2) }}</strong></span>
              <el-tag :type="isBalanced ? 'success' : 'danger'">
                {{ isBalanced ? '平衡' : '不平衡' }}
              </el-tag>
            </div>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting" :disabled="!isBalanced">
            保存凭证
          </el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { voucherApi } from '@/api/finance'
import { useRouter } from 'vue-router'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  voucherType: 'JZ',
  voucherDate: new Date(),
  attachmentCount: 0,
  entries: [
    { summary: '', subjectId: '', debitAmount: 0, creditAmount: 0 },
    { summary: '', subjectId: '', debitAmount: 0, creditAmount: 0 }
  ]
})

const rules = {
  voucherType: [{ required: true, message: '请选择凭证字号', trigger: 'change' }],
  voucherDate: [{ required: true, message: '请选择凭证日期', trigger: 'change' }]
}

const totalDebit = computed(() => {
  return form.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0)
})

const totalCredit = computed(() => {
  return form.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0)
})

const isBalanced = computed(() => {
  return Math.abs(totalDebit.value - totalCredit.value) < 0.01 && totalDebit.value > 0
})

const addEntry = () => {
  form.entries.push({ summary: '', subjectId: '', debitAmount: 0, creditAmount: 0 })
}

const removeEntry = (index) => {
  form.entries.splice(index, 1)
}

const calculateTotal = () => {
  // 自动触发计算
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    if (!isBalanced.value) {
      ElMessage.error('借贷不平衡，无法保存')
      return
    }
    submitting.value = true
    await voucherApi.createVoucher(form)
    ElMessage.success('凭证保存成功')
    router.push('/finance/general-ledger/voucher-review')
  } catch (error) {
    if (error !== false) {
      ElMessage.error('保存失败')
    }
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  form.entries = [
    { summary: '', subjectId: '', debitAmount: 0, creditAmount: 0 },
    { summary: '', subjectId: '', debitAmount: 0, creditAmount: 0 }
  ]
}
</script>

<style scoped>
.voucher-entry-container {
  padding: 20px;
}

.main-card {
  margin-top: 20px;
}

.entry-table {
  margin-bottom: 20px;
}

.entry-actions {
  margin-bottom: 20px;
}

.total-row {
  margin-bottom: 20px;
}

.total-info {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.total-info span {
  font-size: 16px;
}

.text-danger {
  color: #f56c6c;
}
</style>
