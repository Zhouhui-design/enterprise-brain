<template>
  <div class="customer-selector">
    <div class="selector-header">
      <h3 class="header-title">
        <i class="fas fa-users"></i>
        选择客户
      </h3>
      <div class="header-actions">
        <button class="btn-filter" @click="showFilters = !showFilters">
          <i class="fas fa-filter"></i>
          筛选
        </button>
        <button class="btn-create" @click="showCreateModal = true">
          <i class="fas fa-plus"></i>
          新建客户
        </button>
        <button class="btn-refresh" @click="refreshCustomers" :disabled="isLoading">
          <i class="fas fa-sync-alt" :class="{ 'spinning': isLoading }"></i>
          刷新
        </button>
      </div>
    </div>

    <!-- 筛选面板 -->
    <div v-if="showFilters" class="filter-panel">
      <div class="filter-section">
        <h4>客户类型</h4>
        <div class="filter-options">
          <label class="filter-chip" v-for="type in customerTypes" :key="type.value">
            <input 
              type="checkbox" 
              :value="type.value" 
              v-model="selectedTypes"
              @change="applyFilters"
            />
            <span>{{ type.label }}</span>
          </label>
        </div>
      </div>

      <div class="filter-section">
        <h4>客户等级</h4>
        <div class="filter-options">
          <label class="filter-chip" v-for="level in customerLevels" :key="level.value">
            <input 
              type="checkbox" 
              :value="level.value" 
              v-model="selectedLevels"
              @change="applyFilters"
            />
            <span>{{ level.label }}</span>
          </label>
        </div>
      </div>

      <div class="filter-section">
        <h4>所在区域</h4>
        <select v-model="selectedRegion" @change="applyFilters">
          <option value="">全部区域</option>
          <option v-for="region in regions" :key="region.value" :value="region.value">
            {{ region.name }}
          </option>
        </select>
      </div>

      <div class="filter-section">
        <h4>搜索客户</h4>
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="输入客户名称或手机号..."
            @input="handleSearch"
          />
        </div>
      </div>
    </div>

    <!-- 客户列表 -->
    <div class="customers-container">
      <div class="customers-grid">
        <div 
          v-for="customer in filteredCustomers" 
          :key="customer.id"
          class="customer-card"
          :class="{ 
            'selected': isSelected(customer.id),
            'vip': customer.level === 'vip',
            'new': isNewCustomer(customer.createdAt)
          }"
          @click="selectCustomer(customer)"
        >
          <div class="customer-avatar">
            <img v-if="customer.avatar" :src="customer.avatar" :alt="customer.name" />
            <div v-else class="avatar-placeholder">
              {{ customer.name.charAt(0) }}
            </div>
          </div>

          <div class="customer-info">
            <div class="customer-header">
              <h4 class="customer-name">{{ customer.name }}</h4>
              <div class="customer-badges">
                <span v-if="customer.level === 'vip'" class="badge vip">VIP</span>
                <span v-if="isNewCustomer(customer.createdAt)" class="badge new">新</span>
                <span v-if="customer.isHighValue" class="badge high-value">高价值</span>
              </div>
            </div>

            <div class="customer-contact">
              <p v-if="customer.email" class="contact-item">
                <i class="fas fa-envelope"></i>
                {{ customer.email }}
              </p>
              <p v-if="customer.phone" class="contact-item">
                <i class="fas fa-phone"></i>
                {{ customer.phone }}
              </p>
              <p v-if="customer.address" class="contact-item">
                <i class="fas fa-map-marker-alt"></i>
                {{ customer.address }}
              </p>
            </div>

            <div class="customer-meta">
              <div class="meta-item">
                <span class="meta-label">客户编号</span>
                <span class="meta-value">{{ customer.code }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">归属销售</span>
                <span class="meta-value">{{ customer.salesPerson }}</span>
              </div>
            </div>
          </div>

          <div class="customer-stats">
            <div class="stat-item">
              <span class="stat-label">累计订单</span>
              <span class="stat-value">{{ customer.totalOrders || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">累计金额</span>
              <span class="stat-value primary">¥{{ formatCurrency(customer.totalAmount || 0) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均客单价</span>
              <span class="stat-value">¥{{ formatCurrency(customer.avgOrderValue || 0) }}</span>
            </div>
          </div>

          <div class="customer-tags">
            <span class="tag" v-for="tag in customer.tags" :key="tag">{{ tag }}</span>
          </div>
        </div>

        <div class="customer-actions">
          <button class="btn-secondary" @click.stop="viewCustomerDetail(customer)">
            <i class="fas fa-eye"></i>
            查看详情
          </button>
          <button class="btn-secondary" @click.stop="contactCustomer(customer)">
            <i class="fas fa-phone"></i>
            联系客户
          </button>
          <button class="btn-primary" @click.stop="confirmSelection(customer)">
            <i class="fas fa-check"></i>
            选择
          </button>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="isLoading" class="loading-more">
        <i class="fas fa-spinner fa-spin"></i>
        <span>加载中...</span>
      </div>

      <div v-if="hasMore && !isLoading" class="load-more">
        <button class="btn-load" @click="loadMoreCustomers">
          加载更多
        </button>
      </div>
    </div>

    <!-- 创建客户模态框 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>创建新客户</h3>
          <button class="close-btn" @click="closeCreateModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="createCustomer">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">客户名称 *</label>
                <input v-model="newCustomerForm.name" class="form-input" required />
              </div>

              <div class="form-group">
                <label class="form-label">客户类型 *</label>
                <select v-model="newCustomerForm.type" class="form-select" required>
                  <option value="">请选择</option>
                  <option value="enterprise">企业客户</option>
                  <option value="individual">个人客户</option>
                  <option value="government">政府客户</option>
                  <option value="education">教育机构</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">客户等级</label>
                <select v-model="newCustomerForm.level" class="form-select">
                  <option value="normal">普通</option>
                  <option value="vip">VIP</option>
                  <option value="premium">高级</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">所属区域</label>
                <select v-model="newCustomerForm.regionId" class="form-select" required>
                  <option value="">请选择</option>
                  <option v-for="region in regions" :key="region.value" :value="region.value">
                    {{ region.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-group full-width">
              <label class="form-label">联系人 *</label>
              <input v-model="newCustomerForm.contactPerson" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label">联系电话 *</label>
              <input v-model="newCustomerForm.phone" class="form-input" required type="tel" />
            </div>

            <div class="form-group">
              <label class="form-label">邮箱</label>
              <input v-model="newCustomerForm.email" class="form-input" type="email" />
            </div>

            <div class="form-group full-width">
              <label class="form-label">详细地址</label>
              <textarea v-model="newCustomerForm.address" class="form-textarea" rows="3"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">所属销售</label>
              <select v-model="newCustomerForm.salesPersonId" class="form-select" required>
                <option value="">请选择</option>
                <option v-for="salesPerson in salesPersons" :key="salesPerson.id" :value="salesPerson.id">
                  {{ salesPerson.name }}
                </option>
              </select>
            </div>

            <div class="form-group full-width">
              <label class="form-label">备注说明</label>
              <textarea v-model="newCustomerForm.remark" class="form-textarea" rows="3" placeholder="输入客户备注..."></textarea>
            </div>
          </form>

          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeCreateModal">
              取消
            </button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              <i class="fas fa-save" v-if="!isSubmitting"></i>
              <i class="fas fa-spinner fa-spin" v-else></i>
              {{ isSubmitting ? '创建中...' : '创建客户' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CustomerApi from '@/api/customer'

// 接口定义
interface Customer {
  id: string
  name: string
  code: string
  type: string
  level: string
  email?: string
  phone?: string
  address?: string
  avatar?: string
  salesPersonId: string
  totalOrders: number
  totalAmount: number
  avgOrderValue: number
  tags: string[]
  isHighValue: boolean
  createdAt: string
  updatedAt: string
}

interface CustomerType {
  value: string
  label: string
}

interface CustomerLevel {
  value: string
  label: string
}

interface Region {
  value: string
  name: string
}

interface SalesPerson {
  id: string
  name: string
}

interface NewCustomerForm {
  name: string
  type: string
  level: string
  contactPerson: string
  phone: string
  email: string
  address: string
  regionId: string
  salesPersonId: string
  remark: string
}

// Props & Emits
const props = defineProps<{
  preSelectedId?: string
  maxSelection?: number
}>()

const emit = defineEmits<{
  customerSelected: [customer: Customer]
}>()

// 响应式数据
const isLoading = ref(false)
const showFilters = ref(false)
const showCreateModal = ref(false)
const customers = ref<Customer[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalCustomers = ref(0)
const searchQuery = ref('')
const selectedTypes = ref<string[]>([])
const selectedLevels = ref<string[]>([])
const selectedRegion = ref('')
const isSubmitting = ref(false)

const selectedCustomerId = ref(props.preSelectedId || '')

const newCustomerForm = reactive<NewCustomerForm>({
  name: '',
  type: '',
  level: 'normal',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  regionId: '',
  salesPersonId: '',
  remark: ''
})

const customerTypes = ref<CustomerType[]>([
  { value: 'enterprise', label: '企业客户' },
  { value: 'individual', label: '个人客户' },
  { value: 'government', label: '政府客户' },
  { value: 'education', label: '教育机构' }
])

const customerLevels = ref<CustomerLevel[]>([
  { value: 'normal', label: '普通' },
  { value: 'vip', label: 'VIP' },
  { value: 'premium', label: '高级' }
])

const regions = ref<Region[]>([])
const salesPersons = ref<SalesPerson[]>([])

// 计算属性
const filteredCustomers = computed(() => {
  let filtered = customers.value

  // 类型筛选
  if (selectedTypes.value.length > 0) {
    filtered = filtered.filter(customer => selectedTypes.value.includes(customer.type))
  }

  // 等级筛选
  if (selectedLevels.value.length > 0) {
    filtered = filtered.filter(customer => selectedLevels.value.includes(customer.level))
  }

  // 区域筛选
  if (selectedRegion.value) {
    filtered = filtered.filter(customer => customer.regionId === selectedRegion.value)
  }

  // 搜索筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(customer =>
      customer.name.toLowerCase().includes(query) ||
      customer.code.toLowerCase().includes(query) ||
      customer.phone?.includes(query) ||
      customer.email?.toLowerCase().includes(query)
    )
  }

  return filtered
})

const hasMore = computed(() => {
  return customers.value.length < totalCustomers.value
})

// 方法
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

const isNewCustomer = (dateString: string): boolean => {
  const createdDate = new Date(dateString)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  return createdDate >= thirtyDaysAgo
}

const isSelected = (customerId: string): boolean => {
  return selectedCustomerId.value === customerId
}

const selectCustomer = (customer: Customer) => {
  selectedCustomerId.value = customer.id
  emit('customerSelected', customer)
}

const viewCustomerDetail = (customer: Customer) => {
  // 可以跳转到客户详情页面或打开详情模态框
  console.log('查看客户详情:', customer)
  ElMessage.info(`查看客户: ${customer.name}`)
}

const contactCustomer = (customer: Customer) => {
  const phone = customer.phone || customer.email
  if (phone) {
    window.open(`tel:${phone}`)
  } else {
    window.open(`mailto:${customer.email}`)
  }
}

const confirmSelection = (customer: Customer) => {
  emit('customerSelected', customer)
}

const loadMoreCustomers = async () => {
  if (isLoading.value || !hasMore.value) return

  isLoading.value = true
  try {
    const response = await CustomerApi.getCustomers({
      page: currentPage.value + 1,
      pageSize: pageSize.value,
      types: selectedTypes.value,
      levels: selectedLevels.value,
      regionId: selectedRegion.value,
      search: searchQuery.value
    })

    if (response.success) {
      customers.value.push(...response.data)
      totalCustomers.value = response.total
      currentPage.value++
    }
  } catch (error) {
    ElMessage.error('加载更多客户失败')
  } finally {
    isLoading.value = false
  }
}

const refreshCustomers = async () => {
  currentPage.value = 1
  loadCustomers()
}

const applyFilters = () => {
  currentPage.value = 1
  loadCustomers()
}

const handleSearch = () => {
  currentPage.value = 1
  loadCustomers()
}

const loadCustomers = async () => {
  isLoading.value = true
  try {
    const response = await CustomerApi.getCustomers({
      page: currentPage.value,
      pageSize: pageSize.value,
      types: selectedTypes.value,
      levels: selectedLevels.value,
      regionId: selectedRegion.value,
      search: searchQuery.value
    })

    if (response.success) {
      customers.value = response.data
      totalCustomers.value = response.total
    }
  } catch (error) {
    ElMessage.error('加载客户列表失败')
  } finally {
      isLoading.value = false
  }
}

const loadRegions = async () => {
  try {
    const response = await CustomerApi.getRegions()
    if (response.success) {
      regions.value = response.data
    }
  } catch (error) {
    console.error('加载区域列表失败:', error)
  }
}

const loadSalesPersons = async () => {
  try {
    const response = await CustomerApi.getSalesPersons()
    if (response.success) {
      salesPersons.value = response.data
    }
  } catch (error) {
    console.error('加载销售人员列表失败:', error)
  }
}

const closeCreateModal = () => {
  showCreateModal.value = false
  Object.assign(newCustomerForm, {
    name: '',
    type: '',
    level: 'normal',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    regionId: '',
    salesPersonId: '',
    remark: ''
  })
}

const createCustomer = async () => {
  try {
    isSubmitting.value = true

    // 验证必填字段
    if (!newCustomerForm.name.trim()) {
      ElMessage.error('请输入客户名称')
      return
    }

    if (!newCustomerForm.contactPerson.trim()) {
      ElMessage.error('请输入联系人姓名')
      return
    }

    if (!newCustomerForm.phone.trim()) {
      ElMessage.error('请输入联系电话')
      return
    }

    if (!newCustomerForm.regionId) {
      ElMessage.error('请选择所属区域')
      return
    }

    const response = await CustomerApi.createCustomer(newCustomerForm)
    
    if (response.success) {
      ElMessage.success('客户创建成功')
      closeCreateModal()
      refreshCustomers()
    }
  } catch (error) {
    ElMessage.error('创建客户失败')
  } finally {
    isSubmitting.value = false
  }
}

// 初始化
onMounted(() => {
  if (props.preSelectedId) {
    selectedCustomerId.value = props.preSelectedId
  }
  
  loadCustomers()
  loadRegions()
  loadSalesPersons()
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

.customer-selector {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  overflow: hidden;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px 24px;
  background: linear-gradient(135deg, var(--color-teal), var(--color-slate));
  color: white;
}

.header-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title i {
  font-size: 1.25rem;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-filter, .btn-create, .btn-refresh {
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
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

.btn-filter:hover, .btn-create:hover, .btn-refresh:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 筛选面板 */
.filter-panel {
  padding: 24px;
  background: var(--color-off-white);
  border-bottom: 1px solid var(--color-gray-light);
}

.filter-section {
  margin-bottom: 24px;
}

.filter-section h4 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0 0 16px 0;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  padding: 8px 16px;
  border: 1px solid var(--color-gray-light);
  border-radius: 20px;
  font-family: var(--font-body);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.filter-chip:hover {
  border-color: var(--color-teal);
}

.filter-chip input[type="checkbox"] {
  display: none;
}

.filter-chip input:checked + span {
  background: var(--color-teal);
  color: white;
}

.filter-chip input:checked + span::before {
  background: var(--color-teal);
}

.search-bar {
  position: relative;
}

.search-bar i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-medium);
  font-size: 14px;
}

.search-bar input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-bar input:focus {
  outline: none;
  border-color: var(--color-teal);
  box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1);
}

.filter-section select {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 14px;
}

/* 客户容器 */
.customers-container {
  padding: 24px;
  max-height: 600px;
  overflow-y: auto;
}

.customers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.customer-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.customer-card:hover {
  transform: translateY(-4px) rotate(-1deg);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  border-color: var(--color-teal);
}

.customer-card.selected {
  border-color: var(--color-teal);
  background: rgba(56, 178, 172, 0.05);
  box-shadow: 0 8px 16px rgba(56, 178, 172, 0.2);
}

.customer-card.vip::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, var(--color-orange), #FBD38D);
}

.customer-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 16px;
}

.customer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-teal), var(--color-slate));
  color: white;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
}

.customer-info {
  flex: 1;
  min-width: 0;
}

.customer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.customer-name {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0;
  line-height: 1.2;
}

.customer-badges {
  display: flex;
  gap: 6px;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge.vip {
  background: linear-gradient(135deg, var(--color-orange), #FBD38D);
  color: white;
}

.badge.new {
  background: var(--color-success);
  color: white;
}

.badge.high-value {
  background: var(--color-warning);
  color: white;
}

.customer-contact {
  margin-bottom: 12px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-gray-medium);
}

.contact-item i {
  color: var(--color-teal);
  width: 14px;
}

.customer-meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-value {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-slate);
}

.customer-stats {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: var(--color-off-white);
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-slate);
}

.stat-value.primary {
  color: var(--color-teal);
}

.customer-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 8px;
  background: var(--color-gray-light);
  border-radius: 4px;
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
}

.customer-actions {
  display: flex;
  gap: 8px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.02);
  border-top: 1px solid var(--color-gray-light);
}

.btn-secondary, .btn-primary {
  padding: 8px 16px;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  flex: 1;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-gray-light);
  color: var(--color-slate);
}

