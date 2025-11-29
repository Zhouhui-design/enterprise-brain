<template>
  <div class="price-calculator">
    <!-- 价格计算器头部 -->
    <div class="calculator-header">
      <div class="header-content">
        <div class="calculator-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="#4CAF50"/>
          </svg>
        </div>
        <div class="header-info">
          <h1>价格计算器</h1>
          <p>实时计算订单价格、折扣和最终金额</p>
        </div>
      </div>
    </div>

    <!-- 产品价格输入区 -->
    <div class="products-section">
      <h2>产品价格明细</h2>
      <div class="products-list">
        <div v-for="(item, index) in products" :key="index" class="product-item">
          <div class="product-info">
            <div class="product-name">{{ item.name }}</div>
            <div class="product-spec">{{ item.spec }}</div>
          </div>
          <div class="price-controls">
            <div class="input-group">
              <label>数量</label>
              <el-input-number 
                v-model="item.quantity" 
                :min="1" 
                :max="9999"
                @change="calculateTotals"
                size="small"
              />
            </div>
            <div class="input-group">
              <label>单价</label>
              <el-input 
                v-model="item.unitPrice" 
                @input="calculateTotals"
                placeholder="0.00"
                size="small"
              >
                <template #suffix>¥</template>
              </el-input>
            </div>
            <div class="input-group">
              <label>小计</label>
              <div class="subtotal">¥{{ (item.quantity * item.unitPrice).toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="add-product-btn">
        <el-button @click="addProduct" type="primary" text>
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          添加产品
        </el-button>
      </div>
    </div>

    <!-- 折扣设置 -->
    <div class="discount-section">
      <h2>折扣设置</h2>
      <div class="discount-options">
        <div class="discount-type-selector">
          <el-radio-group v-model="discountType" @change="calculateTotals">
            <el-radio-button label="percentage">百分比折扣</el-radio-button>
            <el-radio-button label="fixed">固定金额</el-radio-button>
            <el-radio-button label="volume">批量折扣</el-radio-button>
            <el-radio-button label="promotion">促销折扣</el-radio-button>
          </el-radio-group>
        </div>
        
        <!-- 百分比折扣 -->
        <div v-if="discountType === 'percentage'" class="discount-inputs">
          <div class="input-group">
            <label>折扣比例</label>
            <el-input 
              v-model="percentageDiscount" 
              @input="calculateTotals"
              placeholder="0"
              type="number"
              :min="0"
              :max="100"
            >
              <template #suffix>%</template>
            </el-input>
          </div>
        </div>
        
        <!-- 固定金额折扣 -->
        <div v-if="discountType === 'fixed'" class="discount-inputs">
          <div class="input-group">
            <label>折扣金额</label>
            <el-input 
              v-model="fixedDiscount" 
              @input="calculateTotals"
              placeholder="0.00"
            >
              <template #suffix>¥</template>
            </el-input>
          </div>
        </div>
        
        <!-- 批量折扣 -->
        <div v-if="discountType === 'volume'" class="volume-discounts">
          <div class="volume-table">
            <div class="table-header">
              <span>数量范围</span>
              <span>折扣比例</span>
            </div>
            <div v-for="(tier, index) in volumeTiers" :key="index" class="tier-row">
              <div class="range-inputs">
                <el-input v-model="tier.minQuantity" placeholder="最小数量" size="small" @input="calculateTotals"/>
                <span>-</span>
                <el-input v-model="tier.maxQuantity" placeholder="最大数量" size="small" @input="calculateTotals"/>
              </div>
              <el-input 
                v-model="tier.discount" 
                placeholder="0" 
                size="small"
                @input="calculateTotals"
              >
                <template #suffix>%</template>
              </el-input>
              <el-button @click="removeVolumeTier(index)" type="danger" text size="small">删除</el-button>
            </div>
          </div>
          <el-button @click="addVolumeTier" type="primary" text size="small">添加批量层级</el-button>
        </div>
        
        <!-- 促销折扣 -->
        <div v-if="discountType === 'promotion'" class="promotion-discounts">
          <el-select v-model="selectedPromotion" @change="applyPromotion" placeholder="选择促销活动">
            <el-option 
              v-for="promo in promotions" 
              :key="promo.id"
              :label="promo.name"
              :value="promo.id"
            >
              <div class="promo-option">
                <span class="promo-name">{{ promo.name }}</span>
                <span class="promo-desc">{{ promo.description }}</span>
              </div>
            </el-option>
          </el-select>
        </div>
      </div>
    </div>

    <!-- 税费和其他费用 -->
    <div class="fees-section">
      <h2>税费和其他费用</h2>
      <div class="fees-grid">
        <div class="fee-item">
          <label>税率</label>
          <el-select v-model="taxRate" @change="calculateTotals">
            <el-option label="0%" :value="0" />
            <el-option label="3%" :value="3" />
            <el-option label="6%" :value="6" />
            <el-option label="9%" :value="9" />
            <el-option label="13%" :value="13" />
            <el-option label="自定义" :value="customTaxRate" />
          </el-select>
        </div>
        
        <div class="fee-item">
          <label>运费</label>
          <el-input v-model="shippingFee" @input="calculateTotals" placeholder="0.00">
            <template #suffix>¥</template>
          </el-input>
        </div>
        
        <div class="fee-item">
          <label>保险费</label>
          <el-input v-model="insuranceFee" @input="calculateTotals" placeholder="0.00">
            <template #suffix>¥</template>
          </el-input>
        </div>
        
        <div class="fee-item">
          <label>其他费用</label>
          <el-input v-model="otherFees" @input="calculateTotals" placeholder="0.00">
            <template #suffix>¥</template>
          </el-input>
        </div>
      </div>
    </div>

    <!-- 价格汇总 -->
    <div class="summary-section">
      <h2>价格汇总</h2>
      <div class="price-breakdown">
        <div class="breakdown-item">
          <span class="label">产品总价：</span>
          <span class="value">¥{{ totals.subtotal.toFixed(2) }}</span>
        </div>
        <div class="breakdown-item discount">
          <span class="label">折扣金额：</span>
          <span class="value">-¥{{ totals.discount.toFixed(2) }}</span>
        </div>
        <div class="breakdown-item">
          <span class="label">税费：</span>
          <span class="value">¥{{ totals.tax.toFixed(2) }}</span>
        </div>
        <div class="breakdown-item">
          <span class="label">运费：</span>
          <span class="value">¥{{ totals.shipping.toFixed(2) }}</span>
        </div>
        <div class="breakdown-item">
          <span class="label">保险费：</span>
          <span class="value">¥{{ totals.insurance.toFixed(2) }}</span>
        </div>
        <div class="breakdown-item">
          <span class="label">其他费用：</span>
          <span class="value">¥{{ totals.other.toFixed(2) }}</span>
        </div>
        <div class="breakdown-item total">
          <span class="label">最终价格：</span>
          <span class="value">¥{{ totals.final.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- 价格历史记录 -->
    <div class="history-section">
      <h2>价格历史</h2>
      <div class="history-list">
        <div v-for="(record, index) in priceHistory" :key="index" class="history-item">
          <div class="history-time">{{ formatTime(record.timestamp) }}</div>
          <div class="history-details">
            <span class="final-price">¥{{ record.finalPrice.toFixed(2) }}</span>
            <span class="change-amount" :class="getChangeClass(record.change)">
              {{ record.change > 0 ? '+' : '' }}{{ record.change.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 接口定义
interface Product {
  id: string
  name: string
  spec: string
  quantity: number
  unitPrice: number
}

interface VolumeTier {
  minQuantity: number
  maxQuantity: number
  discount: number
}

interface Promotion {
  id: string
  name: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  conditions?: string
}

interface PriceRecord {
  timestamp: Date
  finalPrice: number
  change: number
  itemsCount: number
}

// 响应式数据
const products = ref<Product[]>([
  {
    id: '1',
    name: '示例产品',
    spec: '标准规格',
    quantity: 1,
    unitPrice: 100
  }
])

const discountType = ref<'percentage' | 'fixed' | 'volume' | 'promotion'>('percentage')
const percentageDiscount = ref(0)
const fixedDiscount = ref(0)
const volumeTiers = ref<VolumeTier[]>([
  { minQuantity: 10, maxQuantity: 50, discount: 5 },
  { minQuantity: 51, maxQuantity: 100, discount: 10 }
])

const promotions = ref<Promotion[]>([
  { id: '1', name: '新春特惠', description: '满1000减100', discountType: 'fixed', discountValue: 100 },
  { id: '2', name: '批量优惠', description: '满10件8折', discountType: 'percentage', discountValue: 20 }
])
const selectedPromotion = ref('')

const taxRate = ref(13)
const customTaxRate = ref(0)
const shippingFee = ref(0)
const insuranceFee = ref(0)
const otherFees = ref(0)

const priceHistory = ref<PriceRecord[]>([])

// 计算总价
const totals = reactive({
  subtotal: 0,
  discount: 0,
  tax: 0,
  shipping: 0,
  insurance: 0,
  other: 0,
  final: 0
})

// 计算总价
const calculateTotals = () => {
  // 计算产品总价
  totals.subtotal = products.value.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice)
  }, 0)

  // 计算折扣
  let discountAmount = 0
  if (discountType.value === 'percentage') {
    discountAmount = totals.subtotal * (percentageDiscount.value / 100)
  } else if (discountType.value === 'fixed') {
    discountAmount = fixedDiscount.value
  } else if (discountType.value === 'volume') {
    const totalQuantity = products.value.reduce((sum, item) => sum + item.quantity, 0)
    const applicableTier = volumeTiers.value.find(tier => 
      totalQuantity >= tier.minQuantity && totalQuantity <= tier.maxQuantity
    )
    if (applicableTier) {
      discountAmount = totals.subtotal * (applicableTier.discount / 100)
    }
  } else if (discountType.value === 'promotion') {
    const promo = promotions.value.find(p => p.id === selectedPromotion.value)
    if (promo) {
      if (promo.discountType === 'percentage') {
        discountAmount = totals.subtotal * (promo.discountValue / 100)
      } else {
        discountAmount = promo.discountValue
      }
    }
  }
  totals.discount = Math.min(discountAmount, totals.subtotal) // 折扣不能超过总价

  // 计算税费
  const taxableAmount = totals.subtotal - totals.discount
  totals.tax = taxableAmount * (taxRate.value / 100)

  // 其他费用
  totals.shipping = Number(shippingFee.value) || 0
  totals.insurance = Number(insuranceFee.value) || 0
  totals.other = Number(otherFees.value) || 0

  // 计算最终价格
  totals.final = totals.subtotal - totals.discount + totals.tax + totals.shipping + totals.insurance + totals.other
  
  // 添加到历史记录
  addToHistory()
}

// 添加到价格历史
const addToHistory = () => {
  const lastRecord = priceHistory.value[0]
  const change = lastRecord ? totals.final - lastRecord.finalPrice : 0
  
  priceHistory.value.unshift({
    timestamp: new Date(),
    finalPrice: totals.final,
    change: change,
    itemsCount: products.value.length
  })
  
  // 最多保留10条历史记录
  if (priceHistory.value.length > 10) {
    priceHistory.value = priceHistory.value.slice(0, 10)
  }
}

// 格式化时间
const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取变化样式类
const getChangeClass = (change: number) => {
  if (change > 0) return 'increase'
  if (change < 0) return 'decrease'
  return 'no-change'
}

// 添加产品
const addProduct = () => {
  const newProduct: Product = {
    id: Date.now().toString(),
    name: '新产品',
    spec: '规格待定',
    quantity: 1,
    unitPrice: 0
  }
  products.value.push(newProduct)
}

// 删除产品
const removeProduct = (index: number) => {
  products.value.splice(index, 1)
  calculateTotals()
}

// 添加批量折扣层级
const addVolumeTier = () => {
  volumeTiers.value.push({
    minQuantity: 0,
    maxQuantity: 0,
    discount: 0
  })
}

// 删除批量折扣层级
const removeVolumeTier = (index: number) => {
  volumeTiers.value.splice(index, 1)
  calculateTotals()
}

// 应用促销折扣
const applyPromotion = () => {
  calculateTotals()
  if (selectedPromotion.value) {
    const promo = promotions.value.find(p => p.id === selectedPromotion.value)
    if (promo) {
      ElMessage.success(`已应用促销活动：${promo.name}`)
    }
  }
}

// 生命周期
onMounted(() => {
  calculateTotals()
})
</script>

<style scoped>
.price-calculator {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--surface-color);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
}

.calculator-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.calculator-icon {
  width: 48px;
  height: 48px;
  background: var(--primary-color);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calculator-icon svg {
  width: 24px;
  height: 24px;
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

.products-section,
.discount-section,
.fees-section,
.summary-section,
.history-section {
  margin-bottom: 2rem;
}

.products-section h2,
.discount-section h2,
.fees-section h2,
.summary-section h2,
.history-section h2 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.products-list {
  background: var(--background-color);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: var(--surface-color);
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: 600;
  color: var(--text-primary);
}

.product-spec {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.price-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.input-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.subtotal {
  font-weight: 600;
  color: var(--primary-color);
  min-width: 80px;
  text-align: right;
}

.discount-type-selector {
  margin-bottom: 1rem;
}

.discount-inputs,
.volume-discounts,
.promotion-discounts {
  background: var(--background-color);
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.volume-discounts {
  max-height: 300px;
  overflow-y: auto;
}

.volume-table {
  margin-bottom: 1rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--surface-color);
  border-radius: 4px;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.tier-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: var(--surface-color);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  margin-right: 1rem;
}

.promo-option {
  display: flex;
  flex-direction: column;
}

.promo-name {
  font-weight: 600;
}

.promo-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.fees-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.fee-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.fee-item label {
  font-weight: 500;
  color: var(--text-secondary);
}

.price-breakdown {
  background: var(--background-color);
  border-radius: 8px;
  padding: 1.5rem;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.breakdown-item:last-child {
  border-bottom: none;
}

.breakdown-item.total {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 2px solid var(--border-color);
}

.breakdown-item.discount {
  color: var(--error-color);
}

.label {
  font-weight: 500;
  color: var(--text-secondary);
}

.value {
  font-weight: 600;
  color: var(--text-primary);
}

.history-list {
  background: var(--background-color);
  border-radius: 8px;
  padding: 1rem;
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.history-item:last-child {
  border-bottom: none;
}

.history-time {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.history-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.final-price {
  font-weight: 600;
  color: var(--text-primary);
}

.change-amount {
  font-size: 0.9rem;
  font-weight: 600;
}

.change-amount.increase {
  color: var(--error-color);
}

.change-amount.decrease {
  color: var(--success-color);
}

.change-amount.no-change {
  color: var(--text-secondary);
}

.add-product-btn {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .price-calculator {
    padding: 1rem;
  }
  
  .price-controls {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .fees-grid {
    grid-template-columns: 1fr;
  }
  
  .tier-row {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .range-inputs {
    margin-right: 0;
  }
}
</style>