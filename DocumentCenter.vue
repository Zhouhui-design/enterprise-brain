<template>
  <div class="document-center">
    <!-- 工业风格头部区域 -->
    <header class="center-header">
      <div class="header-left">
        <div class="title-section">
          <h1 class="page-title">文档中心</h1>
          <div class="breadcrumb">
            <span class="breadcrumb-item">OA系统</span>
            <i class="fas fa-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-item active">文档中心</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="upload-actions">
          <button class="action-btn secondary" @click="handleUpload">
            <i class="fas fa-cloud-upload-alt"></i>
            <span>上传文档</span>
          </button>
          <button class="action-btn secondary" @click="handleNewFolder">
            <i class="fas fa-folder-plus"></i>
            <span>新建文件夹</span>
          </button>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="center-main">
      <div class="center-container">
        <!-- 文档列表 -->
        <section class="document-list-section">
          <div class="list-header">
            <div class="navigation-path">
              <button class="path-item" @click="navigateToRoot">
                <i class="fas fa-home"></i>
                <span>根目录</span>
              </button>
              <div v-for="(folder, index) in currentPath" :key="index" class="path-separator">
                <i class="fas fa-chevron-right"></i>
              </div>
              <button 
                v-for="(folder, index) in currentPath" 
                :key="folder.id"
                class="path-item"
                @click="navigateToFolder(index)"
              >
                {{ folder.name }}
              </button>
            </div>
            
            <div class="view-controls">
              <div class="view-toggle">
                <button 
                  class="view-btn"
                  :class="{ active: viewMode === 'grid' }"
                  @click="viewMode = 'grid'"
                >
                  <i class="fas fa-th"></i>
                </button>
                <button 
                  class="view-btn"
                  :class="{ active: viewMode === 'list' }"
                  @click="viewMode = 'list'"
                >
                  <i class="fas fa-list"></i>
                </button>
              </div>
              
              <div class="sort-control">
                <select v-model="sortBy" class="sort-select">
                  <option value="name">按名称</option>
                  <option value="date">按修改时间</option>
                  <option value="size">按大小</option>
                  <option value="type">按类型</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 搜索和筛选 -->
          <div class="search-section">
            <div class="search-box">
              <i class="fas fa-search search-icon"></i>
              <input 
                v-model="searchKeyword" 
                type="text" 
                placeholder="搜索文档名称、内容..."
                class="search-input"
              />
            </div>
            
            <div class="filter-controls">
              <select v-model="typeFilter" class="filter-select">
                <option value="">全部类型</option>
                <option value="document">文档</option>
                <option value="spreadsheet">表格</option>
                <option value="presentation">演示文稿</option>
                <option value="image">图片</option>
                <option value="video">视频</option>
                <option value="archive">压缩包</option>
              </select>
              
              <select v-model="dateFilter" class="filter-select">
                <option value="">全部时间</option>
                <option value="today">今天</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
              </select>
            </div>
          </div>

          <!-- 文档网格视图 -->
          <div v-if="viewMode === 'grid'" class="document-grid">
            <div 
              v-for="item in filteredDocuments" 
              :key="item.id"
              class="document-item"
              :class="{ selected: selectedDocuments.includes(item.id) }"
              @click="selectDocument(item)"
              @dblclick="openDocument(item)"
            >
              <div class="document-icon">
                <i v-if="item.type === 'folder'" class="fas fa-folder document-folder-icon"></i>
                <i v-else :class="getFileIcon(item.fileType)" class="document-file-icon"></i>
              </div>
              
              <div class="document-info">
                <h4 class="document-name" :title="item.name">{{ item.name }}</h4>
                <div class="document-meta">
                  <span v-if="item.type !== 'folder'" class="document-size">{{ formatFileSize(item.size) }}</span>
                  <span class="document-date">{{ formatDate(item.modifiedTime) }}</span>
                </div>
                <div v-if="item.type !== 'folder'" class="document-tags">
                  <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
                </div>
              </div>
              
              <div class="document-actions">
                <button class="action-btn small info" @click.stop="previewDocument(item)">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn small secondary" @click.stop="shareDocument(item)">
                  <i class="fas fa-share"></i>
                </button>
                <button class="action-btn small warning" @click.stop="downloadDocument(item)">
                  <i class="fas fa-download"></i>
                </button>
                <button class="action-btn small danger" @click.stop="deleteDocument(item)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- 文档列表视图 -->
          <div v-else class="document-table">
            <table class="documents-table">
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox" 
                      @change="toggleSelectAll"
                      :checked="allSelected"
                    />
                  </th>
                  <th>名称</th>
                  <th>类型</th>
                  <th>大小</th>
                  <th>修改时间</th>
                  <th>所有者</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="item in filteredDocuments" 
                  :key="item.id"
                  class="table-row"
                  :class="{ selected: selectedDocuments.includes(item.id) }"
                  @click="selectDocument(item)"
                >
                  <td @click.stop>
                    <input 
                      type="checkbox" 
                      :checked="selectedDocuments.includes(item.id)"
                      @change="toggleDocumentSelection(item.id)"
                    />
                  </td>
                  <td class="name-cell">
                    <div class="name-content">
                      <i v-if="item.type === 'folder'" class="fas fa-folder"></i>
                      <i v-else :class="getFileIcon(item.fileType)"></i>
                      <span>{{ item.name }}</span>
                    </div>
                  </td>
                  <td>
                    <span v-if="item.type === 'folder'">文件夹</span>
                    <span v-else>{{ getFileTypeLabel(item.fileType) }}</span>
                  </td>
                  <td>{{ item.type === 'folder' ? '-' : formatFileSize(item.size) }}</td>
                  <td>{{ formatDate(item.modifiedTime) }}</td>
                  <td>{{ item.owner }}</td>
                  <td class="actions-cell">
                    <button class="action-btn small info" @click.stop="previewDocument(item)">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn small secondary" @click.stop="shareDocument(item)">
                      <i class="fas fa-share"></i>
                    </button>
                    <button class="action-btn small warning" @click.stop="downloadDocument(item)">
                      <i class="fas fa-download"></i>
                    </button>
                    <button class="action-btn small danger" @click.stop="deleteDocument(item)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredDocuments.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-folder-open"></i>
            </div>
            <h4>{{ getEmptyMessage() }}</h4>
            <p>{{ getEmptyDescription() }}</p>
            <button class="action-btn primary" @click="handleUpload">
              <i class="fas fa-cloud-upload-alt"></i>
              <span>上传第一个文档</span>
            </button>
          </div>
        </section>

        <!-- 侧边栏信息 -->
        <aside class="sidebar">
          <!-- 存储信息 -->
          <div class="storage-info">
            <h3 class="sidebar-title">存储空间</h3>
            <div class="storage-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: storagePercentage + '%' }"></div>
              </div>
              <div class="storage-stats">
                <span class="used">{{ formatFileSize(storageUsed) }}</span>
                <span class="total">/ {{ formatFileSize(storageTotal) }}</span>
              </div>
            </div>
          </div>

          <!-- 快速访问 -->
          <div class="quick-access">
            <h3 class="sidebar-title">快速访问</h3>
            <div class="quick-list">
              <div 
                v-for="item in quickAccess" 
                :key="item.id"
                class="quick-item"
                @click="navigateToQuickAccess(item)"
              >
                <i :class="getFileIcon(item.fileType)"></i>
                <span>{{ item.name }}</span>
              </div>
            </div>
          </div>

          <!-- 最近文档 -->
          <div class="recent-documents">
            <h3 class="sidebar-title">最近文档</h3>
            <div class="recent-list">
              <div 
                v-for="doc in recentDocuments" 
                :key="doc.id"
                class="recent-item"
                @click="openDocument(doc)"
              >
                <div class="recent-info">
                  <i :class="getFileIcon(doc.fileType)"></i>
                  <div class="recent-details">
                    <div class="recent-name">{{ doc.name }}</div>
                    <div class="recent-meta">{{ formatDate(doc.modifiedTime) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 响应式数据
const documents = ref([])
const selectedDocuments = ref([])
const currentPath = ref([])
const viewMode = ref('grid')
const sortBy = ref('name')
const searchKeyword = ref('')
const typeFilter = ref('')
const dateFilter = ref('')

const storageUsed = ref(0)
const storageTotal = ref(0)

const quickAccess = ref([])
const recentDocuments = ref([])

// 计算属性
const storagePercentage = computed(() => {
  return storageTotal.value > 0 ? Math.round((storageUsed.value / storageTotal.value) * 100) : 0
})

const filteredDocuments = computed(() => {
  let filtered = documents.value

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(doc => 
      doc.name.toLowerCase().includes(keyword) ||
      (doc.description && doc.description.toLowerCase().includes(keyword))
    )
  }

  // 类型过滤
  if (typeFilter.value) {
    filtered = filtered.filter(doc => {
      if (typeFilter.value === 'document') {
        return doc.type !== 'folder' && ['pdf', 'doc', 'docx', 'txt'].includes(doc.fileType)
      } else if (typeFilter.value === 'spreadsheet') {
        return ['xls', 'xlsx', 'csv'].includes(doc.fileType)
      } else if (typeFilter.value === 'presentation') {
        return ['ppt', 'pptx'].includes(doc.fileType)
      } else if (typeFilter.value === 'image') {
        return ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(doc.fileType)
      } else if (typeFilter.value === 'video') {
        return ['mp4', 'avi', 'mov', 'wmv'].includes(doc.fileType)
      } else if (typeFilter.value === 'archive') {
        return ['zip', 'rar', '7z', 'tar'].includes(doc.fileType)
      }
      return true
    })
  }

  // 时间过滤
  if (dateFilter.value) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    filtered = filtered.filter(doc => {
      const modifiedTime = new Date(doc.modifiedTime)
      
      switch (dateFilter.value) {
        case 'today':
          return modifiedTime >= today
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          return modifiedTime >= weekAgo
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          return modifiedTime >= monthAgo
        default:
          return true
      }
    })
  }

  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'date':
        return new Date(b.modifiedTime) - new Date(a.modifiedTime)
      case 'size':
        return (b.size || 0) - (a.size || 0)
      case 'type':
        return (a.fileType || '').localeCompare(b.fileType || '')
      default:
        return 0
    }
  })

  return filtered
})

