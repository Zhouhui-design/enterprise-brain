<template>
  <div class="scan-out mobile-page">
    <div class="mobile-header">
      <van-nav-bar
        title="扫码出库"
        left-text="返回"
        left-arrow
        @click-left="$router.back()"
      >
        <template #right>
          <van-icon name="records" @click="showHistory = true" />
        </template>
      </van-nav-bar>
    </div>

    <div class="mobile-content">
      <!-- 扫码区域 -->
      <div class="scan-section">
        <div class="scan-box" :class="{ scanning: isScanning }" @click="startScan">
          <div class="scan-border">
            <div class="scan-line" v-if="isScanning"></div>
            <div class="scan-tips" v-if="!isScanning">
              <van-icon name="scan" size="48" color="#ff6034" />
              <p>点击扫码或手动输入</p>
            </div>
          </div>
        </div>

        <van-field
          v-model="scanCode"
          placeholder="请输入或扫描条码"
          clearable
          @focus="showKeyboard = true"
          @blur="showKeyboard = false"
        >
          <template #button>
            <van-button size="small" type="warning" @click="manualInput">
              手动输入
            </van-button>
          </template>
        </van-field>
      </div>

      <!-- 产品信息 -->
      <div class="product-info" v-if="productInfo">
        <van-cell-group>
          <van-cell title="产品名称" :value="productInfo.name" />
          <van-cell title="产品型号" :value="productInfo.model" />
          <van-cell title="规格" :value="productInfo.specification" />
          <van-cell title="单位" :value="productInfo.unit" />
          <van-cell title="当前库存" :value="`${productInfo.currentStock}${productInfo.unit}`">
            <template #right-icon>
              <van-tag :type="getStockType(productInfo.currentStock)">
                {{ getStockLabel(productInfo.currentStock) }}
              </van-tag>
            </template>
          </van-cell>
          <van-cell title="库位" :value="productInfo.location" />
        </van-cell-group>
      </div>

      <!-- 出库信息 -->
      <div class="out-info" v-if="productInfo">
        <van-cell-group>
          <van-field
            v-model="outForm.quantity"
            label="出库数量"
            type="number"
            placeholder="请输入出库数量"
            right-icon="records"
            @click-right-icon="showCalculator = true"
          />
          <van-field
            v-model="outForm.purpose"
            label="出库用途"
            placeholder="请选择出库用途"
            readonly
            is-link
            @click="showPurposePicker = true"
          />
          <van-field
            v-model="outForm.receiver"
            label="接收人"
            placeholder="请输入接收人"
          />
          <van-field
            v-model="outForm.vehicle"
            label="车辆信息"
            placeholder="请输入车牌号"
          />
          <van-field
            v-model="outForm.remark"
            label="备注"
            type="textarea"
            placeholder="请输入备注信息"
            rows="3"
          />
        </van-cell-group>
      </div>

      <!-- 批量操作 -->
      <div class="batch-operations" v-if="batchList.length > 0">
        <van-divider>批量出库清单</van-divider>
        <van-swipe-cell v-for="item in batchList" :key="item.id">
          <van-cell
            :title="item.name"
            :label="`库位: ${item.location} | 用途: ${item.purpose}`"
            :value="`${item.quantity}${item.unit}`"
          >
            <template #icon>
              <van-icon name="minus" color="#ff6034" />
            </template>
          </van-cell>
          <template #right>
            <van-button square type="danger" text @click="removeBatchItem(item.id)">
              删除
            </van-button>
          </template>
        </van-swipe-cell>
        
        <van-cell title="合计" :value="`${totalQuantity} 件`" class="total-cell" />
      </div>

      <!-- 快速操作 -->
      <div class="quick-actions">
        <van-grid :column-num="2" :gutter="12">
          <van-grid-item @click="quickScan('sales')">
            <van-icon name="cart-o" size="24" color="#1989fa" />
            <span>销售出库</span>
          </van-grid-item>
          <van-grid-item @click="quickScan('production')">
            <van-icon name="records" size="24" color="#07c160" />
            <span>生产出库</span>
          </van-grid-item>
          <van-grid-item @click="quickScan('transfer')">
            <van-icon name="exchange" size="24" color="#ff6034" />
            <span>调拨出库</span>
          </van-grid-item>
          <van-grid-item @click="quickScan('other')">
            <van-icon name="more-o" size="24" color="#7d7e80" />
            <span>其他出库</span>
          </van-grid-item>
        </van-grid>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="mobile-footer" v-if="productInfo">
      <van-row gutter="12">
        <van-col span="8">
          <van-button 
            plain 
            type="warning" 
            block 
            round 
            @click="addToBatch"
            :disabled="!outForm.quantity"
          >
            加入清单
          </van-button>
        </van-col>
        <van-col span="16">
          <van-button 
            type="warning" 
            block 
            round 
            @click="submitOut"
            :loading="submitting"
          >
            确认出库
          </van-button>
        </van-col>
      </van-row>
    </div>

    <!-- 用途选择器 -->
    <van-popup v-model:show="showPurposePicker" position="bottom">
      <van-picker
        :columns="purposeColumns"
        @confirm="onPurposeConfirm"
        @cancel="showPurposePicker = false"
      />
    </van-popup>

    <!-- 数字键盘 -->
    <van-number-keyboard
      v-model="calculatorValue"
      :show="showCalculator"
      theme="custom"
      extra-key="."
      close-button-text="完成"
      @blur="showCalculator = false"
      @input="onCalculatorInput"
      @delete="onCalculatorDelete"
    />

    <!-- 历史记录 -->
    <van-popup v-model:show="showHistory" position="bottom" :style="{ height: '70%' }">
      <van-nav-bar
        title="出库记录"
        left-text="关闭"
        @click-left="showHistory = false"
      />
      <van-list
        v-model:loading="historyLoading"
        :finished="historyFinished"
        finished-text="没有更多了"
        @load="loadHistory"
      >
        <van-cell
          v-for="record in historyRecords"
          :key="record.id"
          :title="record.productName"
          :label="`${record.time} | ${record.receiver}`"
          :value="`${record.quantity}${record.unit}`"
          is-link
          @click="viewHistoryRecord(record)"
        >
          <template #icon>
            <van-icon name="minus" color="#ff6034" />
          </template>
        </van-cell>
      </van-list>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { showToast, showSuccessToast, showFailToast, showConfirmDialog } from 'vant'

