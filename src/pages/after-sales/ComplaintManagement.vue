<template>
  <view class="complaint-management">
    <view class="header-container">
      <view class="header-pattern"></view>
      <view class="header-content">
        <text class="page-title">投诉管理</text>
        <text class="page-subtitle">跟踪您的投诉处理进度</text>
      </view>
    </view>

    <!-- 统计概览 -->
    <view class="stats-container">
      <view class="stats-card">
        <view class="stat-item">
          <text class="stat-number">{{ stats.total }}</text>
          <text class="stat-label">总投诉数</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-number">{{ stats.pending }}</text>
          <text class="stat-label">处理中</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-number">{{ stats.resolved }}</text>
          <text class="stat-label">已解决</text>
        </view>
      </view>
    </view>

    <!-- 投诉列表 -->
    <view class="complaints-container">
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

      <!-- 投诉卡片列表 -->
      <view class="complaint-list">
        <view 
          v-for="(complaint, index) in filteredComplaints" 
          :key="complaint.id"
          class="complaint-card"
          @tap="viewComplaintDetail(complaint)"
        >
          <view class="card-header">
            <view class="complaint-info">
              <text class="complaint-id">#{{ complaint.id }}</text>
              <view class="complaint-status" :class="`status-${complaint.status}`">
                {{ getStatusText(complaint.status) }}
              </view>
            </view>
            <text class="complaint-date">{{ formatDate(complaint.createTime) }}</text>
          </view>
          
          <view class="card-content">
            <text class="complaint-title">{{ complaint.title }}</text>
            <text class="complaint-desc">{{ complaint.description }}</text>
            <view class="complaint-tags">
              <view 
                v-for="tag in complaint.tags" 
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </view>
            </view>
          </view>

          <view class="card-footer">
            <view class="progress-info" v-if="complaint.status !== 'resolved'">
              <text class="progress-text">处理进度</text>
              <view class="progress-bar">
                <view 
                  class="progress-fill" 
                  :style="{ width: complaint.progress + '%' }"
                ></view>
              </view>
              <text class="progress-percent">{{ complaint.progress }}%</text>
            </view>
            <view class="action-buttons">
              <button class="btn-secondary" @tap.stop="followUp(complaint)">
                追进
              </button>
              <button class="btn-primary" @tap.stop="viewDetail(complaint)">
                详情
              </button>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="filteredComplaints.length === 0" class="empty-state">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无{{ getFilterName() }}投诉</text>
        <button class="btn-primary" @tap="createComplaint">创建投诉</button>
      </view>
    </view>

    <!-- 浮动按钮 -->
    <view class="fab-button" @tap="createComplaint">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 页面数据
const activeFilter = ref<string>('all')
const complaints = ref<any[]>([])
const stats = ref({
  total: 0,
  pending: 0,
  resolved: 0
})

// 筛选标签
const filterTabs = ref([
  { label: '全部', value: 'all', count: 0 },
  { label: '处理中', value: 'pending', count: 0 },
  { label: '已受理', value: 'processing', count: 0 },
  { label: '已解决', value: 'resolved', count: 0 },
  { label: '已关闭', value: 'closed', count: 0 }
])

// 过滤后的投诉列表
const filteredComplaints = computed(() => {
  if (activeFilter.value === 'all') {
    return complaints.value
  }
  return complaints.value.filter(complaint => complaint.status === activeFilter.value)
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

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'pending': '待处理',
    'processing': '处理中',
    'resolved': '已解决',
    'closed': '已关闭'
  }
  return statusMap[status] || status
}

// 格式化日期
const formatDate = (date: string) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 查看投诉详情
const viewComplaintDetail = (complaint: any) => {
  uni.navigateTo({
    url: `/pages/after-sales/ComplaintDetail?id=${complaint.id}`
  })
}

