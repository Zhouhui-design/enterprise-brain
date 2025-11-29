<template>
  <div class="quote-calculator">
    <div class="calculator-header">
      <h3 class="header-title">
        <i class="fas fa-calculator"></i>
        报价计算器
      </h3>
      <div class="header-actions">
        <button class="btn-clear" @click="clearCalculator">
          <i class="fas fa-trash"></i>
          清空
        </button>
        <button class="btn-save" @click="saveConfiguration">
          <i class="fas fa-save"></i>
          保存配置
        </button>
      </div>
    </div>

    <div class="calculator-content">
      <!-- 产品列表 -->
      <div class="products-section">
        <div class="section-header">
          <h4>产品清单</h4>
          <button class="btn-add-product" @click="addProduct">
            <i class="fas fa-plus"></i>
            添加产品
          </button>
        </div>
        
        <div class="products-list">
          <div 
            v-for="(product, index) in products" 
            :key="index"
            class="product-item"
          >
            <div class="product-info">
              <div class="product-name">
                <input 
                  v-model="product.name" 
                  type="text" 
                  placeholder="产品名称"
                  class="product-input"
                />
              </div>
              <div class="product-details">
                <input 
                  v-model="product.description" 
                  type="text" 
                  placeholder="产品描述"
                  class="product-input description"
                />
              </div>
            </div>
            
            <div class="product-pricing">
              <div class="pricing-input">
                <label>数量</label>
                <input 
                  v-model.number="product.quantity" 
                  type="number" 
                  min="1"
                  step="1"
                  @input="calculateTotals"
                />
              </div>
              <div class="pricing-input">
                <label>单价</label>
                <input 
                  v-model.number="product.unitPrice" 
                  type="number" 
                  min="0"
                  step="0.01"
                  @input="calculateTotals"
                />
              </div>
              <div class="pricing-input">
                <label>折扣率(%)</label>
                <input 
                  v-model.number="product.discountRate" 
                  type="number" 
                  min="0"
                  max="100"
                  step="0.1"
                  @input="calculateTotals"
                />
              </div>
              <div class="pricing-result">
                <label>小计</label>
                <span class="subtotal">¥{{ (product.quantity * product.unitPrice * (1 - product.discountRate/100)).toFixed(2) }}</span>
              </div>
            </div>
            
            <button class="btn-remove" @click="removeProduct(index)">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 费用配置 -->
      <div class="fees-section">
        <div class="section-header">
          <h4>费用配置</h4>
        </div>
        
        <div class="fees-grid">
          <div class="fee-item">
            <div class="fee-input">
              <label>
                <input 
                  type="checkbox" 
                  v-model="enableShipping"
                  @change="calculateTotals"
                />
                运输费用
              </label>
              <input 
                v-model.number="shippingFee" 
                type="number" 
                min="0"
                step="0.01"
                :disabled="!enableShipping"
                @input="calculateTotals"
              />
            </div>
          </div>
          
          <div class="fee-item">
            <div class="fee-input">
              <label>
                <input 
                  type="checkbox" 
                  v-model="enableTax"
                  @change="calculateTotals"
                />
                税费
              </label>
              <input 
                v-model.number="taxRate" 
                type="number" 
                min="0"
                max="100"
                step="0.1"
                :disabled="!enableTax"
                @input="calculateTotals"
              />
              <span class="unit">%</span>
            </div>
          </div>
          
          <div class="fee-item">
            <div class="fee-input">
              <label>
                <input 
                  type="checkbox" 
                  v-model="enableInsurance"
                  @change="calculateTotals"
                />
                保险费用
              </label>
              <input 
                v-model.number="insuranceRate" 
                type="number" 
                min="0"
                max="100"
                step="0.1"
                :disabled="!enableInsurance"
                @input="calculateTotals"
              />
              <span class="unit">%</span>
            </div>
          </div>
          
          <div class="fee-item">
            <div class="fee-input">
              <label>其他费用</label>
              <input 
                v-model.number="otherFees" 
                type="number" 
                min="0"
                step="0.01"
                @input="calculateTotals"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 汇总信息 -->
      <div class="summary-section">
        <div class="summary-grid">
          <div class="summary-item">
            <label>产品总价</label>
            <span class="value">¥{{ totals.subtotal.toFixed(2) }}</span>
          </div>
          
          <div class="summary-item">
            <label>折扣优惠</label>
            <span class="value discount">-¥{{ totals.totalDiscount.toFixed(2) }}</span>
          </div>
          
          <div v-if="enableShipping" class="summary-item">
            <label>运输费用</label>
            <span class="value">¥{{ totals.shippingFee.toFixed(2) }}</span>
          </div>
          
          <div v-if="enableTax" class="summary-item">
            <label>税费</label>
            <span class="value">¥{{ totals.taxAmount.toFixed(2) }}</span>
          </div>
          
          <div v-if="enableInsurance" class="summary-item">
            <label>保险费用</label>
            <span class="value">¥{{ totals.insuranceFee.toFixed(2) }}</span>
          </div>
          
          <div v-if="otherFees > 0" class="summary-item">
            <label>其他费用</label>
            <span class="value">¥{{ totals.otherFees.toFixed(2) }}</span>
          </div>
          
          <div class="summary-item total">
            <label>最终报价</label>
            <span class="value final">¥{{ totals.finalTotal.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- 报价信息 -->
      <div class="quotation-info">
        <div class="section-header">
          <h4>报价信息</h4>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <label>有效期(天)</label>
            <input 
              v-model.number="quotationInfo.validDays" 
              type="number" 
              min="1"
              max="365"
            />
          </div>
          
          <div class="info-item">
            <label>付款方式</label>
            <select v-model="quotationInfo.paymentMethod">
              <option value="full">全额付款</option>
              <option value="deposit">预付款 + 尾款</option>
              <option value="installment">分期付款</option>
            </select>
          </div>
          
          <div class="info-item" v-if="quotationInfo.paymentMethod === 'deposit'">
            <label>预付款比例(%)</label>
            <input 
              v-model.number="quotationInfo.depositRate" 
              type="number" 
              min="10"
              max="90"
              step="5"
            />
          </div>
          
          <div class="info-item">
            <label>交货期(天)</label>
            <input 
              v-model.number="quotationInfo.deliveryDays" 
              type="number" 
              min="1"
              max="365"
            />
          </div>
        </div>
        
        <div class="remarks-item">
          <label>备注说明</label>
          <textarea 
            v-model="quotationInfo.remarks" 
            rows="3"
            placeholder="请输入报价备注信息..."
          ></textarea>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <button class="btn-secondary" @click="exportQuotation">
          <i class="fas fa-download"></i>
          导出报价
        </button>
        <button class="btn-primary" @click="generateQuotation">
          <i class="fas fa-file-invoice"></i>
          生成报价单
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 接口定义
interface Product {
  name: string
  description: string
  quantity: number
  unitPrice: number
  discountRate: number
}

interface QuotationInfo {
  validDays: number
  paymentMethod: string
  depositRate: number
  deliveryDays: number
  remarks: string
}

interface Totals {
  subtotal: number
  totalDiscount: number
  shippingFee: number
  taxAmount: number
  insuranceFee: number
  otherFees: number
  finalTotal: number
}

// 响应式数据
const products = ref<Product[]>([
  { name: '', description: '', quantity: 1, unitPrice: 0, discountRate: 0 }
])

const enableShipping = ref(false)
const shippingFee = ref(0)
const enableTax = ref(false)
const taxRate = ref(13)
const enableInsurance = ref(false)
const insuranceRate = ref(0.5)
const otherFees = ref(0)

const quotationInfo = reactive<QuotationInfo>({
  validDays: 30,
  paymentMethod: 'full',
  depositRate: 30,
  deliveryDays: 7,
  remarks: ''
})

// 计算属性
const totals = computed<Totals>(() => {
  let subtotal = 0
  let totalDiscount = 0
  
  products.value.forEach(product => {
    const productTotal = product.quantity * product.unitPrice
    const productDiscount = productTotal * (product.discountRate / 100)
    
    subtotal += productTotal
    totalDiscount += productDiscount
  })
  
  const netSubtotal = subtotal - totalDiscount
  const calculatedTax = enableTax.value ? netSubtotal * (taxRate.value / 100) : 0
  const calculatedShipping = enableShipping.value ? shippingFee.value : 0
  const calculatedInsurance = enableInsurance.value ? netSubtotal * (insuranceRate.value / 100) : 0
  
  return {
    subtotal,
    totalDiscount,
    shippingFee: calculatedShipping,
    taxAmount: calculatedTax,
    insuranceFee: calculatedInsurance,
    otherFees: otherFees.value,
    finalTotal: subtotal - totalDiscount + calculatedShipping + calculatedTax + calculatedInsurance + otherFees.value
  }
})

// 方法
const addProduct = () => {
  products.value.push({ 
    name: '', 
    description: '', 
    quantity: 1, 
    unitPrice: 0, 
    discountRate: 0 
  })
}

const removeProduct = (index: number) => {
  if (products.value.length > 1) {
    products.value.splice(index, 1)
    calculateTotals()
  }
}

const calculateTotals = () => {
  // 计算由 computed 属性自动处理
}

const clearCalculator = () => {
  products.value = [{ name: '', description: '', quantity: 1, unitPrice: 0, discountRate: 0 }]
  enableShipping.value = false
  shippingFee.value = 0
  enableTax.value = false
  taxRate.value = 13
  enableInsurance.value = false
  insuranceRate.value = 0.5
  otherFees.value = 0
  
  Object.assign(quotationInfo, {
    validDays: 30,
    paymentMethod: 'full',
    depositRate: 30,
    deliveryDays: 7,
    remarks: ''
  })
  
  ElMessage.success('计算器已清空')
}

const saveConfiguration = () => {
  const config = {
    products: products.value,
    fees: {
      enableShipping: enableShipping.value,
      shippingFee: shippingFee.value,
      enableTax: enableTax.value,
      taxRate: taxRate.value,
      enableInsurance: enableInsurance.value,
      insuranceRate: insuranceRate.value,
      otherFees: otherFees.value
    },
    quotationInfo: quotationInfo
  }
  
  localStorage.setItem('quotationCalculatorConfig', JSON.stringify(config))
  ElMessage.success('配置已保存')
}

const exportQuotation = () => {
  const quotationData = {
    products: products.value.filter(p => p.name && p.unitPrice > 0),
    totals: totals.value,
    quotationInfo: quotationInfo,
    exportTime: new Date().toISOString()
  }
  
  const dataStr = JSON.stringify(quotationData, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
  
  const exportFileDefaultName = `quotation_${new Date().getTime()}.json`
  
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
  
  ElMessage.success('报价已导出')
}

const generateQuotation = () => {
  const validProducts = products.value.filter(p => p.name && p.unitPrice > 0)
  
  if (validProducts.length === 0) {
    ElMessage.error('请至少添加一个有效的产品')
    return
  }
  
  const quotationData = {
    products: validProducts,
    totals: totals.value,
    quotationInfo: quotationInfo,
    validUntil: new Date(Date.now() + quotationInfo.validDays * 24 * 60 * 60 * 1000).toLocaleDateString()
  }
  
  // 这里可以触发生成报价单的事件或导航到报价单创建页面
  ElMessage.success('报价单生成成功')
  
  // 发射事件给父组件
  console.log('Generated quotation:', quotationData)
}

// 初始化时加载保存的配置
const loadConfiguration = () => {
  const savedConfig = localStorage.getItem('quotationCalculatorConfig')
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig)
      
      if (config.products && config.products.length > 0) {
        products.value = config.products
      }
      
      if (config.fees) {
        enableShipping.value = config.fees.enableShipping || false
        shippingFee.value = config.fees.shippingFee || 0
        enableTax.value = config.fees.enableTax || false
        taxRate.value = config.fees.taxRate || 13
        enableInsurance.value = config.fees.enableInsurance || false
        insuranceRate.value = config.fees.insuranceRate || 0.5
        otherFees.value = config.fees.otherFees || 0
      }
      
      if (config.quotationInfo) {
        Object.assign(quotationInfo, config.quotationInfo)
      }
    } catch (error) {
      console.error('Failed to load configuration:', error)
    }
  }
}

