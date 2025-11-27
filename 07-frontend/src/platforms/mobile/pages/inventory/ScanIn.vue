<template>
  <div class="scan-in mobile-page">
    <div class="mobile-header">
      <van-nav-bar
        title="扫码入库"
        left-text="返回"
        left-arrow
        @click-left="$router.back()"
      >
        <template #right>
          <van-icon name="setting-o" @click="showSettings = true" />
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
              <van-icon name="scan" size="48" color="#1989fa" />
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
            <van-button size="small" type="primary" @click="manualInput">
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
          <van-cell title="当前库存" :value="`${productInfo.currentStock}${productInfo.unit}`" />
        </van-cell-group>
      </div>

      <!-- 入库信息 -->
      <div class="in-info" v-if="productInfo">
        <van-cell-group>
          <van-field
            v-model="inForm.quantity"
            label="入库数量"
            type="number"
            placeholder="请输入入库数量"
            right-icon="records"
            @click-right-icon="showCalculator = true"
          />
          <van-field
            v-model="inForm.location"
            label="库位"
            placeholder="请选择或扫描库位"
            readonly
            is-link
            @click="showLocationSelector = true"
          />
          <van-field
            v-model="inForm.batch"
            label="批次号"
            placeholder="请输入批次号"
          />
          <van-field
            v-model="inForm.remark"
            label="备注"
            type="textarea"
            placeholder="请输入备注信息"
            rows="3"
          />
        </van-cell-group>
      </div>

      <!-- 今日入库记录 -->
      <div class="recent-records">
      <van-divider>今日入库记录</van-divider>
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <van-cell
            v-for="record in records"
            :key="record.id"
            :title="record.productName"
            :label="record.time"
            :value="`${record.quantity}${record.unit}`"
            is-link
            @click="viewRecord(record)"
          >
            <template #icon>
              <van-icon name="checked" color="#07c160" />
            </template>
          </van-cell>
        </van-list>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="mobile-footer" v-if="productInfo">
      <van-button 
        type="primary" 
        block 
        round 
        @click="submitIn"
        :loading="submitting"
      >
        确认入库
      </van-button>
    </div>

    <!-- 设置面板 -->
    <van-popup v-model:show="showSettings" position="bottom" :style="{ height: '40%' }">
      <van-cell-group title="扫码设置">
        <van-cell title="连续扫码" is-link @click="showContinuousScan = true" />
        <van-cell title="声音提示" is-link>
          <template #right-icon>
            <van-switch v-model="settings.soundEnabled" />
          </template>
        </van-cell>
        <van-cell title="震动提示" is-link>
          <template #right-icon>
            <van-switch v-model="settings.vibrateEnabled" />
          </template>
        </van-cell>
      </van-cell-group>
    </van-popup>

    <!-- 库位选择器 -->
    <van-popup v-model:show="showLocationSelector" position="bottom" :style="{ height: '60%' }">
      <van-nav-bar
        title="选择库位"
        left-text="取消"
        right-text="确定"
        @click-left="showLocationSelector = false"
        @click-right="confirmLocation"
      />
      <van-area
        :area-list="areaList"
        :value="selectedLocation"
        @change="onLocationChange"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { showToast, showSuccessToast, showFailToast, showConfirmDialog } from 'vant'

// 响应式数据
const isScanning = ref(false)
const scanCode = ref('')
const showKeyboard = ref(false)
const showSettings = ref(false)
const showCalculator = ref(false)
const calculatorValue = ref('')
const showLocationSelector = ref(false)
const selectedLocation = ref('')
const submitting = ref(false)

const settings = reactive({
  soundEnabled: true,
  vibrateEnabled: true,
  continuousScan: false
})

const productInfo = ref(null)

const inForm = reactive({
  quantity: '',
  location: '',
  batch: '',
  remark: ''
})

const records = ref([])
const loading = ref(false)
const finished = ref(false)

