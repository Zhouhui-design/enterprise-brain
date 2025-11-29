<template>
  <div class="product-selector">
    <div class="selector-header">
      <h3 class="header-title">
        <i class="fas fa-cube"></i>
        产品选择器
      </h3>
      <div class="header-actions">
        <button class="btn-filter" @click="showFilters = !showFilters">
          <i class="fas fa-filter"></i>
          筛选
        </button>
        <button class="btn-refresh" @click="refreshProducts" :disabled="isLoading">
          <i class="fas fa-sync-alt" :class="{ 'spinning': isLoading }"></i>
          刷新
        </button>
      </div>
    </div>

    <!-- 筛选面板 -->
    <div v-if="showFilters" class="filter-panel">
      <div class="filter-section">
        <h4>产品分类</h4>
        <div class="category-filters">
          <button 
            v-for="category in categories" 
            :key="category.id"
            class="filter-chip"
            :class="{ active: selectedCategories.includes(category.id) }"
            @click="toggleCategory(category.id)"
          >
            {{ category.name }}
          </button>
        </div>
      </div>
      
      <div class="filter-section">
        <h4>库存状态</h4>
        <div class="stock-filters">
          <button 
            v-for="status in stockStatuses" 
            :key="status.value"
            class="filter-chip"
            :class="{ active: selectedStockStatus === status.value }"
            @click="selectedStockStatus = status.value"
          >
            {{ status.label }}
          </button>
        </div>
      </div>
      
      <div class="filter-section">
        <h4>搜索产品</h4>
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="输入产品名称或编码..."
            @input="handleSearch"
          />
        </div>
      </div>
    </div>

    <!-- 产品列表 -->
    <div class="products-container">
      <div class="products-grid">
        <div 
          v-for="product in filteredProducts" 
          :key="product.id"
          class="product-card"
          :class="{ selected: isSelected(product.id), 'low-stock': product.stock <= product.minStock }"
          @click="selectProduct(product)"
        >
          <div class="product-image">
            <img :src="product.image" :alt="product.name" />
            <div class="product-badge" v-if="product.isNew">新品</div>
            <div class="stock-indicator" :class="getStockClass(product)">
              {{ getStockText(product) }}
            </div>
          </div>
          
          <div class="product-info">
            <h4 class="product-name">{{ product.name }}</h4>
            <p class="product-code">编码: {{ product.code }}</p>
            <p class="product-description">{{ product.description }}</p>
            
            <div class="product-meta">
              <span class="meta-item">
                <i class="fas fa-layer-group"></i>
                {{ getCategoryName(product.category) }}
              </span>
              <span class="meta-item">
                <i class="fas fa-tag"></i>
                {{ product.unit }}
              </span>
            </div>
          </div>
          
          <div class="product-pricing">
            <div class="price-info">
              <span class="price-label">参考价格</span>
              <span class="price-value">¥{{ product.unitPrice.toFixed(2) }}</span>
            </div>
            <div class="price-info" v-if="product.discountPrice">
              <span class="price-label">优惠价格</span>
              <span class="price-value discount">¥{{ product.discountPrice.toFixed(2) }}</span>
            </div>
          </div>
          
          <div class="product-stock">
            <div class="stock-info">
              <span class="stock-label">库存</span>
              <span class="stock-value" :class="getStockClass(product)">
                {{ product.stock }} {{ product.unit }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="selection-actions">
          <div class="quantity-selector">
            <label>数量</label>
            <input 
              v-model.number="product.quantity" 
              type="number" 
              min="1"
              :max="product.stock"
              @input="updateQuantity(product)"
              @click.stop
            />
          </div>
          
          <div class="product-total">
            <span class="total-label">小计</span>
            <span class="total-value">
              ¥{{ (product.quantity * (product.discountPrice || product.unitPrice)).toFixed(2) }}
            </span>
          </div>
          
          <button 
            class="btn-remove"
            @click.stop="removeProduct(product.id)"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <!-- 加载更多 -->
      <div v-if="isLoading" class="loading-more">
        <i class="fas fa-spinner fa-spin"></i>
        <span>加载更多产品...</span>
      </div>
    </div>
    
    <!-- 已选产品摘要 -->
    <div class="selection-summary" v-if="selectedProducts.length > 0">
      <div class="summary-header">
        <h3>已选产品</h3>
        <button class="btn-clear" @click="clearSelection">
          清空
        </button>
      </div>
      
      <div class="summary-content">
        <div class="summary-products">
          <div 
            v-for="item in selectedProducts" 
            :key="item.id"
            class="summary-item"
          >
            <div class="item-info">
              <h5>{{ item.name }}</h5>
              <p>{{ item.code }}</p>
            </div>
            <div class="item-quantity">×{{ item.quantity }}</div>
            <div class="item-total">¥{{ (item.quantity * (item.discountPrice || item.unitPrice)).toFixed(2) }}</div>
          </div>
        </div>
      </div>
      
      <div class="summary-totals">
        <div class="total-item">
          <span class="total-label">产品数量</span>
          <span class="total-value">{{ selectedProducts.length }}</span>
        </div>
        <div class="total-item">
          <span class="total-label">总金额</span>
          <span class="total-value primary">¥{{ totalAmount.toFixed(2) }}</span>
        </div>
        <div class="total-item" v-if="totalDiscount > 0">
          <span class="total-label">优惠金额</span>
          <span class="total-value discount">-¥{{ totalDiscount.toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import ProductApi from '@/api/product'

// 接口定义
interface Product {
  id: string
  name: string
  code: string
  description: string
  category: string
  unit: string
  unitPrice: number
  discountPrice?: number
  stock: number
  minStock: number
  image: string
  isNew?: boolean
  isHot?: boolean
}

interface ProductCategory {
  id: string
  name: string
}

interface StockStatus {
  value: string
  label: string
}

// Props & Emits
const props = defineProps<{
  maxSelection?: number
  initialSelection?: Product[]
}>()

const emit = defineEmits<{
  productsSelected: [products: Product[]]
}>()

// 响应式数据
const isLoading = ref(false)
const showFilters = ref(false)
const searchQuery = ref('')
const selectedCategories = ref<string[]>([])
const selectedStockStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const selectedProducts = ref<Product[]>([])

const products = ref<Product[]>([])
const categories = ref<ProductCategory[]>([])
const totalProducts = ref(0)

const stockStatuses = ref<StockStatus[]>([
  { value: '', label: '全部' },
  { value: 'in_stock', label: '有货' },
  { value: 'low_stock', label: '库存不足' },
  { value: 'out_of_stock', label: '缺货' }
])

// 计算属性
const filteredProducts = computed(() => {
  let filtered = products.value

  // 分类筛选
  if (selectedCategories.value.length > 0) {
    filtered = filtered.filter(p => selectedCategories.value.includes(p.category))
  }

  // 库存状态筛选
  if (selectedStockStatus.value) {
    filtered = filtered.filter(p => {
      if (selectedStockStatus.value === 'in_stock') {
        return p.stock > p.minStock
      } else if (selectedStockStatus.value === 'low_stock') {
        return p.stock > 0 && p.stock <= p.minStock
      } else if (selectedStockStatus.value === 'out_of_stock') {
        return p.stock === 0
      }
      return true
    })
  }

  // 搜索筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    )
  }

  return filtered
})

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredProducts.value.slice(start, end)
})