// 组件挂载时加载配置
loadConfiguration()
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

.quote-calculator {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.quote-calculator:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}

.calculator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, var(--color-teal), var(--color-slate));
}

.header-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title i {
  font-size: 1.125rem;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-clear, .btn-save {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 12px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-clear:hover, .btn-save:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.calculator-content {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Section Styles */
.products-section, .fees-section, .summary-section, .quotation-info {
  border-radius: 16px;
  border: 1px solid var(--color-gray-light);
  padding: 24px;
  background: rgba(248, 250, 252, 0.5);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h4 {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-slate);
  margin: 0;
}

.btn-add-product {
  padding: 10px 16px;
  background: var(--color-teal);
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

.btn-add-product:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(56, 178, 172, 0.3);
}

/* Products List */
.products-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-item {
  display: grid;
  grid-template-columns: 2fr 1fr auto;
  gap: 20px;
  align-items: start;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--color-gray-light);
  border-radius: 12px;
  position: relative;
  transition: all 0.2s ease;
}

.product-item:hover {
  border-color: var(--color-teal);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-input {
  padding: 12px 16px;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;
}

.product-input.description {
  font-size: 13px;
  color: var(--color-gray-medium);
}

.product-input:focus {
  outline: none;
  border-color: var(--color-teal);
  box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1);
}

.product-pricing {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.pricing-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pricing-input label {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pricing-input input {
  padding: 8px 12px;
  border: 1px solid var(--color-gray-light);
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;
}

.pricing-input input:focus {
  outline: none;
  border-color: var(--color-teal);
}

.pricing-result {
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
}

.pricing-result label {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.subtotal {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-teal);
  padding: 8px 12px;
  background: rgba(56, 178, 172, 0.1);
  border-radius: 6px;
  text-align: center;
}

.btn-remove {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  background: var(--color-danger);
  border: none;
  border-radius: 50%;
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

/* Fees Section */
.fees-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.fee-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
}

.fee-input {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.fee-input label {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-slate);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.fee-input input[type="number"] {
  padding: 8px 12px;
  border: 1px solid var(--color-gray-light);
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.9);
  width: 100px;
  transition: all 0.2s ease;
}

.fee-input input[type="number"]:focus {
  outline: none;
  border-color: var(--color-teal);
}

.fee-input input[type="number"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fee-input input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.fee-input .unit {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
}

/* Summary Section */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
}

.summary-item label {
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

.summary-item .value.discount {
  color: var(--color-success);
}

.summary-item .value.final {
  color: var(--color-teal);
  font-size: 20px;
}

.summary-item.total {
  grid-column: span 2;
  background: linear-gradient(135deg, rgba(56, 178, 172, 0.1), rgba(45, 55, 72, 0.1));
  border: 2px solid var(--color-teal);
}

/* Quotation Info */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item label {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-item input, .info-item select {
  padding: 10px 14px;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;
}

.info-item input:focus, .info-item select:focus {
  outline: none;
  border-color: var(--color-teal);
}

.remarks-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.remarks-item label {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-gray-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.remarks-item textarea {
  padding: 12px 16px;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.9);
  resize: vertical;
  transition: all 0.2s ease;
}

.remarks-item textarea:focus {
  outline: none;
  border-color: var(--color-teal);
}

/* Action Section */
.action-section {
  display: flex;
  gap: 16px;
}

.btn-secondary, .btn-primary {
  padding: 16px 32px;
  border-radius: 10px;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 15px;
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
  border: 2px solid var(--color-gray-light);
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
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(56, 178, 172, 0.3);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .product-item {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .product-pricing {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .fees-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-item.total {
    grid-column: span 1;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .calculator-content {
    padding: 20px;
  }
  
  .calculator-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .product-pricing {
    grid-template-columns: 1fr;
  }
  
  .action-section {
    flex-direction: column;
  }
}
</style>