<template>
  <div class="supplier-selector">
    <div class="selector-header">
      <div class="search-container">
        <input
          v-model="searchKeyword"
          type="text"
          :placeholder="placeholder"
          class="search-input"
          @input="handleSearch"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <i v-if="!searchKeyword" class="fas fa-search search-icon"></i>
        <i v-else class="fas fa-times clear-icon" @click="clearSearch"></i>
      </div>
      
      <div v-if="showTypeFilter" class="type-filter">
        <select v-model="selectedType" class="type-select" @change="handleTypeChange">
          <option value="">全部类型</option>
          <option
            v-for="type in supplierTypes"
            :key="type.value"
            :value="type.value"
          >
            {{ type.label }}
          </option>
        </select>
      </div>

      <div v-if="showStatusFilter" class="status-filter">
        <select v-model="selectedStatus" class="status-select" @change="handleStatusChange">
          <option value="">全部状态</option>
          <option
            v-for="status in supplierStatuses"
            :key="status.value"
            :value="status.value"
          >
            {{ status.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>加载中...</span>
      </div>
    </div>

    <!-- 供应商列表 -->
    <div v-else class="supplier-list">
      <div
        v-for="supplier in filteredSuppliers"
        :key="supplier.id"
        class="supplier-item"
        :class="{ 
          'supplier-item--selected': selectedSupplier?.id === supplier.id,
          'supplier-item--disabled': supplier.disabled
        }"
        @click="handleSelectSupplier(supplier)"
      >
        <div class="supplier-info">
          <div class="supplier-header">
            <div class="supplier-name">
              {{ supplier.name }}
              <span 
                v-if="supplier.certified" 
                class="certified-badge"
                title="认证供应商"
              >
                <i class="fas fa-certificate"></i>
              </span>
            </div>
            <div class="supplier-code">{{ supplier.code }}</div>
          </div>
          
          <div class="supplier-details">
            <div class="detail-item" v-if="supplier.contact">
              <i class="fas fa-user detail-icon"></i>
              <span>{{ supplier.contact }}</span>
            </div>
            <div class="detail-item" v-if="supplier.phone">
              <i class="fas fa-phone detail-icon"></i>
              <span>{{ supplier.phone }}</span>
            </div>
            <div class="detail-item" v-if="supplier.email">
              <i class="fas fa-envelope detail-icon"></i>
              <span>{{ supplier.email }}</span>
            </div>
            <div class="detail-item" v-if="supplier.address">
              <i class="fas fa-map-marker-alt detail-icon"></i>
              <span>{{ supplier.address }}</span>
            </div>
          </div>

          <div class="supplier-tags">
            <span 
              class="type-tag"
              :class="getTypeClass(supplier.type)"
            >
              {{ getTypeText(supplier.type) }}
            </span>
            <span 
              v-if="supplier.status"
              class="status-tag"
              :class="getStatusClass(supplier.status)"
            >
              {{ getStatusText(supplier.status) }}
            </span>
            <span 
              v-if="supplier.rating"
              class="rating-tag"
              :class="getRatingClass(supplier.rating)"
            >
              <i class="fas fa-star" v-for="star in 5" :key="star" :class="{ filled: star <= supplier.rating }"></i>
              <span class="rating-text">{{ supplier.rating.toFixed(1) }}</span>
            </span>
          </div>

          <div v-if="supplier.description" class="supplier-description">
            <p>{{ supplier.description }}</p>
          </div>
        </div>

        <div class="supplier-actions" v-if="showActions">
          <button 
            class="action-btn view-btn"
            @click.stop="handleViewSupplier(supplier)"
            title="查看详情"
          >
            <i class="fas fa-eye"></i>
          </button>
          <button 
            v-if="canSelect"
            class="action-btn select-btn"
            @click.stop="handleSelectSupplier(supplier)"
            :class="{ 'action-btn--selected': selectedSupplier?.id === supplier.id }"
            :title="selectedSupplier?.id === supplier.id ? '取消选择' : '选择供应商'"
          >
            <i class="fas" :class="selectedSupplier?.id === supplier.id ? 'fa-check-circle' : 'fa-plus-circle'"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && filteredSuppliers.length === 0" class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-search"></i>
      </div>
      <div class="empty-text">
        <p>{{ emptyText }}</p>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="showPagination && totalPages > 1" class="pagination">
      <button 
        class="pagination-btn"
        @click="currentPage--"
        :disabled="currentPage <= 1"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      
      <div class="pagination-pages">
        <button 
          v-for="page in visiblePages"
          :key="page"
          class="pagination-page-btn"
          :class="{ active: currentPage === page }"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
      </div>
      
      <button 
        class="pagination-btn"
        @click="currentPage++"
        :disabled="currentPage >= totalPages"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

interface Supplier {
  id: string
  name: string
  code: string
  type: string
  status: string
  contact?: string
  phone?: string
  email?: string
  address?: string
  description?: string
  rating?: number
  certified?: boolean
  disabled?: boolean
}

interface Props {
  modelValue?: Supplier | null
  suppliers?: Supplier[]
  placeholder?: string
  canSelect?: boolean
  showActions?: boolean
  showTypeFilter?: boolean
  showStatusFilter?: boolean
  showPagination?: boolean
  pageSize?: number
  emptyText?: string
  searchPlaceholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  suppliers: () => [],
  placeholder: '搜索供应商',
  canSelect: true,
  showActions: true,
  showTypeFilter: true,
  showStatusFilter: true,
  showPagination: true,
  pageSize: 20,
  emptyText: '暂无供应商数据',
  searchPlaceholder: '输入供应商名称、编码或联系人搜索'
})

