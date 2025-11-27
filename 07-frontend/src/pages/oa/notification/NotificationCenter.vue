<template>
  <div class="notification-center">
    <!-- 工业风格头部区域 -->
    <header class="center-header">
      <div class="header-left">
        <div class="title-section">
          <h1 class="page-title">通知中心</h1>
          <div class="breadcrumb">
            <span class="breadcrumb-item">OA系统</span>
            <i class="fas fa-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-item active">通知中心</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="notification-stats">
          <div class="stat-item unread">
            <span class="stat-value">{{ unreadCount }}</span>
            <span class="stat-label">未读</span>
          </div>
          <div class="stat-item total">
            <span class="stat-value">{{ totalCount }}</span>
            <span class="stat-label">总计</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn secondary" @click="markAllAsRead">
            <i class="fas fa-check-double"></i>
            <span>全部已读</span>
          </button>
          <button class="action-btn primary" @click="handleSettings">
            <i class="fas fa-cog"></i>
            <span>通知设置</span>
          </button>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="center-main">
      <!-- 筛选和操作区域 -->
      <section class="filter-section">
        <div class="filter-container">
          <div class="filter-left">
            <div class="search-box">
              <i class="fas fa-search search-icon"></i>
              <input 
                v-model="searchKeyword" 
                type="text" 
                placeholder="搜索通知内容、发送者..."
                class="search-input"
              />
            </div>
            
            <div class="filter-group">
              <label class="filter-label">通知类型</label>
              <select v-model="typeFilter" class="filter-select">
                <option value="">全部类型</option>
                <option value="system">系统通知</option>
                <option value="approval">审批通知</option>
                <option value="task">任务通知</option>
                <option value="document">文档通知</option>
                <option value="reminder">提醒通知</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label class="filter-label">时间范围</label>
              <select v-model="timeFilter" class="filter-select">
                <option value="">全部时间</option>
                <option value="today">今天</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
              </select>
            </div>
          </div>
          
          <div class="filter-right">
            <button class="action-btn secondary" @click="refreshNotifications">
              <i class="fas fa-sync-alt"></i>
              <span>刷新</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 通知标签页 -->
      <section class="notification-tabs">
        <div class="tab-navigation">
          <button 
            v-for="tab in tabs" 
            :key="tab.key"
            class="tab-btn"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <i :class="tab.icon"></i>
            <span>{{ tab.label }}</span>
            <span v-if="tab.key === 'unread'" class="tab-badge">{{ getTabCount(tab.key) }}</span>
          </button>
        </div>
        
        <!-- 快捷操作 -->
        <div class="quick-actions" v-if="selectedNotifications.length > 0">
          <div class="selection-info">
            <span>已选择 {{ selectedNotifications.length }} 条通知</span>
          </div>
          <div class="action-buttons">
            <button class="action-btn small" @click="markSelectedAsRead">
              <i class="fas fa-check"></i>
              <span>标记已读</span>
            </button>
            <button class="action-btn small danger" @click="deleteSelected">
              <i class="fas fa-trash"></i>
              <span>删除</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 通知列表 -->
      <section class="notification-list-section">
        <div class="list-container">
          <div v-if="filteredNotifications.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-bell-slash"></i>
            </div>
            <h4>{{ getEmptyMessage() }}</h4>
            <p>{{ getEmptyDescription() }}</p>
          </div>
          
          <div v-else class="notification-list">
            <div 
              v-for="notification in filteredNotifications" 
              :key="notification.id"
              class="notification-item"
              :class="{ 
                'unread': !notification.read,
                'selected': selectedNotifications.includes(notification.id)
              }"
              @click="selectNotification(notification)"
            >
              <div class="notification-header">
                <div class="notification-type">
                  <i :class="getNotificationIcon(notification.type)"></i>
                  <span>{{ getNotificationTypeLabel(notification.type) }}</span>
                </div>
                <div class="notification-time">
                  <i class="fas fa-clock"></i>
                  <span>{{ formatTime(notification.createTime) }}</span>
                </div>
              </div>
              
              <div class="notification-content">
                <div class="notification-title">
                  <input 
                    type="checkbox" 
                    :id="`select-${notification.id}`"
                    v-model="selectedNotifications"
                    :value="notification.id"
                    class="notification-checkbox"
                    @click.stop
                  />
                  <label :for="`select-${notification.id}`" class="checkbox-label"></label>
                  
                  <h4>{{ notification.title }}</h4>
                  <div v-if="!notification.read" class="unread-indicator"></div>
                </div>
                
                <p class="notification-description">{{ notification.content }}</p>
                
                <div v-if="notification.attachments && notification.attachments.length > 0" class="notification-attachments">
                  <div class="attachment-preview">
                    <i class="fas fa-paperclip"></i>
                    <span>{{ notification.attachments.length }} 个附件</span>
                  </div>
                </div>
              </div>
              
              <div class="notification-footer">
                <div class="notification-sender">
                  <div class="sender-avatar">
                    <img v-if="notification.senderAvatar" :src="notification.senderAvatar" :alt="notification.senderName" />
                    <div v-else class="avatar-placeholder">
                      <i class="fas fa-user"></i>
                    </div>
                  </div>
                  <div class="sender-info">
                    <span class="sender-name">{{ notification.senderName }}</span>
                    <span class="sender-role">{{ notification.senderRole }}</span>
                  </div>
                </div>
                
                <div class="notification-actions">
                  <button 
                    v-if="!notification.read" 
                    class="action-btn small primary" 
                    @click.stop="markAsRead(notification)"
                  >
                    <i class="fas fa-check"></i>
                    <span>标记已读</span>
                  </button>
                  <button 
                    class="action-btn small info" 
                    @click.stop="viewNotification(notification)"
                  >
                    <i class="fas fa-eye"></i>
                    <span>查看详情</span>
                  </button>
                  <button 
                    v-if="notification.actionUrl" 
                    class="action-btn small secondary" 
                    @click.stop="handleAction(notification)"
                  >
                    <i class="fas fa-external-link-alt"></i>
                    <span>处理</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 分页 -->
          <div class="pagination">
            <button 
              class="page-btn" 
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            
            <div class="page-numbers">
              <button 
                v-for="page in visiblePages" 
                :key="page"
                class="page-btn"
                :class="{ active: page === currentPage }"
                @click="currentPage = page"
              >
                {{ page }}
              </button>
            </div>
            
            <button 
              class="page-btn"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- 通知详情弹窗 -->
    <div v-if="selectedNotificationDetail" class="modal-overlay" @click="closeNotificationDetail">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">通知详情</h3>
          <button class="modal-close" @click="closeNotificationDetail">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="detail-header">
            <div class="detail-type">
              <i :class="getNotificationIcon(selectedNotificationDetail.type)"></i>
              <span>{{ getNotificationTypeLabel(selectedNotificationDetail.type) }}</span>
            </div>
            <div class="detail-time">
              <i class="fas fa-clock"></i>
              <span>{{ formatTime(selectedNotificationDetail.createTime) }}</span>
            </div>
          </div>
          
          <div class="detail-content">
            <h2 class="detail-title">{{ selectedNotificationDetail.title }}</h2>
            <div class="detail-description" v-html="selectedNotificationDetail.content"></div>
            
            <div v-if="selectedNotificationDetail.attachments" class="detail-attachments">
              <h4>附件</h4>
              <div class="attachment-list">
                <div 
                  v-for="attachment in selectedNotificationDetail.attachments" 
                  :key="attachment.id"
                  class="attachment-item"
                >
                  <div class="attachment-icon">
                    <i :class="getFileIcon(attachment.type)"></i>
                  </div>
                  <div class="attachment-info">
                    <div class="attachment-name">{{ attachment.name }}</div>
                    <div class="attachment-size">{{ formatFileSize(attachment.size) }}</div>
                  </div>
                  <button class="download-btn" @click="downloadAttachment(attachment)">
                    <i class="fas fa-download"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="detail-footer">
            <div class="sender-detail">
              <div class="sender-avatar">
                <img v-if="selectedNotificationDetail.senderAvatar" :src="selectedNotificationDetail.senderAvatar" :alt="selectedNotificationDetail.senderName" />
                <div v-else class="avatar-placeholder">
                  <i class="fas fa-user"></i>
                </div>
              </div>
              <div class="sender-info">
                <div class="sender-name">{{ selectedNotificationDetail.senderName }}</div>
                <div class="sender-role">{{ selectedNotificationDetail.senderRole }}</div>
              </div>
            </div>
            
            <div class="detail-actions">
              <button v-if="!selectedNotificationDetail.read" class="action-btn primary" @click="markAsRead(selectedNotificationDetail)">
                <i class="fas fa-check"></i>
                <span>标记已读</span>
              </button>
              <button v-if="selectedNotificationDetail.actionUrl" class="action-btn secondary" @click="handleAction(selectedNotificationDetail)">
                <i class="fas fa-external-link-alt"></i>
                <span>处理通知</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 响应式数据
