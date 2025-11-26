<template>
  <view class="service-request">
    <view class="header-container">
      <view class="header-diagonal"></view>
      <view class="header-content">
        <text class="page-title">服务申请</text>
        <text class="page-subtitle">提交您的售后服务需求</text>
      </view>
    </view>

    <view class="content-container">
      <!-- 快速申请卡片 -->
      <view class="quick-request-card">
        <view class="card-header">
          <text class="card-title">快速申请</text>
          <view class="card-icon">
            <text class="icon-rocket">🚀</text>
          </view>
        </view>
        <view class="request-types">
          <view 
            v-for="(type, index) in requestTypes" 
            :key="index"
            class="type-item"
            :class="{ 'type-active': selectedType === type.id }"
            @tap="selectRequestType(type)"
          >
            <view class="type-icon">{{ type.icon }}</view>
            <text class="type-name">{{ type.name }}</text>
            <text class="type-desc">{{ type.description }}</text>
          </view>
        </view>
      </view>

      <!-- 服务历史记录 -->
      <view class="history-card">
        <view class="history-header">
          <text class="history-title">最近申请</text>
          <text class="view-all" @tap="viewAllHistory">查看全部</text>
        </view>
        <view class="history-list">
          <view 
            v-for="(item, index) in recentRequests" 
            :key="index"
            class="history-item"
            @tap="viewRequestDetail(item)"
          >
            <view class="item-left">
              <view class="item-status" :class="`status-${item.status}`">
                {{ getStatusText(item.status) }}
              </view>
              <text class="item-title">{{ item.title }}</text>
              <text class="item-date">{{ formatDate(item.createTime) }}</text>
            </view>
            <view class="item-right">
              <text class="item-id">#{{ item.id }}</text>
              <text class="arrow-icon">></text>
            </view>
          </view>
        </view>
      </view>

      <!-- 帮助中心 -->
      <view class="help-section">
        <view class="help-title">需要帮助？</view>
        <view class="help-options">
          <view class="help-item" @tap="openFAQ">
            <text class="help-icon">❓</text>
            <text class="help-text">常见问题</text>
          </view>
          <view class="help-item" @tap="contactSupport">
            <text class="help-icon">💬</text>
            <text class="help-text">在线客服</text>
          </view>
          <view class="help-item" @tap="callSupport">
            <text class="help-icon">📞</text>
            <text class="help-text">电话支持</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部导航 -->
    <view class="bottom-nav">
      <view class="nav-item" @tap="goHome">
        <text class="nav-icon">🏠</text>
        <text class="nav-text">首页</text>
      </view>
      <view class="nav-item active" @tap="goService">
        <text class="nav-icon">🔧</text>
        <text class="nav-text">服务</text>
      </view>
      <view class="nav-item" @tap="goOrders">
        <text class="nav-icon">📦</text>
        <text class="nav-text">订单</text>
      </view>
      <view class="nav-item" @tap="goProfile">
        <text class="nav-icon">👤</text>
        <text class="nav-text">我的</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 页面状态
const selectedType = ref<string>('')
const recentRequests = ref<any[]>([])

// 申请类型
const requestTypes = ref([
  {
    id: 'repair',
    name: '维修申请',
    description: '产品故障维修服务',
    icon: '🔨'
  },
  {
    id: 'return',
    name: '退货申请',
    description: '不满意商品退货',
    icon: '↩️'
  },
  {
    id: 'exchange',
    name: '换货申请',
    description: '商品规格/颜色更换',
    icon: '🔄'
  },
  {
    id: 'complaint',
    name: '投诉建议',
    description: '服务投诉与改进建议',
    icon: '💭'
  },
  {
    id: 'warranty',
    name: '保修服务',
    description: '产品质量问题保修',
    icon: '🛡️'
  },
  {
    id: 'consultation',
    name: '技术咨询',
    description: '产品使用技术支持',
    icon: '💡'
  }
])

// 选择申请类型
const selectRequestType = (type: any) => {
  selectedType.value = type.id
  uni.navigateTo({
    url: `/pages/after-sales/ServiceForm?type=${type.id}&title=${type.name}`
  })
}

// 查看申请详情
const viewRequestDetail = (item: any) => {
  uni.navigateTo({
    url: `/pages/after-sales/RequestDetail?id=${item.id}`
  })
}

// 查看全部历史
const viewAllHistory = () => {
  uni.navigateTo({
    url: '/pages/after-sales/RequestHistory'
  })
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'pending': '处理中',
    'approved': '已受理',
    'completed': '已完成',
    'rejected': '已拒绝'
  }
  return statusMap[status] || status
}

// 格式化日期
const formatDate = (date: string) => {
  const d = new Date(date)
  return `${d.getMonth() + 1}-${d.getDate()}`
}

// 导航功能
const goHome = () => {
  uni.switchTab({ url: '/pages/index/index' })
}

const goService = () => {
  // 当前页面
}

const goOrders = () => {
  uni.navigateTo({ url: '/pages/orders/orders' })
}

const goProfile = () => {
  uni.switchTab({ url: '/pages/profile/profile' })
}

