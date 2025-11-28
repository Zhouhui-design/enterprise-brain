<template>
  <view class="customer-feedback">
    <view class="header-container">
      <view class="header-pattern"></view>
      <view class="header-content">
        <text class="page-title">客户反馈</text>
        <text class="page-subtitle">分享您的使用体验</text>
      </view>
    </view>

    <!-- 快速统计 -->
    <view class="feedback-stats">
      <view class="stat-card">
        <view class="stat-icon">
          <text class="icon">⭐</text>
        </view>
        <text class="stat-number">{{ feedbackStats.totalFeedbacks }}</text>
        <text class="stat-label">总反馈数</text>
      </view>
      <view class="stat-card">
        <view class="stat-icon">
          <text class="icon">👍</text>
        </view>
        <text class="stat-number">{{ feedbackStats.positiveRate }}%</text>
        <text class="stat-label">满意度</text>
      </view>
      <view class="stat-card">
        <view class="stat-icon">
          <text class="icon">💬</text>
        </view>
        <text class="stat-number">{{ feedbackStats.pendingResponse }}</text>
        <text class="stat-label">待回复</text>
      </view>
    </view>

    <!-- 快速反馈入口 -->
    <view class="quick-feedback">
      <view class="feedback-card">
        <view class="card-header">
          <text class="card-title">快速反馈</text>
          <text class="card-subtitle">选择反馈类型快速开始</text>
        </view>
        <view class="feedback-types">
          <view 
            v-for="(type, index) in feedbackTypes" 
            :key="index"
            class="type-item"
            @tap="selectFeedbackType(type)"
          >
            <view class="type-icon" :class="type.iconClass">
              <text class="icon">{{ type.icon }}</text>
            </view>
            <text class="type-name">{{ type.name }}</text>
            <text class="type-count">{{ type.count }}次</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 筛选标签 -->
    <view class="filter-section">
      <text class="filter-title">我的反馈</text>
      <view class="filter-tabs">
        <view 
          v-for="(tab, index) in filterTabs" 
          :key="index"
          class="filter-tab"
          :class="{ 'tab-active': activeFilter === tab.value }"
          @tap="switchFilter(tab.value)"
        >
          <text class="tab-text">{{ tab.label }}</text>
        </view>
      </view>
    </view>

    <!-- 反馈列表 -->
    <view class="feedback-list">
      <view 
        v-for="(feedback, index) in filteredFeedbacks" 
        :key="feedback.id"
        class="feedback-item"
        @tap="viewFeedbackDetail(feedback)"
      >
        <view class="item-header">
          <view class="feedback-info">
            <text class="feedback-id">#{{ feedback.id }}</text>
            <view class="feedback-type" :class="`type-${feedback.type}`">
              {{ getFeedbackTypeText(feedback.type) }}
            </view>
          </view>
          <text class="feedback-date">{{ formatDate(feedback.createTime) }}</text>
        </view>

        <view class="item-content">
          <text class="feedback-title">{{ feedback.title }}</text>
          <text class="feedback-desc">{{ feedback.content }}</text>
          
          <!-- 评分显示 -->
          <view class="rating-section" v-if="feedback.rating">
            <text class="rating-label">评分：</text>
            <view class="rating-stars">
              <text 
                v-for="i in 5" 
                :key="i"
                class="star"
                :class="{ 'star-filled': i <= feedback.rating }"
              >
                ⭐
              </text>
            </view>
          </view>

          <!-- 标签 -->
          <view class="feedback-tags" v-if="feedback.tags && feedback.tags.length">
            <view 
              v-for="tag in feedback.tags" 
              :key="tag"
              class="tag"
            >
              {{ tag }}
            </view>
          </view>
        </view>

        <!-- 回复状态 -->
        <view class="reply-section" v-if="feedback.reply">
          <view class="reply-header">
            <text class="reply-label">客服回复</text>
            <text class="reply-date">{{ formatDate(feedback.replyTime) }}</text>
          </view>
          <text class="reply-content">{{ feedback.reply }}</text>
        </view>

        <view class="item-footer">
          <view class="status-info" :class="`status-${feedback.status}`">
            {{ getStatusText(feedback.status) }}
          </view>
          <view class="action-buttons">
            <button class="btn-secondary" @tap.stop="editFeedback(feedback)">
              编辑
            </button>
            <button class="btn-primary" @tap.stop="viewDetail(feedback)">
              详情
            </button>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="filteredFeedbacks.length === 0" class="empty-state">
        <text class="empty-icon">💭</text>
        <text class="empty-text">暂无{{ getFilterName() }}反馈</text>
        <button class="btn-primary" @tap="createFeedback">发表反馈</button>
      </view>
    </view>

    <!-- 浮动按钮 -->
    <view class="fab-button" @tap="createFeedback">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 页面状态