const notifications = ref([])
const selectedNotifications = ref([])
const selectedNotificationDetail = ref(null)
const activeTab = ref('all')
const searchKeyword = ref('')
const typeFilter = ref('')
const timeFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 标签页配置
const tabs = [
  { key: 'all', label: '全部通知', icon: 'fas fa-inbox' },
  { key: 'unread', label: '未读通知', icon: 'fas fa-envelope' },
  { key: 'read', label: '已读通知', icon: 'fas fa-envelope-open' }
]

// 计算属性
const unreadNotifications = computed(() => 
  notifications.value.filter(n => !n.read)
)

const readNotifications = computed(() => 
  notifications.value.filter(n => n.read)
)

const filteredNotifications = computed(() => {
  let filtered = activeTab.value === 'all' ? notifications.value :
                 activeTab.value === 'unread' ? unreadNotifications.value :
                 readNotifications.value

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(notification => 
      notification.title.toLowerCase().includes(keyword) ||
      notification.content.toLowerCase().includes(keyword) ||
      notification.senderName.toLowerCase().includes(keyword)
    )
  }

  // 类型过滤
  if (typeFilter.value) {
    filtered = filtered.filter(notification => notification.type === typeFilter.value)
  }

  // 时间过滤
  if (timeFilter.value) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    filtered = filtered.filter(notification => {
      const createTime = new Date(notification.createTime)
      
      switch (timeFilter.value) {
        case 'today':
          return createTime >= today
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          return createTime >= weekAgo
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          return createTime >= monthAgo
        default:
          return true
      }
    })
  }

  return filtered
})

