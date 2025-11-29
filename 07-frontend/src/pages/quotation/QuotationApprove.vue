<template>
  <div class="quotation-approve">
    <div class="approve-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">报价审批</h1>
          <p class="page-subtitle">审核报价详情并做出审批决定</p>
        </div>
        <button class="btn-back" @click="handleBack">
          <i class="fas fa-arrow-left"></i>
          返回列表
        </button>
      </div>
    </div>

    <div class="content-container">
      <div class="main-content">
        <!-- 报价基本信息 -->
        <section class="info-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fas fa-file-invoice"></i>
              基本信息
            </h2>
            <span 
              class="status-badge"
              :class="getStatusClass(quotationDetail.status)"
            >
              {{ getStatusText(quotationDetail.status) }}
            </span>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <label>报价编号</label>
              <span class="quotation-number">{{ quotationDetail.quotationNo }}</span>
            </div>
            <div class="info-item">
              <label>客户名称</label>
              <span>{{ quotationDetail.customerName }}</span>
            </div>
            <div class="info-item">
              <label>联系人</label>
              <span>{{ quotationDetail.contactPerson }}</span>
            </div>
            <div class="info-item">
              <label>联系电话</label>
              <span class="phone">{{ quotationDetail.contactPhone }}</span>
            </div>
            <div class="info-item">
              <label>报价日期</label>
              <span>{{ formatDate(quotationDetail.quotationDate) }}</span>
            </div>
            <div class="info-item">
              <label>有效期至</label>
              <span :class="{ 'expiring': isExpiringSoon(quotationDetail.validUntil) }">
                {{ formatDate(quotationDetail.validUntil) }}
              </span>
            </div>
            <div class="info-item">
              <label>创建人</label>
              <span>{{ quotationDetail.creator }}</span>
            </div>
            <div class="info-item">
              <label>创建时间</label>
              <span>{{ formatDateTime(quotationDetail.createTime) }}</span>
            </div>
          </div>
          
          <div v-if="quotationDetail.remark" class="remark-section">
            <label>备注说明</label>
            <p class="remark-content">{{ quotationDetail.remark }}</p>
          </div>
        </section>

        <!-- 审核信息 -->
        <section class="review-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fas fa-clipboard-check"></i>
              审核信息
            </h2>
          </div>
          
          <div class="review-grid">
            <div class="info-item">
              <label>审核人</label>
              <span>{{ quotationDetail.reviewerName }}</span>
            </div>
            <div class="info-item">
              <label>审核时间</label>
              <span>{{ formatDateTime(quotationDetail.reviewTime) }}</span>
            </div>
            <div class="info-item">
              <label>审核结果</label>
              <span class="review-result">{{ quotationDetail.reviewResult }}</span>
            </div>
          </div>
          
          <div v-if="quotationDetail.reviewComment" class="remark-section">
            <label>审核意见</label>
            <p class="review-comment">{{ quotationDetail.reviewComment }}</p>
          </div>
        </section>

        <!-- 报价明细 -->
        <section class="items-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fas fa-list"></i>
              报价明细
            </h2>
          </div>
          
          <div class="items-table">
            <div class="table-header">
              <div class="header-cell">产品名称</div>
              <div class="header-cell">数量</div>
              <div class="header-cell">单价</div>
              <div class="header-cell">金额</div>
              <div class="header-cell">描述</div>
            </div>
            
            <div 
              v-for="(item, index) in quotationDetail.items" 
              :key="index"
              class="table-row"
            >
              <div class="table-cell product-name">{{ item.productName }}</div>
              <div class="table-cell quantity">{{ item.quantity }}</div>
              <div class="table-cell unit-price">¥{{ item.unitPrice.toFixed(2) }}</div>
              <div class="table-cell amount">¥{{ item.amount.toFixed(2) }}</div>
              <div class="table-cell description">{{ item.description }}</div>
            </div>
          </div>
        </section>

        <!-- 费用汇总 -->
        <section class="summary-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fas fa-calculator"></i>
              费用汇总
            </h2>
          </div>
          
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">商品总计</span>
              <span class="value">¥{{ quotationDetail.subtotal?.toFixed(2) || quotationDetail.totalAmount.toFixed(2) }}</span>
            </div>
            <div v-if="quotationDetail.discountAmount" class="summary-item discount">
              <span class="label">折扣优惠</span>
              <span class="value">-¥{{ quotationDetail.discountAmount.toFixed(2) }}</span>
            </div>
            <div v-if="quotationDetail.taxAmount" class="summary-item">
              <span class="label">税费</span>
              <span class="value">¥{{ quotationDetail.taxAmount.toFixed(2) }}</span>
            </div>
            <div class="summary-item total">
              <span class="label">总计金额</span>
              <span class="value">¥{{ quotationDetail.totalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- 审批表单 -->
      <div class="approve-panel">
        <div class="panel-header">
          <h2 class="panel-title">
            <i class="fas fa-gavel"></i>
            审批意见
          </h2>
        </div>
        
        <form @submit.prevent="handleSubmitApprove" class="approve-form">
          <div class="form-group">
            <label class="form-label">审批结果 *</label>
            <div class="radio-group">
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="approveForm.result" 
                  value="approved"
                />
                <span class="radio-label">
                  <i class="fas fa-check-circle"></i>
                  通过
                </span>
              </label>
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="approveForm.result" 
                  value="rejected"
                />
                <span class="radio-label">
                  <i class="fas fa-times-circle"></i>
                  拒绝
                </span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">
              审批意见
              <span v-if="approveForm.result === 'rejected'" class="required">*</span>
            </label>
            <textarea
              v-model="approveForm.comment"
              class="form-textarea"
              :placeholder="approveForm.result === 'rejected' ? '请说明拒绝原因...' : '请输入审批意见（选填）...'"
              rows="4"
              :required="approveForm.result === 'rejected'"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="handleCancel">
              <i class="fas fa-times"></i>
              取消
            </button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              <i class="fas fa-paper-plane"></i>
              {{ isSubmitting ? '提交中...' : '提交审批' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

// 接口定义
interface QuotationItem {
  productName: string
  quantity: number
  unitPrice: number
  amount: number
  description: string
}

interface QuotationDetail {
  id: string
  quotationNo: string
  customerName: string
  contactPerson: string
  contactPhone: string
  quotationDate: string
  validUntil: string
  remark?: string
  creator: string
  createTime: string
  reviewerName: string
  reviewTime: string
  reviewResult: string
  reviewComment?: string
  items: QuotationItem[]
  subtotal?: number
  discountAmount?: number
  taxAmount?: number
  totalAmount: number
  status: string
}

interface ApproveForm {
  result: 'approved' | 'rejected'
  comment: string
}

// 响应式数据
const router = useRouter()
const route = useRoute()
const isSubmitting = ref(false)

const quotationDetail = reactive<QuotationDetail>({
  id: '',
  quotationNo: '',
  customerName: '',
  contactPerson: '',
  contactPhone: '',
  quotationDate: '',
  validUntil: '',
  remark: '',
  creator: '',
  createTime: '',
  reviewerName: '',
  reviewTime: '',
  reviewResult: '',
  reviewComment: '',
  items: [],
  totalAmount: 0,
  status: ''
})

const approveForm = reactive<ApproveForm>({
  result: 'approved',
  comment: ''
})

// 方法
const getStatusClass = (status: string): string => {
  const classMap: Record<string, string> = {
    draft: 'status-draft',
    pending_review: 'status-pending',
    reviewing: 'status-reviewing',
    reviewed: 'status-reviewed',
    pending_approval: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected',
    cancelled: 'status-cancelled',
    completed: 'status-completed'
  }
  return classMap[status] || 'status-draft'
}

const getStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    draft: '草稿',
    pending_review: '待审核',
    reviewing: '审核中',
    reviewed: '已审核',
    pending_approval: '待审批',
    approved: '已审批',
    rejected: '已拒绝',
    cancelled: '已取消',
    completed: '已完成'
  }
  return textMap[status] || status
}

const isExpiringSoon = (validUntil: string): boolean => {
  const validDate = new Date(validUntil)
  const today = new Date()
  const daysUntilExpiry = Math.ceil((validDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return daysUntilExpiry <= 7 && daysUntilExpiry >= 0
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatDateTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleBack = () => {
  router.back()
}

const handleCancel = () => {
  router.back()
}

const handleSubmitApprove = async () => {
  if (approveForm.result === 'rejected' && !approveForm.comment.trim()) {
    ElMessage.error('拒绝时必须填写审批意见')
    return
  }

  try {
    isSubmitting.value = true
    
    // 模拟API调用
    await submitApproval({
      quotationId: quotationDetail.id,
      result: approveForm.result,
      comment: approveForm.comment
    })
    
    const message = approveForm.result === 'approved' ? '审批通过' : '审批拒绝'
    ElMessage.success(message)
    
    // 跳转回详情页
    router.push(`/quotation/detail/${quotationDetail.id}`)
  } catch (error) {
    ElMessage.error('提交审批失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

const fetchQuotationDetail = async () => {
  const id = route.params.id as string
  if (!id) {
    ElMessage.error('报价单ID不存在')
    router.push('/quotation/list')
    return
  }
  
  try {
    // 模拟API调用
    const mockData: QuotationDetail = {
      id: id,
      quotationNo: 'QT2024003',
      customerName: '广州制造有限公司',
      contactPerson: '王总',
      contactPhone: '13800138003',
      quotationDate: '2024-01-18',
      validUntil: '2024-02-15',
      remark: '大批量采购，需要尽快确认，客户为长期合作伙伴',
      creator: '王五',
      createTime: '2024-01-18 10:00:00',
      reviewerName: '赵六',
      reviewTime: '2024-01-18 11:30:00',
      reviewResult: '审核通过',
      reviewComment: '价格合理，产品质量符合要求，同意提交审批',
      items: [
        {
          productName: '高精度数控机床',
          quantity: 2,
          unitPrice: 85000.00,
          amount: 170000.00,
          description: '五轴联动，精度±0.005mm'
        },
        {
          productName: '工业机器人',
          quantity: 3,
          unitPrice: 45000.00,
          amount: 135000.00,
          description: '六轴机器人，负载50kg'
        },
        {
          productName: '自动化控制系统',
          quantity: 1,
          unitPrice: 120000.00,
          amount: 120000.00,
          description: '包含PLC、HMI、传感器等全套设备'
        }
      ],
      subtotal: 425000.00,
      discountAmount: 21000.00,
      taxAmount: 40400.00,
      totalAmount: 444400.00,
      status: 'pending_approval'
    }
    
    Object.assign(quotationDetail, mockData)
  } catch (error) {
    ElMessage.error('获取报价详情失败')
    router.push('/quotation/list')
  }
}

const submitApproval = async (approvalData: any) => {
  // 模拟API调用
  console.log('Submitting approval:', approvalData)
  await new Promise(resolve => setTimeout(resolve, 1000))
}

// 生命周期
onMounted(() => {
  fetchQuotationDetail()
})
</script>

<style scoped>
/* CSS Variables */
:root {
  --color-slate: #2D3748;
  --color-orange: #ED8936;
  --color-teal: #38B2AC;
  --color-off-white: #F7FAFC;
  --color-gray-light: #E2E8F0;
  --color-gray-medium: #A0AEC0;
  --color-success: #48BB78;
  --color-warning: #ED8936;
  --color-danger: #F56565;
  --font-display: 'Playfair Display', serif;
  --font-body: 'Space Mono', monospace;
}

.quotation-approve {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
  background: linear-gradient(135deg, var(--color-off-white) 0%, #FFFFFF 100%);
  min-height: 100vh;
}

/* Header */
.approve-header {
  margin-bottom: 48px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
}

.header-text {
  transform: translateY(-8px);
}

.page-title {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0 0 8px 0;
  line-height: 1.1;
}

.page-subtitle {
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--color-gray-medium);
  margin: 0;
  letter-spacing: 0.05em;
}

.btn-back {
  padding: 12px 20px;
  background: transparent;
  border: 1px solid var(--color-gray-light);
  border-radius: 12px;
  font-family: var(--font-body);
  font-weight: 500;
  color: var(--color-slate);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-back:hover {
  border-color: var(--color-teal);
  color: var(--color-teal);
  background: rgba(56, 178, 172, 0.05);
}

/* Content Container */
.content-container {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 48px;
  align-items: start;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Section Styles */
.info-section, .review-section, .items-section, .summary-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.info-section:hover, .review-section:hover, .items-section:hover, .summary-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid var(--color-gray-light);
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-title i {
  color: var(--color-teal);
  font-size: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-pending {
  background: #FBD38D;
  color: #975A16;
}

.status-approved {
  background: var(--color-success);
  color: white;
}

.status-rejected {
  background: var(--color-danger);
  color: white;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  padding: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item label {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-item span {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-slate);
}

.quotation-number {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-teal);
}

.phone {
  font-family: var(--font-body);
  color: var(--color-teal);
}

.expiring {
  color: var(--color-warning);
  font-weight: 600;
}

/* Remark Section */
.remark-section {
  padding: 0 24px 24px 24px;
}

.remark-section label {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 8px;
}

.remark-content, .review-comment {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-slate);
  line-height: 1.6;
  margin: 0;
  padding: 16px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border-left: 4px solid var(--color-teal);
}

/* Review Grid */
.review-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 24px;
}

.review-result {
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--color-success);
}

/* Items Table */
.items-table {
  overflow-x: auto;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 2fr;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid var(--color-gray-light);
}

.header-cell {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 2fr;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: rgba(56, 178, 172, 0.02);
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-slate);
  display: flex;
  align-items: center;
}

.product-name {
  font-weight: 600;
}

.quantity, .unit-price, .amount {
  justify-content: center;
}

.amount {
  font-weight: 600;
  color: var(--color-teal);
}

/* Summary Grid */
.summary-grid {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-item .label {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-gray-medium);
}

.summary-item .value {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-slate);
}

.summary-item.discount .value {
  color: var(--color-success);
}

.summary-item.total {
  padding-top: 16px;
  border-top: 2px solid var(--color-gray-light);
}

.summary-item.total .label {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
}

.summary-item.total .value {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  color: var(--color-teal);
}

/* Approve Panel */
.approve-panel {
  position: sticky;
  top: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  overflow: hidden;
}

.panel-header {
  padding: 24px;
  border-bottom: 1px solid var(--color-gray-light);
  background: linear-gradient(135deg, var(--color-teal), var(--color-slate));
}

.panel-title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-title i {
  font-size: 1rem;
}

.approve-form {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-label {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-slate);
}

.required {
  color: var(--color-danger);
  margin-left: 4px;
}

.radio-group {
  display: flex;
  gap: 24px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 16px;
  border: 2px solid var(--color-gray-light);
  border-radius: 12px;
  transition: all 0.2s ease;
  flex: 1;
}

.radio-option:hover {
  border-color: var(--color-teal);
  background: rgba(56, 178, 172, 0.02);
}

.radio-option input[type="radio"] {
  display: none;
}

.radio-option input[type="radio"]:checked + .radio-label {
  color: var(--color-teal);
}

.radio-option input[type="radio"]:checked ~ .radio-option {
  border-color: var(--color-teal);
  background: rgba(56, 178, 172, 0.05);
}

.radio-label {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-slate);
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-textarea {
  padding: 12px 16px;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 14px;
  resize: vertical;
  transition: all 0.2s ease;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-teal);
  box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1);
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.btn-secondary {
  padding: 12px 20px;
  background: transparent;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
  font-family: var(--font-body);
  font-weight: 500;
  color: var(--color-slate);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  flex: 1;
}

.btn-secondary:hover {
  border-color: var(--color-gray-medium);
  background: rgba(0, 0, 0, 0.02);
}

.btn-primary {
  padding: 12px 20px;
  background: var(--color-teal);
  border: none;
  border-radius: 8px;
  font-family: var(--font-body);
  font-weight: 500;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  flex: 1;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(56, 178, 172, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .content-container {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  
  .approve-panel {
    position: relative;
    top: 0;
  }
}

@media (max-width: 768px) {
  .quotation-approve {
    padding: 24px 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .review-grid {
    grid-template-columns: 1fr;
  }
  
  .table-header, .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .header-cell {
    display: none;
  }
  
  .table-cell::before {
    content: attr(data-label);
    font-weight: 600;
    margin-right: 8px;
  }
  
  .table-cell.product-name::before {
    content: '产品名称: ';
  }
  
  .table-cell.quantity::before {
    content: '数量: ';
  }
  
  .table-cell.unit-price::before {
    content: '单价: ';
  }
  
  .table-cell.amount::before {
    content: '金额: ';
  }
  
  .table-cell.description::before {
    content: '描述: ';
  }
  
  .radio-group {
    flex-direction: column;
  }
}
</style>