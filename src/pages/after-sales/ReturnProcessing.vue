<template>
  <view class="return-processing">
    <view class="header-container">
      <view class="header-wave"></view>
      <view class="header-content">
        <text class="page-title">退换货处理</text>
        <text class="page-subtitle">管理您的退换货申请</text>
      </view>
    </view>

    <!-- 快速统计 -->
    <view class="quick-stats">
      <view class="stat-card">
        <view class="stat-icon processing">
          <text class="icon">🔄</text>
        </view>
        <text class="stat-number">{{ stats.processing }}</text>
        <text class="stat-label">处理中</text>
      </view>
      <view class="stat-card">
        <view class="stat-icon completed">
          <text class="icon">✅</text>
        </view>
        <text class="stat-number">{{ stats.completed }}</text>
        <text class="stat-label">已完成</text>
      </view>
      <view class="stat-card">
        <view class="stat-icon pending">
          <text class="icon">⏰</text>
        </view>
        <text class="stat-number">{{ stats.pending }}</text>
        <text class="stat-label">待审核</text>
      </view>
    </view>

    <!-- 申请类型切换 -->
    <view class="type-tabs">
      <view 
        v-for="(tab, index) in typeTabs" 
        :key="index"
        class="type-tab"
        :class="{ 'tab-active': activeTab === tab.value }"
        @tap="switchTab(tab.value)"
      >
        <text class="tab-icon">{{ tab.icon }}</text>
        <text class="tab-label">{{ tab.label }}</text>
        <view v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</view>
      </view>
    </view>

    <!-- 退换货列表 -->
    <view class="return-list">
      <view 
        v-for="(item, index) in filteredReturns" 
        :key="item.id"
        class="return-card"
        @tap="viewReturnDetail(item)"
      >
        <view class="card-header">
          <view class="order-info">
            <text class="order-number">{{ item.orderNumber }}</text>
            <view class="return-type" :class="`type-${item.type}`">
              {{ item.type === 'return' ? '退货' : '换货' }}
            </view>
          </view>
          <text class="apply-date">{{ formatDate(item.applyTime) }}</text>
        </view>

        <view class="product-info">
          <image 
            class="product-image" 
            :src="item.productImage || '/static/images/product-placeholder.png'"
            mode="aspectFill"
          />
          <view class="product-details">
            <text class="product-name">{{ item.productName }}</text>
            <text class="product-spec">{{ item.specification }}</text>
            <text class="product-price">¥{{ item.price }}</text>
          </view>
        </view>

        <view class="return-reason">
          <text class="reason-label">退换原因：</text>
          <text class="reason-text">{{ item.reason }}</text>
        </view>

        <view class="status-timeline">
          <view class="timeline-item">
            <view 
              class="timeline-dot" 
              :class="{ 'dot-completed': item.statusIndex >= 0 }"
            ></view>
            <text class="timeline-text">提交申请</text>
          </view>
          <view class="timeline-line"></view>
          <view class="timeline-item">
            <view 
              class="timeline-dot" 
              :class="{ 'dot-completed': item.statusIndex >= 1 }"
            ></view>
            <text class="timeline-text">审核通过</text>
          </view>
          <view class="timeline-line"></view>
          <view class="timeline-item">
            <view 
              class="timeline-dot" 
              :class="{ 'dot-completed': item.statusIndex >= 2 }"
            ></view>
            <text class="timeline-text">寄回商品</text>
          </view>
          <view class="timeline-line"></view>
          <view class="timeline-item">
            <view 
              class="timeline-dot" 
              :class="{ 'dot-completed': item.statusIndex >= 3 }"
            ></view>
            <text class="timeline-text">处理完成</text>
          </view>
        </view>

        <view class="card-footer">
          <text class="current-status">{{ getStatusText(item.status) }}</text>
          <button class="btn-action" @tap.stop="takeAction(item)">
            {{ getActionText(item.status) }}
          </button>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="filteredReturns.length === 0" class="empty-state">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无{{ getTabName() }}申请</text>
        <button class="btn-primary" @tap="createReturn">申请退换货</button>
      </view>
    </view>

    <!-- 浮动按钮 -->
    <view class="fab-container">
      <view class="fab-button" @tap="createReturn">
        <text class="fab-icon">+</text>
      </view>
      <text class="fab-text">申请退换货</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 页面状态
