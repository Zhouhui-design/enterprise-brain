<template>
  <div class="mobile-inventory mobile-page">
    <div class="mobile-header">
      <van-nav-bar
        title="库存管理"
        left-text="返回"
        left-arrow
        @click-left="$router.back()"
      >
        <template #right>
          <van-icon name="search" @click="showSearch = true" />
        </template>
      </van-nav-bar>
    </div>

    <div class="mobile-content">
      <!-- 库存统计卡片 -->
      <div class="stats-cards">
        <van-grid :column-num="2" :gutter="12">
          <van-grid-item>
            <div class="stat-card" @click="filterByStatus('all')">
              <div class="stat-value total">{{ stats.totalItems }}</div>
              <div class="stat-label">库存总数</div>
            </div>
          </van-grid-item>
          <van-grid-item>
            <div class="stat-card" @click="filterByStatus('normal')">
              <div class="stat-value normal">{{ stats.normalItems }}</div>
              <div class="stat-label">正常库存</div>
            </div>
          </van-grid-item>
          <van-grid-item>
            <div class="stat-card" @click="filterByStatus('warning')">
              <div class="stat-value warning">{{ stats.warningItems }}</div>
              <div class="stat-label">预警库存</div>
            </div>
          </van-grid-item>
          <van-grid-item>
            <div class="stat-card" @click="filterByStatus('shortage')">
              <div class="stat-value shortage">{{ stats.shortageItems }}</div>
              <div class="stat-label">缺货库存</div>
            </div>
          </van-grid-item>
        </van-grid>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions">
        <van-grid :column-num="4" :border="false">
          <van-grid-item icon="scan" text="扫码查询" @click="startScan" />
          <van-grid-item icon="point-gift-o" text="盘点" @click="goToStockCheck" />
          <van-grid-item icon="exchange" text="调拨" @click="goToTransfer" />
          <van-grid-item icon="coupon-o" text="预警" @click="goToAlert" />
        </van-grid>
      </div>

      <!-- 仓库筛选 -->
      <van-dropdown-menu>
        <van-dropdown-item v-model="currentWarehouse" :options="warehouseOptions" @change="onWarehouseChange" />
        <van-dropdown-item v-model="currentStatus" :options="statusOptions" @change="onStatusChange" />
      </van-dropdown-menu>

      <!-- 库存列表 -->
      <div class="inventory-list">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="loadInventoryList"
          >
            <van-swipe-cell v-for="item in inventoryList" :key="item.id">
              <van-cell
                :title="item.productName"
                :label="`SKU: ${item.sku} | 库位: ${item.location}`"
                :value="`${item.quantity}${item.unit}`"
                is-link
                @click="viewDetail(item)"
              >
                <template #icon>
                  <van-image
                    width="50"
                    height="50"
                    fit="cover"
                    :src="item.image || 'https://via.placeholder.com/50'"
                    style="margin-right: 12px; border-radius: 4px;"
                  />
                </template>
                <template #right-icon>
                  <div class="item-status">
                    <van-tag :type="getStatusType(item.status)" size="medium">
                      {{ getStatusText(item.status) }}
                    </van-tag>
                    <div class="item-value">¥{{ item.totalValue }}</div>
                  </div>
                </template>
              </van-cell>
              <template #right>
                <van-button square type="primary" text @click="quickAdjust(item)">
                  调整
                </van-button>
                <van-button square type="warning" text @click="quickTransfer(item)">
                  调拨
                </van-button>
              </template>
            </van-swipe-cell>
          </van-list>
        </van-pull-refresh>
      </div>
    </div>

    <!-- 扫码弹窗 -->
    <van-popup v-model:show="showScanPopup" position="center" round :style="{ width: '90%' }">
      <div class="scan-popup">
        <div class="scan-header">
          <h3>扫码查询</h3>
          <van-icon name="cross" @click="showScanPopup = false" />
        </div>
        <div class="scan-area" :class="{ scanning: isScanning }" @click="startScanAction">
          <div class="scan-box">
            <div class="scan-line" v-if="isScanning"></div>
            <div class="scan-icon" v-if="!isScanning">
              <van-icon name="scan" size="60" color="#1989fa" />
              <p>点击扫描条码</p>
            </div>
          </div>
        </div>
        <van-field
          v-model="scanCode"
          placeholder="或手动输入条码"
          clearable
        >
          <template #button>
            <van-button size="small" type="primary" @click="handleManualInput">
              确定
            </van-button>
          </template>
        </van-field>
      </div>
    </van-popup>

    <!-- 搜索弹窗 -->
    <van-popup v-model:show="showSearch" position="top" :style="{ height: '100%' }">
      <van-nav-bar
        title="搜索库存"
        left-text="取消"
        @click-left="showSearch = false"
      />
      <van-search
        v-model="searchText"
        placeholder="请输入产品名称或SKU"
        show-action
        @search="onSearch"
      >
        <template #action>
          <div @click="onSearch">搜索</div>
        </template>
      </van-search>
      <div class="search-history" v-if="searchHistory.length > 0">
        <div class="history-header">
          <span>搜索历史</span>
          <van-icon name="delete-o" @click="clearHistory" />
        </div>
        <van-tag
          v-for="(keyword, index) in searchHistory"
          :key="index"
          plain
          @click="searchText = keyword; onSearch()"
          style="margin: 4px;"
        >
          {{ keyword }}
        </van-tag>
      </div>
    </van-popup>

    <!-- 详情弹窗 -->
    <van-popup v-model:show="showDetail" position="bottom" round :style="{ height: '85%' }">
      <div class="detail-popup" v-if="currentItem">
        <van-nav-bar
          :title="currentItem.productName"
          left-text="关闭"
          @click-left="showDetail = false"
        />
        
        <div class="detail-content">
          <!-- 产品图片 -->
          <van-image
            width="100%"
            height="200"
            fit="contain"
            :src="currentItem.image || 'https://via.placeholder.com/400x200'"
          />

          <!-- 基本信息 -->
          <van-cell-group title="基本信息">
            <van-cell title="产品名称" :value="currentItem.productName" />
            <van-cell title="SKU编码" :value="currentItem.sku" />
            <van-cell title="规格型号" :value="currentItem.specification" />
            <van-cell title="仓库" :value="currentItem.warehouseName" />
            <van-cell title="库位" :value="currentItem.location" />
          </van-cell-group>

          <!-- 库存信息 -->
          <van-cell-group title="库存信息">
            <van-cell title="当前库存" :value="`${currentItem.quantity}${currentItem.unit}`">
              <template #value>
                <van-tag :type="getStatusType(currentItem.status)">
                  {{ currentItem.quantity }}{{ currentItem.unit }}
                </van-tag>
              </template>
            </van-cell>
            <van-cell title="可用库存" :value="`${currentItem.availableQuantity}${currentItem.unit}`" />
            <van-cell title="锁定库存" :value="`${currentItem.lockedQuantity}${currentItem.unit}`" />
            <van-cell title="安全库存" :value="`${currentItem.safetyStock}${currentItem.unit}`" />
            <van-cell title="库存状态">
              <template #value>
                <van-tag :type="getStatusType(currentItem.status)">
                  {{ getStatusText(currentItem.status) }}
                </van-tag>
              </template>
            </van-cell>
          </van-cell-group>

          <!-- 库存水位 -->
          <van-cell-group title="库存水位">
            <div class="stock-level">
              <div class="level-bar">
                <div
                  class="level-fill"
                  :style="{
                    width: getLevelPercentage(currentItem) + '%',
                    backgroundColor: getLevelColor(currentItem)
                  }"
                >
                  <span>{{ getLevelPercentage(currentItem) }}%</span>
                </div>
              </div>
              <div class="level-labels">
                <span>最小库存: {{ currentItem.minStock }}</span>
                <span>安全库存: {{ currentItem.safetyStock }}</span>
                <span>最大库存: {{ currentItem.maxStock }}</span>
              </div>
            </div>
          </van-cell-group>

          <!-- 批次信息 -->
          <van-cell-group title="批次信息" v-if="currentItem.batches && currentItem.batches.length > 0">
            <van-cell
              v-for="batch in currentItem.batches"
              :key="batch.batchNo"
              :title="batch.batchNo"
              :label="`生产日期: ${batch.productionDate} | 过期日期: ${batch.expiryDate}`"
              :value="`${batch.quantity}${currentItem.unit}`"
            />
          </van-cell-group>
        </div>

        <!-- 底部操作 -->
        <div class="detail-actions">
          <van-button type="primary" block @click="handleAdjust(currentItem)">
            库存调整
          </van-button>
          <van-button type="success" block @click="handleTransfer(currentItem)">
            库存调拨
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 快速调整弹窗 -->
    <van-popup v-model:show="showAdjustPopup" position="bottom" round>
      <div class="adjust-popup">
        <van-nav-bar
          title="库存调整"
          left-text="取消"
          @click-left="showAdjustPopup = false"
        />
        <van-form @submit="submitAdjust">
          <van-cell-group>
            <van-cell title="产品" :value="adjustForm.productName" />
            <van-cell title="当前库存" :value="`${adjustForm.currentQuantity}${adjustForm.unit}`" />
            <van-field
              v-model="adjustForm.adjustQuantity"
              name="adjustQuantity"
              label="调整数量"
              type="number"
              placeholder="正数为增加，负数为减少"
              :rules="[{ required: true, message: '请输入调整数量' }]"
            />
            <van-field
              v-model="adjustForm.reason"
              name="reason"
              label="调整原因"
              type="textarea"
              rows="3"
              placeholder="请输入调整原因"
              :rules="[{ required: true, message: '请输入调整原因' }]"
            />
          </van-cell-group>
          <div style="margin: 16px;">
            <van-button round block type="primary" native-type="submit" :loading="adjusting">
              确认调整
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 浮动操作按钮 -->
    <van-floating-bubble
      v-model:offset="floatingOffset"
      icon="plus"
      magnetic="x"
      @click="showActionSheet = true"
    />

    <!-- 操作菜单 -->
    <van-action-sheet v-model:show="showActionSheet" :actions="actions" @select="onActionSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import { useRouter } from 'vue-router'