// 帮助功能
const openFAQ = () => {
  uni.navigateTo({ url: '/pages/help/faq' })
}

const contactSupport = () => {
  uni.navigateTo({ url: '/pages/support/chat' })
}

const callSupport = () => {
  uni.makePhoneCall({
    phoneNumber: '400-123-4567'
  })
}

// 获取最近申请记录
const fetchRecentRequests = async () => {
  try {
    const db = uniCloud.database()
    const res = await db.collection('service_requests')
      .orderBy('createTime', 'desc')
      .limit(5)
      .get()
    
    recentRequests.value = res.data || []
  } catch (error) {
    console.error('获取申请记录失败:', error)
    // 使用模拟数据
    recentRequests.value = [
      {
        id: '001',
        title: '手机屏幕维修',
        status: 'pending',
        createTime: '2024-01-15T10:30:00'
      },
      {
        id: '002',
        title: '耳机退换货',
        status: 'completed',
        createTime: '2024-01-10T14:20:00'
      },
      {
        id: '003',
        title: '产品咨询',
        status: 'approved',
        createTime: '2024-01-05T09:15:00'
      }
    ]
  }
}

onMounted(() => {
  fetchRecentRequests()
})
</script>

<style scoped>
.service-request {
  min-height: 100vh;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  font-family: 'Source Han Sans SC', -system-ui, sans-serif;
}

.header-container {
  position: relative;
  height: 280rpx;
  overflow: hidden;
}

.header-diagonal {
  position: absolute;
  top: -100rpx;
  right: -200rpx;
  width: 600rpx;
  height: 600rpx;
  background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
  border-radius: 50%;
  transform: rotate(-15deg);
}

.header-content {
  position: absolute;
  top: 100rpx;
  left: 60rpx;
  z-index: 2;
}

.page-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #1E40AF;
  margin-bottom: 16rpx;
  display: block;
}

.page-subtitle {
  font-size: 28rpx;
  color: #6B7280;
  display: block;
}

.content-container {
  padding: 0 30rpx 120rpx;
}

.quick-request-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin: 20rpx 0;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  transform: translateY(-40rpx);
  position: relative;
  z-index: 2;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}

.card-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1F2937;
}

.card-icon {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-rocket {
  font-size: 40rpx;
}

.request-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.type-item {
  background: #F9FAFB;
  border: 2rpx solid #E5E7EB;
  border-radius: 20rpx;
  padding: 30rpx;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.type-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
  transition: left 0.5s ease;
}

.type-item.type-active::before {
  left: 100%;
}

.type-active {
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  border-color: #3B82F6;
  transform: translateY(-4rpx);
  box-shadow: 0 12rpx 24rpx rgba(59, 130, 246, 0.15);
}

.type-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
  display: block;
}

.type-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 8rpx;
  display: block;
}

.type-desc {
  font-size: 24rpx;
  color: #6B7280;
  display: block;
}

.history-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin: 20rpx 0;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.history-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1F2937;
}

.view-all {
  font-size: 26rpx;
  color: #3B82F6;
  text-decoration: underline;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #F9FAFB;
  border-radius: 16rpx;
  border-left: 6rpx solid #E5E7EB;
  transition: all 0.3s ease;
}

.history-item:active {
  transform: translateX(8rpx);
  background: #F3F4F6;
}

.item-left {
  flex: 1;
}

.item-status {
  font-size: 22rpx;
  font-weight: 600;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  margin-bottom: 12rpx;
  display: inline-block;
}

.status-pending {
  background: #FEF3C7;
  color: #D97706;
}

.status-approved {
  background: #D1FAE5;
  color: #059669;
}

.status-completed {
  background: #DBEAFE;
  color: #2563EB;
}

.status-rejected {
  background: #FEE2E2;
  color: #DC2626;
}

.item-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #1F2937;
  margin-bottom: 8rpx;
  display: block;
}

.item-date {
  font-size: 24rpx;
  color: #6B7280;
  display: block;
}

.item-right {
  text-align: right;
  align-items: flex-end;
}

.item-id {
  font-size: 24rpx;
  color: #6B7280;
  margin-bottom: 8rpx;
  display: block;
}

.arrow-icon {
  font-size: 32rpx;
  color: #9CA3AF;
}

.help-section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin: 20rpx 0;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.help-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 30rpx;
  text-align: center;
}

.help-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.help-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx 20rpx;
  background: #F9FAFB;
  border-radius: 20rpx;
  transition: all 0.3s ease;
}

.help-item:active {
  transform: translateY(-6rpx);
  box-shadow: 0 12rpx 24rpx rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
}

.help-icon {
  font-size: 40rpx;
  margin-bottom: 16rpx;
}

.help-text {
  font-size: 24rpx;
  color: #374151;
  text-align: center;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #ffffff;
  border-top: 1rpx solid #E5E7EB;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  transition: all 0.3s ease;
}

.nav-item.active {
  color: #3B82F6;
}

.nav-icon {
  font-size: 32rpx;
}

.nav-text {
  font-size: 20rpx;
  color: #6B7280;
}

.nav-item.active .nav-text {
  color: #3B82F6;
}
</style>