const activeTab = ref<string>('all')
const returns = ref<any[]>([])
const stats = ref({
  processing: 0,
  completed: 0,
  pending: 0
})

// 类型标签
const typeTabs = ref([
  { label: '全部', value: 'all', icon: '📋', count: 0 },
  { label: '退货', value: 'return', icon: '↩️', count: 0 },
  { label: '换货', value: 'exchange', icon: '🔄', count: 0 },
  { label: '待处理', value: 'pending', icon: '⏰', count: 0 }
])

// 过滤后的退换货列表
const filteredReturns = computed(() => {
  if (activeTab.value === 'all') {
    return returns.value
  } else if (activeTab.value === 'pending') {
    return returns.value.filter(item => ['submitted', 'reviewing'].includes(item.status))
  } else {
    return returns.value.filter(item => item.type === activeTab.value)
  }
})

// 获取标签名称
const getTabName = () => {
  const tab = typeTabs.value.find(t => t.value === activeTab.value)
  return tab ? tab.label : ''
}

// 切换标签
const switchTab = (value: string) => {
  activeTab.value = value
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'submitted': '待审核',
    'reviewing': '审核中',
    'approved': '已通过',
    'rejected': '已拒绝',
    'shipping': '待寄回',
    'received': '已收到',
    'processing': '处理中',
    'completed': '已完成'
  }
  return statusMap[status] || status
}

// 获取操作按钮文本
const getActionText = (status: string) => {
  const actionMap: { [key: string]: string } = {
    'submitted': '查看详情',
    'reviewing': '查看详情',
    'approved': '填写地址',
    'shipping': '查看物流',
    'received': '查看进度',
    'processing': '查看进度',
    'completed': '评价服务',
    'rejected': '重新申请'
  }
  return actionMap[status] || '查看详情'
}

// 格式化日期
const formatDate = (date: string) => {
  const d = new Date(date)
  return `${d.getMonth() + 1}-${d.getDate()}`
}

// 查看退换货详情
const viewReturnDetail = (item: any) => {
  uni.navigateTo({
    url: `/pages/after-sales/ReturnDetail?id=${item.id}`
  })
}

// 执行操作
const takeAction = (item: any) => {
  switch (item.status) {
    case 'submitted':
    case 'reviewing':
      viewReturnDetail(item)
      break
    case 'approved':
      fillShippingAddress(item)
      break
    case 'shipping':
      viewLogistics(item)
      break
    case 'received':
    case 'processing':
      viewProgress(item)
      break
    case 'completed':
      rateService(item)
      break
    case 'rejected':
      reapplyReturn(item)
      break
  }
}

// 填写寄回地址
const fillShippingAddress = (item: any) => {
  uni.navigateTo({
    url: `/pages/after-sales/ShippingAddress?returnId=${item.id}`
  })
}

// 查看物流
const viewLogistics = (item: any) => {
  uni.navigateTo({
    url: `/pages/after-sales/LogisticsTracking?returnId=${item.id}`
  })
}

// 查看进度
const viewProgress = (item: any) => {
  uni.navigateTo({
    url: `/pages/after-sales/ReturnProgress?returnId=${item.id}`
  })
}

// 评价服务
const rateService = (item: any) => {
  uni.navigateTo({
    url: `/pages/after-sales/ServiceRating?returnId=${item.id}&type=${item.type}`
  })
}

// 重新申请
const reapplyReturn = (item: any) => {
  uni.showModal({
    title: '重新申请',
    content: '将基于原订单信息创建新的退换货申请，是否继续？',
    success: (res) => {
      if (res.confirm) {
        uni.navigateTo({
          url: `/pages/after-sales/ServiceForm?type=${item.type}&orderId=${item.orderId}`
        })
      }
    }
  })
}

