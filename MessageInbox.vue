<template>
  <div class="message-inbox">
    <!-- 工业风格头部区域 -->
    <header class="inbox-header">
      <div class="header-left">
        <div class="title-section">
          <h1 class="page-title">消息收件箱</h1>
          <div class="breadcrumb">
            <span class="breadcrumb-item">OA系统</span>
            <i class="fas fa-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-item">通知中心</span>
            <i class="fas fa-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-item active">消息收件箱</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="inbox-stats">
          <div class="stat-item unread">
            <span class="stat-value">{{ unreadCount }}</span>
            <span class="stat-label">未读</span>
          </div>
          <div class="stat-item important">
            <span class="stat-value">{{ importantCount }}</span>
            <span class="stat-label">重要</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn secondary" @click="handleCompose">
            <i class="fas fa-pen"></i>
            <span>撰写</span>
          </button>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="inbox-main">
      <div class="inbox-container">
        <!-- 消息列表 -->
        <section class="message-list-section">
          <div class="list-header">
            <h3 class="list-title">消息列表</h3>
            <div class="list-actions">
              <button class="action-btn small secondary" @click="markAllAsRead">
                <i class="fas fa-check-double"></i>
                <span>全部已读</span>
              </button>
              <button class="action-btn small danger" @click="deleteSelected" v-if="selectedMessages.length > 0">
                <i class="fas fa-trash"></i>
                <span>删除 ({{ selectedMessages.length }})</span>
              </button>
            </div>
          </div>

          <!-- 筛选和搜索 -->
          <div class="filter-section">
            <div class="filter-left">
              <div class="search-box">
                <i class="fas fa-search search-icon"></i>
                <input 
                  v-model="searchKeyword" 
                  type="text" 
                  placeholder="搜索消息内容、发件人..."
                  class="search-input"
                />
              </div>
              
              <div class="filter-group">
                <select v-model="typeFilter" class="filter-select">
                  <option value="">全部类型</option>
                  <option value="personal">个人消息</option>
                  <option value="system">系统消息</option>
                  <option value="group">群组消息</option>
                  <option value="broadcast">公告消息</option>
                </select>
              </div>
              
              <div class="filter-group">
                <select v-model="priorityFilter" class="filter-select">
                  <option value="">全部优先级</option>
                  <option value="urgent">紧急</option>
                  <option value="high">高</option>
                  <option value="normal">普通</option>
                </select>
              </div>
            </div>
            
            <div class="filter-right">
              <button class="action-btn small secondary" @click="refreshMessages">
                <i class="fas fa-sync-alt"></i>
                <span>刷新</span>
              </button>
            </div>
          </div>

          <!-- 消息列表 -->
          <div class="message-list">
            <div v-if="filteredMessages.length === 0" class="empty-state">
              <div class="empty-icon">
                <i class="fas fa-inbox"></i>
              </div>
              <h4>{{ getEmptyMessage() }}</h4>
              <p>{{ getEmptyDescription() }}</p>
            </div>

            <div 
              v-for="message in filteredMessages" 
              :key="message.id"
              class="message-item"
              :class="{ 
                'unread': !message.read,
                'important': message.priority === 'urgent',
                'selected': selectedMessages.includes(message.id)
              }"
              @click="selectMessage(message)"
            >
              <div class="message-checkbox">
                <input 
                  type="checkbox" 
                  :id="`select-${message.id}`"
                  v-model="selectedMessages"
                  :value="message.id"
                  class="message-checkbox-input"
                  @click.stop
                />
                <label :for="`select-${message.id}`" class="checkbox-label"></label>
              </div>

              <div class="message-avatar">
                <img v-if="message.senderAvatar" :src="message.senderAvatar" :alt="message.senderName" />
                <div v-else class="avatar-placeholder" :class="`avatar-${message.type}`">
                  <i :class="getMessageAvatarIcon(message.type)"></i>
                </div>
              </div>

              <div class="message-content">
                <div class="message-header">
                  <div class="message-info">
                    <div class="sender-name">{{ message.senderName }}</div>
                    <div class="message-type">
                      <span class="type-badge" :class="`type-${message.type}`">
                        {{ getMessageTypeLabel(message.type) }}
                      </span>
                      <span v-if="message.priority === 'urgent'" class="priority-badge urgent">
                        <i class="fas fa-exclamation-triangle"></i>
                        紧急
                      </span>
                    </div>
                  </div>
                  <div class="message-time">
                    <i class="fas fa-clock"></i>
                    <span>{{ formatTime(message.createTime) }}</span>
                  </div>
                </div>

                <div class="message-title">
                  <h4>{{ message.title }}</h4>
                  <div v-if="!message.read" class="unread-indicator"></div>
                </div>

                <div class="message-preview">
                  <p>{{ message.content.substring(0, 100) }}{{ message.content.length > 100 ? '...' : '' }}</p>
                  
                  <div v-if="message.attachments && message.attachments.length > 0" class="attachment-preview">
                    <i class="fas fa-paperclip"></i>
                    <span>{{ message.attachments.length }} 个附件</span>
                  </div>
                </div>
              </div>

              <div class="message-actions">
                <button 
                  v-if="!message.read" 
                  class="action-btn small primary" 
                  @click.stop="markAsRead(message)"
                >
                  <i class="fas fa-envelope-open"></i>
                </button>
                <button 
                  v-if="message.priority !== 'urgent'" 
                  class="action-btn small warning" 
                  @click.stop="markAsImportant(message)"
                >
                  <i class="fas fa-star"></i>
                </button>
                <button 
                  class="action-btn small info" 
                  @click.stop="viewMessage(message)"
                >
                  <i class="fas fa-eye"></i>
                </button>
                <button 
                  class="action-btn small danger" 
                  @click.stop="deleteMessage(message)"
                >
                  <i class="fas fa-trash"></i>
                </button>
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
        </section>

        <!-- 消息详情 -->
        <section v-if="selectedMessageDetail" class="message-detail-section">
          <div class="detail-header">
            <h3 class="detail-title">消息详情</h3>
            <button class="close-btn" @click="closeMessageDetail">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="detail-content">
            <!-- 发件人信息 -->
            <div class="sender-detail">
              <div class="sender-avatar">
                <img v-if="selectedMessageDetail.senderAvatar" :src="selectedMessageDetail.senderAvatar" :alt="selectedMessageDetail.senderName" />
                <div v-else class="avatar-placeholder" :class="`avatar-${selectedMessageDetail.type}`">
                  <i :class="getMessageAvatarIcon(selectedMessageDetail.type)"></i>
                </div>
              </div>
              <div class="sender-info">
                <div class="sender-name">{{ selectedMessageDetail.senderName }}</div>
                <div class="sender-role">{{ selectedMessageDetail.senderRole }}</div>
                <div class="message-type">
                  <span class="type-badge" :class="`type-${selectedMessageDetail.type}`">
                    {{ getMessageTypeLabel(selectedMessageDetail.type) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 消息标题和时间 -->
            <div class="message-header-detail">
              <h2 class="message-title-detail">{{ selectedMessageDetail.title }}</h2>
              <div class="message-meta">
                <div class="time-info">
                  <i class="fas fa-clock"></i>
                  <span>{{ formatFullTime(selectedMessageDetail.createTime) }}</span>
                </div>
                <div v-if="selectedMessageDetail.priority === 'urgent'" class="priority-info urgent">
                  <i class="fas fa-exclamation-triangle"></i>
                  <span>紧急消息</span>
                </div>
              </div>
            </div>

            <!-- 消息内容 -->
            <div class="message-body">
              <div class="message-content-detail" v-html="selectedMessageDetail.content"></div>
            </div>

            <!-- 附件 -->
            <div v-if="selectedMessageDetail.attachments && selectedMessageDetail.attachments.length > 0" class="message-attachments">
              <h4 class="attachments-title">附件</h4>
              <div class="attachment-list">
                <div 
                  v-for="attachment in selectedMessageDetail.attachments" 
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
                  <div class="attachment-actions">
                    <button class="action-btn small info" @click="downloadAttachment(attachment)">
                      <i class="fas fa-download"></i>
                    </button>
                    <button class="action-btn small secondary" @click="previewAttachment(attachment)">
                      <i class="fas fa-eye"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="message-actions-detail">
              <button 
                v-if="!selectedMessageDetail.read" 
                class="action-btn primary" 
                @click="markAsRead(selectedMessageDetail)"
              >
                <i class="fas fa-envelope-open"></i>
                <span>标记已读</span>
              </button>
              <button class="action-btn secondary" @click="replyMessage(selectedMessageDetail)">
                <i class="fas fa-reply"></i>
                <span>回复</span>
              </button>
              <button class="action-btn secondary" @click="forwardMessage(selectedMessageDetail)">
                <i class="fas fa-share"></i>
                <span>转发</span>
              </button>
              <button class="action-btn danger" @click="deleteMessage(selectedMessageDetail)">
                <i class="fas fa-trash"></i>
                <span>删除</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- 撰写消息弹窗 -->
    <div v-if="showComposeModal" class="modal-overlay" @click="closeComposeModal">
      <div class="modal-content compose-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">撰写消息</h3>
          <button class="modal-close" @click="closeComposeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="sendMessage" class="compose-form">
            <div class="form-group">
              <label class="form-label">收件人</label>
              <div class="recipient-input">
                <input 
                  v-model="composeForm.recipients" 
                  type="text" 
                  class="form-input"
                  placeholder="输入收件人姓名或邮箱，多个用逗号分隔"
                  required
                />
                <button type="button" class="select-btn" @click="selectRecipients">
                  <i class="fas fa-users"></i>
                  选择
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">主题</label>
              <input 
                v-model="composeForm.subject" 
                type="text" 
                class="form-input"
                placeholder="输入消息主题"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">消息内容</label>
              <textarea 
                v-model="composeForm.content" 
                class="form-textarea"
                placeholder="输入消息内容..."
                rows="10"
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">附件</label>
              <div class="attachment-upload">
                <input 
                  type="file" 
                  ref="fileInput"
                  multiple
                  @change="handleFileSelect"
                  class="file-input"
                  style="display: none;"
                />
                <button type="button" class="upload-btn" @click="$refs.fileInput.click()">
                  <i class="fas fa-paperclip"></i>
                  <span>添加附件</span>
                </button>
                <div v-if="composeForm.attachments.length > 0" class="selected-files">
                  <div 
                    v-for="(file, index) in composeForm.attachments" 
                    :key="index"
                    class="selected-file"
                  >
                    <i class="fas fa-file"></i>
                    <span>{{ file.name }}</span>
                    <button type="button" class="remove-file" @click="removeFile(index)">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="action-btn secondary" @click="closeComposeModal">
                取消
              </button>
              <button type="submit" class="action-btn primary">
                <i class="fas fa-paper-plane"></i>
                <span>发送</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 响应式数据
const messages = ref([])
const selectedMessages = ref([])
const selectedMessageDetail = ref(null)
const showComposeModal = ref(false)

const searchKeyword = ref('')
const typeFilter = ref('')
const priorityFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(15)

const composeForm = ref({
  recipients: '',
  subject: '',
  content: '',
  attachments: []
})

// 计算属性
const unreadMessages = computed(() => 
  messages.value.filter(m => !m.read)
)

const importantMessages = computed(() => 
  messages.value.filter(m => m.priority === 'urgent')
)

const filteredMessages = computed(() => {
  let filtered = messages.value

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(message => 
      message.title.toLowerCase().includes(keyword) ||
      message.content.toLowerCase().includes(keyword) ||
      message.senderName.toLowerCase().includes(keyword)
    )
  }

  // 类型过滤
  if (typeFilter.value) {
    filtered = filtered.filter(message => message.type === typeFilter.value)
  }

  // 优先级过滤
  if (priorityFilter.value) {
    filtered = filtered.filter(message => message.priority === priorityFilter.value)
  }

  return filtered
})

// 统计数据
const unreadCount = computed(() => unreadMessages.value.length)
const importantCount = computed(() => importantMessages.value.length)

// 分页计算
const totalPages = computed(() => 
  Math.ceil(filteredMessages.value.length / pageSize.value)
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
const getMessageAvatarIcon = (type) => {
  const icons = {
    personal: 'fas fa-user',
    system: 'fas fa-cog',
    group: 'fas fa-users',
    broadcast: 'fas fa-bullhorn'
  }
  return icons[type] || 'fas fa-envelope'
}

const getMessageTypeLabel = (type) => {
  const labels = {
    personal: '个人消息',
    system: '系统消息',
    group: '群组消息',
    broadcast: '公告消息'
  }
  return labels[type] || '未知类型'
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

const getEmptyMessage = () => {
  if (searchKeyword.value) return '未找到匹配的消息'
  if (typeFilter.value) return '该类型下暂无消息'
  if (priorityFilter.value) return '该优先级下暂无消息'
  return '暂无消息'
}

const getEmptyDescription = () => {
  if (searchKeyword.value) return '请尝试其他搜索关键词'
  return '收件箱中暂无消息，系统将及时推送新的消息'
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
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatFullTime = (timeString) => {
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
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
const selectMessage = (message) => {
  const index = selectedMessages.value.indexOf(message.id)
  if (index > -1) {
    selectedMessages.value.splice(index, 1)
  } else {
    selectedMessages.value.push(message.id)
  }
}

const markAsRead = (message) => {
  message.read = true
  console.log('标记已读:', message)
}

const markAsImportant = (message) => {
  message.priority = message.priority === 'urgent' ? 'normal' : 'urgent'
  console.log('标记重要:', message)
}

const markAllAsRead = () => {
  messages.value.forEach(m => m.read = true)
  console.log('全部标记已读')
}

const deleteMessage = (message) => {
  if (confirm('确定要删除这条消息吗？')) {
    const index = messages.value.findIndex(m => m.id === message.id)
    if (index > -1) {
      messages.value.splice(index, 1)
    }
    
    if (selectedMessageDetail.value?.id === message.id) {
      selectedMessageDetail.value = null
    }
    
    console.log('删除消息:', message)
  }
}

const deleteSelected = () => {
  if (confirm(`确定要删除选中的 ${selectedMessages.value.length} 条消息吗？`)) {
    selectedMessages.value.forEach(id => {
      const index = messages.value.findIndex(m => m.id === id)
      if (index > -1) {
        messages.value.splice(index, 1)
      }
    })
    
    selectedMessages.value = []
    console.log('删除选中的消息')
  }
}

const viewMessage = (message) => {
  selectedMessageDetail.value = message
  if (!message.read) {
    markAsRead(message)
  }
}

const closeMessageDetail = () => {
  selectedMessageDetail.value = null
}

const handleCompose = () => {
  resetComposeForm()
  showComposeModal.value = true
}

const closeComposeModal = () => {
  showComposeModal.value = false
  resetComposeForm()
}

const resetComposeForm = () => {
  composeForm.value = {
    recipients: '',
    subject: '',
    content: '',
    attachments: []
  }
}

const sendMessage = () => {
  const newMessage = {
    id: Date.now(),
    type: 'personal',
    title: composeForm.value.subject,
    content: composeForm.value.content,
    senderName: '当前用户',
    senderRole: '员工',
    createTime: new Date().toISOString(),
    read: false,
    priority: 'normal',
    attachments: composeForm.value.attachments
  }
  
  messages.value.unshift(newMessage)
  closeComposeModal()
  alert('消息发送成功！')
}

const selectRecipients = () => {
  console.log('选择收件人')
  // 这里可以打开联系人选择弹窗
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  composeForm.value.attachments.push(...files)
}

const removeFile = (index) => {
  composeForm.value.attachments.splice(index, 1)
}

const downloadAttachment = (attachment) => {
  console.log('下载附件:', attachment)
  // 这里实现附件下载功能
}

const previewAttachment = (attachment) => {
  console.log('预览附件:', attachment)
  // 这里实现附件预览功能
}

const replyMessage = (message) => {
  composeForm.value.recipients = message.senderName
  composeForm.value.subject = `Re: ${message.title}`
  composeForm.value.content = `\n\n--- 原始消息 ---\n发件人: ${message.senderName}\n时间: ${formatFullTime(message.createTime)}\n\n${message.content}`
  showComposeModal.value = true
}

const forwardMessage = (message) => {
  composeForm.value.subject = `Fwd: ${message.title}`
  composeForm.value.content = `\n\n--- 转发消息 ---\n发件人: ${message.senderName}\n时间: ${formatFullTime(message.createTime)}\n\n${message.content}`
  showComposeModal.value = true
}

const refreshMessages = () => {
  loadMessages()
}

// 加载消息数据
const loadMessages = async () => {
  // 模拟数据
  messages.value = [
    {
      id: 1,
      type: 'personal',
      title: '项目进度汇报',
      content: '本周项目进展顺利，已完成前端开发的80%，后端接口开发完成60%。预计下周可以开始联调测试。如有问题请及时沟通。',
      senderName: '张三',
      senderRole: '项目经理',
      createTime: '2024-01-15 10:30:00',
      read: false,
      priority: 'normal',
      attachments: [
        { id: 1, name: '项目进度报告.pdf', type: 'pdf', size: 1024576 }
      ]
    },
    {
      id: 2,
      type: 'system',
      title: '系统维护通知',
      content: '系统将于本周六凌晨2:00-6:00进行例行维护升级，期间将暂停服务。请提前做好相关准备工作，给您带来的不便敬请谅解。',
      senderName: '系统管理员',
      senderRole: '系统',
      createTime: '2024-01-15 09:00:00',
      read: true,
      priority: 'urgent'
    },
    {
      id: 3,
      type: 'group',
      title: '部门例会通知',
      content: '明天下午3点在3楼会议室召开部门例会，请全体员工准时参加。会议议程：1.上周工作总结 2.本周工作安排 3.其他事项。',
      senderName: '李四',
      senderRole: '部门经理',
      createTime: '2024-01-14 16:20:00',
      read: false,
      priority: 'high'
    },
    {
      id: 4,
      type: 'broadcast',
      title: '公司年会通知',
      content: '公司年会将于下周五晚上6点在希尔顿酒店举行，请全体员工着正装参加。今年年会有精彩节目表演和丰厚抽奖环节，敬请期待！',
      senderName: '人事部',
      senderRole: '人事部门',
      createTime: '2024-01-14 14:15:00',
      read: true,
      priority: 'normal',
      attachments: [
        { id: 2, name: '年会邀请函.pdf', type: 'pdf', size: 2048576 },
        { id: 3, name: '节目单.xlsx', type: 'xlsx', size: 524288 }
      ]
    },
    {
      id: 5,
      type: 'personal',
      title: '文档审核请求',
      content: '请您审核附件中的技术文档，确认内容准确无误后给予回复。如需修改请标注具体位置和修改建议。',
      senderName: '王五',
      senderRole: '技术主管',
      createTime: '2024-01-14 11:30:00',
      read: true,
      priority: 'high',
      attachments: [
        { id: 4, name: '技术规范文档.docx', type: 'docx', size: 1572864 }
      ]
    }
  ]
}

// 生命周期
onMounted(() => {
  loadMessages()
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

.message-inbox {
  font-family: 'Source Sans Pro', sans-serif;
  background: var(--background-color);
  min-height: 100vh;
  color: var(--text-color);
}

/* 头部样式 */
.inbox-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
}

.inbox-header::after {
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

.inbox-stats {
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

.stat-item.important .stat-value {
  color: var(--warning-color);
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
  background: var(--secondary-color);
  color: white;
}

.action-btn.secondary:hover {
  background: #2C3E50;
  transform: translateY(-2px);
}

.action-btn.small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.action-btn.danger {
  background: var(--danger-color);
  color: white;
}

.action-btn.warning {
  background: var(--warning-color);
  color: white;
}

.action-btn.info {
  background: #3498DB;
  color: white;
}

/* 主内容区域 */
.inbox-main {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.inbox-container {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 2rem;
}

/* 消息列表 */
.message-list-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: 1.5rem;
  border-bottom: 2px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
}

.list-actions {
  display: flex;
  gap: 0.5rem;
}

/* 筛选区域 */
.filter-section {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-left {
  display: flex;
  gap: 1rem;
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
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  width: 250px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  min-width: 120px;
  transition: border-color 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

/* 消息列表内容 */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
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

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.message-item:hover {
  background: #f8f9fa;
  border-color: var(--border-color);
}

.message-item.unread {
  background: rgba(230, 126, 34, 0.02);
  border-left: 3px solid var(--accent-color);
}

.message-item.important {
  background: rgba(243, 156, 18, 0.02);
  border-left: 3px solid var(--warning-color);
}

.message-item.selected {
  background: rgba(52, 152, 219, 0.05);
  border-color: #3498DB;
}

.message-checkbox {
  flex-shrink: 0;
  margin-top: 0.5rem;
}

.message-checkbox-input {
  display: none;
}

.checkbox-label {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.message-checkbox-input:checked + .checkbox-label {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

.message-checkbox-input:checked + .checkbox-label::after {
  content: '\f00c';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  color: white;
  font-size: 0.625rem;
}

.message-item.selected .checkbox-label {
  background: #3498DB;
  border-color: #3498DB;
}

.message-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.avatar-placeholder.avatar-personal {
  background: #3498DB;
}

.avatar-placeholder.avatar-system {
  background: #95A5A6;
}

.avatar-placeholder.avatar-group {
  background: #9B59B6;
}

.avatar-placeholder.avatar-broadcast {
  background: var(--warning-color);
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.sender-name {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  font-size: 0.875rem;
}

.message-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-badge.type-personal {
  background: rgba(52, 152, 219, 0.1);
  color: #3498DB;
}

.type-badge.type-system {
  background: rgba(149, 165, 166, 0.1);
  color: #95A5A6;
}

.type-badge.type-group {
  background: rgba(155, 89, 182, 0.1);
  color: #9B59B6;
}

.type-badge.type-broadcast {
  background: rgba(243, 156, 18, 0.1);
  color: var(--warning-color);
}

.priority-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.625rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.priority-badge.urgent {
  background: rgba(231, 76, 60, 0.1);
  color: var(--danger-color);
}

.message-time {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #7F8C8D;
  flex-shrink: 0;
}

.message-title {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.message-title h4 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  font-size: 1rem;
  line-height: 1.4;
  flex: 1;
}

.unread-indicator {
  width: 8px;
  height: 8px;
  background: var(--accent-color);
  border-radius: 50%;
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.message-preview {
  margin-bottom: 0.5rem;
}

.message-preview p {
  color: #7F8C8D;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.attachment-preview {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #f8f9fa;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--secondary-color);
}

.message-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.message-item:hover .message-actions {
  opacity: 1;
}

/* 分页 */
.pagination {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.page-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-weight: 600;
  font-size: 0.75rem;
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

/* 消息详情 */
.message-detail-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: sticky;
  top: 2rem;
  max-height: calc(100vh - 4rem);
  display: flex;
  flex-direction: column;
}

.detail-header {
  padding: 1.5rem;
  border-bottom: 2px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f8f9fa;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--secondary-color);
}

.close-btn:hover {
  background: var(--danger-color);
  color: white;
}

.detail-content {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.sender-detail {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
}

.sender-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.sender-info {
  flex: 1;
}

.sender-name {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  font-size: 1.125rem;
  margin-bottom: 0.25rem;
}

.sender-role {
  color: #7F8C8D;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.message-header-detail {
  margin-bottom: 1.5rem;
}

.message-title-detail {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  line-height: 1.4;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #7F8C8D;
}

.priority-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.priority-info.urgent {
  color: var(--danger-color);
  font-weight: 600;
}

.message-body {
  margin-bottom: 2rem;
}

.message-content-detail {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--text-color);
  white-space: pre-wrap;
}

.message-attachments {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.attachments-title {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 1rem 0;
  font-size: 1rem;
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

.attachment-actions {
  display: flex;
  gap: 0.5rem;
}

.message-actions-detail {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border-color);
}

/* 撰写消息弹窗 */
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
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.compose-modal {
  max-width: 900px;
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
  flex: 1;
  overflow-y: auto;
}

.compose-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  font-size: 0.875rem;
}

.form-input,
.form-textarea {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.3s ease;
  font-family: 'Source Sans Pro', sans-serif;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
}

.form-textarea {
  resize: vertical;
  min-height: 200px;
}

.recipient-input {
  display: flex;
  gap: 0.5rem;
}

.recipient-input .form-input {
  flex: 1;
}

.select-btn {
  padding: 0.75rem 1rem;
  background: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.select-btn:hover {
  background: #2C3E50;
}

.attachment-upload {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  width: fit-content;
}

.upload-btn:hover {
  background: #34495E;
}

.selected-files {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.remove-file {
  margin-left: auto;
  width: 24px;
  height: 24px;
  border: none;
  background: var(--danger-color);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.remove-file:hover {
  background: #C0392B;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 2px solid var(--border-color);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .inbox-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .message-detail-section {
    position: static;
    max-height: none;
  }
}

@media (max-width: 768px) {
  .inbox-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .inbox-main {
    padding: 1rem;
  }
  
  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-left {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .search-input {
    width: 100%;
  }
  
  .message-item {
    padding: 0.75rem;
  }
  
  .message-actions {
    opacity: 1;
    flex-direction: row;
  }
  
  .modal-content {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }
  
  .recipient-input {
    flex-direction: column;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>