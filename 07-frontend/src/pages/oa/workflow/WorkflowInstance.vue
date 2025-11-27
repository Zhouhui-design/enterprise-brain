<template>
  <div class="workflow-instance">
    <!-- 工业风格头部区域 -->
    <header class="instance-header">
      <div class="header-left">
        <div class="title-section">
          <h1 class="page-title">工作流实例管理</h1>
          <div class="breadcrumb">
            <span class="breadcrumb-item">OA系统</span>
            <i class="fas fa-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-item">工作流</span>
            <i class="fas fa-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-item active">流程实例</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <button class="action-btn secondary" @click="handleRefresh">
          <i class="fas fa-sync-alt"></i>
          <span>刷新</span>
        </button>
        <button class="action-btn primary" @click="handleNewInstance">
          <i class="fas fa-plus"></i>
          <span>新建实例</span>
        </button>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="instance-main">
      <!-- 统计概览 -->
      <section class="stats-overview">
        <div class="stats-grid">
          <div class="stat-card total">
            <div class="stat-icon">
              <i class="fas fa-list-alt"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ totalInstances }}</div>
              <div class="stat-label">总实例数</div>
            </div>
          </div>
          
          <div class="stat-card running">
            <div class="stat-icon">
              <i class="fas fa-play-circle"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ runningInstances }}</div>
              <div class="stat-label">进行中</div>
            </div>
          </div>
          
          <div class="stat-card completed">
            <div class="stat-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ completedInstances }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
          
          <div class="stat-card suspended">
            <div class="stat-icon">
              <i class="fas fa-pause-circle"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ suspendedInstances }}</div>
              <div class="stat-label">已挂起</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 筛选和搜索区域 -->
      <section class="filter-section">
        <div class="filter-container">
          <div class="filter-left">
            <div class="search-box">
              <i class="fas fa-search search-icon"></i>
              <input 
                v-model="searchKeyword" 
                type="text" 
                placeholder="搜索实例名称、ID..."
                class="search-input"
              />
            </div>
            
            <div class="filter-group">
              <label class="filter-label">状态筛选</label>
              <select v-model="statusFilter" class="filter-select">
                <option value="">全部状态</option>
                <option value="running">进行中</option>
                <option value="completed">已完成</option>
                <option value="suspended">已挂起</option>
                <option value="terminated">已终止</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label class="filter-label">时间范围</label>
              <select v-model="timeFilter" class="filter-select">
                <option value="">全部时间</option>
                <option value="today">今天</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="quarter">本季度</option>
              </select>
            </div>
          </div>
          
          <div class="filter-right">
            <button class="filter-btn" @click="resetFilters">
              <i class="fas fa-undo"></i>
              <span>重置</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 实例列表 -->
      <section class="instance-list-section">
        <div class="list-container">
          <div class="list-header">
            <h3 class="list-title">工作流实例列表</h3>
            <div class="list-actions">
              <button class="action-btn small" @click="exportData">
                <i class="fas fa-download"></i>
                <span>导出</span>
              </button>
            </div>
          </div>
          
          <div class="instance-grid">
            <div 
              v-for="instance in filteredInstances" 
              :key="instance.id"
              class="instance-card"
              @click="handleView(instance)"
            >
              <div class="card-header">
                <div class="instance-info">
                  <div class="instance-id">{{ instance.id }}</div>
                  <div class="instance-name">{{ instance.name }}</div>
                </div>
                <div class="instance-status" :class="`status-${instance.status}`">
                  <i :class="getStatusIcon(instance.status)"></i>
                  <span>{{ getStatusText(instance.status) }}</span>
                </div>
              </div>
              
              <div class="card-content">
                <div class="info-row">
                  <span class="info-label">
                    <i class="fas fa-user"></i>
                    发起人
                  </span>
                  <span class="info-value">{{ instance.initiator }}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">
                    <i class="fas fa-clock"></i>
                    开始时间
                  </span>
                  <span class="info-value">{{ formatDate(instance.startTime) }}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">
                    <i class="fas fa-hourglass-half"></i>
                    运行时长
                  </span>
                  <span class="info-value">{{ calculateDuration(instance.startTime) }}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">
                    <i class="fas fa-tasks"></i>
                    当前节点
                  </span>
                  <span class="info-value">{{ instance.currentNode || '无' }}</span>
                </div>
              </div>
              
              <div class="card-footer">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: instance.progress + '%' }"
                  ></div>
                </div>
                <div class="progress-text">完成度: {{ instance.progress }}%</div>
                
                <div class="card-actions">
                  <button class="action-btn small primary" @click.stop="handleView(instance)">
                    <i class="fas fa-eye"></i>
                    <span>查看</span>
                  </button>
                  <button 
                    v-if="instance.status === 'running'" 
                    class="action-btn small warning" 
                    @click.stop="handleSuspend(instance)"
                  >
                    <i class="fas fa-pause"></i>
                    <span>挂起</span>
                  </button>
                  <button 
                    v-if="instance.status === 'suspended'" 
                    class="action-btn small success" 
                    @click.stop="handleResume(instance)"
                  >
                    <i class="fas fa-play"></i>
                    <span>恢复</span>
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

    <!-- 实例详情弹窗 -->
    <div v-if="selectedInstance" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">实例详情</h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="detail-section">
            <h4 class="detail-title">基本信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>实例ID:</label>
                <span>{{ selectedInstance.id }}</span>
              </div>
              <div class="detail-item">
                <label>流程名称:</label>
                <span>{{ selectedInstance.name }}</span>
              </div>
              <div class="detail-item">
                <label>发起人:</label>
                <span>{{ selectedInstance.initiator }}</span>
              </div>
              <div class="detail-item">
                <label>状态:</label>
                <span :class="`status-${selectedInstance.status}`">
                  {{ getStatusText(selectedInstance.status) }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4 class="detail-title">执行进度</h4>
            <div class="workflow-timeline">
              <div 
                v-for="(node, index) in selectedInstance.nodes" 
                :key="index"
                class="timeline-node"
                :class="`node-${node.status}`"
              >
                <div class="timeline-marker">
                  <i :class="getNodeStatusIcon(node.status)"></i>
                </div>
                <div class="timeline-content">
                  <div class="node-name">{{ node.name }}</div>
                  <div class="node-time">{{ formatDate(node.timestamp) }}</div>
                  <div class="node-user" v-if="node.user">执行人: {{ node.user }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="action-btn secondary" @click="closeModal">关闭</button>
          <button class="action-btn primary" @click="handlePrint">打印详情</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 响应式数据
const instances = ref([])
const selectedInstance = ref(null)
const searchKeyword = ref('')
const statusFilter = ref('')
const timeFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(12)

// 计算属性
const filteredInstances = computed(() => {
  let filtered = instances.value

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(instance => 
      instance.id.toLowerCase().includes(keyword) ||
      instance.name.toLowerCase().includes(keyword)
    )
  }

  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(instance => instance.status === statusFilter.value)
  }

  // 时间过滤
  if (timeFilter.value) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    filtered = filtered.filter(instance => {
      const startTime = new Date(instance.startTime)
      
      switch (timeFilter.value) {
        case 'today':
          return startTime >= today
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          return startTime >= weekAgo
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          return startTime >= monthAgo
        case 'quarter':
          const quarterAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
          return startTime >= quarterAgo
        default:
          return true
      }
    })
  }

  return filtered
})