const allSelected = computed(() => {
  return filteredDocuments.value.length > 0 && 
         selectedDocuments.value.length === filteredDocuments.value.length
})

// 工具函数
const getFileIcon = (fileType) => {
  const icons = {
    pdf: 'fas fa-file-pdf',
    doc: 'fas fa-file-word',
    docx: 'fas fa-file-word',
    xls: 'fas fa-file-excel',
    xlsx: 'fas fa-file-excel',
    ppt: 'fas fa-file-powerpoint',
    pptx: 'fas fa-file-powerpoint',
    jpg: 'fas fa-file-image',
    jpeg: 'fas fa-file-image',
    png: 'fas fa-file-image',
    gif: 'fas fa-file-image',
    svg: 'fas fa-file-image',
    mp4: 'fas fa-file-video',
    avi: 'fas fa-file-video',
    mov: 'fas fa-file-video',
    wmv: 'fas fa-file-video',
    zip: 'fas fa-file-archive',
    rar: 'fas fa-file-archive',
    '7z': 'fas fa-file-archive',
    tar: 'fas fa-file-archive'
  }
  return icons[fileType] || 'fas fa-file'
}

const getFileTypeLabel = (fileType) => {
  const labels = {
    pdf: 'PDF文档',
    doc: 'Word文档',
    docx: 'Word文档',
    xls: 'Excel表格',
    xlsx: 'Excel表格',
    ppt: 'PowerPoint',
    pptx: 'PowerPoint',
    jpg: '图片',
    jpeg: '图片',
    png: '图片',
    gif: '图片',
    svg: '图片',
    mp4: '视频',
    avi: '视频',
    mov: '视频',
    wmv: '视频',
    zip: '压缩包',
    rar: '压缩包',
    '7z': '压缩包',
    tar: '压缩包'
  }
  return labels[fileType] || '文件'
}