import { inventoryApi } from '@/api/inventory'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const isScanning = ref(false)
const showScanPopup = ref(false)
const showSearch = ref(false)
const showDetail = ref(false)
const showAdjustPopup = ref(false)
const showActionSheet = ref(false)
const adjusting = ref(false)

const inventoryList = ref([])
const currentItem = ref(null)
const searchText = ref('')
const scanCode = ref('')
const searchHistory = ref(['发动机', '变速箱', 'EA888'])

const currentWarehouse = ref(0)
const currentStatus = ref(0)

const floatingOffset = ref({ x: -1, y: -1 })

const stats = reactive({
  totalItems: 0,
  normalItems: 0,
  warningItems: 0,
  shortageItems: 0
})

const adjustForm = reactive({
  id: null,
  productName: '',
  currentQuantity: 0,
  unit: '',
  adjustQuantity: '',
  reason: ''
})

const warehouseOptions = [
  { text: '全部仓库', value: 0 },
  { text: '主仓库', value: 1 },
  { text: '分仓库A', value: 2 },
  { text: '分仓库B', value: 3 }
]

const statusOptions = [
  { text: '全部状态', value: 0 },
  { text: '正常', value: 1 },
  { text: '预警', value: 2 },
  { text: '缺货', value: 3 }
]

