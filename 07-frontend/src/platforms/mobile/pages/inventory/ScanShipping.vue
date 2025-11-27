<template>
  <div class="scan-shipping mobile-page">
    <div class="mobile-header">
      <van-nav-bar
        title="扫码发货"
        left-text="返回"
        left-arrow
        @click-left="$router.back()"
      >
        <template #right>
          <van-icon name="logistics" @click="showOrderList = true" />
        </template>
      </van-nav-bar>
    </div>

    <div class="mobile-content">
      <!-- 订单信息 -->
      <div class="order-section" v-if="orderInfo">
        <van-cell-group>
          <van-cell title="订单编号" :value="orderInfo.orderNo" />
          <van-cell title="客户名称" :value="orderInfo.customerName" />
          <van-cell title="收货地址" :value="orderInfo.shippingAddress" />
          <van-cell title="物流公司" :value="orderInfo.logisticsCompany" />
          <van-cell title="承运人" :value="orderInfo.carrier" />
          <van-cell title="车牌号" :value="orderInfo.vehicleNumber" />
        </van-cell-group>
      </div>

      <!-- 订单选择 -->
      <div class="order-selector" v-else>
        <van-search
          v-model="orderSearch"
          placeholder="搜索订单编号或客户名称"
          @search="searchOrder"
        />
        <van-button
          type="primary"
          block
          icon="scan"
          @click="scanOrder"
        >
          扫描订单二维码
        </van-button>
      </div>

      <!-- 发货清单 -->
      <div class="shipping-list" v-if="orderInfo">
        <van-divider>发货清单</van-divider>
        
        <van-checkbox-group v-model="checkedItems">
          <van-swipe-cell v-for="item in shippingItems" :key="item.id">
            <van-cell
              clickable
              @click="toggleItem(item)"
            >
              <template #icon>
                <van-checkbox
                  :name="item.id"
                  ref="checkboxes"
                  @click.stop
                />
              </template>
              <template #title>
                <div class="item-title">
                  <span class="item-name">{{ item.name }}</span>
                  <van-tag :type="getStatusType(item.status)">
                    {{ item.status }}
                  </van-tag>
                </div>
              </template>
              <template #label>
                <div class="item-details">
                  <span>SKU: {{ item.sku }}</span>
                  <span>库位: {{ item.location }}</span>
                </div>
              </template>
              <template #value>
                <div class="item-quantity">
                  <span>{{ item.shipped }}/{{ item.quantity }}</span>
                  <van-button
                    size="mini"
                    type="primary"
                    @click.stop="adjustQuantity(item)"
                  >
                    调整
                  </van-button>
                </div>
              </template>
            </van-cell>
            <template #right>
              <van-button
                square
                type="warning"
                text
                @click="scanItem(item)"
              >
                扫码
              </van-button>
            </template>
          </van-swipe-cell>
        </van-checkbox-group>

        <van-cell title="已选择" :value="`${checkedItems.length} 项`" class="summary-cell" />
      </div>

      <!-- 扫码区域 -->
      <div class="scan-section">
        <div class="scan-box" :class="{ scanning: isScanning }" @click="startItemScan">
          <div class="scan-border">
            <div class="scan-line" v-if="isScanning"></div>
            <div class="scan-tips" v-if="!isScanning">
              <van-icon name="scan" size="48" color="#07c160" />
              <p>扫码匹配商品</p>
            </div>
          </div>
        </div>

        <van-field
          v-model="itemScanCode"
          placeholder="请输入或扫描商品条码"
          clearable
        >
          <template #button>
            <van-button size="small" type="success" @click="manualItemInput">
              手动输入
            </van-button>
          </template>
        </van-field>
      </div>

      <!-- 物流信息 -->
      <div class="logistics-info" v-if="orderInfo">
        <van-divider>物流信息</van-divider>
        <van-cell-group>
          <van-field
            v-model="logisticsForm.trackingNumber"
            label="运单号"
            placeholder="请输入运单号"
          />
          <van-field
            v-model="logisticsForm.packageCount"
            label="包装件数"
            type="number"
            placeholder="请输入包装件数"
          />
          <van-field
            v-model="logisticsForm.weight"
            label="总重量(kg)"
            type="number"
            placeholder="请输入总重量"
          />
          <van-field
            v-model="logisticsForm.volume"
            label="总体积(m³)"
            type="number"
            placeholder="请输入总体积"
          />
          <van-field
            v-model="logisticsForm.remark"
            label="发货备注"
            type="textarea"
            placeholder="请输入发货备注"
            rows="3"
          />
        </van-cell-group>
      </div>

      <!-- 签名区域 -->
      <div class="signature-section" v-if="orderInfo && checkedItems.length > 0">
        <van-divider>收货人签名</van-divider>
        <van-signature
          ref="signatureRef"
          @submit="onSignatureSubmit"
          @clear="onSignatureClear"
        />
        <van-row gutter="12">
          <van-col span="12">
            <van-button block @click="clearSignature">清除签名</van-button>
          </van-col>
          <van-col span="12">
            <van-button block type="primary" @click="confirmSignature">确认签名</van-button>
          </van-col>
        </van-row>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="mobile-footer" v-if="orderInfo">
      <van-button 
        type="success" 
        block 
        round 
        @click="submitShipping"
        :loading="submitting"
        :disabled="checkedItems.length === 0"
      >
        确认发货 ({{ checkedItems.length }} 项)
      </van-button>
    </div>

    <!-- 订单列表弹窗 -->
    <van-popup v-model:show="showOrderList" position="bottom" :style="{ height: '80%' }">
      <van-nav-bar
        title="选择订单"
        left-text="取消"
        right-text="确定"
        @click-left="showOrderList = false"
      />
      <van-search
        v-model="orderListSearch"
        placeholder="搜索订单"
      />
      <van-list
        v-model:loading="orderListLoading"
        :finished="orderListFinished"
        finished-text="没有更多了"
        @load="loadOrderList"
      >
        <van-cell
          v-for="order in orderList"
          :key="order.id"
          :title="order.orderNo"
          :label="`客户: ${order.customerName} | 金额: ¥${order.totalAmount}`"
          is-link
          @click="selectOrder(order)"
        />
      </van-list>
    </van-popup>

    <!-- 数量调整弹窗 -->
    <van-popup v-model:show="showQuantityAdjust" position="center" round>
      <div class="quantity-adjust">
        <h3>调整发货数量</h3>
        <van-field
          v-model="adjustForm.quantity"
          label="发货数量"
          type="number"
        />
        <van-button-group>
          <van-button @click="showQuantityAdjust = false">取消</van-button>
          <van-button type="primary" @click="confirmQuantityAdjust">确定</van-button>
        </van-button-group>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { showToast, showSuccessToast, showFailToast, showConfirmDialog } from 'vant'