const formatFileSize = (bytes) => {
  if (!bytes) return '-'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const getEmptyMessage = () => {
  if (searchKeyword.value) return '未找到匹配的文档'
  if (typeFilter.value) return '该类型下暂无文档'
  if (dateFilter.value) return '该时间段内暂无文档'
  return '暂无文档'
}

const getEmptyDescription = () => {
  if (searchKeyword.value) return '请尝试其他搜索关键词'
  return '上传文档开始使用文档中心'
}

// 事件处理
const selectDocument = (document) => {
  const index = selectedDocuments.value.indexOf(document.id)
  if (index > -1) {
    selectedDocuments.value.splice(index, 1)
  } else {
    selectedDocuments.value.push(document.id)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedDocuments.value = []
  } else {
    selectedDocuments.value = filteredDocuments.value.map(doc => doc.id)
  }
}

const toggleDocumentSelection = (documentId) => {
  const index = selectedDocuments.value.indexOf(documentId)
  if (index > -1) {
    selectedDocuments.value.splice(index, 1)
  } else {
    selectedDocuments.value.push(documentId)
  }
}

const navigateToRoot = () => {
  currentPath.value = []
  loadDocuments()
}

const navigateToFolder = (folderIndex) => {
  if (folderIndex === currentPath.value.length - 1) {
    currentPath.value = currentPath.value.slice(0, folderIndex)
  } else {
    currentPath.value = currentPath.value.slice(0, folderIndex + 1)
  }
  loadDocuments()
}

const navigateToQuickAccess = (item) => {
  currentPath.value = item.path || []
  loadDocuments()
}

const previewDocument = (document) => {
  console.log('预览文档:', document)
  // 这里打开文档预览
}

const shareDocument = (document) => {
  console.log('分享文档:', document)
  // 这里打开分享弹窗
}

const downloadDocument = (document) => {
  console.log('下载文档:', document)
  // 这里实现下载功能
}

const deleteDocument = (document) => {
  if (confirm(`确定要删除"${document.name}"吗？`)) {
    const index = documents.value.findIndex(doc => doc.id === document.id)
    if (index > -1) {
      documents.value.splice(index, 1)
    }
    console.log('删除文档:', document)
  }
}

const openDocument = (document) => {
  if (document.type === 'folder') {
    currentPath.value.push({ id: document.id, name: document.name })
    loadDocuments()
  } else {
    previewDocument(document)
  }
}

const handleUpload = () => {
  console.log('上传文档')
  // 这里打开上传弹窗
}

const handleNewFolder = () => {
  const folderName = prompt('请输入文件夹名称:')
  if (folderName) {
    const newFolder = {
      id: Date.now(),
      name: folderName,
      type: 'folder',
      owner: '当前用户',
      modifiedTime: new Date().toISOString()
    }
    documents.value.push(newFolder)
    console.log('新建文件夹:', newFolder)
  }
}

// 加载数据
const loadDocuments = async () => {
  // 模拟数据
  documents.value = [
    {
      id: 1,
      name: '项目计划书',
      type: 'document',
      fileType: 'pdf',
      size: 2048576,
      owner: '张三',
      modifiedTime: '2024-01-15T10:30:00Z',
      tags: ['重要', '项目'],
      description: '2024年度项目规划文档'
    },
    {
      id: 2,
      name: '会议记录',
      type: 'document',
      fileType: 'docx',
      size: 1024000,
      owner: '李四',
      modifiedTime: '2024-01-14T14:20:00Z',
      tags: ['会议'],
      description: '部门例会记录'
    },
    {
      id: 3,
      name: '工作文档',
      type: 'folder',
      owner: '王五',
      modifiedTime: '2024-01-13T09:15:00Z'
    },
    {
      id: 4,
      name: '财务报表',
      type: 'spreadsheet',
      fileType: 'xlsx',
      size: 5120000,
      owner: '赵六',
      modifiedTime: '2024-01-12T16:45:00Z',
      tags: ['财务', '报表'],
      description: '月度财务报表'
    },
    {
      id: 5,
      name: '产品演示',
      type: 'presentation',
      fileType: 'pptx',
      size: 3072000,
      owner: '张三',
      modifiedTime: '2024-01-11T11:30:00Z',
      tags: ['产品', '演示'],
      description: '产品功能演示'
    }
  ]
}

const loadSidebarData = () => {
  storageUsed.value = 15728640 // 15MB
  storageTotal.value = 1073741824 // 1GB

  quickAccess.value = [
    {
      id: 1,
      name: '项目文档',
      fileType: 'folder',
      path: [{ id: 1, name: '项目文档' }]
    },
    {
      id: 2,
      name: '常用模板',
      fileType: 'folder',
      path: [{ id: 2, name: '常用模板' }]
    },
    {
      id: 3,
      name: '工作计划.pdf',
      fileType: 'pdf',
      path: []
    }
  ]

  recentDocuments.value = [
    {
      id: 1,
      name: '项目计划书',
      fileType: 'pdf',
      modifiedTime: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      name: '会议记录',
      fileType: 'docx',
      modifiedTime: '2024-01-14T14:20:00Z'
    },
    {
      id: 4,
      name: '财务报表',
      fileType: 'xlsx',
      modifiedTime: '2024-01-12T16:45:00Z'
    }
  ]
}

// 生命周期
onMounted(() => {
  loadDocuments()
  loadSidebarData()
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

.document-center {
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

.upload-actions {
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
  padding: 0.5rem;
  min-width: auto;
}

.action-btn.info {
  background: #3498DB;
  color: white;
}

.action-btn.warning {
  background: var(--warning-color);
  color: white;
}

.action-btn.danger {
  background: var(--danger-color);
  color: white;
}

/* 主内容区域 */
.center-main {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.center-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
}

/* 文档列表 */
.document-list-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.list-header {
  padding: 1.5rem;
  border-bottom: 2px solid var(--border-color);
}

.navigation-path {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.path-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--secondary-color);
}

.path-item:hover {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.path-separator {
  color: var(--border-color);
  font-size: 0.75rem;
}

.view-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-toggle {
  display: flex;
  gap: 0.25rem;
}

.view-btn {
  width: 36px;
  height: 36px;
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

.view-btn:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.view-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.sort-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.3s ease;
}

.sort-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

/* 搜索和筛选 */
.search-section {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #7F8C8D;
  z-index: 10;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.filter-controls {
  display: flex;
  gap: 1rem;
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

/* 文档网格 */
.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.document-item {
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
}

.document-item:hover {
  border-color: var(--accent-color);
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.document-item.selected {
  border-color: #3498DB;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.document-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.document-folder-icon {
  font-size: 3rem;
  color: var(--warning-color);
}

.document-file-icon {
  font-size: 2.5rem;
  color: var(--primary-color);
}

.document-item:hover .document-folder-icon {
  color: #D68910;
  transform: scale(1.1);
}

.document-item:hover .document-file-icon {
  color: #1A5276;
  transform: scale(1.1);
}

.document-info {
  flex: 1;
  width: 100%;
}

.document-name {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #7F8C8D;
}

.document-tags {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.tag {
  background: var(--background-color);
  color: var(--secondary-color);
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.625rem;
  font-weight: 600;
}

.document-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  margin-top: 1rem;
}

.document-item:hover .document-actions {
  opacity: 1;
}

/* 文档表格 */
.document-table {
  width: 100%;
  border-collapse: collapse;
}

.documents-table {
  width: 100%;
}

.documents-table th,
.documents-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.documents-table th {
  background: var(--background-color);
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--secondary-color);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-row {
  transition: all 0.2s ease;
  cursor: pointer;
}

.table-row:hover {
  background: rgba(230, 126, 34, 0.05);
}

.table-row.selected {
  background: rgba(52, 152, 219, 0.05);
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.name-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.name-content i {
  font-size: 1.25rem;
  color: var(--primary-color);
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--background-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--border-color);
  margin: 0 auto 1rem;
}

.empty-state h4 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #7F8C8D;
  margin: 0 0 2rem 0;
  font-size: 0.875rem;
}

/* 侧边栏 */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.storage-info,
.quick-access,
.recent-documents {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.sidebar-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--accent-color);
}

.storage-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar {
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-color), #D35400);
  transition: width 0.3s ease;
}

.storage-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--secondary-color);
}

.used {
  font-weight: 600;
  color: var(--accent-color);
}

.quick-list,
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quick-item,
.recent-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-item:hover,
.recent-item:hover {
  background: var(--background-color);
}

.quick-item i,
.recent-item i {
  font-size: 1.25rem;
  color: var(--primary-color);
  width: 24px;
  text-align: center;
}

.quick-item span {
  font-weight: 500;
  color: var(--text-color);
}

.recent-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.recent-details {
  flex: 1;
}

.recent-name {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.875rem;
}

.recent-meta {
  font-size: 0.75rem;
  color: #7F8C8D;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .center-container {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .center-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .center-main {
    padding: 1rem;
  }
  
  .document-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    padding: 1rem;
  }
  
  .search-section {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .filter-controls {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .view-controls {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
}
</style>