const actions = [
  { name: '扫码查询', icon: 'scan' },
  { name: '库存盘点', icon: 'point-gift-o' },
  { name: '库存调整', icon: 'balance-o' },
  { name: '库存调拨', icon: 'exchange' }
]

// 方法
const loadInventoryList = async () => {
  try {
    const params = {
      warehouseId: currentWarehouse.value || undefined,
      status: currentStatus.value || undefined,
      pageNum: 1,
      pageSize: 20
    }
    
    const res = await inventoryApi.getInventoryList(params)
    
    // 模拟数据
    if (!res.data) {
      inventoryList.value = mockInventoryData()
    } else {
      inventoryList.value = res.data.records || []
    }
    
    loading.value = false
    finished.value = true
  } catch (error) {
    console.error('加载库存列表失败:', error)
    inventoryList.value = mockInventoryData()
    loading.value = false
    finished.value = true
  }
}

const loadStats = async () => {
  try {
    const res = await inventoryApi.getInventoryStats()
    
    // 模拟数据
    Object.assign(stats, res.data || {
      totalItems: 856,
      normalItems: 785,
      warningItems: 58,
      shortageItems: 13
    })
  } catch (error) {
    Object.assign(stats, {
      totalItems: 856,
      normalItems: 785,
      warningItems: 58,
      shortageItems: 13
    })
  }
}