// 追进投诉
const followUp = (complaint: any) => {
  uni.showActionSheet({
    itemList: ['电话追进', '留言追进', '升级处理'],
    success: (res) => {
      switch(res.tapIndex) {
        case 0:
          makePhoneCall(complaint.contactPhone)
          break
        case 1:
          navigateToFollowUp(complaint.id)
          break
        case 2:
          escalateComplaint(complaint.id)
          break
      }
    }
  })
}

// 查看详情
const viewDetail = (complaint: any) => {
  uni.navigateTo({
    url: `/pages/after-sales/ComplaintDetail?id=${complaint.id}`
  })
}

// 创建投诉
const createComplaint = () => {
  uni.navigateTo({
    url: '/pages/after-sales/ServiceForm?type=complaint&title=投诉申请'
  })
}

// 拨打电话
const makePhoneCall = (phone: string) => {
  uni.makePhoneCall({
    phoneNumber: phone
  })
}

// 导航到追进页面
const navigateToFollowUp = (id: string) => {
  uni.navigateTo({
    url: `/pages/after-sales/FollowUp?id=${id}`
  })
}

// 升级投诉
const escalateComplaint = (id: string) => {
  uni.showModal({
    title: '确认升级',
    content: '升级投诉后将有更高级别的客服处理，是否确认？',
    success: (res) => {
      if (res.confirm) {
        updateComplaintStatus(id, 'escalated')
      }
    }
  })
}

// 更新投诉状态
const updateComplaintStatus = async (id: string, status: string) => {
  try {
    const db = uniCloud.database()
    await db.collection('complaints').doc(id).update({
      status,
      updateTime: new Date().toISOString()
    })
    
    uni.showToast({
      title: '操作成功',
      icon: 'success'
    })
    
    fetchComplaints()
  } catch (error) {
    uni.showToast({
      title: '操作失败',
      icon: 'error'
    })
  }
}

// 获取投诉数据
const fetchComplaints = async () => {
  try {
    const db = uniCloud.database()
    const res = await db.collection('complaints')
      .orderBy('createTime', 'desc')
      .get()
    
    if (res.data && res.data.length > 0) {
      complaints.value = res.data
      updateStats()
      updateTabCounts()
    } else {
      // 使用模拟数据
      complaints.value = [
        {
          id: 'C001',
          title: '产品质量问题',
          description: '购买的耳机在使用一个月后出现杂音问题',
          status: 'processing',
          progress: 65,
          tags: ['产品质量', '售后'],
          createTime: '2024-01-15T10:30:00',
          updateTime: '2024-01-16T14:20:00',
          contactPhone: '400-123-4567'
        },
        {
          id: 'C002',
          title: '物流配送延迟',
          description: '订单显示已送达但实际未收到商品',
          status: 'resolved',
          progress: 100,
          tags: ['物流', '配送'],
          createTime: '2024-01-10T09:15:00',
          updateTime: '2024-01-12T16:30:00',
          contactPhone: '400-123-4567'
        },
        {
          id: 'C003',
          title: '客服服务态度',
          description: '客服人员态度恶劣，无法有效解决问题',
          status: 'pending',
          progress: 10,
          tags: ['客服', '服务质量'],
          createTime: '2024-01-18T11:45:00',
          updateTime: '2024-01-18T11:45:00',
          contactPhone: '400-123-4567'
        }
      ]
      updateStats()
      updateTabCounts()
    }
  } catch (error) {
    console.error('获取投诉数据失败:', error)
    uni.showToast({
      title: '数据加载失败',
      icon: 'error'
    })
  }
}

// 更新统计数据
const updateStats = () => {
  stats.value = {
    total: complaints.value.length,
    pending: complaints.value.filter(c => c.status === 'pending').length,
    resolved: complaints.value.filter(c => c.status === 'resolved').length
  }
}

// 更新标签计数
const updateTabCounts = () => {
  filterTabs.value.forEach(tab => {
    if (tab.value === 'all') {
      tab.count = complaints.value.length
    } else {
      tab.count = complaints.value.filter(c => c.status === tab.value).length
    }
  })
}

onMounted(() => {
  fetchComplaints()
})
</script>

