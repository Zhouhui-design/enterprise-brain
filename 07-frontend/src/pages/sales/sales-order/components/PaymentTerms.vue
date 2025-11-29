<template>
  <div class="payment-terms">
    <!-- 付款条款头部 -->
    <div class="terms-header">
      <h3>付款条款</h3>
      <div class="header-actions">
        <el-button @click="useTemplate" size="small">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M14 2v6h6" stroke="currentColor" stroke-width="2"/>
          </svg>
          使用模板
        </el-button>
        <el-button @click="saveAsTemplate" size="small">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path d="M8 3a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2V5a2 2 0 00-2-2H8z" stroke="currentColor" stroke-width="2"/>
            <path d="M8 13a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2H8z" stroke="currentColor" stroke-width="2"/>
          </svg>
          保存模板
        </el-button>
      </div>
    </div>

    <!-- 付款方式选择 -->
    <div class="payment-method-section">
      <h4>付款方式</h4>
      <el-radio-group v-model="termsData.paymentMethod" @change="handlePaymentMethodChange">
        <el-radio-button label="full">一次性付款</el-radio-button>
        <el-radio-button label="installment">分期付款</el-radio-button>
        <el-radio-button label="milestone">里程碑付款</el-radio-button>
        <el-radio-button label="deposit">定金+尾款</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 一次性付款 -->
    <div v-if="termsData.paymentMethod === 'full'" class="full-payment">
      <div class="form-grid">
        <el-form-item label="付款期限">
          <el-select v-model="termsData.fullPayment.terms" @change="handleTermsChange">
            <el-option label="预付款" value="advance" />
            <el-option label="货到付款" value="delivery" />
            <el-option label="账期付款" value="credit" />
            <el-option label="验收付款" value="acceptance" />
          </el-select>
        </el-form-item>
        
        <el-form-item v-if="termsData.fullPayment.terms === 'credit'" label="账期天数">
          <el-input-number v-model="termsData.fullPayment.creditDays" :min="0" :max="365" />
        </el-form-item>
        
        <el-form-item v-if="termsData.fullPayment.terms === 'advance'" label="预付比例">
          <el-input v-model="termsData.fullPayment.advancePercent" placeholder="100">
            <template #suffix>%</template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="付款日期">
          <el-date-picker
            v-model="termsData.fullPayment.paymentDate"
            type="date"
            placeholder="选择付款日期"
          />
        </el-form-item>
      </div>
    </div>

    <!-- 分期付款 -->
    <div v-if="termsData.paymentMethod === 'installment'" class="installment-payment">
      <div class="installment-header">
        <h4>分期付款计划</h4>
        <div class="installment-controls">
          <el-form-item label="分期次数">
            <el-input-number 
              v-model="installmentCount" 
              :min="2" 
              :max="24" 
              @change="generateInstallments"
            />
          </el-form-item>
          <el-button @click="generateInstallments" type="primary" size="small">
            生成计划
          </el-button>
        </div>
      </div>
      
      <div class="installments-list">
        <div v-for="(installment, index) in termsData.installments" :key="index" class="installment-item">
          <div class="installment-header-info">
            <h5>第 {{ index + 1 }} 期</h5>
            <el-button @click="removeInstallment(index)" type="danger" size="small" text>
              删除
            </el-button>
          </div>
          
          <div class="installment-form">
            <el-form-item label="付款比例">
              <el-input v-model="installment.percent" @input="calculateInstallmentAmount(index)">
                <template #suffix>%</template>
              </el-input>
            </el-form-item>
            
            <el-form-item label="付款金额">
              <el-input v-model="installment.amount" readonly>
                <template #prefix>¥</template>
              </el-input>
            </el-form-item>
            
            <el-form-item label="付款时间">
              <el-date-picker
                v-model="installment.dueDate"
                type="date"
                placeholder="选择付款时间"
              />
            </el-form-item>
            
            <el-form-item label="付款条件">
              <el-input 
                v-model="installment.condition"
                placeholder="如：合同签订后30天"
              />
            </el-form-item>
          </div>
        </div>
      </div>
      
      <div class="add-installment-btn">
        <el-button @click="addInstallment" type="primary" text>
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          添加期次
        </el-button>
      </div>
    </div>

    <!-- 里程碑付款 -->
    <div v-if="termsData.paymentMethod === 'milestone'" class="milestone-payment">
      <div class="milestone-header">
        <h4>里程碑付款计划</h4>
        <el-button @click="addMilestone" type="primary" size="small">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          添加里程碑
        </el-button>
      </div>
      
      <div class="milestones-list">
        <div v-for="(milestone, index) in termsData.milestones" :key="index" class="milestone-item">
          <div class="milestone-header-info">
            <h5>里程碑 {{ index + 1 }}</h5>
            <el-button @click="removeMilestone(index)" type="danger" size="small" text>
              删除
            </el-button>
          </div>
          
          <div class="milestone-form">
            <el-form-item label="里程碑名称">
              <el-input v-model="milestone.name" placeholder="如：产品交付" />
            </el-form-item>
            
            <el-form-item label="完成标准">
              <el-input
                v-model="milestone.standard"
                type="textarea"
                :rows="2"
                placeholder="描述里程碑的完成标准..."
              />
            </el-form-item>
            
            <el-form-item label="付款比例">
              <el-input v-model="milestone.percent" @input="calculateMilestoneAmount(index)">
                <template #suffix>%</template>
              </el-input>
            </el-form-item>
            
            <el-form-item label="付款金额">
              <el-input v-model="milestone.amount" readonly>
                <template #prefix>¥</template>
              </el-input>
            </el-form-item>
            
            <el-form-item label="预计完成时间">
              <el-date-picker
                v-model="milestone.estimatedDate"
                type="date"
                placeholder="选择预计完成时间"
              />
            </el-form-item>
          </div>
        </div>
      </div>
    </div>

    <!-- 定金+尾款 -->
    <div v-if="termsData.paymentMethod === 'deposit'" class="deposit-payment">
      <div class="form-grid">
        <el-form-item label="定金比例">
          <el-input v-model="termsData.deposit.depositPercent" @input="calculateDepositAmount">
            <template #suffix>%</template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="定金金额">
          <el-input v-model="termsData.deposit.depositAmount" readonly>
            <template #prefix>¥</template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="定金付款时间">
          <el-date-picker
            v-model="termsData.deposit.depositDate"
            type="date"
            placeholder="选择定金付款时间"
          />
        </el-form-item>
        
        <el-form-item label="尾款付款时间">
          <el-date-picker
            v-model="termsData.deposit.finalDate"
            type="date"
            placeholder="选择尾款付款时间"
          />
        </el-form-item>
        
        <el-form-item label="尾款付款条件">
          <el-input 
            v-model="termsData.deposit.finalCondition"
            placeholder="如：验收合格后30天内"
          />
        </el-form-item>
      </div>
    </div>

    <!-- 基础付款信息 -->
    <div class="basic-payment-info">
      <h4>基础信息</h4>
      <div class="form-grid">
        <el-form-item label="付款货币">
          <el-select v-model="termsData.currency">
            <el-option label="人民币 (CNY)" value="CNY" />
            <el-option label="美元 (USD)" value="USD" />
            <el-option label="欧元 (EUR)" value="EUR" />
            <el-option label="英镑 (GBP)" value="GBP" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="结算方式">
          <el-select v-model="termsData.settlementMethod">
            <el-option label="电汇" value="wire" />
            <el-option label="支票" value="check" />
            <el-option label="现金" value="cash" />
            <el-option label="网上银行" value="online" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="发票类型">
          <el-select v-model="termsData.invoiceType">
            <el-option label="增值税专用发票" value="vat_special" />
            <el-option label="增值税普通发票" value="vat_normal" />
            <el-option label="普通发票" value="normal" />
            <el-option label="收据" value="receipt" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="税率">
          <el-input v-model="termsData.taxRate" placeholder="13%">
            <template #suffix>%</template>
          </el-input>
        </el-form-item>
      </div>
    </div>

    <!-- 收款账户信息 -->
    <div class="account-info">
      <h4>收款账户</h4>
      <div class="form-grid">
        <el-form-item label="账户类型">
          <el-radio-group v-model="termsData.accountType">
            <el-radio label="company">公司账户</el-radio>
            <el-radio label="personal">个人账户</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="开户行">
          <el-input v-model="termsData.bankName" placeholder="请输入开户行" />
        </el-form-item>
        
        <el-form-item label="账户名称">
          <el-input v-model="termsData.accountName" placeholder="请输入账户名称" />
        </el-form-item>
        
        <el-form-item label="银行账号">
          <el-input v-model="termsData.accountNumber" placeholder="请输入银行账号" />
        </el-form-item>
        
        <el-form-item label="SWIFT代码">
          <el-input v-model="termsData.swiftCode" placeholder="国际转账专用" />
        </el-form-item>
        
        <el-form-item label="联行号">
          <el-input v-model="termsData.routingNumber" placeholder="国内转账专用" />
        </el-form-item>
      </div>
    </div>

    <!-- 其他条款 -->
    <div class="other-terms">
      <h4>其他条款</h4>
      <div class="form-grid">
        <el-form-item label="延迟付款条款">
          <el-select v-model="termsData.latePayment">
            <el-option label="无延迟条款" value="none" />
            <el-option label="每日0.05%滞纳金" value="daily_0.05" />
            <el-option label="每日0.1%滞纳金" value="daily_0.1" />
            <el-option label="固定滞纳金" value="fixed" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        
        <el-form-item v-if="termsData.latePayment === 'fixed'" label="滞纳金金额">
          <el-input v-model="termsData.lateFee" placeholder="0.00">
            <template #prefix>¥</template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="保证金条款">
          <el-radio-group v-model="termsData.depositRequired">
            <el-radio :label="false">不收取保证金</el-radio>
            <el-radio :label="true">收取保证金</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item v-if="termsData.depositRequired" label="保证金比例">
          <el-input v-model="termsData.depositPercent" placeholder="5%">
            <template #suffix>%</template>
          </el-input>
        </el-form-item>
      </div>
      
      <el-form-item label="特殊条款">
        <el-input
          v-model="termsData.specialTerms"
          type="textarea"
          :rows="3"
          placeholder="请输入特殊付款条款..."
        />
      </el-form-item>
    </div>

    <!-- 付款条款预览 -->
    <div class="terms-preview">
      <h4>条款预览</h4>
      <div class="preview-content">
        <div class="preview-item">
          <span class="label">付款方式：</span>
          <span class="value">{{ getPaymentMethodLabel(termsData.paymentMethod) }}</span>
        </div>
        <div class="preview-item">
          <span class="label">结算货币：</span>
          <span class="value">{{ termsData.currency }}</span>
        </div>
        <div class="preview-item">
          <span class="label">发票类型：</span>
          <span class="value">{{ getInvoiceTypeLabel(termsData.invoiceType) }}</span>
        </div>
        <div v-if="termsData.depositPayment" class="preview-item">
          <span class="label">定金比例：</span>
          <span class="value">{{ termsData.depositPayment.depositPercent }}%</span>
        </div>
        <div v-if="termsData.installments && termsData.installments.length > 0" class="preview-item">
          <span class="label">分期次数：</span>
          <span class="value">{{ termsData.installments.length }} 期</span>
        </div>
        <div v-if="termsData.milestones && termsData.milestones.length > 0" class="preview-item">
          <span class="label">里程碑数：</span>
          <span class="value">{{ termsData.milestones.length }} 个</span>
        </div>
      </div>
    </div>

    <!-- 模板选择弹窗 -->
    <el-dialog v-model="templateVisible" title="选择付款条款模板" width="600px">
      <div class="template-list">
        <div
          v-for="template in paymentTemplates"
          :key="template.id"
          class="template-item"
          @click="selectTemplate(template)"
        >
          <div class="template-header">
            <h5>{{ template.name }}</h5>
            <el-tag :type="template.type === 'standard' ? 'primary' : 'success'" size="small">
              {{ template.type === 'standard' ? '标准' : '自定义' }}
            </el-tag>
          </div>
          <div class="template-content">
            <p>{{ template.description }}</p>
            <div class="template-meta">
              <span>创建时间：{{ formatDate(template.createdAt) }}</span>
              <span>使用次数：{{ template.usageCount }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="templateVisible = false">取消</el-button>
        <el-button @click="createNewTemplate" type="primary">创建新模板</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

// 接口定义
interface PaymentTerms {
  paymentMethod: 'full' | 'installment' | 'milestone' | 'deposit'
  fullPayment: {
    terms: string
    creditDays: number
    advancePercent: string
    paymentDate: Date | null
  }
  installments: Installment[]
  milestones: Milestone[]
  deposit: {
    depositPercent: string
    depositAmount: string
    depositDate: Date | null
    finalDate: Date | null
    finalCondition: string
  }
  currency: string
  settlementMethod: string
  invoiceType: string
  taxRate: string
  accountType: string
  bankName: string
  accountName: string
  accountNumber: string
  swiftCode: string
  routingNumber: string
  latePayment: string
  lateFee: string
  depositRequired: boolean
  depositPercent: string
  specialTerms: string
}

interface Installment {
  id: string
  percent: string
  amount: string
  dueDate: Date | null
  condition: string
}

interface Milestone {
  id: string
  name: string
  standard: string
  percent: string
  amount: string
  estimatedDate: Date | null
}

interface PaymentTemplate {
  id: string
  name: string
  type: 'standard' | 'custom'
  description: string
  template: PaymentTerms
  createdAt: Date
  usageCount: number
}

// Props & Emits
const props = defineProps<{
  terms?: PaymentTerms
  totalAmount?: number
}>()

const emit = defineEmits<{
  'update:terms': [terms: PaymentTerms]
  'terms-updated': [terms: PaymentTerms]
}>()

// 响应式数据
const termsData = reactive<PaymentTerms>({
  paymentMethod: 'full',
  fullPayment: {
    terms: 'advance',
    creditDays: 30,
    advancePercent: '100',
    paymentDate: null
  },
  installments: [],
  milestones: [],
  deposit: {
    depositPercent: '30',
    depositAmount: '0',
    depositDate: null,
    finalDate: null,
    finalCondition: '验收合格后30天内'
  },
  currency: 'CNY',
  settlementMethod: 'wire',
  invoiceType: 'vat_special',
  taxRate: '13',
  accountType: 'company',
  bankName: '',
  accountName: '',
  accountNumber: '',
  swiftCode: '',
  routingNumber: '',
  latePayment: 'daily_0.05',
  lateFee: '0',
  depositRequired: false,
  depositPercent: '5',
  specialTerms: ''
})

const installmentCount = ref(3)
const templateVisible = ref(false)

const paymentTemplates = ref<PaymentTemplate[]>([
  {
    id: '1',
    name: '标准付款条款',
    type: 'standard',
    description: '适用于标准业务的一次性预付款条款',
    template: {} as PaymentTerms,
    createdAt: new Date('2024-01-01'),
    usageCount: 234
  },
  {
    id: '2',
    name: '项目分期付款',
    type: 'custom',
    description: '适用于大型项目的分阶段付款条款',
    template: {} as PaymentTerms,
    createdAt: new Date('2024-02-01'),
    usageCount: 67
  }
])

// 方法
const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    full: '一次性付款',
    installment: '分期付款',
    milestone: '里程碑付款',
    deposit: '定金+尾款'
  }
  return labels[method] || method
}

const getInvoiceTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    vat_special: '增值税专用发票',
    vat_normal: '增值税普通发票',
    normal: '普通发票',
    receipt: '收据'
  }
  return labels[type] || type
}

const formatDate = (date: Date | null): string => {
  if (!date) return '未设置'
  return date.toLocaleDateString('zh-CN')
}

const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

// 事件处理
const handlePaymentMethodChange = (method: string) => {
  if (method === 'installment' && termsData.installments.length === 0) {
    generateInstallments()
  }
}

const handleTermsChange = (terms: string) => {
  // 根据不同的付款条款设置默认值
  switch (terms) {
    case 'advance':
      termsData.fullPayment.advancePercent = '100'
      break
    case 'credit':
      termsData.fullPayment.creditDays = 30
      break
  }
}

// 分期付款相关
const generateInstallments = () => {
  const newInstallments: Installment[] = []
  const percentPerInstallment = (100 / installmentCount.value).toFixed(2)
  
  for (let i = 0; i < installmentCount.value; i++) {
    const installment: Installment = {
      id: generateId(),
      percent: percentPerInstallment,
      amount: '0',
      dueDate: null,
      condition: `第${i + 1}期付款条件`
    }
    newInstallments.push(installment)
  }
  
  termsData.installments = newInstallments
  calculateInstallmentAmounts()
}

