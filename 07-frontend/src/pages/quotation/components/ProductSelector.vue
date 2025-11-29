<template>
  <div class="product-selector">
    <div class="selector-header">
      <div class="header-content">
        <h3 class="header-title">
          <i class="fas fa-box"></i>
          产品选择器
        </h3>
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索产品名称、编码或分类..."
            @input="handleSearch"
          />
        </div>
      </div>
      
      <div class="filter-tabs">
        <button 
          v-for="category in categories" 
          :key="category.key"
          class="filter-tab"
          :class="{ active: selectedCategory === category.key }"
          @click="selectedCategory = category.key"
        >
          <i :class="category.icon"></i>
          {{ category.name }}
          <span class="count">{{ category.count }}</span>
        </button>
      </div>
    </div>

    <div class="selector-content">
      <!-- 产品列表 -->
      <div class="products-grid">
        <div 
          v-for="product in filteredProducts" 
          :key="product.id"
          class="product-card"
          :class="{ selected: isSelected(product.id) }"
          @click="toggleProduct(product)"
        >
          <div class="product-header">
            <div class="product-image">
              <img :src="product.image" :alt="product.name" />
            </div>
            <div class="product-badges">
              <span v-if="product.isNew" class="badge new">新品</span>
              <span v-if="product.isHot" class="badge hot">热销</span>
              <span v-if="product.discount" class="badge discount">-{{ product.discount }}%</span>
            </div>
          </div>
          
          <div class="product-info">
            <h4 class="product-name">{{ product.name }}</h4>
            <p class="product-code">{{ product.code }}</p>
            <p class="product-description">{{ product.description }}</p>
          </div>
          
          <div class="product-pricing">
            <div class="price-info">
              <div class="current-price">
                <span class="currency">¥</span>
                <span class="amount">{{ calculateDiscountedPrice(product).toFixed(2) }}</span>
              </div>
              <div v-if="product.discount" class="original-price">
                ¥{{ product.unitPrice.toFixed(2) }}
              </div>
            </div>
            
            <div class="stock-info">
              <span class="stock-label">库存</span>
              <span 
                class="stock-value" 
                :class="getStockClass(product.stock)"
              >
                {{ product.stock }} {{ product.unit }}
              </span>
            </div>
          </div>
          
          <div class="product-meta">
            <div class="meta-item">
              <i class="fas fa-layer-group"></i>
              <span>{{ getCategoryName(product.category) }}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-cube"></i>
              <span>{{ product.unit }}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-truck"></i>
              <span>{{ product.deliveryTime }}天</span>
            </div>
          </div>
          
          <div class="selection-indicator">
            <i class="fas fa-check"></i>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <div class="pagination-info">
          显示 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredProducts.length) }} 
          共 {{ filteredProducts.length }} 项
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

    <!-- 已选产品面板 -->
    <div class="selected-panel">
      <div class="panel-header">
        <h4 class="panel-title">
          <i class="fas fa-shopping-cart"></i>
          已选产品 ({{ selectedProducts.length }})
        </h4>
        <button class="btn-clear" @click="clearSelection">
          <i class="fas fa-trash"></i>
          清空
        </button>
      </div>
      
      <div class="selected-list">
        <div 
          v-for="(item, index) in selectedProducts" 
          :key="item.id"
          class="selected-item"
        >
          <div class="item-info">
            <img :src="item.image" :alt="item.name" class="item-image" />
            <div class="item-details">
              <h5 class="item-name">{{ item.name }}</h5>
              <p class="item-code">{{ item.code }}</p>
              <div class="item-price">
                <span class="current-price">¥{{ calculateDiscountedPrice(item).toFixed(2) }}</span>
                <span v-if="item.discount" class="original-price">¥{{ item.unitPrice.toFixed(2) }}</span>
              </div>
            </div>
          </div>
          
          <div class="item-quantity">
            <label>数量</label>
            <div class="quantity-controls">
              <button 
                class="quantity-btn" 
                @click="decreaseQuantity(index)"
                :disabled="item.quantity <= 1"
              >
                <i class="fas fa-minus"></i>
              </button>
              <input 
                v-model.number="item.quantity" 
                type="number" 
                min="1"
                max="item.stock"
                @input="updateTotal"
              />
              <button 
                class="quantity-btn" 
                @click="increaseQuantity(index)"
                :disabled="item.quantity >= item.stock"
              >
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
          
          <div class="item-subtotal">
            <label>小计</label>
            <span class="subtotal-amount">
              ¥{{ (calculateDiscountedPrice(item) * item.quantity).toFixed(2) }}
            </span>
          </div>
          
          <button class="btn-remove" @click="removeProduct(index)">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <div class="panel-footer">
        <div class="total-summary">
          <div class="summary-item">
            <span class="label">产品总数</span>
            <span class="value">{{ totalItems }} 件</span>
          </div>
          <div class="summary-item">
            <span class="label">原价总计</span>
            <span class="value original">¥{{ originalTotal.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">折扣优惠</span>
            <span class="value discount">-¥{{ discountTotal.toFixed(2) }}</span>
          </div>
          <div class="summary-item total">
            <span class="label">最终价格</span>
            <span class="value final">¥{{ finalTotal.toFixed(2) }}</span>
          </div>
        </div>
        
        <div class="panel-actions">
          <button class="btn-secondary" @click="cancelSelection">
            <i class="fas fa-times"></i>
            取消
          </button>
          <button class="btn-primary" @click="confirmSelection">
            <i class="fas fa-check"></i>
            确认选择
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 接口定义
interface Product {
  id: string
  name: string
  code: string
  description: string
  category: string
  unit: string
  unitPrice: number
  discount?: number
  image: string
  stock: number
  deliveryTime: number
  isNew?: boolean
  isHot?: boolean
}

interface SelectedProduct extends Product {
  quantity: number
}

interface Category {
  key: string
  name: string
  icon: string
  count: number
}

// Props
const props = defineProps<{
  initialSelection?: SelectedProduct[]
}>()

// Emits
const emit = defineEmits<{
  productsSelected: [products: SelectedProduct[]]
}>()

// 响应式数据
const searchQuery = ref('')
const selectedCategory = ref('all')
const currentPage = ref(1)
const pageSize = ref(12)

const products = ref<Product[]>([])
const selectedProducts = ref<SelectedProduct[]>([])

const categories = ref<Category[]>([
  { key: 'all', name: '全部', icon: 'fas fa-th', count: 0 },
  { key: 'electronics', name: '电子产品', icon: 'fas fa-microchip', count: 0 },
  { key: 'machinery', name: '机械设备', icon: 'fas fa-cogs', count: 0 },
  { key: 'materials', name: '原材料', icon: 'fas fa-cube', count: 0 },
  { key: 'components', name: '零部件', icon: 'fas fa-puzzle-piece', count: 0 },
  { key: 'software', name: '软件服务', icon: 'fas fa-code', count: 0 }
])

// 计算属性
const filteredProducts = computed(() => {
  let filtered = products.value

  // 分类过滤
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(p => p.category === selectedCategory.value)
  }

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    )
  }

  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

const totalPages = computed(() => {
  const filtered = products.value.filter(p => 
    selectedCategory.value === 'all' || p.category === selectedCategory.value
  )
  return Math.ceil(filtered.length / pageSize.value)
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

const totalItems = computed(() => {
  return selectedProducts.value.reduce((sum, item) => sum + item.quantity, 0)
})

const originalTotal = computed(() => {
  return selectedProducts.value.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
})

const discountTotal = computed(() => {
  return selectedProducts.value.reduce((sum, item) => {
    const discount = item.discount || 0
    return sum + (item.unitPrice * (discount / 100) * item.quantity)
  }, 0)
})

const finalTotal = computed(() => {
  return originalTotal.value - discountTotal.value
})

// 方法
const calculateDiscountedPrice = (product: Product): number => {
  const discount = product.discount || 0
  return product.unitPrice * (1 - discount / 100)
}

const getStockClass = (stock: number): string => {
  if (stock <= 10) return 'low'
  if (stock <= 50) return 'medium'
  return 'high'
}

const getCategoryName = (category: string): string => {
  const cat = categories.value.find(c => c.key === category)
  return cat ? cat.name : category
}

const isSelected = (productId: string): boolean => {
  return selectedProducts.value.some(p => p.id === productId)
}

const toggleProduct = (product: Product) => {
  const index = selectedProducts.value.findIndex(p => p.id === product.id)
  
  if (index === -1) {
    selectedProducts.value.push({ ...product, quantity: 1 })
    ElMessage.success(`已添加 ${product.name}`)
  } else {
    selectedProducts.value.splice(index, 1)
    ElMessage.info(`已移除 ${product.name}`)
  }
}

const increaseQuantity = (index: number) => {
  const item = selectedProducts.value[index]
  if (item.quantity < item.stock) {
    item.quantity++
    updateTotal()
  } else {
    ElMessage.warning('已达到库存上限')
  }
}

const decreaseQuantity = (index: number) => {
  const item = selectedProducts.value[index]
  if (item.quantity > 1) {
    item.quantity--
    updateTotal()
  }
}

const removeProduct = (index: number) => {
  const product = selectedProducts.value[index]
  selectedProducts.value.splice(index, 1)
  ElMessage.info(`已移除 ${product.name}`)
}

const updateTotal = () => {
  // 总计由计算属性自动处理
}

const clearSelection = () => {
  selectedProducts.value = []
  ElMessage.success('已清空选择')
}

const cancelSelection = () => {
  // 触发取消事件
  emit('productsSelected', [])
}

const confirmSelection = () => {
  if (selectedProducts.value.length === 0) {
    ElMessage.warning('请至少选择一个产品')
    return
  }
  
  emit('productsSelected', selectedProducts.value)
  ElMessage.success('产品选择已确认')
}

const handleSearch = () => {
  currentPage.value = 1
}

const fetchProducts = async () => {
  try {
    // 模拟API调用
    const mockProducts: Product[] = [
      {
        id: '1',
        name: '高精度数控机床',
        code: 'CNC-001',
        description: '五轴联动，精度±0.005mm，适用于精密加工',
        category: 'machinery',
        unit: '台',
        unitPrice: 85000.00,
        discount: 10,
        image: 'https://picsum.photos/seed/cnc001/200/200.jpg',
        stock: 5,
        deliveryTime: 30,
        isHot: true
      },
      {
        id: '2',
        name: '工业机器人',
        code: 'ROBOT-002',
        description: '六轴机器人，负载50kg，重复精度±0.05mm',
        category: 'machinery',
        unit: '台',
        unitPrice: 45000.00,
        discount: 5,
        image: 'https://picsum.photos/seed/robot002/200/200.jpg',
        stock: 12,
        deliveryTime: 20,
        isNew: true
      },
      {
        id: '3',
        name: 'PLC控制器',
        code: 'PLC-003',
        description: '西门子S7-1200，支持多种通信协议',
        category: 'electronics',
        unit: '套',
        unitPrice: 12000.00,
        image: 'https://picsum.photos/seed/plc003/200/200.jpg',
        stock: 25,
        deliveryTime: 7
      },
      {
        id: '4',
        name: '伺服电机',
        code: 'MOTOR-004',
        description: '功率1.5kW，配行星减速器，减速比1:20',
        category: 'components',
        unit: '套',
        unitPrice: 3200.00,
        discount: 8,
        image: 'https://picsum.photos/seed/motor004/200/200.jpg',
        stock: 48,
        deliveryTime: 5,
        isHot: true
      },
      {
        id: '5',
        name: 'ERP管理软件',
        code: 'ERP-005',
        description: '制造业ERP系统，包含生产、库存、财务模块',
        category: 'software',
        unit: '套',
        unitPrice: 68000.00,
        discount: 15,
        image: 'https://picsum.photos/seed/erp005/200/200.jpg',
        stock: 999,
        deliveryTime: 1
      },
      {
        id: '6',
        name: '不锈钢板材',
        code: 'STEEL-006',
        description: '304不锈钢，厚度2mm，尺寸1000x2000mm',
        category: 'materials',
        unit: '张',
        unitPrice: 580.00,
        image: 'https://picsum.photos/seed/steel006/200/200.jpg',
        stock: 8,
        deliveryTime: 3
      }
    ]
    
    products.value = mockProducts
    
    // 更新分类计数
    categories.value.forEach(category => {
      if (category.key === 'all') {
        category.count = mockProducts.length
      } else {
        category.count = mockProducts.filter(p => p.category === category.key).length
      }
    })
    
    // 初始化选择的产品
    if (props.initialSelection && props.initialSelection.length > 0) {
      selectedProducts.value = [...props.initialSelection]
    }
  } catch (error) {
    ElMessage.error('获取产品列表失败')
  }
}

// 生命周期
onMounted(() => {
  fetchProducts()
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
  max-width: 1600px;
  margin: 0 auto;
  padding: 32px 24px;
  background: linear-gradient(135deg, var(--color-off-white) 0%, #FFFFFF 100%);
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 32px;
}

/* Selector Header */
.selector-header {
  grid-column: 1 / -1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title i {
  color: var(--color-teal);
  font-size: 1.25rem;
}

.search-box {
  position: relative;
  width: 400px;
}

.search-box i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-medium);
  font-size: 14px;
}

.search-box input {
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

.search-box input:focus {
  outline: none;
  border-color: var(--color-teal);
  box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1);
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 0;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--color-gray-light);
  border-radius: 20px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-slate);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.filter-tab:hover {
  border-color: var(--color-teal);
  color: var(--color-teal);
}

.filter-tab.active {
  background: var(--color-teal);
  border-color: var(--color-teal);
  color: white;
}

.filter-tab i {
  font-size: 12px;
}

.filter-tab .count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.filter-tab.active .count {
  background: rgba(255, 255, 255, 0.3);
}

/* Selector Content */
.selector-content {
  grid-column: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  border-color: var(--color-teal);
}

.product-card.selected {
  border-color: var(--color-teal);
  background: rgba(56, 178, 172, 0.05);
}

.product-header {
  position: relative;
  padding: 16px;
}

.product-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-badges {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge.new {
  background: var(--color-success);
  color: white;
}

.badge.hot {
  background: var(--color-danger);
  color: white;
}

.badge.discount {
  background: var(--color-orange);
  color: white;
}

.product-info {
  padding: 0 16px 12px 16px;
}

.product-name {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.product-code {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
  margin: 0 0 8px 0;
}

.product-description {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-gray-medium);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-pricing {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--color-gray-light);
}

.price-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.current-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.currency {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-teal);
  font-weight: 600;
}

.amount {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-teal);
}

.original-price {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-gray-medium);
  text-decoration: line-through;
}

.stock-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.stock-label {
  font-family: var(--font-body);
  font-size: 10px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stock-value {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
}

.stock-value.high {
  color: var(--color-success);
}

.stock-value.medium {
  color: var(--color-warning);
}

.stock-value.low {
  color: var(--color-danger);
}

.product-meta {
  padding: 12px 16px 16px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-gray-medium);
}

.meta-item i {
  color: var(--color-teal);
  font-size: 10px;
}

.selection-indicator {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 24px;
  height: 24px;
  background: var(--color-teal);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  opacity: 0;
  transform: scale(0);
  transition: all 0.2s ease;
}

.product-card.selected .selection-indicator {
  opacity: 1;
  transform: scale(1);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
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
  width: 36px;
  height: 36px;
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

/* Selected Panel */
.selected-panel {
  grid-column: 2;
  position: sticky;
  top: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  overflow: hidden;
  height: fit-content;
  max-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-gray-light);
}

.panel-title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-title i {
  color: var(--color-teal);
  font-size: 1rem;
}

.btn-clear {
  padding: 8px 12px;
  background: transparent;
  border: 1px solid var(--color-gray-light);
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-gray-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-clear:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

/* Selected List */
.selected-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  max-height: 400px;
}

.selected-item {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid var(--color-gray-light);
  border-radius: 12px;
  margin-bottom: 12px;
}

.item-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.item-image {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.item-details {
  flex: 1;
}

.item-name {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0 0 2px 0;
}

.item-code {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-gray-medium);
  margin: 0 0 4px 0;
}

.item-price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-price .current-price {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-teal);
}