.btn-secondary:hover {
  border-color: var(--color-teal);
  color: var(--color-teal);
}

.btn-primary {
  background: var(--color-teal);
  border: none;
  color: white;
}

.btn-primary:hover {
  background: var(--color-slate);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--color-gray-light);
}

.modal-header h3 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-gray-medium);
  font-size: 18px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--color-slate);
  background: var(--color-gray-light);
}

.modal-body {
  padding: 32px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group.full-width {
  grid-column: span 2;
}

.form-label {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-slate);
  margin-bottom: 8px;
  display: block;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--color-teal);
  box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

/* 加载状态 */
.loading-more {
  text-align: center;
  padding: 24px;
  color: var(--color-gray-medium);
}

.loading-more i {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.loading-more span {
  font-family: var(--font-body);
  font-size: 14px;
}

.load-more {
  text-align: center;
  padding: 16px;
}

.btn-load {
  padding: 12px 24px;
  background: var(--color-teal);
  border: none;
  border-radius: 8px;
  color: white;
  font-family: var(--font-body);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-load:hover {
  background: var(--color-slate);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .selector-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .filter-options {
    justify-content: center;
  }
  
  .customers-grid {
    grid-template-columns: 1fr;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-group.full-width {
    grid-column: span 1;
  }
  
  .customer-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .customer-actions {
    flex-direction: column;
  }
  
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }
  
  .modal-body {
    padding: 20px;
  }
}
</style>