// 创建退换货申请
const createReturn = () => {
  uni.showActionSheet({
    itemList: ['申请退货', '申请换货'],
    success: (res) => {
      const type = res.tapIndex === 0 ? 'return' : 'exchange'
      const title = res.tapIndex === 0 ? '退货申请' : '换货申请'
      uni.navigateTo({
        url: `/pages/after-sales/ServiceForm?type=${type}&title=${title}`
      })
    }
  })
}

// 获取退换货数据
const fetchReturns = async () => {
  try {
    const db = uniCloud.database()
    const res = await db.collection('returns_exchanges')
      .orderBy('applyTime', 'desc')
      .get()
    
    if (res.data && res.data.length > 0) {
      returns.value = res.data
      updateStats()
      updateTabCounts()
    } else {
      // 使用模拟数据
      returns.value = [
        {
          id: 'R001',
          orderNumber: 'ORD20240115001',
          type: 'return',
          status: 'approved',
          statusIndex: 1,
          productName: 'iPhone 15 Pro Max',
          specification: '256GB 钛金属',
          price: '9999',
          productImage: '',
          reason: '7天无理由退货',
          applyTime: '2024-01-15T10:30:00',
          orderId: 'ORD001'
        },
        {
          id: 'R002',
          orderNumber: 'ORD20240112002',
          type: 'exchange',
          status: 'shipping',
          statusIndex: 2,
          productName: 'AirPods Pro 2',
          specification: 'USB-C版',
          price: '1899',
          productImage: '',
          reason: '尺寸不合适',
          applyTime: '2024-01-12T14:20:00',
          orderId: 'ORD002'
        },
        {
          id: 'R003',
          orderNumber: 'ORD20240108003',
          type: 'return',
          status: 'completed',
          statusIndex: 3,
          productName: 'MacBook Pro 14"',
          specification: 'M3 Pro 18GB 512GB',
          price: '16999',
          productImage: '',
          reason: '质量问题退货',
          applyTime: '2024-01-08T09:15:00',
          orderId: 'ORD003'
        }
      ]
      updateStats()
      updateTabCounts()
    }
  } catch (error) {
    console.error('获取退换货数据失败:', error)
    uni.showToast({
      title: '数据加载失败',
      icon: 'error'
    })
  }
}

// 更新统计数据
const updateStats = () => {
  stats.value = {
    processing: returns.value.filter(r => ['reviewing', 'approved', 'shipping', 'received', 'processing'].includes(r.status)).length,
    completed: returns.value.filter(r => r.status === 'completed').length,
    pending: returns.value.filter(r => ['submitted', 'reviewing'].includes(r.status)).length
  }
}

// 更新标签计数
const updateTabCounts = () => {
  typeTabs.value.forEach(tab => {
    if (tab.value === 'all') {
      tab.count = returns.value.length
    } else if (tab.value === 'pending') {
      tab.count = returns.value.filter(r => ['submitted', 'reviewing'].includes(r.status)).length
    } else {
      tab.count = returns.value.filter(r => r.type === tab.value).length
    }
  })
}

onMounted(() => {
  fetchReturns()
})
</script>

<style scoped>
.return-processing {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  font-family: 'Source Han Sans SC', -system-ui, sans-serif;
}

.header-container {
  position: relative;
  height: 240rpx;
  overflow: hidden;
}

.header-wave {
  position: absolute;
  top: -80rpx;
  left: -200rpx;
  width: 600rpx;
  height: 600rpx;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  border-radius: 50%;
  transform: rotate(-20deg);
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
  color: #059669;
  margin-bottom: 16rpx;
  display: block;
}

.page-subtitle {
  font-size: 28rpx;
  color: #64748b;
  display: block;
}

