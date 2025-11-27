<template>
  <div class="my-task">
    <!-- 工业风格头部区域 -->
    <header class="task-header">
      <div class="header-left">
        <div class="title-section">
          <h1 class="page-title">我的任务</h1>
          <div class="breadcrumb">
            <span class="breadcrumb-item">OA系统</span>
            <i class="fas fa-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-item active">我的任务</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="task-summary">
          <div class="summary-item urgent">
            <span class="summary-value">{{ urgentTasks }}</span>
            <span class="summary-label">紧急</span>
          </div>
          <div class="summary-item pending">
            <span class="summary-value">{{ pendingTasks }}</span>
            <span class="summary-label">待办</span>
          </div>
          <div class="summary-item completed">
            <span class="summary-value">{{ completedTasks }}</span>
            <span class="summary-label">已完成</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="task-main">
      <!-- 任务标签页 -->
      <section class="task-tabs">
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
            <span class="tab-badge">{{ getTabCount(tab.key) }}</span>
          </button>
        </div>
        
        <!-- 筛选和操作区域 -->
        <div class="task-actions">
          <div class="filter-group">
            <div class="search-box">
              <i class="fas fa-search search-icon"></i>
              <input 
                v-model="searchKeyword" 
                type="text" 
                placeholder="搜索任务名称、发起人..."
                class="search-input"
              />
            </div>
            
            <select v-model="priorityFilter" class="filter-select">
              <option value="">全部优先级</option>
              <option value="urgent">紧急</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
            
            <select v-model="typeFilter" class="filter-select">
              <option value="">全部类型</option>
              <option value="approval">审批任务</option>
              <option value="review">审核任务</option>
              <option value="assignment">指派任务</option>
              <option value="notification">通知任务</option>
            </select>
          </div>
          
          <div class="action-buttons">
            <button class="action-btn secondary" @click="handleRefresh">
              <i class="fas fa-sync-alt"></i>
              <span>刷新</span>
            </button>
            <button class="action-btn primary" @click="handleBatchApprove" v-if="selectedTasks.length > 0">
              <i class="fas fa-check-double"></i>
              <span>批量审批 ({{ selectedTasks.length }})</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 任务列表 -->
      <section class="task-list-section">
        <div class="list-container">
          <!-- 待办任务 -->
          <div v-if="activeTab === 'todo'" class="task-grid">
            <div 
              v-for="task in filteredTodoTasks" 
              :key="task.id"
              class="task-card"
              :class="`priority-${task.priority}`"
            >
              <div class="card-header">
                <div class="task-info">
                  <div class="task-type">
                    <i :class="getTaskTypeIcon(task.type)"></i>
                    <span>{{ getTaskTypeLabel(task.type) }}</span>
                  </div>
                  <div class="task-priority" :class="`priority-${task.priority}`">
                    {{ getPriorityLabel(task.priority) }}
                  </div>
                </div>
                <div class="task-actions">
                  <input 
                    type="checkbox" 
                    :id="`select-${task.id}`"
                    v-model="selectedTasks"
                    :value="task.id"
                    class="task-checkbox"
                  />
                  <label :for="`select-${task.id}`" class="checkbox-label"></label>
                </div>
              </div>
              
              <div class="card-content">
                <h3 class="task-title">{{ task.title }}</h3>
                <p class="task-description">{{ task.description }}</p>
                
                <div class="task-metadata">
                  <div class="metadata-item">
                    <i class="fas fa-user"></i>
                    <span>发起人: {{ task.initiator }}</span>
                  </div>
                  <div class="metadata-item">
                    <i class="fas fa-clock"></i>
                    <span>创建时间: {{ formatDate(task.createTime) }}</span>
                  </div>
                  <div class="metadata-item" v-if="task.dueTime">
                    <i class="fas fa-hourglass-end"></i>
                    <span :class="{ 'overdue': isOverdue(task.dueTime) }">
                      截止时间: {{ formatDate(task.dueTime) }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="card-footer">
                <div class="task-progress" v-if="task.progress !== undefined">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: task.progress + '%' }"
                    ></div>
                  </div>
                  <span class="progress-text">{{ task.progress }}%</span>
                </div>
                
                <div class="task-buttons">
                  <button class="task-btn primary" @click="handleApprove(task)">
                    <i class="fas fa-check"></i>
                    <span>批准</span>
                  </button>
                  <button class="task-btn secondary" @click="handleReject(task)">
                    <i class="fas fa-times"></i>
                    <span>拒绝</span>
                  </button>
                  <button class="task-btn info" @click="handleView(task)">
                    <i class="fas fa-eye"></i>
                    <span>查看</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 已办任务 -->
          <div v-if="activeTab === 'done'" class="task-grid">
            <div 
              v-for="task in filteredDoneTasks" 
              :key="task.id"
              class="task-card completed"
            >
              <div class="card-header">
                <div class="task-info">
                  <div class="task-type">
                    <i :class="getTaskTypeIcon(task.type)"></i>
                    <span>{{ getTaskTypeLabel(task.type) }}</span>
                  </div>
                  <div class="task-status" :class="`status-${task.result}`">
                    {{ getTaskResultLabel(task.result) }}
                  </div>
                </div>
              </div>
              
              <div class="card-content">
                <h3 class="task-title">{{ task.title }}</h3>
                <p class="task-description">{{ task.description }}</p>
                
                <div class="task-metadata">
                  <div class="metadata-item">
                    <i class="fas fa-user"></i>
                    <span>发起人: {{ task.initiator }}</span>
                  </div>
                  <div class="metadata-item">
                    <i class="fas fa-check-circle"></i>
                    <span>处理时间: {{ formatDate(task.completeTime) }}</span>
                  </div>
                  <div class="metadata-item">
                    <i class="fas fa-hourglass-half"></i>
                    <span>处理时长: {{ calculateDuration(task.createTime, task.completeTime) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="card-footer">
                <div class="task-buttons">
                  <button class="task-btn info" @click="handleView(task)">
                    <i class="fas fa-eye"></i>
                    <span>查看详情</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 委托任务 -->
          <div v-if="activeTab === 'delegated'" class="task-grid">
            <div 
              v-for="task in filteredDelegatedTasks" 
              :key="task.id"
              class="task-card delegated"
            >
              <div class="card-header">
                <div class="task-info">
                  <div class="task-type">
                    <i :class="getTaskTypeIcon(task.type)"></i>
                    <span>{{ getTaskTypeLabel(task.type) }}</span>
                  </div>
                  <div class="delegate-info">
                    <i class="fas fa-exchange-alt"></i>
                    <span>已委托</span>
                  </div>
                </div>
              </div>
              
              <div class="card-content">
                <h3 class="task-title">{{ task.title }}</h3>
                <p class="task-description">{{ task.description }}</p>
                
                <div class="task-metadata">
                  <div class="metadata-item">
                    <i class="fas fa-user"></i>
                    <span>发起人: {{ task.initiator }}</span>
                  </div>
                  <div class="metadata-item">
                    <i class="fas fa-user-friends"></i>
                    <span>委托给: {{ task.delegatedTo }}</span>
                  </div>
                  <div class="metadata-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>委托时间: {{ formatDate(task.delegateTime) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="card-footer">
                <div class="task-buttons">
                  <button class="task-btn warning" @click="handleCancelDelegate(task)">
                    <i class="fas fa-undo"></i>
                    <span>取消委托</span>
                  </button>
                  <button class="task-btn info" @click="handleView(task)">
                    <i class="fas fa-eye"></i>
                    <span>查看详情</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 任务详情弹窗 -->
    <div v-if="selectedTaskDetail" class="modal-overlay" @click="closeTaskDetail">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">任务详情</h3>
          <button class="modal-close" @click="closeTaskDetail">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="detail-section">
            <h4 class="detail-title">基本信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>任务类型:</label>
                <span>{{ getTaskTypeLabel(selectedTaskDetail.type) }}</span>
              </div>
              <div class="detail-item">
                <label>优先级:</label>
                <span :class="`priority-${selectedTaskDetail.priority}`">
                  {{ getPriorityLabel(selectedTaskDetail.priority) }}
                </span>
              </div>
              <div class="detail-item">
                <label>发起人:</label>
                <span>{{ selectedTaskDetail.initiator }}</span>
              </div>
              <div class="detail-item">
                <label>创建时间:</label>
                <span>{{ formatDate(selectedTaskDetail.createTime) }}</span>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4 class="detail-title">任务内容</h4>
            <div class="task-detail-content">
              <h5>{{ selectedTaskDetail.title }}</h5>
              <p>{{ selectedTaskDetail.description }}</p>
              
              <div v-if="selectedTaskDetail.attachments && selectedTaskDetail.attachments.length > 0" class="attachments">
                <h6>附件:</h6>
                <div class="attachment-list">
                  <div v-for="attachment in selectedTaskDetail.attachments" :key="attachment.id" class="attachment-item">
                    <i class="fas fa-file"></i>
                    <span>{{ attachment.name }}</span>
                    <button class="download-btn" @click="downloadAttachment(attachment)">
                      <i class="fas fa-download"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="detail-section" v-if="selectedTaskDetail.approvalChain">
            <h4 class="detail-title">审批流程</h4>
            <div class="approval-timeline">
              <div 
                v-for="(node, index) in selectedTaskDetail.approvalChain" 
                :key="index"
                class="timeline-node"
                :class="`node-${node.status}`"
              >
                <div class="timeline-marker">
                  <i :class="getNodeStatusIcon(node.status)"></i>
                </div>
                <div class="timeline-content">
                  <div class="node-role">{{ node.role }}</div>
                  <div class="node-user">{{ node.user || '待处理' }}</div>
                  <div class="node-time" v-if="node.time">{{ formatDate(node.time) }}</div>
                  <div class="node-comment" v-if="node.comment">{{ node.comment }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="action-btn secondary" @click="closeTaskDetail">关闭</button>
          <button 
            v-if="selectedTaskDetail.status === 'pending'" 
            class="action-btn primary" 
            @click="handleApprove(selectedTaskDetail)"
          >
            批准
          </button>
          <button 
            v-if="selectedTaskDetail.status === 'pending'" 
            class="action-btn danger" 
            @click="handleReject(selectedTaskDetail)"
          >
            拒绝
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 响应式数据
const tasks = ref([])
const selectedTasks = ref([])
const selectedTaskDetail = ref(null)
const activeTab = ref('todo')
const searchKeyword = ref('')
const priorityFilter = ref('')
const typeFilter = ref('')

// 标签页配置
const tabs = [
  { key: 'todo', label: '待办任务', icon: 'fas fa-clock' },
  { key: 'done', label: '已办任务', icon: 'fas fa-check-circle' },
  { key: 'delegated', label: '委托任务', icon: 'fas fa-exchange-alt' }
]

// 计算属性
const todoTasks = computed(() => 
  tasks.value.filter(task => task.status === 'pending')
)

const doneTasks = computed(() => 
  tasks.value.filter(task => task.status === 'completed')
)

const delegatedTasks = computed(() => 
  tasks.value.filter(task => task.status === 'delegated')
)

// 筛选后的任务
const filteredTodoTasks = computed(() => {
  return filterTasks(todoTasks.value)
})

const filteredDoneTasks = computed(() => {
  return filterTasks(doneTasks.value)
})

const filteredDelegatedTasks = computed(() => {
  return filterTasks(delegatedTasks.value)
})

// 统计数据
const urgentTasks = computed(() => 
  todoTasks.value.filter(task => task.priority === 'urgent').length
)

const pendingTasks = computed(() => 
  todoTasks.value.filter(task => task.priority !== 'urgent').length
)

const completedTasks = computed(() => 
  doneTasks.value.length
)

// 筛选任务函数
const filterTasks = (taskList) => {
  let filtered = taskList

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(task => 
      task.title.toLowerCase().includes(keyword) ||
      task.description.toLowerCase().includes(keyword) ||
      task.initiator.toLowerCase().includes(keyword)
    )
  }

  // 优先级过滤
  if (priorityFilter.value) {
    filtered = filtered.filter(task => task.priority === priorityFilter.value)
  }

  // 类型过滤
  if (typeFilter.value) {
    filtered = filtered.filter(task => task.type === typeFilter.value)
  }

  return filtered
}

// 获取标签页任务数量
const getTabCount = (tabKey) => {
  switch (tabKey) {
    case 'todo':
      return todoTasks.value.length
    case 'done':
      return doneTasks.value.length
    case 'delegated':
      return delegatedTasks.value.length
    default:
      return 0
  }
}

// 获取任务类型图标
const getTaskTypeIcon = (type) => {
  const icons = {
    approval: 'fas fa-user-check',
    review: 'fas fa-file-search',
    assignment: 'fas fa-tasks',
    notification: 'fas fa-bell'
  }
  return icons[type] || 'fas fa-tasks'
}

// 获取任务类型标签
const getTaskTypeLabel = (type) => {
  const labels = {
    approval: '审批任务',
    review: '审核任务',
    assignment: '指派任务',
    notification: '通知任务'
  }
  return labels[type] || '未知任务'
}

// 获取优先级标签
const getPriorityLabel = (priority) => {
  const labels = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return labels[priority] || '普通'
}

// 获取任务结果标签
const getTaskResultLabel = (result) => {
  const labels = {
    approved: '已批准',
    rejected: '已拒绝',
    completed: '已完成'
  }
  return labels[result] || '未知'
}

// 获取节点状态图标
const getNodeStatusIcon = (status) => {
  const icons = {
    pending: 'fas fa-clock',
    approved: 'fas fa-check',
    rejected: 'fas fa-times',
    completed: 'fas fa-check-circle'
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

// 计算时长
const calculateDuration = (startTime, endTime) => {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diff = end - start
  
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  
  if (days > 0) {
    return `${days}天${hours}小时`
  } else if (hours > 0) {
    return `${hours}小时`
  } else {
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
    return `${minutes}分钟`
  }
}

// 检查是否过期
const isOverdue = (dueTime) => {
  return new Date(dueTime) < new Date()
}

// 事件处理
const handleRefresh = () => {
  loadTasks()
}

const handleApprove = (task) => {
  if (confirm(`确定要批准任务"${task.title}"吗？`)) {
    // 调用API批准任务
    task.status = 'completed'
    task.result = 'approved'
    task.completeTime = new Date().toISOString()
    
    // 从选中列表中移除
    const index = selectedTasks.value.indexOf(task.id)
    if (index > -1) {
      selectedTasks.value.splice(index, 1)
    }
    
    console.log('批准任务:', task)
  }
}

const handleReject = (task) => {
  const reason = prompt('请输入拒绝原因：')
  if (reason) {
    task.status = 'completed'
    task.result = 'rejected'
    task.completeTime = new Date().toISOString()
    task.rejectReason = reason
    
    const index = selectedTasks.value.indexOf(task.id)
    if (index > -1) {
      selectedTasks.value.splice(index, 1)
    }
    
    console.log('拒绝任务:', task)
  }
}

const handleBatchApprove = () => {
  if (confirm(`确定要批量审批这 ${selectedTasks.value.length} 个任务吗？`)) {
    selectedTasks.value.forEach(taskId => {
      const task = tasks.value.find(t => t.id === taskId)
      if (task) {
        task.status = 'completed'
        task.result = 'approved'
        task.completeTime = new Date().toISOString()
      }
    })
    
    selectedTasks.value = []
    console.log('批量审批完成')
  }
}

const handleCancelDelegate = (task) => {
  if (confirm(`确定要取消委托任务"${task.title}"吗？`)) {
    task.status = 'pending'
    delete task.delegatedTo
    delete task.delegateTime
    
    console.log('取消委托:', task)
  }
}

const handleView = (task) => {
  selectedTaskDetail.value = task
}

const closeTaskDetail = () => {
  selectedTaskDetail.value = null
}

const downloadAttachment = (attachment) => {
  console.log('下载附件:', attachment)
  // 实现附件下载功能
}

// 加载任务数据
const loadTasks = async () => {
  // 模拟数据
  tasks.value = [
    {
      id: 1,
      type: 'approval',
      title: '采购申请审批',
      description: '请审批办公用品采购申请，总金额5000元',
      status: 'pending',
      priority: 'urgent',
      initiator: '张三',
      createTime: '2024-01-15 09:00:00',
      dueTime: '2024-01-16 18:00:00',
      progress: 0,
      attachments: [
        { id: 1, name: '采购清单.pdf' },
        { id: 2, name: '报价单.xlsx' }
      ],
      approvalChain: [
        { role: '部门经理', user: '李四', status: 'approved', time: '2024-01-15 10:30:00', comment: '同意采购' },
        { role: '财务审批', user: '当前用户', status: 'pending', time: null },
        { role: '总经理审批', user: null, status: 'pending', time: null }
      ]
    },
    {
      id: 2,
      type: 'review',
      title: '项目立项审核',
      description: '新项目可行性报告审核，请仔细查看相关文档',
      status: 'pending',
      priority: 'high',
      initiator: '李四',
      createTime: '2024-01-14 16:00:00',
      dueTime: '2024-01-17 18:00:00',
      progress: 30,
      attachments: [
        { id: 3, name: '项目计划书.docx' }
      ]
    },
    {
      id: 3,
      type: 'assignment',
      title: '月度报告提交',
      description: '请完成本月工作报告并提交',
      status: 'completed',
      priority: 'medium',
      initiator: '王五',
      createTime: '2024-01-10 08:00:00',
      completeTime: '2024-01-12 14:30:00',
      result: 'approved'
    },
    {
      id: 4,
      type: 'approval',
      title: '请假申请审批',
      description: '员工请假申请，事由：家中有急事',
      status: 'delegated',
      priority: 'medium',
      initiator: '赵六',
      createTime: '2024-01-13 09:00:00',
      delegatedTo: '代理审批人',
      delegateTime: '2024-01-13 10:00:00'
    }
  ]
}

// 生命周期
onMounted(() => {
  loadTasks()
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

.my-task {
  font-family: 'Source Sans Pro', sans-serif;
  background: var(--background-color);
  min-height: 100vh;
  color: var(--text-color);
}

/* 头部样式 */
.task-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
}

.task-header::after {
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

.task-summary {
  display: flex;
  gap: 2rem;
}

.summary-item {
  text-align: center;
}

.summary-value {
  display: block;
  font-family: 'Montserrat', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.summary-label {
  display: block;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  font-weight: 600;
  opacity: 0.9;
}

.summary-item.urgent .summary-value {
  color: #E74C3C;
}

.summary-item.pending .summary-value {
  color: #F39C12;
}

.summary-item.completed .summary-value {
  color: #27AE60;
}

/* 主内容区域 */
.task-main {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* 标签页样式 */
.task-tabs {
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
  background: var(--accent-color);
  color: white;
  border-radius: 12px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.tab-btn.active .tab-badge {
  background: var(--primary-color);
}

/* 任务操作区域 */
.task-actions {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-group {
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

.action-buttons {
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

.action-btn.danger {
  background: var(--danger-color);
  color: white;
}

/* 任务列表 */
.task-list-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.task-card {
  border: 2px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
}

.task-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.task-card.priority-urgent {
  border-left: 6px solid var(--danger-color);
}

.task-card.priority-high {
  border-left: 6px solid var(--warning-color);
}

.task-card.priority-medium {
  border-left: 6px solid #3498DB;
}

.task-card.priority-low {
  border-left: 6px solid #95A5A6;
}

.task-card.completed {
  opacity: 0.8;
  background: #f8f9fa;
}

.task-card.delegated {
  opacity: 0.9;
  background: #fef9e7;
}

.card-header {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.task-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.task-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--secondary-color);
  font-weight: 600;
}

.task-priority {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.task-priority.priority-urgent {
  background: rgba(231, 76, 60, 0.1);
  color: var(--danger-color);
}

.task-priority.priority-high {
  background: rgba(243, 156, 18, 0.1);
  color: var(--warning-color);
}

.task-priority.priority-medium {
  background: rgba(52, 152, 219, 0.1);
  color: #3498DB;
}

.task-priority.priority-low {
  background: rgba(149, 165, 166, 0.1);
  color: #95A5A6;
}

.task-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.task-status.status-approved {
  background: rgba(39, 174, 96, 0.1);
  color: var(--success-color);
}

.task-status.status-rejected {
  background: rgba(231, 76, 60, 0.1);
  color: var(--danger-color);
}

.task-status.status-completed {
  background: rgba(52, 152, 219, 0.1);
  color: #3498DB;
}

.delegate-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--warning-color);
  font-weight: 600;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.task-checkbox {
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
}

.task-checkbox:checked + .checkbox-label {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

.task-checkbox:checked + .checkbox-label::after {
  content: '\f00c';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  color: white;
  font-size: 0.75rem;
}

.card-content {
  padding: 1.5rem;
}

.task-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
}

.task-description {
  color: #7F8C8D;
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.task-metadata {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #7F8C8D;
}

.metadata-item.overdue {
  color: var(--danger-color);
  font-weight: 600;
}

.card-footer {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid var(--border-color);
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--success-color), #229954);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--secondary-color);
  min-width: 40px;
}

.task-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.task-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
}

.task-btn.primary {
  background: var(--accent-color);
  color: white;
}

.task-btn.primary:hover {
  background: #D35400;
}

.task-btn.secondary {
  background: var(--secondary-color);
  color: white;
}

.task-btn.secondary:hover {
  background: #2C3E50;
}

.task-btn.info {
  background: #3498DB;
  color: white;
}

.task-btn.info:hover {
  background: #2980B9;
}

.task-btn.warning {
  background: var(--warning-color);
  color: white;
}

.task-btn.warning:hover {
  background: #E67E22;
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

.task-detail-content h5 {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 0.75rem 0;
}

.attachments {
  margin-top: 1rem;
}

.attachments h6 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--secondary-color);
  margin: 0 0 0.5rem 0;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.875rem;
}

.download-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  padding: 0.25rem;
}

.approval-timeline {
  position: relative;
  padding-left: 2rem;
}

.approval-timeline::before {
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

.timeline-node.node-approved .timeline-marker {
  background: var(--success-color);
  color: white;
  border-color: var(--success-color);
}

.timeline-node.node-rejected .timeline-marker {
  background: var(--danger-color);
  color: white;
  border-color: var(--danger-color);
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

.timeline-node.node-approved .timeline-content {
  border-left-color: var(--success-color);
}

.timeline-node.node-rejected .timeline-content {
  border-left-color: var(--danger-color);
}

.node-role {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.node-user {
  font-size: 0.875rem;
  color: var(--secondary-color);
  margin-bottom: 0.25rem;
}

.node-time {
  font-size: 0.75rem;
  color: #7F8C8D;
  margin-bottom: 0.25rem;
}

.node-comment {
  font-size: 0.875rem;
  color: var(--text-color);
  font-style: italic;
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
  .task-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .task-main {
    padding: 1rem;
  }
  
  .task-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .search-input {
    width: 100%;
  }
  
  .task-grid {
    grid-template-columns: 1fr;
  }
}
</style>