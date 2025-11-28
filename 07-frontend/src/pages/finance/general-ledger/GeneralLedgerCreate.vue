<template>
  <div class="general-ledger-create-container">
    <el-page-header content="新建总账" @back="$router.back()" />
    
    <el-card class="main-card" shadow="hover">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="会计期间" prop="period">
              <el-date-picker
                v-model="form.period"
                type="month"
                placeholder="选择月份"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="科目" prop="subjectId">
              <el-select v-model="form.subjectId" placeholder="请选择科目" style="width: 100%;">
                <el-option label="1001 - 库存现金" value="1" />
                <el-option label="1002 - 银行存款" value="2" />
                <el-option label="1122 - 应收账款" value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="期初余额" prop="openingBalance">
              <el-input-number
                v-model="form.openingBalance"
                :precision="2"
                :min="0"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="余额方向" prop="balanceDirection">
              <el-radio-group v-model="form.balanceDirection">
                <el-radio label="debit">借方</el-radio>
                <el-radio label="credit">贷方</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">提交</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { generalLedgerApi } from '@/api/finance'
import { useRouter } from 'vue-router'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  period: '',
  subjectId: '',
  openingBalance: 0,
  balanceDirection: 'debit',
  remark: ''
})

const rules = {
  period: [{ required: true, message: '请选择会计期间', trigger: 'change' }],
  subjectId: [{ required: true, message: '请选择科目', trigger: 'change' }],
  openingBalance: [{ required: true, message: '请输入期初余额', trigger: 'blur' }]
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    await generalLedgerApi.createGeneralLedger(form)
    ElMessage.success('创建成功')
    router.push('/finance/general-ledger/list')
  } catch (error) {
    if (error !== false) {
      ElMessage.error('创建失败')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.general-ledger-create-container {
  padding: 20px;
}

.main-card {
  margin-top: 20px;
}
</style>