// 统计数据
const totalInstances = computed(() => instances.value.length)
const runningInstances = computed(() => 
  instances.value.filter(i => i.status === 'running').length
)
const completedInstances = computed(() => 
  instances.value.filter(i => i.status === 'completed').length
)
const suspendedInstances = computed(() => 
  instances.value.filter(i => i.status === 'suspended').length
)

// 分页计算
const totalPages = computed(() => 
  Math.ceil(filteredInstances.value.length / pageSize.value)
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

// 获取状态图标
const getStatusIcon = (status) => {
  const icons = {
    running: 'fas fa-play-circle',
    completed: 'fas fa-check-circle',
    suspended: 'fas fa-pause-circle',
    terminated: 'fas fa-times-circle'
  }
  return icons[status] || 'fas fa-question-circle'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    running: '进行中',
    completed: '已完成',
    suspended: '已挂起',
    terminated: '已终止'
  }
  return texts[status] || '未知'
}

// 获取节点状态图标
const getNodeStatusIcon = (status) => {
  const icons = {
    pending: 'fas fa-clock',
    running: 'fas fa-spinner fa-spin',
    completed: 'fas fa-check',
    failed: 'fas fa-times'
  }
  return icons[status] || 'fas fa-circle'
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 计算运行时长
const calculateDuration = (startTime) => {
  const start = new Date(startTime)
  const now = new Date()
  const diff = now - start
  
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  
  if (days > 0) {
    return `${days}天${hours}小时`
  } else if (hours > 0) {
    return `${hours}小时`
  } else {
    return '不足1小时'
  }
}

// 事件处理
const handleRefresh = () => {
  loadInstances()
}

const handleNewInstance = () => {
  console.log('新建工作流实例')
  // 跳转到工作流设计器或新建实例页面
}

const handleView = (instance) => {
  selectedInstance.value = instance
}

const handleSuspend = (instance) => {
  if (confirm(`确定要挂起实例 ${instance.id} 吗？`)) {
    // 调用API挂起实例
    instance.status = 'suspended'
  }
}

const handleResume = (instance) => {
  if (confirm(`确定要恢复实例 ${instance.id} 吗？`)) {
    // 调用API恢复实例
    instance.status = 'running'
  }
}

const exportData = () => {
  console.log('导出实例数据')
  // 实现数据导出功能
}

const resetFilters = () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  timeFilter.value = ''
  currentPage.value = 1
}

