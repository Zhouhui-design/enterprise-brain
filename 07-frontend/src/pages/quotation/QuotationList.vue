<template>
  <div class="quotation-list">
    <div class="list-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">报价管理中心</h1>
          <p class="page-subtitle">管理客户报价、跟踪审核状态、优化销售流程</p>
        </div>
        <div class="header-stats">
          <div class="stat-card">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">总报价数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.pending }}</div>
            <div class="stat-label">待审核</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.approved }}</div>
            <div class="stat-label">已审批</div>
          </div>
        </div>
      </div>
    </div>

    <div class="search-section">
      <div class="search-container">
        <div class="search-filters">
          <div class="search-input">
            <i class="fas fa-search"></i>
            <input 
              v-model="searchForm.query" 
              type="text" 
              placeholder="搜索报价编号、客户名称或联系人..."
              @input="handleSearch"
            />
          </div>
          <div class="filter-group">
            <select v-model="searchForm.status" @change="handleFilter">
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="pending_review">待审核</option>
              <option value="reviewing">审核中</option>
              <option value="reviewed">已审核</option>
              <option value="pending_approval">待审批</option>
              <option value="approved">已审批</option>
              <option value="rejected">已拒绝</option>
              <option value="cancelled">已取消</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div class="filter-group">
            <select v-model="searchForm.priority" @change="handleFilter">
              <option value="">全部优先级</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
          <div class="date-range">
            <input 
              v-model="searchForm.startDate" 
              type="date" 
              @change="handleFilter"
            />
            <span>至</span>
            <input 
              v-model="searchForm.endDate" 
              type="date" 
              @change="handleFilter"
            />
          </div>
        </div>
        <button class="btn-primary" @click="handleCreateQuotation">
          <i class="fas fa-plus"></i>
          新建报价
        </button>
      </div>
    </div>

    <div class="quotations-grid">
      <div 
        v-for="quotation in paginatedQuotations" 
        :key="quotation.id"
        class="quotation-card"
        :class="[`status-${quotation.status}`, `priority-${quotation.priority}`]"
      >
        <div class="card-header">
          <div class="quotation-info">
            <h3 class="quotation-number">{{ quotation.quotationNo }}</h3>
            <span 
              class="status-badge"
              :class="getStatusClass(quotation.status)"
            >
              {{ getStatusText(quotation.status) }}
            </span>
          </div>
          <div class="priority-indicator">
            <i 
              class="fas fa-flag" 
              :class="getPriorityClass(quotation.priority)"
            ></i>
          </div>
        </div>

        <div class="card-content">
          <div class="customer-section">
            <div class="customer-name">{{ quotation.customerName }}</div>
            <div class="contact-info">
              <span class="contact-person">{{ quotation.contactPerson }}</span>
              <span class="contact-phone">{{ quotation.contactPhone }}</span>
            </div>
          </div>

          <div class="details-section">
            <div class="detail-row">
              <span class="label">报价金额</span>
              <span class="value amount">¥{{ quotation.totalAmount.toLocaleString() }}</span>
            </div>
            <div class="detail-row">
              <span class="label">产品数量</span>
              <span class="value">{{ quotation.itemCount }} 项</span>
            </div>
            <div class="detail-row">
              <span class="label">有效期至</span>
              <span class="value" :class="{ 'expiring': isExpiringSoon(quotation.validUntil) }">
                {{ formatDate(quotation.validUntil) }}
              </span>
            </div>
          </div>

          <div class="timeline-section">
            <div class="timeline-item">
              <span class="timeline-label">创建</span>
              <span class="timeline-date">{{ formatDate(quotation.createTime) }}</span>
            </div>
            <div class="timeline-item">
              <span class="timeline-label">创建人</span>
              <span class="timeline-person">{{ quotation.creator }}</span>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button 
            class="btn-secondary" 
            @click="handleViewDetail(quotation.id)"
          >
            <i class="fas fa-eye"></i>
            查看详情
          </button>
          <button 
            v-if="quotation.status === 'draft'"
            class="btn-primary" 
            @click="handleEdit(quotation.id)"
          >
            <i class="fas fa-edit"></i>
            编辑
          </button>
          <button 
            v-if="quotation.status === 'draft'"
            class="btn-success" 
            @click="handleSubmitReview(quotation.id)"
          >
            <i class="fas fa-paper-plane"></i>
            提交审核
          </button>
          <button 
            v-if="['reviewed', 'approved'].includes(quotation.status)"
            class="btn-warning" 
            @click="handleConvertToOrder(quotation.id)"
          >
            <i class="fas fa-exchange-alt"></i>
            转订单
          </button>
        </div>
      </div>
    </div>

    <div class="pagination">
      <div class="pagination-info">
        显示 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredQuotations.length) }} 
        共 {{ filteredQuotations.length }} 项
      </div>
      <div class="pagination-controls">
        <button 
          class="pagination-btn" 
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <button 
          v-for="page in visiblePages" 
          :key="page"
          class="pagination-btn"
          :class="{ active: page === currentPage }"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
        <button 
          class="pagination-btn" 
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