const activeFilter = ref<string>('all')
const feedbacks = ref<any[]>([])
const feedbackStats = ref({
  totalFeedbacks: 0,
  positiveRate: 0,
  pendingResponse: 0
})

// 反馈类型
const feedbackTypes = ref([
  { name: '产品建议', icon: '💡', iconClass: 'type-suggestion', count: 0, type: 'suggestion' },
  { name: '问题反馈', icon: '🐛', iconClass: 'type-bug', count: 0, type: 'bug' },
  { name: '服务评价', icon: '⭐', iconClass: 'type-rating', count: 0, type: 'rating' },
  { name: '功能需求', icon: '🚀', iconClass: 'type-feature', count: 0, type: 'feature' }
])

// 筛选标签
const filterTabs = ref([
  { label: '全部', value: 'all' },
  { label: '待回复', value: 'pending' },
  { label: '已回复', value: 'replied' },
  { label: '已解决', value: 'resolved' }
])

// 过滤后的反馈列表
const filteredFeedbacks = computed(() => {
  if (activeFilter.value === 'all') {
    return feedbacks.value
  }
  return feedbacks.value.filter(feedback => feedback.status === activeFilter.value)
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

// 获取反馈类型文本
const getFeedbackTypeText = (type: string) => {
  const typeMap: { [key: string]: string } = {
    'suggestion': '建议',
    'bug': '问题',
    'rating': '评价',
    'feature': '需求',
    'complaint': '投诉'
  }
  return typeMap[type] || type
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'pending': '待回复',
    'replied': '已回复',
    'resolved': '已解决',
    'closed': '已关闭'
  }
  return statusMap[status] || status
}

// 格式化日期
const formatDate = (date: string) => {
  const d = new Date(date)
  return `${d.getMonth() + 1}-${d.getDate()}`
}

// 选择反馈类型
const selectFeedbackType = (type: any) => {
  uni.navigateTo({
    url: `/pages/after-sales/FeedbackForm?type=${type.type}&title=${type.name}`
  })
}

// 查看反馈详情
const viewFeedbackDetail = (feedback: any) => {
  uni.navigateTo({
    url: `/pages/after-sales/FeedbackDetail?id=${feedback.id}`
  })
}

// 编辑反馈
const editFeedback = (feedback: any) => {
  if (feedback.reply) {
    uni.showToast({
      title: '已回复的反馈无法编辑',
      icon: 'none'
    })
    return
  }
  
  uni.navigateTo({
    url: `/pages/after-sales/FeedbackForm?id=${feedback.id}&type=${feedback.type}`
  })
}

// 查看详情
const viewDetail = (feedback: any) => {
  uni.navigateTo({
    url: `/pages/after-sales/FeedbackDetail?id=${feedback.id}`
  })
}

// 创建反馈
const createFeedback = () => {
  uni.showActionSheet({
    itemList: ['产品建议', '问题反馈', '服务评价', '功能需求'],
    success: (res) => {
      const types = ['suggestion', 'bug', 'rating', 'feature']
      const titles = ['产品建议', '问题反馈', '服务评价', '功能需求']
      const type = types[res.tapIndex]
      const title = titles[res.tapIndex]
      
      uni.navigateTo({
        url: `/pages/after-sales/FeedbackForm?type=${type}&title=${title}`
      })
    }
  })
}

// 获取反馈数据
const fetchFeedbacks = async () => {
  try {
    const db = uniCloud.database()
    const res = await db.collection('customer_feedback')
      .orderBy('createTime', 'desc')
      .get()
    
    if (res.data && res.data.length > 0) {
      feedbacks.value = res.data
      updateStats()
      updateTypeCounts()
    } else {
      // 使用模拟数据
      feedbacks.value = [
        {
          id: 'F001',
          type: 'suggestion',
          title: '建议增加夜间模式',
          content: '希望APP能增加夜间模式功能，保护用户视力',
          rating: 4,
          tags: ['功能建议', '用户体验'],
          status: 'replied',
          createTime: '2024-01-15T10:30:00',
          reply: '感谢您的建议，我们会在下个版本中考虑加入夜间模式功能。',
          replyTime: '2024-01-15T14:20:00'
        },
        {
          id: 'F002',
          type: 'bug',
          title: '支付页面卡顿',
          content: '在支付页面时出现明显卡顿，影响用户体验',
          rating: 2,
          tags: ['性能问题', '支付'],
          status: 'pending',
          createTime: '2024-01-14T09:15:00'
        },
        {
          id: 'F003',
          type: 'rating',
          title: '客服服务态度很好',
          content: '今天联系客服解决了问题，服务态度非常好，专业耐心',
          rating: 5,
          tags: ['客服', '表扬'],
          status: 'resolved',
          createTime: '2024-01-13T16:45:00',
          reply: '感谢您的认可，我们会继续提供优质的服务。',
          replyTime: '2024-01-13T17:30:00'
        }
      ]
      updateStats()
      updateTypeCounts()
    }
  } catch (error) {
    console.error('获取反馈数据失败:', error)
    uni.showToast({
      title: '数据加载失败',
      icon: 'error'
    })
  }
}

// 更新统计数据
const updateStats = () => {
  const total = feedbacks.value.length
  const replied = feedbacks.value.filter(f => f.status === 'replied' || f.status === 'resolved')
  const positive = feedbacks.value.filter(f => f.rating && f.rating >= 4)
  
  feedbackStats.value = {
    totalFeedbacks: total,
    positiveRate: total > 0 ? Math.round((positive.length / total) * 100) : 0,
    pendingResponse: feedbacks.value.filter(f => f.status === 'pending').length
  }
}

// 更新类型计数
const updateTypeCounts = () => {
  feedbackTypes.value.forEach(type => {
    type.count = feedbacks.value.filter(f => f.type === type.type).length
  })
}

onMounted(() => {
  fetchFeedbacks()
})
</script>

<style scoped>
.customer-feedback {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  font-family: 'Source Han Sans SC', -system-ui, sans-serif;
}

.header-container {
  position: relative;
  height: 240rpx;
  overflow: hidden;
}

.header-pattern {
  position: absolute;
  top: -80rpx;
  left: -200rpx;
  width: 600rpx;
  height: 600rpx;
  background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
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
  color: #0ea5e9;
  margin-bottom: 16rpx;
  display: block;
}

.page-subtitle {
  font-size: 28rpx;
  color: #64748b;
  display: block;
}

.feedback-stats {
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
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16rpx;
}

.icon {
  font-size: 40rpx;
}

.stat-number {
  font-size: 40rpx;
  font-weight: 700;
  color: #0ea5e9;
  display: block;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #64748b;
  display: block;
}

.quick-feedback {
  padding: 0 30rpx;
  margin-bottom: 30rpx;
}

.feedback-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.card-header {
  margin-bottom: 30rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8rpx;
  display: block;
}

.card-subtitle {
  font-size: 26rpx;
  color: #6b7280;
  display: block;
}

.feedback-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx 20rpx;
  background: #f9fafb;
  border-radius: 20rpx;
  transition: all 0.3s ease;
}