const onRefresh = async () => {
  refreshing.value = true
  await loadInventoryList()
  await loadStats()
  refreshing.value = false
  showSuccessToast('刷新成功')
}

const onWarehouseChange = () => {
  inventoryList.value = []
  finished.value = false
  loadInventoryList()
}

const onStatusChange = () => {
  inventoryList.value = []
  finished.value = false
  loadInventoryList()
}

const filterByStatus = (status: string) => {
  const statusMap = {
    all: 0,
    normal: 1,
    warning: 2,
    shortage: 3
  }
  currentStatus.value = statusMap[status] || 0
  onStatusChange()
}

const startScan = () => {
  showScanPopup.value = true
}

const startScanAction = () => {
  isScanning.value = true
  
  // 模拟扫码
  setTimeout(() => {
    isScanning.value = false
    scanCode.value = 'EA888-001234'
    handleScanResult(scanCode.value)
  }, 2000)
}

const handleScanResult = async (code: string) => {
  try {
    // 查询产品信息
    const item = inventoryList.value.find(i => i.sku === code)
    
    if (item) {
      currentItem.value = item
      showScanPopup.value = false
      showDetail.value = true
      showSuccessToast('查询成功')
    } else {
      showToast('未找到该产品')
    }
  } catch (error) {
    showToast('查询失败')
  }
}

const handleManualInput = () => {
  if (!scanCode.value) {
    showToast('请输入条码')
    return
  }
  handleScanResult(scanCode.value)
}

const onSearch = () => {
  if (!searchText.value) {
    showToast('请输入搜索关键词')
    return
  }
  
  // 添加到搜索历史
  if (!searchHistory.value.includes(searchText.value)) {
    searchHistory.value.unshift(searchText.value)
    if (searchHistory.value.length > 10) {
      searchHistory.value.pop()
    }
  }
  
  // 执行搜索
  const results = inventoryList.value.filter(item =>
    item.productName.includes(searchText.value) ||
    item.sku.includes(searchText.value)
  )
  
  if (results.length > 0) {
    inventoryList.value = results
    showSearch.value = false
    showSuccessToast(`找到 ${results.length} 个结果`)
  } else {
    showToast('未找到相关产品')
  }
}

const clearHistory = () => {
  showConfirmDialog({
    title: '确认清空',
    message: '确定要清空搜索历史吗？'
  }).then(() => {
    searchHistory.value = []
    showSuccessToast('已清空')
  })
}

const viewDetail = (item: any) => {
  currentItem.value = {
    ...item,
    specification: '2.0T 涡轮增压',
    warehouseName: '主仓库',
    availableQuantity: Math.floor(item.quantity * 0.8),
    lockedQuantity: Math.floor(item.quantity * 0.2),
    minStock: 50,
    maxStock: 1000,
    batches: [
      {
        batchNo: 'B20240115001',
        quantity: Math.floor(item.quantity * 0.6),
        productionDate: '2024-01-15',
        expiryDate: '2025-01-15'
      },
      {
        batchNo: 'B20240110001',
        quantity: Math.floor(item.quantity * 0.4),
        productionDate: '2024-01-10',
        expiryDate: '2024-12-10'
      }
    ]
  }
  showDetail.value = true
}

const quickAdjust = (item: any) => {
  Object.assign(adjustForm, {
    id: item.id,
    productName: item.productName,
    currentQuantity: item.quantity,
    unit: item.unit,
    adjustQuantity: '',
    reason: ''
  })
  showAdjustPopup.value = true
}

const quickTransfer = (item: any) => {
  showToast('跳转到调拨页面')
  router.push('/mobile/inventory/transfer')
}

const handleAdjust = (item: any) => {
  showDetail.value = false
  quickAdjust(item)
}

const handleTransfer = (item: any) => {
  showDetail.value = false
  quickTransfer(item)
}