// 统计数据
const unreadCount = computed(() => unreadNotifications.value.length)
const totalCount = computed(() => notifications.value.length)

// 分页计算
const totalPages = computed(() => 
  Math.ceil(filteredNotifications.value.length / pageSize.value)
)

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const delta = 2
  
  const range = []
  const rangeWithDots = []
  
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i)
  }
  
  if (current - delta > 2) {
    rangeWithDots.push(1, '...')
  } else {
    rangeWithDots.push(1)
  }
  
  rangeWithDots.push(...range)
  
  if (current + delta < total - 1) {
    rangeWithDots.push('...', total)
  } else {
    rangeWithDots.push(total)
  }
  
  return rangeWithDots.filter((item, index, arr) => arr.indexOf(item) === index)
})

// 工具函数
const getNotificationIcon = (type) => {
  const icons = {
    system: 'fas fa-cog',
    approval: 'fas fa-user-check',
    task: 'fas fa-tasks',
    document: 'fas fa-file-alt',
    reminder: 'fas fa-bell'
  }
  return icons[type] || 'fas fa-info-circle'
}

const getNotificationTypeLabel = (type) => {
  const labels = {
    system: '系统通知',
    approval: '审批通知',
    task: '任务通知',
    document: '文档通知',
    reminder: '提醒通知'
  }
  return labels[type] || '未知通知'
}

const getFileIcon = (fileType) => {
  const icons = {
    pdf: 'fas fa-file-pdf',
    doc: 'fas fa-file-word',
    docx: 'fas fa-file-word',
    xls: 'fas fa-file-excel',
    xlsx: 'fas fa-file-excel',
    ppt: 'fas fa-file-powerpoint',
    pptx: 'fas fa-file-powerpoint',
    zip: 'fas fa-file-archive',
    rar: 'fas fa-file-archive'
  }
  return icons[fileType] || 'fas fa-file'
}

const getTabCount = (tabKey) => {
  switch (tabKey) {
    case 'all':
      return notifications.value.length
    case 'unread':
      return unreadNotifications.value.length
    case 'read':
      return readNotifications.value.length
    default:
      return 0
  }
}

const getEmptyMessage = () => {
  if (searchKeyword.value) return '未找到匹配的通知'
  if (typeFilter.value) return '该类型下暂无通知'
  if (timeFilter.value) return '该时间段内暂无通知'
  
  switch (activeTab.value) {
    case 'unread':
      return '暂无未读通知'
    case 'read':
      return '暂无已读通知'
    default:
      return '暂无通知'
  }
}

const getEmptyDescription = () => {
  if (searchKeyword.value) return '请尝试其他搜索关键词'
  if (activeTab.value === 'unread') return '所有通知都已被阅读'
  return '系统将及时推送新的通知'
}

const formatTime = (timeString) => {
  const date = new Date(timeString)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatFileSize = (bytes) => {
  if (!bytes) return '未知'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 事件处理
const selectNotification = (notification) => {
  const index = selectedNotifications.value.indexOf(notification.id)
  if (index > -1) {
    selectedNotifications.value.splice(index, 1)
  } else {
    selectedNotifications.value.push(notification.id)
  }
}

const markAsRead = (notification) => {
  notification.read = true
  console.log('标记已读:', notification)
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
  console.log('全部标记已读')
}

const markSelectedAsRead = () => {
  selectedNotifications.value.forEach(id => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) notification.read = true
  })
  selectedNotifications.value = []
}

