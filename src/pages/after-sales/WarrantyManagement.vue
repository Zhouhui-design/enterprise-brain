<template>
  <view class="warranty-management">
    <view class="header-container">
      <view class="header-shield"></view>
      <view class="header-content">
        <text class="page-title">保修服务</text>
        <text class="page-subtitle">管理您的产品保修信息</text>
      </view>
    </view>

    <!-- 保修概览卡片 -->
    <view class="warranty-overview">
      <view class="overview-card">
        <view class="card-header">
          <text class="overview-title">保修概览</text>
          <view class="scan-button" @tap="scanWarranty">
            <text class="scan-icon">📷</text>
          </view>
        </view>
        <view class="overview-stats">
          <view class="stat-item">
            <text class="stat-number">{{ warrantyStats.active }}</text>
            <text class="stat-label">有效保修</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ warrantyStats.expiring }}</text>
            <text class="stat-label">即将到期</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ warrantyStats.expired }}</text>
            <text class="stat-label">已过期</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <view class="action-item" @tap="registerWarranty">
        <view class="action-icon register">
          <text class="icon">📝</text>
        </view>
        <text class="action-text">注册保修</text>
      </view>
      <view class="action-item" @tap="checkWarranty">
        <view class="action-icon check">
          <text class="icon">🔍</text>
        </view>
        <text class="action-text">查询保修</text>
      </view>
      <view class="action-item" @tap="fileClaim">
        <view class="action-icon claim">
          <text class="icon">🛡️</text>
        </view>
        <text class="action-text">申请保修</text>
      </view>
      <view class="action-item" @tap="serviceCenter">
        <view class="action-icon service">
          <text class="icon">🔧</text>
        </view>
        <text class="action-text">服务中心</text>
      </view>
    </view>

    <!-- 筛选标签 -->
    <view class="filter-tabs">
      <view 
        v-for="(tab, index) in filterTabs" 
        :key="index"
        class="filter-tab"
        :class="{ 'tab-active': activeFilter === tab.value }"
        @tap="switchFilter(tab.value)"
      >
        <text class="tab-text">{{ tab.label }}</text>
        <view v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</view>
      </view>
    </view>

    <!-- 保修列表 -->
    <view class="warranty-list">
      <view 
        v-for="(warranty, index) in filteredWarranties" 
        :key="warranty.id"
        class="warranty-card"
        @tap="viewWarrantyDetail(warranty)"
      >
        <view class="card-header">
          <view class="product-info">
            <image 
              class="product-image" 
              :src="warranty.productImage || '/static/images/product-placeholder.png'"
              mode="aspectFill"
            />
            <view class="product-details">
              <text class="product-name">{{ warranty.productName }}</text>
              <text class="product-model">{{ warranty.model }}</text>
              <text class="serial-number">序列号: {{ warranty.serialNumber }}</text>
            </view>
          </view>
          <view class="warranty-status" :class="`status-${warranty.status}`">
            {{ getWarrantyStatusText(warranty.status) }}
          </view>
        </view>

        <view class="warranty-info">
          <view class="info-row">
            <text class="info-label">保修期：</text>
            <text class="info-value">{{ warranty.warrantyPeriod }}个月</text>
          </view>
          <view class="info-row">
            <text class="info-label">开始时间：</text>
            <text class="info-value">{{ formatDate(warranty.startDate) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">结束时间：</text>
            <text class="info-value" :class="{ 'text-expired': warranty.status === 'expired' }">
              {{ formatDate(warranty.endDate) }}
            </text>
          </view>
        </view>

        <view class="progress-section" v-if="warranty.status === 'active'">
          <view class="progress-header">
            <text class="progress-label">保修进度</text>
            <text class="progress-days">剩余 {{ warranty.remainingDays }} 天</text>
          </view>
          <view class="progress-bar">
            <view 
              class="progress-fill" 
              :style="{ width: warranty.progress + '%' }"
            ></view>
          </view>
        </view>

        <view class="card-footer">
          <view class="warranty-actions">
            <button class="btn-secondary" @tap.stop="downloadCertificate(warranty)">
              下载证书
            </button>
            <button 
              class="btn-primary" 
              @tap.stop="fileWarrantyClaim(warranty)"
              :disabled="warranty.status === 'expired'"
            >
              申请保修
            </button>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="filteredWarranties.length === 0" class="empty-state">
        <text class="empty-icon">🛡️</text>
        <text class="empty-text">暂无{{ getFilterName() }}保修信息</text>
        <button class="btn-primary" @tap="registerWarranty">注册保修</button>
      </view>
    </view>

    <!-- 浮动按钮 -->
    <view class="fab-button" @tap="registerWarranty">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 页面状态
const activeFilter = ref<string>('all')
const warranties = ref<any[]>([])
const warrantyStats = ref({
  active: 0,
  expiring: 0,
  expired: 0
})

// 筛选标签
const filterTabs = ref([
  { label: '全部', value: 'all', count: 0 },
  { label: '有效', value: 'active', count: 0 },
  { label: '即将到期', value: 'expiring', count: 0 },
  { label: '已过期', value: 'expired', count: 0 }
])

// 过滤后的保修列表
const filteredWarranties = computed(() => {
  if (activeFilter.value === 'all') {
    return warranties.value
  }
  return warranties.value.filter(warranty => warranty.status === activeFilter.value)
})

// 获取筛选名称
const getFilterName = () => {
  const tab = filterTabs.value.find(t => t.value === activeFilter.value)
  return tab ? tab.label : ''
}

// 切换筛选
const switchFilter = (value: string) => {
  activeFilter.value = value
}

// 获取保修状态文本
const getWarrantyStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'active': '有效',
    'expiring': '即将到期',
    'expired': '已过期'
  }
  return statusMap[status] || status
}