const totalAmount = computed(() => {
  return selectedProducts.value.reduce((sum, item) => {
    const price = item.discountPrice || item.unitPrice
    return sum + (item.quantity * price)
  }, 0)
})

const totalDiscount = computed(() => {
  return selectedProducts.value.reduce((sum, item) => {
    if (!item.discountPrice) return sum
    const discount = (item.unitPrice - item.discountPrice) * item.quantity
    return sum + discount
  }, 0)
})

// 方法
const getCategoryName = (categoryId: string): string => {
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : categoryId
}

const getStockClass = (product: Product): string => {
  if (product.stock === 0) return 'out-of-stock'
  if (product.stock <= product.minStock) return 'low-stock'
  return 'in-stock'
}

const getStockText = (product: Product): string => {
  if (product.stock === 0) return '缺货'
  if (product.stock <= product.minStock) return '库存不足'
  return '有货'
}

const isSelected = (productId: string): boolean => {
  return selectedProducts.value.some(p => p.id === productId)
}

const toggleCategory = (categoryId: string) => {
  const index = selectedCategories.value.indexOf(categoryId)
  if (index > -1) {
    selectedCategories.value.splice(index, 1)
  } else {
    selectedCategories.value.push(categoryId)
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const selectProduct = (product: Product) => {
  if (product.stock === 0) {
    ElMessage.warning('该产品库存不足')
    return
  }

  const existingIndex = selectedProducts.value.findIndex(p => p.id === product.id)
  
  if (existingIndex > -1) {
    selectedProducts.value[existingIndex].quantity++
  } else {
    selectedProducts.value.push({
      ...product,
      quantity: 1
    })
    
    // 检查最大选择数量
    if (props.maxSelection && selectedProducts.value.length > props.maxSelection) {
      ElMessage.warning(`最多只能选择${props.maxSelection}个产品`)
      selectedProducts.value.pop()
      return
    }
  }
}

const updateQuantity = (product: Product & { quantity: number }) => {
  if (product.quantity < 0) {
    product.quantity = 0
  }
  if (product.quantity > product.stock) {
    product.quantity = product.stock
    ElMessage.warning('数量不能超过库存')
  }
}

const removeProduct = (productId: string) => {
  const index = selectedProducts.value.findIndex(p => p.id === productId)
  if (index > -1) {
    selectedProducts.value.splice(index, 1)
  }
}

const clearSelection = () => {
  selectedProducts.value = []
  if (props.initialSelection) {
    selectedProducts.value = []
  }
}

const refreshProducts = async () => {
  isLoading.value = true
  try {
    await loadProducts()
    ElMessage.success('产品列表已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    isLoading.value = false
  }
}

const loadProducts = async () => {
  try {
    const response = await ProductApi.getProducts({
      page: currentPage.value,
      pageSize: pageSize.value,
      status: 'active'
    })
    
    if (response.success) {
      if (currentPage.value === 1) {
        products.value = response.data
        totalProducts.value = response.total
      } else {
        products.value.push(...response.data)
      }
    }
  } catch (error) {
    ElMessage.error('加载产品失败')
  }
}

const loadCategories = async () => {
  try {
    const response = await ProductApi.getProductCategories()
    if (response.success) {
      categories.value = response.data
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const confirmSelection = () => {
  if (selectedProducts.value.length === 0) {
    ElMessage.warning('请至少选择一个产品')
    return
  }
  
  emit('productsSelected', selectedProducts.value)
}

// 初始化时加载数据
onMounted(() => {
  loadProducts()
  loadCategories()
  
  // 初始化已选择的产品
  if (props.initialSelection) {
    selectedProducts.value = props.initialSelection.map(product => ({
      ...product,
      quantity: 1
    }))
  }
})

// 暴露方法给父组件
defineExpose({
  clearSelection,
  confirmSelection
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

.product-selector {
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
  padding: 24px;
  background: linear-gradient(135deg, var(--color-teal), var(--color-slate));
  color: white;
}

.header-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title i {
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-filter, .btn-refresh {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-family: var(--font-body);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-filter:hover, .btn-refresh:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
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
  background: rgba(248, 250, 252, 0.5);
  border-bottom: 1px solid var(--color-gray-light);
}

.filter-section {
  margin-bottom: 20px;
}

.filter-section h4 {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0 0 12px 0;
}

.category-filters, .stock-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  padding: 8px 16px;
  background: var(--color-off-white);
  border: 1px solid var(--color-gray-light);
  border-radius: 20px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-slate);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-chip:hover {
  border-color: var(--color-teal);
}

.filter-chip.active {
  background: var(--color-teal);
  color: white;
  border-color: var(--color-teal);
}

.search-bar {
  position: relative;
  margin-bottom: 20px;
}

.search-bar i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-medium);
  font-size: 14px;
}

.search-bar input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 1px solid var(--color-gray-light);
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
}

.search-bar input:focus {
  outline: none;
  border-color: var(--color-teal);
  box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1);
}

/* 产品容器 */
.products-container {
  padding: 24px;
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--color-gray-light);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: var(--color-teal);
}

.product-card.selected {
  border-color: var(--color-teal);
  box-shadow: 0 0 0 2px rgba(56, 178, 172, 0.2);
}

.product-card.low-stock {
  border-left: 4px solid var(--color-warning);
}

.product-image {
  position: relative;
  height: 160px;
  background: var(--color-gray-light);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--color-teal);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stock-indicator {
  position: absolute;
  bottom: 8px;
  left: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stock-indicator.in-stock {
  background: var(--color-success);
  color: white;
}

.stock-indicator.low-stock {
  background: var(--color-warning);
  color: white;
}

.stock-indicator.out-of-stock {
  background: var(--color-danger);
  color: white;
}

.product-info {
  padding: 16px;
  min-height: 120px;
}

.product-name {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.product-code {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
  margin: 0 0 4px 0;
}

.product-description {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-gray-medium);
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-meta {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
}

.meta-item i {
  color: var(--color-teal);
  font-size: 12px;
}

.product-pricing {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(56, 178, 172, 0.05);
  border-radius: 0 0 16px 16px;
}

.price-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.price-label {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.price-value {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-slate);
  margin-top: 2px;
}

.price-value.discount {
  color: var(--color-success);
}

.product-stock {
  padding: 12px 16px;
  border-top: 1px solid var(--color-gray-light);
}

.stock-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stock-label {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stock-value {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
}

.stock-value.in-stock {
  color: var(--color-success);
}

.stock-value.low-stock {
  color: var(--color-warning);
}

.stock-value.out-of-stock {
  color: var(--color-danger);
}

.selection-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px;
  background: var(--color-off-white);
  border-top: 1px solid var(--color-gray-light);
}

.quantity-selector {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quantity-selector label {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quantity-selector input {
  padding: 8px 12px;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 14px;
  width: 100%;
}

.product-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.total-label {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.total-value {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-teal);
}

.btn-remove {
  padding: 8px;
  background: var(--color-danger);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-remove:hover {
  background: #E53E3E;
  transform: scale(1.05);
}

.loading-more {
  text-align: center;
  padding: 40px;
  color: var(--color-gray-medium);
}

.loading-more i {
  font-size: 2rem;
  margin-bottom: 8px;
}

/* 已选产品摘要 */
.selection-summary {
  border-top: 2px solid var(--color-teal);
  background: linear-gradient(135deg, var(--color-off-white) 0%, #FFFFFF 100%);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-gray-light);
}

.summary-header h3 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0;
}

.btn-clear {
  padding: 8px 16px;
  background: var(--color-gray-light);
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
  color: var(--color-slate);
  font-family: var(--font-body);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-clear:hover {
  background: var(--color-gray-medium);
  color: white;
}

.summary-content {
  padding: 20px 24px;
}

.summary-products {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-off-white);
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
}

.item-info h5 {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0 0 4px 0;
}

.item-info p {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
  margin: 0;
}

.item-quantity {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-gray-medium);
  background: var(--color-gray-light);
  padding: 4px 8px;
  border-radius: 4px;
}

.item-total {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-teal);
}

.summary-totals {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.total-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, var(--color-teal), var(--color-slate));
  border-radius: 8px;
  color: white;
}

.total-label {
  font-family: var(--font-body);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.9;
}

.total-value {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
}

.total-value.primary {
  color: white;
  font-size: 1.25rem;
}

.total-value.discount {
  color: rgba(255, 255, 255, 0.8);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .product-card {
    margin-bottom: 16px;
  }
  
  .selection-actions {
    grid-template-columns: 1fr;
  }
  
  .summary-totals {
    grid-template-columns: 1fr;
  }
}
</style>