const addInstallment = () => {
  const newInstallment: Installment = {
    id: generateId(),
    percent: '0',
    amount: '0',
    dueDate: null,
    condition: `第${termsData.installments.length + 1}期付款条件`
  }
  termsData.installments.push(newInstallment)
}

const removeInstallment = (index: number) => {
  termsData.installments.splice(index, 1)
  calculateInstallmentAmounts()
}

const calculateInstallmentAmount = (index: number) => {
  if (props.totalAmount) {
    const percent = parseFloat(termsData.installments[index].percent) || 0
    const amount = (props.totalAmount * percent / 100).toFixed(2)
    termsData.installments[index].amount = amount
  }
  emitUpdate()
}

const calculateInstallmentAmounts = () => {
  if (props.totalAmount) {
    termsData.installments.forEach((installment, index) => {
      calculateInstallmentAmount(index)
    })
  }
  emitUpdate()
}

// 里程碑付款相关
const addMilestone = () => {
  const newMilestone: Milestone = {
    id: generateId(),
    name: '',
    standard: '',
    percent: '0',
    amount: '0',
    estimatedDate: null
  }
  termsData.milestones.push(newMilestone)
}

const removeMilestone = (index: number) => {
  termsData.milestones.splice(index, 1)
  calculateMilestoneAmounts()
}

