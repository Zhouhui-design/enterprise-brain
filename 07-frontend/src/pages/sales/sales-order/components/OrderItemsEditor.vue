<template>
  <div class="order-items-editor">
    <!-- 编辑器头部 -->
    <div class="editor-header">
      <h3>产品明细编辑</h3>
      <div class="header-actions">
        <el-button @click="addItem" type="primary" size="small">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          添加项目
        </el-button>
        <el-button @click="importItems" size="small">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2"/>
          </svg>
          导入Excel
        </el-button>
      </div>
    </div>

    <!-- 编辑表格 -->
    <div class="items-table">
      <el-table
        :data="items"
        @selection-change="handleSelectionChange"
        border
        stripe
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="产品信息" min-width="200">
          <template #default="{ row, $index }">
            <div class="product-cell">
              <el-select
                v-model="row.productId"
                placeholder="选择产品"
                @change="handleProductChange($index)"
                filterable
                size="small"
              >
                <el-option
                  v-for="product in availableProducts"
                  :key="product.id"
                  :label="product.name"
                  :value="product.id"
                >
                  <div class="product-option">
                    <div class="product-name">{{ product.name }}</div>
                    <div class="product-info">
                      {{ product.category }} | 库存: {{ product.stock }} | 单价: ¥{{ product.price }}
                    </div>
                  </div>
                </el-option>
              </el-select>
              <div v-if="row.productId" class="product-details">
                <span class="product-spec">{{ getProductSpec(row.productId) }}</span>
                <el-tag v-if="getProductStock(row.productId) < 10" type="warning" size="small">
                  库存紧张
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="数量" width="120">
          <template #default="{ row, $index }">
            <el-input-number
              v-model="row.quantity"
              :min="1"
              :max="getProductStock(row.productId)"
              @change="handleQuantityChange($index)"
              size="small"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="单价" width="120">
          <template #default="{ row, $index }">
            <el-input
              v-model="row.unitPrice"
              @input="handlePriceChange($index)"
              placeholder="0.00"
              size="small"
            >
              <template #suffix>¥</template>
            </el-input>
          </template>
        </el-table-column>
        
        <el-table-column label="折扣" width="100">
          <template #default="{ row, $index }">
            <el-input
              v-model="row.discount"
              @input="handleDiscountChange($index)"
              placeholder="0%"
              size="small"
            >
              <template #suffix>%</template>
            </el-input>
          </template>
        </el-table-column>
        
        <el-table-column label="小计" width="120" align="right">
          <template #default="{ row }">
            <span class="subtotal">¥{{ calculateItemSubtotal(row).toFixed(2) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="备注" width="150">
          <template #default="{ row }">
            <el-input
              v-model="row.notes"
              placeholder="备注信息"
              size="small"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ $index }">
            <el-button @click="removeItem($index)" type="danger" size="small" text>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 批量操作 -->
    <div v-if="selectedItems.length > 0" class="batch-actions">
      <div class="selection-info">
        已选择 {{ selectedItems.length }} 项
      </div>
      <div class="batch-controls">
        <el-button @click="batchSetDiscount" size="small">
          批量折扣
        </el-button>
        <el-button @click="batchSetNotes" size="small">
          批量备注
        </el-button>
        <el-button @click="batchDelete" type="danger" size="small">
          批量删除
        </el-button>
      </div>
    </div>

    <!-- 汇总信息 -->
    <div class="items-summary">
      <div class="summary-grid">
        <div class="summary-item">
          <span class="label">产品种类：</span>
          <span class="value">{{ items.length }}</span>
        </div>
        <div class="summary-item">
          <span class="label">总数量：</span>
          <span class="value">{{ totalQuantity }}</span>
        </div>
        <div class="summary-item">
          <span class="label">总金额：</span>
          <span class="value total-amount">¥{{ totalAmount.toFixed(2) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">平均单价：</span>
          <span class="value">¥{{ averagePrice.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- 快速添加弹窗 -->
    <el-dialog v-model="quickAddVisible" title="快速添加产品" width="600px">
      <div class="quick-add-content">
        <div class="product-grid">
          <div
            v-for="product in quickAddProducts"
            :key="product.id"
            class="product-card"
            @click="quickAddProduct(product)"
          >
            <div class="card-header">
              <h4>{{ product.name }}</h4>
              <el-tag :type="product.stock > 50 ? 'success' : 'warning'" size="small">
                库存: {{ product.stock }}
              </el-tag>
            </div>
            <div class="card-body">
              <p class="spec">{{ product.spec }}</p>
              <p class="price">¥{{ product.price }}</p>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="quickAddVisible = false">取消</el-button>
        <el-button @click="showAllProducts" type="primary">查看全部产品</el-button>
      </template>
    </el-dialog>

    <!-- 批量折扣弹窗 -->
    <el-dialog v-model="batchDiscountVisible" title="批量设置折扣" width="400px">
      <el-form>
        <el-form-item label="折扣方式">
          <el-radio-group v-model="batchDiscountType">
            <el-radio label="percentage">百分比</el-radio>
            <el-radio label="fixed">固定金额</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="折扣值">
          <el-input
            v-model="batchDiscountValue"
            :placeholder="batchDiscountType === 'percentage' ? '输入折扣百分比' : '输入折扣金额'"
          >
            <template #suffix>
              {{ batchDiscountType === 'percentage' ? '%' : '¥' }}
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDiscountVisible = false">取消</el-button>
        <el-button @click="applyBatchDiscount" type="primary">应用</el-button>
      </template>
    </el-dialog>

    <!-- 批量备注弹窗 -->
    <el-dialog v-model="batchNotesVisible" title="批量添加备注" width="500px">
      <el-form>
        <el-form-item label="备注内容">
          <el-input
            v-model="batchNotesContent"
            type="textarea"
            :rows="3"
            placeholder="请输入备注内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchNotesVisible = false">取消</el-button>
        <el-button @click="applyBatchNotes" type="primary">应用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 接口定义
interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  discount: number
  notes: string
}

interface Product {
  id: string
  name: string
  spec: string
  category: string
  price: number
  stock: number
}

// Props & Emits
const props = defineProps<{
  items: OrderItem[]
  products: Product[]
}>()

const emit = defineEmits<{
  'update:items': [items: OrderItem[]]
  'items-updated': [items: OrderItem[]]
}>()

// 响应式数据
const items = ref<OrderItem[]>(props.items || [])
const selectedItems = ref<OrderItem[]>([])
const quickAddVisible = ref(false)
const batchDiscountVisible = ref(false)
const batchNotesVisible = ref(false)
const batchDiscountType = ref('percentage')
const batchDiscountValue = ref('')
const batchNotesContent = ref('')

const quickAddProducts = ref<Product[]>(props.products?.slice(0, 6) || [])
const availableProducts = ref<Product[]>(props.products || [])

// 计算属性
const totalQuantity = computed(() => {
  return items.value.reduce((sum, item) => sum + item.quantity, 0)
})

const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + calculateItemSubtotal(item), 0)
})

const averagePrice = computed(() => {
  if (totalQuantity.value === 0) return 0
  return totalAmount.value / totalQuantity.value
})

// 方法
const getProductById = (productId: string): Product | undefined => {
  return availableProducts.value.find(p => p.id === productId)
}

const getProductSpec = (productId: string): string => {
  const product = getProductById(productId)
  return product?.spec || ''
}

const getProductStock = (productId: string): number => {
  const product = getProductById(productId)
  return product?.stock || 999
}

const calculateItemSubtotal = (item: OrderItem): number => {
  const subtotal = item.quantity * item.unitPrice
  const discountAmount = subtotal * (item.discount / 100)
  return subtotal - discountAmount
}

const generateItemId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

// 事件处理
const addItem = () => {
  const newItem: OrderItem = {
    id: generateItemId(),
    productId: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    notes: ''
  }
  items.value.push(newItem)
  emitUpdate()
}

const removeItem = async (index: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个项目吗？', '确认删除', {
      type: 'warning'
    })
    items.value.splice(index, 1)
    emitUpdate()
  } catch {
    // 用户取消
  }
}