// 格式化日期
const formatDate = (date: string) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 扫描保修码
const scanWarranty = () => {
  uni.scanCode({
    success: (res) => {
      // 处理扫描结果
      console.log('扫描结果:', res.result)
      checkWarrantyByCode(res.result)
    },
    fail: () => {
      uni.showToast({
        title: '扫描失败',
        icon: 'error'
      })
    }
  })
}

// 根据码查询保修
const checkWarrantyByCode = async (code: string) => {
  try {
    const db = uniCloud.database()
    const res = await db.collection('warranties')
      .where({
        serialNumber: code
      })
      .get()
    
    if (res.data && res.data.length > 0) {
      uni.navigateTo({
        url: `/pages/after-sales/WarrantyDetail?id=${res.data[0].id}`
      })
    } else {
      uni.showToast({
        title: '未找到保修信息',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.showToast({
      title: '查询失败',
      icon: 'error'
    })
  }
}

// 注册保修
const registerWarranty = () => {
  uni.navigateTo({
    url: '/pages/after-sales/WarrantyRegistration'
  })
}

// 查询保修
const checkWarranty = () => {
  uni.showActionSheet({
    itemList: ['按序列号查询', '按产品查询', '按订单查询'],
    success: (res) => {
      switch(res.tapIndex) {
        case 0:
          uni.navigateTo({ url: '/pages/after-sales/WarrantySearch?type=serial' })
          break
        case 1:
          uni.navigateTo({ url: '/pages/after-sales/WarrantySearch?type=product' })
          break
        case 2:
          uni.navigateTo({ url: '/pages/after-sales/WarrantySearch?type=order' })
          break
      }
    }
  })
}

// 申请保修
const fileClaim = () => {
  uni.navigateTo({
    url: '/pages/after-sales/WarrantyClaim'
  })
}

// 服务中心
const serviceCenter = () => {
  uni.navigateTo({
    url: '/pages/after-sales/ServiceCenter'
  })
}

// 查看保修详情
const viewWarrantyDetail = (warranty: any) => {
  uni.navigateTo({
    url: `/pages/after-sales/WarrantyDetail?id=${warranty.id}`
  })
}

// 下载证书
const downloadCertificate = async (warranty: any) => {
  uni.showLoading({
    title: '生成证书中...'
  })
  
  try {
    // 调用云函数生成保修证书
    const res = await uniCloud.callFunction({
      name: 'generateWarrantyCertificate',
      data: {
        warrantyId: warranty.id
      }
    })
    
    if (res.result && res.result.fileUrl) {
      // 下载文件
      uni.downloadFile({
        url: res.result.fileUrl,
        success: (downloadRes) => {
          uni.hideLoading()
          uni.showToast({
            title: '证书已下载',
            icon: 'success'
          })
        },
        fail: () => {
          uni.hideLoading()
          uni.showToast({
            title: '下载失败',
            icon: 'error'
          })
        }
      })
    }
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '生成失败',
      icon: 'error'
    })
  }
}

// 申请保修服务
const fileWarrantyClaim = (warranty: any) => {
  if (warranty.status === 'expired') {
    uni.showToast({
      title: '保修已过期',
      icon: 'none'
    })
    return
  }
  
  uni.navigateTo({
    url: `/pages/after-sales/WarrantyClaimForm?warrantyId=${warranty.id}`
  })
}

// 获取保修数据
const fetchWarranties = async () => {
  try {
    const db = uniCloud.database()
    const res = await db.collection('warranties')
      .orderBy('startDate', 'desc')
      .get()
    
    if (res.data && res.data.length > 0) {
      warranties.value = res.data.map(warranty => {
        const now = new Date()
        const startDate = new Date(warranty.startDate)
        const endDate = new Date(warranty.endDate)
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        // 计算保修状态
        let status = 'expired'
        if (remainingDays > 0) {
          status = remainingDays <= 30 ? 'expiring' : 'active'
        }
        
        return {
          ...warranty,
          status,
          remainingDays: Math.max(0, remainingDays),
          progress: Math.max(0, Math.min(100, ((totalDays - remainingDays) / totalDays) * 100))
        }
      })
      updateStats()
      updateTabCounts()
    } else {
      // 使用模拟数据
      warranties.value = [
        {
          id: 'W001',
          productName: 'iPhone 15 Pro',
          model: 'A3108',
          serialNumber: 'FX8M4Q2HG',
          warrantyPeriod: 12,
          startDate: '2023-09-15T00:00:00',
          endDate: '2024-09-15T00:00:00',
          status: 'active',
          remainingDays: 242,
          progress: 33
        },
        {
          id: 'W002',
          productName: 'MacBook Pro 14"',
          model: 'A2992',
          serialNumber: 'Z0D0M1KXJ',
          warrantyPeriod: 12,
          startDate: '2023-06-10T00:00:00',
          endDate: '2024-06-10T00:00:00',
          status: 'expiring',
          remainingDays: 15,
          progress: 88
        },
        {
          id: 'W003',
          productName: 'AirPods Pro',
          model: 'A2084',
          serialNumber: 'L5H9G2X3P',
          warrantyPeriod: 12,
          startDate: '2022-12-01T00:00:00',
          endDate: '2023-12-01T00:00:00',
          status: 'expired',
          remainingDays: 0,
          progress: 100
        }
      ]
      updateStats()
      updateTabCounts()
    }
  } catch (error) {
    console.error('获取保修数据失败:', error)
    uni.showToast({
      title: '数据加载失败',
      icon: 'error'
    })
  }
}

// 更新统计数据
const updateStats = () => {
  warrantyStats.value = {
    active: warranties.value.filter(w => w.status === 'active').length,
    expiring: warranties.value.filter(w => w.status === 'expiring').length,
    expired: warranties.value.filter(w => w.status === 'expired').length
  }
}

// 更新标签计数
const updateTabCounts = () => {
  filterTabs.value.forEach(tab => {
    if (tab.value === 'all') {
      tab.count = warranties.value.length
    } else {
      tab.count = warranties.value.filter(w => w.status === tab.value).length
    }
  })
}

onMounted(() => {
  fetchWarranties()
})
</script>

<style scoped>
.warranty-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  font-family: 'Source Han Sans SC', -system-ui, sans-serif;
}