// 响应式数据
const isScanning = ref(false)
const scanCode = ref('')
const showKeyboard = ref(false)
const showCalculator = ref(false)
const calculatorValue = ref('')
const showPurposePicker = ref(false)
const showHistory = ref(false)
const submitting = ref(false)

const productInfo = ref(null)

const outForm = reactive({
  quantity: '',
  purpose: '',
  receiver: '',
  vehicle: '',
  remark: ''
})

const batchList = ref([])
const historyRecords = ref([])
const historyLoading = ref(false)
const historyFinished = ref(false)

const purposeColumns = [
  { text: '销售出库', value: 'sales' },
  { text: '生产出库', value: 'production' },
  { text: '调拨出库', value: 'transfer' },
  { text: '报废出库', value: 'scrap' },
  { text: '赠送出库', value: 'gift' },
  { text: '其他出库', value: 'other' }
]

// 计算属性
const totalQuantity = computed(() => {
  return batchList.value.reduce((sum, item) => sum + parseInt(item.quantity), 0)
})

// 方法
const startScan = () => {
  isScanning.value = true
  
  // 模拟扫码过程
  setTimeout(() => {
    isScanning.value = false
    scanCode.value = 'P202401002345'
    handleScanResult(scanCode.value)
  }, 2000)
}

const handleScanResult = (code: string) => {
  // 震动反馈
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100])
  }
  
  // 模拟查询产品信息
  productInfo.value = {
    id: 1,
    name: '汽车变速箱总成',
    model: 'DQ380-7DSG',
    specification: '7速双离合',
    unit: '台',
    currentStock: 8,
    location: 'A-02-01',
    code: code
  }
  
  showSuccessToast('扫码成功')
}

const manualInput = () => {
  if (!scanCode.value) {
    showToast('请输入条码')
    return
  }
  handleScanResult(scanCode.value)
}

const quickScan = (purpose: string) => {
  startScan()
  outForm.purpose = purposeColumns.find(col => col.value === purpose)?.text || purpose
}

const getStockType = (stock: number) => {
  if (stock < 5) return 'danger'
  if (stock < 20) return 'warning'
  return 'success'
}

const getStockLabel = (stock: number) => {
  if (stock < 5) return '库存不足'
  if (stock < 20) return '库存偏低'
  return '库存充足'
}

const onPurposeConfirm = ({ selectedOptions }: any) => {
  outForm.purpose = selectedOptions[0].text
  showPurposePicker.value = false
}

