<template>
  <view class="complaint-tracker">
    <view class="header-container">
      <view class="header-pattern"></view>
      <view class="header-content">
        <text class="page-title">投诉追踪</text>
        <text class="page-subtitle">实时追踪投诉处理进度</text>
      </view>
    </view>

    <!-- 搜索和筛选 -->
    <view class="search-section">
      <view class="search-bar">
        <input 
          class="search-input"
          type="text"
          v-model="searchKeyword"
          placeholder="输入投诉编号或关键词"
          @input="onSearchInput"
        />
        <view class="search-button" @tap="performSearch">
          <text class="search-icon">🔍</text>
        </view>
      </view>
      
      <view class="filter-chips">
        <view 
          v-for="(filter, index) in quickFilters" 
          :key="index"
          class="filter-chip"
          :class="{ 'chip-active': activeFilter === filter.value }"
          @tap="setFilter(filter.value)"
        >
          <text class="chip-text">{{ filter.label }}</text>
        </view>
      </view>
    </view>

    <!-- 投诉详情卡片 -->
    <view class="complaint-detail" v-if="currentComplaint">
      <view class="detail-header">
        <view class="complaint-brief">
          <text class="complaint-id">#{{ currentComplaint.id }}</text>
          <view class="complaint-status" :class="`status-${currentComplaint.status}`">
            {{ getStatusText(currentComplaint.status) }}
          </view>
        </view>
        <view class="priority-info" v-if="currentComplaint.priority">
          <text class="priority-label">优先级：</text>
          <text class="priority-value" :class="`priority-${currentComplaint.priority}`">
            {{ getPriorityText(currentComplaint.priority) }}
          </text>
        </view>
      </view>

      <view class="complaint-content">
        <text class="complaint-title">{{ currentComplaint.title }}</text>
        <text class="complaint-description">{{ currentComplaint.description }}</text>
        
        <view class="complaint-meta" v-if="currentComplaint.tags">
          <view 
            v-for="tag in currentComplaint.tags" 
            :key="tag"
            class="meta-tag"
          >
            {{ tag }}
          </view>
        </view>
      </view>
    </view>

    <!-- 处理进度时间线 -->
    <view class="progress-timeline" v-if="currentComplaint">
      <view class="timeline-header">
        <text class="timeline-title">处理进度</text>
        <text class="last-update">最后更新：{{ formatDate(currentComplaint.updateTime) }}</text>
      </view>

      <view class="timeline-container">
        <view 
          v-for="(step, index) in progressSteps" 
          :key="index"
          class="timeline-item"
          :class="{ 'step-completed': step.completed, 'step-current': step.current }"
        >
          <view class="timeline-dot">
            <text class="dot-icon">{{ step.icon }}</text>
          </view>
          <view class="timeline-content">
            <text class="step-title">{{ step.title }}</text>
            <text class="step-time" v-if="step.time">{{ formatDate(step.time) }}</text>
            <text class="step-description" v-if="step.description">{{ step.description }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 处理人员信息 -->
    <view class="handler-info" v-if="currentComplaint && currentComplaint.handler">
      <view class="info-header">
        <text class="info-title">处理人员</text>
      </view>
      <view class="handler-card">
        <view class="handler-avatar">
          <image 
            class="avatar-image" 
            :src="currentComplaint.handler.avatar || '/static/images/default-avatar.png'"
            mode="aspectFill"
          />
        </view>
        <view class="handler-details">
          <text class="handler-name">{{ currentComplaint.handler.name }}</text>
          <text class="handler-role">{{ currentComplaint.handler.role }}</text>
          <text class="handler-contact">联系电话：{{ currentComplaint.handler.phone }}</text>
        </view>
        <view class="contact-actions">
          <button class="contact-btn" @tap="callHandler">
            <text class="btn-icon">📞</text>
          </button>
          <button class="contact-btn" @tap="chatHandler">
            <text class="btn-icon">💬</text>
          </button>
        </view>
      </view>
    </view>

    <!-- 沟通记录 -->
    <view class="communication-history" v-if="currentComplaint">
      <view class="history-header">
        <text class="history-title">沟通记录</text>
        <text class="history-count">共{{ communicationRecords.length }}条</text>
      </view>

      <view class="record-list">
        <view 
          v-for="(record, index) in communicationRecords" 
          :key="index"
          class="record-item"
          :class="{ 'record-user': record.sender === 'user', 'record-system': record.sender === 'system' }"
        >
          <view class="record-avatar">
            <image 
              class="avatar-image" 
              :src="getRecordAvatar(record.sender)"
              mode="aspectFill"
            />
          </view>
          <view class="record-content">
            <view class="record-meta">
              <text class="record-sender">{{ getRecordSenderName(record.sender) }}</text>
              <text class="record-time">{{ formatDateTime(record.createTime) }}</text>
            </view>
            <text class="record-message">{{ record.message }}</text>
            <view class="record-attachments" v-if="record.attachments && record.attachments.length">
              <view 
                v-for="(attachment, idx) in record.attachments" 
                :key="idx"
                class="attachment-item"
                @tap="previewAttachment(attachment)"
              >
                <text class="attachment-icon">📎</text>
                <text class="attachment-name">{{ attachment.name }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 快速操作 -->
    <view class="quick-actions" v-if="currentComplaint">
      <view class="action-title">快速操作</view>
      <view class="action-grid">
        <view class="action-item" @tap="addComment">
          <view class="action-icon add">
            <text class="icon">💬</text>
          </view>
          <text class="action-text">添加评论</text>
        </view>
        <view class="action-item" @tap="uploadEvidence">
          <view class="action-icon upload">
            <text class="icon">📎</text>
          </view>
          <text class="action-text">上传证据</text>
        </view>
        <view class="action-item" @tap="escalateComplaint">
          <view class="action-icon escalate">
            <text class="icon">⬆️</text>
          </view>
          <text class="action-text">升级处理</text>
        </view>
        <view class="action-item" @tap="contactSupervisor">
          <view class="action-icon contact">
            <text class="icon">👤</text>
          </view>
          <text class="action-text">联系主管</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <text class="empty-icon">🔍</text>
      <text class="empty-title">请输入投诉编号进行查询</text>
      <text class="empty-desc">您可以在投诉管理页面查看您的投诉编号</text>
      <button class="btn-primary" @tap="goToComplaintList">查看投诉列表</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 页面参数
const complaintId = ref<string>('')

// 页面状态
const searchKeyword = ref<string>('')
const activeFilter = ref<string>('all')
const currentComplaint = ref<any>(null)

// 快速筛选
const quickFilters = ref([
  { label: '全部', value: 'all' },
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已解决', value: 'resolved' }
])

// 沟通记录
const communicationRecords = ref<any[]>([])

// 进度步骤
const progressSteps = computed(() => {
  if (!currentComplaint.value) return []
  
  const steps = [
    {
      title: '投诉提交',
      icon: '📝',
      completed: true,
      current: false,
      time: currentComplaint.value.createTime
    },
    {
      title: '审核受理',
      icon: '✅',
      completed: ['processing', 'resolved', 'closed'].includes(currentComplaint.value.status),
      current: currentComplaint.value.status === 'processing',
      time: currentComplaint.value.reviewTime,
      description: currentComplaint.value.reviewNote
    },
    {
      title: '调查处理',
      icon: '🔍',
      completed: ['resolved', 'closed'].includes(currentComplaint.value.status),
      current: false,
      time: currentComplaint.value.processingTime,
      description: currentComplaint.value.processingNote
    },
    {
      title: '结果反馈',
      icon: '📋',
      completed: currentComplaint.value.status === 'resolved',
      current: currentComplaint.value.status === 'resolved',
      time: currentComplaint.value.resolveTime,
      description: currentComplaint.value.resolution
    },
    {
      title: '投诉关闭',
      icon: '✅',
      completed: currentComplaint.value.status === 'closed',
      current: currentComplaint.value.status === 'closed',
      time: currentComplaint.value.closeTime
    }
  ]

  return steps.filter(step => step.completed || step.current)
})

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

// 获取优先级文本
const getPriorityText = (priority: string) => {
  const priorityMap: { [key: string]: string } = {
    'low': '低',
    'medium': '中',
    'high': '高',
    'urgent': '紧急'
  }
  return priorityMap[priority] || priority
}

// 格式化日期
const formatDate = (date: string) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 格式化日期时间
const formatDateTime = (date: string) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 搜索输入
const onSearchInput = (e: any) => {
  searchKeyword.value = e.detail.value
}

// 执行搜索
const performSearch = () => {
  if (!searchKeyword.value.trim()) {
    uni.showToast({
      title: '请输入投诉编号',
      icon: 'none'
    })
    return
  }
  
  fetchComplaintDetail(searchKeyword.value.trim())
}

// 设置筛选
const setFilter = (value: string) => {
  activeFilter.value = value
}

// 获取记录头像
const getRecordAvatar = (sender: string) => {
  const avatarMap: { [key: string]: string } = {
    'user': '/static/images/user-avatar.png',
    'handler': '/static/images/handler-avatar.png',
    'system': '/static/images/system-avatar.png'
  }
  return avatarMap[sender] || '/static/images/default-avatar.png'
}

// 获取记录发送者名称
const getRecordSenderName = (sender: string) => {
  const nameMap: { [key: string]: string } = {
    'user': '我',
    'handler': currentComplaint.value?.handler?.name || '客服',
    'system': '系统'
  }
  return nameMap[sender] || sender
}

// 联系处理人员
const callHandler = () => {
  if (currentComplaint.value?.handler?.phone) {
    uni.makePhoneCall({
      phoneNumber: currentComplaint.value.handler.phone
    })
  }
}

// 与处理人员聊天
const chatHandler = () => {
  uni.navigateTo({
    url: `/pages/chat/Chat?userId=${currentComplaint.value?.handler?.id}&userName=${currentComplaint.value?.handler?.name}`
  })
}

// 添加评论
const addComment = () => {
  uni.navigateTo({
    url: `/pages/after-sales/AddComment?complaintId=${currentComplaint.value?.id}`
  })
}

// 上传证据
const uploadEvidence = () => {
  uni.navigateTo({
    url: `/pages/after-sales/UploadEvidence?complaintId=${currentComplaint.value?.id}`
  })
}

// 升级投诉
const escalateComplaint = () => {
  uni.showModal({
    title: '确认升级',
    content: '升级投诉后将有更高级别的客服处理，是否确认？',
    success: (res) => {
      if (res.confirm) {
        escalateComplaintAction()
      }
    }
  })
}

// 执行升级投诉
const escalateComplaintAction = async () => {
  try {
    const db = uniCloud.database()
    await db.collection('complaints').doc(currentComplaint.value.id).update({
      status: 'escalated',
      priority: 'high',
      updateTime: new Date().toISOString()
    })
    
    uni.showToast({
      title: '升级成功',
      icon: 'success'
    })
    
    fetchComplaintDetail(currentComplaint.value.id)
  } catch (error) {
    uni.showToast({
      title: '升级失败',
      icon: 'error'
    })
  }
}

// 联系主管
const contactSupervisor = () => {
  uni.navigateTo({
    url: `/pages/after-sales/ContactSupervisor?complaintId=${currentComplaint.value?.id}`
  })
}

// 预览附件
const previewAttachment = (attachment: any) => {
  if (attachment.type.startsWith('image/')) {
    uni.previewImage({
      current: attachment.url,
      urls: [attachment.url]
    })
  } else {
    uni.downloadFile({
      url: attachment.url,
      success: (res) => {
        uni.openDocument({
          filePath: res.tempFilePath
        })
      }
    })
  }
}

// 前往投诉列表
const goToComplaintList = () => {
  uni.navigateTo({
    url: '/pages/after-sales/ComplaintManagement'
  })
}

// 获取投诉详情
const fetchComplaintDetail = async (id: string) => {
  try {
    const db = uniCloud.database()
    const res = await db.collection('complaints').doc(id).get()
    
    if (res.data) {
      currentComplaint.value = res.data
      fetchCommunicationRecords(id)
    } else {
      uni.showToast({
        title: '未找到投诉信息',
        icon: 'none'
      })
    }
  } catch (error) {
    // 使用模拟数据
    currentComplaint.value = {
      id: id,
      title: '产品质量问题投诉',
      description: '购买的耳机在使用一个月后出现杂音问题，严重影响使用体验，希望能够更换或维修。',
      status: 'processing',
      priority: 'medium',
      tags: ['产品质量', '耳机', '杂音'],
      createTime: '2024-01-15T10:30:00',
      updateTime: '2024-01-16T14:20:00',
      reviewTime: '2024-01-15T16:45:00',
      processingTime: '2024-01-16T09:30:00',
      reviewNote: '投诉已受理，安排技术人员进行检测',
      processingNote: '正在联系供应商确认维修方案',
      handler: {
        id: 'H001',
        name: '张三',
        role: '高级客服',
        phone: '400-123-4567',
        avatar: ''
      }
    }
    
    fetchCommunicationRecords(id)
  }
}

// 获取沟通记录
const fetchCommunicationRecords = async (complaintId: string) => {
  try {
    const db = uniCloud.database()
    const res = await db.collection('complaint_communications')
      .where({
        complaintId: complaintId
      })
      .orderBy('createTime', 'asc')
      .get()
    
    if (res.data && res.data.length > 0) {
      communicationRecords.value = res.data
    } else {
      // 使用模拟数据
      communicationRecords.value = [
        {
          id: 'C001',
          sender: 'user',
          message: '我购买的耳机有杂音问题，希望能解决',
          createTime: '2024-01-15T10:30:00',
          attachments: []
        },
        {
          id: 'C002',
          sender: 'system',
          message: '投诉已提交，编号：#C001',
          createTime: '2024-01-15T10:31:00',
          attachments: []
        },
        {
          id: 'C003',
          sender: 'handler',
          message: '您好，我是处理您投诉的客服张三，请问杂音是在什么情况下出现的？',
          createTime: '2024-01-15T16:45:00',
          attachments: []
        },
        {
          id: 'C004',
          sender: 'user',
          message: '主要是在听音乐时，尤其是低音部分会出现明显的杂音',
          createTime: '2024-01-16T08:20:00',
          attachments: []
        }
      ]
    }
  } catch (error) {
    console.error('获取沟通记录失败:', error)
  }
}

onLoad((options: any) => {
  complaintId.value = options.id || ''
  if (complaintId.value) {
    searchKeyword.value = complaintId.value
    fetchComplaintDetail(complaintId.value)
  }
})
</script>

<style scoped>
.complaint-tracker {
  min-height: 100vh;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  font-family: 'Source Han Sans SC', -system-ui, sans-serif;
}

.header-container {
  position: relative;
  height: 200rpx;
  overflow: hidden;
}

.header-pattern {
  position: absolute;
  top: -80rpx;
  right: -200rpx;
  width: 500rpx;
  height: 500rpx;
  background: linear-gradient(135deg, #DC2626 0%, #ef4444 100%);
  border-radius: 50%;
  transform: rotate(20deg);
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

.search-section {
  padding: 30rpx;
  margin-top: -40rpx;
  position: relative;
  z-index: 3;
}

.search-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.search-input {
  flex: 1;
  height: 88rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 0 32rpx;
  font-size: 28rpx;
  color: #1f2937;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.search-button {
  width: 88rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #DC2626 0%, #ef4444 100%);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(220, 38, 38, 0.3);
}

.search-icon {
  font-size: 40rpx;
}

.filter-chips {
  display: flex;
  gap: 16rpx;
  overflow-x: auto;
}

.filter-chip {
  padding: 20rpx 32rpx;
  background: #ffffff;
  border-radius: 50rpx;
  border: 2rpx solid #fecaca;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.chip-active {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-color: #DC2626;
}

.chip-text {
  font-size: 26rpx;
  color: #64748b;
  font-weight: 500;
}

.chip-active .chip-text {
  color: #DC2626;
}

.complaint-detail {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin: 0 30rpx 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.08);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24rpx;
}

.complaint-brief {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.complaint-id {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
}

.complaint-status {
  font-size: 24rpx;
  font-weight: 600;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  align-self: flex-start;
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

.priority-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.priority-label {
  font-size: 24rpx;
  color: #6b7280;
}

.priority-value {
  font-size: 24rpx;
  font-weight: 600;
}

.priority-low {
  color: #059669;
}

.priority-medium {
  color: #d97706;
}

.priority-high {
  color: #dc2626;
}

.priority-urgent {
  color: #7c3aed;
}

.complaint-content {
  margin-bottom: 32rpx;
}

.complaint-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16rpx;
  display: block;
}

.complaint-description {
  font-size: 28rpx;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 20rpx;
  display: block;
}

.complaint-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.meta-tag {
  font-size: 22rpx;
  color: #dc2626;
  background: #fee2e2;
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
}

.progress-timeline {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin: 0 30rpx 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.08);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.timeline-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
}

.last-update {
  font-size: 24rpx;
  color: #6b7280;
}

.timeline-container {
  position: relative;
}

.timeline-item {
  display: flex;
  gap: 24rpx;
  margin-bottom: 40rpx;
  position: relative;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 36rpx;
  top: 72rpx;
  width: 2rpx;
  height: calc(100% + 20rpx);
  background: #e5e7eb;
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-dot {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  position: relative;
  z-index: 2;
}

.step-completed .timeline-dot {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  box-shadow: 0 0 0 8rpx rgba(5, 150, 105, 0.1);
}

.step-current .timeline-dot {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  box-shadow: 0 0 0 8rpx rgba(37, 99, 235, 0.1);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 8rpx rgba(37, 99, 235, 0.1);
  }
  50% {
    box-shadow: 0 0 0 16rpx rgba(37, 99, 235, 0.2);
  }
  100% {
    box-shadow: 0 0 0 8rpx rgba(37, 99, 235, 0.1);
  }
}

.dot-icon {
  font-size: 32rpx;
}

.timeline-content {
  flex: 1;
  padding-top: 8rpx;
}

.step-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8rpx;
  display: block;
}

.step-time {
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
  display: block;
}

.step-description {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.5;
  display: block;
}

.handler-info {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin: 0 30rpx 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.08);
}

.info-header {
  margin-bottom: 24rpx;
}

.info-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
}