// 接口定义
interface Quotation {
  id: string
  quotationNo: string
  customerName: string
  contactPerson: string
  contactPhone: string
  totalAmount: number
  itemCount: number
  validUntil: string
  creator: string
  createTime: string
  status: string
  priority: string
  reviewTime?: string
  approveTime?: string
}

interface SearchForm {
  query: string
  status: string
  priority: string
  startDate: string
  endDate: string
}

interface Stats {
  total: number
  pending: number
  approved: number
}

// 响应式数据
const router = useRouter()
const searchForm = reactive<SearchForm>({
  query: '',
  status: '',
  priority: '',
  startDate: '',
  endDate: ''
})

const currentPage = ref(1)
const pageSize = ref(12)
const quotations = ref<Quotation[]>([])

const stats = ref<Stats>({
  total: 0,
  pending: 0,
  approved: 0
})

// 计算属性
const filteredQuotations = computed(() => {
  let filtered = quotations.value

  if (searchForm.query) {
    const query = searchForm.query.toLowerCase()
    filtered = filtered.filter(q => 
      q.quotationNo.toLowerCase().includes(query) ||
      q.customerName.toLowerCase().includes(query) ||
      q.contactPerson.toLowerCase().includes(query)
    )
  }

  if (searchForm.status) {
    filtered = filtered.filter(q => q.status === searchForm.status)
  }

  if (searchForm.priority) {
    filtered = filtered.filter(q => q.priority === searchForm.priority)
  }

  if (searchForm.startDate) {
    filtered = filtered.filter(q => q.createTime >= searchForm.startDate)
  }

  if (searchForm.endDate) {
    filtered = filtered.filter(q => q.createTime <= searchForm.endDate + ' 23:59:59')
  }

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredQuotations.value.length / pageSize.value)
})

const paginatedQuotations = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredQuotations.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
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

const getPriorityClass = (priority: string): string => {
  const classMap: Record<string, string> = {
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low'
  }
  return classMap[priority] || 'priority-medium'
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

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleCreateQuotation = () => {
  router.push('/quotation/create')
}

const handleViewDetail = (id: string) => {
  router.push(`/quotation/detail/${id}`)
}

const handleEdit = (id: string) => {
  router.push(`/quotation/edit/${id}`)
}

const handleSubmitReview = async (id: string) => {
  try {
    // API调用：提交审核
    await submitForReview(id)
    ElMessage.success('报价单已提交审核')
    await fetchQuotations()
  } catch (error) {
    ElMessage.error('提交审核失败')
  }
}

const handleConvertToOrder = (id: string) => {
  router.push(`/quotation/convert/${id}`)
}

const fetchQuotations = async () => {
  try {
    // 模拟API调用
    const mockData: Quotation[] = [
      {
        id: '1',
        quotationNo: 'QT2024001',
        customerName: '北京科技创新有限公司',
        contactPerson: '张经理',
        contactPhone: '13800138001',
        totalAmount: 125000.00,
        itemCount: 5,
        validUntil: '2024-02-15',
        creator: '李销售',
        createTime: '2024-01-15 09:30:00',
        status: 'approved',
        priority: 'high',
        approveTime: '2024-01-16 14:20:00'
      },
      {
        id: '2',
        quotationNo: 'QT2024002',
        customerName: '上海智能制造企业',
        contactPerson: '王总',
        contactPhone: '13900139002',
        totalAmount: 89000.00,
        itemCount: 3,
        validUntil: '2024-02-20',
        creator: '赵销售',
        createTime: '2024-01-16 10:15:00',
        status: 'pending_review',
        priority: 'medium'
      },
      {
        id: '3',
        quotationNo: 'QT2024003',
        customerName: '深圳软件开发公司',
        contactPerson: '刘经理',
        contactPhone: '13700137003',
        totalAmount: 215000.00,
        itemCount: 8,
        validUntil: '2024-01-30',
        creator: '孙销售',
        createTime: '2024-01-10 14:45:00',
        status: 'draft',
        priority: 'low'
      }
    ]
    
    quotations.value = mockData
    
    // 更新统计数据
    stats.value = {
      total: mockData.length,
      pending: mockData.filter(q => q.status === 'pending_review').length,
      approved: mockData.filter(q => q.status === 'approved').length
    }
  } catch (error) {
    ElMessage.error('获取报价列表失败')
  }
}

const submitForReview = async (id: string) => {
  // 模拟API调用
  console.log('Submitting quotation for review:', id)
}

// 生命周期
onMounted(() => {
  fetchQuotations()
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

.quotation-list {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
  background: linear-gradient(135deg, var(--color-off-white) 0%, #FFFFFF 100%);
  min-height: 100vh;
}

/* Header Section */
.list-header {
  margin-bottom: 48px;
  position: relative;
}

.header-content {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 48px;
  align-items: center;
}

.header-text {
  transform: translateY(-8px);
}

.page-title {
  font-family: var(--font-display);
  font-size: 3.5rem;
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

.header-stats {
  display: flex;
  gap: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  min-width: 120px;
  transform: rotate(-2deg);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: rotate(0deg) translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.stat-value {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-teal);
  display: block;
  margin-bottom: 4px;
}

.stat-label {
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Search Section */
.search-section {
  margin-bottom: 48px;
  position: relative;
}

.search-section::before {
  content: '';
  position: absolute;
  top: -24px;
  left: -48px;
  right: -48px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-gray-light), transparent);
}

.search-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.search-filters {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  flex-wrap: wrap;
}

.search-input {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-input i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-medium);
  font-size: 14px;
}

.search-input input {
  width: 100%;
  padding: 14px 16px 14px 44px;
  border: 1px solid var(--color-gray-light);
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
}

.search-input input:focus {
  outline: none;
  border-color: var(--color-teal);
  box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1);
}

.filter-group {
  position: relative;
}

.filter-group select {
  padding: 14px 16px;
  border: 1px solid var(--color-gray-light);
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  min-width: 140px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-group select:focus {
  outline: none;
  border-color: var(--color-teal);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-range input {
  padding: 14px 16px;
  border: 1px solid var(--color-gray-light);
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  width: 140px;
}

.date-range span {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
}

/* Button Styles */
.btn-primary {
  padding: 14px 24px;
  background: var(--color-teal);
  border: none;
  border-radius: 12px;
  font-family: var(--font-body);
  font-weight: 500;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(56, 178, 172, 0.3);
}

.btn-secondary {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-slate);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: var(--color-teal);
  color: var(--color-teal);
  background: rgba(56, 178, 172, 0.05);
}

.btn-success {
  padding: 8px 16px;
  background: var(--color-success);
  border: none;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 13px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-success:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(72, 187, 120, 0.3);
}

.btn-warning {
  padding: 8px 16px;
  background: var(--color-warning);
  border: none;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 13px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-warning:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(237, 137, 54, 0.3);
}

/* Quotations Grid */
.quotations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 32px;
  margin-bottom: 48px;
}

.quotation-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.quotation-card:hover {
  transform: translateY(-4px) rotate(1deg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
}

.quotation-card.priority-high::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--color-danger);
}

.quotation-card.priority-medium::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--color-warning);
}