const calculateMilestoneAmount = (index: number) => {
  if (props.totalAmount) {
    const percent = parseFloat(termsData.milestones[index].percent) || 0
    const amount = (props.totalAmount * percent / 100).toFixed(2)
    termsData.milestones[index].amount = amount
  }
  emitUpdate()
}

const calculateMilestoneAmounts = () => {
  if (props.totalAmount) {
    termsData.milestones.forEach((milestone, index) => {
      calculateMilestoneAmount(index)
    })
  }
  emitUpdate()
}

// 定金付款相关
const calculateDepositAmount = () => {
  if (props.totalAmount) {
    const percent = parseFloat(termsData.deposit.depositPercent) || 0
    const depositAmount = (props.totalAmount * percent / 100).toFixed(2)
    termsData.deposit.depositAmount = depositAmount
  }
  emitUpdate()
}

// 模板相关
const useTemplate = () => {
  templateVisible.value = true
}

const selectTemplate = (template: PaymentTemplate) => {
  Object.assign(termsData, template.template)
  templateVisible.value = false
  emitUpdate()
  ElMessage.success(`已应用模板：${template.name}`)
}

const saveAsTemplate = () => {
  ElMessage.success('模板保存成功')
}

const createNewTemplate = () => {
  templateVisible.value = false
  ElMessage.info('创建新模板功能开发中...')
}