// 响应式数据
const isScanning = ref(false)
const itemScanCode = ref('')
const orderSearch = ref('')
const orderListSearch = ref('')
const showOrderList = ref(false)
const showQuantityAdjust = ref(false)
const submitting = ref(false)

const orderInfo = ref(null)
const shippingItems = ref([])
const checkedItems = ref([])
const signatureRef = ref()

const logisticsForm = reactive({
  trackingNumber: '',
  packageCount: '',
  weight: '',
  volume: '',
  remark: ''
})

const adjustForm = reactive({
  id: null,
  quantity: ''
})

const currentAdjustItem = ref(null)

const orderList = ref([])
const orderListLoading = ref(false)
const orderListFinished = ref(false)

// 方法
const searchOrder = () => {
  if (!orderSearch.value) {
    showToast('请输入订单信息')
    return
  }
  
  // 模拟查询订单
  orderInfo.value = {
    id: 1,
    orderNo: 'SO20231127001',
    customerName: '汽车零部件公司',
    shippingAddress: '北京市朝阳区建国路88号',
    logisticsCompany: '顺丰快递',
    carrier: '李师傅',
    vehicleNumber: '京A12345'
  }
  
  // 初始化发货清单
  shippingItems.value = [
    {
      id: 1,
      name: '发动机总成',
      sku: 'EA888-001',
      quantity: 10,
      shipped: 0,
      location: 'A-01-01',
      status: '待发货'
    },
    {
      id: 2,
      name: '变速箱总成',
      sku: 'DQ380-001',
      quantity: 5,
      shipped: 0,
      location: 'B-02-03',
      status: '待发货'
    }
  ]
  
  showSuccessToast('订单加载成功')
}

const scanOrder = () => {
  // 模拟扫码订单
  setTimeout(() => {
    orderSearch.value = 'SO20231127001'
    searchOrder()
  }, 1500)
}

const startItemScan = () => {
  isScanning.value = true
  
  // 模拟扫码商品
  setTimeout(() => {
    isScanning.value = false
    itemScanCode.value = 'EA888-001234'
    handleItemScan(itemScanCode.value)
  }, 2000)
}

const handleItemScan = (code: string) => {
  const item = shippingItems.value.find(item => item.sku === code.slice(0, 9))
  
  if (item) {
    if (item.shipped < item.quantity) {
      item.shipped += 1
      if (!checkedItems.value.includes(item.id)) {
        checkedItems.value.push(item.id)
      }
      showSuccessToast(`已扫描: ${item.name}`)
    } else {
      showToast(`${item.name} 已全部发货`)
    }
  } else {
    showToast('未找到对应商品')
  }
  
  itemScanCode.value = ''
}

