<template>
  <div class="general-ledger-edit-container">
    <el-page-header content="编辑总账" @back="$router.back()" />
    
    <el-card class="main-card" shadow="hover" v-loading="loading">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="会计期间" prop="period">
              <el-date-picker
                v-model="form.period"
                type="month"
                placeholder="选择月份"
                style="width: 100%;"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="科目">
              <el-input v-model="form.subjectName" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="期初余额" prop="openingBalance">
              <el-input-number
                v-model="form.openingBalance"
                :precision="2"
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
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
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

const form = reactive({
  id: null,
  period: '',
  subjectName: '',
  openingBalance: 0,
  balanceDirection: 'debit',
  remark: ''
})

const rules = {
  openingBalance: [{ required: true, message: '请输入期初余额', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await generalLedgerApi.getGeneralLedgerDetail(route.query.id)
    Object.assign(form, res.data || {
      id: 1,
      period: '2024-01',
      subjectName: '1001 - 库存现金',
      openingBalance: 100000,
      balanceDirection: 'debit',
      remark: ''
    })
  } catch (error) {
    Object.assign(form, {
      id: 1,
      period: '2024-01',
      subjectName: '1001 - 库存现金',
      openingBalance: 100000,
      balanceDirection: 'debit',
      remark: ''
    })
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    await generalLedgerApi.updateGeneralLedger(form)
    ElMessage.success('保存成功')
    router.push('/finance/general-ledger/list')
  } catch (error) {
    if (error !== false) {
      ElMessage.error('保存失败')
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.general-ledger-edit-container {
  padding: 20px;
}

.main-card {
  margin-top: 20px;
}
</style>