.handler-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.handler-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  background: #f3f4f6;
}

.handler-details {
  flex: 1;
}

.handler-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8rpx;
  display: block;
}

.handler-role {
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
  display: block;
}

.handler-contact {
  font-size: 24rpx;
  color: #3b82f6;
  display: block;
}

.contact-actions {
  display: flex;
  gap: 16rpx;
}

.contact-btn {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.btn-icon {
  font-size: 36rpx;
}

.communication-history {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin: 0 30rpx 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.08);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.history-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
}

.history-count {
  font-size: 24rpx;
  color: #6b7280;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.record-item {
  display: flex;
  gap: 20rpx;
}

.record-user {
  flex-direction: row-reverse;
}

.record-system {
  justify-content: center;
}

.record-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.record-content {
  flex: 1;
  max-width: 80%;
}

.record-user .record-content {
  text-align: right;
}

.record-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.record-user .record-meta {
  justify-content: flex-end;
}

.record-sender {
  font-size: 22rpx;
  color: #6b7280;
  font-weight: 500;
}

.record-time {
  font-size: 20rpx;
  color: #9ca3af;
}

.record-message {
  font-size: 26rpx;
  color: #1f2937;
  line-height: 1.6;
  background: #f9fafb;
  padding: 20rpx;
  border-radius: 16rpx;
  margin-bottom: 12rpx;
  display: block;
}