.quick-stats {
  display: flex;
  justify-content: space-around;
  padding: 20rpx 30rpx;
  margin-top: -40rpx;
  position: relative;
  z-index: 3;
}

.stat-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx 20rpx;
  text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  min-width: 200rpx;
  transition: all 0.3s ease;
}

.stat-card:active {
  transform: translateY(-6rpx);
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16rpx;
}

.stat-icon.processing {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.icon {
  font-size: 40rpx;
}

.stat-number {
  font-size: 40rpx;
  font-weight: 700;
  color: #059669;
  display: block;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #64748b;
  display: block;
}

.type-tabs {
  display: flex;
  padding: 30rpx;
  gap: 20rpx;
  overflow-x: auto;
}

.type-tab {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 28rpx;
  background: #ffffff;
  border-radius: 50rpx;
  border: 2rpx solid #e5e7eb;
  white-space: nowrap;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.type-tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(5, 150, 105, 0.1), transparent);
  transition: left 0.5s ease;
}

.tab-active::before {
  left: 100%;
}

.tab-active {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: #059669;
  transform: translateY(-4rpx);
}

.tab-icon {
  font-size: 32rpx;
}

.tab-label {
  font-size: 26rpx;
  color: #64748b;
  font-weight: 500;
}

.tab-active .tab-label {
  color: #059669;
}

.tab-badge {
  min-width: 32rpx;
  height: 32rpx;
  background: #059669;
  color: #ffffff;
  border-radius: 50%;
  font-size: 20rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
}

.return-list {
  padding: 0 30rpx 200rpx;
}

.return-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.return-card:active {
  transform: translateY(-8rpx);
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.order-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.order-number {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
}

.return-type {
  font-size: 22rpx;
  font-weight: 600;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.type-return {
  background: #fee2e2;
  color: #dc2626;
}

.type-exchange {
  background: #e0f2fe;
  color: #0284c7;
}

.apply-date {
  font-size: 24rpx;
  color: #9ca3af;
}

.product-info {
  display: flex;
  gap: 24rpx;
  margin-bottom: 20rpx;
}

.product-image {
  width: 120rpx;
  height: 120rpx;
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

.product-spec {
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
}

.product-price {
  font-size: 26rpx;
  font-weight: 600;
  color: #059669;
}

.return-reason {
  background: #f9fafb;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 24rpx;
}

.reason-label {
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
  display: block;
}

.reason-text {
  font-size: 26rpx;
  color: #1f2937;
  display: block;
}

.status-timeline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
  padding: 0 20rpx;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.timeline-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: #e5e7eb;
  transition: all 0.3s ease;
}

.dot-completed {
  background: #059669;
  box-shadow: 0 0 0 8rpx rgba(5, 150, 105, 0.1);
}

.timeline-text {
  font-size: 20rpx;
  color: #6b7280;
  text-align: center;
  white-space: nowrap;
}

.timeline-line {
  flex: 1;
  height: 2rpx;
  background: #e5e7eb;
  margin: 0 8rpx;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-status {
  font-size: 26rpx;
  color: #059669;
  font-weight: 600;
}

.btn-action {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: #ffffff;
  border: none;
  border-radius: 24rpx;
  padding: 16rpx 32rpx;
  font-size: 24rpx;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-action:active {
  transform: scale(0.95);
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
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

.btn-primary {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: #ffffff;
  border: none;
  border-radius: 24rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  font-weight: 500;
}

.fab-container {
  position: fixed;
  bottom: 40rpx;
  right: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  z-index: 100;
}

.fab-button {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 40rpx rgba(5, 150, 105, 0.3);
  transition: all 0.3s ease;
}

.fab-button:active {
  transform: scale(0.9);
  box-shadow: 0 8rpx 24rpx rgba(5, 150, 105, 0.4);
}

.fab-icon {
  font-size: 48rpx;
  color: #ffffff;
  font-weight: 300;
}

.fab-text {
  font-size: 22rpx;
  color: #64748b;
  background: #ffffff;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}
</style>