const closeModal = () => {
  selectedInstance.value = null
}

const handlePrint = () => {
  window.print()
}

// 加载实例数据
const loadInstances = async () => {
  // 模拟数据
  instances.value = [
    {
      id: 'WF202401001',
      name: '采购审批流程',
      status: 'running',
      initiator: '张三',
      startTime: '2024-01-15 09:00:00',
      progress: 65,
      currentNode: '财务审批',
      nodes: [
        { name: '开始', status: 'completed', timestamp: '2024-01-15 09:00:00', user: '系统' },
        { name: '部门审批', status: 'completed', timestamp: '2024-01-15 10:30:00', user: '李四' },
        { name: '财务审批', status: 'running', timestamp: '2024-01-15 14:00:00', user: '王五' },
        { name: '总经理审批', status: 'pending', timestamp: null, user: null }
      ]
    },
    {
      id: 'WF202401002',
      name: '请假审批流程',
      status: 'completed',
      initiator: '李四',
      startTime: '2024-01-14 08:30:00',
      progress: 100,
      currentNode: '已完成',
      nodes: [
        { name: '开始', status: 'completed', timestamp: '2024-01-14 08:30:00', user: '系统' },
        { name: '直属主管审批', status: 'completed', timestamp: '2024-01-14 09:15:00', user: '张三' },
        { name: '结束', status: 'completed', timestamp: '2024-01-14 09:30:00', user: '系统' }
      ]
    },
    {
      id: 'WF202401003',
      name: '报销审批流程',
      status: 'suspended',
      initiator: '王五',
      startTime: '2024-01-13 16:00:00',
      progress: 40,
      currentNode: '财务审核',
      nodes: [
        { name: '开始', status: 'completed', timestamp: '2024-01-13 16:00:00', user: '系统' },
        { name: '财务审核', status: 'pending', timestamp: null, user: null }
      ]
    }
  ]
}