<style scoped>
.complaint-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  font-family: 'Source Han Sans SC', -system-ui, sans-serif;
}

.header-container {
  position: relative;
  height: 240rpx;
  overflow: hidden;
}

.header-pattern {
  position: absolute;
  top: -50rpx;
  right: -100rpx;
  width: 500rpx;
  height: 500rpx;
  background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
  border-radius: 50%;
  transform: rotate(25deg);
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
  color: #DC2626;
  margin-bottom: 16rpx;
  display: block;
}

.page-subtitle {
  font-size: 28rpx;
  color: #64748b;
  display: block;
}

.stats-container {
  padding: 0 30rpx;
  margin-top: -40rpx;
  position: relative;
  z-index: 3;
}

.stats-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 48rpx;
  font-weight: 700;
  color: #DC2626;
  display: block;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #64748b;
  display: block;
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: #e2e8f0;
}

.complaints-container {
  padding: 30rpx;
  padding-bottom: 160rpx;
}

.filter-tabs {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
  overflow-x: auto;
  padding-bottom: 10rpx;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 32rpx;
  background: #ffffff;
  border-radius: 50rpx;
  border: 2rpx solid #e2e8f0;
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
  background: linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.1), transparent);
  transition: left 0.5s ease;
}

.tab-active::before {
  left: 100%;
}

.tab-active {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-color: #DC2626;
  transform: translateY(-4rpx);
}

.tab-text {
  font-size: 26rpx;
  color: #64748b;
  font-weight: 500;
}

.tab-active .tab-text {
  color: #DC2626;
}

.tab-badge {
  min-width: 32rpx;
  height: 32rpx;
  background: #DC2626;
  color: #ffffff;
  border-radius: 50%;
  font-size: 20rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
}

.complaint-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.complaint-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border-left: 6rpx solid transparent;
}

.complaint-card:active {
  transform: translateY(-6rpx);
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.12);
}

.complaint-card:nth-child(odd) {
  border-left-color: #DC2626;
}

.complaint-card:nth-child(even) {
  border-left-color: #f59e0b;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.complaint-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.complaint-id {
  font-size: 24rpx;
  color: #64748b;
  font-weight: 600;
}

.complaint-status {
  font-size: 22rpx;
  font-weight: 600;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.status-pending {
  background: #fef3c7;
  color: #d97706;
}

.status-processing {
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

.complaint-date {
  font-size: 24rpx;
  color: #9ca3af;
}

.card-content {
  margin-bottom: 24rpx;
}

.complaint-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12rpx;
  display: block;
}

.complaint-desc {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 16rpx;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.complaint-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag {
  font-size: 22rpx;
  color: #059669;
  background: #d1fae5;
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-info {
  flex: 1;
  margin-right: 20rpx;
}

.progress-text {
  font-size: 22rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
  display: block;
}

.progress-bar {
  height: 8rpx;
  background: #e5e7eb;
  border-radius: 4rpx;
  overflow: hidden;
  margin-bottom: 8rpx;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #DC2626 0%, #ef4444 100%);
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

.progress-percent {
  font-size: 22rpx;
  color: #DC2626;
  font-weight: 600;
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
  background: linear-gradient(135deg, #DC2626 0%, #ef4444 100%);
  color: #ffffff;
}

.btn-secondary:active {
  transform: scale(0.95);
  background: #e5e7eb;
}

.btn-primary:active {
  transform: scale(0.95);
  background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
}

.empty-state {
  text-align: center;
  padding: 100rpx 40rpx;
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
  background: linear-gradient(135deg, #DC2626 0%, #ef4444 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 40rpx rgba(220, 38, 38, 0.3);
  z-index: 100;
  transition: all 0.3s ease;
}

.fab-button:active {
  transform: scale(0.9);
  box-shadow: 0 8rpx 24rpx rgba(220, 38, 38, 0.4);
}

.fab-icon {
  font-size: 48rpx;
  color: #ffffff;
  font-weight: 300;
}
</style>