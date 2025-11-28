<template>
  <div class="purchase-items">
    <div class="items-header">
      <div class="header-left">
        <h2 class="page-title">采购物料管理</h2>
        <p class="page-description">管理采购项目中的物料信息，包括规格、数量和供应商报价</p>
      </div>
      <div class="header-actions">
        <div class="search-filters">
          <div class="search-input">
            <i class="fas fa-search"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜索物料名称、规格或编码..."
              @input="handleSearch"
            />
          </div>
          <select v-model="categoryFilter" @change="handleCategoryFilter">
            <option value="">全部分类</option>
            <option value="raw_materials">原材料</option>
            <option value="components">零部件</option>
            <option value="finished_goods">成品</option>
            <option value="consumables">耗材</option>
          </select>
        </div>
        <button class="btn-primary" @click="showAddModal = true">
          <i class="fas fa-plus"></i>
          添加物料
        </button>
      </div>
    </div>

    <!-- 物料列表 -->
    <div class="items-grid">
      <div 
        v-for="item in paginatedItems" 
        :key="item.id" 
        class="item-card"
        :class="{ 'low-stock': item.quantity <= item.minQuantity }"
      >
        <div class="item-header">
          <div class="item-info">
            <h3 class="item-name">{{ item.name }}</h3>
            <span class="item-code">{{ item.code }}</span>
          </div>
          <div class="item-status">
            <span 
              class="status-badge" 
              :class="getStatusClass(item.quantity, item.minQuantity)"
            >
              {{ getStatusText(item.quantity, item.minQuantity) }}
            </span>
          </div>
        </div>

        <div class="item-specs">
          <div class="spec-item">
            <i class="fas fa-ruler"></i>
            <span>{{ item.specifications }}</span>
          </div>
          <div class="spec-item">
            <i class="fas fa-tag"></i>
            <span>{{ getCategoryName(item.category) }}</span>
          </div>
          <div class="spec-item">
            <i class="fas fa-cube"></i>
            <span>{{ item.unit }}</span>
          </div>
        </div>

        <div class="item-stock">
          <div class="stock-info">
            <div class="stock-quantity">
              <span class="label">当前库存</span>
              <span class="value" :class="{ 'low-stock': item.quantity <= item.minQuantity }">
                {{ item.quantity }} {{ item.unit }}
              </span>
            </div>
            <div class="min-stock">
              <span class="label">最小库存</span>
              <span class="value">{{ item.minQuantity }} {{ item.unit }}</span>
            </div>
          </div>
          <div class="stock-progress">
            <div 
              class="progress-bar" 
              :style="{ width: getStockPercentage(item.quantity, item.minQuantity) + '%' }"
            ></div>
          </div>
        </div>

        <div class="item-price">
          <div class="price-info">
            <span class="label">参考价格</span>
            <span class="value">¥{{ item.unitPrice.toFixed(2) }}</span>
          </div>
          <div class="price-range">
            <span class="range-label">价格区间</span>
            <span class="range-value">¥{{ item.minPrice.toFixed(2) }} - ¥{{ item.maxPrice.toFixed(2) }}</span>
          </div>
        </div>

        <div class="item-suppliers">
          <div class="suppliers-info">
            <span class="label">供应商数量</span>
            <span class="value">{{ item.supplierCount }} 家</span>
          </div>
          <div class="suppliers-list">
            <div 
              v-for="supplier in item.suppliers.slice(0, 3)" 
              :key="supplier.id" 
              class="supplier-avatar"
              :title="supplier.name"
            >
              <img :src="supplier.avatar" :alt="supplier.name" />
            </div>
            <div 
              v-if="item.supplierCount > 3" 
              class="more-suppliers"
            >
              +{{ item.supplierCount - 3 }}
            </div>
          </div>
        </div>

        <div class="item-actions">
          <button class="btn-secondary" @click="viewItemDetails(item)">
            <i class="fas fa-eye"></i>
            查看详情
          </button>
          <button class="btn-secondary" @click="showSuppliersModal(item)">
            <i class="fas fa-store"></i>
            供应商
          </button>
          <button class="btn-primary" @click="requestQuotation(item)">
            <i class="fas fa-file-invoice"></i>
            询价
          </button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <div class="pagination-info">
        显示 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredItems.length) }} 
        共 {{ filteredItems.length }} 项
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

    <!-- 添加物料模态框 -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加新物料</h3>
          <button class="close-btn" @click="closeAddModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleAddItem">
            <div class="form-grid">
              <div class="form-group">
                <label>物料名称 *</label>
                <input 
                  v-model="newItem.name" 
                  type="text" 
                  required 
                  placeholder="请输入物料名称"
                />
              </div>
              <div class="form-group">
                <label>物料编码 *</label>
                <input 
                  v-model="newItem.code" 
                  type="text" 
                  required 
                  placeholder="请输入物料编码"
                />
              </div>
              <div class="form-group">
                <label>物料分类 *</label>
                <select v-model="newItem.category" required>
                  <option value="">请选择分类</option>
                  <option value="raw_materials">原材料</option>
                  <option value="components">零部件</option>
                  <option value="finished_goods">成品</option>
                  <option value="consumables">耗材</option>
                </select>
              </div>
              <div class="form-group">
                <label>计量单位 *</label>
                <input 
                  v-model="newItem.unit" 
                  type="text" 
                  required 
                  placeholder="如：个、件、千克、米"
                />
              </div>
              <div class="form-group">
                <label>规格说明</label>
                <input 
                  v-model="newItem.specifications" 
                  type="text" 
                  placeholder="如：尺寸、重量、材质等"
                />
              </div>
              <div class="form-group">
                <label>当前库存 *</label>
                <input 
                  v-model.number="newItem.quantity" 
                  type="number" 
                  required 
                  min="0"
                  step="0.01"
                />
              </div>
              <div class="form-group">
                <label>最小库存 *</label>
                <input 
                  v-model.number="newItem.minQuantity" 
                  type="number" 
                  required 
                  min="0"
                  step="0.01"
                />
              </div>
              <div class="form-group">
                <label>参考单价 *</label>
                <input 
                  v-model.number="newItem.unitPrice" 
                  type="number" 
                  required 
                  min="0"
                  step="0.01"
                />
              </div>
              <div class="form-group">
                <label>最低价格</label>
                <input 
                  v-model.number="newItem.minPrice" 
                  type="number" 
                  min="0"
                  step="0.01"
                />
              </div>
              <div class="form-group">
                <label>最高价格</label>
                <input 
                  v-model.number="newItem.maxPrice" 
                  type="number" 
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div class="form-group full-width">
              <label>备注说明</label>
              <textarea 
                v-model="newItem.remarks" 
                rows="3"
                placeholder="请输入物料的详细说明、技术要求等信息"
              ></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="closeAddModal">
                取消
              </button>
              <button type="submit" class="btn-primary">
                <i class="fas fa-save"></i>
                保存物料
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 物料详情模态框 -->
    <div v-if="showDetailModal" class="modal-overlay" @click="closeDetailModal">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h3>物料详情</h3>
          <button class="close-btn" @click="closeDetailModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedItem">
          <div class="detail-sections">
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>物料名称</label>
                  <span>{{ selectedItem.name }}</span>
                </div>
                <div class="detail-item">
                  <label>物料编码</label>
                  <span>{{ selectedItem.code }}</span>
                </div>
                <div class="detail-item">
                  <label>分类</label>
                  <span>{{ getCategoryName(selectedItem.category) }}</span>
                </div>
                <div class="detail-item">
                  <label>计量单位</label>
                  <span>{{ selectedItem.unit }}</span>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>规格信息</h4>
              <div class="detail-item full-width">
                <label>规格说明</label>
                <span>{{ selectedItem.specifications || '暂无' }}</span>
              </div>
              <div class="detail-item full-width">
                <label>备注说明</label>
                <span>{{ selectedItem.remarks || '暂无' }}</span>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>库存信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>当前库存</label>
                  <span :class="{ 'low-stock': selectedItem.quantity <= selectedItem.minQuantity }">
                    {{ selectedItem.quantity }} {{ selectedItem.unit }}
                  </span>
                </div>
                <div class="detail-item">
                  <label>最小库存</label>
                  <span>{{ selectedItem.minQuantity }} {{ selectedItem.unit }}</span>
                </div>
                <div class="detail-item">
                  <label>参考价格</label>
                  <span>¥{{ selectedItem.unitPrice.toFixed(2) }}</span>
                </div>
                <div class="detail-item">
                  <label>价格区间</label>
                  <span>¥{{ selectedItem.minPrice.toFixed(2) }} - ¥{{ selectedItem.maxPrice.toFixed(2) }}</span>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>供应商信息</h4>
              <div class="suppliers-table">
                <table>
                  <thead>
                    <tr>
                      <th>供应商</th>
                      <th>报价</th>
                      <th>交期</th>
                      <th>联系方式</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="supplier in selectedItem.suppliers" :key="supplier.id">
                      <td>
                        <div class="supplier-cell">
                          <img :src="supplier.avatar" :alt="supplier.name" />
                          <span>{{ supplier.name }}</span>
                        </div>
                      </td>
                      <td>¥{{ supplier.price.toFixed(2) }}</td>
                      <td>{{ supplier.deliveryTime }} 天</td>
                      <td>{{ supplier.contact }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeDetailModal">关闭</button>
            <button class="btn-primary" @click="requestQuotation(selectedItem)">
              <i class="fas fa-file-invoice"></i>
              发起询价
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 供应商列表模态框 -->
    <div v-if="showSuppliersModal" class="modal-overlay" @click="closeSuppliersModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>供应商报价</h3>
          <button class="close-btn" @click="closeSuppliersModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedItem">
          <div class="suppliers-list">
            <div 
              v-for="supplier in selectedItem.suppliers" 
              :key="supplier.id" 
              class="supplier-card"
            >
              <div class="supplier-info">
                <img :src="supplier.avatar" :alt="supplier.name" class="supplier-avatar" />
                <div class="supplier-details">
                  <h4>{{ supplier.name }}</h4>
                  <p>{{ supplier.contact }}</p>
                </div>
              </div>
              <div class="supplier-quote">
                <div class="quote-info">
                  <span class="quote-label">报价</span>
                  <span class="quote-value">¥{{ supplier.price.toFixed(2) }}</span>
                </div>
                <div class="delivery-info">
                  <span class="delivery-label">交期</span>
                  <span class="delivery-value">{{ supplier.deliveryTime }} 天</span>
                </div>
              </div>
              <div class="supplier-actions">
                <button class="btn-secondary" @click="contactSupplier(supplier)">
                  <i class="fas fa-phone"></i>
                  联系
                </button>
                <button class="btn-primary" @click="selectSupplier(supplier)">
                  <i class="fas fa-check"></i>
                  选择
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 接口定义
interface Supplier {
  id: string
  name: string
  avatar: string
  price: number
  deliveryTime: number
  contact: string
}

interface PurchaseItem {
  id: string
  name: string
  code: string
  category: string
  unit: string
  specifications: string
  quantity: number
  minQuantity: number
  unitPrice: number
  minPrice: number
  maxPrice: number
  remarks?: string
  supplierCount: number
  suppliers: Supplier[]
}

// 响应式数据
const searchQuery = ref('')
const categoryFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(12)
const showAddModal = ref(false)
const showDetailModal = ref(false)
const showSuppliersModal = ref(false)
const selectedItem = ref<PurchaseItem | null>(null)

const purchaseItems = ref<PurchaseItem[]>([
  {
    id: '1',
    name: '高强度螺栓 M12',
    code: 'ITEM001',
    category: 'components',
    unit: '个',
    specifications: '材质：45#钢，强度等级：8.8级，表面处理：镀锌',
    quantity: 500,
    minQuantity: 200,
    unitPrice: 2.5,
    minPrice: 2.2,
    maxPrice: 3.0,
    remarks: '高强度连接件，适用于机械装配',
    supplierCount: 5,
    suppliers: [
      {
        id: 's1',
        name: '标准紧固件厂',
        avatar: 'https://via.placeholder.com/32/ED8936/FFFFFF?text=标',
        price: 2.5,
        deliveryTime: 7,
        contact: '张工 13800138000'
      },
      {
        id: 's2',
        name: '精密零件公司',
        avatar: 'https://via.placeholder.com/32/38B2AC/FFFFFF?text=精',
        price: 2.3,
        deliveryTime: 10,
        contact: '李经理 13900139000'
      }
    ]
  },
  {
    id: '2',
    name: '不锈钢板 304',
    code: 'ITEM002',
    category: 'raw_materials',
    unit: '张',
    specifications: '厚度：2mm，尺寸：1000×2000mm，表面：2B',
    quantity: 50,
    minQuantity: 20,
    unitPrice: 350,
    minPrice: 320,
    maxPrice: 380,
    remarks: '优质不锈钢板材，耐腐蚀性能好',
    supplierCount: 3,
    suppliers: [
      {
        id: 's3',
        name: '金属材料供应商',
        avatar: 'https://via.placeholder.com/32/ED8936/FFFFFF?text=金',
        price: 350,
        deliveryTime: 5,
        contact: '王经理 13700137000'
      }
    ]
  },
  {
    id: '3',
    name: '轴承 6205',
    code: 'ITEM003',
    category: 'components',
    unit: '套',
    specifications: '内径：25mm，外径：52mm，厚度：15mm，精度：P0',
    quantity: 100,
    minQuantity: 50,
    unitPrice: 18,
    minPrice: 15,
    maxPrice: 22,
    remarks: '深沟球轴承，通用型',
    supplierCount: 4,
    suppliers: [
      {
        id: 's4',
        name: '专业轴承经销商',
        avatar: 'https://via.placeholder.com/32/38B2AC/FFFFFF?text=轴',
        price: 18,
        deliveryTime: 3,
        contact: '赵工 13600136000'
      }
    ]
  },
  {
    id: '4',
    name: '油漆 白色',
    code: 'ITEM004',
    category: 'consumables',
    unit: '桶',
    specifications: '类型：醇酸漆，容量：20kg，光泽度：哑光',
    quantity: 15,
    minQuantity: 10,
    unitPrice: 180,
    minPrice: 160,
    maxPrice: 200,
    remarks: '金属表面涂料，防腐防锈',
    supplierCount: 6,
    suppliers: [
      {
        id: 's5',
        name: '化工原料供应商',
        avatar: 'https://via.placeholder.com/32/ED8936/FFFFFF?text=化',
        price: 180,
        deliveryTime: 2,
        contact: '孙经理 13500135000'
      }
    ]
  }
])

const newItem = ref<PurchaseItem>({
  id: '',
  name: '',
  code: '',
  category: '',
  unit: '',
  specifications: '',
  quantity: 0,
  minQuantity: 0,
  unitPrice: 0,
  minPrice: 0,
  maxPrice: 0,
  remarks: '',
  supplierCount: 0,
  suppliers: []
})

// 计算属性
const filteredItems = computed(() => {
  let filtered = purchaseItems.value

  if (searchQuery.value) {
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.specifications.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (categoryFilter.value) {
    filtered = filtered.filter(item => item.category === categoryFilter.value)
  }

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredItems.value.length / pageSize.value)
})

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredItems.value.slice(start, end)
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
const getCategoryName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    raw_materials: '原材料',
    components: '零部件',
    finished_goods: '成品',
    consumables: '耗材'
  }
  return categoryMap[category] || category
}