const emitUpdate = () => {
  emit('update:terms', { ...termsData })
  emit('terms-updated', { ...termsData })
}

// 监听数据变化
watch(() => props.terms, (newTerms) => {
  if (newTerms) {
    Object.assign(termsData, newTerms)
  }
}, { deep: true, immediate: true })

watch(() => props.totalAmount, () => {
  calculateInstallmentAmounts()
  calculateMilestoneAmounts()
  calculateDepositAmount()
})

watch(termsData, () => {
  emitUpdate()
}, { deep: true })
</script>

<style scoped>
.payment-terms {
  background: var(--surface-color);
  border-radius: 12px;
  padding: 1.5rem;
}

.terms-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.terms-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.payment-method-section,
.full-payment,
.installment-payment,
.milestone-payment,
.deposit-payment,
.basic-payment-info,
.account-info,
.other-terms,
.terms-preview {
  margin-bottom: 1.5rem;
}

.payment-method-section h4,
.basic-payment-info h4,
.account-info h4,
.other-terms h4,
.terms-preview h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.installment-header,
.milestone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.installment-header h4,
.milestone-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.installment-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.installments-list,
.milestones-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.installment-item,
.milestone-item {
  background: var(--background-color);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid var(--border-color);
}

.installment-header-info,
.milestone-header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.installment-header-info h5,
.milestone-header-info h5 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.installment-form,
.milestone-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.add-installment-btn {
  text-align: center;
  margin-top: 1rem;
}

.preview-content {
  background: var(--background-color);
  border-radius: 8px;
  padding: 1rem;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.preview-item:last-child {
  border-bottom: none;
}

.preview-item .label {
  font-weight: 500;
  color: var(--text-secondary);
}

.preview-item .value {
  font-weight: 600;
  color: var(--text-primary);
}

.template-list {
  max-height: 400px;
  overflow-y: auto;
}

.template-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.template-item:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.template-header h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.template-content p {
  margin: 0.5rem 0;
  color: var(--text-secondary);
}

.template-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .payment-terms {
    padding: 1rem;
  }
  
  .terms-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .installment-header,
  .milestone-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .installment-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .installment-form,
  .milestone-form {
    grid-template-columns: 1fr;
  }
  
  .template-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .template-meta {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>