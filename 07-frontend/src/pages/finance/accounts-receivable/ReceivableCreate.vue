<template>
  <div class="receivable-create-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>新建应收单</span>
          <el-button @click="handleBack">返回</el-button>
        </div>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <!-- 基本信息 -->
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="应收单号" prop="receivableNo">
              <el-input v-model="form.receivableNo" placeholder="系统自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="业务类型" prop="businessType">
              <el-select v-model="form.businessType" placeholder="请选择业务类型">
                <el-option label="销售应收" value="SALE" />
                <el-option label="服务应收" value="SERVICE" />
                <el-option label="租赁应收" value="LEASE" />
                <el-option label="其他应收" value="OTHER" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="应收日期" prop="receivableDate">
              <el-date-picker
                v-model="form.receivableDate"
                type="date"
                placeholder="选择应收日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="客户名称" prop="customerId">
              <el-select
                v-model="form.customerId"
                filterable
                remote
                placeholder="请选择客户"
                :remote-method="searchCustomer"
                @change="handleCustomerChange"
              >
                <el-option
                  v-for="item in customerList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="到期日期" prop="dueDate">
              <el-date-picker
                v-model="form.dueDate"
                type="date"
                placeholder="选择到期日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="付款条件" prop="paymentTerm">
              <el-select v-model="form.paymentTerm" placeholder="请选择付款条件">
                <el-option label="即期" value="IMMEDIATE" />
                <el-option label="30天" value="NET30" />
                <el-option label="60天" value="NET60" />
                <el-option label="90天" value="NET90" />
                <el-option label="自定义" value="CUSTOM" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="币种" prop="currency">
              <el-select v-model="form.currency" placeholder="请选择币种">
                <el-option label="人民币(CNY)" value="CNY" />
                <el-option label="美元(USD)" value="USD" />
                <el-option label="欧元(EUR)" value="EUR" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="汇率" prop="exchangeRate">
              <el-input-number
                v-model="form.exchangeRate"
                :precision="4"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="关联单据" prop="relatedDocNo">
              <el-input v-model="form.relatedDocNo" placeholder="请输入关联单据号" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 应收明细 -->
        <el-divider content-position="left">应收明细</el-divider>
        <el-table :data="form.items" border class="items-table">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="费用项目" min-width="200">
            <template #default="{ row }">
              <el-select v-model="row.feeType" placeholder="请选择费用项目">
                <el-option label="货款" value="GOODS" />
                <el-option label="服务费" value="SERVICE" />
                <el-option label="运费" value="FREIGHT" />
                <el-option label="其他" value="OTHER" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="费用说明" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.description" placeholder="请输入费用说明" />
            </template>
          </el-table-column>
          <el-table-column label="数量" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.quantity"
                :min="0"
                :precision="2"
                @change="calculateItemAmount(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="140">
            <template #default="{ row }">
              <el-input-number
                v-model="row.unitPrice"
                :min="0"
                :precision="2"
                @change="calculateItemAmount(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="金额" width="140" align="right">
            <template #default="{ row }">
              <span class="amount-text">{{ formatAmount(row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="税率(%)" width="100">
            <template #default="{ row }">
              <el-input-number
                v-model="row.taxRate"
                :min="0"
                :max="100"
                :precision="2"
                @change="calculateItemAmount(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="税额" width="120" align="right">
            <template #default="{ row }">
              <span class="amount-text">{{ formatAmount(row.taxAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="价税合计" width="140" align="right">
            <template #default="{ row }">
              <span class="amount-text primary">{{ formatAmount(row.totalAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ $index }">
              <el-button link type="danger" size="small" @click="removeItem($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="table-footer">
          <el-button :icon="Plus" @click="addItem">添加明细</el-button>
          <div class="total-info">
            <div class="total-item">
              <span>合计金额:</span>
              <span class="total-value">¥{{ formatAmount(totalAmount) }}</span>
            </div>
            <div class="total-item">
              <span>合计税额:</span>
              <span class="total-value">¥{{ formatAmount(totalTaxAmount) }}</span>
            </div>
            <div class="total-item">
              <span>价税合计:</span>
              <span class="total-value primary">¥{{ formatAmount(totalWithTax) }}</span>
            </div>
          </div>
        </div>

        <!-- 收款计划 -->
        <el-divider content-position="left">收款计划</el-divider>
        <el-table :data="form.collectionPlan" border class="plan-table">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="计划收款日期" width="200">
            <template #default="{ row }">
              <el-date-picker
                v-model="row.planDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="计划收款金额" width="200">
            <template #default="{ row }">
              <el-input-number
                v-model="row.planAmount"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="收款方式" width="180">
            <template #default="{ row }">
              <el-select v-model="row.paymentMethod" placeholder="请选择">
                <el-option label="银行转账" value="BANK" />
                <el-option label="现金" value="CASH" />
                <el-option label="支票" value="CHECK" />
                <el-option label="承兑汇票" value="ACCEPTANCE" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.remark" placeholder="请输入备注" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ $index }">
              <el-button link type="danger" size="small" @click="removePlan($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="table-footer">
          <el-button :icon="Plus" @click="addPlan">添加计划</el-button>
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

        <!-- 附件上传 -->
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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Upload } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref(null)

// 表单数据
const form = reactive({
  receivableNo: '',
  businessType: '',
  receivableDate: new Date(),
  customerId: '',
  customerName: '',
  dueDate: '',
  paymentTerm: 'NET30',
  currency: 'CNY',
  exchangeRate: 1,
  relatedDocNo: '',
  items: [
    {
      feeType: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      taxRate: 13,
      taxAmount: 0,
      totalAmount: 0
    }
  ],
  collectionPlan: [],
  remark: '',
  attachments: []
})

// 客户列表
const customerList = ref([])

// 表单验证规则
const rules = {
  businessType: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
  receivableDate: [{ required: true, message: '请选择应收日期', trigger: 'change' }],
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  dueDate: [{ required: true, message: '请选择到期日期', trigger: 'change' }],
  currency: [{ required: true, message: '请选择币种', trigger: 'change' }]
}

// 计算合计金额
const totalAmount = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.amount || 0), 0)
})

const totalTaxAmount = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0)
})