const handleProductChange = (index: number) => {
  const item = items.value[index]
  const product = getProductById(item.productId)
  if (product) {
    item.unitPrice = product.price
    item.quantity = Math.min(item.quantity, product.stock)
  }
  emitUpdate()
}

const handleQuantityChange = (index: number) => {
  const item = items.value[index]
  const maxStock = getProductStock(item.productId)
  item.quantity = Math.min(item.quantity, maxStock)
  emitUpdate()
}

const handlePriceChange = (index: number) => {
  emitUpdate()
}

const handleDiscountChange = (index: number) => {
  const item = items.value[index]
  item.discount = Math.min(item.discount, 100)
  item.discount = Math.max(item.discount, 0)
  emitUpdate()
}

const handleSelectionChange = (selection: OrderItem[]) => {
  selectedItems.value = selection
}

// 批量操作
const batchSetDiscount = () => {
  batchDiscountVisible.value = true
}

const applyBatchDiscount = () => {
  if (!batchDiscountValue.value) {
    ElMessage.warning('请输入折扣值')
    return
  }

  const discountValue = parseFloat(batchDiscountValue.value)
  if (isNaN(discountValue) || discountValue <= 0) {
    ElMessage.error('请输入有效的折扣值')
    return
  }

  selectedItems.value.forEach(item => {
    if (batchDiscountType.value === 'percentage') {
      item.discount = Math.min(discountValue, 100)
    } else {
      const subtotal = item.quantity * item.unitPrice
      item.discount = (discountValue / subtotal) * 100
      item.discount = Math.min(item.discount, 100)
    }
  })

  batchDiscountVisible.value = false
  batchDiscountValue.value = ''
  emitUpdate()
  ElMessage.success('批量折扣设置成功')
}