.header-container {
  position: relative;
  height: 240rpx;
  overflow: hidden;
}

.header-shield {
  position: absolute;
  top: -60rpx;
  right: -150rpx;
  width: 500rpx;
  height: 500rpx;
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  border-radius: 50%;
  transform: rotate(15deg);
}

.header-content {
  position: absolute;
  top: 80rpx;
  left: 60rpx;
  z-index: 2;
}

.page-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #f59e0b;
  margin-bottom: 16rpx;
  display: block;
}

.page-subtitle {
  font-size: 28rpx;
  color: #64748b;
  display: block;
}

.warranty-overview {
  padding: 0 30rpx;
  margin-top: -40rpx;
  position: relative;
  z-index: 3;
}

.overview-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}

.overview-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
}

.scan-button {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.scan-button:active {
  transform: scale(0.9);
}

.scan-icon {
  font-size: 40rpx;
}

.overview-stats {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 48rpx;
  font-weight: 700;
  color: #f59e0b;
  display: block;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #64748b;
  display: block;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
  padding: 30rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx 20rpx;
  transition: all 0.3s ease;
}

.action-item:active {
  transform: translateY(-8rpx);
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.15);
}

.action-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon.register {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.action-icon.check {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.action-icon.claim {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.action-icon.service {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.icon {
  font-size: 40rpx;
}

.action-text {
  font-size: 24rpx;
  color: #1f2937;
  font-weight: 500;
  text-align: center;
}

.filter-tabs {
  display: flex;
  padding: 0 30rpx 30rpx;
  gap: 20rpx;
  overflow-x: auto;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 32rpx;
  background: #ffffff;
  border-radius: 50rpx;
  border: 2rpx solid #e5e7eb;
  white-space: nowrap;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.filter-tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.1), transparent);
  transition: left 0.5s ease;
}

.tab-active::before {
  left: 100%;
}

.tab-active {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-color: #f59e0b;
  transform: translateY(-4rpx);
}

.tab-text {
  font-size: 26rpx;
  color: #64748b;
  font-weight: 500;
}

.tab-active .tab-text {
  color: #f59e0b;
}

.tab-badge {
  min-width: 32rpx;
  height: 32rpx;
  background: #f59e0b;
  color: #ffffff;
  border-radius: 50%;
  font-size: 20rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
}

.warranty-list {
  padding: 0 30rpx 200rpx;
}

.warranty-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border-left: 6rpx solid transparent;
}

.warranty-card:active {
  transform: translateY(-8rpx);
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.12);
}