// 生命周期
onMounted(() => {
  loadInstances()
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

.workflow-instance {
  font-family: 'Source Sans Pro', sans-serif;
  background: var(--background-color);
  min-height: 100vh;
  color: var(--text-color);
}

/* 头部样式 */
.instance-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
}

.instance-header::after {
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

.header-right {
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

.action-btn.success {
  background: var(--success-color);
  color: white;
}

.action-btn.warning {
  background: var(--warning-color);
  color: white;
}

/* 主内容区域 */
.instance-main {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* 统计概览 */
.stats-overview {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-left: 4px solid var(--primary-color);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-card.total {
  border-left-color: #3498DB;
}

.stat-card.running {
  border-left-color: var(--success-color);
}

.stat-card.completed {
  border-left-color: var(--success-color);
}

.stat-card.suspended {
  border-left-color: var(--warning-color);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #3498DB, #2980B9);
}

.stat-card.running .stat-icon {
  background: linear-gradient(135deg, var(--success-color), #229954);
}

.stat-card.completed .stat-icon {
  background: linear-gradient(135deg, #27AE60, #1E8449);
}

.stat-card.suspended .stat-icon {
  background: linear-gradient(135deg, var(--warning-color), #E67E22);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-family: 'Montserrat', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #7F8C8D;
  margin-top: 0.25rem;
  font-weight: 600;
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

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: 2px solid var(--border-color);
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.filter-btn:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

/* 实例列表 */
.instance-list-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-color);
}

.list-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
}

.instance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.instance-card {
  border: 2px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  background: white;
}

.instance-card:hover {
  border-color: var(--accent-color);
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-header {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-color);
}

.instance-info {
  flex: 1;
}

.instance-id {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  color: #7F8C8D;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.instance-name {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-color);
  margin-top: 0.25rem;
}

.instance-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-running {
  background: rgba(39, 174, 96, 0.1);
  color: var(--success-color);
}

.status-completed {
  background: rgba(52, 152, 219, 0.1);
  color: #3498DB;
}

.status-suspended {
  background: rgba(243, 156, 18, 0.1);
  color: var(--warning-color);
}

.status-terminated {
  background: rgba(231, 76, 60, 0.1);
  color: var(--danger-color);
}

.card-content {
  padding: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #7F8C8D;
  font-weight: 500;
}

.info-value {
  color: var(--primary-color);
  font-weight: 600;
}

.card-footer {
  padding: 1rem;
  background: #f8f9fa;
  border-top: 1px solid var(--border-color);
}

.progress-bar {
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--success-color), #229954);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #7F8C8D;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
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

.detail-section {
  margin-bottom: 2rem;
}

.detail-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--accent-color);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item label {
  font-size: 0.875rem;
  color: #7F8C8D;
  font-weight: 600;
}

.detail-item span {
  font-size: 0.875rem;
  color: var(--text-color);
  font-weight: 500;
}

.workflow-timeline {
  position: relative;
  padding-left: 2rem;
}

.workflow-timeline::before {
  content: '';
  position: absolute;
  left: 1rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--border-color);
}

.timeline-node {
  position: relative;
  margin-bottom: 1.5rem;
}

.timeline-marker {
  position: absolute;
  left: -2rem;
  top: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 2px solid var(--border-color);
  font-size: 0.875rem;
}

.timeline-node.node-completed .timeline-marker {
  background: var(--success-color);
  color: white;
  border-color: var(--success-color);
}

.timeline-node.node-running .timeline-marker {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.timeline-node.node-pending .timeline-marker {
  background: #e9ecef;
  color: #7F8C8D;
}

.timeline-content {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 3px solid var(--border-color);
}

.timeline-node.node-completed .timeline-content {
  border-left-color: var(--success-color);
}

.timeline-node.node-running .timeline-content {
  border-left-color: var(--accent-color);
}

.node-name {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.node-time {
  font-size: 0.75rem;
  color: #7F8C8D;
  margin-bottom: 0.25rem;
}

.node-user {
  font-size: 0.75rem;
  color: var(--secondary-color);
  font-weight: 600;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 2px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .instance-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .instance-main {
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
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
  
  .instance-grid {
    grid-template-columns: 1fr;
  }
}
</style>