const batchSetNotes = () => {
  batchNotesVisible.value = true
}

const applyBatchNotes = () => {
  if (!batchNotesContent.value.trim()) {
    ElMessage.warning('请输入备注内容')
    return
  }

  selectedItems.value.forEach(item => {
    item.notes = batchNotesContent.value
  })

  batchNotesVisible.value = false
  batchNotesContent.value = ''
  emitUpdate()
  ElMessage.success('批量备注添加成功')
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedItems.value.length} 个项目吗？`, '确认删除', {
      type: 'warning'
    })

    selectedItems.value.forEach(item => {
      const index = items.value.findIndex(i => i.id === item.id)
      if (index !== -1) {
        items.value.splice(index, 1)
      }
    })

    selectedItems.value = []
    emitUpdate()
    ElMessage.success('批量删除成功')
  } catch {
    // 用户取消
  }
}

// 快速添加
const quickAddProduct = (product: Product) => {
  const newItem: OrderItem = {
    id: generateItemId(),
    productId: product.id,
    quantity: 1,
    unitPrice: product.price,
    discount: 0,
    notes: ''
  }
  items.value.push(newItem)
  emitUpdate()
  ElMessage.success(`已添加 ${product.name}`)
}

const importItems = () => {
  ElMessage.info('Excel导入功能开发中...')
}

const showAllProducts = () => {
  quickAddVisible.value = false
  // 可以在这里跳转到产品选择页面
}

const emitUpdate = () => {
  emit('update:items', items.value)
  emit('items-updated', items.value)
}

// 监听props变化
watch(() => props.items, (newItems) => {
  items.value = newItems || []
}, { deep: true })

watch(() => props.products, (newProducts) => {
  availableProducts.value = newProducts || []
  quickAddProducts.value = newProducts?.slice(0, 6) || []
}, { deep: true })
</script>

<style scoped>
.order-items-editor {
  background: var(--surface-color);
  border-radius: 12px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--background-color);
}

.editor-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.items-table {
  overflow: hidden;
}

.product-cell {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.product-option {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-weight: 600;
  color: var(--text-primary);
}

.product-info {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.product-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.product-spec {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.subtotal {
  font-weight: 600;
  color: var(--primary-color);
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--background-color);
  border-top: 1px solid var(--border-color);
}

.selection-info {
  font-weight: 600;
  color: var(--text-primary);
}

.batch-controls {
  display: flex;
  gap: 0.5rem;
}

.items-summary {
  padding: 1rem 1.5rem;
  background: var(--background-color);
  border-top: 1px solid var(--border-color);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  color: var(--primary-color);
  font-size: 1.1rem;
}

.quick-add-content {
  max-height: 400px;
  overflow-y: auto;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.product-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--surface-color);
}

.product-card:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.card-header h4 {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.card-body {
  font-size: 0.9rem;
}

.spec {
  color: var(--text-secondary);
  margin: 0.25rem 0;
}

.price {
  color: var(--primary-color);
  font-weight: 600;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .batch-actions {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>