const emit = defineEmits<{
  'update:modelValue': [value: Supplier | null]
  'select': [supplier: Supplier]
  'view': [supplier: Supplier]
  'focus': []
  'blur': []
}>()

// 响应式数据
const searchKeyword = ref('')
const selectedType = ref('')
const selectedStatus = ref('')
const currentPage = ref(1)
const isFocused = ref(false)
const loading = ref(false)

// 供应商类型配置
const supplierTypes = [
  { value: 'MANUFACTURER', label: '制造商' },
  { value: 'DISTRIBUTOR', label: '经销商' },
  { value: 'SERVICE_PROVIDER', label: '服务商' },
  { { value: 'MATERIAL', label: '原材料供应商' },
  { value: 'OTHER', label: '其他' }
]

const supplierStatuses = [
  { value: 'ACTIVE', label: '活跃' },
  { value: 'INACTIVE', label: '非活跃' },
  { value: 'SUSPENDED', label: '暂停合作' },
  { value: 'DISABLED', label: '已禁用' }
]

// 计算属性
const selectedSupplier = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const filteredSuppliers = computed(() => {
  let result = props.suppliers

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(supplier => 
      supplier.name.toLowerCase().includes(keyword) ||
      supplier.code.toLowerCase().includes(keyword) ||
      supplier.contact?.toLowerCase().includes(keyword) ||
      supplier.phone?.includes(keyword) ||
      supplier.email?.toLowerCase().includes(keyword)
    )
  }

  // 类型筛选
  if (selectedType.value) {
    result = result.filter(supplier => supplier.type === selectedType.value)
  }

  // 状态筛选
  if (selectedStatus.value) {
    result = result.filter(supplier => supplier.status === selectedStatus.value)
  }

  // 分页
  if (props.showPagination) {
    const start = (currentPage.value - 1) * props.pageSize
    const end = start + props.pageSize
    result = result.slice(start, end)
  }

  return result
})

const totalPages = computed(() => {
  if (!props.showPagination) return 1
  return Math.ceil(props.suppliers.length / props.pageSize)
})

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// 方法
const handleSearch = () => {
  currentPage.value = 1
}

const clearSearch = () => {
  searchKeyword.value = ''
  currentPage.value = 1
}

const handleTypeChange = () => {
  currentPage.value = 1
}