.type-item:active {
  transform: translateY(-8rpx);
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.12);
}

.type-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}

.type-icon.type-suggestion {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.type-icon.type-bug {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.type-icon.type-rating {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.type-icon.type-feature {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
}

.type-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8rpx;
}

.type-count {
  font-size: 22rpx;
  color: #6b7280;
}

.filter-section {
  padding: 0 30rpx 30rpx;
}

.filter-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20rpx;
  display: block;
}

.filter-tabs {
  display: flex;
  gap: 16rpx;
  overflow-x: auto;
  padding-bottom: 10rpx;
}

.filter-tab {
  padding: 20rpx 32rpx;
  background: #ffffff;
  border-radius: 50rpx;
  border: 2rpx solid #e5e7eb;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.tab-active {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #0ea5e9;
}

.tab-text {
  font-size: 26rpx;
  color: #64748b;
  font-weight: 500;
}

.tab-active .tab-text {
  color: #0ea5e9;
}

.feedback-list {
  padding: 0 30rpx 200rpx;
}

.feedback-item {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.feedback-item:active {
  transform: translateY(-6rpx);
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.12);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.feedback-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.feedback-id {
  font-size: 24rpx;
  color: #64748b;
  font-weight: 600;
}

.feedback-type {
  font-size: 22rpx;
  font-weight: 600;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.type-suggestion {
  background: #fef3c7;
  color: #d97706;
}

.type-bug {
  background: #fee2e2;
  color: #dc2626;
}

.type-rating {
  background: #d1fae5;
  color: #059669;
}

.type-feature {
  background: #e0e7ff;
  color: #4f46e5;
}

.feedback-date {
  font-size: 24rpx;
  color: #9ca3af;
}

.item-content {
  margin-bottom: 24rpx;
}

.feedback-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12rpx;
  display: block;
}

.feedback-desc {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 16rpx;
  display: block;
}

.rating-section {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.rating-label {
  font-size: 24rpx;
  color: #6b7280;
}

.rating-stars {
  display: flex;
  gap: 4rpx;
}

.star {
  font-size: 24rpx;
  color: #e5e7eb;
}

.star-filled {
  color: #f59e0b;
}

.feedback-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag {
  font-size: 22rpx;
  color: #6b7280;
  background: #f3f4f6;
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
}

.reply-section {
  background: #f9fafb;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 24rpx;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.reply-label {
  font-size: 24rpx;
  color: #0ea5e9;
  font-weight: 600;
}

.reply-date {
  font-size: 22rpx;
  color: #9ca3af;
}

.reply-content {
  font-size: 26rpx;
  color: #1f2937;
  line-height: 1.6;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-info {
  font-size: 24rpx;
  font-weight: 600;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.status-pending {
  background: #fef3c7;
  color: #d97706;
}

.status-replied {
  background: #dbeafe;
  color: #2563eb;
}

.status-resolved {
  background: #d1fae5;
  color: #059669;
}

.status-closed {
  background: #f3f4f6;
  color: #6b7280;
}

.action-buttons {
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
  background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
  color: #ffffff;
}

.btn-secondary:active {
  transform: scale(0.95);
  background: #e5e7eb;
}

.btn-primary:active {
  transform: scale(0.95);
  background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
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
  background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 40rpx rgba(14, 165, 233, 0.3);
  z-index: 100;
  transition: all 0.3s ease;
}

.fab-button:active {
  transform: scale(0.9);
  box-shadow: 0 8rpx 24rpx rgba(14, 165, 233, 0.4);
}

.fab-icon {
  font-size: 48rpx;
  color: #ffffff;
  font-weight: 300;
}
</style>