.quotation-card.priority-low::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--color-teal);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 0 24px;
}

.quotation-info {
  flex: 1;
}

.quotation-number {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0 0 8px 0;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-draft {
  background: var(--color-gray-light);
  color: var(--color-slate);
}

.status-pending {
  background: #FBD38D;
  color: #975A16;
}

.status-reviewing {
  background: #BEE3F8;
  color: #2C5282;
}

.status-reviewed {
  background: #C6F6D5;
  color: #22543D;
}

.status-approved {
  background: var(--color-success);
  color: white;
}

.status-rejected {
  background: var(--color-danger);
  color: white;
}

.status-cancelled {
  background: var(--color-gray-light);
  color: var(--color-gray-medium);
}

.status-completed {
  background: var(--color-teal);
  color: white;
}

.priority-indicator {
  margin-left: 16px;
}

.priority-high {
  color: var(--color-danger);
}

.priority-medium {
  color: var(--color-warning);
}

.priority-low {
  color: var(--color-teal);
}

.card-content {
  padding: 24px;
}

.customer-section {
  margin-bottom: 24px;
}

.customer-name {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--color-slate);
  margin-bottom: 8px;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-person, .contact-phone {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-gray-medium);
}

.details-section {
  margin-bottom: 24px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.detail-row .label {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-row .value {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-slate);
}

.detail-row .value.amount {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-teal);
}

.detail-row .value.expiring {
  color: var(--color-warning);
  font-weight: 600;
}

.timeline-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-label {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.timeline-date, .timeline-person {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-slate);
}

.card-actions {
  display: flex;
  gap: 8px;
  padding: 0 24px 24px 24px;
  flex-wrap: wrap;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--color-gray-light);
}

.pagination-info {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-gray-medium);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-gray-light);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-slate);
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--color-teal);
  color: var(--color-teal);
  background: rgba(56, 178, 172, 0.05);
}

.pagination-btn.active {
  background: var(--color-teal);
  border-color: var(--color-teal);
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .header-content {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .header-stats {
    justify-content: space-around;
  }
  
  .quotations-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .quotation-list {
    padding: 24px 16px;
  }
  
  .page-title {
    font-size: 2.5rem;
  }
  
  .search-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-filters {
    flex-direction: column;
    gap: 12px;
  }
  
  .search-input {
    min-width: 100%;
  }
  
  .date-range {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-range input {
    width: 100%;
  }
  
  .quotations-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .pagination {
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }
}
</style>