.record-user .record-message {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.record-system .record-message {
  background: #fef3c7;
  text-align: center;
}

.record-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 16rpx;
  background: #f3f4f6;
  border-radius: 12rpx;
  transition: all 0.3s ease;
}

.attachment-item:active {
  transform: scale(0.95);
  background: #e5e7eb;
}

.attachment-icon {
  font-size: 24rpx;
}

.attachment-name {
  font-size: 22rpx;
  color: #1f2937;
}

.quick-actions {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin: 0 30rpx 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.08);
}

.action-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 32rpx;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 30rpx 20rpx;
  background: #f9fafb;
  border-radius: 20rpx;
  transition: all 0.3s ease;
}

.action-item:active {
  transform: translateY(-6rpx);
  box-shadow: 0 12rpx 24rpx rgba(0, 0, 0, 0.1);
}

.action-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon.add {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.action-icon.upload {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.action-icon.escalate {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.action-icon.contact {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.icon {
  font-size: 40rpx;
}

.action-text {
  font-size: 24rpx;
  color: #1f2937;
  font-weight: 500;
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

.empty-title {
  font-size: 32rpx;
  color: #1f2937;
  font-weight: 600;
  margin-bottom: 16rpx;
  display: block;
}

.empty-desc {
  font-size: 26rpx;
  color: #6b7280;
  margin-bottom: 40rpx;
  display: block;
  line-height: 1.6;
}

.btn-primary {
  background: linear-gradient(135deg, #DC2626 0%, #ef4444 100%);
  color: #ffffff;
  border: none;
  border-radius: 24rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  font-weight: 500;
}
</style>