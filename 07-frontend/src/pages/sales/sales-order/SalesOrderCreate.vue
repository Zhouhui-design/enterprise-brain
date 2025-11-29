<template>
  <div class="sales-order-create">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="#4CAF50"/>
          </svg>
        </div>
        <div class="header-info">
          <h1>新建销售订单</h1>
          <p>创建新的销售订单，填写客户信息和产品明细</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button @click="saveDraft" :loading="saving">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V7l-4-4z" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M9 13l2 2 4-4" stroke="currentColor" stroke-width="2"/>
          </svg>
          保存草稿
        </el-button>
        <el-button type="primary" @click="submitOrder" :loading="submitting">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" stroke-width="2"/>
          </svg>
          提交订单
        </el-button>
      </div>
    </div>

    <!-- 订单信息表单 -->
    <el-form
      ref="orderFormRef"
      :model="orderForm"
      :rules="orderRules"
      label-width="120px"
      class="order-form"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <h2 class="section-title">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
          </svg>
          基本信息
        </h2>
        <div class="form-grid">
          <el-form-item label="订单编号" prop="orderNumber">
            <el-input v-model="orderForm.orderNumber" disabled placeholder="系统自动生成">
              <template #prefix>
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M9 2L3 7v9a2 2 0 002 2h4v5l3-3 3 3v-5h4a2 2 0 002-2V7l-6-5H9z" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="订单类型" prop="orderType">
            <el-select v-model="orderForm.orderType" placeholder="请选择订单类型">
              <el-option label="标准订单" value="standard" />
              <el-option label="加急订单" value="urgent" />
              <el-option label="样品订单" value="sample" />
              <el-option label="定制订单" value="custom" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="优先级" prop="priority">
            <el-radio-group v-model="orderForm.priority">
              <el-radio-button label="low">低</el-radio-button>
              <el-radio-button label="medium">中</el-radio-button>
              <el-radio-button label="high">高</el-radio-button>
              <el-radio-button label="urgent">紧急</el-radio-button>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="销售人员" prop="salesPerson">
            <el-select v-model="orderForm.salesPerson" placeholder="请选择销售人员">
              <el-option 
                v-for="person in salesPersons" 
                :key="person.id"
                :label="person.name" 
                :value="person.id"
              >
                <div class="sales-person-option">
                  <span class="person-name">{{ person.name }}</span>
                  <span class="person-info">{{ person.department }} • {{ person.level }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </div>
      </div>

      <!-- 客户选择 -->
      <div class="form-section">
        <h2 class="section-title">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          客户信息
        </h2>
        <CustomerSelector 
          v-model:selectedCustomer="orderForm.customer"
          @customer-selected="handleCustomerSelected"
        />
      </div>

      <!-- 产品选择 -->
      <div class="form-section">
        <h2 class="section-title">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          产品明细
        </h2>
        <ProductSelector 
          v-model:selectedProducts="orderForm.products"
          @products-updated="handleProductsUpdated"
        />
        
        <!-- 产品项编辑器 -->
        <div v-if="orderForm.products.length > 0" class="items-editor-section">
          <h3>产品项详细设置</h3>
          <OrderItemsEditor 
            v-model:items="orderForm.productItems"
            :products="orderForm.products"
            @items-updated="handleItemsUpdated"
          />
        </div>
      </div>

      <!-- 价格计算 -->
      <div class="form-section">
        <h2 class="section-title">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          价格计算
        </h2>
        <PriceCalculator 
          v-model:products="orderForm.productItems"
          v-model:totals="orderForm.priceTotals"
          @price-calculated="handlePriceCalculated"
        />
      </div>

      <!-- 交付安排 -->
      <div class="form-section">
        <h2 class="section-title">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          交付安排
        </h2>
        <DeliverySchedule 
          v-model:schedule="orderForm.deliverySchedule"
          @schedule-updated="handleScheduleUpdated"
        />
      </div>

      <!-- 付款条款 -->
      <div class="form-section">
        <h2 class="section-title">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M3 6h18M8 12h8m-5 6h2" stroke="currentColor" stroke-width="2"/>
          </svg>
          付款条款
        </h2>
        <PaymentTerms 
          v-model:terms="orderForm.paymentTerms"
          @terms-updated="handleTermsUpdated"
        />
      </div>

      <!-- 备注信息 -->
      <div class="form-section">
        <h2 class="section-title">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M14 2v6h6" stroke="currentColor" stroke-width="2"/>
          </svg>
          备注信息
        </h2>
        <div class="form-grid">
          <el-form-item label="内部备注" prop="internalNotes">
            <el-input
              v-model="orderForm.internalNotes"
              type="textarea"
              :rows="3"
              placeholder="请输入内部备注信息..."
            />
          </el-form-item>
          
          <el-form-item label="客户备注" prop="customerNotes">
            <el-input
              v-model="orderForm.customerNotes"
              type="textarea"
              :rows="3"
              placeholder="请输入客户备注信息..."
            />
          </el-form-item>
          
          <el-form-item label="特殊要求" prop="specialRequirements">
            <el-input
              v-model="orderForm.specialRequirements"
              type="textarea"
              :rows="3"
              placeholder="请输入特殊要求..."
            />
          </el-form-item>
          
          <el-form-item label="附件" prop="attachments">
            <el-upload
              v-model:file-list="orderForm.attachments"
              action="/api/upload"
              multiple
              :limit="5"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
            >
              <el-button type="primary" text>
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2"/>
                </svg>
                上传附件
              </el-button>
              <template #tip>
                <div class="el-upload__tip">
                  支持JPG/PNG/PDF/DOCX格式，单个文件不超过10MB
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </div>
      </div>
    </el-form>

    <!-- 订单预览 -->
    <div class="preview-section">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" fill="none"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
        订单预览
      </h2>
      <div class="preview-content">
        <div class="preview-summary">
          <div class="summary-item">
            <span class="label">客户名称：</span>
            <span class="value">{{ orderForm.customer?.name || '未选择' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">产品数量：</span>
            <span class="value">{{ orderForm.productItems.length }} 种</span>
          </div>
          <div class="summary-item">
            <span class="label">订单总额：</span>
            <span class="value total-amount">¥{{ formatAmount(orderForm.priceTotals?.final || 0) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">预计交付：</span>
            <span class="value">{{ formatDate(orderForm.deliverySchedule?.deliveryDate) || '未设置' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 导入子组件
import CustomerSelector from './components/CustomerSelector.vue'
import ProductSelector from './components/ProductSelector.vue'
import OrderItemsEditor from './components/OrderItemsEditor.vue'
import PriceCalculator from './components/PriceCalculator.vue'
import DeliverySchedule from './components/DeliverySchedule.vue'
import PaymentTerms from './components/PaymentTerms.vue'

// 接口定义
interface SalesPerson {
  id: string
  name: string
  department: string
  level: string
  email: string
  phone: string
}

interface Customer {
  id: string
  name: string
  type: string
  level: string
  contact: string
  phone: string
  email: string
  address: string
}

interface Product {
  id: string
  name: string
  spec: string
  category: string
  price: number
  stock: number
}

interface OrderForm {
  orderNumber: string
  orderType: string
  priority: string
  salesPerson: string
  customer: Customer | null
  products: Product[]
  productItems: any[]
  priceTotals: any
  deliverySchedule: any
  paymentTerms: any
  internalNotes: string
  customerNotes: string
  specialRequirements: string
  attachments: any[]
}

// 路由
const router = useRouter()

// 响应式数据
const orderFormRef = ref<FormInstance>()
const submitting = ref(false)
const saving = ref(false)

const salesPersons = ref<SalesPerson[]>([
  {
    id: '1',
    name: '张三',
    department: '销售一部',
    level: '高级销售',
    email: 'zhangsan@company.com',
    phone: '13800138001'
  },
  {
    id: '2',
    name: '李四',
    department: '销售二部',
    level: '中级销售',
    email: 'lisi@company.com',
    phone: '13800138002'
  }
])

const orderForm = reactive<OrderForm>({
  orderNumber: '',
  orderType: 'standard',
  priority: 'medium',
  salesPerson: '',
  customer: null,
  products: [],
  productItems: [],
  priceTotals: null,
  deliverySchedule: null,
  paymentTerms: null,
  internalNotes: '',
  customerNotes: '',
  specialRequirements: '',
  attachments: []
})

// 表单验证规则
const orderRules: FormRules = {
  orderType: [
    { required: true, message: '请选择订单类型', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择订单优先级', trigger: 'change' }
  ],
  salesPerson: [
    { required: true, message: '请选择销售人员', trigger: 'change' }
  ]
}

// 方法
const generateOrderNumber = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `SO${year}${month}${day}${random}`
}

const formatAmount = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const formatDate = (date: Date | string | null) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

// 事件处理
const handleCustomerSelected = (customer: Customer) => {
  console.log('客户已选择:', customer)
}

const handleProductsUpdated = (products: Product[]) => {
  console.log('产品已更新:', products)
}

const handleItemsUpdated = (items: any[]) => {
  console.log('产品项已更新:', items)
}

const handlePriceCalculated = (totals: any) => {
  console.log('价格已计算:', totals)
}

const handleScheduleUpdated = (schedule: any) => {
  console.log('交付计划已更新:', schedule)
}

const handleTermsUpdated = (terms: any) => {
  console.log('付款条款已更新:', terms)
}

const handleUploadSuccess = (response: any, file: any) => {
  ElMessage.success(`${file.name} 上传成功`)
}

const handleUploadError = (error: any, file: any) => {
  ElMessage.error(`${file.name} 上传失败`)
}

// 保存草稿
const saveDraft = async () => {
  saving.value = true
  try {
    // 这里调用保存草稿API
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('草稿保存成功')
  } catch (error) {
    ElMessage.error('草稿保存失败')
  } finally {
    saving.value = false
  }
}

// 提交订单
const submitOrder = async () => {
  if (!orderFormRef.value) return
  
  try {
    await orderFormRef.value.validate()
    
    // 验证必填项
    if (!orderForm.customer) {
      ElMessage.error('请选择客户')
      return
    }
    
    if (orderForm.productItems.length === 0) {
      ElMessage.error('请添加产品明细')
      return
    }
    
    await ElMessageBox.confirm('确定要提交这个订单吗？', '确认提交', {
      type: 'warning'
    })
    
    submitting.value = true
    
    // 这里调用提交订单API
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    ElMessage.success('订单提交成功')
    router.push('/sales/sales-order')
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('订单提交失败')
    }
  } finally {
    submitting.value = false
  }
}

// 初始化
onMounted(() => {
  orderForm.orderNumber = generateOrderNumber()
})
</script>

<style scoped>
.sales-order-create {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: var(--primary-color);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon svg {
  width: 24px;
  height: 24px;
  fill: white;
}

.header-info h1 {
  font-size: 1.5rem;
  margin: 0;
  color: var(--text-primary);
}

.header-info p {
  margin: 0.5rem 0 0 0;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.order-form {
  margin-bottom: 2rem;
}

.form-section {
  background: var(--surface-color);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.section-title svg {
  color: var(--primary-color);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.items-editor-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.items-editor-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.sales-person-option {
  display: flex;
  flex-direction: column;
}

.person-name {
  font-weight: 600;
  color: var(--text-primary);
}

.person-info {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.preview-section {
  background: var(--surface-color);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  margin-bottom: 2rem;
}

.preview-content {
  background: var(--background-color);
  border-radius: 8px;
  padding: 1rem;
}

.preview-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--surface-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.label {
  font-weight: 500;
  color: var(--text-secondary);
}

.value {
  font-weight: 600;
  color: var(--text-primary);
}

.total-amount {
  font-size: 1.1rem;
  color: var(--primary-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sales-order-create {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .preview-summary {
    grid-template-columns: 1fr;
  }
}
</style>