const totalWithTax = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
})

// 搜索客户
const searchCustomer = async (query) => {
  if (query) {
    // TODO: 调用API搜索客户
    customerList.value = [
      { id: 1, name: '深圳ABC科技有限公司' },
      { id: 2, name: '广州XYZ贸易公司' }
    ]
  }
}

// 客户变更
const handleCustomerChange = (customerId) => {
  const customer = customerList.value.find(c => c.id === customerId)
  if (customer) {
    form.customerName = customer.name
  }
}

// 计算明细行金额
const calculateItemAmount = (row) => {
  row.amount = (row.quantity || 0) * (row.unitPrice || 0)
  row.taxAmount = row.amount * (row.taxRate || 0) / 100
  row.totalAmount = row.amount + row.taxAmount
}

// 添加明细
const addItem = () => {
  form.items.push({
    feeType: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    taxRate: 13,
    taxAmount: 0,
    totalAmount: 0
  })
}

// 删除明细
const removeItem = (index) => {
  if (form.items.length > 1) {
    form.items.splice(index, 1)
  } else {
    ElMessage.warning('至少保留一条明细')
  }
}

// 添加计划
const addPlan = () => {
  form.collectionPlan.push({
    planDate: '',
    planAmount: 0,
    paymentMethod: 'BANK',
    remark: ''
  })
}

// 删除计划
const removePlan = (index) => {
  form.collectionPlan.splice(index, 1)
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
    
    // TODO: 调用API提交
    // await receivableApi.create({ ...form, status: 'PENDING' })
    
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
</script>

<style scoped lang="scss">
.receivable-create-container {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .items-table,
  .plan-table {
    margin-bottom: 10px;
  }

  .table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .total-info {
      display: flex;
      gap: 30px;

      .total-item {
        display: flex;
        align-items: center;
        gap: 10px;

        .total-value {
          font-size: 16px;
          font-weight: bold;
          color: #303133;

          &.primary {
            color: #409eff;
            font-size: 18px;
          }
        }
      }
    }
  }

  .amount-text {
    font-weight: 500;

    &.primary {
      color: #409eff;
    }
  }
}
</style>