const handleStatusChange = () => {
  currentPage.value = 1
}

const handleFocus = () => {
  isFocused.value = true
  emit('focus')
}

const handleBlur = () => {
  isFocused.value = false
  emit('blur')
}

const handleSelectSupplier = (supplier) => {
  if (supplier.disabled) return
  
  if (props.canSelect) {
    selectedSupplier.value = selectedSupplier.value?.id === supplier.id ? null : supplier
    emit('select', supplier)
  }
}

const handleViewSupplier = (supplier) => {
  emit('view', supplier)
}

// 样式类获取方法
const getTypeClass = (type: string) => {
  const classMap = {
    'MANUFACTURER': 'type-manufacturer',
    'DISTRIBUTOR': 'type-distributor',
    'SERVICE_PROVIDER': 'type-service',
    'MATERIAL': 'type-material',
    'OTHER': 'type-other'
  }
  return classMap[type] || 'type-other'
}

const getStatusClass = (status: string) => {
  const classMap = {
    'ACTIVE': 'status-active',
    'INACTIVE': 'status-inactive',
    'SUSPENDED': 'status-suspended',
    'DISABLED': 'status-disabled'
  }
  return classMap[status] || 'status-default'
}

const getRatingClass = (rating: number) => {
  if (rating >= 4.5) return 'rating-excellent'
  if (rating >= 3.5) return 'rating-good'
  if (rating >= 2.5) return 'rating-average'
  return 'rating-poor'
}

const getTypeText = (type: string) => {
  const typeMap = {
    'MANUFACTURER': '制造商',
    'DISTRIBUTOR': '经销商',
    'SERVICE_PROVIDER': '服务商',
    'MATERIAL': '原材料供应商',
    'OTHER': '其他'
  }
  return typeMap[type] || type
}

const getStatusText = (status: string) => {
  const statusMap = {
    'ACTIVE': '活跃',
    'INACTIVE': '非活跃',
    'SUSPENDED': '暂停合作',
    'DISABLED': '已禁用'
  }
  return statusMap[status] || status
}

// 监听外部变化
watch(() => props.suppliers, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.supplier-selector {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(237, 137, 54, 0.1);
  font-family: 'Space Mono', monospace;
  color: #1a202c;
}

/* 头部区域 */
.selector-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(237, 137, 54, 0.1);
  background: rgba(247, 250, 252, 0.8);
}

.search-container {
  flex: 1;
  position: relative;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 3rem;
  border: 1px solid rgba(203, 213, 224, 0.8);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  transition: all 0.2s;
  font-family: 'Space Mono', monospace;
}

.search-input:focus {
  outline: none;
  border-color: rgba(237, 137, 54, 0.5);
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 0 0 3px rgba(237, 137, 54, 0.1);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: #a0aec0;
  pointer-events: none;
  transition: color 0.2s;
}

.clear-icon {
  position: absolute;
  left: 0.75rem;
  color: #a0aec0;
  cursor: pointer;
  transition: color 0.2s;
}

.clear-icon:hover {
  color: #e53e3e;
}

.type-filter,
.status-filter {
  min-width: 140px;
}

.type-select,
.status-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(203, 213, 224, 0.8);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  transition: all 0.2s;
  font-family: 'Space Mono', monospace;
  cursor: pointer;
}

.type-select:focus,
.status-select:focus {
  outline: none;
  border-color: rgba(237, 137, 54, 0.5);
  background: rgba(255, 255, 255, 1);
}

/* 加载状态 */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  min-height: 200px;
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #718096;
  font-size: 0.875rem;
}

.loading-spinner i {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 供应商列表 */
.supplier-list {
  max-height: 400px;
  overflow-y: auto;
}

.supplier-item {
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid rgba(237, 137, 54, 0.05);
  transition: all 0.2s;
  cursor: pointer;
  position: relative;
}

.supplier-item:hover:not(.supplier-item--disabled) {
  background: rgba(237, 137, 54, 0.02);
}

.supplier-item--selected {
  background: rgba(237, 137, 54, 0.05);
  border-color: rgba(237, 137, 54, 0.2);
}

.supplier-item--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: rgba(243, 244, 246, 0.5);
}