const onCalculatorInput = (value: string) => {
  calculatorValue.value += value
}

const onCalculatorDelete = () => {
  calculatorValue.value = calculatorValue.value.slice(0, -1)
}

const addToBatch = () => {
  if (!outForm.quantity) {
    showToast('请输入出库数量')
    return
  }
  
  if (!outForm.purpose) {
    showToast('请选择出库用途')
    return
  }

  // 检查库存是否足够
  if (parseInt(outForm.quantity) > productInfo.value.currentStock) {
    showToast('出库数量超过库存')
    return
  }

  const batchItem = {
    id: Date.now(),
    name: productInfo.value.name,
    quantity: outForm.quantity,
    unit: productInfo.value.unit,
    location: productInfo.value.location,
    purpose: outForm.purpose,
    code: productInfo.value.code
  }

  batchList.value.push(batchItem)
  
  // 重置出库表单
  Object.assign(outForm, {
    quantity: '',
    receiver: '',
    vehicle: '',
    remark: ''
  })
  
  productInfo.value = null
  scanCode.value = ''
  
  showSuccessToast('已加入清单')
}

const removeBatchItem = (id: number) => {
  batchList.value = batchList.value.filter(item => item.id !== id)
}

const submitOut = async () => {
  if (!outForm.quantity) {
    showToast('请输入出库数量')
    return
  }
  
  if (!outForm.purpose) {
    showToast('请选择出库用途')
    return
  }

  submitting.value = true

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 添加到历史记录
    historyRecords.value.unshift({
      id: Date.now(),
      productName: productInfo.value.name,
      quantity: outForm.quantity,
      unit: productInfo.value.unit,
      receiver: outForm.receiver,
      time: new Date().toLocaleTimeString(),
      purpose: outForm.purpose
    })
    
    // 更新库存
    productInfo.value.currentStock -= parseInt(outForm.quantity)
    
    showSuccessToast('出库成功')
    resetForm()
  } catch (error) {
    showFailToast('出库失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  scanCode.value = ''
  productInfo.value = null
  Object.assign(outForm, {
    quantity: '',
    purpose: '',
    receiver: '',
    vehicle: '',
    remark: ''
  })
}

const loadHistory = async () => {
  historyLoading.value = true
  
  // 模拟加载数据
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const newRecords = [
    {
      id: Date.now() + 1,
      productName: '发动机总成',
      quantity: 3,
      unit: '台',
      receiver: '张先生',
      time: '16:30:25',
      purpose: '销售出库'
    },
    {
      id: Date.now() + 2,
      productName: '底盘件套装',
      quantity: 15,
      unit: '套',
      receiver: '生产车间',
      time: '15:45:18',
      purpose: '生产出库'
    }
  ]
  
  historyRecords.value.push(...newRecords)
  historyLoading.value = false
  historyFinished.value = true
}

const viewHistoryRecord = (record: any) => {
  showToast(`查看记录：${record.productName}`)
}

// 监听计算器关闭
const stopCalculator = () => {
  if (calculatorValue.value) {
    outForm.quantity = calculatorValue.value
  }
  calculatorValue.value = ''
}

onMounted(() => {
  // 页面初始化
})
</script>

<style scoped>
.scan-out {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

.mobile-content {
  padding: 16px;
}

.scan-section {
  margin-bottom: 16px;
}

.scan-box {
  width: 100%;
  height: 200px;
  background: #000;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  margin-bottom: 12px;
  cursor: pointer;
}

.scan-border {
  width: 100%;
  height: 100%;
  border: 2px solid #ff6034;
  border-radius: 8px;
  position: relative;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff6034, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}

.scan-tips {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #ff6034;
}

.scan-tips p {
  margin-top: 8px;
  font-size: 14px;
}

.scan-box.scanning {
  background: radial-gradient(circle, rgba(255, 96, 52, 0.1) 0%, transparent 70%);
}

.product-info,
.out-info {
  margin-bottom: 16px;
}

.batch-operations {
  margin-bottom: 16px;
}

.total-cell {
  font-weight: bold;
  color: #ff6034;
}

.quick-actions {
  margin-top: 24px;
}

.quick-actions span {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #646566;
}

.mobile-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .mobile-content {
    padding: 12px;
  }
  
  .scan-box {
    height: 160px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 600px) {
  .scan-box {
    height: 120px;
  }
  
  .mobile-footer {
    padding: 12px;
  }
}
</style>