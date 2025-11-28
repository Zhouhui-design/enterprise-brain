<template>
  <div class="collection-application-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>收款申请</span>
          <el-button @click="handleBack">返回</el-button>
        </div>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <!-- 应收单信息 -->
        <el-divider content-position="left">应收单信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="应收单号" prop="receivableId">
              <el-select
                v-model="form.receivableId"
                filterable
                placeholder="请选择应收单"
                @change="handleReceivableChange"
                style="width: 100%"
              >
                <el-option
                  v-for="item in receivableList"
                  :key="item.id"
                  :label="item.receivableNo"
                  :value="item.id"
                >
                  <div class="receivable-option">
                    <span>{{ item.receivableNo }}</span>
                    <span class="customer-name">{{ item.customerName }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="客户名称">
              <el-input v-model="receivableInfo.customerName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="应收总额">
              <el-input v-model="receivableInfo.totalAmount" disabled>
                <template #prepend>¥</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="已收金额">
              <el-input v-model="receivableInfo.receivedAmount" disabled>
                <template #prepend>¥</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="未收金额">
              <el-input v-model="receivableInfo.unreceiveAmount" disabled>
                <template #prepend>¥</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="到期日期">
              <el-input v-model="receivableInfo.dueDate" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 收款信息 -->
        <el-divider content-position="left">收款信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="收款日期" prop="collectionDate">
              <el-date-picker
                v-model="form.collectionDate"
                type="date"
                placeholder="选择收款日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="收款金额" prop="collectionAmount">
              <el-input-number
                v-model="form.collectionAmount"
                :min="0"
                :max="parseFloat(receivableInfo.unreceiveAmount)"
                :precision="2"
                style="width: 100%"
                @change="handleAmountChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="收款方式" prop="paymentMethod">
              <el-select v-model="form.paymentMethod" placeholder="请选择收款方式" style="width: 100%">
                <el-option label="银行转账" value="BANK" />
                <el-option label="现金" value="CASH" />
                <el-option label="支票" value="CHECK" />
                <el-option label="承兑汇票" value="ACCEPTANCE" />
                <el-option label="其他" value="OTHER" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 银行信息 -->
        <el-row :gutter="20" v-if="form.paymentMethod === 'BANK'">
          <el-col :span="8">
            <el-form-item label="收款账户" prop="bankAccount">
              <el-select v-model="form.bankAccount" placeholder="请选择收款账户" style="width: 100%">
                <el-option
                  v-for="item in bankAccountList"
                  :key="item.id"
                  :label="`${item.bankName} - ${item.accountNo}`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="交易流水号" prop="transactionNo">
              <el-input v-model="form.transactionNo" placeholder="请输入交易流水号" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="付款账户" prop="payerAccount">
              <el-input v-model="form.payerAccount" placeholder="请输入付款账户" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 票据信息 -->
        <el-row :gutter="20" v-if="['CHECK', 'ACCEPTANCE'].includes(form.paymentMethod)">
          <el-col :span="8">
            <el-form-item label="票据号码" prop="billNo">
              <el-input v-model="form.billNo" placeholder="请输入票据号码" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="票据到期日" prop="billDueDate">
              <el-date-picker
                v-model="form.billDueDate"
                type="date"
                placeholder="选择到期日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="出票人" prop="billDrawer">
              <el-input v-model="form.billDrawer" placeholder="请输入出票人" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 优惠折扣 -->
        <el-divider content-position="left">优惠信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="现金折扣">
              <el-input-number
                v-model="form.cashDiscount"
                :min="0"
                :precision="2"
                style="width: 100%"
                @change="calculateActualAmount"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="其他优惠">
              <el-input-number
                v-model="form.otherDiscount"
                :min="0"
                :precision="2"
                style="width: 100%"
                @change="calculateActualAmount"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="实际到账金额">
              <el-input v-model="actualAmount" disabled>
                <template #prepend>¥</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 核销明细 -->
        <el-divider content-position="left">核销明细</el-divider>
        <el-alert
          title="提示"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 15px"
        >
          <div>收款金额: ¥{{ formatAmount(form.collectionAmount) }}</div>
          <div>待核销金额: ¥{{ formatAmount(unverifiedAmount) }}</div>
        </el-alert>

        <el-table :data="form.verificationItems" border>
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="核销项目" min-width="150">
            <template #default="{ row }">
              <el-select v-model="row.itemType" placeholder="请选择">
                <el-option label="货款" value="GOODS" />
                <el-option label="服务费" value="SERVICE" />
                <el-option label="运费" value="FREIGHT" />
                <el-option label="其他" value="OTHER" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="核销金额" width="200">
            <template #default="{ row }">
              <el-input-number
                v-model="row.amount"
                :min="0"
                :precision="2"
                style="width: 100%"
                @change="calculateUnverified"
              />
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.remark" placeholder="请输入备注" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ $index }">
              <el-button link type="danger" size="small" @click="removeVerification($index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="table-footer">
          <el-button :icon="Plus" @click="addVerification">添加核销项</el-button>
        </div>

        <!-- 其他信息 -->
        <el-divider content-position="left">其他信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="form.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注信息"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 附件 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="附件">
              <el-upload
                action="/api/upload"
                :file-list="form.attachments"
                :on-success="handleUploadSuccess"
                :on-remove="handleRemoveAttachment"
              >
                <el-button :icon="Upload">上传附件</el-button>
                <template #tip>
                  <div class="el-upload__tip">请上传收款凭证、银行回单等相关附件</div>
                </template>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">提交审核</el-button>
          <el-button @click="handleSaveDraft">保存草稿</el-button>
          <el-button @click="handleBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Upload } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)

// 表单数据
const form = reactive({
  receivableId: '',
  collectionDate: new Date(),
  collectionAmount: 0,
  paymentMethod: 'BANK',
  bankAccount: '',
  transactionNo: '',
  payerAccount: '',
  billNo: '',
  billDueDate: '',
  billDrawer: '',
  cashDiscount: 0,
  otherDiscount: 0,
  verificationItems: [
    { itemType: 'GOODS', amount: 0, remark: '' }
  ],
  remark: '',
  attachments: []
})

// 应收单信息
const receivableInfo = reactive({
  customerName: '',
  totalAmount: '0.00',
  receivedAmount: '0.00',
  unreceiveAmount: '0.00',
  dueDate: ''
})

// 应收单列表
const receivableList = ref([
  {
    id: 1,
    receivableNo: 'AR202311280001',
    customerName: '深圳ABC科技有限公司',
    totalAmount: 100000,
    receivedAmount: 50000,
    unreceiveAmount: 50000,
    dueDate: '2023-12-28'
  },
  {
    id: 2,
    receivableNo: 'AR202311280002',
    customerName: '广州XYZ贸易公司',
    totalAmount: 80000,
    receivedAmount: 0,
    unreceiveAmount: 80000,
    dueDate: '2023-11-25'
  }
])

// 银行账户列表
const bankAccountList = ref([
  { id: 1, bankName: '中国工商银行', accountNo: '6222021001234567890' },
  { id: 2, bankName: '中国建设银行', accountNo: '6217001001234567890' }
])

// 表单验证规则
const rules = {
  receivableId: [{ required: true, message: '请选择应收单', trigger: 'change' }],
  collectionDate: [{ required: true, message: '请选择收款日期', trigger: 'change' }],
  collectionAmount: [{ required: true, message: '请输入收款金额', trigger: 'blur' }],
  paymentMethod: [{ required: true, message: '请选择收款方式', trigger: 'change' }]
}

// 实际到账金额
const actualAmount = computed(() => {
  const amount = form.collectionAmount - form.cashDiscount - form.otherDiscount
  return formatAmount(Math.max(0, amount))
})

// 待核销金额
const unverifiedAmount = computed(() => {
  const verified = form.verificationItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  return Math.max(0, form.collectionAmount - verified)
})

// 应收单变更
const handleReceivableChange = (receivableId) => {
  const receivable = receivableList.value.find(r => r.id === receivableId)
  if (receivable) {
    receivableInfo.customerName = receivable.customerName
    receivableInfo.totalAmount = formatAmount(receivable.totalAmount)
    receivableInfo.receivedAmount = formatAmount(receivable.receivedAmount)
    receivableInfo.unreceiveAmount = formatAmount(receivable.unreceiveAmount)
    receivableInfo.dueDate = receivable.dueDate
    
    // 默认收款金额为未收金额
    form.collectionAmount = receivable.unreceiveAmount
  }
}

// 金额变更
const handleAmountChange = () => {
  // 重置核销明细
  if (form.verificationItems.length === 1 && !form.verificationItems[0].amount) {
    form.verificationItems[0].amount = form.collectionAmount
  }
}

// 计算实际到账金额
const calculateActualAmount = () => {
  // 自动计算
}

// 计算待核销金额
const calculateUnverified = () => {
  // 自动计算
}

// 添加核销项
const addVerification = () => {
  form.verificationItems.push({
    itemType: 'GOODS',
    amount: 0,
    remark: ''
  })
}

// 删除核销项
const removeVerification = (index) => {
  if (form.verificationItems.length > 1) {
    form.verificationItems.splice(index, 1)
  } else {
    ElMessage.warning('至少保留一条核销明细')
  }
}

// 上传成功
const handleUploadSuccess = (response, file, fileList) => {
  form.attachments = fileList
  ElMessage.success('上传成功')
}

// 删除附件
const handleRemoveAttachment = (file, fileList) => {
  form.attachments = fileList
}

// 提交审核
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    if (unverifiedAmount.value > 0.01) {
      ElMessage.warning('存在未核销金额，请完成核销')
      return
    }
    
    // TODO: 调用API提交
    // await collectionApi.create({ ...form, status: 'PENDING' })
    
    ElMessage.success('提交成功')
    router.back()
  } catch (error) {
    ElMessage.error('请检查表单填写是否完整')
  }
}

// 保存草稿
const handleSaveDraft = async () => {
  // TODO: 调用API保存草稿
  ElMessage.success('保存草稿成功')
}

// 返回
const handleBack = () => {
  router.back()
}

// 金额格式化
const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 初始化
if (route.query.id) {
  form.receivableId = parseInt(route.query.id)
  handleReceivableChange(form.receivableId)
}
</script>

<style scoped lang="scss">
.collection-application-container {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .receivable-option {
    display: flex;
    justify-content: space-between;

    .customer-name {
      color: #909399;
      font-size: 12px;
    }
  }

  .table-footer {
    margin: 10px 0 20px;
  }

  .el-upload__tip {
    margin-top: 5px;
    color: #909399;
    font-size: 12px;
  }
}
</style>