.supplier-info {
  flex: 1;
  min-width: 0;
}

.supplier-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.supplier-name {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  font-size: 1rem;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.certified-badge {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.625rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.supplier-code {
  font-size: 0.75rem;
  color: #718096;
  font-family: 'Space Mono', monospace;
  background: rgba(203, 213, 224, 0.1);
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.supplier-details {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #4a5568;
  line-height: 1.4;
}

.detail-icon {
  width: 14px;
  height: 14px;
  color: #a0aec0;
  flex-shrink: 0;
}

.supplier-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 0.75rem;
}

.type-tag,
.status-tag {
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.type-manufacturer {
  background: rgba(66, 153, 225, 0.1);
  color: #4299e1;
}

.type-distributor {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.type-service {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
}

.type-material {
  background: rgba(56, 178, 172, 0.1);
  color: #38b2ac;
}

.type-other {
  background: rgba(160, 174, 192, 0.1);
  color: #a0aec0;
}

.status-active {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
}

.status-inactive {
  background: rgba(203, 213, 224, 0.1);
  color: #718096;
}

.status-suspended {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.status-disabled {
  background: rgba(243, 244, 246, 0.1);
  color: #a0aec0;
}

.rating-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.rating-excellent {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
}

.rating-good {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
}

.rating-average {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.rating-poor {
  background: rgba(229, 62, 62, 0.1);
  color: #e53e3e;
}

.rating-text {
  font-size: 0.75rem;
  margin-left: 0.25rem;
}

.rating-tag .fas {
  font-size: 0.625rem;
}

.rating-tag .fas.filled {
  color: #f6e05e;
}

.rating-tag .fas:not(.filled) {
  color: rgba(246, 248, 250, 0.3);
}

.supplier-description {
  margin-bottom: 0.5rem;
}

.supplier-description p {
  margin: 0;
  color: #4a5568;
  font-size: 0.8125rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.supplier-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.8);
  color: #4a5568;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.action-btn:hover:not(.action-btn--selected) {
  background: rgba(237, 137, 54, 0.05);
  color: #ed8936;
}

.action-btn--selected {
  background: #ed8936;
  color: white;
  border-color: #ed8936;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #718096;
  background: rgba(247, 250, 252, 0.5);
  border-radius: 8px;
  margin: 1rem;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #a0aec0;
}

.empty-text {
  font-size: 0.875rem;
  line-height: 1.4;
}

.empty-text p {
  margin: 0;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid rgba(237, 137, 54, 0.05);
  background: rgba(247, 250, 252, 0.8);
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(203, 213, 224, 0.5);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.8);
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(237, 137, 54, 0.05);
  color: #ed8936;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-pages {
  display: flex;
  gap: 0.25rem;
}

.pagination-page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  border: 1px solid rgba(203, 213, 224, 0.5);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.8);
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.8125rem;
  font-weight: 500;
}

.pagination-page-btn:hover {
  background: rgba(237, 137, 54, 0.05);
  color: #ed8936;
}

.pagination-page-btn.active {
  background: #ed8936;
  color: white;
  border-color: #ed8936;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .selector-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .search-container {
    max-width: 100%;
  }

  .type-filter,
  .status-filter {
    min-width: auto;
  }

  .supplier-item {
    padding: 0.75rem;
  }

  .supplier-details {
    gap: 0.25rem;
  }

  .supplier-actions {
    flex-direction: row;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .supplier-info {
    min-width: 0;
  }

  .supplier-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    margin-bottom: 0.25rem;
  }

  .supplier-name {
    font-size: 0.875rem;
  }

  .supplier-code {
    font-size: 0.6875rem;
  }

  .supplier-details {
    display: none;
  }

  .supplier-description {
    display: none;
  }

  .supplier-tags {
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }

  .supplier-actions {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>