const getStatusClass = (quantity: number, minQuantity: number): string => {
  if (quantity <= minQuantity * 0.5) return 'critical'
  if (quantity <= minQuantity) return 'low'
  return 'normal'
}

const getStatusText = (quantity: number, minQuantity: number): string => {
  if (quantity <= minQuantity * 0.5) return '严重不足'
  if (quantity <= minQuantity) return '库存偏低'
  return '库存正常'
}

const getStockPercentage = (quantity: number, minQuantity: number): number => {
  return Math.min((quantity / (minQuantity * 2)) * 100, 100)
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleCategoryFilter = () => {
  currentPage.value = 1
}

const viewItemDetails = (item: PurchaseItem) => {
  selectedItem.value = item
  showDetailModal.value = true
}

const showSuppliers = (item: PurchaseItem) => {
  selectedItem.value = item
  showSuppliersModal.value = true
}

const requestQuotation = (item: PurchaseItem) => {
  ElMessage.success(`已向 ${item.supplierCount} 家供应商发起询价请求`)
  closeDetailModal()
  closeSuppliersModal()
}

const contactSupplier = (supplier: Supplier) => {
  ElMessage.info(`正在联系 ${supplier.name}：${supplier.contact}`)
}

const selectSupplier = (supplier: Supplier) => {
  ElMessage.success(`已选择供应商：${supplier.name}`)
  closeSuppliersModal()
}

const closeAddModal = () => {
  showAddModal.value = false
  resetNewItem()
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedItem.value = null
}

const closeSuppliersModal = () => {
  showSuppliersModal.value = false
  selectedItem.value = null
}

const resetNewItem = () => {
  newItem.value = {
    id: '',
    name: '',
    code: '',
    category: '',
    unit: '',
    specifications: '',
    quantity: 0,
    minQuantity: 0,
    unitPrice: 0,
    minPrice: 0,
    maxPrice: 0,
    remarks: '',
    supplierCount: 0,
    suppliers: []
  }
}

const handleAddItem = async () => {
  try {
    const newItemData: PurchaseItem = {
      ...newItem.value,
      id: Date.now().toString(),
      supplierCount: 0,
      suppliers: []
    }

    purchaseItems.value.unshift(newItemData)
    
    ElMessage.success('物料添加成功')
    closeAddModal()
    resetNewItem()
  } catch (error) {
    ElMessage.error('添加失败，请重试')
  }
}

// 生命周期
onMounted(() => {
  console.log('PurchaseItems component mounted')
})
</script>

<style scoped>
.purchase-items {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.header-left {
  flex: 1;
}

.page-title {
  font-family: 'Playfair Display', serif;
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0 0 8px 0;
}

.page-description {
  font-family: 'Space Mono', monospace;
  font-size: 0.875rem;
  color: var(--color-medium);
  line-height: 1.4;
  max-width: 600px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input i {
  position: absolute;
  left: 12px;
  color: var(--color-medium);
  font-size: 14px;
}

.search-input input {
  padding-left: 36px;
  padding-right: 12px;
  height: 40px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  width: 300px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  transition: all 0.2s ease;
}

.search-input input:focus {
  outline: none;
  border-color: var(--color-teal);
  box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1);
}

select {
  height: 40px;
  padding: 0 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  min-width: 120px;
}

select:focus {
  outline: none;
  border-color: var(--color-teal);
}

/* 按钮样式 */
.btn-primary {
  padding: 10px 20px;
  background: var(--color-teal);
  border: none;
  border-radius: 6px;
  font-family: 'Space Mono', monospace;
  font-weight: 500;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(56, 178, 172, 0.3);
}

.btn-secondary {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-family: 'Space Mono', monospace;
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
}

/* 物料网格 */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.item-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--color-teal);
}