const deleteSelected = () => {
  if (confirm(`确定要删除选中的 ${selectedNotifications.value.length} 条通知吗？`)) {
    selectedNotifications.value.forEach(id => {
      const index = notifications.value.findIndex(n => n.id === id)
      if (index > -1) {
        notifications.value.splice(index, 1)
      }
    })
    selectedNotifications.value = []
    console.log('删除选中的通知')
  }
}

const viewNotification = (notification) => {
  selectedNotificationDetail.value = notification
  if (!notification.read) {
    markAsRead(notification)
  }
}

const closeNotificationDetail = () => {
  selectedNotificationDetail.value = null
}

const handleAction = (notification) => {
  if (notification.actionUrl) {
    console.log('处理通知:', notification)
    // 这里可以跳转到相应的处理页面
  }
}

const handleSettings = () => {
  console.log('打开通知设置')
  // 这里可以跳转到通知设置页面
}

const refreshNotifications = () => {
  loadNotifications()
}

const downloadAttachment = (attachment) => {
  console.log('下载附件:', attachment)
  // 这里实现附件下载功能
}

// 加载通知数据
const loadNotifications = async () => {
  // 模拟数据
  notifications.value = [
    {
      id: 1,
      type: 'system',
      title: '系统维护通知',
      content: '尊敬的用户，系统将于今晚22:00-24:00进行维护升级，期间将暂停服务，请提前做好准备。',
      read: false,
      createTime: '2024-01-15 10:30:00',
      senderName: '系统管理员',
      senderRole: '系统',
      senderAvatar: '',
      actionUrl: '/system/maintenance'
    },
    {
      id: 2,
      type: 'approval',
      title: '新的审批任务',
      content: '您有一个采购申请需要审批，申请金额5000元，请及时处理。',
      read: false,
      createTime: '2024-01-15 09:15:00',
      senderName: '张三',
      senderRole: '采购部',
      senderAvatar: '',
      actionUrl: '/workflow/approval/123'
    },
    {
      id: 3,
      type: 'task',
      title: '任务分配通知',
      content: '您被分配了一个新任务：完成月度工作报告，截止时间本月20日。',
      read: true,
      createTime: '2024-01-14 14:20:00',
      senderName: '李四',
      senderRole: '部门经理',
      senderAvatar: '',
      actionUrl: '/tasks/456'
    },
    {
      id: 4,
      type: 'document',
      title: '文档分享',
      content: '王五向您分享了文档《项目计划书》，请查收。',
      read: true,
      createTime: '2024-01-14 11:45:00',
      senderName: '王五',
      senderRole: '项目管理部',
      senderAvatar: '',
      attachments: [
        { id: 1, name: '项目计划书.pdf', type: 'pdf', size: 2048576 }
      ],
      actionUrl: '/documents/shared/789'
    },
    {
      id: 5,
      type: 'reminder',
      title: '会议提醒',
      content: '明天下午2点有部门例会，请准时参加。',
      read: false,
      createTime: '2024-01-13 16:30:00',
      senderName: '赵六',
      senderRole: '人事部',
      senderAvatar: '',
      actionUrl: '/calendar/meeting/101'
    }
  ]
}

// 生命周期
onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600&display=swap');

/* CSS变量定义 */
:root {
  --primary-color: #2C3E50;
  --secondary-color: #34495E;
  --accent-color: #E67E22;
  --background-color: #ECF0F1;
  --text-color: #2C3E50;
  --border-color: #BDC3C7;
  --success-color: #27AE60;
  --warning-color: #F39C12;
  --danger-color: #E74C3C;
}

/* 基础样式 */
* {
  box-sizing: border-box;
}

.notification-center {
  font-family: 'Source Sans Pro', sans-serif;
  background: var(--background-color);
  min-height: 100vh;
  color: var(--text-color);
}

/* 头部样式 */
.center-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
}

.center-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent-color);
}

.page-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.breadcrumb {
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.9;
}

.breadcrumb-item {
  color: rgba(255, 255, 255, 0.8);
}

.breadcrumb-item.active {
  color: white;
  font-weight: 600;
}

.breadcrumb-separator {
  margin: 0 0.5rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.notification-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-family: 'Montserrat', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  font-weight: 600;
  opacity: 0.9;
}

.stat-item.unread .stat-value {
  color: #E74C3C;
}