const manualItemInput = () => {
  if (!itemScanCode.value) {
    showToast('请输入商品条码')
    return
  }
  handleItemScan(itemScanCode.value)
}

const scanItem = (item: any) => {
  currentAdjustItem.value = item
  startItemScan()
}

const toggleItem = (item: any) => {
  const index = checkedItems.value.indexOf(item.id)
  if (index > -1) {
    checkedItems.value.splice(index, 1)
  } else {
    checkedItems.value.push(item.id)
  }
}

const adjustQuantity = (item: any) => {
  currentAdjustItem.value = item
  adjustForm.id = item.id
  adjustForm.quantity = item.shipped.toString()
  showQuantityAdjust.value = true
}

const confirmQuantityAdjust = () => {
  const quantity = parseInt(adjustForm.quantity)
  const item = currentAdjustItem.value
  
  if (quantity < 0) {
    showToast('数量不能为负数')
    return
  }
  
  if (quantity > item.quantity) {
    showToast(`不能超过订单数量 ${item.quantity}`)
    return
  }
  
  item.shipped = quantity
  
  if (quantity > 0 && !checkedItems.value.includes(item.id)) {
    checkedItems.value.push(item.id)
  } else if (quantity === 0) {
    const index = checkedItems.value.indexOf(item.id)
    if (index > -1) {
      checkedItems.value.splice(index, 1)
    }
  }
  
  showQuantityAdjust.value = false
  showSuccessToast('数量调整成功')
}

const getStatusType = (status: string) => {
  switch (status) {
    case '待发货': return 'warning'
    case '部分发货': return 'primary'
    case '已发货': return 'success'
    default: return ''
  }
}

const clearSignature = () => {
  signatureRef.value?.clear()
}

const confirmSignature = () => {
  signatureRef.value?.submit()
}

const onSignatureSubmit = (data: any) => {
  showToast('签名已保存')
}

const onSignatureClear = () => {
  showToast('签名已清除')
}

const submitShipping = async () => {
  if (checkedItems.value.length === 0) {
    showToast('请选择要发货的商品')
    return
  }

  submitting.value = true

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 更新商品状态
    checkedItems.value.forEach(itemId => {
      const item = shippingItems.value.find(i => i.id === itemId)
      if (item) {
        item.status = item.shipped >= item.quantity ? '已发货' : '部分发货'
      }
    })
    
    showSuccessToast('发货成功')
    resetForm()
  } catch (error) {
    showFailToast('发货失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  orderInfo.value = null
  shippingItems.value = []
  checkedItems.value = []
  itemScanCode.value = ''
  Object.assign(logisticsForm, {
    trackingNumber: '',
    packageCount: '',
    weight: '',
    volume: '',
    remark: ''
  })
}

const selectOrder = (order: any) => {
  orderInfo.value = order
  showOrderList.value = false
  // 加载订单详情
  searchOrder()
}

const loadOrderList = async () => {
  orderListLoading.value = true
  
  // 模拟加载数据
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const newOrders = [
    {
      id: Date.now() + 1,
      orderNo: 'SO20231127002',
      customerName: '汽车销售公司',
      totalAmount: '125000'
    },
    {
      id: Date.now() + 2,
      orderNo: 'SO20231127003',
      customerName: '维修服务中心',
      totalAmount: '68000'
    }
  ]
  
  orderList.value.push(...newOrders)
  orderListLoading.value = false
  orderListFinished.value = true
}

onMounted(() => {
  // 页面初始化
})
</script>

<style scoped>
.scan-shipping {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

.mobile-content {
  padding: 16px;
}

.order-section,
.order-selector,
.shipping-list,
.logistics-info,
.signature-section {
  margin-bottom: 16px;
}

.scan-section {
  margin: 16px 0;
}

.scan-box {
  width: 100%;
  height: 180px;
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
  border: 2px solid #07c160;
  border-radius: 8px;
  position: relative;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #07c160, transparent);
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
  color: #07c160;
}

.scan-tips p {
  margin-top: 8px;
  font-size: 14px;
}

.scan-box.scanning {
  background: radial-gradient(circle, rgba(7, 193, 96, 0.1) 0%, transparent 70%);
}

.item-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-name {
  font-weight: bold;
}

.item-details {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}

.item-quantity {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.summary-cell {
  font-weight: bold;
  color: #07c160;
}

.quantity-adjust {
  padding: 20px;
  text-align: center;
}

.quantity-adjust h3 {
  margin-bottom: 16px;
}

.signature-section {
  background: white;
  padding: 16px;
  border-radius: 8px;
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
    height: 140px;
  }
}
</style>