.item-card.low-stock {
  border-color: var(--color-orange);
}

.item-card.low-stock::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-orange);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0 0 4px 0;
}

.item-code {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  color: var(--color-medium);
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.normal {
  background: var(--color-teal);
  color: white;
}

.status-badge.low {
  background: #F6AD55;
  color: white;
}

.status-badge.critical {
  background: var(--color-orange);
  color: white;
}

.item-specs {
  margin-bottom: 16px;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  color: var(--color-slate);
}

.spec-item i {
  color: var(--color-medium);
  font-size: 12px;
  width: 16px;
  text-align: center;
}

.item-stock {
  margin-bottom: 16px;
}

.stock-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stock-quantity, .min-stock {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stock-quantity .label, .min-stock .label {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: var(--color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stock-quantity .value, .min-stock .value {
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-slate);
}

.stock-quantity .value.low-stock {
  color: var(--color-orange);
}

.stock-progress {
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--color-teal);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.item-card.low-stock .progress-bar {
  background: var(--color-orange);
}

.item-price {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.price-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.price-info .label {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: var(--color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.price-info .value {
  font-family: 'Space Mono', monospace;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-teal);
}

.price-range {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.range-label {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: var(--color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.range-value {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  color: var(--color-slate);
}

.item-suppliers {
  margin-bottom: 20px;
}

.suppliers-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.suppliers-info .label {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: var(--color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.suppliers-info .value {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-slate);
}

.suppliers-list {
  display: flex;
  align-items: center;
  gap: 8px;
}

.supplier-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.supplier-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.more-suppliers {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-teal);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 600;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.item-actions .btn-secondary {
  flex: 1;
  justify-content: center;
}

.item-actions .btn-primary {
  flex: 1;
  justify-content: center;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.pagination-info {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  color: var(--color-medium);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-btn {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  color: var(--color-slate);
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--color-teal);
  color: var(--color-teal);
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

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease;
}

.modal-content.large {
  max-width: 900px;
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
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.modal-header h3 {
  font-family: 'Playfair Display', serif;
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
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-medium);
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-slate);
}

.modal-body {
  padding: 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

/* 表单样式 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-slate);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-teal);
  box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

/* 详情样式 */
.detail-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-section {
  padding: 20px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.detail-section h4 {
  font-family: 'Playfair Display', serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0 0 16px 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: var(--color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item span {
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  color: var(--color-slate);
  font-weight: 500;
}

.detail-item span.low-stock {
  color: var(--color-orange);
  font-weight: 600;
}

/* 供应商表格 */
.suppliers-table {
  overflow-x: auto;
}

.suppliers-table table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Space Mono', monospace;
}

.suppliers-table th {
  text-align: left;
  padding: 8px;
  background: rgba(0, 0, 0, 0.05);
  font-size: 12px;
  color: var(--color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.suppliers-table td {
  padding: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 13px;
  color: var(--color-slate);
}

.supplier-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.supplier-cell img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

/* 供应商卡片 */
.suppliers-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.supplier-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.supplier-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.supplier-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.supplier-details h4 {
  font-family: 'Playfair Display', serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0 0 4px 0;
}

.supplier-details p {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  color: var(--color-medium);
  margin: 0;
}

.supplier-quote {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.quote-info, .delivery-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quote-label, .delivery-label {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: var(--color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quote-value, .delivery-value {
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-slate);
}

.supplier-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .items-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
  
  .search-filters {
    flex-direction: column;
    width: 100%;
  }
  
  .search-input input {
    width: 100%;
  }
  
  .items-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .supplier-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .supplier-quote {
    align-items: flex-start;
  }
  
  .supplier-actions {
    flex-direction: row;
    width: 100%;
  }
  
  .item-actions {
    flex-direction: column;
  }
  
  .pagination {
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }
}
</style>