.stat-item.total .stat-value {
  color: #3498DB;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-btn.primary {
  background: var(--accent-color);
  color: white;
}

.action-btn.primary:hover {
  background: #D35400;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.4);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.action-btn.small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.action-btn.danger {
  background: var(--danger-color);
  color: white;
}

.action-btn.info {
  background: #3498DB;
  color: white;
}

/* 主内容区域 */
.center-main {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* 筛选区域 */
.filter-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.filter-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-left {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #7F8C8D;
  z-index: 10;
}

.search-input {
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.875rem;
  width: 300px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--secondary-color);
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.875rem;
  min-width: 150px;
  transition: border-color 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

/* 通知标签页 */
.notification-tabs {
  background: white;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tab-navigation {
  display: flex;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 2px solid var(--border-color);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  color: var(--secondary-color);
  position: relative;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.5);
}

.tab-btn.active {
  background: white;
  color: var(--accent-color);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent-color);
}

.tab-badge {
  background: var(--danger-color);
  color: white;
  border-radius: 12px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.quick-actions {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selection-info {
  font-size: 0.875rem;
  color: var(--secondary-color);
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

/* 通知列表 */
.notification-list-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.list-container {
  display: flex;
  flex-direction: column;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--border-color);
  margin-bottom: 1rem;
}

.empty-state h4 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #7F8C8D;
  margin: 0;
  font-size: 0.875rem;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-item {
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
  background: white;
}

.notification-item:hover {
  border-color: var(--accent-color);
  box-shadow: 0 4px 15px rgba(230, 126, 34, 0.15);
  transform: translateY(-2px);
}

.notification-item.unread {
  border-left: 6px solid var(--accent-color);
  background: rgba(230, 126, 34, 0.02);
}

.notification-item.selected {
  border-color: #3498DB;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.notification-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--secondary-color);
  font-weight: 600;
}

.notification-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #7F8C8D;
}

.notification-content {
  margin-bottom: 1rem;
}

.notification-title {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  position: relative;
}

.notification-checkbox {
  display: none;
}

.checkbox-label {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-checkbox:checked + .checkbox-label {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

.notification-checkbox:checked + .checkbox-label::after {
  content: '\f00c';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  color: white;
  font-size: 0.75rem;
}

.notification-item.selected .checkbox-label {
  background: #3498DB;
  border-color: #3498DB;
}

.notification-item.selected .checkbox-label::after {
  content: '\f00c';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  color: white;
  font-size: 0.75rem;
}

.notification-title h4 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.4;
  flex: 1;
}

.unread-indicator {
  width: 8px;
  height: 8px;
  background: var(--accent-color);
  border-radius: 50%;
  margin-left: 0.5rem;
  flex-shrink: 0;
  margin-top: 6px;
}

.notification-description {
  color: #7F8C8D;
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0 0 0.75rem 0;
}

.notification-attachments {
  margin-top: 0.75rem;
}

.attachment-preview {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f8f9fa;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--secondary-color);
}

.notification-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.notification-sender {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sender-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.sender-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.875rem;
}

.sender-info {
  display: flex;
  flex-direction: column;
}

.sender-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-color);
}

.sender-role {
  font-size: 0.75rem;
  color: #7F8C8D;
}

.notification-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid var(--border-color);
}

.page-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-weight: 600;
}

.page-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.page-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 2px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  background: #f8f9fa;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--danger-color);
  color: white;
}

.modal-body {
  padding: 1.5rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-color);
}

.detail-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--secondary-color);
  font-weight: 600;
}

.detail-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #7F8C8D;
}

.detail-content {
  margin-bottom: 2rem;
}

.detail-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.detail-description {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--text-color);
  margin-bottom: 1.5rem;
}

.detail-attachments {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.detail-attachments h4 {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 1rem 0;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.attachment-item:hover {
  border-color: var(--accent-color);
  box-shadow: 0 2px 8px rgba(230, 126, 34, 0.1);
}

.attachment-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  color: white;
  border-radius: 6px;
  font-size: 1rem;
}

.attachment-info {
  flex: 1;
}

.attachment-name {
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.attachment-size {
  font-size: 0.75rem;
  color: #7F8C8D;
}

.download-btn {
  padding: 0.5rem;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.download-btn:hover {
  background: #D35400;
}

.detail-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border-color);
}

.sender-detail {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.detail-actions {
  display: flex;
  gap: 0.75rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .center-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .center-main {
    padding: 1rem;
  }
  
  .filter-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-left {
    flex-direction: column;
    gap: 1rem;
  }
  
  .search-input {
    width: 100%;
  }
  
  .notification-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .modal-content {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }
  
  .detail-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
}
</style>