const areaList = reactive({
  province_list: {
    'A01': 'A区',
    'B01': 'B区', 
    'C01': 'C区'
  },
  city_list: {
    'A0101': 'A-01',
    'A0102': 'A-02',
    'B0101': 'B-01',
    'B0102': 'B-02',
    'C0101': 'C-01',
    'C0102': 'C-02'
  },
  county_list: {
    'A010101': 'A-01-01',
    'A010102': 'A-01-02',
    'B010101': 'B-01-01',
    'B010102': 'B-01-02'
  }
})

// 方法
const startScan = () => {
  isScanning.value = true
  
  // 模拟扫码过程
  setTimeout(() => {
    isScanning.value = false
    scanCode.value = 'P202401001234'
    handleScanResult(scanCode.value)
  }, 2000)
}

const handleScanResult = (code: string) => {
  if (settings.soundEnabled) {
    // 播放扫码成功音效
  }
  
  if (settings.vibrateEnabled) {
    // 震动反馈
    if (navigator.vibrate) {
      navigator.vibrate(200)
    }
  }
  
  // 模拟查询产品信息
  productInfo.value = {
    id: 1,
    name: '汽车发动机总成',
    model: 'EA888-2.0T',
    specification: '2.0L 直列四缸',
    unit: '台',
    currentStock: 25,
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

const submitIn = async () => {
  if (!inForm.quantity) {
    showToast('请输入入库数量')
    return
  }
  
  if (!inForm.location) {
    showToast('请选择库位')
    return
  }
  
  submitting.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 添加到记录
    records.value.unshift({
      id: Date.now(),
      productName: productInfo.value.name,
      quantity: inForm.quantity,
      unit: productInfo.value.unit,
      time: new Date().toLocaleTimeString(),
      location: inForm.location
    })
    
    // 重置表单
    resetForm()
    
    showSuccessToast('入库成功')
  } catch (error) {
    showFailToast('入库失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  scanCode.value = ''
  productInfo.value = null
  Object.assign(inForm, {
    quantity: '',
    location: '',
    batch: '',
    remark: ''
  })
}

const onLoad = async () => {
  // 模拟加载数据
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 这里应该从API加载数据
  const newRecords = [
    {
      id: Date.now() + 1,
      productName: '变速箱总成',
      quantity: 5,
      unit: '台',
      time: '14:30:25',
      location: 'A-01-01'
    },
    {
      id: Date.now() + 2,
      productName: '底盘件套装',
      quantity: 10,
      unit: '套',
      time: '13:45:18',
      location: 'B-02-03'
    }
  ]
  
  records.value.push(...newRecords)
  loading.value = false
  finished.value = true
}

const viewRecord = (record: any) => {
  showToast(`查看记录：${record.productName}`)
}

const onLocationChange = (values: any) => {
  selectedLocation.value = values[2]?.code || ''
}

const confirmLocation = () => {
  inForm.location = selectedLocation.value
  showLocationSelector.value = false
}

const onCalculatorInput = (value: string) => {
  calculatorValue.value += value
}

const onCalculatorDelete = () => {
  calculatorValue.value = calculatorValue.value.slice(0, -1)
}

// 监听计算器关闭
const stopCalculator = () => {
  if (calculatorValue.value) {
    inForm.quantity = calculatorValue.value
  }
  calculatorValue.value = ''
}

onMounted(() => {
  // 页面初始化
})
</script>

<style scoped>
.scan-in {
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
  border: 2px solid #1989fa;
  border-radius: 8px;
  position: relative;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #1989fa, transparent);
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
  color: #1989fa;
}

.scan-tips p {
  margin-top: 8px;
  font-size: 14px;
}

.scan-box.scanning {
  background: radial-gradient(circle, rgba(25, 137, 250, 0.1) 0%, transparent 70%);
}

.product-info,
.in-info {
  margin-bottom: 16px;
}

.recent-records {
  margin-top: 24px;
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
}
</style>