.item-price .original-price {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
  text-decoration: line-through;
}

.item-quantity {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.item-quantity label {
  font-family: var(--font-body);
  font-size: 10px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid var(--color-gray-light);
  border-radius: 6px;
  overflow: hidden;
}

.quantity-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: var(--color-slate);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.quantity-btn:hover:not(:disabled) {
  background: var(--color-teal);
  color: white;
}

.quantity-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.quantity-controls input {
  width: 50px;
  height: 32px;
  border: none;
  text-align: center;
  font-family: var(--font-body);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
}

.item-subtotal {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.item-subtotal label {
  font-family: var(--font-body);
  font-size: 10px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.subtotal-amount {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-teal);
  min-width: 80px;
  text-align: right;
}

.btn-remove {
  width: 32px;
  height: 32px;
  background: var(--color-danger);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-remove:hover {
  background: #E53E3E;
  transform: scale(1.1);
}

/* Panel Footer */
.panel-footer {
  padding: 20px;
  border-top: 1px solid var(--color-gray-light);
}

.total-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-item .label {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
}

.summary-item .value {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-slate);
}

.summary-item .value.original {
  color: var(--color-gray-medium);
  text-decoration: line-through;
}

.summary-item .value.discount {
  color: var(--color-success);
}

.summary-item.total {
  padding-top: 12px;
  border-top: 2px solid var(--color-gray-light);
}

.summary-item.total .label {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
}

.summary-item.total .value.final {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--color-teal);
}

.panel-actions {
  display: flex;
  gap: 12px;
}

.btn-secondary, .btn-primary {
  padding: 12px 20px;
  border-radius: 8px;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  flex: 1;
  justify-content: center;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-gray-light);
  color: var(--color-slate);
}

.btn-secondary:hover {
  border-color: var(--color-gray-medium);
  background: rgba(0, 0, 0, 0.02);
}

.btn-primary {
  background: var(--color-teal);
  border: none;
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(56, 178, 172, 0.3);
}

/* Responsive Design */
@media (max-width: 1400px) {
  .product-selector {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .selected-panel {
    grid-column: 1;
    position: relative;
    top: 0;
    max-height: none;
  }
}

@media (max-width: 1024px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .search-box {
    width: 100%;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
}

@media (max-width: 768px) {
  .product-selector {
    padding: 20px 16px;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-tabs {
    overflow-x: auto;
    padding-bottom: 8px;
  }
  
  .selected-item {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .item-info {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }
  
  .panel-actions {
    flex-direction: column;
  }
}
</style>