const submitAdjust = async () => {
  adjusting.value = true
  
  try {
    // 模拟调整
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    showAdjustPopup.value = false
    showSuccessToast('调整成功')
    await onRefresh()
  } catch (error) {
    showToast('调整失败')
  } finally {
    adjusting.value = false
  }
}

const goToStockCheck = () => {
  router.push('/mobile/inventory/stock-check')
}

const goToTransfer = () => {
  router.push('/mobile/inventory/transfer')
}

const goToAlert = () => {
  showToast('跳转到预警页面')
}

const onActionSelect = (action: any) => {
  showActionSheet.value = false
  
  switch (action.name) {
    case '扫码查询':
      startScan()
      break
    case '库存盘点':
      goToStockCheck()
      break
    case '库存调整':
      if (inventoryList.value.length > 0) {
        quickAdjust(inventoryList.value[0])
      } else {
        showToast('请先选择产品')
      }
      break
    case '库存调拨':
      goToTransfer()
      break
  }
}

const getStatusType = (status: string) => {
  const typeMap = {
    normal: 'success',
    warning: 'warning',
    shortage: 'danger'
  }
  return typeMap[status] || 'default'
}

const getStatusText = (status: string) => {
  const textMap = {
    normal: '正常',
    warning: '预警',
    shortage: '缺货'
  }
  return textMap[status] || '未知'
}

const getLevelPercentage = (item: any) => {
  if (!item.maxStock) return 0
  return Math.min((item.quantity / item.maxStock) * 100, 100).toFixed(0)
}

const getLevelColor = (item: any) => {
  const percentage = (item.quantity / item.maxStock) * 100
  if (percentage <= 20) return '#ee0a24'
  if (percentage <= 50) return '#ff976a'
  if (percentage <= 80) return '#07c160'
  return '#1989fa'
}

const mockInventoryData = () => {
  return Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    productName: `产品${i + 1}`,
    sku: `SKU${String(i + 1001).padStart(6, '0')}`,
    location: `A-${i + 1}-01`,
    quantity: Math.floor(Math.random() * 500) + 100,
    unit: '件',
    safetyStock: 100,
    status: ['normal', 'warning', 'shortage'][Math.floor(Math.random() * 3)],
    totalValue: (Math.random() * 10000 + 5000).toFixed(2),
    image: null
  }))
}

onMounted(() => {
  loadInventoryList()
  loadStats()
})
</script>

<style scoped>
.mobile-inventory {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 60px;
}

.mobile-content {
  padding-bottom: 20px;
}

.stats-cards {
  background: white;
  padding: 12px;
  margin-bottom: 12px;
}

.stat-card {
  text-align: center;
  cursor: pointer;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-value.total {
  color: #1989fa;
}

.stat-value.normal {
  color: #07c160;
}

.stat-value.warning {
  color: #ff976a;
}

.stat-value.shortage {
  color: #ee0a24;
}

.stat-label {
  font-size: 12px;
  color: #969799;
}

.quick-actions {
  background: white;
  margin-bottom: 12px;
}

.inventory-list {
  margin-top: 12px;
}

.item-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.item-value {
  font-size: 12px;
  color: #969799;
}

/* 扫码弹窗 */
.scan-popup {
  padding: 20px;
}

.scan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.scan-header h3 {
  margin: 0;
  font-size: 18px;
}

.scan-area {
  width: 100%;
  height: 200px;
  background: #000;
  border-radius: 8px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.scan-box {
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

.scan-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #1989fa;
}

.scan-icon p {
  margin-top: 8px;
  font-size: 14px;
}

.scan-area.scanning {
  background: radial-gradient(circle, rgba(25, 137, 250, 0.1) 0%, transparent 70%);
}

/* 搜索历史 */
.search-history {
  padding: 16px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #323233;
  font-size: 14px;
}

/* 详情弹窗 */
.detail-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px;
}

.detail-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: white;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 12px;
}

/* 库存水位 */
.stock-level {
  padding: 16px;
}

.level-bar {
  width: 100%;
  height: 30px;
  background: #f2f3f5;
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 12px;
}

.level-fill {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
  transition: width 0.3s;
}

.level-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #969799;
}

/* 调整弹窗 */
.adjust-popup {
  max-height: 70vh;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .stat-value {
    font-size: 20px;
  }
  
  .scan-area {
    height: 160px;
  }
}
</style>