<template>
  <div class="collaborative-edit">
    <!-- 工业风格头部区域 -->
    <header class="edit-header">
      <div class="header-left">
        <div class="title-section">
          <h1 class="page-title">协同编辑</h1>
          <div class="breadcrumb">
            <span class="breadcrumb-item">OA系统</span>
            <i class="fas fa-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-item">文档中心</span>
            <i class="fas fa-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-item active">协同编辑</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="user-status">
          <div class="active-users">
            <div v-for="user in activeUsers" :key="user.id" class="user-avatar" :title="user.name">
              <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
              <div v-else class="avatar-placeholder">{{ user.name.charAt(0) }}</div>
              <div class="status-indicator online"></div>
            </div>
          </div>
          <span class="user-count">{{ activeUsers.length }} 人在线</span>
        </div>
        <button class="action-btn primary" @click="handleSave">
          <i class="fas fa-save"></i>
          <span>保存</span>
        </button>
      </div>
    </header>

    <!-- 主编辑区域 -->
    <main class="edit-main">
      <div class="edit-container">
        <!-- 工具栏 -->
        <section class="editor-toolbar">
          <div class="toolbar-left">
            <div class="document-info">
              <h2 class="document-title">{{ documentInfo.title }}</h2>
              <div class="document-meta">
                <span class="author">作者: {{ documentInfo.author }}</span>
                <span class="modified-time">最后修改: {{ formatTime(documentInfo.modifiedTime) }}</span>
              </div>
            </div>
          </div>
          
          <div class="toolbar-center">
            <div class="edit-modes">
              <button 
                v-for="mode in editModes" 
                :key="mode.key"
                class="mode-btn"
                :class="{ active: currentMode === mode.key }"
                @click="switchMode(mode.key)"
                :title="mode.description"
              >
                <i :class="mode.icon"></i>
                <span>{{ mode.label }}</span>
              </button>
            </div>
          </div>
          
          <div class="toolbar-right">
            <button class="toolbar-btn" @click="handleUndo" :disabled="!canUndo">
              <i class="fas fa-undo"></i>
            </button>
            <button class="toolbar-btn" @click="handleRedo" :disabled="!canRedo">
              <i class="fas fa-redo"></i>
            </button>
            <div class="divider"></div>
            <button class="toolbar-btn" @click="handleShare">
              <i class="fas fa-share-alt"></i>
            </button>
            <button class="toolbar-btn" @click="handleExport">
              <i class="fas fa-download"></i>
            </button>
          </div>
        </section>

        <!-- 编辑区域 -->
        <section class="editor-section">
          <!-- 模式编辑器 -->
          <div v-if="currentMode === 'text'" class="text-editor">
            <div class="editor-container">
              <textarea 
                ref="textEditor"
                v-model="content"
                class="text-area"
                placeholder="开始编辑文档内容..."
                @input="handleTextChange"
                @scroll="handleScroll"
              ></textarea>
              
              <!-- 协同光标 -->
              <div class="collaborative-cursors">
                <div 
                  v-for="cursor in remoteCursors" 
                  :key="cursor.userId"
                  class="remote-cursor"
                  :style="getCursorStyle(cursor)"
                >
                  <div class="cursor-line"></div>
                  <div class="cursor-label">
                    <img v-if="cursor.userAvatar" :src="cursor.userAvatar" />
                    <span v-else>{{ cursor.userName.charAt(0) }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 编辑器侧边栏 -->
            <div class="editor-sidebar">
              <!-- 版本历史 -->
              <div class="sidebar-section">
                <h3 class="sidebar-title">版本历史</h3>
                <div class="version-list">
                  <div 
                    v-for="version in versions" 
                    :key="version.id"
                    class="version-item"
                    :class="{ active: currentVersion === version.id }"
                    @click="loadVersion(version.id)"
                  >
                    <div class="version-info">
                      <span class="version-number">v{{ version.version }}</span>
                      <span class="version-author">{{ version.author }}</span>
                      <span class="version-time">{{ formatTime(version.createTime) }}</span>
                    </div>
                    <div class="version-actions">
                      <button class="version-btn" @click.stop="compareVersion(version.id)">
                        <i class="fas fa-code-compare"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 评论列表 -->
              <div class="sidebar-section">
                <h3 class="sidebar-title">评论 ({{ comments.length }})</h3>
                <div class="comment-list">
                  <div 
                    v-for="comment in comments" 
                    :key="comment.id"
                    class="comment-item"
                  >
                    <div class="comment-avatar">
                      <img v-if="comment.userAvatar" :src="comment.userAvatar" :alt="comment.userName" />
                      <div v-else class="avatar-small">{{ comment.userName.charAt(0) }}</div>
                    </div>
                    <div class="comment-content">
                      <div class="comment-header">
                        <span class="comment-author">{{ comment.userName }}</span>
                        <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
                      </div>
                      <div class="comment-text">{{ comment.content }}</div>
                    </div>
                  </div>
                </div>
                
                <!-- 添加评论 -->
                <div class="add-comment">
                  <textarea 
                    v-model="newComment"
                    class="comment-input"
                    placeholder="添加评论..."
                    rows="3"
                  ></textarea>
                  <button class="comment-submit" @click="addComment">
                    <i class="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 富文本编辑器 -->
          <div v-else-if="currentMode === 'rich'" class="rich-editor">
            <div class="toolbar-ribbon">
              <div class="ribbon-group">
                <button class="ribbon-btn" @click="formatText('bold')" title="粗体">
                  <i class="fas fa-bold"></i>
                </button>
                <button class="ribbon-btn" @click="formatText('italic')" title="斜体">
                  <i class="fas fa-italic"></i>
                </button>
                <button class="ribbon-btn" @click="formatText('underline')" title="下划线">
                  <i class="fas fa-underline"></i>
                </button>
              </div>
              
              <div class="ribbon-group">
                <button class="ribbon-btn" @click="insertList('ul')" title="无序列表">
                  <i class="fas fa-list-ul"></i>
                </button>
                <button class="ribbon-btn" @click="insertList('ol')" title="有序列表">
                  <i class="fas fa-list-ol"></i>
                </button>
              </div>
              
              <div class="ribbon-group">
                <button class="ribbon-btn" @click="insertLink" title="插入链接">
                  <i class="fas fa-link"></i>
                </button>
                <button class="ribbon-btn" @click="insertImage" title="插入图片">
                  <i class="fas fa-image"></i>
                </button>
                <button class="ribbon-btn" @click="insertTable" title="插入表格">
                  <i class="fas fa-table"></i>
                </button>
              </div>
            </div>
            
            <div 
              ref="richEditor"
              class="rich-content"
              contenteditable="true"
              @input="handleRichChange"
              @keydown="handleRichKeydown"
            ></div>
          </div>

          <!-- 实时协作模式 -->
          <div v-else-if="currentMode === 'realtime'" class="realtime-editor">
            <div class="realtime-toolbar">
              <div class="realtime-info">
                <div class="connection-status online">
                  <i class="fas fa-circle"></i>
                  <span>实时同步中</span>
                </div>
                <div class="sync-info">
                  <span>{{ activeUsers.length }} 位协作者在线</span>
                </div>
              </div>
              
              <div class="realtime-actions">
                <button class="action-btn small" @click="toggleVoiceChat">
                  <i class="fas fa-microphone"></i>
                  <span>语音聊天</span>
                </button>
                <button class="action-btn small" @click="toggleVideoChat">
                  <i class="fas fa-video"></i>
                  <span>视频会议</span>
                </button>
              </div>
            </div>
            
            <div class="realtime-content">
              <div class="editor-panel">
                <textarea 
                  v-model="realtimeContent"
                  class="realtime-textarea"
                  @input="handleRealtimeChange"
                ></textarea>
                
                <!-- 实时编辑指示器 -->
                <div class="realtime-indicators">
                  <div 
                    v-for="indicator in realtimeIndicators" 
                    :key="indicator.userId"
                    class="realtime-indicator"
                    :style="getIndicatorStyle(indicator)"
                  >
                    <div class="indicator-user">
                      <img v-if="indicator.userAvatar" :src="indicator.userAvatar" />
                      <span v-else>{{ indicator.userName.charAt(0) }}</span>
                    </div>
                    <div class="indicator-text">
                      {{ indicator.userName }} 正在编辑...
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 协作面板 -->
              <div class="collaboration-panel">
                <div class="panel-section">
                  <h4 class="panel-title">在线协作者</h4>
                  <div class="online-users-list">
                    <div 
                      v-for="user in activeUsers" 
                      :key="user.id"
                      class="online-user-item"
                    >
                      <div class="user-avatar-small">
                        <img v-if="user.avatar" :src="user.avatar" />
                        <div v-else class="avatar-tiny">{{ user.name.charAt(0) }}</div>
                      </div>
                      <span class="user-name">{{ user.name }}</span>
                      <div class="user-status online"></div>
                    </div>
                  </div>
                </div>
                
                <div class="panel-section">
                  <h4 class="panel-title">操作历史</h4>
                  <div class="action-history">
                    <div 
                      v-for="action in actionHistory" 
                      :key="action.id"
                      class="action-item"
                    >
                      <div class="action-user">{{ action.userName }}</div>
                      <div class="action-text">{{ action.description }}</div>
                      <div class="action-time">{{ formatTime(action.timestamp) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 状态栏 -->
        <section class="status-bar">
          <div class="status-left">
            <span class="word-count">字数: {{ wordCount }}</span>
            <span class="char-count">字符数: {{ charCount }}</span>
            <span class="position-info">行 {{ cursorPosition.line }}, 列 {{ cursorPosition.column }}</span>
          </div>
          
          <div class="status-right">
            <span class="sync-status" :class="syncStatus">
              <i :class="getSyncStatusIcon()"></i>
              <span>{{ getSyncStatusText() }}</span>
            </span>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'

// 响应式数据
const documentInfo = reactive({
  title: '项目协同文档',
  author: '张三',
  modifiedTime: new Date().toISOString()
})

const activeUsers = ref([])
const remoteCursors = ref([])
const realtimeIndicators = ref([])
const content = ref('')
const realtimeContent = ref('')
const newComment = ref('')
const currentMode = ref('text')
const canUndo = ref(false)
const canRedo = ref(false)
const syncStatus = ref('saved')

const editModes = [
  { key: 'text', label: '文本', icon: 'fas fa-font', description: '纯文本编辑模式' },
  { key: 'rich', label: '富文本', icon: 'fas fa-file-alt', description: '富文本编辑模式' },
  { key: 'realtime', label: '实时', icon: 'fas fa-users', description: '实时协作模式' }
]

const versions = ref([])
const comments = ref([])
const actionHistory = ref([])
const currentVersion = ref('latest')

const cursorPosition = reactive({ line: 1, column: 1 })

// 计算属性
const wordCount = computed(() => {
  const text = currentMode.value === 'realtime' ? realtimeContent.value : content.value
  return text.trim() ? text.trim().split(/\s+/).length : 0
})

const charCount = computed(() => {
  const text = currentMode.value === 'realtime' ? realtimeContent.value : content.value
  return text.length
})

// 工具函数
const formatTime = (timeString) => {
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getCursorStyle = (cursor) => {
  return {
    left: cursor.x + 'px',
    top: cursor.y + 'px'
  }
}

const getIndicatorStyle = (indicator) => {
  return {
    backgroundColor: indicator.color || '#E67E22'
  }
}

const getSyncStatusIcon = () => {
  switch (syncStatus.value) {
    case 'syncing':
      return 'fas fa-sync fa-spin'
    case 'saved':
      return 'fas fa-check-circle'
    case 'error':
      return 'fas fa-exclamation-circle'
    default:
      return 'fas fa-question-circle'
  }
}

const getSyncStatusText = () => {
  switch (syncStatus.value) {
    case 'syncing':
      return '同步中...'
    case 'saved':
      return '已保存'
    case 'error':
      return '同步失败'
    default:
      return '未知状态'
  }
}

// 事件处理
const switchMode = (mode) => {
  currentMode.value = mode
}

const handleTextChange = () => {
  updateSyncStatus('syncing')
  // 模拟实时同步
  setTimeout(() => {
    updateSyncStatus('saved')
  }, 1000)
  
  updateCursorPosition()
}

const handleRichChange = () => {
  // 处理富文本变化
}

const handleRealtimeChange = () => {
  // 模拟实时协作
  broadcastChange()
}

const handleScroll = () => {
  // 处理滚动事件
}

const updateCursorPosition = () => {
  // 更新光标位置
}

const updateSyncStatus = (status) => {
  syncStatus.value = status
}

const handleUndo = () => {
  // 撤销操作
}

const handleRedo = () => {
  // 重做操作
}

const handleSave = () => {
  updateSyncStatus('syncing')
  // 模拟保存
  setTimeout(() => {
    updateSyncStatus('saved')
    alert('文档已保存')
  }, 2000)
}

const handleShare = () => {
  console.log('分享文档')
}

const handleExport = () => {
  console.log('导出文档')
}

const loadVersion = (versionId) => {
  currentVersion.value = versionId
  console.log('加载版本:', versionId)
}

const compareVersion = (versionId) => {
  console.log('比较版本:', versionId)
}

const addComment = () => {
  if (!newComment.value.trim()) return
  
  const comment = {
    id: Date.now(),
    userName: '当前用户',
    userAvatar: '',
    content: newComment.value.trim(),
    createTime: new Date().toISOString()
  }
  
  comments.value.push(comment)
  newComment.value = ''
}

const formatText = (format) => {
  // 格式化文本
}

const insertList = (type) => {
  // 插入列表
}

const insertLink = () => {
  // 插入链接
}

const insertImage = () => {
  // 插入图片
}

const insertTable = () => {
  // 插入表格
}

const toggleVoiceChat = () => {
  console.log('切换语音聊天')
}

const toggleVideoChat = () => {
  console.log('切换视频会议')
}

const broadcastChange = () => {
  // 模拟广播内容变化
}

// 初始化数据
const initializeData = () => {
  // 模拟在线用户
  activeUsers.value = [
    { id: 1, name: '张三', avatar: '', status: 'online' },
    { id: 2, name: '李四', avatar: '', status: 'online' },
    { id: 3, name: '王五', avatar: '', status: 'away' }
  ]
  
  // 模拟远程光标
  remoteCursors.value = [
    { userId: 2, userName: '李四', userAvatar: '', x: 150, y: 200 },
    { userId: 3, userName: '王五', userAvatar: '', x: 300, y: 150 }
  ]
  
  // 模拟实时指示器
  realtimeIndicators.value = [
    { userId: 2, userName: '李四', userAvatar: '', color: '#3498DB' },
    { userId: 3, userName: '王五', userAvatar: '', color: '#27AE60' }
  ]
  
  // 模拟版本历史
  versions.value = [
    { id: 1, version: '1.0', author: '张三', createTime: '2024-01-15 09:00:00' },
    { id: 2, version: '1.1', author: '李四', createTime: '2024-01-15 11:30:00' },
    { id: 3, version: '1.2', author: '王五', createTime: '2024-01-15 14:20:00' }
  ]
  
  // 模拟评论
  comments.value = [
    {
      id: 1,
      userName: '张三',
      userAvatar: '',
      content: '这部分内容需要进一步修改',
      createTime: '2024-01-15 10:30:00'
    },
    {
      id: 2,
      userName: '李四',
      userAvatar: '',
      content: '同意，建议重新组织段落结构',
      createTime: '2024-01-15 11:15:00'
    }
  ]
  
  // 模拟操作历史
  actionHistory.value = [
    { id: 1, userName: '张三', description: '创建了文档', timestamp: '2024-01-15 09:00:00' },
    { id: 2, userName: '李四', description: '添加了新段落', timestamp: '2024-01-15 10:30:00' },
    { id: 3, userName: '王五', description: '修改了标题', timestamp: '2024-01-15 11:15:00' }
  ]
}

// 生命周期
onMounted(() => {
  initializeData()
})

onUnmounted(() => {
  // 清理资源
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

.collaborative-edit {
  font-family: 'Source Sans Pro', sans-serif;
  background: var(--background-color);
  min-height: 100vh;
  color: var(--text-color);
  display: flex;
  flex-direction: column;
}

/* 头部样式 */
.edit-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 100;
}

.edit-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent-color);
}

.header-left {
  display: flex;
  align-items: center;
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

.header-right {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.user-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.active-users {
  display: flex;
  gap: -0.5rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  position: relative;
  border: 3px solid white;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--secondary-color);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-indicator.online {
  background: var(--success-color);
}

.user-count {
  font-size: 0.875rem;
  opacity: 0.9;
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

.action-btn.small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* 主编辑区域 */
.edit-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.edit-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.1);
}

/* 工具栏 */
.editor-toolbar {
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 2px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.toolbar-left {
  flex: 1;
  min-width: 300px;
}

.document-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
}

.document-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #7F8C8D;
}

.toolbar-center {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-modes {
  display: flex;
  gap: 0.25rem;
  background: white;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--secondary-color);
  border-right: 1px solid var(--border-color);
}

.mode-btn:last-child {
  border-right: none;
}

.mode-btn:hover {
  background: var(--background-color);
}

.mode-btn.active {
  background: var(--accent-color);
  color: white;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--secondary-color);
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--border-color);
}

/* 编辑区域 */
.editor-section {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.text-editor {
  flex: 1;
  display: flex;
}

.editor-container {
  flex: 1;
  position: relative;
}

.text-area {
  width: 100%;
  height: 100%;
  padding: 2rem;
  border: none;
  outline: none;
  font-family: 'Source Sans Pro', sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  resize: none;
  background: white;
}

.collaborative-cursors {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.remote-cursor {
  position: absolute;
  z-index: 10;
}

.cursor-line {
  width: 2px;
  height: 20px;
  background: var(--accent-color);
  animation: blink 1s infinite;
}

.cursor-label {
  position: absolute;
  top: -25px;
  left: 0;
  background: var(--accent-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 编辑器侧边栏 */
.editor-sidebar {
  width: 300px;
  background: #f8f9fa;
  border-left: 2px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-section {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 1rem 0;
}

.version-list,
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.version-item,
.comment-item {
  padding: 0.75rem;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.version-item:hover,
.comment-item:hover {
  border-color: var(--accent-color);
  box-shadow: 0 2px 8px rgba(230, 126, 34, 0.1);
}

.version-item.active {
  border-color: var(--accent-color);
  background: rgba(230, 126, 34, 0.05);
}

.version-info,
.comment-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.version-number,
.comment-author {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 0.875rem;
}

.version-author,
.comment-time {
  color: #7F8C8D;
  font-size: 0.75rem;
}

.version-time {
  color: #7F8C8D;
  font-size: 0.75rem;
}

.version-actions {
  margin-top: 0.5rem;
}

.version-btn {
  padding: 0.25rem 0.5rem;
  background: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-text {
  color: var(--text-color);
  font-size: 0.875rem;
  line-height: 1.4;
}

.add-comment {
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comment-input {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  resize: none;
  font-family: 'Source Sans Pro', sans-serif;
}

.comment-submit {
  align-self: flex-end;
  padding: 0.5rem 1rem;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.comment-submit:hover {
  background: #D35400;
}

/* 富文本编辑器 */
.rich-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.toolbar-ribbon {
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  gap: 1rem;
  align-items: center;
}

.ribbon-group {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.ribbon-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--secondary-color);
}

.ribbon-btn:hover {
  background: var(--background-color);
}

.rich-content {
  flex: 1;
  padding: 2rem;
  outline: none;
  min-height: 400px;
  overflow-y: auto;
  font-family: 'Source Sans Pro', sans-serif;
  font-size: 1rem;
  line-height: 1.6;
}

/* 实时协作编辑器 */
.realtime-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.realtime-toolbar {
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 2px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.realtime-info {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.connection-status.online {
  color: var(--success-color);
}

.connection-status i {
  font-size: 0.75rem;
}

.sync-info {
  font-size: 0.875rem;
  color: var(--secondary-color);
}

.realtime-actions {
  display: flex;
  gap: 1rem;
}

.realtime-content {
  flex: 1;
  display: flex;
}

.editor-panel {
  flex: 2;
  position: relative;
}

.realtime-textarea {
  width: 100%;
  height: 100%;
  padding: 2rem;
  border: none;
  outline: none;
  font-family: 'Source Sans Pro', sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  resize: none;
}

.realtime-indicators {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.realtime-indicator {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  padding: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.indicator-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
}

.indicator-user img,
.avatar-tiny {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-tiny {
  background: var(--secondary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
}

.indicator-text {
  font-size: 0.75rem;
  color: var(--secondary-color);
  margin-top: 0.25rem;
}

.collaboration-panel {
  flex: 1;
  background: #f8f9fa;
  border-left: 2px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.panel-section {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 1rem 0;
}

.online-users-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.online-user-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: white;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.online-user-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--secondary-color);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-color);
}

.action-history {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-item {
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  font-size: 0.875rem;
}

.action-user {
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.action-text {
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.action-time {
  font-size: 0.75rem;
  color: #7F8C8D;
}

/* 状态栏 */
.status-bar {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-top: 2px solid var(--border-color);
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.status-left {
  display: flex;
  gap: 2rem;
}

.word-count,
.char-count,
.position-info {
  color: var(--secondary-color);
}

.status-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.sync-status.syncing {
  color: var(--warning-color);
}

.sync-status.saved {
  color: var(--success-color);
}

.sync-status.error {
  color: var(--danger-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .edit-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .toolbar-left {
    min-width: 100%;
  }
  
  .editor-toolbar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .toolbar-center {
    justify-content: center;
  }
  
  .editor-sidebar {
    width: 100%;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 300px;
    transform: translateY(100%);
    transition: transform 0.3s ease;
    z-index: 1000;
  }
  
  .editor-sidebar.show {
    transform: translateY(0);
  }
  
  .collaboration-panel {
    display: none;
  }
  
  .status-bar {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>