.warranty-card:nth-child(odd) {
  border-left-color: #f59e0b;
}

.warranty-card:nth-child(even) {
  border-left-color: #3b82f6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24rpx;
}

.product-info {
  display: flex;
  gap: 24rpx;
  flex: 1;
}

.product-image {
  width: 100rpx;
  height: 100rpx;
  border-radius: 16rpx;
  background: #f3f4f6;
}

.product-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8rpx;
}

.product-model {
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
}

.serial-number {
  font-size: 22rpx;
  color: #9ca3af;
}

.warranty-status {
  font-size: 24rpx;
  font-weight: 600;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.status-active {
  background: #d1fae5;
  color: #059669;
}

.status-expiring {
  background: #fef3c7;
  color: #d97706;
}

.status-expired {
  background: #fee2e2;
  color: #dc2626;
}

.warranty-info {
  margin-bottom: 24rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.info-label {
  font-size: 24rpx;
  color: #6b7280;
}

.info-value {
  font-size: 24rpx;
  color: #1f2937;
  font-weight: 500;
}

.text-expired {
  color: #dc2626;
}

.progress-section {
  margin-bottom: 24rpx;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.progress-label {
  font-size: 24rpx;
  color: #6b7280;
}

.progress-days {
  font-size: 24rpx;
  color: #f59e0b;
  font-weight: 600;
}

.progress-bar {
  height: 8rpx;
  background: #e5e7eb;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b 0%, #f97316 100%);
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}

.warranty-actions {
  display: flex;
  gap: 16rpx;
}

.btn-secondary,
.btn-primary {
  padding: 16rpx 24rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
  border: none;
  transition: all 0.3s ease;
}

.btn-secondary {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-primary {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  color: #ffffff;
}

.btn-primary:disabled {
  background: #e5e7eb;
  color: #9ca3af;
}

.btn-secondary:active {
  transform: scale(0.95);
  background: #e5e7eb;
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.95);
  background: linear-gradient(135deg, #d97706 0%, #ea580c 100%);
}

.empty-state {
  text-align: center;
  padding: 120rpx 40rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
  display: block;
}

.empty-text {
  font-size: 28rpx;
  color: #6b7280;
  margin-bottom: 40rpx;
  display: block;
}

.fab-button {
  position: fixed;
  bottom: 120rpx;
  right: 40rpx;
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 40rpx rgba(245, 158, 11, 0.3);
  z-index: 100;
  transition: all 0.3s ease;
}

.fab-button:active {
  transform: scale(0.9);
  box-shadow: 0 8rpx 24rpx rgba(245, 158, 11, 0.4);
}

.fab-icon {
  font-size: 48rpx;
  color: #ffffff;
  font-weight: 300;
}
</style>